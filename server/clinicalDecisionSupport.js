/**
 * Clinical Decision Support Engine
 * Evidence-based clinical guidelines and decision support tools
 */

// Clinical Calculators
export const clinicalCalculators = {

  /**
   * CURB-65 Score for Pneumonia Severity
   * Predicts mortality in community-acquired pneumonia
   */
  curb65: (params) => {
    const { confusion, urea, respiratoryRate, bloodPressure, age } = params;
    let score = 0;
    let components = [];

    if (confusion) {
      score += 1;
      components.push('Confusion present');
    }
    if (urea > 19 || urea > 7) { // BUN >19 mg/dL or Urea >7 mmol/L
      score += 1;
      components.push('Elevated urea/BUN');
    }
    if (respiratoryRate >= 30) {
      score += 1;
      components.push('Respiratory rate ≥30');
    }
    if (bloodPressure?.systolic < 90 || bloodPressure?.diastolic <= 60) {
      score += 1;
      components.push('Low blood pressure');
    }
    if (age >= 65) {
      score += 1;
      components.push('Age ≥65');
    }

    let risk = '';
    let recommendation = '';

    if (score <= 1) {
      risk = 'Low (1.5% mortality)';
      recommendation = 'Consider outpatient treatment';
    } else if (score === 2) {
      risk = 'Moderate (9.2% mortality)';
      recommendation = 'Consider short inpatient stay or supervised outpatient';
    } else if (score >= 3) {
      risk = 'High (22% mortality)';
      recommendation = 'Hospitalization recommended, consider ICU if score 4-5';
    }

    return {
      score,
      maxScore: 5,
      components,
      risk,
      recommendation,
      interpretation: `CURB-65 score of ${score}/5 indicates ${risk.toLowerCase()} risk.`
    };
  },

  /**
   * CHADS2-VASc Score for Stroke Risk in Atrial Fibrillation
   */
  chads2vasc: (params) => {
    const { chf, hypertension, age, diabetes, stroke, vascular, sex } = params;
    let score = 0;
    let components = [];

    if (chf) {
      score += 1;
      components.push('CHF/LV dysfunction (+1)');
    }
    if (hypertension) {
      score += 1;
      components.push('Hypertension (+1)');
    }
    if (age >= 75) {
      score += 2;
      components.push('Age ≥75 (+2)');
    } else if (age >= 65) {
      score += 1;
      components.push('Age 65-74 (+1)');
    }
    if (diabetes) {
      score += 1;
      components.push('Diabetes (+1)');
    }
    if (stroke) {
      score += 2;
      components.push('Prior stroke/TIA/thromboembolism (+2)');
    }
    if (vascular) {
      score += 1;
      components.push('Vascular disease (+1)');
    }
    if (sex === 'female') {
      score += 1;
      components.push('Female sex (+1)');
    }

    let recommendation = '';
    let annualStrokeRisk = '';

    if (score === 0) {
      annualStrokeRisk = '0%';
      recommendation = 'No anticoagulation recommended (consider aspirin)';
    } else if (score === 1) {
      annualStrokeRisk = '1.3%';
      recommendation = 'Consider anticoagulation vs aspirin based on bleeding risk';
    } else if (score === 2) {
      annualStrokeRisk = '2.2%';
      recommendation = 'Anticoagulation recommended';
    } else if (score >= 3) {
      annualStrokeRisk = score === 3 ? '3.2%' : score === 4 ? '4.0%' : score === 5 ? '6.7%' : '9.8%';
      recommendation = 'Anticoagulation strongly recommended';
    }

    return {
      score,
      maxScore: 9,
      components,
      annualStrokeRisk,
      recommendation,
      interpretation: `CHA2DS2-VASc score of ${score} correlates with ${annualStrokeRisk} annual stroke risk.`
    };
  },

  /**
   * Wells Score for DVT
   */
  wellsDVT: (params) => {
    const {
      activeCancer,
      paralysisOrImmobilization,
      recentBedrest,
      localizedTenderness,
      entireLegSwollen,
      calfSwelling,
      pittingEdema,
      collateralVeins,
      previousDVT,
      alternativeDiagnosis
    } = params;

    let score = 0;
    let components = [];

    if (activeCancer) {
      score += 1;
      components.push('Active cancer (+1)');
    }
    if (paralysisOrImmobilization) {
      score += 1;
      components.push('Paralysis/immobilization (+1)');
    }
    if (recentBedrest) {
      score += 1;
      components.push('Recent bedrest >3 days or surgery (+1)');
    }
    if (localizedTenderness) {
      score += 1;
      components.push('Localized tenderness (+1)');
    }
    if (entireLegSwollen) {
      score += 1;
      components.push('Entire leg swollen (+1)');
    }
    if (calfSwelling) {
      score += 1;
      components.push('Calf swelling >3cm (+1)');
    }
    if (pittingEdema) {
      score += 1;
      components.push('Pitting edema (+1)');
    }
    if (collateralVeins) {
      score += 1;
      components.push('Collateral veins (+1)');
    }
    if (previousDVT) {
      score += 1;
      components.push('Previous DVT (+1)');
    }
    if (alternativeDiagnosis) {
      score -= 2;
      components.push('Alternative diagnosis likely (-2)');
    }

    let risk = '';
    let dvtProbability = '';
    let recommendation = '';

    if (score <= 0) {
      risk = 'Low';
      dvtProbability = '5%';
      recommendation = 'D-dimer test. If negative, DVT excluded.';
    } else if (score <= 2) {
      risk = 'Moderate';
      dvtProbability = '17%';
      recommendation = 'D-dimer test. If positive or high clinical suspicion, perform ultrasound.';
    } else {
      risk = 'High';
      dvtProbability = '53%';
      recommendation = 'Ultrasound recommended. Consider empiric anticoagulation if delay in imaging.';
    }

    return {
      score,
      components,
      risk,
      dvtProbability,
      recommendation,
      interpretation: `Wells score of ${score} indicates ${risk.toLowerCase()} probability (${dvtProbability}) of DVT.`
    };
  },

  /**
   * HASBLED Score for Bleeding Risk
   */
  hasbled: (params) => {
    const {
      hypertension,
      abnormalRenalFunction,
      abnormalLiverFunction,
      stroke,
      bleeding,
      labileINR,
      elderly,
      drugs,
      alcohol
    } = params;

    let score = 0;
    let components = [];

    if (hypertension) {
      score += 1;
      components.push('Hypertension (+1)');
    }
    if (abnormalRenalFunction) {
      score += 1;
      components.push('Abnormal renal function (+1)');
    }
    if (abnormalLiverFunction) {
      score += 1;
      components.push('Abnormal liver function (+1)');
    }
    if (stroke) {
      score += 1;
      components.push('Prior stroke (+1)');
    }
    if (bleeding) {
      score += 1;
      components.push('Bleeding history (+1)');
    }
    if (labileINR) {
      score += 1;
      components.push('Labile INR (+1)');
    }
    if (elderly) {
      score += 1;
      components.push('Age >65 (+1)');
    }
    if (drugs) {
      score += 1;
      components.push('Antiplatelet/NSAID use (+1)');
    }
    if (alcohol) {
      score += 1;
      components.push('Alcohol use (+1)');
    }

    let risk = '';
    let bleedingRisk = '';

    if (score <= 2) {
      risk = 'Low';
      bleedingRisk = '1.13-1.02 bleeds per 100 patient-years';
    } else if (score === 3) {
      risk = 'Moderate';
      bleedingRisk = '3.74 bleeds per 100 patient-years';
    } else {
      risk = 'High';
      bleedingRisk = '8.70-12.50 bleeds per 100 patient-years';
    }

    return {
      score,
      maxScore: 9,
      components,
      risk,
      bleedingRisk,
      recommendation: score >= 3 ? 'Use with caution. Consider more frequent monitoring.' : 'Anticoagulation can be used with standard monitoring.',
      interpretation: `HAS-BLED score of ${score} indicates ${risk.toLowerCase()} bleeding risk.`
    };
  },

  /**
   * MELD Score for Liver Disease Severity
   */
  meld: (params) => {
    const { creatinine, bilirubin, inr, dialysis } = params;

    // MELD = 3.78×ln[bilirubin (mg/dL)] + 11.2×ln[INR] + 9.57×ln[creatinine (mg/dL)] + 6.43
    let cr = Math.max(creatinine, 1.0);
    if (dialysis || cr > 4.0) cr = 4.0;

    let bili = Math.max(bilirubin, 1.0);
    let inrValue = Math.max(inr, 1.0);

    let score = Math.round(
      3.78 * Math.log(bili) +
      11.2 * Math.log(inrValue) +
      9.57 * Math.log(cr) +
      6.43
    );

    score = Math.min(Math.max(score, 6), 40); // Cap between 6-40

    let mortality = '';
    let severity = '';

    if (score < 10) {
      mortality = '1.9%';
      severity = 'Mild';
    } else if (score < 20) {
      mortality = '6.0%';
      severity = 'Moderate';
    } else if (score < 30) {
      mortality = '19.6%';
      severity = 'Severe';
    } else {
      mortality = '52.6%';
      severity = 'Critical';
    }

    return {
      score,
      severity,
      mortality3Month: mortality,
      components: [
        `Creatinine: ${creatinine} mg/dL`,
        `Bilirubin: ${bilirubin} mg/dL`,
        `INR: ${inr}`,
        dialysis ? 'On dialysis' : ''
      ].filter(Boolean),
      interpretation: `MELD score of ${score} indicates ${severity.toLowerCase()} liver disease with ${mortality} 3-month mortality.`,
      recommendation: score >= 15 ? 'Consider transplant evaluation' : 'Continue monitoring'
    };
  }
};

// Drug Interaction Database (Common Hospitalist Medications)
export const drugInteractions = {
  // Format: drug -> list of interactions
  'warfarin': {
    severe: ['aspirin', 'clopidogrel', 'nsaids', 'macrolides', 'fluconazole', 'amiodarone'],
    moderate: ['statins', 'metronidazole', 'ciprofloxacin', 'omeprazole'],
    mechanism: 'Increased bleeding risk, CYP450 interactions, protein binding displacement',
    monitoring: 'Frequent INR monitoring required. Consider dose adjustment.'
  },
  'clopidogrel': {
    severe: ['warfarin', 'dabigatran', 'rivaroxaban', 'nsaids'],
    moderate: ['omeprazole', 'esomeprazole'],
    mechanism: 'Increased bleeding risk, CYP2C19 inhibition reduces clopidogrel activation',
    monitoring: 'Monitor for bleeding. Use pantoprazole instead of omeprazole if PPI needed.'
  },
  'amiodarone': {
    severe: ['warfarin', 'digoxin', 'simvastatin', 'diltiazem', 'verapamil'],
    moderate: ['metoprolol', 'levothyroxine'],
    mechanism: 'QT prolongation, CYP450 inhibition, increased drug levels',
    monitoring: 'ECG monitoring, drug level monitoring for digoxin/warfarin, reduce statin dose'
  },
  'metformin': {
    severe: ['iv contrast'],
    moderate: ['alcohol'],
    mechanism: 'Lactic acidosis risk with renal dysfunction or contrast',
    monitoring: 'Hold before IV contrast procedures. Check renal function.'
  },
  'digoxin': {
    severe: ['amiodarone', 'verapamil', 'quinidine'],
    moderate: ['loop diuretics', 'macrolides'],
    mechanism: 'Increased digoxin levels, hypokalemia increases toxicity',
    monitoring: 'Monitor digoxin levels and potassium. Adjust dose with amiodarone.'
  },
  'fluoxetine': {
    severe: ['maois', 'tramadol', 'linezolid'],
    moderate: ['nsaids', 'warfarin'],
    mechanism: 'Serotonin syndrome risk, CYP2D6 inhibition, increased bleeding',
    monitoring: 'Monitor for serotonin syndrome symptoms. Avoid MAOIs within 14 days.'
  }
};

// Clinical Red Flags and Alerts
export const clinicalAlerts = {

  detectAlerts: (clinicalData) => {
    const alerts = [];

    // Parse clinical data for key findings
    const text = JSON.stringify(clinicalData).toLowerCase();

    // Critical Labs
    if (text.includes('potassium') && (text.includes('6.') || text.includes('7.') || text.includes('2.'))) {
      alerts.push({
        severity: 'critical',
        category: 'Laboratory',
        alert: 'Critical Potassium Level',
        detail: 'Severe hyperkalemia or hypokalemia detected',
        action: 'URGENT: ECG, treat per hyperkalemia/hypokalemia protocol, nephrology consult if severe'
      });
    }

    if (text.includes('troponin') && text.includes('elevated')) {
      alerts.push({
        severity: 'high',
        category: 'Cardiac',
        alert: 'Elevated Troponin',
        detail: 'Possible acute coronary syndrome',
        action: 'Cardiology consult, serial troponins, ECG, consider antiplatelet therapy'
      });
    }

    if (text.includes('inr') && (text.includes('5') || text.includes('6') || text.includes('7') || text.includes('8') || text.includes('9'))) {
      alerts.push({
        severity: 'high',
        category: 'Coagulation',
        alert: 'Critically Elevated INR',
        detail: 'High bleeding risk',
        action: 'Hold warfarin, consider vitamin K, check for bleeding, hematology consult if >10'
      });
    }

    // Sepsis Indicators
    if ((text.includes('fever') || text.includes('hypothermia')) &&
        (text.includes('tachycardia') || text.includes('hypotension')) &&
        (text.includes('wbc') && (text.includes('elevated') || text.includes('leukocytosis')))) {
      alerts.push({
        severity: 'critical',
        category: 'Infection/Sepsis',
        alert: 'Possible Sepsis',
        detail: 'SIRS criteria met with suspected infection',
        action: 'Consider sepsis protocol: lactate, blood cultures, broad-spectrum antibiotics, fluid resuscitation'
      });
    }

    // Respiratory Distress
    if (text.includes('respiratory rate') && (text.includes('30') || text.includes('40'))) {
      alerts.push({
        severity: 'high',
        category: 'Respiratory',
        alert: 'Tachypnea',
        detail: 'Respiratory rate ≥30',
        action: 'Assess oxygenation, ABG, chest imaging, consider respiratory support escalation'
      });
    }

    if (text.includes('oxygen') && text.includes('saturation') && (text.includes('85') || text.includes('80'))) {
      alerts.push({
        severity: 'critical',
        category: 'Respiratory',
        alert: 'Severe Hypoxemia',
        detail: 'Critically low oxygen saturation',
        action: 'URGENT: Increase oxygen, assess airway, consider BiPAP/intubation, pulmonary consult'
      });
    }

    // Neurological
    if (text.includes('confusion') || text.includes('altered mental status') || text.includes('ams')) {
      alerts.push({
        severity: 'high',
        category: 'Neurological',
        alert: 'Altered Mental Status',
        detail: 'Acute change in cognition',
        action: 'Rule out infection, metabolic causes, stroke, medication effects. Consider head CT, neurology consult.'
      });
    }

    // Renal
    if (text.includes('creatinine') && (text.includes('elevated') || text.includes('rising'))) {
      alerts.push({
        severity: 'moderate',
        category: 'Renal',
        alert: 'Acute Kidney Injury',
        detail: 'Rising creatinine',
        action: 'Check baseline creatinine, urine output, review nephrotoxic meds, consider nephrology consult'
      });
    }

    // Fall Risk
    if (text.includes('fall') || (text.includes('elderly') && text.includes('confusion'))) {
      alerts.push({
        severity: 'moderate',
        category: 'Safety',
        alert: 'Fall Risk',
        detail: 'Patient at high risk for falls',
        action: 'Fall precautions, bed alarm, PT evaluation, review sedating medications'
      });
    }

    // DVT Risk
    if (text.includes('immobile') || text.includes('bedbound')) {
      alerts.push({
        severity: 'moderate',
        category: 'VTE Prevention',
        alert: 'VTE Risk',
        detail: 'Immobile patient without documented prophylaxis',
        action: 'Ensure VTE prophylaxis (pharmacologic or mechanical). Assess contraindications.'
      });
    }

    return alerts;
  }
};

// Evidence-Based Guidelines
export const clinicalGuidelines = {

  /**
   * Get condition-specific guidelines
   */
  getGuideline: (condition) => {
    const guidelines = {
      'pneumonia': {
        condition: 'Community-Acquired Pneumonia',
        source: 'IDSA/ATS Guidelines',
        keyPoints: [
          'Obtain blood cultures before antibiotics if possible',
          'Start empiric antibiotics within 4 hours of arrival',
          'Typical regimen: Ceftriaxone + Azithromycin or Respiratory fluoroquinolone',
          'Switch to oral antibiotics when clinically stable and able to tolerate PO',
          'Total duration typically 5-7 days for uncomplicated CAP',
          'Follow-up CXR in 6-8 weeks for patients >50 or with risk factors'
        ],
        workup: ['CBC', 'CMP', 'Blood cultures x2', 'Chest X-ray', 'Consider procalcitonin', 'CURB-65 score'],
        redFlags: ['Hypotension', 'Respiratory failure', 'Confusion', 'Multilobar involvement']
      },
      'chf': {
        condition: 'Acute Decompensated Heart Failure',
        source: 'ACC/AHA Guidelines',
        keyPoints: [
          'Assess volume status and hemodynamics',
          'IV diuretics for congestion (loop diuretics typically first-line)',
          'Monitor daily weights, strict I/Os',
          'Continue GDMT if not hypotensive (ACEi/ARB, beta-blocker, MRA)',
          'Consider BNP/NT-proBNP to guide therapy',
          'Echocardiogram if not done recently or change in clinical status',
          'Address precipitating factors (ischemia, arrhythmia, non-adherence, renal dysfunction)'
        ],
        workup: ['BNP/NT-proBNP', 'Troponin', 'CMP', 'CBC', 'TSH', 'Echo', 'ECG', 'CXR'],
        redFlags: ['Cardiogenic shock', 'Acute coronary syndrome', 'Severe valvular disease', 'Arrhythmia']
      },
      'copd': {
        condition: 'COPD Exacerbation',
        source: 'GOLD Guidelines',
        keyPoints: [
          'Bronchodilators: Albuterol + Ipratropium nebulizers',
          'Systemic corticosteroids: Prednisone 40mg x 5 days',
          'Antibiotics if increased sputum purulence (Azithromycin, Doxycycline, or Augmentin)',
          'Oxygen to target SpO2 88-92%',
          'Consider BiPAP if respiratory acidosis or severe dyspnea',
          'Smoking cessation counseling',
          'Ensure appropriate inhaler technique and discharge regimen'
        ],
        workup: ['ABG if severe', 'CXR', 'CBC', 'BNP if concern for CHF', 'ECG'],
        redFlags: ['Respiratory acidosis', 'Altered mental status', 'Hemodynamic instability', 'Pneumothorax']
      },
      'sepsis': {
        condition: 'Sepsis/Septic Shock',
        source: 'Surviving Sepsis Campaign',
        keyPoints: [
          'Recognize early: qSOFA ≥2 or SIRS with suspected infection',
          'Obtain blood cultures BEFORE antibiotics',
          'Broad-spectrum antibiotics within 1 hour',
          'Fluid resuscitation: 30mL/kg crystalloid within 3 hours',
          'Lactate measurement and repeat if elevated',
          'Vasopressors (norepinephrine first-line) if hypotension persists',
          'Source control (drain abscesses, remove infected devices)',
          'De-escalate antibiotics based on cultures and clinical response'
        ],
        workup: ['Lactate', 'Blood cultures', 'Urine culture', 'CXR', 'CBC', 'CMP', 'Procalcitonin'],
        redFlags: ['Lactate >4', 'Persistent hypotension', 'Organ dysfunction', 'Altered mental status']
      },
      'stroke': {
        condition: 'Acute Ischemic Stroke',
        source: 'AHA/ASA Guidelines',
        keyPoints: [
          'Time is brain: symptom onset time critical',
          'STAT non-contrast head CT to rule out hemorrhage',
          'tPA eligible if <4.5 hours (consider NIHSS, no contraindications)',
          'Mechanical thrombectomy for large vessel occlusion up to 24 hours',
          'Neurology/stroke team activation',
          'Blood pressure management: permissive hypertension if not tPA candidate',
          'Aspirin 325mg after hemorrhage ruled out (hold if tPA given)',
          'Swallow evaluation before PO',
          'Statin, DVT prophylaxis, early mobilization'
        ],
        workup: ['STAT CT head', 'CTA head/neck if thrombectomy candidate', 'ECG', 'Cardiac monitoring', 'Fasting lipids', 'HbA1c', 'Echo'],
        redFlags: ['Large vessel occlusion', 'Hemorrhagic transformation', 'Malignant cerebral edema']
      },
      'dvt': {
        condition: 'Deep Vein Thrombosis',
        source: 'ACCP Guidelines',
        keyPoints: [
          'Wells score to assess pretest probability',
          'D-dimer if low/moderate probability; ultrasound if high probability',
          'Compression ultrasound of affected extremity',
          'Anticoagulation: DOAC (rivaroxaban, apixaban) or LMWH bridge to warfarin',
          'Duration: 3 months minimum; extended if unprovoked or recurrent',
          'Rule out malignancy in unprovoked VTE',
          'Compression stockings may reduce post-thrombotic syndrome'
        ],
        workup: ['Compression ultrasound', 'D-dimer', 'CBC', 'PT/INR', 'aPTT', 'Creatinine'],
        redFlags: ['Phlegmasia cerulea dolens', 'PE symptoms', 'Bilateral DVT', 'Mesenteric/cerebral thrombosis']
      }
    };

    return guidelines[condition.toLowerCase()] || null;
  },

  /**
   * Get all available guidelines
   */
  getAllConditions: () => {
    return [
      'pneumonia',
      'chf',
      'copd',
      'sepsis',
      'stroke',
      'dvt'
    ];
  }
};

export default {
  clinicalCalculators,
  drugInteractions,
  clinicalAlerts,
  clinicalGuidelines
};
