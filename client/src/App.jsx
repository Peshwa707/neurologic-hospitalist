import { useState, useRef, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');
  const [error, setError] = useState('');
  const [noteType, setNoteType] = useState('progress');
  const [seconds, setSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [activeTab, setActiveTab] = useState('context');
  const [activeResultTab, setActiveResultTab] = useState('note');
  const [apiStatus, setApiStatus] = useState('checking');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // Image analysis state
  const [ekgImage, setEkgImage] = useState(null);
  const [ekgImagePreview, setEkgImagePreview] = useState('');
  const [ekgAnalysisResult, setEkgAnalysisResult] = useState(null);
  const [isAnalyzingEkg, setIsAnalyzingEkg] = useState(false);

  const [imagingImage, setImagingImage] = useState(null);
  const [imagingImagePreview, setImagingImagePreview] = useState('');
  const [imagingType, setImagingType] = useState('chest-xray');
  const [imagingQuestion, setImagingQuestion] = useState('');
  const [imagingAnalysisResult, setImagingAnalysisResult] = useState(null);
  const [isAnalyzingImaging, setIsAnalyzingImaging] = useState(false);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const ekgFileInputRef = useRef(null);
  const imagingFileInputRef = useRef(null);

  // Check API health and configuration status on mount
  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then(res => res.json())
      .then(data => {
        setApiStatus('connected');
        setApiKeyConfigured(data.apiKeyConfigured || false);
        // Show settings modal if API key is not configured
        if (!data.apiKeyConfigured) {
          setShowSettings(true);
        }
      })
      .catch(() => setApiStatus('disconnected'));
  }, []);

  // Function to save API key
  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setSavingApiKey(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/config/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save API key');
      }

      setApiKeyConfigured(true);
      setShowSettings(false);
      setApiKey(''); // Clear the input for security
      setApiStatus('connected');

      // Refresh health check
      fetch(`${API_URL}/api/health`)
        .then(res => res.json())
        .then(data => setApiKeyConfigured(data.apiKeyConfigured || false));

    } catch (err) {
      console.error('API key save error:', err);
      setError(err.message || 'Failed to save API key. Please check your key and try again.');
    } finally {
      setSavingApiKey(false);
    }
  };

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
        setError('Microphone access denied. Use the text input instead.');
      }
      stopListening();
    };

    recognitionRef.current.onend = () => {
      if (isListening) recognitionRef.current.start();
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available. Please paste your dictation below.');
      return;
    }
    setError('');
    recognitionRef.current.start();
    setIsListening(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setInterimTranscript('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const clearAll = () => {
    setTranscript('');
    setInterimTranscript('');
    setClinicalContext('');
    setAnalysisResults(null);
    setSeconds(0);
    setError('');
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const analyzeTranscript = async () => {
    if ((!transcript.trim() && !clinicalContext.trim()) || isAnalyzing) return;
    
    if (apiStatus !== 'connected') {
      setError('Backend server not connected. Please check your deployment.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          clinicalContext,
          noteType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      if (data.success && data.data) {
        setAnalysisResults(data.data);
        setActiveResultTab('note');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportNote = () => {
    if (!analysisResults?.structuredNote?.sections) return;
    
    let noteText = `CLINICAL NOTE - ${new Date().toLocaleDateString()}\n`;
    noteText += `Note Type: ${noteType.toUpperCase()}\n`;
    noteText += `Generated by: NeuroLogic Hospitalist Assistant\n`;
    noteText += '═'.repeat(50) + '\n\n';
    
    analysisResults.structuredNote.sections.forEach(section => {
      noteText += `${section.title.toUpperCase()}\n`;
      noteText += '-'.repeat(30) + '\n';
      noteText += section.content + '\n\n';
    });

    if (analysisResults.icd10Codes?.length) {
      noteText += 'ICD-10 CODES\n' + '-'.repeat(30) + '\n';
      analysisResults.icd10Codes.forEach(c => {
        noteText += `${c.code}: ${c.description}\n`;
      });
      noteText += '\n';
    }

    if (analysisResults.cptCodes?.length) {
      noteText += 'CPT CODES\n' + '-'.repeat(30) + '\n';
      analysisResults.cptCodes.forEach(c => {
        noteText += `${c.code}: ${c.description}\n`;
      });
    }

    const blob = new Blob([noteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-note-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReadinessColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  // EKG Image Handling
  const handleEkgImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setEkgImage(base64);
      setEkgImagePreview(base64);
      setEkgAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeEkg = async () => {
    if (!ekgImage || isAnalyzingEkg) return;

    if (apiStatus !== 'connected') {
      setError('Backend server not connected. Please check your deployment.');
      return;
    }

    setIsAnalyzingEkg(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/analyze-ekg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: ekgImage,
          clinicalContext: clinicalContext,
          patientData: {
            demographics: 'Extracted from clinical context if available'
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'EKG analysis failed');
      }

      if (data.success && data.data) {
        setEkgAnalysisResult(data.data);
        setActiveTab('ekg');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('EKG analysis error:', err);
      setError(err.message || 'EKG analysis failed. Please try again.');
    } finally {
      setIsAnalyzingEkg(false);
    }
  };

  const clearEkg = () => {
    setEkgImage(null);
    setEkgImagePreview('');
    setEkgAnalysisResult(null);
    if (ekgFileInputRef.current) {
      ekgFileInputRef.current.value = '';
    }
  };

  // Imaging Handling
  const handleImagingImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setImagingImage(base64);
      setImagingImagePreview(base64);
      setImagingAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImaging = async () => {
    if (!imagingImage || isAnalyzingImaging) return;

    if (apiStatus !== 'connected') {
      setError('Backend server not connected. Please check your deployment.');
      return;
    }

    setIsAnalyzingImaging(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/analyze-imaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagingImage,
          imagingType: imagingType,
          clinicalContext: clinicalContext,
          clinicalQuestion: imagingQuestion,
          patientData: {
            demographics: 'Extracted from clinical context if available'
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Imaging analysis failed');
      }

      if (data.success && data.data) {
        setImagingAnalysisResult(data.data);
        setActiveTab('imaging');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Imaging analysis error:', err);
      setError(err.message || 'Imaging analysis failed. Please try again.');
    } finally {
      setIsAnalyzingImaging(false);
    }
  };

  const clearImaging = () => {
    setImagingImage(null);
    setImagingImagePreview('');
    setImagingAnalysisResult(null);
    setImagingQuestion('');
    if (imagingFileInputRef.current) {
      imagingFileInputRef.current.value = '';
    }
  };

  const noteTypes = [
    { id: 'progress', label: 'Progress' },
    { id: 'hp', label: 'H&P' },
    { id: 'soap', label: 'SOAP' },
    { id: 'discharge', label: 'Discharge' },
    { id: 'procedure', label: 'Procedure' }
  ];

  const hasContent = transcript.trim() || clinicalContext.trim();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1 className="title">NeuroLogic</h1>
            <span className="subtitle">Hospitalist Assistant</span>
          </div>
        </div>
        <div className="header-right">
          <span className={`api-status ${apiStatus}`}>
            <span className="status-dot"></span>
            {apiStatus === 'connected' ? 'Connected' : apiStatus === 'checking' ? 'Checking...' : 'Disconnected'}
          </span>
          {!apiKeyConfigured && (
            <button
              onClick={() => setShowSettings(true)}
              className="settings-btn warning"
              title="Configure API Key"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Setup Required
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="settings-btn"
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6M6 12H1m6 0h6m6 0h5"/>
            </svg>
          </button>
          <span className="badge">AI Clinical Decision Support</span>
        </div>
      </header>

      <main className="main">
        {/* Left Column */}
        <div className="left-panel">
          {/* Note Type & Actions Bar */}
          <div className="top-bar">
            <div className="note-type-selector">
              {noteTypes.map(nt => (
                <button
                  key={nt.id}
                  onClick={() => setNoteType(nt.id)}
                  className={`note-type-btn ${noteType === nt.id ? 'active' : ''}`}
                >
                  {nt.label}
                </button>
              ))}
            </div>
            <div className="top-actions">
              <button 
                onClick={clearAll} 
                disabled={!hasContent && !analysisResults}
                className="action-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Clear
              </button>
              {analysisResults && (
                <button onClick={exportNote} className="action-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export
                </button>
              )}
              <button
                onClick={analyzeTranscript}
                disabled={!hasContent || isAnalyzing || apiStatus !== 'connected'}
                className="action-btn primary"
              >
                {isAnalyzing ? (
                  <>
                    <div className="spinner"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Input Tabs */}
          <div className="card">
            <div className="tab-header">
              <button
                onClick={() => setActiveTab('context')}
                className={`tab ${activeTab === 'context' ? 'active' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Clinical Context
                {clinicalContext && <span className="tab-dot"></span>}
              </button>
              <button
                onClick={() => setActiveTab('dictation')}
                className={`tab ${activeTab === 'dictation' ? 'active' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                </svg>
                Dictation
                {transcript && <span className="tab-dot"></span>}
              </button>
              <button
                onClick={() => setActiveTab('ekg')}
                className={`tab ${activeTab === 'ekg' ? 'active' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                EKG
                {ekgImagePreview && <span className="tab-dot"></span>}
              </button>
              <button
                onClick={() => setActiveTab('imaging')}
                className={`tab ${activeTab === 'imaging' ? 'active' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Imaging
                {imagingImagePreview && <span className="tab-dot"></span>}
              </button>
            </div>

            {activeTab === 'context' && (
              <div className="card-body">
                <div className="input-header">
                  <span className="input-label">Patient Data & Hospital Course</span>
                  <span className="input-hint">Labs, vitals, imaging, PMH, hospital day, active problems</span>
                </div>
                <textarea
                  value={clinicalContext}
                  onChange={(e) => setClinicalContext(e.target.value)}
                  placeholder={`Paste clinical data here...

• Demographics: 72 y/o female
• Hospital Day: 3
• Admitting Dx: Community-acquired pneumonia
• PMH: COPD, CHF (EF 35%), DM2, CKD Stage 3
• Vitals: BP 128/76, HR 82, RR 18, T 98.2, SpO2 94% on 2L NC
• Labs: WBC 11.2 (down from 18), Cr 1.4 (baseline), BNP 450
• Imaging: CXR showing improving RLL infiltrate
• Current Meds: Ceftriaxone day 3, azithromycin day 3, home meds
• Functional: PT evaluated, walking 150ft with walker
• Social: Lives alone, daughter available to help`}
                  className="text-area"
                />
              </div>
            )}

            {activeTab === 'dictation' && (
              <div className="card-body">
                <div className="input-header">
                  <span className="input-label">Encounter Documentation</span>
                  <div className="recording-controls">
                    <button onClick={toggleListening} className="mic-button">
                      <div className={`mic-button-inner ${isListening ? 'recording' : ''}`}>
                        {isListening ? (
                          <div className="pause-icon">
                            <div className="pause-bar"></div>
                            <div className="pause-bar"></div>
                          </div>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="white" strokeWidth="2"/>
                          </svg>
                        )}
                      </div>
                      {isListening && <div className="pulse-ring"></div>}
                    </button>
                    <span className="recording-status">
                      {isListening ? (
                        <><span className="live-dot"></span> {formatTime(seconds)}</>
                      ) : (
                        'Click mic or paste'
                      )}
                    </span>
                  </div>
                </div>
                <textarea
                  value={transcript + interimTranscript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setInterimTranscript('');
                  }}
                  placeholder={`Dictate or paste your clinical note...

"72 year old female hospital day 3 with CAP, improving. Overnight no events, no fever. She reports feeling better, cough improving, less SOB. Tolerating PO well. Ambulated with PT yesterday and did well. On exam alert and oriented, lungs with decreased crackles at right base, improved air movement. Plan to transition to oral antibiotics today, continue to monitor, PT to reassess, anticipate discharge tomorrow if continues to improve. Will arrange home health for medication management and follow up with PCP in 1 week."`}
                  className="text-area"
                />
              </div>
            )}

            {/* EKG Tab */}
            {activeTab === 'ekg' && (
              <div className="card-body">
                <div className="input-header">
                  <span className="input-label">EKG Analysis</span>
                  <div className="image-controls">
                    <input
                      type="file"
                      ref={ekgFileInputRef}
                      onChange={handleEkgImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => ekgFileInputRef.current?.click()}
                      className="upload-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload EKG Image
                    </button>
                    {ekgImagePreview && (
                      <>
                        <button onClick={analyzeEkg} disabled={isAnalyzingEkg} className="analyze-btn">
                          {isAnalyzingEkg ? (
                            <>
                              <div className="spinner"></div>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                              </svg>
                              Analyze EKG
                            </>
                          )}
                        </button>
                        <button onClick={clearEkg} className="clear-btn">Clear</button>
                      </>
                    )}
                  </div>
                </div>
                {ekgImagePreview && (
                  <div className="image-preview">
                    <img src={ekgImagePreview} alt="EKG" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                  </div>
                )}
                {ekgAnalysisResult && (
                  <div className="analysis-results">
                    <h4 className="analysis-title">EKG Interpretation</h4>

                    {/* Rate and Rhythm */}
                    <div className="analysis-section">
                      <h5>Rate & Rhythm</h5>
                      <p><strong>Ventricular Rate:</strong> {ekgAnalysisResult.rate?.ventricular}</p>
                      <p><strong>Rhythm:</strong> {ekgAnalysisResult.rhythm?.description}</p>
                      <p><strong>Regularity:</strong> {ekgAnalysisResult.rhythm?.regularity}</p>
                    </div>

                    {/* Critical Alerts */}
                    {ekgAnalysisResult.criticalAlerts?.length > 0 && (
                      <div className="analysis-section critical">
                        <h5>⚠️ Critical Alerts</h5>
                        {ekgAnalysisResult.criticalAlerts.map((alert, i) => (
                          <div key={i} className="alert-item">
                            <p><strong>{alert.alert}</strong></p>
                            <p>Action: {alert.action}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interpretation */}
                    <div className="analysis-section">
                      <h5>Interpretation</h5>
                      <p><strong>Primary:</strong> {ekgAnalysisResult.interpretation?.primary}</p>
                      {ekgAnalysisResult.interpretation?.additional?.length > 0 && (
                        <ul>
                          {ekgAnalysisResult.interpretation.additional.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Findings */}
                    {ekgAnalysisResult.findings?.length > 0 && (
                      <div className="analysis-section">
                        <h5>Findings</h5>
                        {ekgAnalysisResult.findings.map((finding, i) => (
                          <div key={i} className="finding-item">
                            <p><strong>{finding.category}:</strong> {finding.finding}</p>
                            <p className={`severity-${finding.severity?.toLowerCase()}`}>
                              Severity: {finding.severity}
                            </p>
                            {finding.leads?.length > 0 && (
                              <p>Leads: {finding.leads.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {ekgAnalysisResult.recommendations?.length > 0 && (
                      <div className="analysis-section">
                        <h5>Recommendations</h5>
                        {ekgAnalysisResult.recommendations.map((rec, i) => (
                          <div key={i} className={`recommendation-item priority-${rec.priority?.toLowerCase()}`}>
                            <p><strong>{rec.action}</strong></p>
                            <p>{rec.rationale}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Urgency */}
                    <div className={`analysis-section urgency-${ekgAnalysisResult.urgency?.level?.toLowerCase().replace(/\s/g, '-')}`}>
                      <h5>Urgency Assessment</h5>
                      <p><strong>Level:</strong> {ekgAnalysisResult.urgency?.level}</p>
                      <p><strong>Timeframe:</strong> {ekgAnalysisResult.urgency?.timeframe}</p>
                      <p>{ekgAnalysisResult.urgency?.reasoning}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Imaging Tab */}
            {activeTab === 'imaging' && (
              <div className="card-body">
                <div className="input-header">
                  <span className="input-label">Medical Imaging Analysis</span>
                  <div className="imaging-type-selector">
                    <select
                      value={imagingType}
                      onChange={(e) => setImagingType(e.target.value)}
                      className="imaging-type-select"
                    >
                      <option value="chest-xray">Chest X-ray</option>
                      <option value="abdominal-xray">Abdominal X-ray</option>
                      <option value="ct-head">CT Head</option>
                      <option value="ct-chest">CT Chest</option>
                      <option value="ct-abdomen">CT Abdomen/Pelvis</option>
                      <option value="mri-brain">MRI Brain</option>
                      <option value="mri-spine">MRI Spine</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="image-controls">
                    <input
                      type="file"
                      ref={imagingFileInputRef}
                      onChange={handleImagingImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => imagingFileInputRef.current?.click()}
                      className="upload-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Image
                    </button>
                    {imagingImagePreview && (
                      <>
                        <button onClick={analyzeImaging} disabled={isAnalyzingImaging} className="analyze-btn">
                          {isAnalyzingImaging ? (
                            <>
                              <div className="spinner"></div>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              </svg>
                              Analyze Imaging
                            </>
                          )}
                        </button>
                        <button onClick={clearImaging} className="clear-btn">Clear</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Clinical Question Input */}
                <textarea
                  value={imagingQuestion}
                  onChange={(e) => setImagingQuestion(e.target.value)}
                  placeholder="Optional: Specific clinical question (e.g., 'Rule out pneumonia', 'Evaluate for free air')"
                  className="clinical-question-input"
                  rows="2"
                />

                {imagingImagePreview && (
                  <div className="image-preview">
                    <img src={imagingImagePreview} alt="Medical Imaging" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                  </div>
                )}

                {imagingAnalysisResult && (
                  <div className="analysis-results">
                    <h4 className="analysis-title">Imaging Interpretation</h4>

                    {/* Study Information */}
                    <div className="analysis-section">
                      <h5>Study Information</h5>
                      <p><strong>Modality:</strong> {imagingAnalysisResult.studyInformation?.modalityConfirmed}</p>
                      <p><strong>Quality:</strong> {imagingAnalysisResult.studyInformation?.technicalQuality}</p>
                      {imagingAnalysisResult.studyInformation?.viewsPresent?.length > 0 && (
                        <p><strong>Views:</strong> {imagingAnalysisResult.studyInformation.viewsPresent.join(', ')}</p>
                      )}
                    </div>

                    {/* Critical Findings */}
                    {imagingAnalysisResult.acuteFindings?.present && imagingAnalysisResult.acuteFindings?.criticalFindings?.length > 0 && (
                      <div className="analysis-section critical">
                        <h5>🚨 Critical Findings</h5>
                        {imagingAnalysisResult.acuteFindings.criticalFindings.map((finding, i) => (
                          <div key={i} className="critical-finding">
                            <p><strong>{finding.finding}</strong></p>
                            <p>Location: {finding.location}</p>
                            <p>Action: {finding.clinicalAction}</p>
                            <p className="timeframe">Timeframe: {finding.timeframe}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Primary Findings */}
                    {imagingAnalysisResult.systematicReview?.primaryFindings?.length > 0 && (
                      <div className="analysis-section">
                        <h5>Primary Findings</h5>
                        {imagingAnalysisResult.systematicReview.primaryFindings.map((finding, i) => (
                          <div key={i} className="finding-item">
                            <p><strong>Location:</strong> {finding.anatomicalLocation}</p>
                            <p><strong>Finding:</strong> {finding.finding}</p>
                            {finding.size && <p><strong>Size:</strong> {finding.size}</p>}
                            <p><strong>Significance:</strong> {finding.significance}</p>
                            <p className={`acuity-${finding.acuity?.toLowerCase()}`}>
                              Acuity: {finding.acuity}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Impressions */}
                    {imagingAnalysisResult.impressions?.length > 0 && (
                      <div className="analysis-section">
                        <h5>Impressions</h5>
                        {imagingAnalysisResult.impressions.map((impression, i) => (
                          <div key={i} className={`impression-item severity-${impression.severity?.toLowerCase()}`}>
                            <p><strong>{impression.finding}</strong></p>
                            <p>Severity: {impression.severity} | Urgency: {impression.urgency}</p>
                            <p>Confidence: {impression.confidence}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Differential Diagnosis */}
                    {imagingAnalysisResult.differentialDiagnosis?.length > 0 && (
                      <div className="analysis-section">
                        <h5>Differential Diagnosis</h5>
                        {imagingAnalysisResult.differentialDiagnosis.map((dx, i) => (
                          <div key={i} className="differential-item">
                            <p><strong>{dx.diagnosis}</strong> (Likelihood: {dx.likelihood})</p>
                            {dx.supportingFeatures?.length > 0 && (
                              <p>Supporting: {dx.supportingFeatures.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="analysis-section">
                      <h5>Recommendations</h5>
                      {imagingAnalysisResult.recommendations?.immediate?.length > 0 && (
                        <div className="recommendation-group">
                          <h6>Immediate:</h6>
                          {imagingAnalysisResult.recommendations.immediate.map((rec, i) => (
                            <p key={i}>• {rec.recommendation} - {rec.rationale}</p>
                          ))}
                        </div>
                      )}
                      {imagingAnalysisResult.recommendations?.followUp?.length > 0 && (
                        <div className="recommendation-group">
                          <h6>Follow-up:</h6>
                          {imagingAnalysisResult.recommendations.followUp.map((rec, i) => (
                            <p key={i}>• {rec.recommendation} ({rec.timeframe})</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Urgency Assessment */}
                    <div className={`analysis-section urgency-${imagingAnalysisResult.urgencyAssessment?.overallUrgency?.toLowerCase()}`}>
                      <h5>Urgency Assessment</h5>
                      <p><strong>Overall Urgency:</strong> {imagingAnalysisResult.urgencyAssessment?.overallUrgency}</p>
                      <p>{imagingAnalysisResult.urgencyAssessment?.reasoning}</p>
                      <p><strong>Communication:</strong> {imagingAnalysisResult.urgencyAssessment?.communicationNeeded}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Tabs */}
          {analysisResults && (
            <div className="card">
              <div className="tab-header result-tabs">
                <button
                  onClick={() => setActiveResultTab('note')}
                  className={`tab ${activeResultTab === 'note' ? 'active' : ''}`}
                >
                  📋 Note
                </button>
                <button
                  onClick={() => setActiveResultTab('progression')}
                  className={`tab ${activeResultTab === 'progression' ? 'active' : ''}`}
                >
                  📈 Care Progression
                </button>
                <button
                  onClick={() => setActiveResultTab('discharge')}
                  className={`tab ${activeResultTab === 'discharge' ? 'active' : ''}`}
                >
                  🏠 Discharge Readiness
                </button>
              </div>

              <div className="card-body">
                {/* Structured Note Tab */}
                {activeResultTab === 'note' && analysisResults?.structuredNote?.sections?.length > 0 && (
                  <div className="note-sections">
                    {analysisResults.structuredNote.sections.map((section, i) => (
                      <div key={i} className="note-section">
                        <div className="note-section-header">{section.title}</div>
                        <div className="note-section-content">{section.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Care Progression Tab */}
                {activeResultTab === 'progression' && analysisResults?.careProgression && (
                  <div className="progression-section">
                    <div className="progression-header">
                      <div className="phase-badge" data-phase={analysisResults.careProgression.currentPhase?.toLowerCase()}>
                        {analysisResults.careProgression.currentPhase || 'Assessment Pending'}
                      </div>
                      {analysisResults.careProgression.anticipatedLOS && (
                        <div className="los-estimate">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          Est. LOS: {analysisResults.careProgression.anticipatedLOS}
                        </div>
                      )}
                    </div>

                    {/* Next Steps */}
                    {analysisResults.careProgression.nextSteps?.length > 0 && (
                      <div className="progression-card">
                        <h4 className="progression-card-title">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                          Next Steps to Progress Care
                        </h4>
                        <div className="next-steps-list">
                          {analysisResults.careProgression.nextSteps.map((step, i) => (
                            <div key={i} className={`next-step-item priority-${step.priority}`}>
                              <div className="step-header">
                                <span className="step-action">{step.action}</span>
                                <span className={`step-priority ${step.priority}`}>{step.priority}</span>
                              </div>
                              <div className="step-details">
                                <span className="step-rationale">{step.rationale}</span>
                                {step.timeframe && <span className="step-timeframe">⏱ {step.timeframe}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    <div className="milestones-row">
                      {analysisResults.careProgression.completedMilestones?.length > 0 && (
                        <div className="milestone-card completed">
                          <h5>✓ Completed</h5>
                          <ul>
                            {analysisResults.careProgression.completedMilestones.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysisResults.careProgression.pendingMilestones?.length > 0 && (
                        <div className="milestone-card pending">
                          <h5>○ Pending</h5>
                          <ul>
                            {analysisResults.careProgression.pendingMilestones.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Barriers */}
                    {analysisResults.careProgression.barriers?.length > 0 && (
                      <div className="barriers-section">
                        <h5>⚠️ Barriers to Discharge</h5>
                        <div className="barriers-list">
                          {analysisResults.careProgression.barriers.map((b, i) => (
                            <span key={i} className="barrier-tag">{b}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Discharge Readiness Tab */}
                {activeResultTab === 'discharge' && analysisResults?.dischargeReadiness && (
                  <div className="discharge-section">
                    {/* Readiness Score */}
                    <div className="readiness-score-card">
                      <div className="score-circle" style={{ 
                        background: `conic-gradient(${getReadinessColor(analysisResults.dischargeReadiness.readinessScore)} ${analysisResults.dischargeReadiness.readinessScore}%, rgba(255,255,255,0.1) 0)` 
                      }}>
                        <div className="score-inner">
                          <span className="score-value">{analysisResults.dischargeReadiness.readinessScore}</span>
                          <span className="score-label">/ 100</span>
                        </div>
                      </div>
                      <div className="score-details">
                        <span className="readiness-level" style={{ color: getReadinessColor(analysisResults.dischargeReadiness.readinessScore) }}>
                          {analysisResults.dischargeReadiness.readinessLevel}
                        </span>
                        {analysisResults.dischargeReadiness.estimatedDischargeDate && (
                          <span className="estimated-date">
                            Est. Discharge: {analysisResults.dischargeReadiness.estimatedDischargeDate}
                          </span>
                        )}
                        {analysisResults.dischargeReadiness.dischargeDisposition && (
                          <span className="disposition">
                            Disposition: {analysisResults.dischargeReadiness.dischargeDisposition}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Criteria Met */}
                    {analysisResults.dischargeReadiness.criteriaMet?.length > 0 && (
                      <div className="criteria-section">
                        <h5>Discharge Criteria</h5>
                        <div className="criteria-list">
                          {analysisResults.dischargeReadiness.criteriaMet.map((c, i) => (
                            <div key={i} className={`criteria-item status-${c.status?.replace(' ', '-')}`}>
                              <span className="criteria-status">
                                {c.status === 'met' ? '✓' : c.status === 'in progress' ? '○' : '✗'}
                              </span>
                              <div className="criteria-content">
                                <span className="criteria-name">{c.criterion}</span>
                                {c.details && <span className="criteria-details">{c.details}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outstanding Issues */}
                    {analysisResults.dischargeReadiness.outstandingIssues?.length > 0 && (
                      <div className="outstanding-section">
                        <h5>⚠️ Outstanding Issues</h5>
                        <ul>
                          {analysisResults.dischargeReadiness.outstandingIssues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Follow-up Needs */}
                    {analysisResults.dischargeReadiness.followUpNeeds?.length > 0 && (
                      <div className="followup-section">
                        <h5>📅 Follow-up Needs</h5>
                        <div className="followup-list">
                          {analysisResults.dischargeReadiness.followUpNeeds.map((f, i) => (
                            <span key={i} className="followup-tag">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Clinical Decision Support */}
        <div className="right-panel">
          {/* Medical Coding */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
                Medical Coding
              </span>
            </div>
            <div className="card-body">
              {(analysisResults?.icd10Codes?.length > 0 || analysisResults?.cptCodes?.length > 0) ? (
                <div className="coding-section">
                  {analysisResults.icd10Codes?.length > 0 && (
                    <div className="code-category">
                      <div className="code-category-title">ICD-10</div>
                      <div className="code-chips">
                        {analysisResults.icd10Codes.map((code, i) => (
                          <span key={i} className="code-chip icd">
                            <strong>{code.code}</strong> {code.description}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysisResults.cptCodes?.length > 0 && (
                    <div className="code-category">
                      <div className="code-category-title">CPT</div>
                      <div className="code-chips">
                        {analysisResults.cptCodes.map((code, i) => (
                          <span key={i} className="code-chip cpt">
                            <strong>{code.code}</strong> {code.description}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="empty-state-small">Codes appear after analysis</p>
              )}
            </div>
          </div>

          {/* Differentials */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Differential Diagnoses
              </span>
            </div>
            <div className="card-body">
              {analysisResults?.differentialDiagnoses?.length > 0 ? (
                <ul className="cdss-list">
                  {analysisResults.differentialDiagnoses.map((dx, i) => (
                    <li key={i} className={`cdss-item ${i === 0 ? 'high-priority' : ''}`}>
                      <span className={`bullet ${i === 0 ? 'high' : ''}`}></span>
                      {dx}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state-small">Differentials appear after analysis</p>
              )}
            </div>
          </div>

          {/* Diagnostic Workup */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Diagnostic Workup
              </span>
            </div>
            <div className="card-body">
              {analysisResults?.diagnosticWorkup?.length > 0 ? (
                <ul className="cdss-list">
                  {analysisResults.diagnosticWorkup.map((item, i) => (
                    <li key={i} className={`cdss-item ${item.priority === 'high' ? 'high-priority' : ''}`}>
                      <span className={`bullet ${item.priority === 'high' ? 'high' : ''}`}></span>
                      <span><strong>{item.test}</strong>: {item.rationale}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state-small">Workup recommendations appear after analysis</p>
              )}
            </div>
          </div>

          {/* Management */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Management Plan
              </span>
            </div>
            <div className="card-body">
              {analysisResults?.managementSuggestions?.length > 0 ? (
                <ul className="cdss-list">
                  {analysisResults.managementSuggestions.map((item, i) => (
                    <li key={i} className={`cdss-item ${item.priority === 'high' ? 'high-priority' : ''}`}>
                      <span className={`bullet ${item.priority === 'high' ? 'high' : ''}`}></span>
                      {item.recommendation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state-small">Management suggestions appear after analysis</p>
              )}
            </div>
          </div>

          {/* Cognitive Biases */}
          {analysisResults?.cognitiveBiases?.length > 0 && (
            <div className="card bias-card">
              <div className="card-header">
                <span className="card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  ⚠️ Cognitive Bias Alerts
                </span>
              </div>
              <div className="card-body">
                <div className="bias-list">
                  {analysisResults.cognitiveBiases.map((bias, i) => (
                    <div key={i} className="bias-item">
                      <div className="bias-header">
                        <span className="bias-type">{bias.biasType}</span>
                        {bias.severity && (
                          <span className={`severity-badge ${bias.severity}`}>{bias.severity}</span>
                        )}
                      </div>
                      <p className="bias-evidence"><strong>Evidence:</strong> {bias.evidence}</p>
                      {bias.impact && <p className="bias-impact"><strong>Impact:</strong> {bias.impact}</p>}
                      {bias.mitigation && (
                        <div className="bias-mitigation">
                          <strong>Mitigation:</strong>
                          {typeof bias.mitigation === 'string' ? (
                            <p>{bias.mitigation}</p>
                          ) : Array.isArray(bias.mitigation) ? (
                            <ul>
                              {bias.mitigation.map((m, idx) => (
                                <li key={idx}>{m}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{bias.mitigation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logical Fallacies */}
          {analysisResults?.logicalFallacies?.length > 0 && (
            <div className="card fallacy-card">
              <div className="card-header">
                <span className="card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Logical Reasoning Analysis
                </span>
              </div>
              <div className="card-body">
                <div className="fallacy-list">
                  {analysisResults.logicalFallacies.map((fallacy, i) => (
                    <div key={i} className="fallacy-item">
                      <div className="fallacy-header">
                        <span className="fallacy-type">{fallacy.fallacyType}</span>
                      </div>
                      <p className="fallacy-description">{fallacy.description}</p>
                      {fallacy.correction && (
                        <p className="fallacy-correction"><strong>Correction:</strong> {fallacy.correction}</p>
                      )}
                      {fallacy.problemWithReasoning && (
                        <p className="fallacy-problem"><strong>Issue:</strong> {fallacy.problemWithReasoning}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Alternative Diagnoses */}
          {analysisResults?.alternativeDiagnoses?.length > 0 && (
            <div className="card alternative-card">
              <div className="card-header">
                <span className="card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  Alternative Diagnoses to Consider
                </span>
              </div>
              <div className="card-body">
                <div className="alternative-list">
                  {analysisResults.alternativeDiagnoses.map((alt, i) => (
                    <div key={i} className="alternative-item">
                      <div className="alternative-diagnosis">{alt.diagnosis}</div>
                      <p className="alternative-reason"><strong>Why Consider:</strong> {alt.whyConsider}</p>
                      {alt.distinguishingFeatures && (
                        <p className="alternative-features"><strong>Distinguishing Features:</strong> {alt.distinguishingFeatures}</p>
                      )}
                      {alt.consequenceOfMissing && (
                        <p className="alternative-consequence"><strong>If Missed:</strong> {alt.consequenceOfMissing}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reasoning Quality */}
          {analysisResults?.reasoningQuality && (
            <div className="card reasoning-card">
              <div className="card-header">
                <span className="card-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Reasoning Quality Assessment
                </span>
              </div>
              <div className="card-body">
                <div className="reasoning-section">
                  {analysisResults.reasoningQuality.strengths?.length > 0 && (
                    <div className="reasoning-strengths">
                      <h5>✓ Strengths</h5>
                      <ul>
                        {analysisResults.reasoningQuality.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResults.reasoningQuality.weaknesses?.length > 0 && (
                    <div className="reasoning-weaknesses">
                      <h5>⚠ Areas for Improvement</h5>
                      <ul>
                        {analysisResults.reasoningQuality.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResults.reasoningQuality.uncertaintyFactors?.length > 0 && (
                    <div className="reasoning-uncertainty">
                      <h5>? Key Uncertainties</h5>
                      <ul>
                        {analysisResults.reasoningQuality.uncertaintyFactors.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResults.reasoningQuality.recommendedApproach && (
                    <div className="reasoning-recommendation">
                      <h5>Recommended Approach</h5>
                      <p>{analysisResults.reasoningQuality.recommendedApproach}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="disclaimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span><strong>Clinical Disclaimer:</strong> AI-generated suggestions require professional verification. Not a substitute for clinical judgment.</span>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => !apiKeyConfigured ? null : setShowSettings(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6M6 12H1m6 0h6m6 0h5"/>
                </svg>
                Settings
              </h2>
              {apiKeyConfigured && (
                <button onClick={() => setShowSettings(false)} className="modal-close">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="modal-body">
              {!apiKeyConfigured && (
                <div className="setup-notice">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <h3>Setup Required</h3>
                  <p>An Anthropic API key is required to use NeuroLogic Hospitalist Assistant.</p>
                </div>
              )}

              <div className="settings-section">
                <label className="settings-label">
                  <span className="label-text">
                    <strong>Anthropic API Key</strong>
                    {apiKeyConfigured && <span className="configured-badge">✓ Configured</span>}
                  </span>
                  <span className="label-hint">
                    Get your API key from{' '}
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">
                      console.anthropic.com
                    </a>
                  </span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={apiKeyConfigured ? "Enter new key to update..." : "sk-ant-api03-..."}
                  className="settings-input"
                  onKeyPress={(e) => e.key === 'Enter' && saveApiKey()}
                />
                <div className="settings-help">
                  <p>
                    <strong>Your API key is stored securely</strong> in the application runtime and is never logged or transmitted except to Anthropic's API.
                  </p>
                  <p>
                    <strong>New to Anthropic?</strong> Sign up for free credits at{' '}
                    <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">
                      console.anthropic.com
                    </a>
                  </p>
                </div>
              </div>

              {error && (
                <div className="settings-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {apiKeyConfigured && (
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setApiKey('');
                    setError('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={saveApiKey}
                disabled={savingApiKey || !apiKey.trim()}
                className="btn-primary"
              >
                {savingApiKey ? (
                  <>
                    <div className="spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {apiKeyConfigured ? 'Update API Key' : 'Save & Continue'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
