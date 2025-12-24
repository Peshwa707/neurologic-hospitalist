import React, { useState } from 'react';
import './PatientList.css';

function PatientList({ patients, loading, onPatientSelect, onCreatePatient, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastName');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    allergies: [],
    medications: [],
    problemList: [],
    goals: []
  });

  // Filter and sort patients
  const filteredPatients = patients
    .filter(patient => {
      if (!searchQuery) return true;
      const fullName = `${patient.demographics.firstName} ${patient.demographics.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase()) ||
             patient.demographics.contactInfo.email?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'lastName') {
        return a.demographics.lastName.localeCompare(b.demographics.lastName);
      } else if (sortBy === 'lastVisit') {
        return new Date(b.metadata.lastVisit || 0) - new Date(a.metadata.lastVisit || 0);
      }
      return 0;
    });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      await onCreatePatient(newPatient);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewPatient({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      allergies: [],
      medications: [],
      problemList: [],
      goals: []
    });
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
    <div className="patient-list-container">
      <div className="patient-list-header">
        <div className="patient-list-title">
          <h2>Patient List</h2>
          <span className="patient-count">{filteredPatients.length} patients</span>
        </div>

        <div className="patient-list-actions">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="patient-search"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="patient-sort"
          >
            <option value="lastName">Sort by Last Name</option>
            <option value="lastVisit">Sort by Last Visit</option>
          </select>

          <button onClick={onRefresh} className="refresh-btn" disabled={loading}>
            🔄 Refresh
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="create-patient-btn"
          >
            + New Patient
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      )}

      {!loading && filteredPatients.length === 0 && (
        <div className="empty-state">
          <p>No patients found</p>
          <button onClick={() => setShowCreateModal(true)} className="create-patient-btn">
            Create First Patient
          </button>
        </div>
      )}

      {!loading && filteredPatients.length > 0 && (
        <div className="patient-grid">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              className="patient-card"
              onClick={() => onPatientSelect(patient)}
            >
              <div className="patient-card-header">
                <div className="patient-avatar">
                  {patient.demographics.firstName[0]}{patient.demographics.lastName[0]}
                </div>
                <div className="patient-info">
                  <h3 className="patient-name">
                    {patient.demographics.firstName} {patient.demographics.lastName}
                  </h3>
                  <div className="patient-details">
                    <span className="patient-age">
                      {calculateAge(patient.demographics.dateOfBirth)} years old
                    </span>
                    <span className="patient-gender">
                      {patient.demographics.gender}
                    </span>
                  </div>
                </div>
              </div>

              <div className="patient-card-body">
                {patient.medicalHistory.problemList.length > 0 && (
                  <div className="patient-problems">
                    <strong>Problems:</strong>
                    <span className="problem-count">
                      {patient.medicalHistory.problemList.filter(p => p.status === 'active').length} active
                    </span>
                  </div>
                )}

                {patient.metadata.lastVisit && (
                  <div className="patient-last-visit">
                    <strong>Last Visit:</strong> {new Date(patient.metadata.lastVisit).toLocaleDateString()}
                  </div>
                )}

                {patient.demographics.contactInfo.phone && (
                  <div className="patient-contact">
                    📞 {patient.demographics.contactInfo.phone}
                  </div>
                )}
              </div>

              <div className="patient-card-footer">
                <button className="view-btn">View Dashboard →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Patient Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Patient</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="create-patient-form">
              {createError && (
                <div className="form-error">
                  {createError}
                </div>
              )}

              <div className="form-section">
                <h3>Demographics</h3>

                <div className="form-row">
                  <div className="form-field">
                    <label>First Name *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.firstName}
                      onChange={(e) => setNewPatient({...newPatient, firstName: e.target.value})}
                    />
                  </div>

                  <div className="form-field">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newPatient.lastName}
                      onChange={(e) => setNewPatient({...newPatient, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={newPatient.dateOfBirth}
                      onChange={(e) => setNewPatient({...newPatient, dateOfBirth: e.target.value})}
                    />
                  </div>

                  <div className="form-field">
                    <label>Gender *</label>
                    <select
                      required
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Information</h3>

                <div className="form-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                  />
                </div>

                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  />
                </div>

                <div className="form-field">
                  <label>Address</label>
                  <textarea
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Emergency Contact</h3>

                <div className="form-field">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newPatient.emergencyContact.name}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      emergencyContact: { ...newPatient.emergencyContact, name: e.target.value }
                    })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Relationship</label>
                    <input
                      type="text"
                      value={newPatient.emergencyContact.relationship}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        emergencyContact: { ...newPatient.emergencyContact, relationship: e.target.value }
                      })}
                    />
                  </div>

                  <div className="form-field">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={newPatient.emergencyContact.phone}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        emergencyContact: { ...newPatient.emergencyContact, phone: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientList;
