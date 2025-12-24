import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  clinicalCalculators,
  drugInteractions,
  clinicalAlerts,
  clinicalGuidelines
} from './clinicalDecisionSupport.js';
import {
  generateBiasDetectionPrompt,
  generateAlternativeDiagnosisPrompt,
  getAllBiasesAndFallacies
} from './cognitiveBiasDetector.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Runtime configuration for API key
let runtimeConfig = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || null
};

// Initialize Anthropic client with runtime config support
function getAnthropicClient() {
  if (!runtimeConfig.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please set it in Settings.');
  }
  return new Anthropic({
    apiKey: runtimeConfig.anthropicApiKey,
  });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NeuroLogic Hospitalist Assistant',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!runtimeConfig.anthropicApiKey
  });
});

// Configuration endpoints
app.get('/api/config/status', (req, res) => {
  res.json({
    success: true,
    apiKeyConfigured: !!runtimeConfig.anthropicApiKey,
    apiKeySource: process.env.ANTHROPIC_API_KEY ? 'environment' : (runtimeConfig.anthropicApiKey ? 'runtime' : 'none')
  });
});

app.post('/api/config/api-key', (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'API key is required and must be a string'
      });
    }

    // Validate API key format (Anthropic keys start with sk-ant-)
    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key format. Anthropic API keys should start with "sk-ant-"'
      });
    }

    // Test the API key by creating a client
    try {
      const testClient = new Anthropic({ apiKey });
      // If we get here, the key format is valid
      runtimeConfig.anthropicApiKey = apiKey;

      console.log('[Config] API key updated successfully via runtime configuration');

      res.json({
        success: true,
        message: 'API key configured successfully',
        apiKeyConfigured: true
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key. Please check your key from console.anthropic.com'
      });
    }
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure API key'
    });
  }
});

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript, clinicalContext, noteType } = req.body;

    if (!transcript && !clinicalContext) {
      return res.status(400).json({ 
        error: 'Either transcript or clinical context is required' 
      });
    }

    const noteTypePrompts = {
      soap: 'SOAP note (Subjective, Objective, Assessment, Plan)',
      hp: 'History and Physical (Chief Complaint, HPI, ROS, PMH, Medications, Allergies, Social History, Family History, Physical Exam, Assessment, Plan)',
      progress: 'Progress Note (Interval History, Current Status, Physical Exam, Assessment, Plan)',
      procedure: 'Procedure Note (Indication, Procedure Description, Findings, Complications, Plan)',
      discharge: 'Discharge Summary (Hospital Course, Discharge Diagnoses, Discharge Medications, Follow-up Instructions, Discharge Condition)'
    };

    const systemPrompt = `You are NeuroLogic Hospitalist Assistant, an AI clinical decision support system for hospitalist physicians. Analyze the clinical information provided and generate comprehensive output for inpatient care.

Format your response as valid JSON with this exact structure:
{
  "structuredNote": {
    "sections": [
      {"title": "Section Name", "content": "Section content here"}
    ]
  },
  "icd10Codes": [
    {"code": "X00.0", "description": "Description"}
  ],
  "cptCodes": [
    {"code": "99213", "description": "Description"}
  ],
  "differentialDiagnoses": ["Most likely diagnosis", "Second most likely", "Third"],
  "diagnosticWorkup": [
    {"test": "Test name", "rationale": "Why needed", "priority": "high"}
  ],
  "managementSuggestions": [
    {"recommendation": "Treatment recommendation", "priority": "high"}
  ],
  "careProgression": {
    "currentPhase": "Acute/Stabilization/Recovery/Discharge Planning",
    "completedMilestones": ["List of completed care milestones"],
    "pendingMilestones": ["List of pending care milestones"],
    "nextSteps": [
      {"action": "Next action to take", "rationale": "Why this is needed", "timeframe": "When to do it", "priority": "high/medium/low"}
    ],
    "anticipatedLOS": "Estimated remaining length of stay",
    "barriers": ["List of barriers to discharge"]
  },
  "dischargeReadiness": {
    "readinessScore": 0-100,
    "readinessLevel": "Not Ready/Approaching Ready/Ready for Discharge",
    "criteriaMet": [
      {"criterion": "Discharge criterion", "status": "met/not met/in progress", "details": "Explanation"}
    ],
    "outstandingIssues": ["Issues that must be resolved before discharge"],
    "dischargeChecklist": [
      {"item": "Checklist item", "completed": true/false, "responsible": "Who is responsible"}
    ],
    "estimatedDischargeDate": "Estimated date if applicable",
    "dischargeDisposition": "Home/SNF/Rehab/LTACH/Other",
    "followUpNeeds": ["Required follow-up appointments and timeframes"]
  }
}

Create a ${noteTypePrompts[noteType] || noteTypePrompts.soap}. 

Instructions:
1. Use the Clinical Context (patient background, labs, vitals, imaging, hospital course) to inform your analysis
2. Use the Dictation/Transcript as the primary encounter documentation
3. Combine both sources to create a comprehensive structured note
4. Suggest relevant ICD-10 diagnosis codes and CPT procedure/E&M codes
5. Provide differential diagnoses ranked by likelihood based on all available data
6. Recommend diagnostic workup with rationale and priority (high/medium/low)
7. Provide evidence-based management suggestions with priority levels
8. Assess care progression - identify where the patient is in their hospital course, what has been accomplished, and what needs to happen next
9. Evaluate discharge readiness - score readiness 0-100, identify met/unmet criteria, barriers, and estimated discharge timing
10. Consider typical hospitalist concerns: medical stability, functional status, social support, follow-up arrangements, medication reconciliation

IMPORTANT: Return ONLY valid JSON, no other text.`;

    const userContent = `CLINICAL CONTEXT (Patient Background, Labs, Vitals, Imaging, Hospital Course, etc.):
${clinicalContext || 'No additional context provided'}

---
DICTATION/TRANSCRIPT (Encounter Documentation):
${transcript || 'No dictation provided'}`;

    console.log(`[${new Date().toISOString()}] Processing analysis request...`);

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userContent}`
        }
      ]
    });

    const responseText = message.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    console.log(`[${new Date().toISOString()}] Analysis complete`);

    res.json({
      success: true,
      data: analysisResult,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.' 
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    }

    res.status(500).json({ 
      error: error.message || 'Analysis failed. Please try again.' 
    });
  }
});

// Care Progression endpoint - detailed next steps analysis
app.post('/api/care-progression', async (req, res) => {
  try {
    const { clinicalContext, currentProblems, hospitalDay } = req.body;

    if (!clinicalContext) {
      return res.status(400).json({ error: 'Clinical context is required' });
    }

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are NeuroLogic Hospitalist Assistant. Analyze this hospitalized patient and provide detailed care progression guidance.

CLINICAL CONTEXT:
${clinicalContext}

ACTIVE PROBLEMS:
${currentProblems || 'Not specified'}

HOSPITAL DAY: ${hospitalDay || 'Not specified'}

Provide a detailed JSON response:
{
  "overallAssessment": "Brief summary of patient status and trajectory",
  "acuityLevel": "Critical/High/Moderate/Low",
  "carePhase": "Acute Stabilization/Active Treatment/Recovery/Discharge Planning",
  "problemBasedPlan": [
    {
      "problem": "Problem name",
      "status": "Active/Improving/Resolved/Worsening",
      "todaysPriorities": ["Priority actions for today"],
      "nextSteps": ["Sequential next steps"],
      "contingencyPlans": ["If X happens, then Y"]
    }
  ],
  "criticalActions": [
    {"action": "Action", "timeframe": "Immediate/Today/Tomorrow", "rationale": "Why critical"}
  ],
  "pendingItems": [
    {"item": "Pending item", "status": "Ordered/Pending/Overdue", "followUp": "When to follow up"}
  ],
  "consultRecommendations": [
    {"specialty": "Specialty", "reason": "Reason for consult", "urgency": "Stat/Urgent/Routine"}
  ],
  "communicationNeeds": [
    {"with": "Family/PCP/Specialist", "topic": "What to discuss", "timing": "When"}
  ],
  "anticipatedCourse": "Expected trajectory over next 24-72 hours"
}

Return ONLY valid JSON.`
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
    } else {
      throw new Error('Could not parse response');
    }

  } catch (error) {
    console.error('Care progression error:', error);
    res.status(500).json({ error: 'Failed to analyze care progression' });
  }
});

// Discharge Readiness Assessment endpoint
app.post('/api/discharge-readiness', async (req, res) => {
  try {
    const { clinicalContext, vitalsTrend, labsTrend, functionalStatus, socialSituation } = req.body;

    if (!clinicalContext) {
      return res.status(400).json({ error: 'Clinical context is required' });
    }

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are NeuroLogic Hospitalist Assistant. Perform a comprehensive discharge readiness assessment for this hospitalized patient.

CLINICAL CONTEXT:
${clinicalContext}

VITALS TREND:
${vitalsTrend || 'Not provided'}

LABS TREND:
${labsTrend || 'Not provided'}

FUNCTIONAL STATUS:
${functionalStatus || 'Not provided'}

SOCIAL SITUATION:
${socialSituation || 'Not provided'}

Evaluate discharge readiness and provide JSON response:
{
  "readinessScore": 0-100,
  "readinessCategory": "Not Ready/Approaching Ready/Ready with Conditions/Fully Ready",
  "estimatedDischargeWindow": "Today/Tomorrow/2-3 days/4-7 days/>7 days/Unable to estimate",
  "medicalStability": {
    "score": 0-100,
    "vitalsSafe": true/false,
    "oxygenRequirement": "None/Stable/Weaning/Escalating",
    "ivMedsRequired": true/false,
    "acuteIssuesResolved": true/false,
    "concerns": ["List of medical stability concerns"]
  },
  "functionalReadiness": {
    "score": 0-100,
    "mobilityStatus": "Independent/Supervision/Assistance/Dependent",
    "adlStatus": "Independent/Needs Help/Dependent",
    "safeForDischargeDisposition": true/false,
    "ptOtRecommendations": "Continue inpatient/Home PT/Outpatient/SNF level care",
    "concerns": ["Functional concerns"]
  },
  "dischargeDisposition": {
    "recommended": "Home/Home with Services/Rehab/SNF/LTACH",
    "alternatives": ["Alternative dispositions if primary not available"],
    "rationale": "Why this disposition"
  },
  "medicationReadiness": {
    "reconciliationComplete": true/false,
    "highRiskMeds": ["High risk medications requiring education"],
    "priorAuthNeeded": ["Meds needing prior auth"],
    "patientCanAfford": true/false/"unknown",
    "teachingComplete": true/false
  },
  "socialReadiness": {
    "score": 0-100,
    "hasCaregiver": true/false,
    "transportationArranged": true/false,
    "homeEnvironmentSafe": true/false,
    "dmeNeeds": ["DME needs"],
    "homeCareNeeds": ["Home health/services needs"],
    "concerns": ["Social concerns"]
  },
  "followUpPlan": {
    "pcpFollowUp": "Timeframe and status",
    "specialistFollowUp": [{"specialty": "Specialty", "timeframe": "When", "scheduled": true/false}],
    "labsNeeded": ["Outpatient labs needed"],
    "imagingNeeded": ["Outpatient imaging needed"]
  },
  "dischargeChecklist": [
    {"item": "Item", "status": "Complete/Incomplete/In Progress/N/A", "owner": "Who is responsible", "blocksDischarge": true/false}
  ],
  "barriers": [
    {"barrier": "Barrier description", "severity": "Critical/Major/Minor", "solution": "How to address", "estimatedResolution": "When"}
  ],
  "recommendations": [
    "Specific recommendations to expedite safe discharge"
  ]
}

Return ONLY valid JSON.`
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
    } else {
      throw new Error('Could not parse response');
    }

  } catch (error) {
    console.error('Discharge readiness error:', error);
    res.status(500).json({ error: 'Failed to assess discharge readiness' });
  }
});

// Transcription enhancement endpoint (optional - for improving raw transcripts)
app.post('/api/enhance-transcript', async (req, res) => {
  try {
    const { rawTranscript } = req.body;

    if (!rawTranscript) {
      return res.status(400).json({ error: 'Raw transcript is required' });
    }

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Clean up and enhance this medical dictation transcript. Fix grammar, punctuation, and medical terminology. Maintain the original meaning and all clinical details. Return only the enhanced transcript, no other text.

Raw transcript:
${rawTranscript}`
        }
      ]
    });

    res.json({
      success: true,
      enhancedTranscript: message.content[0].text
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance transcript' });
  }
});

// Code lookup endpoint (for ICD-10/CPT verification)
app.post('/api/lookup-codes', async (req, res) => {
  try {
    const { query, codeType } = req.body;

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Find relevant ${codeType === 'cpt' ? 'CPT procedure' : 'ICD-10 diagnosis'} codes for: "${query}"

Return as JSON array:
[{"code": "X00.0", "description": "Description", "category": "Category"}]

Return only the JSON array, no other text.`
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      res.json({
        success: true,
        codes: JSON.parse(jsonMatch[0])
      });
    } else {
      res.json({ success: true, codes: [] });
    }

  } catch (error) {
    console.error('Code lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup codes' });
  }
});

// ==================== Clinical Decision Support Endpoints ====================

// Clinical Calculator endpoint
app.post('/api/calculate', async (req, res) => {
  try {
    const { calculatorType, params } = req.body;

    if (!calculatorType || !params) {
      return res.status(400).json({ error: 'Calculator type and parameters required' });
    }

    const calculator = clinicalCalculators[calculatorType];
    if (!calculator) {
      return res.status(400).json({
        error: 'Invalid calculator type',
        available: Object.keys(clinicalCalculators)
      });
    }

    const result = calculator(params);
    res.json({ success: true, calculator: calculatorType, result });

  } catch (error) {
    console.error('Calculator error:', error);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

// Drug Interaction Check endpoint
app.post('/api/check-interactions', async (req, res) => {
  try {
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications)) {
      return res.status(400).json({ error: 'Medications array required' });
    }

    const interactions = [];
    const checked = new Set();

    for (let i = 0; i < medications.length; i++) {
      const drug1 = medications[i].toLowerCase();
      const drugInfo = drugInteractions[drug1];

      if (!drugInfo) continue;

      for (let j = i + 1; j < medications.length; j++) {
        const drug2 = medications[j].toLowerCase();
        const pairKey = [drug1, drug2].sort().join('-');

        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        let severity = null;
        if (drugInfo.severe?.includes(drug2)) {
          severity = 'severe';
        } else if (drugInfo.moderate?.includes(drug2)) {
          severity = 'moderate';
        }

        if (severity) {
          interactions.push({
            drug1,
            drug2,
            severity,
            mechanism: drugInfo.mechanism,
            monitoring: drugInfo.monitoring
          });
        }
      }
    }

    res.json({
      success: true,
      medicationsChecked: medications,
      interactionsFound: interactions.length,
      interactions
    });

  } catch (error) {
    console.error('Drug interaction error:', error);
    res.status(500).json({ error: 'Interaction check failed' });
  }
});

// Clinical Alerts Detection endpoint
app.post('/api/detect-alerts', async (req, res) => {
  try {
    const { clinicalData } = req.body;

    if (!clinicalData) {
      return res.status(400).json({ error: 'Clinical data required' });
    }

    const alerts = clinicalAlerts.detectAlerts(clinicalData);

    res.json({
      success: true,
      alertsFound: alerts.length,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
    });

  } catch (error) {
    console.error('Alert detection error:', error);
    res.status(500).json({ error: 'Alert detection failed' });
  }
});

// Clinical Guidelines endpoint
app.get('/api/guideline/:condition', (req, res) => {
  try {
    const { condition } = req.params;
    const guideline = clinicalGuidelines.getGuideline(condition);

    if (!guideline) {
      return res.status(404).json({
        error: 'Guideline not found',
        available: clinicalGuidelines.getAllConditions()
      });
    }

    res.json({ success: true, guideline });

  } catch (error) {
    console.error('Guideline error:', error);
    res.status(500).json({ error: 'Failed to retrieve guideline' });
  }
});

// List all available guidelines
app.get('/api/guidelines', (req, res) => {
  try {
    const conditions = clinicalGuidelines.getAllConditions();
    res.json({ success: true, conditions, count: conditions.length });
  } catch (error) {
    console.error('Guidelines list error:', error);
    res.status(500).json({ error: 'Failed to retrieve guidelines' });
  }
});

// AI-Enhanced Clinical Decision Support endpoint
app.post('/api/clinical-decision-support', async (req, res) => {
  try {
    const {
      clinicalScenario,
      patientData,
      question,
      includeCalculators,
      includeDrugInteractions,
      includeGuidelines
    } = req.body;

    if (!clinicalScenario && !question) {
      return res.status(400).json({ error: 'Clinical scenario or question required' });
    }

    // Build comprehensive prompt for Claude with cognitive bias detection
    const biasDetectionPrompt = generateBiasDetectionPrompt();

    let prompt = `You are NeuroLogic Clinical Decision Support AI. Provide evidence-based clinical decision support with explicit attention to cognitive biases and logical fallacies in clinical reasoning.

CLINICAL SCENARIO:
${clinicalScenario || 'Not provided'}

PATIENT DATA:
${JSON.stringify(patientData, null, 2) || 'Not provided'}

CLINICAL QUESTION:
${question || 'Provide comprehensive clinical decision support for this case'}

Please provide:
1. Clinical Assessment - Key findings and their significance
2. Differential Diagnosis - Ranked by likelihood with supporting evidence, including alternative diagnoses and atypical presentations
3. Recommended Workup - Diagnostic tests with rationale and priority
4. Evidence-Based Management - Treatment recommendations with references to guidelines
5. Risk Stratification - Identify high-risk features and prognosis
6. Disposition Recommendation - Admit vs discharge, level of care needed
7. Follow-up Plan - What to monitor and when
8. Red Flags - Warning signs requiring urgent action
9. Cognitive Bias Analysis - Identify potential cognitive biases affecting this clinical reasoning
10. Logical Reasoning Analysis - Assess for logical fallacies in the diagnostic or therapeutic reasoning

${biasDetectionPrompt}

Format as JSON:
{
  "assessment": "Clinical assessment text",
  "differentials": [
    {
      "diagnosis": "Diagnosis",
      "likelihood": "high/medium/low",
      "supportingEvidence": ["Evidence"],
      "contradictoryEvidence": ["Evidence that does not fit this diagnosis"],
      "mustNotMiss": false,
      "typicalPresentation": true/false,
      "alternativeExplanations": ["Alternative ways to explain the same findings"]
    }
  ],
  "alternativeDiagnoses": [
    {
      "diagnosis": "Less common but important alternative",
      "whyConsider": "Reason to consider this alternative",
      "distinguishingFeatures": "What would confirm or rule out",
      "consequenceOfMissing": "What happens if we miss this"
    }
  ],
  "workup": [
    {"test": "Test name", "rationale": "Why needed", "priority": "stat/urgent/routine", "willChangeManagement": true/false}
  ],
  "management": [
    {"recommendation": "Recommendation", "evidence": "Guideline or study", "priority": "high/medium/low", "alternatives": ["Alternative approaches"]}
  ],
  "riskFactors": ["Risk factor"],
  "prognosis": "Prognosis summary",
  "disposition": {
    "recommendation": "Admit/Discharge/Transfer",
    "levelOfCare": "ICU/Step-down/Floor/Observation/Home",
    "rationale": "Why"
  },
  "followUp": [
    {"action": "What to monitor", "timing": "When"}
  ],
  "redFlags": [
    {"finding": "Red flag", "action": "What to do"}
  ],
  "cognitiveBiases": [
    {
      "biasType": "Name of bias (e.g., Anchoring Bias, Confirmation Bias)",
      "evidence": "Specific evidence suggesting this bias may be present",
      "impact": "How this bias could affect clinical decision-making",
      "mitigation": "Specific strategies to mitigate this bias in this case"
    }
  ],
  "logicalFallacies": [
    {
      "fallacyType": "Name of fallacy (e.g., Post Hoc Ergo Propter Hoc)",
      "description": "How this fallacy manifests in the reasoning",
      "correction": "How to correct the reasoning"
    }
  ],
  "reasoningQuality": {
    "strengths": ["Strong aspects of the clinical reasoning"],
    "weaknesses": ["Gaps or weaknesses in the reasoning"],
    "uncertaintyFactors": ["Key uncertainties that should be acknowledged"],
    "recommendedApproach": "Overall recommendation for approaching this case to minimize cognitive errors"
  },
  "calculatorSuggestions": ["Suggested clinical calculators to use"],
  "guidelineReferences": ["Relevant clinical guidelines"]
}

IMPORTANT: Be thorough in identifying potential cognitive biases and logical fallacies. Even if the clinical reasoning appears sound, consider potential biases that could be present.

Return ONLY valid JSON.`;

    console.log(`[${new Date().toISOString()}] Processing clinical decision support request...`);

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const cdsResult = JSON.parse(jsonMatch[0]);

    // Add additional CDS features if requested
    const enhancedResult = {
      ...cdsResult,
      aiGenerated: true
    };

    // Detect clinical alerts
    if (patientData) {
      const alerts = clinicalAlerts.detectAlerts({ ...patientData, ...clinicalScenario });
      if (alerts.length > 0) {
        enhancedResult.automaticAlerts = alerts;
      }
    }

    // Check drug interactions if medications provided
    if (includeDrugInteractions && patientData?.medications) {
      const meds = Array.isArray(patientData.medications)
        ? patientData.medications
        : patientData.medications.split(',').map(m => m.trim());

      const interactions = [];
      const checked = new Set();

      for (let i = 0; i < meds.length; i++) {
        const drug1 = meds[i].toLowerCase();
        const drugInfo = drugInteractions[drug1];

        if (!drugInfo) continue;

        for (let j = i + 1; j < meds.length; j++) {
          const drug2 = meds[j].toLowerCase();
          const pairKey = [drug1, drug2].sort().join('-');

          if (checked.has(pairKey)) continue;
          checked.add(pairKey);

          let severity = null;
          if (drugInfo.severe?.includes(drug2)) {
            severity = 'severe';
          } else if (drugInfo.moderate?.includes(drug2)) {
            severity = 'moderate';
          }

          if (severity) {
            interactions.push({
              drug1,
              drug2,
              severity,
              mechanism: drugInfo.mechanism,
              monitoring: drugInfo.monitoring
            });
          }
        }
      }

      if (interactions.length > 0) {
        enhancedResult.drugInteractions = interactions;
      }
    }

    console.log(`[${new Date().toISOString()}] Clinical decision support complete`);

    res.json({
      success: true,
      data: enhancedResult,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('Clinical decision support error:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: error.message || 'Clinical decision support failed. Please try again.'
    });
  }
});

// Alternative Diagnosis Exploration endpoint
app.post('/api/explore-alternatives', async (req, res) => {
  try {
    const { clinicalScenario, currentDifferential, patientData } = req.body;

    if (!clinicalScenario || !currentDifferential) {
      return res.status(400).json({
        error: 'Clinical scenario and current differential diagnosis required'
      });
    }

    const explorationPrompt = generateAlternativeDiagnosisPrompt(currentDifferential);

    const prompt = `You are NeuroLogic Clinical Decision Support AI with expertise in metacognitive analysis and diagnostic reasoning.

CLINICAL SCENARIO:
${clinicalScenario}

PATIENT DATA:
${JSON.stringify(patientData, null, 2) || 'Not provided'}

${explorationPrompt}

Provide a comprehensive JSON response:
{
  "metacognitiveAnalysis": {
    "leadingDiagnosisChallenge": {
      "unexplainedFindings": ["Findings not explained by leading diagnosis"],
      "contradictoryEvidence": ["Evidence against leading diagnosis"],
      "missingExpectedFindings": ["What you would expect to see but don't"],
      "baseRateConsideration": "Is this diagnosis common enough to be likely in this population?",
      "anchoringRisk": "Assessment of whether anchoring bias is present"
    },
    "mustNotMissDiagnoses": [
      {
        "diagnosis": "Life-threatening or time-sensitive diagnosis",
        "presentation": "How it could present in this case",
        "consequence": "What happens if missed",
        "ruleOutStrategy": "How to definitively rule out"
      }
    ],
    "atypicalPresentations": [
      {
        "commonDiagnosis": "Common diagnosis that might present atypically",
        "atypicalFeatures": "What makes this presentation atypical",
        "modificyingFactors": "Age, gender, comorbidities affecting presentation"
      }
    ],
    "multipleDiagnoses": {
      "likelihood": "Could patient have >1 concurrent condition?",
      "possibleCombinations": [
        {
          "diagnoses": ["Diagnosis 1", "Diagnosis 2"],
          "rationale": "Why these might coexist",
          "howToDetect": "How to identify both"
        }
      ]
    },
    "systematicDifferential": {
      "vascular": ["Vascular causes"],
      "infectious": ["Infectious causes"],
      "neoplastic": ["Neoplastic causes"],
      "drugs": ["Drug-related causes"],
      "inflammatory": ["Inflammatory causes"],
      "congenital": ["Congenital causes"],
      "autoimmune": ["Autoimmune causes"],
      "trauma": ["Traumatic causes"],
      "endocrine": ["Endocrine causes"],
      "other": ["Other causes"]
    }
  },
  "expandedDifferential": [
    {
      "diagnosis": "Diagnosis",
      "likelihood": "high/medium/low/very low but important",
      "reasoning": "Explicit reasoning for inclusion",
      "supportingEvidence": ["Evidence for"],
      "contradictoryEvidence": ["Evidence against"],
      "distinguishingTest": "Single best test to confirm/exclude",
      "clinicalPearl": "Key clinical insight"
    }
  ],
  "diagnosticUncertainty": {
    "keyMissingInformation": ["What information would most reduce uncertainty"],
    "diagnosticTestUtility": [
      {
        "test": "Test name",
        "sensitivity": "High/Medium/Low",
        "specificity": "High/Medium/Low",
        "howItHelps": "How this test narrows the differential",
        "limitations": "What this test won't tell you"
      }
    ],
    "strengthOfEvidence": "Overall quality of evidence for leading diagnosis"
  },
  "cognitiveDebiasing": {
    "identifiedBiases": [
      {
        "bias": "Specific bias identified",
        "evidence": "Why you think this bias is present",
        "impact": "How it affects the differential"
      }
    ],
    "debiasStrategies": [
      "Specific strategies to reduce bias in this case"
    ],
    "prematureClosureRisk": "high/medium/low",
    "recommendedPause": "Specific prompts to force reconsideration"
  },
  "recommendations": [
    "Specific actionable recommendations for diagnostic approach"
  ]
}

Return ONLY valid JSON.`;

    console.log(`[${new Date().toISOString()}] Processing alternative diagnosis exploration...`);

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const explorationResult = JSON.parse(jsonMatch[0]);

    console.log(`[${new Date().toISOString()}] Alternative diagnosis exploration complete`);

    res.json({
      success: true,
      data: explorationResult,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('Alternative diagnosis exploration error:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: error.message || 'Alternative diagnosis exploration failed.'
    });
  }
});

// Cognitive Bias Analysis endpoint
app.post('/api/analyze-biases', async (req, res) => {
  try {
    const { clinicalReasoning, diagnosis, workup, management } = req.body;

    if (!clinicalReasoning && !diagnosis) {
      return res.status(400).json({
        error: 'Clinical reasoning or diagnosis information required'
      });
    }

    const biasPrompt = generateBiasDetectionPrompt();

    const prompt = `You are NeuroLogic Clinical Decision Support AI specializing in metacognitive analysis of clinical reasoning.

CLINICAL REASONING CHAIN:
${clinicalReasoning || 'Not provided'}

PROPOSED DIAGNOSIS:
${diagnosis || 'Not provided'}

DIAGNOSTIC WORKUP PLAN:
${JSON.stringify(workup, null, 2) || 'Not provided'}

MANAGEMENT PLAN:
${JSON.stringify(management, null, 2) || 'Not provided'}

${biasPrompt}

Provide a detailed analysis in JSON format:
{
  "overallReasoning": {
    "quality": "excellent/good/fair/poor",
    "summary": "Brief summary of reasoning quality",
    "logicalFlow": "Assessment of logical progression from data to conclusion"
  },
  "cognitiveBiases": [
    {
      "biasType": "Specific bias name",
      "severity": "high/medium/low",
      "evidence": "Specific evidence from the case",
      "clinicalExample": "How it manifests in this case",
      "potentialImpact": "How this could lead to diagnostic or therapeutic error",
      "mitigationStrategies": [
        "Specific action to take to mitigate this bias"
      ],
      "questionsToAsk": [
        "Specific questions clinician should ask themselves"
      ]
    }
  ],
  "logicalFallacies": [
    {
      "fallacyType": "Specific fallacy name",
      "description": "How it appears in this reasoning",
      "problemWithReasoning": "Why this is problematic",
      "correction": "How to correct the logical error",
      "alternativeReasoning": "Better logical approach"
    }
  ],
  "reasoningStrengths": [
    {
      "aspect": "What was done well",
      "example": "Specific example from the case"
    }
  ],
  "reasoningWeaknesses": [
    {
      "aspect": "What could be improved",
      "risk": "Potential risk this creates",
      "improvement": "How to improve"
    }
  ],
  "diagnosticErrors": {
    "noFaultErrors": ["Errors unavoidable due to disease presentation"],
    "systemErrors": ["Errors due to system issues"],
    "cognitiveErrors": ["Errors due to reasoning or bias"],
    "preventableErrors": ["Errors that could be prevented"]
  },
  "uncertaintyAssessment": {
    "acknowledgedUncertainties": ["Uncertainties appropriately recognized"],
    "unacknowledgedUncertainties": ["Uncertainties not addressed"],
    "recommendation": "How to better handle uncertainty"
  },
  "improvementRecommendations": [
    {
      "recommendation": "Specific recommendation",
      "rationale": "Why this would improve reasoning",
      "implementation": "How to implement"
    }
  ],
  "metacognitivePrompts": [
    "Question 1: Challenge your assumptions",
    "Question 2: Consider alternatives",
    "Question 3: What could you be missing?"
  ]
}

Return ONLY valid JSON.`;

    console.log(`[${new Date().toISOString()}] Processing cognitive bias analysis...`);

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const biasAnalysis = JSON.parse(jsonMatch[0]);

    console.log(`[${new Date().toISOString()}] Cognitive bias analysis complete`);

    res.json({
      success: true,
      data: biasAnalysis,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('Cognitive bias analysis error:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: error.message || 'Cognitive bias analysis failed.'
    });
  }
});

// Get cognitive biases and logical fallacies reference
app.get('/api/biases-fallacies-reference', (req, res) => {
  try {
    const reference = getAllBiasesAndFallacies();
    res.json({
      success: true,
      data: reference,
      description: 'Reference guide for cognitive biases and logical fallacies in clinical medicine'
    });
  } catch (error) {
    console.error('Reference retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve reference' });
  }
});

// ==================== Medical Image Analysis Endpoints ====================

// EKG Analysis endpoint
app.post('/api/analyze-ekg', async (req, res) => {
  try {
    const { image, clinicalContext, patientData } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'EKG image is required' });
    }

    // Extract base64 data and media type
    let imageData = image;
    let mediaType = 'image/jpeg';

    if (image.includes('base64,')) {
      const parts = image.split('base64,');
      imageData = parts[1];
      // Extract media type from data URL
      const match = parts[0].match(/data:([^;]+)/);
      if (match) mediaType = match[1];
    }

    const prompt = `You are NeuroLogic Clinical Decision Support AI specializing in EKG interpretation. Analyze this 12-lead EKG and provide a comprehensive interpretation.

PATIENT CLINICAL CONTEXT:
${clinicalContext || 'Not provided'}

PATIENT DATA:
${JSON.stringify(patientData, null, 2) || 'Not provided'}

Provide a detailed EKG interpretation in JSON format:
{
  "technicalQuality": {
    "quality": "excellent/good/fair/poor/uninterpretable",
    "issues": ["Any technical issues affecting interpretation"],
    "calibration": "Standard 10mm/mV and 25mm/sec or specify if different"
  },
  "rate": {
    "atrial": "beats per minute or description",
    "ventricular": "beats per minute",
    "interpretation": "Normal (60-100) / Bradycardia / Tachycardia"
  },
  "rhythm": {
    "description": "Sinus rhythm / Atrial fibrillation / etc.",
    "regularity": "Regular / Regularly irregular / Irregularly irregular",
    "pWaves": "Present, absent, or abnormal morphology",
    "prInterval": "Normal (120-200ms) / Short / Prolonged / Variable",
    "qrsComplex": "Narrow (<120ms) / Wide (>120ms)",
    "qtInterval": "Normal / Prolonged / Shortened",
    "qtcCalculated": "QTc in milliseconds if measurable"
  },
  "axis": {
    "frontalPlane": "Normal / Left axis deviation / Right axis deviation / Extreme axis",
    "degrees": "Approximate axis in degrees if determinable"
  },
  "intervals": {
    "pr": "Duration and interpretation",
    "qrs": "Duration and interpretation",
    "qt": "Duration",
    "qtc": "Corrected QT and interpretation"
  },
  "morphology": {
    "pWaves": "Normal / Peaked / Notched / Absent / Abnormal",
    "qrsComplex": "Normal / Pathologic Q waves / Poor R wave progression / Other",
    "stSegments": "Normal / Elevated / Depressed",
    "tWaves": "Normal / Inverted / Peaked / Flattened / Biphasic"
  },
  "findings": [
    {
      "category": "Normal Finding / Arrhythmia / Ischemia / Infarction / Hypertrophy / Conduction / Electrolyte / Other",
      "finding": "Specific finding",
      "severity": "Normal / Mild / Moderate / Severe / Critical",
      "leads": ["Leads where finding is present"],
      "clinicalSignificance": "Clinical importance of this finding",
      "acuity": "Acute / Chronic / Acute-on-chronic / Cannot determine"
    }
  ],
  "interpretation": {
    "primary": "Primary interpretation",
    "additional": ["Additional interpretations"],
    "comparison": "Comparison to prior EKGs if mentioned in clinical context",
    "clinicalCorrelation": "How EKG findings correlate with clinical presentation"
  },
  "acuteChanges": {
    "present": true/false,
    "stemi": {
      "present": true/false,
      "territory": "Anterior / Inferior / Lateral / Posterior / None",
      "leads": ["Leads with ST elevation"],
      "criteria": "Meets STEMI criteria: Yes/No with explanation"
    },
    "nstemi": {
      "possible": true/false,
      "findings": ["Findings suggestive of NSTEMI"]
    },
    "ischemia": {
      "present": true/false,
      "location": "Location of ischemic changes"
    }
  },
  "urgency": {
    "level": "Critical - immediate action / Urgent - prompt evaluation / Routine / Non-urgent",
    "reasoning": "Why this urgency level",
    "timeframe": "Immediate / Within 1 hour / Within 24 hours / Routine"
  },
  "recommendations": [
    {
      "action": "Specific recommendation",
      "priority": "Immediate / Urgent / Routine",
      "rationale": "Why this is recommended"
    }
  ],
  "differentialDiagnosis": [
    {
      "condition": "Possible cardiac condition",
      "likelihood": "high/medium/low",
      "supportingFindings": ["EKG findings supporting this"],
      "additionalWorkup": ["Tests to confirm or rule out"]
    }
  ],
  "criticalAlerts": [
    {
      "alert": "Critical finding requiring immediate attention",
      "action": "Required immediate action"
    }
  ]
}

IMPORTANT:
- Be systematic: rate, rhythm, axis, intervals, morphology, interpretation
- Note any STEMI criteria or acute changes
- Identify life-threatening findings
- Consider clinical context when interpreting findings
- Acknowledge limitations if image quality is poor
- Return ONLY valid JSON`;

    console.log(`[${new Date().toISOString()}] Processing EKG analysis...`);

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const ekgAnalysis = JSON.parse(jsonMatch[0]);

    console.log(`[${new Date().toISOString()}] EKG analysis complete`);

    res.json({
      success: true,
      data: ekgAnalysis,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('EKG analysis error:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: error.message || 'EKG analysis failed. Please try again.'
    });
  }
});

// Medical Imaging Analysis endpoint (X-ray, CT, MRI, etc.)
app.post('/api/analyze-imaging', async (req, res) => {
  try {
    const { image, imagingType, clinicalContext, patientData, clinicalQuestion } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Medical image is required' });
    }

    // Extract base64 data and media type
    let imageData = image;
    let mediaType = 'image/jpeg';

    if (image.includes('base64,')) {
      const parts = image.split('base64,');
      imageData = parts[1];
      const match = parts[0].match(/data:([^;]+)/);
      if (match) mediaType = match[1];
    }

    const imagingTypePrompts = {
      'chest-xray': 'chest X-ray (CXR)',
      'abdominal-xray': 'abdominal X-ray (AXR)',
      'ct-head': 'CT scan of the head',
      'ct-chest': 'CT scan of the chest',
      'ct-abdomen': 'CT scan of the abdomen/pelvis',
      'mri-brain': 'MRI of the brain',
      'mri-spine': 'MRI of the spine',
      'other': 'medical imaging study'
    };

    const studyType = imagingTypePrompts[imagingType] || imagingTypePrompts['other'];

    const prompt = `You are NeuroLogic Clinical Decision Support AI specializing in medical imaging interpretation. Analyze this ${studyType} and provide a systematic interpretation.

IMAGING TYPE: ${imagingType}

PATIENT CLINICAL CONTEXT:
${clinicalContext || 'Not provided'}

PATIENT DATA:
${JSON.stringify(patientData, null, 2) || 'Not provided'}

CLINICAL QUESTION:
${clinicalQuestion || 'General interpretation requested'}

Provide a comprehensive imaging interpretation in JSON format:
{
  "studyInformation": {
    "modalityConfirmed": "Type of study identified in image",
    "viewsPresent": ["AP / PA / Lateral / Axial / Sagittal / Coronal / Other views"],
    "technicalQuality": "excellent/good/fair/poor/limited",
    "limitations": ["Any technical limitations affecting interpretation"],
    "artifactsPresent": ["Motion artifact / Beam hardening / Other"]
  },
  "systematicReview": {
    "primaryFindings": [
      {
        "anatomicalLocation": "Specific location of finding",
        "finding": "Description of finding",
        "size": "Size/measurements if applicable",
        "characteristics": "Detailed characteristics",
        "significance": "Clinical significance",
        "acuity": "Acute / Chronic / Acute-on-chronic / Indeterminate"
      }
    ],
    "normalFindings": ["Important normal findings to document"],
    "comparison": "Comparison to prior studies if mentioned in context"
  },
  "organSystemReview": {
    "description": "Systematic review by organ system or anatomical region",
    "details": [
      {
        "system": "Organ system or region",
        "findings": "Normal or abnormal findings",
        "significance": "Clinical relevance"
      }
    ]
  },
  "impressions": [
    {
      "finding": "Key impression",
      "severity": "Normal / Mild / Moderate / Severe / Critical",
      "urgency": "Critical / Urgent / Non-urgent",
      "confidence": "High / Moderate / Low"
    }
  ],
  "acuteFindings": {
    "present": true/false,
    "criticalFindings": [
      {
        "finding": "Critical finding requiring immediate attention",
        "location": "Anatomical location",
        "clinicalAction": "Recommended immediate action",
        "timeframe": "Immediate / Within 1 hour / Within hours"
      }
    ]
  },
  "differentialDiagnosis": [
    {
      "diagnosis": "Possible diagnosis based on imaging",
      "likelihood": "high/medium/low",
      "supportingFeatures": ["Imaging features supporting this"],
      "distinguishingFeatures": ["What would help differentiate"],
      "additionalWorkup": ["Recommended additional imaging or tests"]
    }
  ],
  "recommendations": {
    "immediate": [
      {
        "recommendation": "Immediate recommendation",
        "rationale": "Why this is needed now"
      }
    ],
    "followUp": [
      {
        "recommendation": "Follow-up recommendation",
        "timeframe": "When to perform",
        "rationale": "Why this is recommended"
      }
    ],
    "clinicalCorrelation": [
      "Specific clinical correlation needed"
    ],
    "furtherImaging": [
      {
        "modality": "Recommended imaging modality",
        "indication": "What this would evaluate",
        "urgency": "Stat / Urgent / Routine"
      }
    ]
  },
  "clinicalContext": {
    "correlationWithSymptoms": "How findings correlate with clinical presentation",
    "unexpectedFindings": ["Findings not explained by clinical history"],
    "incidentalFindings": [
      {
        "finding": "Incidental finding",
        "significance": "Clinical significance",
        "followUp": "Follow-up recommendation"
      }
    ]
  },
  "urgencyAssessment": {
    "overallUrgency": "Critical / Urgent / Routine",
    "reasoning": "Why this urgency level",
    "communicationNeeded": "Immediate physician notification / Routine report / Other",
    "criticalResultCommunicated": true/false
  }
}

IMPORTANT:
- Provide systematic interpretation (not just identifying abnormalities)
- Identify any critical or urgent findings first
- Consider clinical context when interpreting findings
- Acknowledge limitations if image quality or views are limited
- Note incidental findings that may be clinically relevant
- Be specific about locations, sizes, and characteristics
- Return ONLY valid JSON`;

    console.log(`[${new Date().toISOString()}] Processing medical imaging analysis...`);

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const imagingAnalysis = JSON.parse(jsonMatch[0]);

    console.log(`[${new Date().toISOString()}] Medical imaging analysis complete`);

    res.json({
      success: true,
      data: imagingAnalysis,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('Medical imaging analysis error:', error);

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.'
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: error.message || 'Medical imaging analysis failed. Please try again.'
    });
  }
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Listen on 0.0.0.0 for Railway/Docker compatibility
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           NeuroLogic Hospitalist Assistant                 ║
╠═══════════════════════════════════════════════════════════╣
║  Status:  Running                                          ║
║  Host:    ${HOST}                                              ║
║  Port:    ${PORT}                                              ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                                     ║
║  API:     ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : 'Missing ✗'}                                   ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Log warning if API key is missing
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('\n⚠️  WARNING: ANTHROPIC_API_KEY is not set!');
    console.warn('   The application will not work without this environment variable.');
    console.warn('   Please set it in your Railway dashboard: Variables tab\n');
  }
});

export default app;
