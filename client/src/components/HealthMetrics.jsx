import React from 'react';

function HealthMetrics({ patient, onBack }) {
  return (
    <div className="health-metrics">
      <button onClick={onBack} className="back-btn">
        ← Back to Dashboard
      </button>
      <h2>Health Metrics for {patient.demographics.firstName} {patient.demographics.lastName}</h2>
      <p>Health metrics tracking coming soon...</p>
    </div>
  );
}

export default HealthMetrics;
