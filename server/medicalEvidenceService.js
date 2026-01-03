/**
 * Medical Evidence and Citation Service
 * Provides evidence-based recommendations with citations for clinical decision support
 */

// Medical Evidence Database - Key clinical guidelines and references
const medicalEvidence = {
  // ==================== Cardiology ====================
  'acute-coronary-syndrome': {
    guideline: 'ACC/AHA Guidelines for Management of Acute Coronary Syndromes',
    year: 2023,
    source: 'Journal of the American College of Cardiology',
    recommendations: [
      {
        recommendation: 'Aspirin 162-325mg loading dose followed by 81mg daily',
        level: 'Class I, Level A',
        citation: 'Lawton JS, et al. 2021 ACC/AHA/SCAI Guideline for Coronary Artery Revascularization. J Am Coll Cardiol. 2022;79(2):e21-e129.'
      },
      {
        recommendation: 'P2Y12 inhibitor (clopidogrel, ticagrelor, or prasugrel) in addition to aspirin for DAPT',
        level: 'Class I, Level A',
        citation: 'Levine GN, et al. 2016 ACC/AHA Guideline Focused Update on Duration of DAPT. Circulation. 2016;134:e123-e155.'
      },
      {
        recommendation: 'Anticoagulation with heparin, LMWH, or bivalirudin',
        level: 'Class I, Level B',
        citation: 'Amsterdam EA, et al. 2014 AHA/ACC Guideline for NSTE-ACS. Circulation. 2014;130:e344-e426.'
      }
    ]
  },

  'heart-failure': {
    guideline: 'ACC/AHA/HFSA Guideline for Management of Heart Failure',
    year: 2022,
    source: 'Circulation',
    recommendations: [
      {
        recommendation: 'ACE inhibitor or ARNi (sacubitril/valsartan) for HFrEF',
        level: 'Class I, Level A',
        citation: 'Heidenreich PA, et al. 2022 AHA/ACC/HFSA Guideline for Heart Failure. Circulation. 2022;145:e895-e1032.'
      },
      {
        recommendation: 'Beta-blocker (carvedilol, metoprolol succinate, or bisoprolol) for HFrEF',
        level: 'Class I, Level A',
        citation: 'Heidenreich PA, et al. 2022 AHA/ACC/HFSA Heart Failure Guidelines. Circulation. 2022;145:e895-e1032.'
      },
      {
        recommendation: 'SGLT2 inhibitor (dapagliflozin or empagliflozin) for HFrEF',
        level: 'Class I, Level A',
        citation: 'McMurray JJV, et al. Dapagliflozin in Heart Failure with Reduced Ejection Fraction. N Engl J Med. 2019;381:1995-2008.'
      },
      {
        recommendation: 'Loop diuretics for volume overload',
        level: 'Class I, Level B',
        citation: 'Felker GM, et al. Diuretic Strategies in Acute Decompensated Heart Failure. N Engl J Med. 2011;364:797-805.'
      }
    ]
  },

  'atrial-fibrillation': {
    guideline: 'ACC/AHA/ACCP/HRS Guideline for AF',
    year: 2023,
    source: 'Circulation',
    recommendations: [
      {
        recommendation: 'Anticoagulation for CHA2DS2-VASc ≥2 in men or ≥3 in women',
        level: 'Class I, Level A',
        citation: 'Joglar JA, et al. 2023 ACC/AHA/ACCP/HRS Guideline for AF. Circulation. 2024;149:e1-e156.'
      },
      {
        recommendation: 'DOACs preferred over warfarin for eligible patients',
        level: 'Class I, Level A',
        citation: 'Granger CB, et al. Apixaban versus Warfarin in AF. N Engl J Med. 2011;365:981-992.'
      },
      {
        recommendation: 'Rate control with beta-blockers or calcium channel blockers',
        level: 'Class I, Level B',
        citation: 'Van Gelder IC, et al. Lenient versus Strict Rate Control in AF. N Engl J Med. 2010;362:1363-1373.'
      }
    ]
  },

  // ==================== Pulmonology ====================
  'community-acquired-pneumonia': {
    guideline: 'IDSA/ATS Guidelines for CAP',
    year: 2019,
    source: 'American Journal of Respiratory and Critical Care Medicine',
    recommendations: [
      {
        recommendation: 'Respiratory fluoroquinolone OR beta-lactam + macrolide for outpatients with comorbidities',
        level: 'Strong, Moderate',
        citation: 'Metlay JP, et al. Diagnosis and Treatment of Adults with CAP. Am J Respir Crit Care Med. 2019;200:e45-e67.'
      },
      {
        recommendation: 'Beta-lactam + macrolide OR respiratory fluoroquinolone for inpatients non-severe',
        level: 'Strong, High',
        citation: 'Metlay JP, et al. Diagnosis and Treatment of Adults with CAP. Am J Respir Crit Care Med. 2019;200:e45-e67.'
      },
      {
        recommendation: 'Beta-lactam + macrolide + respiratory fluoroquinolone for severe CAP',
        level: 'Strong, Moderate',
        citation: 'Metlay JP, et al. ATS/IDSA CAP Guidelines. Am J Respir Crit Care Med. 2019;200:e45-e67.'
      },
      {
        recommendation: 'MRSA coverage if risk factors present',
        level: 'Conditional, Low',
        citation: 'Metlay JP, et al. ATS/IDSA CAP Guidelines. Am J Respir Crit Care Med. 2019;200:e45-e67.'
      }
    ]
  },

  'copd-exacerbation': {
    guideline: 'GOLD Guidelines for COPD',
    year: 2024,
    source: 'Global Initiative for Chronic Obstructive Lung Disease',
    recommendations: [
      {
        recommendation: 'Bronchodilators (SABA +/- SAMA) as first-line',
        level: 'Grade A',
        citation: 'Global Initiative for COPD (GOLD). Global Strategy for Diagnosis, Management, Prevention of COPD. 2024.'
      },
      {
        recommendation: 'Systemic corticosteroids (prednisone 40mg daily x 5 days)',
        level: 'Grade A',
        citation: 'Leuppi JD, et al. Short-term vs Conventional Glucocorticoid Therapy in AECOPD. JAMA. 2013;309:2223-2231.'
      },
      {
        recommendation: 'Antibiotics if increased dyspnea, sputum volume, or purulence',
        level: 'Grade B',
        citation: 'Vollenweider DJ, et al. Antibiotics for AECOPD. Cochrane Database Syst Rev. 2018;10:CD010257.'
      }
    ]
  },

  'pulmonary-embolism': {
    guideline: 'ESC Guidelines for Pulmonary Embolism',
    year: 2019,
    source: 'European Heart Journal',
    recommendations: [
      {
        recommendation: 'Anticoagulation with DOAC or LMWH/fondaparinux bridged to VKA',
        level: 'Class I, Level A',
        citation: 'Konstantinides SV, et al. 2019 ESC Guidelines for PE. Eur Heart J. 2020;41:543-603.'
      },
      {
        recommendation: 'Risk stratification with PESI or sPESI',
        level: 'Class I, Level B',
        citation: 'Konstantinides SV, et al. 2019 ESC Guidelines for PE. Eur Heart J. 2020;41:543-603.'
      },
      {
        recommendation: 'Thrombolysis for hemodynamically unstable PE',
        level: 'Class I, Level B',
        citation: 'Meyer G, et al. Fibrinolysis for Intermediate-Risk PE. N Engl J Med. 2014;370:1402-1411.'
      }
    ]
  },

  // ==================== Infectious Disease ====================
  'sepsis': {
    guideline: 'Surviving Sepsis Campaign Guidelines',
    year: 2021,
    source: 'Critical Care Medicine / Intensive Care Medicine',
    recommendations: [
      {
        recommendation: 'Crystalloid fluid resuscitation 30 mL/kg within first 3 hours for sepsis-induced hypoperfusion',
        level: 'Strong, Low',
        citation: 'Evans L, et al. Surviving Sepsis Campaign 2021 Guidelines. Crit Care Med. 2021;49:e1063-e1143.'
      },
      {
        recommendation: 'Broad-spectrum antibiotics within 1 hour of sepsis recognition',
        level: 'Strong, Low',
        citation: 'Evans L, et al. Surviving Sepsis Campaign 2021 Guidelines. Crit Care Med. 2021;49:e1063-e1143.'
      },
      {
        recommendation: 'Norepinephrine as first-line vasopressor for septic shock',
        level: 'Strong, High',
        citation: 'De Backer D, et al. Comparison of Dopamine and Norepinephrine in Septic Shock. N Engl J Med. 2010;362:779-789.'
      },
      {
        recommendation: 'Lactate-guided resuscitation',
        level: 'Weak, Low',
        citation: 'Jansen TC, et al. Early Lactate-Guided Therapy in ICU. Am J Respir Crit Care Med. 2010;182:752-761.'
      }
    ]
  },

  'urinary-tract-infection': {
    guideline: 'IDSA Guidelines for UTI',
    year: 2011,
    source: 'Clinical Infectious Diseases',
    recommendations: [
      {
        recommendation: 'Nitrofurantoin 100mg BID x 5 days for uncomplicated cystitis',
        level: 'A-I',
        citation: 'Gupta K, et al. IDSA Guidelines for Acute Uncomplicated UTI. Clin Infect Dis. 2011;52:e103-e120.'
      },
      {
        recommendation: 'TMP-SMX 160/800mg BID x 3 days if local resistance <20%',
        level: 'A-I',
        citation: 'Gupta K, et al. IDSA Guidelines for Acute Uncomplicated UTI. Clin Infect Dis. 2011;52:e103-e120.'
      },
      {
        recommendation: 'Fluoroquinolone x 5-7 days for pyelonephritis',
        level: 'A-I',
        citation: 'Gupta K, et al. IDSA Guidelines for Acute Uncomplicated UTI. Clin Infect Dis. 2011;52:e103-e120.'
      }
    ]
  },

  'cellulitis': {
    guideline: 'IDSA Guidelines for Skin and Soft Tissue Infections',
    year: 2014,
    source: 'Clinical Infectious Diseases',
    recommendations: [
      {
        recommendation: 'Cephalexin or dicloxacillin for non-purulent cellulitis',
        level: 'A-II',
        citation: 'Stevens DL, et al. IDSA Guidelines for SSTI. Clin Infect Dis. 2014;59:e10-e52.'
      },
      {
        recommendation: 'TMP-SMX or doxycycline for purulent cellulitis (MRSA coverage)',
        level: 'A-I',
        citation: 'Stevens DL, et al. IDSA Guidelines for SSTI. Clin Infect Dis. 2014;59:e10-e52.'
      },
      {
        recommendation: 'IV vancomycin for severe infections requiring hospitalization',
        level: 'A-II',
        citation: 'Stevens DL, et al. IDSA Guidelines for SSTI. Clin Infect Dis. 2014;59:e10-e52.'
      }
    ]
  },

  // ==================== Gastroenterology ====================
  'gi-bleeding': {
    guideline: 'ACG Guidelines for Upper GI Bleeding',
    year: 2021,
    source: 'American Journal of Gastroenterology',
    recommendations: [
      {
        recommendation: 'IV PPI therapy (high-dose bolus + infusion) for high-risk ulcers',
        level: 'Strong, High',
        citation: 'Laine L, et al. ACG Guideline Upper GI Bleeding. Am J Gastroenterol. 2021;116:899-917.'
      },
      {
        recommendation: 'EGD within 24 hours for most patients',
        level: 'Conditional, Low',
        citation: 'Laine L, et al. ACG Guideline Upper GI Bleeding. Am J Gastroenterol. 2021;116:899-917.'
      },
      {
        recommendation: 'Restrictive transfusion (Hgb <7 g/dL) in stable patients',
        level: 'Strong, Moderate',
        citation: 'Villanueva C, et al. Transfusion Strategies in Acute Upper GI Bleeding. N Engl J Med. 2013;368:11-21.'
      }
    ]
  },

  'acute-pancreatitis': {
    guideline: 'ACG Guidelines for Acute Pancreatitis',
    year: 2024,
    source: 'American Journal of Gastroenterology',
    recommendations: [
      {
        recommendation: 'Aggressive IV fluid resuscitation with Lactated Ringers',
        level: 'Strong, Moderate',
        citation: 'Tenner S, et al. ACG Guideline Acute Pancreatitis. Am J Gastroenterol. 2024;119:419-437.'
      },
      {
        recommendation: 'Early oral feeding when tolerated',
        level: 'Strong, Moderate',
        citation: 'Tenner S, et al. ACG Guideline Acute Pancreatitis. Am J Gastroenterol. 2024;119:419-437.'
      },
      {
        recommendation: 'ERCP within 24 hours for cholangitis',
        level: 'Strong, Moderate',
        citation: 'Tenner S, et al. ACG Guideline Acute Pancreatitis. Am J Gastroenterol. 2024;119:419-437.'
      }
    ]
  },

  // ==================== Nephrology ====================
  'acute-kidney-injury': {
    guideline: 'KDIGO Guidelines for Acute Kidney Injury',
    year: 2012,
    source: 'Kidney International Supplements',
    recommendations: [
      {
        recommendation: 'Volume resuscitation with crystalloids for prerenal AKI',
        level: 'Grade 1A',
        citation: 'KDIGO AKI Work Group. KDIGO Clinical Practice Guideline for AKI. Kidney Int Suppl. 2012;2:1-138.'
      },
      {
        recommendation: 'Discontinue nephrotoxic medications when possible',
        level: 'Grade 1C',
        citation: 'KDIGO AKI Work Group. KDIGO Clinical Practice Guideline for AKI. Kidney Int Suppl. 2012;2:1-138.'
      },
      {
        recommendation: 'RRT initiation based on clinical indications, not creatinine alone',
        level: 'Grade 2B',
        citation: 'KDIGO AKI Work Group. KDIGO Clinical Practice Guideline for AKI. Kidney Int Suppl. 2012;2:1-138.'
      }
    ]
  },

  // ==================== Endocrinology ====================
  'diabetic-ketoacidosis': {
    guideline: 'ADA Standards of Care - DKA Management',
    year: 2024,
    source: 'Diabetes Care',
    recommendations: [
      {
        recommendation: 'IV insulin 0.1 units/kg/hr after initial fluid resuscitation',
        level: 'Grade A',
        citation: 'American Diabetes Association. Standards of Medical Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1):S231-S243.'
      },
      {
        recommendation: 'IV fluids: NS initially, then 0.45% NS when glucose <200',
        level: 'Grade A',
        citation: 'Kitabchi AE, et al. Hyperglycemic Crises in DM. Diabetes Care. 2009;32:1335-1343.'
      },
      {
        recommendation: 'Add dextrose to IV fluids when glucose <200 mg/dL',
        level: 'Grade A',
        citation: 'Kitabchi AE, et al. Hyperglycemic Crises in DM. Diabetes Care. 2009;32:1335-1343.'
      },
      {
        recommendation: 'Potassium replacement if K <5.2 mEq/L',
        level: 'Grade A',
        citation: 'Kitabchi AE, et al. Hyperglycemic Crises in DM. Diabetes Care. 2009;32:1335-1343.'
      }
    ]
  },

  'hypoglycemia': {
    guideline: 'ADA Standards of Care - Hypoglycemia',
    year: 2024,
    source: 'Diabetes Care',
    recommendations: [
      {
        recommendation: '15-20g fast-acting glucose for conscious patients',
        level: 'Grade A',
        citation: 'American Diabetes Association. Standards of Medical Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1).'
      },
      {
        recommendation: 'IV dextrose or IM glucagon for severe hypoglycemia',
        level: 'Grade A',
        citation: 'American Diabetes Association. Standards of Medical Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1).'
      }
    ]
  },

  // ==================== Hematology ====================
  'deep-vein-thrombosis': {
    guideline: 'ASH Guidelines for VTE Treatment',
    year: 2020,
    source: 'Blood Advances',
    recommendations: [
      {
        recommendation: 'DOAC preferred over VKA for non-cancer DVT',
        level: 'Strong',
        citation: 'Ortel TL, et al. ASH Guidelines for VTE Treatment. Blood Adv. 2020;4:4693-4738.'
      },
      {
        recommendation: 'At least 3 months of anticoagulation for provoked DVT',
        level: 'Strong',
        citation: 'Ortel TL, et al. ASH Guidelines for VTE Treatment. Blood Adv. 2020;4:4693-4738.'
      },
      {
        recommendation: 'Extended anticoagulation for unprovoked DVT with low bleeding risk',
        level: 'Conditional',
        citation: 'Kearon C, et al. Antithrombotic Therapy for VTE. Chest. 2016;149:315-352.'
      }
    ]
  },

  // ==================== Neurology ====================
  'acute-ischemic-stroke': {
    guideline: 'AHA/ASA Guidelines for Acute Ischemic Stroke',
    year: 2019,
    source: 'Stroke',
    recommendations: [
      {
        recommendation: 'IV alteplase within 4.5 hours of symptom onset if eligible',
        level: 'Class I, Level A',
        citation: 'Powers WJ, et al. AHA/ASA Acute Ischemic Stroke Guidelines. Stroke. 2019;50:e344-e418.'
      },
      {
        recommendation: 'Mechanical thrombectomy within 24 hours for LVO with salvageable tissue',
        level: 'Class I, Level A',
        citation: 'Powers WJ, et al. AHA/ASA Acute Ischemic Stroke Guidelines. Stroke. 2019;50:e344-e418.'
      },
      {
        recommendation: 'Aspirin within 24-48 hours of stroke onset',
        level: 'Class I, Level A',
        citation: 'Powers WJ, et al. AHA/ASA Acute Ischemic Stroke Guidelines. Stroke. 2019;50:e344-e418.'
      }
    ]
  },

  // ==================== General Medicine ====================
  'hypertensive-emergency': {
    guideline: 'ACC/AHA Guidelines for Hypertension',
    year: 2017,
    source: 'Journal of the American College of Cardiology',
    recommendations: [
      {
        recommendation: 'IV antihypertensive for hypertensive emergency with target organ damage',
        level: 'Class I, Level C',
        citation: 'Whelton PK, et al. 2017 ACC/AHA Hypertension Guideline. J Am Coll Cardiol. 2018;71:e127-e248.'
      },
      {
        recommendation: 'Reduce BP by no more than 25% in first hour',
        level: 'Class I, Level C',
        citation: 'Whelton PK, et al. 2017 ACC/AHA Hypertension Guideline. J Am Coll Cardiol. 2018;71:e127-e248.'
      },
      {
        recommendation: 'Goal 160/100-110 over next 2-6 hours',
        level: 'Class I, Level C',
        citation: 'Whelton PK, et al. 2017 ACC/AHA Hypertension Guideline. J Am Coll Cardiol. 2018;71:e127-e248.'
      }
    ]
  },

  'alcohol-withdrawal': {
    guideline: 'ASAM Clinical Practice Guideline on Alcohol Withdrawal',
    year: 2020,
    source: 'Journal of Addiction Medicine',
    recommendations: [
      {
        recommendation: 'Benzodiazepines as first-line treatment',
        level: 'Strong',
        citation: 'ASAM Clinical Practice Guideline on Alcohol Withdrawal Management. J Addict Med. 2020;14:1-72.'
      },
      {
        recommendation: 'CIWA-Ar protocol for symptom-triggered dosing',
        level: 'Strong',
        citation: 'ASAM Clinical Practice Guideline on Alcohol Withdrawal Management. J Addict Med. 2020;14:1-72.'
      },
      {
        recommendation: 'Thiamine supplementation (high-dose IV if Wernicke suspected)',
        level: 'Strong',
        citation: 'ASAM Clinical Practice Guideline on Alcohol Withdrawal Management. J Addict Med. 2020;14:1-72.'
      }
    ]
  }
};

// Condition keywords to evidence mapping
const conditionKeywords = {
  'acute-coronary-syndrome': ['acs', 'nstemi', 'stemi', 'mi', 'myocardial infarction', 'unstable angina', 'chest pain', 'troponin'],
  'heart-failure': ['chf', 'heart failure', 'hfref', 'hfpef', 'ef', 'ejection fraction', 'bnp', 'volume overload', 'dyspnea', 'edema'],
  'atrial-fibrillation': ['afib', 'atrial fibrillation', 'a-fib', 'af', 'irregular rhythm', 'rvr'],
  'community-acquired-pneumonia': ['cap', 'pneumonia', 'infiltrate', 'consolidation', 'respiratory infection'],
  'copd-exacerbation': ['copd', 'chronic obstructive', 'aecopd', 'copd exacerbation', 'emphysema', 'chronic bronchitis'],
  'pulmonary-embolism': ['pe', 'pulmonary embolism', 'dvt', 'vte', 'd-dimer', 'wells score'],
  'sepsis': ['sepsis', 'septic', 'sirs', 'infection', 'lactate', 'bacteremia', 'qsofa'],
  'urinary-tract-infection': ['uti', 'urinary tract infection', 'pyelonephritis', 'cystitis', 'pyuria'],
  'cellulitis': ['cellulitis', 'skin infection', 'soft tissue infection', 'erythema', 'abscess'],
  'gi-bleeding': ['gi bleed', 'upper gi', 'ugib', 'melena', 'hematemesis', 'coffee ground', 'hematochezia'],
  'acute-pancreatitis': ['pancreatitis', 'lipase', 'amylase', 'epigastric pain'],
  'acute-kidney-injury': ['aki', 'acute kidney injury', 'renal failure', 'creatinine', 'oliguria'],
  'diabetic-ketoacidosis': ['dka', 'ketoacidosis', 'ketones', 'anion gap', 'hyperglycemia'],
  'hypoglycemia': ['hypoglycemia', 'low glucose', 'low blood sugar'],
  'deep-vein-thrombosis': ['dvt', 'deep vein thrombosis', 'leg swelling', 'venous thrombosis'],
  'acute-ischemic-stroke': ['stroke', 'cva', 'tia', 'ischemic stroke', 'weakness', 'aphasia', 'nihss'],
  'hypertensive-emergency': ['hypertensive emergency', 'hypertensive urgency', 'malignant hypertension', 'bp crisis'],
  'alcohol-withdrawal': ['alcohol withdrawal', 'dts', 'delirium tremens', 'ciwa', 'etoh withdrawal']
};

/**
 * Find relevant medical evidence based on clinical content
 * @param {string} clinicalContent - Clinical scenario, diagnoses, or assessment
 * @returns {Array} - Array of relevant evidence objects with citations
 */
function findRelevantEvidence(clinicalContent) {
  if (!clinicalContent) return [];

  const contentLower = clinicalContent.toLowerCase();
  const relevantEvidence = [];
  const matchedConditions = new Set();

  // Search through condition keywords
  for (const [condition, keywords] of Object.entries(conditionKeywords)) {
    for (const keyword of keywords) {
      if (contentLower.includes(keyword) && !matchedConditions.has(condition)) {
        const evidence = medicalEvidence[condition];
        if (evidence) {
          matchedConditions.add(condition);
          relevantEvidence.push({
            condition: condition.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            guideline: evidence.guideline,
            year: evidence.year,
            source: evidence.source,
            recommendations: evidence.recommendations
          });
        }
        break;
      }
    }
  }

  return relevantEvidence;
}

/**
 * Get evidence for a specific condition
 * @param {string} condition - Condition name (e.g., 'sepsis', 'heart-failure')
 * @returns {Object|null} - Evidence object or null if not found
 */
function getEvidenceByCondition(condition) {
  const normalizedCondition = condition.toLowerCase().replace(/\s+/g, '-');
  return medicalEvidence[normalizedCondition] || null;
}

/**
 * Get all available conditions with evidence
 * @returns {Array} - Array of condition names
 */
function getAllConditions() {
  return Object.keys(medicalEvidence).map(key =>
    key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );
}

/**
 * Format evidence for clinical note inclusion
 * @param {Array} evidence - Array of evidence objects
 * @returns {string} - Formatted evidence text
 */
function formatEvidenceForNote(evidence) {
  if (!evidence || evidence.length === 0) return '';

  let formatted = '\n\nEVIDENCE-BASED REFERENCES:\n';

  evidence.forEach((ev, index) => {
    formatted += `\n${index + 1}. ${ev.guideline} (${ev.year})\n`;
    formatted += `   Source: ${ev.source}\n`;
    ev.recommendations.forEach((rec, recIndex) => {
      formatted += `   ${String.fromCharCode(97 + recIndex)}) ${rec.recommendation} [${rec.level}]\n`;
      formatted += `      Citation: ${rec.citation}\n`;
    });
  });

  return formatted;
}

/**
 * Generate evidence-based assessment prompt enhancement
 * @param {Array} evidence - Relevant evidence for the case
 * @returns {string} - Prompt enhancement for AI
 */
function generateEvidencePromptEnhancement(evidence) {
  if (!evidence || evidence.length === 0) return '';

  let prompt = `\n\nINCLUDE THE FOLLOWING EVIDENCE-BASED RECOMMENDATIONS WITH CITATIONS IN YOUR ASSESSMENT AND PLAN:\n\n`;

  evidence.forEach((ev) => {
    prompt += `For ${ev.condition}:\n`;
    prompt += `Guideline: ${ev.guideline} (${ev.year})\n`;
    ev.recommendations.forEach((rec) => {
      prompt += `- ${rec.recommendation} [${rec.level}]\n`;
      prompt += `  Citation: ${rec.citation}\n`;
    });
    prompt += '\n';
  });

  prompt += `\nIMPORTANT: Include specific citations in your Assessment and Plan sections. Format citations as [Author et al., Year] or reference the guideline directly.`;

  return prompt;
}

// Export all functions
export {
  findRelevantEvidence,
  getEvidenceByCondition,
  getAllConditions,
  formatEvidenceForNote,
  generateEvidencePromptEnhancement,
  medicalEvidence,
  conditionKeywords
};
