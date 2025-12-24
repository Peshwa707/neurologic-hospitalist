# 🚀 Railway Deployment Checklist

Quick reference for deploying NeuroLogic Hospitalist Assistant to Railway.

## Pre-Deployment Checklist

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables documented in `.env.example`
- [ ] `.gitignore` is properly configured
- [ ] Anthropic API key is ready

## Railway Setup Checklist

### 1. Create Railway Project
- [ ] Sign in to [railway.app](https://railway.app)
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `neurologic-hospitalist` repository
- [ ] Confirm Dockerfile detected

### 2. Configure Environment Variables
- [ ] Navigate to **Variables** tab
- [ ] Add `ANTHROPIC_API_KEY` (your API key from console.anthropic.com)
- [ ] Add `NODE_ENV` = `production`
- [ ] Save variables

### 3. Initial Deployment
- [ ] Wait for automatic deployment to complete
- [ ] Check **Deployments** tab for green checkmark
- [ ] Review logs for any errors

### 4. Configure Domain
- [ ] Go to **Settings** → **Networking**
- [ ] Click **Generate Domain**
- [ ] Copy the generated URL (e.g., `your-app.railway.app`)
- [ ] (Optional) Add custom domain

### 5. Verify Deployment
- [ ] Visit health endpoint: `https://your-app.railway.app/api/health`
- [ ] Expected response: `{"status":"ok","service":"NeuroLogic Hospitalist Assistant",...}`
- [ ] Visit app URL to access web interface
- [ ] Test voice transcription
- [ ] Test clinical analysis with sample case
- [ ] Verify cognitive bias detection works
- [ ] Check alternative diagnosis exploration

## Post-Deployment Configuration

### Enable Automatic Deployments
- [ ] Go to **Settings** → **Deployments**
- [ ] Enable "Deploy on push to main"
- [ ] Verify webhook is connected

### Set Up Monitoring
- [ ] Review **Observability** tab
- [ ] Check deployment logs
- [ ] Monitor resource usage (CPU, memory)
- [ ] (Optional) Set up error notifications

### Security & Access
- [ ] Verify HTTPS is enabled (automatic)
- [ ] Test CORS configuration
- [ ] Confirm API key is not exposed in logs
- [ ] (Optional) Set up IP allowlisting if needed

## Feature Testing Checklist

### Core Features
- [ ] Voice transcription works in browser
- [ ] Clinical context input accepted
- [ ] Note generation successful (Progress, H&P, SOAP, Discharge, Procedure)
- [ ] ICD-10 codes generated correctly
- [ ] CPT codes generated correctly

### Clinical Decision Support
- [ ] Differential diagnoses displayed
- [ ] Diagnostic workup recommendations shown
- [ ] Management suggestions provided
- [ ] Clinical calculators accessible
- [ ] Drug interaction checking works
- [ ] Clinical alerts triggered appropriately

### NEW: Cognitive Bias Features
- [ ] **Cognitive bias detection** displays in UI (purple cards)
- [ ] **Logical fallacy analysis** shows reasoning errors (orange cards)
- [ ] **Alternative diagnoses** suggested (cyan cards)
- [ ] **Reasoning quality assessment** displayed (purple cards)
- [ ] `/api/explore-alternatives` endpoint working
- [ ] `/api/analyze-biases` endpoint working
- [ ] `/api/biases-fallacies-reference` returns reference data

### Care Management
- [ ] Care progression tracking functional
- [ ] Discharge readiness assessment working
- [ ] Next steps recommendations displayed
- [ ] Barriers to discharge identified

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Build fails | Check Dockerfile, verify dependencies |
| App crashes | Verify `ANTHROPIC_API_KEY` in Variables |
| 500 errors | Check logs, verify API key validity |
| CORS errors | Should not occur (backend serves frontend) |
| Health check fails | Check `/api/health` endpoint in logs |

## Quick Commands

```bash
# View Railway logs
railway logs

# Restart application
# (via dashboard: Deployments → Restart)

# Rollback to previous version
# (via dashboard: Deployments → Previous deployment → Redeploy)

# Update environment variable
# (via dashboard: Variables → Edit)
```

## Success Criteria

✅ **Deployment is successful if:**
1. Build completes without errors
2. Health endpoint returns 200 OK
3. Web interface loads correctly
4. Clinical analysis works end-to-end
5. Cognitive bias features display properly
6. No errors in application logs

## Emergency Rollback

If deployment fails critically:

1. **From Railway Dashboard:**
   - Go to **Deployments**
   - Find last successful deployment (green checkmark)
   - Click **"Redeploy"**

2. **From Git:**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Next Steps After Deployment

- [ ] Share app URL with team/stakeholders
- [ ] Set up monitoring alerts
- [ ] Schedule regular API key rotation
- [ ] Plan staging environment (optional)
- [ ] Review and optimize costs
- [ ] Document any custom configuration

## Resources

- 📖 [Full Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- 🧠 [Cognitive Bias Features](./COGNITIVE_BIAS_FEATURES.md)
- 🏥 [Clinical Decision Support](./CLINICAL_DECISION_SUPPORT.md)
- 🐛 [GitHub Issues](https://github.com/Peshwa707/neurologic-hospitalist/issues)

---

**Estimated Deployment Time:** 5-10 minutes (after Railway account setup)

**Last Updated:** December 2024
