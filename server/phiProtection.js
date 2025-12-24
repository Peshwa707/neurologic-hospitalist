/**
 * PHI (Protected Health Information) Detection and Redaction Module
 *
 * HIPAA Safe Harbor Method: Removes all 18 identifiers specified in 45 CFR §164.514(b)(2)
 *
 * This module provides automatic detection and redaction of PHI from clinical text
 * to help ensure HIPAA compliance when sending data to third-party AI services.
 */

// 18 HIPAA Identifiers per Safe Harbor Method
const PHI_PATTERNS = {
  // 1. Names (including patient, relatives, employers)
  names: {
    // Common name patterns - these are examples, real implementation needs NER
    pattern: /\b([A-Z][a-z]+ [A-Z][a-z]+|Dr\. [A-Z][a-z]+|[A-Z]\. [A-Z][a-z]+)\b/g,
    replacement: '[NAME]',
    category: 'Names'
  },

  // 2. Geographic subdivisions smaller than state (street address, city, county, zip)
  streetAddress: {
    pattern: /\d+\s+[A-Za-z0-9\s,]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Place|Pl|Parkway|Pkwy|Suite|Ste|Apt|Apartment|Unit|#)\b/gi,
    replacement: '[ADDRESS]',
    category: 'Geographic Location'
  },

  zipCode: {
    // ZIP codes (except first 3 digits if population > 20,000)
    pattern: /\b\d{5}(-\d{4})?\b/g,
    replacement: '[ZIP]',
    category: 'Geographic Location'
  },

  // 3. Dates (except year) related to the individual
  datesFull: {
    // MM/DD/YYYY, DD/MM/YYYY formats
    pattern: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4}|\d{2})\b/g,
    replacement: '[DATE]',
    category: 'Dates'
  },

  datesText: {
    // Month DD, YYYY or DD Month YYYY
    pattern: /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[,\s]+\d{1,2}[,\s]+\d{4}\b/gi,
    replacement: '[DATE]',
    category: 'Dates'
  },

  // 4. Telephone numbers
  phoneNumbers: {
    pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: '[PHONE]',
    category: 'Telephone'
  },

  // 5. Fax numbers
  faxNumbers: {
    pattern: /\b(fax|facsimile)[\s:]*(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi,
    replacement: 'fax: [FAX]',
    category: 'Fax'
  },

  // 6. Email addresses
  emailAddresses: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL]',
    category: 'Email'
  },

  // 7. Social Security Numbers
  ssn: {
    pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    replacement: '[SSN]',
    category: 'SSN'
  },

  // 8. Medical Record Numbers
  mrn: {
    pattern: /\b(MRN|medical record number|patient id|patient number)[\s:#]*([A-Z0-9\-]+)\b/gi,
    replacement: (match) => match.split(/[\s:#]+/)[0] + ': [MRN]',
    category: 'MRN'
  },

  // 9. Health Plan Beneficiary Numbers
  healthPlanNumbers: {
    pattern: /\b(member id|member number|policy number|subscriber id|plan id)[\s:#]*([A-Z0-9\-]+)\b/gi,
    replacement: (match) => match.split(/[\s:#]+/)[0] + ': [HEALTH_PLAN_ID]',
    category: 'Health Plan ID'
  },

  // 10. Account Numbers
  accountNumbers: {
    pattern: /\b(account|acct)[\s#:]*([A-Z0-9\-]+)\b/gi,
    replacement: 'account: [ACCOUNT_NUM]',
    category: 'Account Number'
  },

  // 11. Certificate/License Numbers
  licenseNumbers: {
    pattern: /\b(license|certificate|registration)[\s#:]*([A-Z0-9\-]+)\b/gi,
    replacement: (match) => match.split(/[\s:#]+/)[0] + ': [LICENSE]',
    category: 'License Number'
  },

  // 12. Vehicle Identifiers and Serial Numbers (including license plates)
  vehicleIdentifiers: {
    pattern: /\b(license plate|plate number|vin)[\s:#]*([A-Z0-9\-]+)\b/gi,
    replacement: (match) => match.split(/[\s:#]+/)[0] + ': [VEHICLE_ID]',
    category: 'Vehicle Identifier'
  },

  // 13. Device Identifiers and Serial Numbers
  deviceIdentifiers: {
    pattern: /\b(serial|device id|device number)[\s:#]*([A-Z0-9\-]+)\b/gi,
    replacement: (match) => match.split(/[\s:#]+/)[0] + ': [DEVICE_ID]',
    category: 'Device Identifier'
  },

  // 14. URLs
  urls: {
    pattern: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    replacement: '[URL]',
    category: 'URL'
  },

  // 15. IP Addresses
  ipAddresses: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP_ADDRESS]',
    category: 'IP Address'
  },

  // 16. Biometric Identifiers (fingerprints, voiceprints, retina/iris images, etc.)
  // Note: These are typically not in text form, but we include keywords
  biometricKeywords: {
    pattern: /\b(fingerprint|voiceprint|retinal scan|iris scan|facial recognition|biometric)\s+(?:id|identifier|data)[\s:#]*([A-Z0-9\-]+)\b/gi,
    replacement: 'biometric: [BIOMETRIC_ID]',
    category: 'Biometric Identifier'
  },

  // 17. Full-face photographs and comparable images
  // Note: Handled separately for image analysis - flag presence in text
  photographReferences: {
    pattern: /\b(photograph|photo|image|picture)\s+(?:of|showing)\s+(?:patient|face|facial)/gi,
    replacement: '[PHOTO_REFERENCE]',
    category: 'Photograph Reference'
  },

  // 18. Any other unique identifying number, characteristic, or code
  // Generic patterns for IDs
  genericIds: {
    pattern: /\b(patient|subject|participant)[\s]+(?:id|identifier|number|#)[\s:#]*([A-Z0-9\-]+)\b/gi,
    replacement: (match) => match.split(/[\s:#]+/).slice(0, 2).join(' ') + ': [ID]',
    category: 'Generic Identifier'
  }
};

// Age > 89 must be redacted or aggregated to "90 or older"
const AGE_PATTERN = {
  ageOver89: {
    pattern: /\b(age[d]?|y[\/-]?o|years old|year old)[\s:]*([9]\d|[1-9]\d{2,})\b/gi,
    replacement: (match, prefix) => {
      const ageMatch = match.match(/\d+/);
      if (ageMatch && parseInt(ageMatch[0]) > 89) {
        return prefix + ': 90+';
      }
      return match;
    },
    category: 'Age'
  }
};

/**
 * Detects PHI in text and returns detected items
 * @param {string} text - Text to analyze for PHI
 * @returns {Array} Array of detected PHI items with type and location
 */
function detectPHI(text) {
  if (!text || typeof text !== 'string') return [];

  const detected = [];

  // Check all patterns
  Object.entries({ ...PHI_PATTERNS, ...AGE_PATTERN }).forEach(([key, config]) => {
    const matches = text.matchAll(config.pattern);
    for (const match of matches) {
      detected.push({
        type: key,
        category: config.category,
        text: match[0],
        index: match.index,
        length: match[0].length
      });
    }
  });

  return detected.sort((a, b) => a.index - b.index);
}

/**
 * Redacts PHI from text using Safe Harbor method
 * @param {string} text - Text to redact
 * @param {Object} options - Redaction options
 * @returns {Object} Redacted text and metadata
 */
function redactPHI(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return {
      redactedText: text,
      phiDetected: false,
      itemsRedacted: 0,
      categories: []
    };
  }

  const {
    preserveYears = false,  // Whether to preserve years in dates
    preserveAgeUnder90 = true,  // Whether to preserve ages < 90
    customPatterns = []  // Additional custom patterns
  } = options;

  let redactedText = text;
  const detectedItems = detectPHI(text);
  const categoriesSet = new Set();

  // Apply redactions (process in reverse order to maintain indices)
  const sortedDetections = [...detectedItems].reverse();

  sortedDetections.forEach(item => {
    const config = PHI_PATTERNS[item.type] || AGE_PATTERN[item.type];
    if (!config) return;

    const before = redactedText.substring(0, item.index);
    const after = redactedText.substring(item.index + item.length);

    let replacement;
    if (typeof config.replacement === 'function') {
      replacement = config.replacement(item.text);
    } else {
      replacement = config.replacement;
    }

    redactedText = before + replacement + after;
    categoriesSet.add(item.category);
  });

  // Apply custom patterns
  customPatterns.forEach(({ pattern, replacement }) => {
    redactedText = redactedText.replace(pattern, replacement);
  });

  return {
    redactedText,
    phiDetected: detectedItems.length > 0,
    itemsRedacted: detectedItems.length,
    categories: Array.from(categoriesSet),
    detectedItems: detectedItems.map(item => ({
      type: item.type,
      category: item.category
    }))
  };
}

/**
 * Sanitizes image metadata that might contain PHI
 * @param {string} base64Image - Base64 encoded image
 * @returns {Object} Sanitization result
 */
function sanitizeImageMetadata(base64Image) {
  // Note: This is a basic check. Full DICOM metadata stripping requires specialized libraries

  if (!base64Image || typeof base64Image !== 'string') {
    return {
      warning: 'Invalid image data',
      safe: false
    };
  }

  const warnings = [];

  // Check for DICOM headers (DICOM images may contain embedded PHI)
  if (base64Image.includes('DICM') || base64Image.toLowerCase().includes('dicom')) {
    warnings.push('Image appears to be DICOM format which may contain embedded PHI in metadata');
  }

  // Check for EXIF data indicators
  if (base64Image.includes('Exif')) {
    warnings.push('Image contains EXIF metadata which should be stripped');
  }

  return {
    warnings,
    safe: warnings.length === 0,
    recommendation: warnings.length > 0
      ? 'Consider using DICOM/EXIF stripping tools before upload'
      : 'No obvious metadata PHI detected'
  };
}

/**
 * Generates audit log entry for PHI access
 * @param {Object} context - Context of PHI access
 * @returns {Object} Audit log entry
 */
function generateAuditLog(context) {
  return {
    timestamp: new Date().toISOString(),
    action: context.action || 'PHI_ACCESS',
    endpoint: context.endpoint,
    phiDetected: context.phiDetected,
    itemsRedacted: context.itemsRedacted,
    categories: context.categories || [],
    userId: context.userId || 'anonymous',
    sessionId: context.sessionId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  };
}

/**
 * Validates HIPAA compliance requirements
 * @param {Object} config - Application configuration
 * @returns {Object} Compliance check results
 */
function validateHIPAACompliance(config) {
  const issues = [];
  const warnings = [];

  // Check for BAA with Anthropic
  if (!config.baaAcknowledged) {
    issues.push('Business Associate Agreement (BAA) with Anthropic not acknowledged');
  }

  // Check for HTTPS
  if (!config.httpsEnforced) {
    issues.push('HTTPS not enforced - transmission security at risk');
  }

  // Check for audit logging
  if (!config.auditLoggingEnabled) {
    warnings.push('Audit logging not enabled - HIPAA requires audit controls');
  }

  // Check for access controls
  if (!config.accessControlsEnabled) {
    warnings.push('Access controls not implemented - HIPAA requires access controls');
  }

  // Check for encryption at rest
  if (!config.encryptionAtRest) {
    warnings.push('Data encryption at rest not configured');
  }

  // Check for data retention policy
  if (!config.dataRetentionPolicy) {
    warnings.push('Data retention policy not defined');
  }

  return {
    compliant: issues.length === 0,
    issues,
    warnings,
    recommendation: issues.length > 0
      ? 'Critical HIPAA compliance issues must be addressed before processing PHI'
      : warnings.length > 0
        ? 'Address warnings to improve HIPAA compliance posture'
        : 'Basic HIPAA compliance checks passed'
  };
}

/**
 * Comprehensive PHI protection wrapper for API calls
 * @param {Object} data - Data to process
 * @param {Object} options - Processing options
 * @returns {Object} Processed data with PHI protection applied
 */
function protectPHI(data, options = {}) {
  const results = {
    protected: {},
    auditLog: null,
    warnings: []
  };

  // Redact clinical context
  if (data.clinicalContext) {
    const redactionResult = redactPHI(data.clinicalContext, options);
    results.protected.clinicalContext = redactionResult.redactedText;
    results.warnings.push(...(redactionResult.phiDetected
      ? [`Redacted ${redactionResult.itemsRedacted} PHI items from clinical context`]
      : []));
  }

  // Redact transcript
  if (data.transcript) {
    const redactionResult = redactPHI(data.transcript, options);
    results.protected.transcript = redactionResult.redactedText;
    results.warnings.push(...(redactionResult.phiDetected
      ? [`Redacted ${redactionResult.itemsRedacted} PHI items from transcript`]
      : []));
  }

  // Redact clinical question
  if (data.clinicalQuestion) {
    const redactionResult = redactPHI(data.clinicalQuestion, options);
    results.protected.clinicalQuestion = redactionResult.redactedText;
  }

  // Check image metadata
  if (data.image) {
    const imageCheck = sanitizeImageMetadata(data.image);
    if (!imageCheck.safe) {
      results.warnings.push(...imageCheck.warnings);
    }
    results.protected.image = data.image; // Pass through but log warnings
  }

  // Preserve non-PHI fields
  Object.keys(data).forEach(key => {
    if (!results.protected[key]) {
      results.protected[key] = data[key];
    }
  });

  // Generate audit log
  results.auditLog = generateAuditLog({
    action: 'PHI_REDACTION',
    endpoint: options.endpoint,
    phiDetected: results.warnings.length > 0,
    categories: [],
    ...options.auditContext
  });

  return results;
}

export {
  detectPHI,
  redactPHI,
  sanitizeImageMetadata,
  generateAuditLog,
  validateHIPAACompliance,
  protectPHI,
  PHI_PATTERNS
};
