/**
 * Cognitive Bias and Logical Fallacy Detection Module
 *
 * This module provides definitions and detection strategies for common
 * cognitive biases and logical fallacies in clinical decision making.
 */

/**
 * Common cognitive biases in clinical medicine
 * Each bias includes:
 * - name: The name of the bias
 * - description: What it is and how it manifests
 * - clinicalExample: A concrete clinical scenario
 * - detectionPrompt: How to prompt AI to detect this bias
 * - mitigation: Strategies to overcome the bias
 */
const cognitiveBiases = {
  anchoringBias: {
    name: 'Anchoring Bias',
    description: 'Over-reliance on the first piece of information encountered (initial diagnosis, initial vital sign, or first impression). Subsequent information is interpreted in light of this anchor.',
    clinicalExample: 'A patient presents with chest pain. Initial EKG is normal, leading clinician to anchor on "non-cardiac" diagnosis and potentially miss acute coronary syndrome despite evolving symptoms.',
    detectionPrompt: 'Is there evidence of over-reliance on initial findings or first impressions? Are alternative explanations being adequately considered despite initial data?',
    mitigation: 'Actively seek disconfirming evidence. Re-evaluate the initial hypothesis when new data emerges. Use systematic differential diagnosis approaches.',
    riskFactors: ['Initial diagnosis made early', 'Limited follow-up reassessment', 'Dismissal of new contradictory data']
  },

  confirmationBias: {
    name: 'Confirmation Bias',
    description: 'Tendency to search for, interpret, and recall information that confirms pre-existing beliefs while giving less consideration to alternative possibilities.',
    clinicalExample: 'Believing a patient has pneumonia and focusing only on findings that support this (cough, fever) while downplaying conflicting evidence (normal chest X-ray, absence of consolidation on exam).',
    detectionPrompt: 'Are tests or data being selectively emphasized to support a favored diagnosis? Are contradictory findings being adequately addressed or explained away?',
    mitigation: 'Actively seek evidence that contradicts the leading hypothesis. Ask "What would disprove this diagnosis?" Order tests that could rule out, not just rule in.',
    riskFactors: ['Selective test ordering', 'Dismissal of negative findings', 'Focus on confirmatory data only']
  },

  availabilityBias: {
    name: 'Availability Bias (Recency Bias)',
    description: 'Tendency to judge the likelihood of events based on how easily examples come to mind, often influenced by recent experiences or memorable cases.',
    clinicalExample: 'After recently seeing a case of pulmonary embolism, clinician over-diagnoses PE in subsequent patients with chest pain and dyspnea, even when clinical probability is low.',
    detectionPrompt: 'Is the diagnosis being considered because of a recent similar case? Is a dramatic or memorable condition being favored over more common conditions?',
    mitigation: 'Use evidence-based probability estimates and clinical decision rules. Consider base rates and epidemiology. Ask "What is the actual prevalence?"',
    riskFactors: ['Recent similar case', 'Dramatic presentation in memory', 'Rare but memorable diagnosis considered']
  },

  prematureClosure: {
    name: 'Premature Closure',
    description: 'Accepting a diagnosis before it has been fully verified, failing to consider reasonable alternatives, or stopping the diagnostic process too early.',
    clinicalExample: 'Diagnosing viral gastroenteritis in a patient with abdominal pain and diarrhea without considering appendicitis, inflammatory bowel disease, or other serious causes.',
    detectionPrompt: 'Has the diagnostic process stopped too early? Are there unexplained findings? Have reasonable alternatives been adequately ruled out?',
    mitigation: 'Use systematic differential diagnosis. Apply the "VINDICATE" mnemonic. Ask "What else could this be?" Challenge yourself to generate at least 3-5 alternatives.',
    riskFactors: ['Unexplained findings', 'Pattern recognition only', 'Limited differential considered']
  },

  searchSatisficing: {
    name: 'Search Satisficing',
    description: 'Calling off a search once something is found, potentially missing additional important findings or diagnoses.',
    clinicalExample: 'Finding pneumonia on chest X-ray and stopping there, missing a concurrent pulmonary nodule or rib fracture. Finding one diagnosis and not considering that a patient may have multiple conditions.',
    detectionPrompt: 'After finding one diagnosis or abnormality, was the search continued for additional problems? Could the patient have multiple concurrent conditions?',
    mitigation: 'Use systematic review protocols. Complete full physical examination. Ask "What else?" even after finding one diagnosis.',
    riskFactors: ['Single finding emphasized', 'Incomplete examination', 'Multiple problems not considered']
  },

  framingEffect: {
    name: 'Framing Effect',
    description: 'Being influenced by how information is presented rather than by the information itself. The same information framed differently can lead to different conclusions.',
    clinicalExample: 'A patient described as "frequent flyer" may have their symptoms taken less seriously than if they were described as "patient with recurrent presentations - why?"',
    detectionPrompt: 'Is the diagnosis or management being influenced by how the case was presented (referral bias, sign-out bias)? Are labels or descriptors affecting clinical judgment?',
    mitigation: 'Evaluate each presentation on its own merits. Be aware of loaded language. Ask "If this patient had no prior history, what would I think?"',
    riskFactors: ['Pejorative labels', 'Handoff bias', 'Referral framing']
  },

  representativenessRestraint: {
    name: 'Representativeness Restraint (Stereotype Bias)',
    description: 'Assuming a patient fits a pattern or prototype, potentially missing atypical presentations.',
    clinicalExample: 'Assuming young, fit patients cannot have myocardial infarction, or that elderly patients with confusion always have dementia or UTI.',
    detectionPrompt: 'Are demographic factors or stereotypical presentations driving the diagnosis? Are atypical presentations being adequately considered?',
    mitigation: 'Remember that any patient can present atypically. Use age-adjusted risk calculators. Ask "What is the must-not-miss diagnosis regardless of typical presentation?"',
    riskFactors: ['Age or gender assumptions', 'Classic presentation expected', 'Atypical features dismissed']
  },

  omissionBias: {
    name: 'Omission Bias (Regret Bias)',
    description: 'Tendency to favor inaction over action, believing that harm caused by action is worse than harm caused by inaction.',
    clinicalExample: 'Not starting anticoagulation in a high-risk patient due to fear of bleeding complications, even when the risk of stroke is higher.',
    detectionPrompt: 'Is there hesitancy to take action despite clear indication? Are risks of inaction being underweighted compared to risks of action?',
    mitigation: 'Explicitly weigh risks and benefits of both action and inaction. Use shared decision-making. Consider "What is the harm of doing nothing?"',
    riskFactors: ['Treatment withholding', 'Conservative bias', 'Action/inaction imbalance']
  },

  sunkCostFallacy: {
    name: 'Sunk Cost Fallacy',
    description: 'Continuing with a diagnosis or treatment plan because of resources already invested, rather than on the basis of current evidence.',
    clinicalExample: 'Continuing antibiotics for "pneumonia" despite negative cultures and alternative diagnosis emerging, because treatment was already started.',
    detectionPrompt: 'Is the current plan being continued primarily because it was already initiated? Is there reluctance to change course despite new contradictory information?',
    mitigation: 'Regularly reassess the plan based on current evidence. Practice diagnostic humility. Ask "If starting fresh today, would I make the same decision?"',
    riskFactors: ['Treatment continuation despite failure', 'Diagnostic momentum', 'Reluctance to change plan']
  },

  commissionBias: {
    name: 'Commission Bias',
    description: 'Tendency toward action rather than inaction, believing that it is better to do something than to do nothing.',
    clinicalExample: 'Ordering unnecessary tests or treatments for viral illness because of pressure to "do something" rather than providing reassurance and watchful waiting.',
    detectionPrompt: 'Are tests or treatments being ordered primarily to "do something" rather than based on clear clinical indication? Is watchful waiting being adequately considered?',
    mitigation: 'Use evidence-based guidelines. Practice shared decision-making. Ask "Will this test or treatment change management?"',
    riskFactors: ['Excessive testing', 'Polypharmacy', 'Invasive procedures without clear indication']
  },

  viscerality: {
    name: 'Visceral Bias (Affective Error)',
    description: 'Allowing emotions or personal feelings about the patient to influence clinical decisions.',
    clinicalExample: 'Being overly aggressive with workup for a likeable patient, or dismissing symptoms in a difficult or demanding patient.',
    detectionPrompt: 'Are personal feelings toward the patient (positive or negative) influencing clinical decision-making? Is there asymmetry in how similar cases are handled?',
    mitigation: 'Recognize emotional responses. Apply consistent clinical standards. Use protocols and checklists. Seek peer input when emotions are high.',
    riskFactors: ['Patient-clinician relationship affecting decisions', 'Emotional reaction to case', 'Asymmetric treatment']
  },

  diagnosisMomentum: {
    name: 'Diagnosis Momentum',
    description: 'Once a diagnostic label is attached to a patient, it tends to become fixed and resistant to change, gathering momentum as it is passed from clinician to clinician.',
    clinicalExample: 'Patient labeled with "anxiety" in emergency department; subsequent providers focus on psychiatric causes and miss evolving myocardial infarction.',
    detectionPrompt: 'Has a previous diagnosis been accepted without independent verification? Is there a label from prior encounters biasing the current assessment?',
    mitigation: 'Independently verify key diagnoses. Treat each encounter as a fresh assessment. Ask "Does this diagnosis explain all the findings?"',
    riskFactors: ['Previous diagnosis not questioned', 'Referral diagnosis accepted uncritically', 'Anchoring on chart labels']
  }
};

/**
 * Logical fallacies in clinical reasoning
 */
const logicalFallacies = {
  postHocErgoPropterHoc: {
    name: 'Post Hoc Ergo Propter Hoc',
    description: 'Assuming that because one event followed another, the first event caused the second (correlation vs. causation).',
    clinicalExample: 'Patient improved after starting antibiotics, therefore they had a bacterial infection (may have been viral with spontaneous resolution).',
    detectionPrompt: 'Is temporal association being mistaken for causation? Could the improvement be coincidental or due to other factors?',
    mitigation: 'Consider natural disease course. Look for mechanism. Use controlled comparisons when possible.'
  },

  falseEquivalence: {
    name: 'False Equivalence',
    description: 'Treating two diagnoses or treatment options as equally likely or valuable when they are not.',
    clinicalExample: 'Giving equal weight to common viral URI and rare but serious bacterial meningitis when both could present with fever and headache.',
    detectionPrompt: 'Are conditions being given equal consideration despite different base rates or evidence levels?',
    mitigation: 'Use Bayesian reasoning. Consider prevalence and prior probability. Weight likelihood appropriately.'
  },

  circularReasoning: {
    name: 'Circular Reasoning',
    description: 'Using the conclusion as support for the premise, creating a logical loop.',
    clinicalExample: 'Patient has pneumonia because chest X-ray shows infiltrate, and we know it is infiltrate because the patient has pneumonia.',
    detectionPrompt: 'Is the conclusion being used to support its own premise? Is there independent evidence?',
    mitigation: 'Identify independent supporting evidence. Establish clear logical chain from evidence to conclusion.'
  },

  hastyGeneralization: {
    name: 'Hasty Generalization',
    description: 'Drawing broad conclusions from insufficient evidence or small sample size.',
    clinicalExample: 'Believing all patients with back pain and fever have epidural abscess because of one memorable case.',
    detectionPrompt: 'Is a conclusion being drawn from limited data? Is personal experience trumping population data?',
    mitigation: 'Use evidence-based prevalence data. Consider sample size. Apply clinical decision rules.'
  },

  falseChoice: {
    name: 'False Choice (False Dichotomy)',
    description: 'Presenting only two options when more exist.',
    clinicalExample: 'Thinking patient either has bacterial pneumonia needing antibiotics or viral infection needing nothing, missing fungal, atypical organisms, or non-infectious causes.',
    detectionPrompt: 'Are only two possibilities being considered when others exist? Is the differential artificially narrow?',
    mitigation: 'Systematically generate differential diagnosis. Use VINDICATE or similar mnemonics. Challenge binary thinking.'
  },

  appealToAuthority: {
    name: 'Appeal to Authority',
    description: 'Accepting a claim as true because an authority figure said so, without independent verification.',
    clinicalExample: 'Not questioning a specialist consultant diagnosis even when findings do not fit or new information emerges.',
    detectionPrompt: 'Is a diagnosis being accepted solely based on who made it rather than supporting evidence?',
    mitigation: 'Respectfully verify consultant recommendations. Assess whether stated diagnosis explains all findings.'
  },

  slipperySlope: {
    name: 'Slippery Slope',
    description: 'Believing that one action will inevitably lead to a chain of events with negative outcome, without evidence.',
    clinicalExample: 'Refusing to prescribe any opioid for severe acute pain because of fear patient will become addicted.',
    detectionPrompt: 'Is action being avoided due to fear of unlikely chain of events? Is risk being overestimated?',
    mitigation: 'Assess actual probability of adverse outcomes. Use evidence-based risk assessment. Consider risk mitigation strategies.'
  },

  redHerring: {
    name: 'Red Herring',
    description: 'Introducing irrelevant information that distracts from the main issue.',
    clinicalExample: 'Focusing on patient\'s social situation or medication non-adherence when there is an acute medical emergency requiring immediate attention.',
    detectionPrompt: 'Is attention being diverted to less relevant issues? Are important acute findings being missed?',
    mitigation: 'Prioritize by acuity and relevance. Address life-threatening issues first. Stay focused on primary question.'
  },

  strawMan: {
    name: 'Straw Man',
    description: 'Misrepresenting or oversimplifying an argument to make it easier to attack.',
    clinicalExample: 'Dismissing concern about atypical presentation by saying "you think every patient has a zebra diagnosis" when legitimate red flags are present.',
    detectionPrompt: 'Is a legitimate concern being unfairly dismissed or mischaracterized?',
    mitigation: 'Consider concerns on their merits. Engage with actual arguments rather than caricatures.'
  },

  texasSharpshooter: {
    name: 'Texas Sharpshooter',
    description: 'Cherry-picking data clusters to suit an argument, ignoring data that does not fit.',
    clinicalExample: 'Highlighting only the laboratory values that support pneumonia diagnosis while ignoring normal inflammatory markers and negative cultures.',
    detectionPrompt: 'Are only supporting findings being emphasized while contradictory data is ignored or minimized?',
    mitigation: 'Account for all significant findings. Explain discordant data. Do not ignore inconvenient results.'
  },

  gamblersFallacy: {
    name: "Gambler's Fallacy",
    description: 'Believing that past events affect the probability of independent future events.',
    clinicalExample: 'Thinking a patient is less likely to have PE because the last three patients with chest pain had PE (independent probabilities).',
    detectionPrompt: 'Is reasoning about current case being influenced by recent case distribution rather than independent probability?',
    mitigation: 'Treat each case independently. Use evidence-based probability for the individual patient.'
  }
};

/**
 * Prompts for detecting cognitive biases in clinical reasoning
 */
function generateBiasDetectionPrompt() {
  return `
COGNITIVE BIAS ANALYSIS:
Carefully analyze the clinical reasoning for potential cognitive biases and logical fallacies. For each relevant bias identified, provide:
1. The specific bias name
2. Evidence from the case suggesting this bias
3. How it may be affecting clinical decision-making
4. Specific mitigation strategies for this case

Consider these common biases:
- Anchoring Bias: Over-reliance on initial findings or first impression
- Confirmation Bias: Selectively emphasizing data that supports favored diagnosis
- Availability Bias: Recent or memorable cases influencing judgment
- Premature Closure: Stopping diagnostic process too early
- Search Satisficing: Stopping after finding one diagnosis, missing others
- Framing Effect: Being influenced by how case was presented
- Representativeness Restraint: Assuming patient fits stereotype
- Diagnosis Momentum: Accepting previous labels without verification
- Omission Bias: Favoring inaction over action
- Commission Bias: Favoring action over appropriate watchful waiting
- Visceral Bias: Personal feelings affecting decisions
- Sunk Cost Fallacy: Continuing plan due to resources invested

LOGICAL FALLACY ANALYSIS:
Assess the reasoning chain for logical fallacies:
- Post Hoc Ergo Propter Hoc: Confusing correlation with causation
- False Equivalence: Treating unequal probabilities as equal
- Circular Reasoning: Using conclusion to support premise
- Hasty Generalization: Drawing broad conclusions from limited data
- False Choice: Presenting only two options when more exist
- Appeal to Authority: Accepting diagnosis without verification
- Texas Sharpshooter: Cherry-picking supportive data, ignoring contradictory
- Gambler's Fallacy: Letting recent case distribution affect independent probability

Be specific and actionable in your analysis.`;
}

/**
 * Prompts for exploring alternative diagnoses
 */
function generateAlternativeDiagnosisPrompt(currentDifferential) {
  return `
ALTERNATIVE DIAGNOSIS EXPLORATION:

Current working differential: ${JSON.stringify(currentDifferential)}

Metacognitive Analysis:
1. CHALLENGE THE LEADING DIAGNOSIS:
   - What findings contradict or are not explained by the leading diagnosis?
   - What test results would you expect that are missing or discordant?
   - What is the base rate/prevalence of this diagnosis in this population?
   - Are there any anchoring biases toward this diagnosis?

2. CONSIDER MUST-NOT-MISS DIAGNOSES:
   - What life-threatening or time-sensitive diagnoses could present this way?
   - Even if less likely, what serious conditions need to be ruled out?
   - What is the consequence of missing each diagnosis?

3. EXPLORE ATYPICAL PRESENTATIONS:
   - How might common diagnoses present atypically in this patient?
   - Are there age, gender, or comorbidity factors affecting presentation?
   - What diagnoses are being excluded due to "typical" pattern bias?

4. CONSIDER MULTIPLE DIAGNOSES:
   - Could the patient have more than one concurrent condition?
   - Are all symptoms explained by the leading diagnosis, or might some be from a separate process?
   - What combinations of diagnoses should be considered?

5. USE SYSTEMATIC DIFFERENTIAL GENERATION:
   - Apply VINDICATE mnemonic (Vascular, Infectious, Neoplastic, Drugs, Inflammatory, Congenital, Autoimmune, Trauma, Endocrine)
   - What organ systems are involved?
   - What is the time course (acute, subacute, chronic)?

6. IDENTIFY DIAGNOSTIC UNCERTAINTY:
   - What key information is missing?
   - What diagnostic tests would most effectively narrow the differential?
   - What is the strength of evidence for each diagnosis?

Provide:
- Expanded differential with explicit reasoning
- Likelihood assessment with uncertainty quantification
- Distinguishing features and tests for each diagnosis
- Explicit identification of cognitive biases that may be present
- Recommendations for avoiding premature closure`;
}

/**
 * Generate comprehensive bias and fallacy analysis
 */
function analyzeReasoning(clinicalData) {
  const analysis = {
    timestamp: new Date().toISOString(),
    biasChecks: Object.keys(cognitiveBiases).map(key => ({
      biasType: cognitiveBiases[key].name,
      detectionPrompt: cognitiveBiases[key].detectionPrompt,
      mitigationStrategy: cognitiveBiases[key].mitigation
    })),
    fallacyChecks: Object.keys(logicalFallacies).map(key => ({
      fallacyType: logicalFallacies[key].name,
      detectionPrompt: logicalFallacies[key].detectionPrompt,
      mitigation: logicalFallacies[key].mitigation
    }))
  };

  return analysis;
}

/**
 * Get specific bias information
 */
function getBiasInfo(biasKey) {
  return cognitiveBiases[biasKey] || null;
}

/**
 * Get specific fallacy information
 */
function getFallacyInfo(fallacyKey) {
  return logicalFallacies[fallacyKey] || null;
}

/**
 * Get all biases and fallacies for reference
 */
function getAllBiasesAndFallacies() {
  return {
    cognitiveBiases,
    logicalFallacies
  };
}

module.exports = {
  cognitiveBiases,
  logicalFallacies,
  generateBiasDetectionPrompt,
  generateAlternativeDiagnosisPrompt,
  analyzeReasoning,
  getBiasInfo,
  getFallacyInfo,
  getAllBiasesAndFallacies
};
