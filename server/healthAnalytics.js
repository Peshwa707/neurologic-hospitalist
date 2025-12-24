/**
 * AI Health Analytics and Conservative Management Optimization
 *
 * Features:
 * - Health metric trend analysis
 * - Predictive analytics for health risks
 * - Personalized health insights
 * - Conservative management recommendations
 * - Lifestyle optimization
 * - Preventive care recommendations
 */

/**
 * Analyze health trends and generate insights
 */
function analyzeHealthTrends(patientData, healthMetrics) {
  const insights = {
    summary: '',
    trends: [],
    alerts: [],
    improvements: [],
    concerns: []
  };

  // Analyze vital signs trends
  if (healthMetrics.vitals && healthMetrics.vitals.length > 0) {
    const vitalsTrends = analyzeVitalsigns(healthMetrics.vitals);
    insights.trends.push(...vitalsTrends.trends);
    insights.alerts.push(...vitalsTrends.alerts);
    insights.improvements.push(...vitalsTrends.improvements);
  }

  // Analyze lab trends
  if (healthMetrics.labs && healthMetrics.labs.length > 0) {
    const labTrends = analyzeLabResults(healthMetrics.labs);
    insights.trends.push(...labTrends.trends);
    insights.alerts.push(...labTrends.alerts);
  }

  // Analyze symptoms
  if (healthMetrics.symptoms && healthMetrics.symptoms.length > 0) {
    const symptomPatterns = analyzeSymptoms(healthMetrics.symptoms);
    insights.concerns.push(...symptomPatterns.concerns);
  }

  return insights;
}

/**
 * Analyze vital signs for patterns and trends
 */
function analyzeVitalsigns(vitals) {
  const result = {
    trends: [],
    alerts: [],
    improvements: []
  };

  // Group by category
  const vitalsByCategory = {};
  vitals.forEach(vital => {
    if (!vitalsByCategory[vital.category]) {
      vitalsByCategory[vital.category] = [];
    }
    vitalsByCategory[vital.category].push(vital);
  });

  // Analyze blood pressure
  if (vitalsByCategory['blood_pressure']) {
    const bpAnalysis = analyzeBloodPressure(vitalsByCategory['blood_pressure']);
    result.trends.push(...bpAnalysis.trends);
    result.alerts.push(...bpAnalysis.alerts);
    result.improvements.push(...bpAnalysis.improvements);
  }

  // Analyze heart rate
  if (vitalsByCategory['heart_rate']) {
    const hrAnalysis = analyzeHeartRate(vitalsByCategory['heart_rate']);
    result.trends.push(...hrAnalysis.trends);
    result.alerts.push(...hrAnalysis.alerts);
  }

  // Analyze weight
  if (vitalsByCategory['weight']) {
    const weightAnalysis = analyzeWeight(vitalsByCategory['weight']);
    result.trends.push(...weightAnalysis.trends);
    result.improvements.push(...weightAnalysis.improvements);
  }

  return result;
}

function analyzeBloodPressure(bpReadings) {
  const result = { trends: [], alerts: [], improvements: [] };

  // Sort by date
  bpReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Parse BP values (expecting format like "120/80")
  const readings = bpReadings.map(r => {
    const [systolic, diastolic] = r.value.split('/').map(v => parseInt(v));
    return { systolic, diastolic, timestamp: r.timestamp };
  }).filter(r => !isNaN(r.systolic) && !isNaN(r.diastolic));

  if (readings.length === 0) return result;

  // Calculate averages
  const avgSystolic = readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length;
  const avgDiastolic = readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length;

  // Check current status
  const latest = readings[0];

  if (latest.systolic >= 180 || latest.diastolic >= 120) {
    result.alerts.push({
      type: 'critical',
      category: 'blood_pressure',
      message: `Hypertensive crisis: BP ${latest.systolic}/${latest.diastolic}. Immediate medical attention required.`,
      value: `${latest.systolic}/${latest.diastolic}`,
      severity: 'critical'
    });
  } else if (latest.systolic >= 140 || latest.diastolic >= 90) {
    result.alerts.push({
      type: 'warning',
      category: 'blood_pressure',
      message: `Elevated blood pressure: ${latest.systolic}/${latest.diastolic}. Consider lifestyle modifications and follow-up.`,
      value: `${latest.systolic}/${latest.diastolic}`,
      severity: 'moderate'
    });
  } else if (latest.systolic >= 130 || latest.diastolic >= 80) {
    result.trends.push({
      category: 'blood_pressure',
      message: `Blood pressure in Stage 1 hypertension range: ${latest.systolic}/${latest.diastolic}`,
      trend: 'elevated',
      recommendation: 'Lifestyle modifications recommended'
    });
  } else if (latest.systolic < 120 && latest.diastolic < 80) {
    result.improvements.push({
      category: 'blood_pressure',
      message: `Excellent blood pressure control: ${latest.systolic}/${latest.diastolic}`,
      value: `${latest.systolic}/${latest.diastolic}`
    });
  }

  // Analyze trend over time
  if (readings.length >= 3) {
    const recent3 = readings.slice(0, 3);
    const recentAvgSys = recent3.reduce((sum, r) => sum + r.systolic, 0) / 3;

    const older3 = readings.slice(-3);
    const olderAvgSys = older3.reduce((sum, r) => sum + r.systolic, 0) / 3;

    const change = recentAvgSys - olderAvgSys;

    if (change > 10) {
      result.trends.push({
        category: 'blood_pressure',
        message: `Blood pressure trending upward (average increase of ${Math.round(change)} mmHg systolic)`,
        trend: 'increasing',
        recommendation: 'Review medications, diet, stress levels, and exercise routine'
      });
    } else if (change < -10) {
      result.improvements.push({
        category: 'blood_pressure',
        message: `Blood pressure improving (average decrease of ${Math.abs(Math.round(change))} mmHg systolic)`,
        trend: 'improving'
      });
    }
  }

  return result;
}

function analyzeHeartRate(hrReadings) {
  const result = { trends: [], alerts: [] };

  hrReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const readings = hrReadings.map(r => ({
    hr: parseInt(r.value),
    timestamp: r.timestamp
  })).filter(r => !isNaN(r.hr));

  if (readings.length === 0) return result;

  const latest = readings[0];
  const avgHR = readings.reduce((sum, r) => sum + r.hr, 0) / readings.length;

  // Check for abnormal heart rates
  if (latest.hr > 100) {
    result.alerts.push({
      type: 'warning',
      category: 'heart_rate',
      message: `Elevated resting heart rate: ${latest.hr} bpm. Consider evaluation for tachycardia.`,
      value: latest.hr,
      severity: 'moderate'
    });
  } else if (latest.hr < 60) {
    result.alerts.push({
      type: 'info',
      category: 'heart_rate',
      message: `Low resting heart rate: ${latest.hr} bpm. May be normal for athletes, but consider evaluation if symptomatic.`,
      value: latest.hr,
      severity: 'low'
    });
  } else if (latest.hr >= 60 && latest.hr <= 80) {
    result.trends.push({
      category: 'heart_rate',
      message: `Optimal resting heart rate: ${latest.hr} bpm`,
      trend: 'optimal'
    });
  }

  return result;
}

function analyzeWeight(weightReadings) {
  const result = { trends: [], improvements: [] };

  weightReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const readings = weightReadings.map(r => ({
    weight: parseFloat(r.value),
    timestamp: r.timestamp
  })).filter(r => !isNaN(r.weight));

  if (readings.length < 2) return result;

  const latest = readings[0];
  const oldest = readings[readings.length - 1];

  const change = latest.weight - oldest.weight;
  const percentChange = (change / oldest.weight) * 100;

  if (Math.abs(percentChange) > 5) {
    const direction = change > 0 ? 'gained' : 'lost';
    result.trends.push({
      category: 'weight',
      message: `Significant weight change: ${direction} ${Math.abs(change).toFixed(1)} lbs (${Math.abs(percentChange).toFixed(1)}%)`,
      trend: change > 0 ? 'increasing' : 'decreasing',
      recommendation: 'Review diet, activity level, and any underlying conditions'
    });
  } else if (Math.abs(percentChange) < 2) {
    result.improvements.push({
      category: 'weight',
      message: `Weight stable at ${latest.weight} lbs`,
      trend: 'stable'
    });
  }

  return result;
}

/**
 * Analyze lab results for abnormalities
 */
function analyzeLabResults(labs) {
  const result = { trends: [], alerts: [] };

  // Group by category
  const labsByCategory = {};
  labs.forEach(lab => {
    if (!labsByCategory[lab.category]) {
      labsByCategory[lab.category] = [];
    }
    labsByCategory[lab.category].push(lab);
  });

  // Analyze common labs
  Object.keys(labsByCategory).forEach(category => {
    const categoryLabs = labsByCategory[category].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    const latest = categoryLabs[0];
    const value = parseFloat(latest.value);

    if (isNaN(value)) return;

    // Check for abnormalities based on category
    const analysis = checkLabNormal(category, value, latest.unit);

    if (analysis.abnormal) {
      result.alerts.push({
        type: analysis.severity === 'critical' ? 'critical' : 'warning',
        category: category,
        message: analysis.message,
        value: `${value} ${latest.unit}`,
        referenceRange: analysis.referenceRange,
        severity: analysis.severity
      });
    } else {
      result.trends.push({
        category: category,
        message: `${category}: ${value} ${latest.unit} (within normal range)`,
        trend: 'normal'
      });
    }
  });

  return result;
}

function checkLabNormal(category, value, unit) {
  const ranges = {
    'glucose_fasting': { min: 70, max: 99, unit: 'mg/dL', critical: 126 },
    'hba1c': { min: 4.0, max: 5.6, unit: '%', critical: 6.5 },
    'total_cholesterol': { min: 0, max: 199, unit: 'mg/dL', critical: 240 },
    'ldl': { min: 0, max: 99, unit: 'mg/dL', critical: 160 },
    'hdl': { min: 40, max: 200, unit: 'mg/dL' },
    'triglycerides': { min: 0, max: 149, unit: 'mg/dL', critical: 200 },
    'creatinine': { min: 0.6, max: 1.2, unit: 'mg/dL', critical: 2.0 },
    'tsh': { min: 0.4, max: 4.0, unit: 'mIU/L' },
    'vitamin_d': { min: 30, max: 100, unit: 'ng/mL' }
  };

  const range = ranges[category.toLowerCase()];

  if (!range) {
    return { abnormal: false };
  }

  if (range.critical && value >= range.critical) {
    return {
      abnormal: true,
      severity: 'critical',
      message: `Critical ${category}: ${value} ${unit}`,
      referenceRange: `${range.min}-${range.max} ${range.unit}`
    };
  }

  if (value < range.min || value > range.max) {
    return {
      abnormal: true,
      severity: 'moderate',
      message: `Abnormal ${category}: ${value} ${unit} (outside reference range)`,
      referenceRange: `${range.min}-${range.max} ${range.unit}`
    };
  }

  return { abnormal: false };
}

/**
 * Analyze symptom patterns
 */
function analyzeSymptoms(symptoms) {
  const result = { concerns: [] };

  // Group by category
  const symptomsByCategory = {};
  symptoms.forEach(symptom => {
    if (!symptomsByCategory[symptom.category]) {
      symptomsByCategory[symptom.category] = [];
    }
    symptomsByCategory[symptom.category].push(symptom);
  });

  // Look for patterns
  Object.keys(symptomsByCategory).forEach(category => {
    const categorySymptoms = symptomsByCategory[category];

    if (categorySymptoms.length >= 3) {
      result.concerns.push({
        category: category,
        message: `Recurring symptom: ${category} reported ${categorySymptoms.length} times`,
        frequency: categorySymptoms.length,
        recommendation: 'Consider evaluation for underlying cause'
      });
    }
  });

  return result;
}

/**
 * Generate Conservative Management Recommendations
 */
function generateConservativeManagement(patientData, healthAnalysis) {
  const recommendations = {
    lifestyle: [],
    nutrition: [],
    exercise: [],
    stress: [],
    sleep: [],
    supplements: [],
    preventive: [],
    monitoring: []
  };

  // Analyze problems and generate recommendations
  const problems = patientData.medicalHistory?.problemList || [];

  problems.forEach(problem => {
    const problemRecs = getConservativeManagementForCondition(problem.name);
    recommendations.lifestyle.push(...problemRecs.lifestyle);
    recommendations.nutrition.push(...problemRecs.nutrition);
    recommendations.exercise.push(...problemRecs.exercise);
  });

  // Generate recommendations based on health trends
  if (healthAnalysis.alerts) {
    healthAnalysis.alerts.forEach(alert => {
      if (alert.category === 'blood_pressure') {
        recommendations.lifestyle.push({
          recommendation: 'DASH diet for blood pressure management',
          priority: 'high',
          evidence: 'Strong evidence for blood pressure reduction',
          implementation: 'Reduce sodium to <2300mg/day, increase fruits, vegetables, whole grains, and low-fat dairy'
        });

        recommendations.exercise.push({
          recommendation: 'Aerobic exercise for blood pressure control',
          priority: 'high',
          evidence: 'Can reduce BP by 5-8 mmHg',
          implementation: '150 minutes/week moderate aerobic activity (brisk walking, cycling, swimming)'
        });

        recommendations.stress.push({
          recommendation: 'Mind-body practices for BP management',
          priority: 'moderate',
          evidence: 'Meditation and yoga show modest BP reductions',
          implementation: 'Daily meditation (10-20 min) or yoga practice (3x/week)'
        });
      }

      if (alert.category === 'glucose_fasting' || alert.category === 'hba1c') {
        recommendations.nutrition.push({
          recommendation: 'Low glycemic index diet',
          priority: 'high',
          evidence: 'Improves glycemic control',
          implementation: 'Choose whole grains, legumes, non-starchy vegetables. Limit refined carbohydrates and added sugars'
        });

        recommendations.exercise.push({
          recommendation: 'Resistance training for glucose control',
          priority: 'high',
          evidence: 'Improves insulin sensitivity',
          implementation: 'Strength training 2-3x/week, targeting major muscle groups'
        });
      }
    });
  }

  // Add general wellness recommendations
  recommendations.preventive.push({
    recommendation: 'Annual wellness visit',
    priority: 'routine',
    timing: 'yearly',
    rationale: 'Preventive care and health maintenance'
  });

  recommendations.monitoring.push({
    recommendation: 'Home blood pressure monitoring',
    priority: 'high',
    frequency: 'daily',
    rationale: 'Track response to interventions'
  });

  // Deduplicate recommendations
  Object.keys(recommendations).forEach(category => {
    const unique = [];
    const seen = new Set();

    recommendations[category].forEach(rec => {
      const key = rec.recommendation;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    });

    recommendations[category] = unique;
  });

  return recommendations;
}

function getConservativeManagementForCondition(condition) {
  const conditionLower = condition.toLowerCase();

  const recommendations = {
    lifestyle: [],
    nutrition: [],
    exercise: []
  };

  // Hypertension
  if (conditionLower.includes('hypertension') || conditionLower.includes('high blood pressure')) {
    recommendations.lifestyle.push({
      recommendation: 'Weight loss if overweight (target BMI 18.5-24.9)',
      priority: 'high',
      evidence: 'Each kg lost reduces BP by ~1 mmHg'
    });

    recommendations.nutrition.push({
      recommendation: 'DASH diet and sodium restriction (<2300mg/day)',
      priority: 'high',
      evidence: 'Can lower BP by 8-14 mmHg'
    });

    recommendations.exercise.push({
      recommendation: 'Regular aerobic exercise (150 min/week)',
      priority: 'high',
      evidence: 'Reduces BP by 5-8 mmHg'
    });
  }

  // Diabetes/Prediabetes
  if (conditionLower.includes('diabetes') || conditionLower.includes('prediabetes')) {
    recommendations.nutrition.push({
      recommendation: 'Mediterranean or plant-based diet',
      priority: 'high',
      evidence: 'Improves glycemic control and cardiovascular outcomes'
    });

    recommendations.exercise.push({
      recommendation: 'Combined aerobic and resistance training',
      priority: 'high',
      evidence: 'Optimal for glucose control and insulin sensitivity'
    });

    recommendations.lifestyle.push({
      recommendation: 'Weight loss (7-10% if overweight)',
      priority: 'high',
      evidence: 'Can prevent or delay diabetes progression'
    });
  }

  // Hyperlipidemia
  if (conditionLower.includes('hyperlipidemia') || conditionLower.includes('high cholesterol')) {
    recommendations.nutrition.push({
      recommendation: 'Portfolio diet for cholesterol reduction',
      priority: 'high',
      evidence: 'Can lower LDL by 20-30%',
      components: 'Plant sterols, soluble fiber, soy protein, nuts'
    });

    recommendations.exercise.push({
      recommendation: 'Regular aerobic exercise',
      priority: 'high',
      evidence: 'Increases HDL and improves lipid profile'
    });
  }

  return recommendations;
}

/**
 * Generate Health Optimization Plan
 */
function generateOptimizationPlan(patientData, healthAnalysis, conservativeManagement) {
  const plan = {
    title: 'Personalized Health Optimization Plan',
    summary: '',
    priorities: [],
    goals: [],
    interventions: [],
    monitoring: [],
    timeline: {
      immediate: [],
      shortTerm: [],
      longTerm: []
    }
  };

  // Prioritize based on alerts
  if (healthAnalysis.alerts && healthAnalysis.alerts.length > 0) {
    healthAnalysis.alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        plan.priorities.push({
          priority: 1,
          concern: alert.message,
          action: 'Immediate medical evaluation required'
        });

        plan.timeline.immediate.push({
          action: `Address ${alert.category}`,
          timeframe: 'Within 24-48 hours'
        });
      } else if (alert.severity === 'moderate') {
        plan.priorities.push({
          priority: 2,
          concern: alert.message,
          action: 'Implement conservative management strategies'
        });

        plan.timeline.shortTerm.push({
          action: `Begin interventions for ${alert.category}`,
          timeframe: 'Within 1-2 weeks'
        });
      }
    });
  }

  // Add goals from recommendations
  if (conservativeManagement.lifestyle) {
    conservativeManagement.lifestyle.forEach(rec => {
      if (rec.priority === 'high') {
        plan.goals.push({
          goal: rec.recommendation,
          category: 'lifestyle',
          measurable: true,
          timeline: '3-6 months'
        });
      }
    });
  }

  // Add interventions
  ['nutrition', 'exercise', 'stress', 'sleep'].forEach(category => {
    if (conservativeManagement[category]) {
      conservativeManagement[category].forEach(rec => {
        plan.interventions.push({
          category: category,
          intervention: rec.recommendation,
          priority: rec.priority,
          implementation: rec.implementation || '',
          evidence: rec.evidence || ''
        });
      });
    }
  });

  // Add monitoring recommendations
  if (conservativeManagement.monitoring) {
    plan.monitoring = conservativeManagement.monitoring;
  }

  // Generate summary
  plan.summary = generatePlanSummary(plan);

  return plan;
}

function generatePlanSummary(plan) {
  let summary = 'Based on your health data and analysis, ';

  if (plan.priorities.length > 0) {
    summary += `we have identified ${plan.priorities.length} area(s) requiring attention. `;
  } else {
    summary += 'your overall health metrics appear good. ';
  }

  if (plan.goals.length > 0) {
    summary += `We recommend focusing on ${plan.goals.length} key goal(s) using evidence-based conservative management approaches. `;
  }

  summary += 'This plan emphasizes lifestyle modifications, nutrition optimization, and regular monitoring to achieve optimal health outcomes.';

  return summary;
}

export {
  analyzeHealthTrends,
  generateConservativeManagement,
  generateOptimizationPlan,
  analyzeVitalsigns,
  analyzeLabResults,
  analyzeSymptoms
};
