/**
 * Clinical Decision Support API Examples
 *
 * These examples demonstrate how to use the NeuroLogic
 * Clinical Decision Support endpoints
 */

const API_URL = 'http://localhost:3001';

// ==================== 1. Clinical Calculator Example ====================

async function exampleCURB65() {
  console.log('\n========== CURB-65 Calculator Example ==========\n');

  const response = await fetch(`${API_URL}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calculatorType: 'curb65',
      params: {
        confusion: true,
        urea: 25,  // BUN >19 mg/dL
        respiratoryRate: 32,
        bloodPressure: { systolic: 85, diastolic: 55 },
        age: 78
      }
    })
  });

  const result = await response.json();
  console.log('CURB-65 Result:');
  console.log(`  Score: ${result.result.score}/${result.result.maxScore}`);
  console.log(`  Risk: ${result.result.risk}`);
  console.log(`  Recommendation: ${result.result.recommendation}`);
  console.log(`  Components:`);
  result.result.components.forEach(c => console.log(`    - ${c}`));
}

async function exampleCHADS2VASc() {
  console.log('\n========== CHA2DS2-VASc Calculator Example ==========\n');

  const response = await fetch(`${API_URL}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calculatorType: 'chads2vasc',
      params: {
        chf: true,
        hypertension: true,
        age: 76,
        diabetes: false,
        stroke: false,
        vascular: true,
        sex: 'female'
      }
    })
  });

  const result = await response.json();
  console.log('CHA2DS2-VASc Result:');
  console.log(`  Score: ${result.result.score}/${result.result.maxScore}`);
  console.log(`  Annual Stroke Risk: ${result.result.annualStrokeRisk}`);
  console.log(`  Recommendation: ${result.result.recommendation}`);
  console.log(`  Components:`);
  result.result.components.forEach(c => console.log(`    - ${c}`));
}

async function exampleWellsDVT() {
  console.log('\n========== Wells DVT Score Example ==========\n');

  const response = await fetch(`${API_URL}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calculatorType: 'wellsDVT',
      params: {
        activeCancer: true,
        paralysisOrImmobilization: false,
        recentBedrest: true,
        localizedTenderness: true,
        entireLegSwollen: false,
        calfSwelling: true,
        pittingEdema: true,
        collateralVeins: false,
        previousDVT: false,
        alternativeDiagnosis: false
      }
    })
  });

  const result = await response.json();
  console.log('Wells DVT Result:');
  console.log(`  Score: ${result.result.score}`);
  console.log(`  Risk: ${result.result.risk}`);
  console.log(`  DVT Probability: ${result.result.dvtProbability}`);
  console.log(`  Recommendation: ${result.result.recommendation}`);
}

// ==================== 2. Drug Interaction Example ====================

async function exampleDrugInteractions() {
  console.log('\n========== Drug Interaction Check Example ==========\n');

  const response = await fetch(`${API_URL}/api/check-interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      medications: ['warfarin', 'aspirin', 'amiodarone', 'digoxin', 'simvastatin']
    })
  });

  const result = await response.json();
  console.log(`Checked ${result.medicationsChecked.length} medications`);
  console.log(`Found ${result.interactionsFound} interactions:\n`);

  result.interactions.forEach((interaction, i) => {
    console.log(`${i + 1}. ${interaction.drug1.toUpperCase()} + ${interaction.drug2.toUpperCase()}`);
    console.log(`   Severity: ${interaction.severity.toUpperCase()}`);
    console.log(`   Mechanism: ${interaction.mechanism}`);
    console.log(`   Monitoring: ${interaction.monitoring}\n`);
  });
}

// ==================== 3. Clinical Alerts Example ====================

async function exampleClinicalAlerts() {
  console.log('\n========== Clinical Alerts Detection Example ==========\n');

  const response = await fetch(`${API_URL}/api/detect-alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinicalData: {
        vitals: 'BP 82/50, HR 125, RR 32, T 102.5, SpO2 85% on 2L',
        labs: 'WBC 22, lactate 5.2, troponin 3.5, potassium 6.8, INR 8.5',
        assessment: 'Patient with fever, hypotension, tachycardia, confusion, appears septic'
      }
    })
  });

  const result = await response.json();
  console.log(`Detected ${result.alertsFound} clinical alerts:\n`);

  result.alerts.forEach((alert, i) => {
    console.log(`${i + 1}. [${alert.severity.toUpperCase()}] ${alert.alert}`);
    console.log(`   Category: ${alert.category}`);
    console.log(`   Detail: ${alert.detail}`);
    console.log(`   Action: ${alert.action}\n`);
  });
}

// ==================== 4. Clinical Guidelines Example ====================

async function exampleGuideline() {
  console.log('\n========== Clinical Guideline Example ==========\n');

  const response = await fetch(`${API_URL}/api/guideline/pneumonia`);
  const result = await response.json();

  const guideline = result.guideline;
  console.log(`Condition: ${guideline.condition}`);
  console.log(`Source: ${guideline.source}\n`);

  console.log('Key Management Points:');
  guideline.keyPoints.forEach((point, i) => {
    console.log(`  ${i + 1}. ${point}`);
  });

  console.log('\nRecommended Workup:');
  guideline.workup.forEach(test => console.log(`  - ${test}`));

  console.log('\nRed Flags:');
  guideline.redFlags.forEach(flag => console.log(`  ⚠️  ${flag}`));
}

async function listAllGuidelines() {
  console.log('\n========== Available Guidelines ==========\n');

  const response = await fetch(`${API_URL}/api/guidelines`);
  const result = await response.json();

  console.log(`Total Guidelines Available: ${result.count}\n`);
  result.conditions.forEach((condition, i) => {
    console.log(`  ${i + 1}. ${condition}`);
  });
}

// ==================== 5. Comprehensive CDS Example ====================

async function exampleComprehensiveCDS() {
  console.log('\n========== Comprehensive Clinical Decision Support ==========\n');

  const response = await fetch(`${API_URL}/api/clinical-decision-support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinicalScenario: `68 year old male with 3 days of fever, productive cough, dyspnea.
                         CXR shows right lower lobe infiltrate. Appears moderately ill.`,
      patientData: {
        age: 68,
        vitals: 'BP 110/70, HR 102, RR 24, T 101.8, SpO2 91% on room air',
        labs: 'WBC 15.2, Neutrophils 85%, Cr 1.2 (baseline 1.0), BUN 28',
        pmh: 'COPD, HTN, Type 2 DM, former smoker (40 pack-years)',
        medications: ['lisinopril', 'metformin', 'albuterol', 'tiotropium']
      },
      question: 'Should this patient be admitted? What is the recommended antibiotic regimen?',
      includeDrugInteractions: true
    })
  });

  const result = await response.json();
  const data = result.data;

  console.log('CLINICAL ASSESSMENT:');
  console.log(data.assessment);

  console.log('\n\nDIFFERENTIAL DIAGNOSIS:');
  data.differentials.forEach((dx, i) => {
    console.log(`\n${i + 1}. ${dx.diagnosis} (${dx.likelihood} likelihood)`);
    console.log(`   Supporting Evidence:`);
    dx.supportingEvidence.forEach(e => console.log(`   - ${e}`));
  });

  console.log('\n\nRECOMMENDED WORKUP:');
  data.workup.forEach(test => {
    console.log(`\n- ${test.test} [${test.priority.toUpperCase()}]`);
    console.log(`  Rationale: ${test.rationale}`);
  });

  console.log('\n\nMANAGEMENT RECOMMENDATIONS:');
  data.management.forEach((rec, i) => {
    console.log(`\n${i + 1}. [${rec.priority.toUpperCase()}] ${rec.recommendation}`);
    console.log(`   Evidence: ${rec.evidence}`);
  });

  console.log('\n\nDISPOSITION:');
  console.log(`Recommendation: ${data.disposition.recommendation}`);
  console.log(`Level of Care: ${data.disposition.levelOfCare}`);
  console.log(`Rationale: ${data.disposition.rationale}`);

  if (data.automaticAlerts && data.automaticAlerts.length > 0) {
    console.log('\n\n⚠️  AUTOMATIC ALERTS DETECTED:');
    data.automaticAlerts.forEach(alert => {
      console.log(`\n[${alert.severity.toUpperCase()}] ${alert.alert}`);
      console.log(`Action: ${alert.action}`);
    });
  }

  if (data.drugInteractions && data.drugInteractions.length > 0) {
    console.log('\n\n💊 DRUG INTERACTIONS DETECTED:');
    data.drugInteractions.forEach(interaction => {
      console.log(`\n${interaction.drug1} + ${interaction.drug2} [${interaction.severity.toUpperCase()}]`);
      console.log(`Monitoring: ${interaction.monitoring}`);
    });
  }

  console.log('\n\nRED FLAGS TO MONITOR:');
  data.redFlags.forEach(flag => {
    console.log(`\n⚠️  ${flag.finding}`);
    console.log(`   Action: ${flag.action}`);
  });
}

// ==================== Run All Examples ====================

async function runAllExamples() {
  try {
    await exampleCURB65();
    await exampleCHADS2VASc();
    await exampleWellsDVT();
    await exampleDrugInteractions();
    await exampleClinicalAlerts();
    await exampleGuideline();
    await listAllGuidelines();
    await exampleComprehensiveCDS();

    console.log('\n\n========== All Examples Complete ==========\n');
  } catch (error) {
    console.error('Error running examples:', error.message);
    console.error('Make sure the server is running on http://localhost:3001');
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  exampleCURB65,
  exampleCHADS2VASc,
  exampleWellsDVT,
  exampleDrugInteractions,
  exampleClinicalAlerts,
  exampleGuideline,
  listAllGuidelines,
  exampleComprehensiveCDS,
  runAllExamples
};
