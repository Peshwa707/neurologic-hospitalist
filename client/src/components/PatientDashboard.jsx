import React, { useState, useEffect } from 'react';
import HealthMetricsChart from './HealthMetricsChart';
import './PatientDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PatientDashboard({ patient, onBack, onPatientUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthMetrics, setHealthMetrics] = useState([]);
  const [visits, setVisits] = useState([]);
  const [carePlans, setCarePlans] = useState([]);
  const [healthAnalysis, setHealthAnalysis] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [patient.id]);

  const fetchPatientData = async () => {
    setLoading(true);

    try {
      // Fetch health metrics
      const metricsRes = await fetch(`${API_URL}/api/emr/patients/${patient.id}/metrics?limit=50`);
      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setHealthMetrics(metricsData.metrics);
      }

      // Fetch visits
      const visitsRes = await fetch(`${API_URL}/api/emr/patients/${patient.id}/visits?limit=10`);
      const visitsData = await visitsRes.json();
      if (visitsData.success) {
        setVisits(visitsData.visits);
      }

      // Fetch care plans
      const plansRes = await fetch(`${API_URL}/api/emr/patients/${patient.id}/care-plans`);
      const plansData = await plansRes.json();
      if (plansData.success) {
        setCarePlans(plansData.carePlans);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateHealthAnalysis = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/emr/patients/${patient.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setHealthAnalysis(data.data);
      }
    } catch (err) {
      console.error('Error generating health analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setLoadingInsights(true);

    try {
      const response = await fetch(`${API_URL}/api/emr/patients/${patient.id}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setAiInsights(data.data);
      }
    } catch (err) {
      console.error('Error generating AI insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="patient-dashboard">
      {/* Patient Header */}
      <div className="dashboard-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Patients
        </button>

        <div className="patient-header-info">
          <div className="patient-avatar-large">
            {patient.demographics.firstName[0]}{patient.demographics.lastName[0]}
          </div>

          <div className="patient-details">
            <h1>{patient.demographics.firstName} {patient.demographics.lastName}</h1>
            <div className="patient-meta">
              <span>{calculateAge(patient.demographics.dateOfBirth)} years old</span>
              <span>•</span>
              <span>{patient.demographics.gender}</span>
              <span>•</span>
              <span>DOB: {new Date(patient.demographics.dateOfBirth).toLocaleDateString()}</span>
            </div>

            {patient.demographics.contactInfo.phone && (
              <div className="patient-contact-info">
                📞 {patient.demographics.contactInfo.phone}
                {patient.demographics.contactInfo.email && (
                  <span> • ✉️ {patient.demographics.contactInfo.email}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'metrics' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('metrics')}
        >
          Health Metrics
        </button>
        <button
          className={activeTab === 'visits' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('visits')}
        >
          Visits
        </button>
        <button
          className={activeTab === 'analysis' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('analysis')}
        >
          AI Analysis
        </button>
        <button
          className={activeTab === 'carePlans' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('carePlans')}
        >
          Care Plans
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Medical History */}
              <div className="overview-card">
                <h3>Active Problems</h3>
                {patient.medicalHistory.problemList.filter(p => p.status === 'active').length > 0 ? (
                  <ul className="problem-list">
                    {patient.medicalHistory.problemList
                      .filter(p => p.status === 'active')
                      .map(problem => (
                        <li key={problem.id}>
                          <strong>{problem.name}</strong>
                          {problem.icd10 && <span className="icd-code">{problem.icd10}</span>}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="empty-message">No active problems</p>
                )}
              </div>

              {/* Medications */}
              <div className="overview-card">
                <h3>Current Medications</h3>
                {patient.medicalHistory.medications.filter(m => m.status === 'active').length > 0 ? (
                  <ul className="medication-list">
                    {patient.medicalHistory.medications
                      .filter(m => m.status === 'active')
                      .map(med => (
                        <li key={med.id}>
                          <strong>{med.name}</strong> {med.dosage}
                          <div className="med-frequency">{med.frequency}</div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="empty-message">No medications</p>
                )}
              </div>

              {/* Allergies */}
              <div className="overview-card">
                <h3>Allergies</h3>
                {patient.medicalHistory.allergies.length > 0 ? (
                  <ul className="allergy-list">
                    {patient.medicalHistory.allergies.map((allergy, idx) => (
                      <li key={idx} className="allergy-item">⚠️ {allergy}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-message">No known allergies</p>
                )}
              </div>

              {/* Recent Vitals */}
              <div className="overview-card">
                <h3>Recent Vitals</h3>
                {healthMetrics.filter(m => m.type === 'vitals').slice(0, 5).length > 0 ? (
                  <ul className="vitals-list">
                    {healthMetrics
                      .filter(m => m.type === 'vitals')
                      .slice(0, 5)
                      .map(metric => (
                        <li key={metric.id}>
                          <span className="metric-category">{metric.category}:</span>
                          <strong>{metric.value} {metric.unit}</strong>
                          <span className="metric-date">
                            {new Date(metric.timestamp).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="empty-message">No vitals recorded</p>
                )}
              </div>
            </div>

            {/* Patient Goals */}
            {patient.preferences.goals && patient.preferences.goals.length > 0 && (
              <div className="overview-card full-width">
                <h3>Patient Goals</h3>
                <ul className="goals-list">
                  {patient.preferences.goals.map((goal, idx) => (
                    <li key={idx}>🎯 {goal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-tab">
            <div className="metrics-header">
              <h2>Health Metrics</h2>
              <button className="btn-primary">+ Add Metric</button>
            </div>

            {healthMetrics.length > 0 ? (
              <>
                <HealthMetricsChart metrics={healthMetrics} />

                <div className="metrics-table">
                  <h3>All Metrics</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Value</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {healthMetrics.map(metric => (
                        <tr key={metric.id}>
                          <td>{new Date(metric.timestamp).toLocaleString()}</td>
                          <td>{metric.type}</td>
                          <td>{metric.category}</td>
                          <td><strong>{metric.value} {metric.unit}</strong></td>
                          <td>{metric.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No health metrics recorded</p>
                <button className="btn-primary">Add First Metric</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="visits-tab">
            <div className="visits-header">
              <h2>Visit History</h2>
              <button className="btn-primary">+ New Visit</button>
            </div>

            {visits.length > 0 ? (
              <div className="visits-list">
                {visits.map(visit => (
                  <div key={visit.id} className="visit-card">
                    <div className="visit-header">
                      <div>
                        <h3>{visit.visitType.toUpperCase()}</h3>
                        <p className="visit-date">
                          {new Date(visit.visitDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="visit-duration">
                        {visit.metadata.duration ? `${visit.metadata.duration} min` : ''}
                      </span>
                    </div>

                    <div className="visit-body">
                      <div className="visit-complaint">
                        <strong>Chief Complaint:</strong> {visit.chiefComplaint}
                      </div>

                      {visit.vitals && Object.keys(visit.vitals).length > 0 && (
                        <div className="visit-vitals">
                          <strong>Vitals:</strong>
                          <span>{JSON.stringify(visit.vitals)}</span>
                        </div>
                      )}

                      {visit.assessment && (
                        <div className="visit-assessment">
                          <h4>SOAP Note:</h4>
                          <div><strong>S:</strong> {visit.assessment.subjective}</div>
                          <div><strong>O:</strong> {visit.assessment.objective}</div>
                          <div><strong>A:</strong> {visit.assessment.assessment}</div>
                          <div><strong>P:</strong> {visit.assessment.plan}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No visits recorded</p>
                <button className="btn-primary">Document First Visit</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            <div className="analysis-header">
              <h2>AI-Powered Health Analysis</h2>
              <div className="analysis-actions">
                <button
                  onClick={generateHealthAnalysis}
                  className="btn-secondary"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : '📊 Generate Analysis'}
                </button>
                <button
                  onClick={generateAIInsights}
                  className="btn-primary"
                  disabled={loadingInsights}
                >
                  {loadingInsights ? 'Generating...' : '🤖 Get AI Insights'}
                </button>
              </div>
            </div>

            {healthAnalysis && (
              <div className="analysis-results">
                <h3>Health Trends Summary</h3>
                <div className="analysis-summary">
                  <p>{healthAnalysis.healthAnalysis.summary}</p>
                </div>

                {healthAnalysis.conservativeManagement && (
                  <div className="conservative-management">
                    <h3>Conservative Management Recommendations</h3>
                    {Object.entries(healthAnalysis.conservativeManagement).map(([category, recommendations]) => (
                      recommendations.length > 0 && (
                        <div key={category} className="recommendation-category">
                          <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                          <ul>
                            {recommendations.map((rec, idx) => (
                              <li key={idx}>
                                <strong className={`priority-${rec.priority}`}>
                                  {rec.priority}:
                                </strong>{' '}
                                {rec.recommendation}
                                {rec.evidence && <div className="evidence">Evidence: {rec.evidence}</div>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {healthAnalysis.optimizationPlan && (
                  <div className="optimization-plan">
                    <h3>Health Optimization Plan</h3>
                    <p><strong>Title:</strong> {healthAnalysis.optimizationPlan.title}</p>
                    <p>{healthAnalysis.optimizationPlan.summary}</p>

                    <h4>Goals:</h4>
                    <ul>
                      {healthAnalysis.optimizationPlan.goals.map((goal, idx) => (
                        <li key={idx}>
                          <strong>{goal.goal}</strong> - Target: {goal.targetValue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {aiInsights && (
              <div className="ai-insights">
                <h3>🤖 Personalized AI Insights</h3>

                <div className="health-summary">
                  <h4>Health Summary</h4>
                  <p>{aiInsights.healthSummary.overallStatus}</p>

                  <div className="summary-grid">
                    <div className="summary-section">
                      <h5>✅ Key Strengths</h5>
                      <ul>
                        {aiInsights.healthSummary.keyStrengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="summary-section">
                      <h5>⚡ Areas for Improvement</h5>
                      <ul>
                        {aiInsights.healthSummary.areasForImprovement.map((area, idx) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {aiInsights.personalizedRecommendations && (
                  <div className="personalized-recommendations">
                    <h4>Personalized Recommendations</h4>

                    {Object.entries(aiInsights.personalizedRecommendations).map(([category, recommendations]) => (
                      recommendations.length > 0 && (
                        <div key={category} className="recommendation-section">
                          <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                          {recommendations.map((rec, idx) => (
                            <div key={idx} className="recommendation-card">
                              <div className="rec-header">
                                <span className={`priority-badge ${rec.priority}`}>{rec.priority}</span>
                                <strong>{rec.recommendation || rec.technique || rec.supplement}</strong>
                              </div>
                              <p>{rec.rationale || rec.benefits}</p>
                              {rec.implementation && <div className="implementation">💡 {rec.implementation}</div>}
                            </div>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                )}

                {aiInsights.goalSetting && (
                  <div className="goal-setting">
                    <h4>Goal Setting</h4>

                    <h5>Short-term Goals (30-90 days)</h5>
                    {aiInsights.goalSetting.shortTerm.map((goal, idx) => (
                      <div key={idx} className="goal-card">
                        <h6>{goal.goal}</h6>
                        <p><strong>How to measure:</strong> {goal.measurable}</p>
                        <div className="action-steps">
                          <strong>Action steps:</strong>
                          <ul>
                            {goal.actionSteps.map((step, stepIdx) => (
                              <li key={stepIdx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!healthAnalysis && !aiInsights && (
              <div className="empty-state">
                <p>Click above to generate health analysis and AI-powered insights</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'carePlans' && (
          <div className="care-plans-tab">
            <div className="care-plans-header">
              <h2>Care Plans</h2>
              <button className="btn-primary">+ New Care Plan</button>
            </div>

            {carePlans.length > 0 ? (
              <div className="care-plans-list">
                {carePlans.map(plan => (
                  <div key={plan.id} className="care-plan-card">
                    <div className="plan-header">
                      <h3>{plan.title}</h3>
                      <span className={`status-badge ${plan.status}`}>{plan.status}</span>
                    </div>

                    <div className="plan-meta">
                      <span>Category: {plan.category}</span>
                      <span>Started: {new Date(plan.timeline.startDate).toLocaleDateString()}</span>
                    </div>

                    {plan.goals && plan.goals.length > 0 && (
                      <div className="plan-goals">
                        <strong>Goals:</strong>
                        <ul>
                          {plan.goals.map((goal, idx) => (
                            <li key={idx}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No care plans</p>
                <button className="btn-primary">Create First Care Plan</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
