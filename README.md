# NeuroLogic Hospitalist Assistant 🏥

**AI-Powered Clinical Decision Support for Hospitalist Physicians**

NeuroLogic transforms clinical dictation into structured medical notes with intelligent care progression tracking, discharge readiness assessment, billing codes, and evidence-based clinical decision support — designed specifically for the hospitalist workflow.

![NeuroLogic](https://img.shields.io/badge/Powered%20by-Claude%20AI-blueviolet)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎤 Voice Transcription & Documentation
- Real-time speech-to-text (Chrome, Edge, Safari)
- Paste external transcriptions or EHR data
- Multiple note types: Progress, H&P, SOAP, Discharge, Procedure

### 📈 Care Progression Tracking
- **Current Care Phase** - Acute Stabilization / Active Treatment / Recovery / Discharge Planning
- **Next Steps** - Prioritized actions to progress patient care
- **Completed Milestones** - What's been accomplished
- **Pending Milestones** - What still needs to happen
- **Barriers to Discharge** - Identify and address blockers
- **Anticipated Length of Stay** - Data-driven estimates

### 🏠 Discharge Readiness Assessment
- **Readiness Score** (0-100) - Overall discharge readiness
- **Criteria Met/Unmet** - Medical stability, functional status, social readiness
- **Outstanding Issues** - What must be resolved before discharge
- **Discharge Disposition** - Home / Home with Services / SNF / Rehab / LTACH
- **Follow-up Needs** - Required appointments and timeframes
- **Discharge Checklist** - Comprehensive preparation tracking

### 📋 Structured Clinical Notes
- **Progress Notes** - Daily hospitalist documentation
- **H&P** - Complete History & Physical format
- **SOAP Notes** - Problem-oriented documentation
- **Discharge Summaries** - Comprehensive discharge documentation
- **Procedure Notes** - Procedural documentation

### 💰 Medical Billing & Coding
- **ICD-10** diagnosis code suggestions
- **CPT** E&M and procedure code suggestions
- Automatic code extraction from clinical content

### 🧠 Clinical Decision Support
- **Differential Diagnoses** - Ranked by likelihood
- **Diagnostic Workup** - Recommended tests with rationale
- **Management Suggestions** - Evidence-based treatment recommendations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/neurologic-hospitalist.git
cd neurologic-hospitalist

# Install dependencies
npm run install:all

# Set up environment variables (API key is pre-configured)
# Or update server/.env with your own key

# Start development servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📦 Deployment

### Deploy to Railway (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/neurologic-hospitalist.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add environment variable: `ANTHROPIC_API_KEY`
   - Railway will auto-detect and deploy

### Deploy to Render

1. Create a new Web Service on [render.com](https://render.com)
2. Configure:
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `npm start`
   - Environment Variable: `ANTHROPIC_API_KEY`

### Deploy with Docker

```bash
docker build -t neurologic-hospitalist .
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=your_key neurologic-hospitalist
```

## 🔧 API Endpoints

### `POST /api/analyze`
Complete clinical analysis with care progression and discharge readiness.

### `POST /api/care-progression`
Detailed care progression analysis and next steps.

### `POST /api/discharge-readiness`
Comprehensive discharge readiness assessment.

### `POST /api/enhance-transcript`
AI-powered transcript cleanup and enhancement.

### `GET /api/health`
Health check endpoint.

## 🏗️ Project Structure

```
neurologic-hospitalist/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   ├── App.css        # Styles
│   │   └── main.jsx       # Entry point
│   └── ...
├── server/                 # Express backend
│   ├── index.js           # API server
│   ├── .env               # Environment variables
│   └── package.json
├── Dockerfile
├── docker-compose.yml
├── railway.json
├── render.yaml
└── README.md
```

## 📱 Usage Guide

### For Daily Rounds

1. **Before seeing patient**: Paste relevant clinical data (labs, vitals, overnight events) into Clinical Context
2. **At bedside**: Dictate or type your assessment and plan
3. **Click Analyze**: Get structured note, care progression, and discharge readiness
4. **Review Next Steps**: See prioritized actions to progress care
5. **Check Discharge Readiness**: Identify barriers and criteria to address

### Sample Clinical Context Input

```
72 y/o female, Hospital Day 3
Admitting Dx: Community-acquired pneumonia
PMH: COPD, CHF (EF 35%), DM2, CKD Stage 3

Vitals: BP 128/76, HR 82, RR 18, T 98.2, SpO2 94% on 2L NC
Labs: WBC 11.2↓ (from 18), Cr 1.4 (baseline), BNP 450
CXR: Improving RLL infiltrate

Current: Ceftriaxone D3, Azithromycin D3, home meds resumed
PT eval: Walking 150ft with walker, needs supervision
Social: Lives alone, daughter available to help
```

## ⚠️ Disclaimer

**NeuroLogic Hospitalist Assistant is for informational purposes only.**

- AI-generated suggestions require professional verification
- Not a substitute for clinical judgment
- Always verify billing codes with official references
- Consult appropriate medical resources for clinical decisions

## 🔒 Security

- API keys stored server-side only
- No patient data stored or logged
- HTTPS recommended for production
- Consider HIPAA compliance requirements

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ for Hospitalists using [Claude AI](https://anthropic.com) by Anthropic
