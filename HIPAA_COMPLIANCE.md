# HIPAA Compliance Guide
# NeuroLogic Hospitalist Assistant

**Last Updated:** December 2024
**Application Version:** 1.0.0

## ⚠️ CRITICAL NOTICE

This application processes **Protected Health Information (PHI)** and must be used in compliance with the Health Insurance Portability and Accountability Act (HIPAA). Improper use may result in HIPAA violations, legal liability, and significant penalties.

---

## Table of Contents

1. [Overview](#overview)
2. [HIPAA Requirements](#hipaa-requirements)
3. [PHI Protection Features](#phi-protection-features)
4. [Business Associate Agreement](#business-associate-agreement)
5. [Technical Safeguards](#technical-safeguards)
6. [Administrative Safeguards](#administrative-safeguards)
7. [Audit Controls](#audit-controls)
8. [User Responsibilities](#user-responsibilities)
9. [Implementation Checklist](#implementation-checklist)
10. [Incident Response](#incident-response)

---

## Overview

NeuroLogic Hospitalist Assistant is a clinical decision support application that uses Anthropic's Claude AI to analyze clinical data, including:
- Clinical notes and dictation
- EKG images
- Medical imaging (X-rays, CT scans, MRI)
- Patient history and context

**PHI Transmission:** This application sends clinical data to Anthropic's API for AI processing. Under HIPAA, this makes Anthropic a **Business Associate** requiring a formal Business Associate Agreement (BAA).

---

## HIPAA Requirements

### What is HIPAA?

The Health Insurance Portability and Accountability Act (HIPAA) establishes national standards for protecting individually identifiable health information (**Protected Health Information** or **PHI**).

### Who Must Comply?

- **Covered Entities:** Healthcare providers, health plans, healthcare clearinghouses
- **Business Associates:** Third parties that handle PHI on behalf of covered entities
- **This Application:** Acts as both a covered entity tool AND requires BA relationship with Anthropic

### 18 HIPAA Identifiers

HIPAA's Safe Harbor method requires removal of 18 identifiers:

1. Names (patient, relatives, employers, household members)
2. Geographic subdivisions smaller than state (street address, city, county, zip code*)
3. Dates (except year) directly related to individual
4. Telephone numbers
5. Fax numbers
6. Email addresses
7. Social Security Numbers
8. Medical Record Numbers (MRN)
9. Health Plan Beneficiary Numbers
10. Account Numbers
11. Certificate/License Numbers
12. Vehicle Identifiers and Serial Numbers (including license plates)
13. Device Identifiers and Serial Numbers
14. Web URLs
15. IP Addresses
16. Biometric Identifiers (fingerprints, voiceprints, retina/iris images, etc.)
17. Full-face photographs and comparable images
18. Any other unique identifying number, characteristic, or code

*Note: First 3 digits of ZIP code can be retained if population > 20,000

---

## PHI Protection Features

### Automatic PHI Redaction

The application includes a comprehensive PHI detection and redaction module (`phiProtection.js`) that automatically:

#### Detection Capabilities
- **Pattern Matching:** Regex patterns for all 18 HIPAA identifiers
- **Contextual Analysis:** Identifies PHI based on context (e.g., "MRN: 12345")
- **Age Protection:** Automatically converts ages > 89 to "90+"

#### Redaction Process
1. **Pre-Processing:** All text input is scanned before API transmission
2. **Pattern Replacement:** PHI is replaced with generic tokens ([NAME], [DATE], [MRN], etc.)
3. **Image Warning:** Metadata warnings for DICOM/EXIF data in medical images
4. **Audit Logging:** All redaction events are logged with categories

#### What Gets Redacted

```javascript
// Example Input:
"Patient John Doe, MRN 123456, DOB 01/15/1950, called from 555-123-4567..."

// Example Output:
"Patient [NAME], MRN [MRN], DOB [DATE], called from [PHONE]..."
```

### Configuration Options

Set environment variables in your `.env` file:

```bash
# PHI Protection (default: enabled)
PHI_REDACTION_ENABLED=true

# Require user consent (default: true)
REQUIRE_PHI_CONSENT=true

# Audit logging (recommended: true)
AUDIT_LOGGING_ENABLED=true

# BAA Acknowledgment (set to true if you have Anthropic BAA)
ANTHROPIC_BAA_ACKNOWLEDGED=false

# Data retention policy (days)
DATA_RETENTION_DAYS=0
```

### Limitations

⚠️ **Important Limitations:**

1. **Not 100% Accurate:** Automated PHI detection cannot guarantee 100% accuracy
2. **Manual Review Required:** Critical data should be manually de-identified
3. **Image Metadata:** Cannot automatically strip DICOM/EXIF metadata from images
4. **Clinical Judgment:** Users must apply clinical judgment and verify redaction
5. **Names Detection:** Generic name patterns may not catch all variants

**Best Practice:** Use minimum necessary PHI and manually de-identify whenever possible.

---

## Business Associate Agreement

### What is a BAA?

A **Business Associate Agreement** is a written contract between a covered entity and a business associate that specifies:
- The permitted and required uses of PHI
- The BA's obligations to safeguard PHI
- Breach notification requirements
- Liability and indemnification

### Anthropic BAA Requirement

**⚠️ CRITICAL:** This application uses Anthropic's Claude API. Before processing ANY PHI:

1. **Verify BAA Requirement:** Anthropic requires an enterprise BAA for PHI processing
2. **Contact Anthropic:** Reach out to Anthropic's sales team to establish a BAA
3. **Signed Agreement:** Obtain a fully executed BAA before production use
4. **Configure Application:** Set `ANTHROPIC_BAA_ACKNOWLEDGED=true` only after BAA is signed

### Without a BAA

If you do NOT have a BAA with Anthropic:
- ❌ **DO NOT** use this application with real patient data
- ❌ **DO NOT** upload images with patient identifiers
- ❌ **DO NOT** include actual PHI in any form
- ✅ **DO** use synthetic/de-identified test data only
- ✅ **DO** contact Anthropic to establish a BAA

### Anthropic BAA Information

- **Website:** https://www.anthropic.com/legal/business-associate-agreement
- **Contact:** https://www.anthropic.com/contact-sales
- **Requirements:** Enterprise/business tier typically required

---

## Technical Safeguards

### 1. Access Controls

**Current Implementation:**
- Session-based consent tracking
- No permanent PHI storage
- Runtime API key configuration

**TODO (Organization Responsibility):**
- [ ] Implement user authentication
- [ ] Role-based access control (RBAC)
- [ ] Automatic logoff after inactivity
- [ ] Emergency access procedures

### 2. Audit Controls

**Current Implementation:**
- PHI redaction logging
- Consent acknowledgment logging
- API usage logging with timestamps
- IP address and user agent tracking

**Log Format:**
```json
{
  "timestamp": "2024-12-24T10:30:00.000Z",
  "action": "PHI_REDACTION",
  "endpoint": "/api/analyze-ekg",
  "phiDetected": true,
  "itemsRedacted": 5,
  "categories": ["Names", "Dates", "MRN"],
  "userId": "anonymous",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**TODO (Organization Responsibility):**
- [ ] Centralized audit log storage
- [ ] Regular audit log review (recommended: quarterly)
- [ ] Audit log retention policy (recommended: 6 years)
- [ ] Audit trail protection from modification

### 3. Integrity Controls

**Current Implementation:**
- Input validation
- JSON parsing with error handling
- HTTPS enforcement (production)

**TODO (Organization Responsibility):**
- [ ] Data integrity monitoring
- [ ] Corruption detection mechanisms
- [ ] Version control and change logging

### 4. Transmission Security

**Current Implementation:**
- HTTPS for all API communications
- Anthropic API uses TLS 1.2+
- Base64 encoding for image data

**TODO (Organization Responsibility):**
- [ ] VPN for remote access
- [ ] Network segmentation
- [ ] Encryption of data at rest (if storing data)

---

## Administrative Safeguards

### 1. Security Management Process

**Required:**
- [ ] Conduct risk analysis
- [ ] Implement risk management plan
- [ ] Establish sanction policy for violations
- [ ] Review information system activity regularly

### 2. Workforce Security

**Required:**
- [ ] Implement authorization procedures
- [ ] Workforce clearance procedures
- [ ] Termination procedures (access revocation)

### 3. Information Access Management

**Required:**
- [ ] Isolate healthcare clearinghouse functions (if applicable)
- [ ] Implement access authorization policies
- [ ] Access establishment and modification procedures

### 4. Security Awareness and Training

**Required for All Users:**
- [ ] HIPAA Security Rule training
- [ ] Application-specific PHI protection training
- [ ] Password management training
- [ ] Phishing and malware awareness
- [ ] Incident reporting procedures

**Training Frequency:** At least annually, and upon hire

### 5. Security Incident Procedures

**Required:**
- [ ] Identify and respond to suspected/known security incidents
- [ ] Mitigate harmful effects
- [ ] Document security incidents and outcomes

### 6. Contingency Plan

**Required:**
- [ ] Data backup plan
- [ ] Disaster recovery plan
- [ ] Emergency mode operation plan
- [ ] Testing and revision procedures

### 7. Business Associate Contracts

**Required:**
- [ ] Written BAA with Anthropic (CRITICAL)
- [ ] Written BAAs with any other service providers handling PHI

---

## Audit Controls

### What Gets Logged?

1. **PHI Redaction Events**
   - Timestamp
   - Endpoint accessed
   - Number of items redacted
   - PHI categories detected
   - User identifier (if authenticated)

2. **User Consent**
   - Consent acknowledgment timestamp
   - User identifier
   - IP address
   - Session information

3. **API Access**
   - All API calls processing PHI
   - Request/response metadata (no PHI in logs)
   - Error conditions

4. **Configuration Changes**
   - API key updates
   - Settings modifications
   - Admin actions

### Log Retention

**Recommended:** 6 years (HIPAA requirement)

**Current Implementation:** Console logging only (not persistent)

**TODO:** Implement persistent audit log storage with:
- Secure, tamper-evident storage
- Regular backups
- Access controls on audit logs
- Automated log analysis

### Reviewing Audit Logs

**Frequency:** At least quarterly

**Review Items:**
- Unusual access patterns
- Large volumes of PHI redactions
- Failed authentication attempts
- Unauthorized access attempts
- System errors and exceptions

---

## User Responsibilities

### Before Using This Application

- [ ] **Verify BAA:** Confirm your organization has a signed BAA with Anthropic
- [ ] **Complete Training:** Complete HIPAA and application-specific training
- [ ] **Understand Limitations:** Review PHI protection limitations
- [ ] **Acknowledge Consent:** Read and acknowledge the HIPAA notice in the application

### During Use

- [ ] **Minimum Necessary:** Only include PHI that is absolutely necessary
- [ ] **Manual De-identification:** Manually remove PHI when possible
- [ ] **Verify Redaction:** Check console logs to confirm PHI redaction is working
- [ ] **No Patient Photos:** Do not upload images with patient faces or visible identifiers
- [ ] **Strip Metadata:** Ensure medical images have DICOM/EXIF metadata removed
- [ ] **Clinical Verification:** Never rely solely on AI output - always verify with clinical judgment
- [ ] **Report Issues:** Immediately report any suspected PHI breaches or system issues

### After Use

- [ ] **Clear Session:** Close browser to clear session data
- [ ] **Secure Workstation:** Lock computer when stepping away
- [ ] **No Screenshots:** Do not take screenshots containing PHI unless necessary and secured

### Prohibited Activities

- ❌ **DO NOT** share API keys or login credentials
- ❌ **DO NOT** use personal devices without authorization
- ❌ **DO NOT** access PHI for personal reasons
- ❌ **DO NOT** copy PHI to unauthorized locations
- ❌ **DO NOT** use application without proper training
- ❌ **DO NOT** bypass security controls

---

## Implementation Checklist

### Pre-Deployment (Organization)

- [ ] Complete organizational risk analysis
- [ ] Establish HIPAA policies and procedures
- [ ] Obtain Business Associate Agreement with Anthropic
- [ ] Configure environment variables properly
- [ ] Set up secure hosting infrastructure
- [ ] Implement user authentication system
- [ ] Configure audit log storage and retention
- [ ] Establish incident response procedures
- [ ] Conduct security testing and penetration testing

### User Onboarding

- [ ] Provide HIPAA training
- [ ] Provide application-specific training
- [ ] Review and sign confidentiality agreements
- [ ] Assign unique user identifiers
- [ ] Grant appropriate access levels
- [ ] Document training completion

### Ongoing Maintenance

- [ ] Regular security updates and patches
- [ ] Quarterly audit log reviews
- [ ] Annual risk assessments
- [ ] Annual HIPAA training refreshers
- [ ] BAA renewal (typically annual)
- [ ] Incident response drills
- [ ] Backup and disaster recovery testing

---

## Incident Response

### What is a PHI Breach?

A breach is an impermissible use or disclosure that compromises the security or privacy of PHI, such as:
- Unauthorized access to PHI
- PHI sent to wrong recipient
- Lost/stolen devices containing unencrypted PHI
- Hacking or malware incidents
- Improper disposal of PHI

### Immediate Actions

If you suspect a PHI breach:

1. **STOP** - Immediately stop the activity that may be causing the breach
2. **CONTAIN** - Take steps to contain the breach (e.g., shut down system, revoke access)
3. **DOCUMENT** - Write down what happened, when, who, what PHI was involved
4. **REPORT** - Immediately report to:
   - Your HIPAA Security Officer
   - Your IT Security team
   - Your supervisor

### Do NOT:

- ❌ Try to "fix" it yourself
- ❌ Delete logs or evidence
- ❌ Wait to report (time is critical)
- ❌ Assume it's not a breach

### Breach Notification Requirements

**HHS Breach Notification Rule:**

- **< 500 individuals:** Report to HHS annually
- **≥ 500 individuals:** Report to HHS within 60 days
- **Notify affected individuals** within 60 days
- **Media notification** if ≥ 500 individuals in same jurisdiction

### Organization Responsibilities

After breach notification:

1. **Investigation:** Determine cause, scope, and affected individuals
2. **Mitigation:** Take steps to mitigate harm
3. **Correction:** Implement corrective measures to prevent recurrence
4. **Documentation:** Maintain comprehensive breach documentation
5. **Sanctions:** Apply appropriate sanctions to responsible individuals

---

## Additional Resources

### HIPAA Regulations

- **HHS HIPAA Homepage:** https://www.hhs.gov/hipaa
- **Security Rule:** https://www.hhs.gov/hipaa/for-professionals/security
- **Privacy Rule:** https://www.hhs.gov/hipaa/for-professionals/privacy
- **Breach Notification Rule:** https://www.hhs.gov/hipaa/for-professionals/breach-notification

### Anthropic Resources

- **BAA Information:** https://www.anthropic.com/legal/business-associate-agreement
- **Security Practices:** https://www.anthropic.com/security
- **Contact Sales:** https://www.anthropic.com/contact-sales

### HIPAA Penalties

| Violation Category | Minimum Penalty | Maximum Penalty (per violation) |
|-------------------|----------------|--------------------------------|
| Unknowing | $100 | $50,000 |
| Reasonable Cause | $1,000 | $50,000 |
| Willful Neglect (corrected) | $10,000 | $50,000 |
| Willful Neglect (not corrected) | $50,000 | $1,750,000 (annual cap) |

**Criminal Penalties:** Up to 10 years imprisonment and $250,000 in fines

---

## Disclaimer

This document provides guidance on HIPAA compliance for this specific application. It does not constitute legal advice. Organizations using this application are responsible for:

- Ensuring full HIPAA compliance
- Consulting with legal counsel
- Implementing appropriate safeguards
- Training workforce members
- Maintaining Business Associate Agreements
- Following all applicable federal and state laws

**This application is a tool to assist with HIPAA compliance, not a guarantee of compliance.**

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2024-12-24 | System | Initial documentation |

---

## Contact

For questions about this application's HIPAA compliance features:
- Review this documentation
- Check the application README.md
- Consult your organization's HIPAA Security Officer
- Contact your legal counsel for legal advice

---

**Remember: When in doubt about PHI, leave it out!**
