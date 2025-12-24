# Cognitive Bias Detection and Alternative Diagnosis Features

## Overview

NeuroLogic Hospitalist Assistant now includes advanced cognitive bias detection, logical fallacy analysis, and alternative diagnosis exploration capabilities to help clinicians identify and mitigate diagnostic reasoning errors.

## Features

### 1. Cognitive Bias Detection

The system automatically analyzes clinical reasoning for common cognitive biases including:

- **Anchoring Bias**: Over-reliance on initial findings or first impressions
- **Confirmation Bias**: Selectively emphasizing data that supports a favored diagnosis
- **Availability Bias**: Recent or memorable cases influencing judgment
- **Premature Closure**: Stopping diagnostic process too early
- **Search Satisficing**: Stopping after finding one diagnosis, missing others
- **Framing Effect**: Being influenced by how case was presented
- **Representativeness Restraint**: Assuming patient fits stereotype
- **Diagnosis Momentum**: Accepting previous labels without verification
- **Omission Bias**: Favoring inaction over action
- **Commission Bias**: Favoring action over appropriate watchful waiting
- **Visceral Bias**: Personal feelings affecting decisions
- **Sunk Cost Fallacy**: Continuing plan due to resources invested

### 2. Logical Fallacy Detection

The system identifies logical fallacies in clinical reasoning:

- **Post Hoc Ergo Propter Hoc**: Confusing correlation with causation
- **False Equivalence**: Treating unequal probabilities as equal
- **Circular Reasoning**: Using conclusion to support premise
- **Hasty Generalization**: Drawing broad conclusions from limited data
- **False Choice**: Presenting only two options when more exist
- **Appeal to Authority**: Accepting diagnosis without verification
- **Texas Sharpshooter**: Cherry-picking supportive data, ignoring contradictory
- **Gambler's Fallacy**: Letting recent case distribution affect independent probability
- **Slippery Slope**: Believing one action leads to chain of events without evidence
- **Red Herring**: Introducing irrelevant information that distracts
- **Straw Man**: Misrepresenting an argument to make it easier to attack

### 3. Alternative Diagnosis Exploration

Advanced metacognitive analysis including:

- Systematic challenge of leading diagnosis
- Must-not-miss diagnosis identification
- Atypical presentation consideration
- Multiple concurrent diagnoses exploration
- VINDICATE-based systematic differential (Vascular, Infectious, Neoplastic, Drugs, Inflammatory, Congenital, Autoimmune, Trauma, Endocrine)
- Diagnostic uncertainty assessment
- Cognitive debiasing strategies

## API Endpoints

### Enhanced Clinical Decision Support
**POST** `/api/clinical-decision-support`

Now includes cognitive bias and logical fallacy analysis in the response.

**Request:**
```json
{
  "clinicalScenario": "68-year-old male with chest pain...",
  "patientData": {
    "age": 68,
    "gender": "male",
    "vitals": { "bp": "160/95", "hr": 110 },
    "labs": { "troponin": 0.8 }
  },
  "question": "Provide comprehensive clinical decision support"
}
```

**Response includes:**
```json
{
  "success": true,
  "data": {
    "assessment": "...",
    "differentials": [...],
    "alternativeDiagnoses": [
      {
        "diagnosis": "Pulmonary embolism",
        "whyConsider": "Atypical presentation with tachycardia",
        "distinguishingFeatures": "D-dimer, CTA chest",
        "consequenceOfMissing": "Potential fatality"
      }
    ],
    "workup": [...],
    "management": [...],
    "cognitiveBiases": [
      {
        "biasType": "Anchoring Bias",
        "evidence": "Early focus on cardiac etiology may limit consideration of alternatives",
        "impact": "May miss PE or aortic dissection",
        "mitigation": "Systematically review alternative causes of chest pain"
      }
    ],
    "logicalFallacies": [
      {
        "fallacyType": "Post Hoc Ergo Propter Hoc",
        "description": "Assuming chest pain onset after exertion proves cardiac cause",
        "correction": "Consider other causes of exertional symptoms"
      }
    ],
    "reasoningQuality": {
      "strengths": ["Comprehensive history", "Appropriate testing"],
      "weaknesses": ["Limited differential considered"],
      "uncertaintyFactors": ["Atypical symptoms", "Comorbidities"],
      "recommendedApproach": "Use systematic differential diagnosis approach"
    }
  }
}
```

### Alternative Diagnosis Exploration
**POST** `/api/explore-alternatives`

Deep dive into alternative diagnoses with metacognitive analysis.

**Request:**
```json
{
  "clinicalScenario": "Patient presentation details...",
  "currentDifferential": ["Diagnosis 1", "Diagnosis 2", "Diagnosis 3"],
  "patientData": {
    "age": 65,
    "symptoms": ["symptom1", "symptom2"],
    "labs": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metacognitiveAnalysis": {
      "leadingDiagnosisChallenge": {
        "unexplainedFindings": ["Finding not explained by leading diagnosis"],
        "contradictoryEvidence": ["Evidence against"],
        "missingExpectedFindings": ["What should be present but isn't"],
        "baseRateConsideration": "Analysis of diagnosis prevalence",
        "anchoringRisk": "Assessment of anchoring bias"
      },
      "mustNotMissDiagnoses": [
        {
          "diagnosis": "Life-threatening condition",
          "presentation": "How it could present",
          "consequence": "What happens if missed",
          "ruleOutStrategy": "How to rule out"
        }
      ],
      "atypicalPresentations": [...],
      "multipleDiagnoses": {...},
      "systematicDifferential": {
        "vascular": [...],
        "infectious": [...],
        "neoplastic": [...],
        "drugs": [...],
        "inflammatory": [...],
        "congenital": [...],
        "autoimmune": [...],
        "trauma": [...],
        "endocrine": [...],
        "other": [...]
      }
    },
    "expandedDifferential": [...],
    "diagnosticUncertainty": {...},
    "cognitiveDebiasing": {
      "identifiedBiases": [...],
      "debiasStrategies": [...],
      "prematureClosureRisk": "high/medium/low",
      "recommendedPause": "Questions to force reconsideration"
    }
  }
}
```

### Cognitive Bias Analysis
**POST** `/api/analyze-biases`

Dedicated endpoint for analyzing clinical reasoning for biases and fallacies.

**Request:**
```json
{
  "clinicalReasoning": "Detailed reasoning chain...",
  "diagnosis": "Proposed diagnosis",
  "workup": [...],
  "management": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallReasoning": {
      "quality": "good",
      "summary": "Summary of reasoning quality",
      "logicalFlow": "Assessment of logical progression"
    },
    "cognitiveBiases": [
      {
        "biasType": "Specific bias name",
        "severity": "high/medium/low",
        "evidence": "Evidence from case",
        "clinicalExample": "How it manifests",
        "potentialImpact": "Risk of error",
        "mitigationStrategies": ["Action 1", "Action 2"],
        "questionsToAsk": ["Question 1", "Question 2"]
      }
    ],
    "logicalFallacies": [...],
    "reasoningStrengths": [...],
    "reasoningWeaknesses": [...],
    "diagnosticErrors": {
      "noFaultErrors": [],
      "systemErrors": [],
      "cognitiveErrors": [],
      "preventableErrors": []
    },
    "uncertaintyAssessment": {...},
    "improvementRecommendations": [...],
    "metacognitivePrompts": [...]
  }
}
```

### Reference Guide
**GET** `/api/biases-fallacies-reference`

Retrieve comprehensive reference guide for all cognitive biases and logical fallacies.

**Response:**
```json
{
  "success": true,
  "data": {
    "cognitiveBiases": {
      "anchoringBias": {
        "name": "Anchoring Bias",
        "description": "...",
        "clinicalExample": "...",
        "detectionPrompt": "...",
        "mitigation": "...",
        "riskFactors": [...]
      },
      ...
    },
    "logicalFallacies": {
      "postHocErgoPropterHoc": {
        "name": "Post Hoc Ergo Propter Hoc",
        "description": "...",
        "clinicalExample": "...",
        "detectionPrompt": "...",
        "mitigation": "..."
      },
      ...
    }
  }
}
```

## Frontend Display

The web interface automatically displays:

1. **Cognitive Bias Alerts** - Purple-themed cards showing identified biases with severity levels
2. **Logical Reasoning Analysis** - Orange-themed cards highlighting fallacies
3. **Alternative Diagnoses to Consider** - Cyan-themed cards with must-consider diagnoses
4. **Reasoning Quality Assessment** - Purple-themed cards with strengths, weaknesses, and uncertainties

## Usage Examples

### Example 1: Using Enhanced CDS with Bias Detection

```javascript
const response = await fetch('/api/clinical-decision-support', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicalScenario: `
      72-year-old woman presents with 3 days of progressive confusion,
      fever to 101.5F, and dysuria. Vitals: BP 110/70, HR 95, RR 18.
      Labs: WBC 14.5, UA: positive leukocyte esterase, nitrites positive.
      Working diagnosis: UTI with delirium.
    `,
    patientData: {
      age: 72,
      gender: 'female',
      vitals: { temp: 101.5, bp: '110/70', hr: 95 },
      labs: { wbc: 14.5 }
    },
    question: 'Evaluate for cognitive biases and suggest alternatives'
  })
});

const result = await response.json();
console.log(result.data.cognitiveBiases);
// May identify anchoring bias on UTI diagnosis
// May suggest considering meningitis, stroke, medication effects
```

### Example 2: Exploring Alternative Diagnoses

```javascript
const response = await fetch('/api/explore-alternatives', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicalScenario: 'Young athlete with chest pain after exercise',
    currentDifferential: [
      'Costochondritis',
      'Muscle strain',
      'Anxiety'
    ],
    patientData: {
      age: 22,
      athlete: true,
      familyHistory: 'sudden cardiac death in father at age 45'
    }
  })
});

const result = await response.json();
// Will flag must-not-miss diagnoses like:
// - Hypertrophic cardiomyopathy
// - Coronary anomalies
// - Arrhythmogenic right ventricular cardiomyopathy
// - Myocarditis
```

### Example 3: Analyzing Clinical Reasoning for Biases

```javascript
const response = await fetch('/api/analyze-biases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinicalReasoning: `
      Patient has history of frequent ED visits for various complaints.
      Presenting today with abdominal pain. Last visit was 2 days ago for back pain.
      Assuming this is another non-specific complaint. Plan for reassurance and discharge.
    `,
    diagnosis: 'Non-specific abdominal pain',
    management: ['Reassurance', 'Discharge']
  })
});

const result = await response.json();
// Will identify:
// - Framing bias (labeling as "frequent flyer")
// - Diagnosis momentum (pattern of non-specific complaints)
// - Potential for premature closure
// - Recommend systematic evaluation despite visit history
```

## Clinical Decision Support Integration

The bias detection features are automatically integrated into the main analysis workflow:

1. **Automatic Analysis**: Every CDS request now includes bias detection
2. **Real-time Alerts**: Biases are flagged as they're detected
3. **Mitigation Strategies**: Specific, actionable recommendations provided
4. **Educational Component**: Each bias includes clinical examples and explanations

## Best Practices

### For Clinicians

1. **Use bias detection proactively**, not just when uncertain
2. **Review alternative diagnoses** even when diagnosis seems clear
3. **Pay attention to "must-not-miss" warnings** regardless of likelihood
4. **Use metacognitive prompts** to force systematic thinking
5. **Document consideration of alternatives** in clinical reasoning

### For System Integration

1. **Present biases as opportunities for improvement**, not failures
2. **Prioritize by severity**: High-severity biases should be prominently displayed
3. **Provide context**: Always explain why a bias is relevant to the specific case
4. **Enable learning**: Link to educational resources about each bias
5. **Track patterns**: Monitor which biases are commonly identified

## Evidence Base

This feature is based on extensive research in cognitive psychology and clinical decision-making:

- Croskerry P. "The Importance of Cognitive Errors in Diagnosis and Strategies to Minimize Them" *Academic Medicine* 2003
- Graber ML et al. "Diagnostic Error in Internal Medicine" *Archives of Internal Medicine* 2005
- Norman GR et al. "The Causes of Errors in Clinical Reasoning" *Academic Medicine* 2017
- Singh H et al. "Types and Origins of Diagnostic Errors in Primary Care Settings" *JAMA Internal Medicine* 2013

## Limitations

- AI-detected biases are suggestions, not definitive diagnoses of reasoning errors
- System cannot access clinician's internal thought process, only documented reasoning
- Some clinical contexts may have valid reasons for what appears to be biased reasoning
- Bias detection requires adequate clinical documentation to analyze

## Future Enhancements

- Integration with clinical decision rules and calculators
- Personalized bias detection based on clinician patterns
- Real-time bias detection during documentation
- Educational modules for each cognitive bias
- Outcome tracking to validate bias detection accuracy

## Support

For questions or issues with cognitive bias features, please:
1. Review this documentation
2. Check the examples in `/examples/cognitive-bias-examples.js`
3. Open an issue at https://github.com/Peshwa707/neurologic-hospitalist/issues

## Disclaimer

The cognitive bias detection system is a clinical decision support tool designed to augment, not replace, clinical judgment. All AI-generated suggestions require professional verification. Clinicians remain responsible for all diagnostic and therapeutic decisions.
