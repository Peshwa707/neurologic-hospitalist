/**
 * EMR (Electronic Medical Record) Management Module
 * For Concierge Outpatient Practice
 *
 * Features:
 * - Patient demographics and records
 * - Visit/encounter tracking
 * - Health metrics monitoring
 * - Problem list management
 * - Medication tracking
 * - Vital signs trending
 * - Lab results tracking
 * - Care plans and goals
 */

// In-memory storage (in production, use a database)
const patients = new Map();
const visits = new Map();
const healthMetrics = new Map();
const carePlans = new Map();

/**
 * Patient Record Structure
 */
class PatientRecord {
  constructor(data) {
    this.id = data.id || generateId();
    this.demographics = {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      contactInfo: {
        phone: data.phone,
        email: data.email,
        address: data.address
      },
      emergencyContact: data.emergencyContact
    };

    this.medicalHistory = {
      allergies: data.allergies || [],
      medications: data.medications || [],
      problemList: data.problemList || [],
      surgicalHistory: data.surgicalHistory || [],
      familyHistory: data.familyHistory || [],
      socialHistory: data.socialHistory || {}
    };

    this.healthMetrics = {
      vitals: [],
      labs: [],
      measurements: [],
      symptoms: []
    };

    this.visits = [];
    this.carePlans = [];
    this.preventiveCare = {
      immunizations: [],
      screenings: [],
      upcomingRecommendations: []
    };

    this.preferences = {
      communicationPreference: data.communicationPreference || 'email',
      goals: data.goals || [],
      lifestylePreferences: data.lifestylePreferences || {}
    };

    this.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastVisit: null,
      nextAppointment: null
    };
  }
}

/**
 * Visit/Encounter Structure
 */
class VisitRecord {
  constructor(data) {
    this.id = data.id || generateId();
    this.patientId = data.patientId;
    this.visitDate = data.visitDate || new Date().toISOString();
    this.visitType = data.visitType; // 'wellness', 'followup', 'acute', 'virtual'
    this.chiefComplaint = data.chiefComplaint;

    this.vitals = data.vitals || {};

    this.assessment = {
      subjective: data.subjective || '',
      objective: data.objective || '',
      assessment: data.assessment || '',
      plan: data.plan || ''
    };

    this.ordersTests = data.ordersTests || [];
    this.prescriptions = data.prescriptions || [];
    this.referrals = data.referrals || [];

    this.followUp = {
      recommended: data.followUpRecommended || false,
      timeframe: data.followUpTimeframe || null,
      reason: data.followUpReason || null
    };

    this.metadata = {
      createdAt: new Date().toISOString(),
      createdBy: data.providerId || 'system',
      duration: data.duration || null
    };
  }
}

/**
 * Health Metrics Entry
 */
class HealthMetricEntry {
  constructor(data) {
    this.id = data.id || generateId();
    this.patientId = data.patientId;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.type = data.type; // 'vitals', 'labs', 'measurement', 'symptom'
    this.category = data.category;
    this.value = data.value;
    this.unit = data.unit;
    this.source = data.source || 'manual'; // 'manual', 'device', 'lab'
    this.notes = data.notes || '';
  }
}

/**
 * Care Plan Structure
 */
class CarePlan {
  constructor(data) {
    this.id = data.id || generateId();
    this.patientId = data.patientId;
    this.title = data.title;
    this.category = data.category; // 'chronic-disease', 'wellness', 'prevention', 'lifestyle'
    this.status = data.status || 'active'; // 'active', 'completed', 'on-hold'

    this.goals = data.goals || [];
    this.interventions = data.interventions || [];
    this.barriers = data.barriers || [];

    this.timeline = {
      startDate: data.startDate || new Date().toISOString(),
      targetEndDate: data.targetEndDate || null,
      reviewDate: data.reviewDate || null
    };

    this.metrics = {
      tracked: data.trackedMetrics || [],
      targets: data.targets || {}
    };

    this.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || 'system'
    };
  }
}

// Helper function to generate IDs
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Patient Management Functions
 */

function createPatient(data) {
  const patient = new PatientRecord(data);
  patients.set(patient.id, patient);
  return patient;
}

function getPatient(patientId) {
  return patients.get(patientId);
}

function updatePatient(patientId, updates) {
  const patient = patients.get(patientId);
  if (!patient) throw new Error('Patient not found');

  Object.assign(patient, updates);
  patient.metadata.updatedAt = new Date().toISOString();

  patients.set(patientId, patient);
  return patient;
}

function searchPatients(query) {
  const results = [];

  for (const patient of patients.values()) {
    const fullName = `${patient.demographics.firstName} ${patient.demographics.lastName}`.toLowerCase();
    const searchTerm = query.toLowerCase();

    if (fullName.includes(searchTerm) ||
        patient.id === query ||
        patient.demographics.contactInfo.email?.toLowerCase().includes(searchTerm)) {
      results.push(patient);
    }
  }

  return results;
}

function getAllPatients(options = {}) {
  const { limit = 50, offset = 0, sortBy = 'lastName' } = options;

  let patientList = Array.from(patients.values());

  // Sort
  patientList.sort((a, b) => {
    if (sortBy === 'lastName') {
      return a.demographics.lastName.localeCompare(b.demographics.lastName);
    } else if (sortBy === 'lastVisit') {
      return new Date(b.metadata.lastVisit || 0) - new Date(a.metadata.lastVisit || 0);
    }
    return 0;
  });

  // Paginate
  return patientList.slice(offset, offset + limit);
}

/**
 * Visit Management Functions
 */

function createVisit(data) {
  const visit = new VisitRecord(data);

  // Store visit
  if (!visits.has(data.patientId)) {
    visits.set(data.patientId, []);
  }
  visits.get(data.patientId).push(visit);

  // Update patient record
  const patient = patients.get(data.patientId);
  if (patient) {
    patient.visits.push(visit.id);
    patient.metadata.lastVisit = visit.visitDate;
    patient.metadata.updatedAt = new Date().toISOString();
  }

  return visit;
}

function getVisitHistory(patientId, options = {}) {
  const { limit = 10, startDate, endDate } = options;

  let patientVisits = visits.get(patientId) || [];

  // Filter by date range
  if (startDate || endDate) {
    patientVisits = patientVisits.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      if (startDate && visitDate < new Date(startDate)) return false;
      if (endDate && visitDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Sort by date descending
  patientVisits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

  return limit ? patientVisits.slice(0, limit) : patientVisits;
}

/**
 * Health Metrics Management
 */

function addHealthMetric(data) {
  const metric = new HealthMetricEntry(data);

  if (!healthMetrics.has(data.patientId)) {
    healthMetrics.set(data.patientId, []);
  }
  healthMetrics.get(data.patientId).push(metric);

  // Update patient health metrics
  const patient = patients.get(data.patientId);
  if (patient) {
    if (metric.type === 'vitals') {
      patient.healthMetrics.vitals.push(metric);
    } else if (metric.type === 'labs') {
      patient.healthMetrics.labs.push(metric);
    } else if (metric.type === 'measurement') {
      patient.healthMetrics.measurements.push(metric);
    } else if (metric.type === 'symptom') {
      patient.healthMetrics.symptoms.push(metric);
    }
    patient.metadata.updatedAt = new Date().toISOString();
  }

  return metric;
}

function getHealthMetrics(patientId, options = {}) {
  const { type, category, startDate, endDate, limit } = options;

  let metrics = healthMetrics.get(patientId) || [];

  // Filter by type
  if (type) {
    metrics = metrics.filter(m => m.type === type);
  }

  // Filter by category
  if (category) {
    metrics = metrics.filter(m => m.category === category);
  }

  // Filter by date range
  if (startDate || endDate) {
    metrics = metrics.filter(metric => {
      const metricDate = new Date(metric.timestamp);
      if (startDate && metricDate < new Date(startDate)) return false;
      if (endDate && metricDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Sort by timestamp descending
  metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return limit ? metrics.slice(0, limit) : metrics;
}

function getHealthTrends(patientId, metric, timeframe = '3m') {
  const metrics = getHealthMetrics(patientId, { category: metric });

  // Calculate timeframe
  const now = new Date();
  const startDate = new Date(now);
  if (timeframe === '1m') startDate.setMonth(now.getMonth() - 1);
  else if (timeframe === '3m') startDate.setMonth(now.getMonth() - 3);
  else if (timeframe === '6m') startDate.setMonth(now.getMonth() - 6);
  else if (timeframe === '1y') startDate.setFullYear(now.getFullYear() - 1);

  const filtered = metrics.filter(m => new Date(m.timestamp) >= startDate);

  // Calculate statistics
  const values = filtered.map(m => parseFloat(m.value)).filter(v => !isNaN(v));

  if (values.length === 0) {
    return {
      metric,
      timeframe,
      count: 0,
      trend: 'insufficient-data'
    };
  }

  const latest = values[0];
  const oldest = values[values.length - 1];
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Determine trend
  let trend = 'stable';
  const change = latest - oldest;
  const percentChange = (change / oldest) * 100;

  if (Math.abs(percentChange) < 5) {
    trend = 'stable';
  } else if (percentChange > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    metric,
    timeframe,
    count: values.length,
    latest,
    oldest,
    average: Math.round(average * 100) / 100,
    min,
    max,
    change: Math.round(change * 100) / 100,
    percentChange: Math.round(percentChange * 10) / 10,
    trend,
    dataPoints: filtered.map(m => ({
      timestamp: m.timestamp,
      value: parseFloat(m.value)
    }))
  };
}

/**
 * Care Plan Management
 */

function createCarePlan(data) {
  const plan = new CarePlan(data);

  if (!carePlans.has(data.patientId)) {
    carePlans.set(data.patientId, []);
  }
  carePlans.get(data.patientId).push(plan);

  // Update patient record
  const patient = patients.get(data.patientId);
  if (patient) {
    patient.carePlans.push(plan.id);
    patient.metadata.updatedAt = new Date().toISOString();
  }

  return plan;
}

function getCarePlans(patientId, options = {}) {
  const { status } = options;

  let plans = carePlans.get(patientId) || [];

  if (status) {
    plans = plans.filter(p => p.status === status);
  }

  return plans;
}

function updateCarePlan(patientId, planId, updates) {
  const plans = carePlans.get(patientId) || [];
  const plan = plans.find(p => p.id === planId);

  if (!plan) throw new Error('Care plan not found');

  Object.assign(plan, updates);
  plan.metadata.updatedAt = new Date().toISOString();

  return plan;
}

/**
 * Problem List Management
 */

function addProblem(patientId, problem) {
  const patient = patients.get(patientId);
  if (!patient) throw new Error('Patient not found');

  const problemEntry = {
    id: generateId(),
    name: problem.name,
    icd10: problem.icd10 || null,
    status: problem.status || 'active', // 'active', 'resolved', 'chronic'
    onsetDate: problem.onsetDate || new Date().toISOString(),
    resolvedDate: null,
    notes: problem.notes || '',
    addedAt: new Date().toISOString()
  };

  patient.medicalHistory.problemList.push(problemEntry);
  patient.metadata.updatedAt = new Date().toISOString();

  return problemEntry;
}

function updateProblem(patientId, problemId, updates) {
  const patient = patients.get(patientId);
  if (!patient) throw new Error('Patient not found');

  const problem = patient.medicalHistory.problemList.find(p => p.id === problemId);
  if (!problem) throw new Error('Problem not found');

  Object.assign(problem, updates);
  patient.metadata.updatedAt = new Date().toISOString();

  return problem;
}

/**
 * Medication Management
 */

function addMedication(patientId, medication) {
  const patient = patients.get(patientId);
  if (!patient) throw new Error('Patient not found');

  const medicationEntry = {
    id: generateId(),
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    route: medication.route || 'oral',
    indication: medication.indication || '',
    startDate: medication.startDate || new Date().toISOString(),
    endDate: medication.endDate || null,
    status: medication.status || 'active', // 'active', 'discontinued', 'completed'
    prescriber: medication.prescriber || '',
    notes: medication.notes || '',
    addedAt: new Date().toISOString()
  };

  patient.medicalHistory.medications.push(medicationEntry);
  patient.metadata.updatedAt = new Date().toISOString();

  return medicationEntry;
}

function updateMedication(patientId, medicationId, updates) {
  const patient = patients.get(patientId);
  if (!patient) throw new Error('Patient not found');

  const medication = patient.medicalHistory.medications.find(m => m.id === medicationId);
  if (!medication) throw new Error('Medication not found');

  Object.assign(medication, updates);
  patient.metadata.updatedAt = new Date().toISOString();

  return medication;
}

export {
  // Patient Management
  createPatient,
  getPatient,
  updatePatient,
  searchPatients,
  getAllPatients,

  // Visit Management
  createVisit,
  getVisitHistory,

  // Health Metrics
  addHealthMetric,
  getHealthMetrics,
  getHealthTrends,

  // Care Plans
  createCarePlan,
  getCarePlans,
  updateCarePlan,

  // Problem List
  addProblem,
  updateProblem,

  // Medications
  addMedication,
  updateMedication,

  // Data structures
  PatientRecord,
  VisitRecord,
  HealthMetricEntry,
  CarePlan
};
