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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NeuroLogic Hospitalist Assistant', timestamp: new Date().toISOString() });
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

    const message = await anthropic.messages.create({
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

    const message = await anthropic.messages.create({
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

    const message = await anthropic.messages.create({
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

    const message = await anthropic.messages.create({
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

    const message = await anthropic.messages.create({
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

    // Build comprehensive prompt for Claude
    let prompt = `You are NeuroLogic Clinical Decision Support AI. Provide evidence-based clinical decision support.

CLINICAL SCENARIO:
${clinicalScenario || 'Not provided'}

PATIENT DATA:
${JSON.stringify(patientData, null, 2) || 'Not provided'}

CLINICAL QUESTION:
${question || 'Provide comprehensive clinical decision support for this case'}

Please provide:
1. Clinical Assessment - Key findings and their significance
2. Differential Diagnosis - Ranked by likelihood with supporting evidence
3. Recommended Workup - Diagnostic tests with rationale and priority
4. Evidence-Based Management - Treatment recommendations with references to guidelines
5. Risk Stratification - Identify high-risk features and prognosis
6. Disposition Recommendation - Admit vs discharge, level of care needed
7. Follow-up Plan - What to monitor and when
8. Red Flags - Warning signs requiring urgent action

Format as JSON:
{
  "assessment": "Clinical assessment text",
  "differentials": [
    {"diagnosis": "Diagnosis", "likelihood": "high/medium/low", "supportingEvidence": ["Evidence"]}
  ],
  "workup": [
    {"test": "Test name", "rationale": "Why needed", "priority": "stat/urgent/routine"}
  ],
  "management": [
    {"recommendation": "Recommendation", "evidence": "Guideline or study", "priority": "high/medium/low"}
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
  "calculatorSuggestions": ["Suggested clinical calculators to use"],
  "guidelineReferences": ["Relevant clinical guidelines"]
}

Return ONLY valid JSON.`;

    console.log(`[${new Date().toISOString()}] Processing clinical decision support request...`);

    const message = await anthropic.messages.create({
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

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           NeuroLogic Hospitalist Assistant                 ║
╠═══════════════════════════════════════════════════════════╣
║  Status:  Running                                          ║
║  Port:    ${PORT}                                              ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                                     ║
║  API:     ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : 'Missing ✗'}                                   ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
