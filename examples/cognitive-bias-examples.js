/**
 * Cognitive Bias Detection and Alternative Diagnosis Examples
 *
 * This file demonstrates how to use the new cognitive bias detection,
 * logical fallacy analysis, and alternative diagnosis exploration features.
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Example 1: Enhanced Clinical Decision Support with Bias Detection
 *
 * This example shows how the main CDS endpoint now includes cognitive bias
 * and logical fallacy detection automatically.
 */
async function example1_enhancedCDS() {
  console.log('\n=== Example 1: Enhanced CDS with Bias Detection ===\n');

  const clinicalScenario = `
    Patient: 72-year-old woman
    Presentation: 3 days of progressive confusion, fever to 101.5°F, dysuria
    Vitals: BP 110/70, HR 95, RR 18, Temp 101.5°F
    Labs:
      - WBC 14.5 (elevated)
      - UA: Positive leukocyte esterase, nitrites positive
      - Basic metabolic panel: Within normal limits

    Initial impression: UTI with delirium
    Plan: Start antibiotics, monitor mental status
  `;

  try {
    const response = await fetch(`${API_URL}/api/clinical-decision-support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicalScenario,
        patientData: {
          age: 72,
          gender: 'female',
          vitals: {
            temp: 101.5,
            bp: '110/70',
            hr: 95,
            rr: 18
          },
          labs: {
            wbc: 14.5,
            ua: 'positive LE and nitrites'
          }
        },
        question: 'Provide comprehensive assessment with cognitive bias analysis'
      })
    });

    const result = await response.json();

    console.log('Assessment:', result.data.assessment);
    console.log('\nDifferential Diagnoses:');
    result.data.differentials?.forEach(dx => {
      console.log(`- ${dx.diagnosis} (${dx.likelihood})`);
      console.log(`  Evidence: ${dx.supportingEvidence?.join(', ')}`);
    });

    console.log('\n⚠️  Cognitive Biases Detected:');
    result.data.cognitiveBiases?.forEach(bias => {
      console.log(`\n${bias.biasType} [${bias.severity || 'moderate'}]`);
      console.log(`Evidence: ${bias.evidence}`);
      console.log(`Impact: ${bias.impact}`);
      console.log(`Mitigation: ${bias.mitigation}`);
    });

    console.log('\n🔍 Alternative Diagnoses to Consider:');
    result.data.alternativeDiagnoses?.forEach(alt => {
      console.log(`\n${alt.diagnosis}`);
      console.log(`Why: ${alt.whyConsider}`);
      console.log(`Distinguish: ${alt.distinguishingFeatures}`);
      console.log(`If missed: ${alt.consequenceOfMissing}`);
    });

    console.log('\n📊 Reasoning Quality:');
    console.log('Strengths:', result.data.reasoningQuality?.strengths);
    console.log('Weaknesses:', result.data.reasoningQuality?.weaknesses);
    console.log('Uncertainties:', result.data.reasoningQuality?.uncertaintyFactors);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 2: Alternative Diagnosis Exploration
 *
 * Deep dive into alternative diagnoses with metacognitive analysis.
 * Useful when you have a working diagnosis but want to challenge it.
 */
async function example2_exploreAlternatives() {
  console.log('\n=== Example 2: Alternative Diagnosis Exploration ===\n');

  const clinicalScenario = `
    Patient: 22-year-old male college athlete
    Chief complaint: Chest pain during basketball practice
    History:
      - Sharp chest pain, left-sided, worse with deep breath
      - Occurred suddenly during intense play
      - No prior cardiac history
      - Father died suddenly at age 45 (unknown cause)

    Physical exam:
      - Chest wall tenderness present
      - Lungs clear bilaterally
      - Heart: Regular rate and rhythm, no murmurs
      - Normal ECG (limited interpretation)

    Initial differential:
      1. Costochondritis (most likely)
      2. Muscle strain
      3. Anxiety/panic
  `;

  try {
    const response = await fetch(`${API_URL}/api/explore-alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicalScenario,
        currentDifferential: [
          'Costochondritis',
          'Muscle strain',
          'Anxiety'
        ],
        patientData: {
          age: 22,
          gender: 'male',
          athlete: true,
          familyHistory: 'sudden cardiac death in father at age 45',
          symptoms: ['chest pain', 'exertional', 'pleuritic']
        }
      })
    });

    const result = await response.json();
    const analysis = result.data;

    console.log('🔍 METACOGNITIVE ANALYSIS:\n');

    console.log('Challenge to Leading Diagnosis:');
    console.log('- Unexplained findings:', analysis.metacognitiveAnalysis.leadingDiagnosisChallenge.unexplainedFindings);
    console.log('- Contradictory evidence:', analysis.metacognitiveAnalysis.leadingDiagnosisChallenge.contradictoryEvidence);
    console.log('- Anchoring risk:', analysis.metacognitiveAnalysis.leadingDiagnosisChallenge.anchoringRisk);

    console.log('\n🚨 MUST-NOT-MISS DIAGNOSES:');
    analysis.metacognitiveAnalysis.mustNotMissDiagnoses?.forEach(dx => {
      console.log(`\n${dx.diagnosis}`);
      console.log(`Presentation: ${dx.presentation}`);
      console.log(`Consequence: ${dx.consequence}`);
      console.log(`Rule out: ${dx.ruleOutStrategy}`);
    });

    console.log('\n🔄 ATYPICAL PRESENTATIONS:');
    analysis.metacognitiveAnalysis.atypicalPresentations?.forEach(atyp => {
      console.log(`\n${atyp.commonDiagnosis}`);
      console.log(`Atypical features: ${atyp.atypicalFeatures}`);
      console.log(`Modifying factors: ${atyp.modificyingFactors}`);
    });

    console.log('\n🧩 SYSTEMATIC DIFFERENTIAL (VINDICATE):');
    Object.entries(analysis.metacognitiveAnalysis.systematicDifferential || {}).forEach(([category, diagnoses]) => {
      if (diagnoses?.length > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        diagnoses.forEach(dx => console.log(`  - ${dx}`));
      }
    });

    console.log('\n💡 DEBIASING STRATEGIES:');
    analysis.cognitiveDebiasing?.debiasStrategies?.forEach(strategy => {
      console.log(`- ${strategy}`);
    });

    console.log(`\nPremature Closure Risk: ${analysis.cognitiveDebiasing?.prematureClosureRisk?.toUpperCase()}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 3: Dedicated Cognitive Bias Analysis
 *
 * Analyze specific clinical reasoning for biases and fallacies.
 * Useful for education, quality improvement, or second opinions.
 */
async function example3_analyzeBiases() {
  console.log('\n=== Example 3: Cognitive Bias Analysis ===\n');

  const clinicalReasoning = `
    This patient is a 45-year-old woman who frequently visits the ED
    for various non-specific complaints. She has a documented history
    of anxiety and depression. Today she presents with diffuse abdominal
    pain. Her last visit was 2 days ago for back pain, which resolved
    spontaneously.

    Given her pattern of frequent visits and psychiatric history,
    this is likely another anxiety-related somatic complaint.
    Physical exam shows mild diffuse tenderness but no peritoneal signs.

    Plan: Reassurance, follow up with PCP, possible anxiolytic.
    Discharge home.
  `;

  try {
    const response = await fetch(`${API_URL}/api/analyze-biases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicalReasoning,
        diagnosis: 'Anxiety-related somatic complaint',
        workup: [
          { test: 'Basic labs', rationale: 'Rule out obvious abnormalities' }
        ],
        management: [
          { recommendation: 'Reassurance', priority: 'high' },
          { recommendation: 'PCP follow-up', priority: 'medium' },
          { recommendation: 'Consider anxiolytic', priority: 'low' }
        ]
      })
    });

    const result = await response.json();
    const analysis = result.data;

    console.log('Overall Reasoning Quality:', analysis.overallReasoning.quality.toUpperCase());
    console.log('Summary:', analysis.overallReasoning.summary);
    console.log('Logical Flow:', analysis.overallReasoning.logicalFlow);

    console.log('\n⚠️  COGNITIVE BIASES IDENTIFIED:\n');
    analysis.cognitiveBiases?.forEach((bias, i) => {
      console.log(`${i + 1}. ${bias.biasType} [Severity: ${bias.severity?.toUpperCase()}]`);
      console.log(`   Evidence: ${bias.evidence}`);
      console.log(`   Clinical Impact: ${bias.potentialImpact}`);
      console.log(`   Mitigation:`);
      bias.mitigationStrategies?.forEach(strat => console.log(`     - ${strat}`));
      console.log(`   Questions to Ask:`);
      bias.questionsToAsk?.forEach(q => console.log(`     ? ${q}`));
      console.log('');
    });

    console.log('\n🔴 LOGICAL FALLACIES:\n');
    analysis.logicalFallacies?.forEach((fallacy, i) => {
      console.log(`${i + 1}. ${fallacy.fallacyType}`);
      console.log(`   Description: ${fallacy.description}`);
      console.log(`   Problem: ${fallacy.problemWithReasoning}`);
      console.log(`   Correction: ${fallacy.correction}`);
      console.log('');
    });

    console.log('\n📈 STRENGTHS:');
    analysis.reasoningStrengths?.forEach(s => {
      console.log(`✓ ${s.aspect}: ${s.example}`);
    });

    console.log('\n📉 WEAKNESSES:');
    analysis.reasoningWeaknesses?.forEach(w => {
      console.log(`⚠ ${w.aspect}`);
      console.log(`  Risk: ${w.risk}`);
      console.log(`  Improvement: ${w.improvement}`);
    });

    console.log('\n🎯 DIAGNOSTIC ERROR CATEGORIZATION:');
    console.log('Cognitive errors:', analysis.diagnosticErrors?.cognitiveErrors);
    console.log('Preventable errors:', analysis.diagnosticErrors?.preventableErrors);

    console.log('\n💭 METACOGNITIVE PROMPTS:');
    analysis.metacognitivePrompts?.forEach(prompt => console.log(`? ${prompt}`));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 4: Getting the Reference Guide
 *
 * Retrieve comprehensive information about all cognitive biases
 * and logical fallacies for educational purposes.
 */
async function example4_referenceGuide() {
  console.log('\n=== Example 4: Cognitive Bias Reference Guide ===\n');

  try {
    const response = await fetch(`${API_URL}/api/biases-fallacies-reference`);
    const result = await response.json();

    console.log('📚 COGNITIVE BIASES:\n');
    Object.entries(result.data.cognitiveBiases).slice(0, 3).forEach(([key, bias]) => {
      console.log(`${bias.name}:`);
      console.log(`  Description: ${bias.description}`);
      console.log(`  Clinical Example: ${bias.clinicalExample}`);
      console.log(`  Mitigation: ${bias.mitigation}`);
      console.log(`  Risk Factors: ${bias.riskFactors?.join(', ')}`);
      console.log('');
    });

    console.log('\n📚 LOGICAL FALLACIES:\n');
    Object.entries(result.data.logicalFallacies).slice(0, 3).forEach(([key, fallacy]) => {
      console.log(`${fallacy.name}:`);
      console.log(`  Description: ${fallacy.description}`);
      console.log(`  Clinical Example: ${fallacy.clinicalExample}`);
      console.log(`  Mitigation: ${fallacy.mitigation}`);
      console.log('');
    });

    console.log(`\nTotal Biases: ${Object.keys(result.data.cognitiveBiases).length}`);
    console.log(`Total Fallacies: ${Object.keys(result.data.logicalFallacies).length}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 5: Integration with Main Analysis Workflow
 *
 * Shows how bias detection integrates with the main note generation.
 */
async function example5_integratedWorkflow() {
  console.log('\n=== Example 5: Integrated Workflow ===\n');

  const transcript = `
    Patient is a 58-year-old man with history of hypertension and
    hyperlipidemia presenting with substernal chest pressure.

    He was watching TV when he developed 7 out of 10 pressure-like
    chest discomfort radiating to left arm. Associated with diaphoresis
    and mild dyspnea. Took 2 Tums with no relief. Called 911.

    In the ED, initial ECG shows some ST depressions in lateral leads.
    Troponin is mildly elevated at 0.8. Aspirin and heparin given.
  `;

  const clinicalContext = `
    PMH: Hypertension, hyperlipidemia, prediabetes
    Medications: Lisinopril 20mg daily, Atorvastatin 40mg daily
    Social: Former smoker (quit 5 years ago), occasional alcohol
    Family history: Father with MI at age 62

    Vitals: BP 155/92, HR 98, RR 20, O2 sat 96% on RA, Temp 98.2F

    Labs:
      Troponin: 0.8 ng/mL (normal <0.04)
      BNP: 85 pg/mL
      D-dimer: 0.3 mcg/mL
      CBC: WBC 8.5, Hgb 14.2, Plt 245
      BMP: Na 138, K 4.2, Cr 1.1, Glucose 118
  `;

  try {
    // First, generate the clinical note
    const analysisResponse = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        clinicalContext,
        noteType: 'hp'
      })
    });

    const analysisResult = await analysisResponse.json();

    console.log('Structured Note Generated ✓');
    console.log(`ICD-10 Codes: ${analysisResult.data.icd10Codes?.length || 0}`);
    console.log(`CPT Codes: ${analysisResult.data.cptCodes?.length || 0}`);

    // Then, get enhanced CDS with bias detection
    const cdsResponse = await fetch(`${API_URL}/api/clinical-decision-support`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicalScenario: `${transcript}\n\nClinical Context:\n${clinicalContext}`,
        patientData: {
          age: 58,
          gender: 'male',
          riskFactors: ['hypertension', 'hyperlipidemia', 'prediabetes', 'former smoker', 'family history']
        }
      })
    });

    const cdsResult = await cdsResponse.json();

    console.log('\n📊 Clinical Decision Support:');
    console.log(`- Differentials: ${cdsResult.data.differentials?.length || 0}`);
    console.log(`- Workup recommendations: ${cdsResult.data.workup?.length || 0}`);
    console.log(`- Management suggestions: ${cdsResult.data.management?.length || 0}`);

    console.log('\n⚠️  Bias Alerts:');
    if (cdsResult.data.cognitiveBiases?.length > 0) {
      cdsResult.data.cognitiveBiases.forEach(bias => {
        console.log(`- ${bias.biasType}: ${bias.evidence?.substring(0, 100)}...`);
      });
    } else {
      console.log('No significant biases detected');
    }

    console.log('\n🔍 Alternative Diagnoses:');
    if (cdsResult.data.alternativeDiagnoses?.length > 0) {
      cdsResult.data.alternativeDiagnoses.forEach(alt => {
        console.log(`- ${alt.diagnosis}: ${alt.whyConsider?.substring(0, 100)}...`);
      });
    } else {
      console.log('Primary differential appears comprehensive');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   NeuroLogic Cognitive Bias Detection Examples            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Run all examples
  await example1_enhancedCDS();
  await example2_exploreAlternatives();
  await example3_analyzeBiases();
  await example4_referenceGuide();
  await example5_integratedWorkflow();

  console.log('\n✅ All examples completed!\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  example1_enhancedCDS,
  example2_exploreAlternatives,
  example3_analyzeBiases,
  example4_referenceGuide,
  example5_integratedWorkflow
};
