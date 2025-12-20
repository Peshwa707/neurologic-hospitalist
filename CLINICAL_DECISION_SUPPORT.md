# Clinical Decision Support System

## Overview

NeuroLogic Hospitalist Assistant now includes a comprehensive AI-powered clinical decision support system to guide evidence-based clinical decision making for hospitalist physicians.

## Features

### 1. Clinical Calculators

Evidence-based clinical risk scores and calculators for common inpatient scenarios.

#### Available Calculators

**CURB-65 Score** - Pneumonia Severity
- Predicts mortality in community-acquired pneumonia
- Guides admission decisions
- Components: Confusion, Urea, Respiratory rate, Blood pressure, Age ≥65
- API: `POST /api/calculate` with `calculatorType: "curb65"`

**CHA2DS2-VASc Score** - Stroke Risk in Atrial Fibrillation
- Estimates annual stroke risk
- Guides anticoagulation decisions
- Components: CHF, Hypertension, Age, Diabetes, Stroke history, Vascular disease, Sex
- API: `POST /api/calculate` with `calculatorType: "chads2vasc"`

**Wells Score for DVT** - Deep Vein Thrombosis Probability
- Risk stratifies DVT likelihood
- Guides imaging decisions
- Components: Cancer, paralysis, immobilization, tenderness, leg swelling, etc.
- API: `POST /api/calculate` with `calculatorType: "wellsDVT"`

**HAS-BLED Score** - Bleeding Risk on Anticoagulation
- Predicts major bleeding risk
- Guides anticoagulation safety
- Components: Hypertension, renal/liver function, stroke, bleeding, labile INR, elderly, drugs, alcohol
- API: `POST /api/calculate` with `calculatorType: "hasbled"`

**MELD Score** - Liver Disease Severity
- Predicts 3-month mortality in liver disease
- Guides transplant priority
- Components: Creatinine, Bilirubin, INR, Dialysis status
- API: `POST /api/calculate` with `calculatorType: "meld"`

#### Example Usage

```bash
curl -X POST http://localhost:3001/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "calculatorType": "curb65",
    "params": {
      "confusion": true,
      "urea": 25,
      "respiratoryRate": 32,
      "bloodPressure": {"systolic": 85, "diastolic": 55},
      "age": 78
    }
  }'
```

Response:
```json
{
  "success": true,
  "calculator": "curb65",
  "result": {
    "score": 5,
    "maxScore": 5,
    "components": [
      "Confusion present",
      "Elevated urea/BUN",
      "Respiratory rate ≥30",
      "Low blood pressure",
      "Age ≥65"
    ],
    "risk": "High (22% mortality)",
    "recommendation": "Hospitalization recommended, consider ICU if score 4-5",
    "interpretation": "CURB-65 score of 5/5 indicates high (22% mortality) risk."
  }
}
```

### 2. Drug Interaction Checking

Automated detection of potentially dangerous drug-drug interactions for common hospitalist medications.

#### Covered Medications

- Anticoagulants: Warfarin, Clopidogrel
- Antiarrhythmics: Amiodarone, Digoxin
- Antidiabetics: Metformin
- Antidepressants: Fluoxetine
- And more...

#### Severity Levels

- **Severe**: Contraindicated or requires immediate intervention
- **Moderate**: Requires dose adjustment or monitoring

#### Example Usage

```bash
curl -X POST http://localhost:3001/api/check-interactions \
  -H "Content-Type: application/json" \
  -d '{
    "medications": ["warfarin", "aspirin", "amiodarone", "omeprazole"]
  }'
```

Response:
```json
{
  "success": true,
  "medicationsChecked": ["warfarin", "aspirin", "amiodarone", "omeprazole"],
  "interactionsFound": 2,
  "interactions": [
    {
      "drug1": "warfarin",
      "drug2": "aspirin",
      "severity": "severe",
      "mechanism": "Increased bleeding risk, CYP450 interactions, protein binding displacement",
      "monitoring": "Frequent INR monitoring required. Consider dose adjustment."
    },
    {
      "drug1": "warfarin",
      "drug2": "amiodarone",
      "severity": "severe",
      "mechanism": "Increased bleeding risk, CYP450 interactions, protein binding displacement",
      "monitoring": "Frequent INR monitoring required. Consider dose adjustment."
    }
  ]
}
```

### 3. Clinical Alerts System

Automatic detection of clinical red flags and critical findings requiring urgent attention.

#### Alert Categories

- **Critical Labs**: Severe electrolyte abnormalities, elevated troponin, critical INR
- **Sepsis Indicators**: SIRS criteria with infection
- **Respiratory Distress**: Tachypnea, hypoxemia
- **Neurological**: Altered mental status
- **Renal**: Acute kidney injury
- **Safety**: Fall risk, VTE risk

#### Severity Levels

- **Critical**: Requires immediate intervention
- **High**: Urgent attention needed
- **Moderate**: Should be addressed today

#### Example Usage

```bash
curl -X POST http://localhost:3001/api/detect-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "clinicalData": {
      "vitals": "BP 85/50, HR 120, RR 28, T 101.5, SpO2 88%",
      "labs": "WBC 18, lactate 4.5, troponin 2.5",
      "assessment": "Patient appears septic with hypotension"
    }
  }'
```

### 4. Evidence-Based Clinical Guidelines

Quick access to evidence-based guidelines for common inpatient conditions.

#### Available Guidelines

1. **Community-Acquired Pneumonia** (IDSA/ATS)
2. **Acute Decompensated Heart Failure** (ACC/AHA)
3. **COPD Exacerbation** (GOLD)
4. **Sepsis/Septic Shock** (Surviving Sepsis Campaign)
5. **Acute Ischemic Stroke** (AHA/ASA)
6. **Deep Vein Thrombosis** (ACCP)

Each guideline includes:
- Key management points
- Recommended workup
- Red flags to watch for
- Source references

#### Example Usage

```bash
# Get specific guideline
curl http://localhost:3001/api/guideline/pneumonia

# List all available guidelines
curl http://localhost:3001/api/guidelines
```

Response:
```json
{
  "success": true,
  "guideline": {
    "condition": "Community-Acquired Pneumonia",
    "source": "IDSA/ATS Guidelines",
    "keyPoints": [
      "Obtain blood cultures before antibiotics if possible",
      "Start empiric antibiotics within 4 hours of arrival",
      "Typical regimen: Ceftriaxone + Azithromycin or Respiratory fluoroquinolone",
      "Switch to oral antibiotics when clinically stable and able to tolerate PO",
      "Total duration typically 5-7 days for uncomplicated CAP",
      "Follow-up CXR in 6-8 weeks for patients >50 or with risk factors"
    ],
    "workup": [
      "CBC",
      "CMP",
      "Blood cultures x2",
      "Chest X-ray",
      "Consider procalcitonin",
      "CURB-65 score"
    ],
    "redFlags": [
      "Hypotension",
      "Respiratory failure",
      "Confusion",
      "Multilobar involvement"
    ]
  }
}
```

### 5. AI-Enhanced Clinical Decision Support

Comprehensive AI-powered clinical decision support combining Claude AI with automated tools.

This endpoint provides:
- Clinical assessment of key findings
- Differential diagnosis with evidence
- Recommended workup with prioritization
- Evidence-based management recommendations
- Risk stratification
- Disposition recommendations
- Follow-up planning
- Red flag identification
- Automatic alert detection
- Drug interaction checking
- Calculator suggestions

#### Example Usage

```bash
curl -X POST http://localhost:3001/api/clinical-decision-support \
  -H "Content-Type: application/json" \
  -d '{
    "clinicalScenario": "68 year old male with 3 days of fever, cough, dyspnea. CXR shows RLL infiltrate.",
    "patientData": {
      "age": 68,
      "vitals": "BP 110/70, HR 102, RR 24, T 101.8, SpO2 91% on RA",
      "labs": "WBC 15.2, Cr 1.2",
      "pmh": "COPD, HTN, former smoker",
      "medications": ["lisinopril", "albuterol", "tiotropium"]
    },
    "question": "Should this patient be admitted? What is the recommended treatment?",
    "includeDrugInteractions": true
  }'
```

## Integration with Existing Features

The clinical decision support system enhances the existing NeuroLogic features:

### Main Analysis Endpoint (`/api/analyze`)
- Automatically includes differential diagnoses
- Provides diagnostic workup recommendations
- Offers evidence-based management suggestions
- Includes care progression tracking
- Evaluates discharge readiness

### Enhanced with CDS:
- **Calculator suggestions** based on presenting condition
- **Automatic alert detection** for critical findings
- **Guideline references** for condition-specific management
- **Drug interaction checks** for medication lists

## Clinical Decision Support Workflow

### Recommended Usage Pattern

1. **Patient Presentation**
   - Enter clinical context and dictate encounter
   - Run main analysis (`/api/analyze`)

2. **Risk Stratification**
   - Use appropriate clinical calculator (`/api/calculate`)
   - Example: CURB-65 for pneumonia, CHA2DS2-VASc for atrial fibrillation

3. **Safety Checks**
   - Automatic alert detection runs on analysis
   - Manual drug interaction check for medication changes (`/api/check-interactions`)

4. **Evidence-Based Management**
   - Access relevant clinical guidelines (`/api/guideline/:condition`)
   - Apply evidence-based recommendations

5. **Comprehensive Decision Support**
   - For complex cases, use AI-Enhanced CDS (`/api/clinical-decision-support`)
   - Combines AI reasoning with automated tools

## API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/calculate` | POST | Run clinical calculators |
| `/api/check-interactions` | POST | Check drug-drug interactions |
| `/api/detect-alerts` | POST | Detect clinical red flags |
| `/api/guideline/:condition` | GET | Get condition-specific guideline |
| `/api/guidelines` | GET | List all available guidelines |
| `/api/clinical-decision-support` | POST | Comprehensive AI-powered CDS |

## Safety and Disclaimers

⚠️ **IMPORTANT CLINICAL DISCLAIMER**

- This system is for **informational purposes only**
- All AI-generated suggestions require **professional verification**
- **NOT a substitute for clinical judgment**
- Always verify drug interactions with official pharmacology references
- Guidelines are summaries - consult full guidelines for complete information
- Clinical calculators are decision aids, not absolute rules
- Individual patient factors always take precedence

## Evidence Base

All clinical calculators, guidelines, and recommendations are based on:
- Peer-reviewed medical literature
- Professional society guidelines (IDSA, ATS, ACC, AHA, GOLD, etc.)
- Validated clinical decision rules
- Current standard of care for hospitalist medicine

## Future Enhancements

Planned additions:
- Additional clinical calculators (CHADS2, PORT/PSI, NEWS2, qSOFA)
- Expanded drug interaction database
- Antibiotic stewardship guidance
- Lab interpretation assistance
- Imaging appropriateness criteria
- Procedure decision support
- Code status discussion guides
- Goals of care frameworks

## Support

For issues, feature requests, or clinical content updates:
- GitHub Issues: https://github.com/yourusername/neurologic-hospitalist/issues
- Always report clinical accuracy concerns immediately

---

**Built with evidence-based medicine and AI by NeuroLogic Hospitalist Assistant**
