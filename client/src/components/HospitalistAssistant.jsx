import { useState, useRef, useEffect } from 'react';
import './HospitalistAssistant.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function HospitalistAssistant() {
  // Mode and navigation
  const [activeMode, setActiveMode] = useState('hp'); // hp, progress
  const [activeInputTab, setActiveInputTab] = useState('transcript');
  const [activeResultTab, setActiveResultTab] = useState('note');

  // Transcription state
  const [isListening, setIsListening] = useState(false);
  const [isAmbientMode, setIsAmbientMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  // Clinical context state
  const [priorNotes, setPriorNotes] = useState('');
  const [labResults, setLabResults] = useState('');
  const [imagingResults, setImagingResults] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');

  // Progress note specific
  const [hospitalDay, setHospitalDay] = useState('');
  const [admittingDiagnosis, setAdmittingDiagnosis] = useState('');
  const [activeProblems, setActiveProblems] = useState('');
  const [overnightEvents, setOvernightEvents] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  // Evidence toggle
  const [includeEvidence, setIncludeEvidence] = useState(true);

  // Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognitionRef.current.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access or use text input.');
      }
      stopListening();
    };

    recognitionRef.current.onend = () => {
      if (isListening && isAmbientMode) {
        // Auto-restart in ambient mode
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ignore if already started
        }
      }
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, isAmbientMode]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available in this browser.');
      return;
    }
    setError('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (e) {
      setError('Failed to start speech recognition.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearAll = () => {
    setTranscript('');
    setInterimTranscript('');
    setPriorNotes('');
    setLabResults('');
    setImagingResults('');
    setClinicalContext('');
    setHospitalDay('');
    setAdmittingDiagnosis('');
    setActiveProblems('');
    setOvernightEvents('');
    setCurrentMedications('');
    setAnalysisResult(null);
    setRecordingTime(0);
    setError('');
  };

  const generateNote = async () => {
    if (!transcript.trim() && !clinicalContext.trim() && !priorNotes.trim()) {
      setError('Please provide either a transcript or clinical context.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const endpoint = activeMode === 'hp'
        ? `${API_URL}/api/hospitalist/generate-hp`
        : `${API_URL}/api/hospitalist/generate-progress-note`;

      const requestBody = activeMode === 'hp'
        ? {
            transcript,
            clinicalContext,
            priorNotes,
            labResults,
            imagingResults,
            includeEvidence
          }
        : {
            transcript,
            clinicalContext,
            hospitalDay,
            admittingDiagnosis,
            activeProblems: activeProblems.split('\n').filter(p => p.trim()),
            overnightEvents,
            labResults,
            imagingResults,
            currentMedications,
            includeEvidence
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate note');
      }

      if (data.success && data.data) {
        setAnalysisResult(data.data);
        setActiveResultTab('note');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Note generation error:', err);
      setError(err.message || 'Failed to generate note. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enhanceTranscript = async () => {
    if (!transcript.trim()) {
      setError('No transcript to enhance.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/hospitalist/enhance-ambient-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawTranscript: transcript,
          encounterType: activeMode === 'hp' ? 'initial admission' : 'follow-up rounding'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance transcript');
      }

      if (data.success && data.data?.enhancedTranscript) {
        setTranscript(data.data.enhancedTranscript);
      }
    } catch (err) {
      setError(err.message || 'Failed to enhance transcript.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportNote = () => {
    if (!analysisResult?.structuredNote?.sections) return;

    let noteText = `CLINICAL NOTE - ${new Date().toLocaleDateString()}\n`;
    noteText += `Note Type: ${activeMode === 'hp' ? 'History & Physical' : 'Progress Note'}\n`;
    noteText += `Generated by: NeuroLogic Hospitalist Assistant\n`;
    noteText += '═'.repeat(60) + '\n\n';

    analysisResult.structuredNote.sections.forEach(section => {
      noteText += `${section.title}\n`;
      noteText += '-'.repeat(40) + '\n';
      noteText += section.content + '\n\n';
    });

    // Add references if present
    if (analysisResult.references?.length > 0) {
      noteText += '\nREFERENCES\n' + '-'.repeat(40) + '\n';
      analysisResult.references.forEach((ref, i) => {
        noteText += `${i + 1}. ${ref.citation}\n`;
        if (ref.relevance) noteText += `   Relevance: ${ref.relevance}\n`;
      });
    }

    const blob = new Blob([noteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-note-${activeMode}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasContent = transcript.trim() || clinicalContext.trim() || priorNotes.trim();

  return (
    <div className="hospitalist-assistant">
      {/* Header */}
      <div className="ha-header">
        <div className="ha-title-section">
          <h2>Hospitalist Note Generator</h2>
          <p className="ha-subtitle">AI-powered clinical documentation with evidence-based citations</p>
        </div>

        <div className="ha-mode-selector">
          <button
            className={`ha-mode-btn ${activeMode === 'hp' ? 'active' : ''}`}
            onClick={() => setActiveMode('hp')}
          >
            <span className="mode-icon">H&P</span>
            History & Physical
          </button>
          <button
            className={`ha-mode-btn ${activeMode === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveMode('progress')}
          >
            <span className="mode-icon">PN</span>
            Progress Note
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="ha-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}

      <div className="ha-main">
        {/* Input Panel */}
        <div className="ha-input-panel">
          {/* Recording Controls */}
          <div className="ha-recording-section">
            <div className="ha-recording-header">
              <h3>Ambient Listening / Dictation</h3>
              <div className="ha-recording-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isAmbientMode}
                    onChange={(e) => setIsAmbientMode(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  Ambient Mode
                </label>
              </div>
            </div>

            <div className="ha-recording-controls">
              <button
                onClick={toggleListening}
                className={`ha-mic-btn ${isListening ? 'recording' : ''}`}
              >
                {isListening ? (
                  <>
                    <div className="pulse-ring"></div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2"/>
                    </svg>
                  </>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>

              <div className="ha-recording-status">
                {isListening ? (
                  <>
                    <span className="recording-indicator"></span>
                    <span className="recording-time">{formatTime(recordingTime)}</span>
                    <span className="recording-mode">
                      {isAmbientMode ? 'Ambient Listening' : 'Recording'}
                    </span>
                  </>
                ) : (
                  <span className="recording-prompt">Click to {isAmbientMode ? 'start ambient listening' : 'record'}</span>
                )}
              </div>

              {transcript && (
                <button onClick={enhanceTranscript} className="ha-enhance-btn" disabled={isAnalyzing}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Enhance
                </button>
              )}
            </div>
          </div>

          {/* Input Tabs */}
          <div className="ha-input-tabs">
            <button
              className={`ha-tab ${activeInputTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('transcript')}
            >
              Transcript
              {transcript && <span className="tab-indicator"></span>}
            </button>
            <button
              className={`ha-tab ${activeInputTab === 'context' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('context')}
            >
              Clinical Context
              {(priorNotes || labResults || imagingResults || clinicalContext) && <span className="tab-indicator"></span>}
            </button>
            {activeMode === 'progress' && (
              <button
                className={`ha-tab ${activeInputTab === 'progress' ? 'active' : ''}`}
                onClick={() => setActiveInputTab('progress')}
              >
                Progress Details
                {(hospitalDay || activeProblems) && <span className="tab-indicator"></span>}
              </button>
            )}
          </div>

          {/* Transcript Tab */}
          {activeInputTab === 'transcript' && (
            <div className="ha-input-content">
              <textarea
                value={transcript + interimTranscript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setInterimTranscript('');
                }}
                placeholder={activeMode === 'hp'
                  ? `Dictate or paste your H&P here...\n\n"This is a 65-year-old male with a history of hypertension, diabetes, and COPD who presents with worsening shortness of breath and productive cough for 3 days. He reports fever up to 101.5, decreased appetite, and fatigue. Denies chest pain. On exam, alert, tachypneic with respiratory rate 24, oxygen saturation 88% on room air, rhonchi and crackles in the right lower lobe..."`
                  : `Dictate or paste your progress note here...\n\n"Good morning, this is hospital day 3. Patient reports feeling somewhat better, sleeping okay overnight. Cough is less frequent. No fevers overnight. Tolerating oral intake. Ambulated with PT yesterday. On exam, still has some crackles at the right base but improved. WBC trending down, now 11.2 from 15.8..."`
                }
                className="ha-textarea"
              />
            </div>
          )}

          {/* Clinical Context Tab */}
          {activeInputTab === 'context' && (
            <div className="ha-input-content ha-context-grid">
              <div className="ha-context-field">
                <label>Prior Notes / History</label>
                <textarea
                  value={priorNotes}
                  onChange={(e) => setPriorNotes(e.target.value)}
                  placeholder="Paste prior notes, PMH, surgical history, etc..."
                  className="ha-textarea-small"
                />
              </div>

              <div className="ha-context-field">
                <label>Lab Results</label>
                <textarea
                  value={labResults}
                  onChange={(e) => setLabResults(e.target.value)}
                  placeholder="Paste lab results here...\nWBC 15.8, Hgb 12.5, Plt 245\nCr 1.2, BUN 28, K 4.1\nTrop <0.01, BNP 450\nProCT 0.8"
                  className="ha-textarea-small"
                />
              </div>

              <div className="ha-context-field">
                <label>Imaging Results</label>
                <textarea
                  value={imagingResults}
                  onChange={(e) => setImagingResults(e.target.value)}
                  placeholder="Paste radiology reports here...\nCXR: Right lower lobe infiltrate, no effusion\nCT: Ground glass opacities..."
                  className="ha-textarea-small"
                />
              </div>

              <div className="ha-context-field">
                <label>Additional Context</label>
                <textarea
                  value={clinicalContext}
                  onChange={(e) => setClinicalContext(e.target.value)}
                  placeholder="Any additional relevant information..."
                  className="ha-textarea-small"
                />
              </div>
            </div>
          )}

          {/* Progress Note Details Tab */}
          {activeInputTab === 'progress' && activeMode === 'progress' && (
            <div className="ha-input-content ha-context-grid">
              <div className="ha-context-row">
                <div className="ha-context-field ha-small-field">
                  <label>Hospital Day</label>
                  <input
                    type="text"
                    value={hospitalDay}
                    onChange={(e) => setHospitalDay(e.target.value)}
                    placeholder="e.g., 3"
                    className="ha-input"
                  />
                </div>

                <div className="ha-context-field">
                  <label>Admitting Diagnosis</label>
                  <input
                    type="text"
                    value={admittingDiagnosis}
                    onChange={(e) => setAdmittingDiagnosis(e.target.value)}
                    placeholder="e.g., Community-acquired pneumonia"
                    className="ha-input"
                  />
                </div>
              </div>

              <div className="ha-context-field">
                <label>Active Problems (one per line)</label>
                <textarea
                  value={activeProblems}
                  onChange={(e) => setActiveProblems(e.target.value)}
                  placeholder="1. Community-acquired pneumonia
2. Type 2 diabetes mellitus
3. Acute kidney injury - stage 1
4. Hypertension"
                  className="ha-textarea-small"
                />
              </div>

              <div className="ha-context-field">
                <label>Overnight Events</label>
                <textarea
                  value={overnightEvents}
                  onChange={(e) => setOvernightEvents(e.target.value)}
                  placeholder="No events, stable overnight, max temp 99.1..."
                  className="ha-textarea-small"
                />
              </div>

              <div className="ha-context-field">
                <label>Current Medications</label>
                <textarea
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="Ceftriaxone 1g IV daily (day 3)
Azithromycin 500mg PO daily (day 3)
Metformin 500mg BID (held)
Lisinopril 10mg daily..."
                  className="ha-textarea-small"
                />
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="ha-action-bar">
            <div className="ha-action-left">
              <label className="ha-evidence-toggle">
                <input
                  type="checkbox"
                  checked={includeEvidence}
                  onChange={(e) => setIncludeEvidence(e.target.checked)}
                />
                <span className="toggle-slider small"></span>
                Include Evidence Citations
              </label>
            </div>

            <div className="ha-action-right">
              <button onClick={clearAll} className="ha-btn ha-btn-secondary" disabled={isAnalyzing}>
                Clear All
              </button>
              <button
                onClick={generateNote}
                className="ha-btn ha-btn-primary"
                disabled={!hasContent || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <div className="spinner"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Generate {activeMode === 'hp' ? 'H&P' : 'Progress Note'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        {analysisResult && (
          <div className="ha-results-panel">
            <div className="ha-results-header">
              <div className="ha-results-tabs">
                <button
                  className={`ha-tab ${activeResultTab === 'note' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('note')}
                >
                  Clinical Note
                </button>
                <button
                  className={`ha-tab ${activeResultTab === 'assessment' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('assessment')}
                >
                  Assessment & Plan
                </button>
                <button
                  className={`ha-tab ${activeResultTab === 'evidence' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('evidence')}
                >
                  Evidence & Citations
                </button>
                <button
                  className={`ha-tab ${activeResultTab === 'codes' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('codes')}
                >
                  Codes
                </button>
              </div>

              <div className="ha-results-actions">
                <button onClick={exportNote} className="ha-btn ha-btn-icon" title="Export Note">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Note Tab */}
            {activeResultTab === 'note' && (
              <div className="ha-results-content">
                {analysisResult.structuredNote?.sections?.map((section, i) => (
                  <div key={i} className="ha-note-section">
                    <div className="ha-section-header">
                      <h4>{section.title}</h4>
                      <button
                        onClick={() => copyToClipboard(section.content)}
                        className="ha-copy-btn"
                        title="Copy section"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      </button>
                    </div>
                    <div className="ha-section-content">{section.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Assessment & Plan Tab */}
            {activeResultTab === 'assessment' && (
              <div className="ha-results-content">
                {/* Problem-based assessment */}
                {(analysisResult.evidenceBasedAssessment?.problemList || analysisResult.problemBasedAssessment) && (
                  <div className="ha-assessment-section">
                    <h4>Problem-Based Assessment & Plan</h4>
                    {(analysisResult.evidenceBasedAssessment?.problemList || analysisResult.problemBasedAssessment)?.map((problem, i) => (
                      <div key={i} className="ha-problem-card">
                        <div className="ha-problem-header">
                          <span className="ha-problem-number">#{problem.problemNumber || i + 1}</span>
                          <span className="ha-problem-name">{problem.problem}</span>
                          {problem.status && (
                            <span className={`ha-problem-status status-${problem.status?.toLowerCase()}`}>
                              {problem.status}
                            </span>
                          )}
                        </div>

                        <div className="ha-problem-assessment">
                          <strong>Assessment:</strong> {problem.assessment}
                        </div>

                        {problem.differentials && (
                          <div className="ha-problem-differentials">
                            <strong>Differentials:</strong> {problem.differentials.join(', ')}
                          </div>
                        )}

                        <div className="ha-problem-plan">
                          <strong>Plan:</strong>
                          <ul>
                            {(problem.plan || problem.interventions)?.map((item, j) => (
                              <li key={j}>
                                <span className="plan-action">{item.action || item.intervention}</span>
                                {item.citation && (
                                  <span className="plan-citation">[{item.citation}]</span>
                                )}
                                {item.evidenceLevel && (
                                  <span className="plan-evidence-level">{item.evidenceLevel}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {problem.monitoring && (
                          <div className="ha-problem-monitoring">
                            <strong>Monitor:</strong> {problem.monitoring.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Care Progression */}
                {analysisResult.careProgression && (
                  <div className="ha-care-progression">
                    <h4>Care Progression</h4>
                    <div className="ha-progression-phase">
                      <span className={`phase-badge phase-${analysisResult.careProgression.currentPhase?.toLowerCase().replace(/\s/g, '-')}`}>
                        {analysisResult.careProgression.currentPhase}
                      </span>
                    </div>

                    {analysisResult.careProgression.completedMilestones?.length > 0 && (
                      <div className="ha-milestones completed">
                        <h5>Completed Milestones</h5>
                        <ul>
                          {analysisResult.careProgression.completedMilestones.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.careProgression.pendingMilestones?.length > 0 && (
                      <div className="ha-milestones pending">
                        <h5>Pending Milestones</h5>
                        <ul>
                          {analysisResult.careProgression.pendingMilestones.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.careProgression.barriers?.length > 0 && (
                      <div className="ha-barriers">
                        <h5>Barriers to Progress</h5>
                        <div className="barrier-tags">
                          {analysisResult.careProgression.barriers.map((b, i) => (
                            <span key={i} className="barrier-tag">{b}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Discharge Readiness */}
                {analysisResult.dischargeReadiness && (
                  <div className="ha-discharge-readiness">
                    <h4>Discharge Readiness</h4>
                    <div className="ha-readiness-score">
                      <div className="score-circle">
                        <span className="score-value">{analysisResult.dischargeReadiness.readinessScore}</span>
                        <span className="score-max">/100</span>
                      </div>
                      <div className="score-details">
                        <span className="estimated-discharge">
                          Est. Discharge: {analysisResult.dischargeReadiness.estimatedDischarge || analysisResult.dischargeReadiness.estimatedDischargeDate || 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Evidence & Citations Tab */}
            {activeResultTab === 'evidence' && (
              <div className="ha-results-content">
                {/* References from note */}
                {analysisResult.references?.length > 0 && (
                  <div className="ha-evidence-section">
                    <h4>Citations Used in This Note</h4>
                    <div className="ha-references-list">
                      {analysisResult.references.map((ref, i) => (
                        <div key={i} className="ha-reference-item">
                          <span className="ref-number">{i + 1}.</span>
                          <div className="ref-content">
                            <div className="ref-citation">{ref.citation}</div>
                            {ref.guideline && <div className="ref-guideline">Guideline: {ref.guideline}</div>}
                            {ref.relevance && <div className="ref-relevance">Relevance: {ref.relevance}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence sources from database */}
                {analysisResult.evidenceSources?.length > 0 && (
                  <div className="ha-evidence-section">
                    <h4>Guideline Evidence Consulted</h4>
                    {analysisResult.evidenceSources.map((source, i) => (
                      <div key={i} className="ha-guideline-card">
                        <div className="guideline-header">
                          <h5>{source.condition}</h5>
                          <span className="guideline-year">{source.year}</span>
                        </div>
                        <div className="guideline-name">{source.guideline}</div>
                        <div className="guideline-source">{source.source}</div>
                        <div className="guideline-recommendations">
                          {source.recommendations?.map((rec, j) => (
                            <div key={j} className="recommendation-item">
                              <div className="rec-text">{rec.recommendation}</div>
                              <div className="rec-level">Level: {rec.level}</div>
                              <div className="rec-citation">{rec.citation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!analysisResult.references?.length && !analysisResult.evidenceSources?.length) && (
                  <div className="ha-no-evidence">
                    <p>No evidence citations were included in this note.</p>
                    <p>Enable "Include Evidence Citations" and regenerate to see evidence-based recommendations.</p>
                  </div>
                )}
              </div>
            )}

            {/* Codes Tab */}
            {activeResultTab === 'codes' && (
              <div className="ha-results-content">
                {analysisResult.icd10Codes?.length > 0 && (
                  <div className="ha-codes-section">
                    <h4>ICD-10 Diagnosis Codes</h4>
                    <div className="ha-codes-list">
                      {analysisResult.icd10Codes.map((code, i) => (
                        <div key={i} className="ha-code-item icd">
                          <span className="code-value">{code.code}</span>
                          <span className="code-desc">{code.description}</span>
                          {code.type && <span className="code-type">{code.type}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.cptCodes?.length > 0 && (
                  <div className="ha-codes-section">
                    <h4>CPT Codes</h4>
                    <div className="ha-codes-list">
                      {analysisResult.cptCodes.map((code, i) => (
                        <div key={i} className="ha-code-item cpt">
                          <span className="code-value">{code.code}</span>
                          <span className="code-desc">{code.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Alerts */}
                {analysisResult.clinicalAlerts?.length > 0 && (
                  <div className="ha-alerts-section">
                    <h4>Clinical Alerts</h4>
                    {analysisResult.clinicalAlerts.map((alert, i) => (
                      <div key={i} className={`ha-alert-item severity-${alert.severity}`}>
                        <div className="alert-header">
                          <span className="alert-severity">{alert.severity}</span>
                          <span className="alert-text">{alert.alert}</span>
                        </div>
                        {alert.action && <div className="alert-action">Action: {alert.action}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="ha-disclaimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>
          <strong>Clinical Disclaimer:</strong> AI-generated notes require physician review and attestation. Evidence citations should be verified. Not a substitute for clinical judgment.
        </span>
      </div>
    </div>
  );
}

export default HospitalistAssistant;
