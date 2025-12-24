import React, { useState, useEffect } from 'react';
import PatientList from './PatientList';
import PatientDashboard from './PatientDashboard';
import HealthMetrics from './HealthMetrics';
import './EMR.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EMR() {
  const [view, setView] = useState('patients'); // 'patients', 'dashboard', 'metrics'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/emr/patients?limit=100`);
      const data = await response.json();

      if (data.success) {
        setPatients(data.patients);
      } else {
        setError('Failed to load patients');
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setView('dashboard');
  };

  const handleBackToList = () => {
    setView('patients');
    setSelectedPatient(null);
  };

  const handleCreatePatient = async (patientData) => {
    try {
      const response = await fetch(`${API_URL}/api/emr/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
      });

      const data = await response.json();

      if (data.success) {
        await fetchPatients();
        return data.patient;
      } else {
        throw new Error(data.error || 'Failed to create patient');
      }
    } catch (err) {
      console.error('Error creating patient:', err);
      throw err;
    }
  };

  return (
    <div className="emr-container">
      <div className="emr-header">
        <h1>
          <span className="emr-icon">📋</span>
          Electronic Medical Records
        </h1>
        {selectedPatient && (
          <div className="emr-breadcrumb">
            <button onClick={handleBackToList} className="breadcrumb-link">
              Patients
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">
              {selectedPatient.demographics.firstName} {selectedPatient.demographics.lastName}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="emr-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="emr-content">
        {view === 'patients' && (
          <PatientList
            patients={patients}
            loading={loading}
            onPatientSelect={handlePatientSelect}
            onCreatePatient={handleCreatePatient}
            onRefresh={fetchPatients}
          />
        )}

        {view === 'dashboard' && selectedPatient && (
          <PatientDashboard
            patient={selectedPatient}
            onBack={handleBackToList}
            onPatientUpdate={(updatedPatient) => {
              setSelectedPatient(updatedPatient);
              fetchPatients();
            }}
          />
        )}

        {view === 'metrics' && selectedPatient && (
          <HealthMetrics
            patient={selectedPatient}
            onBack={handleBackToList}
          />
        )}
      </div>
    </div>
  );
}

export default EMR;
