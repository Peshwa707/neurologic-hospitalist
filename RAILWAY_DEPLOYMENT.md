# Railway Deployment Guide

This guide will walk you through deploying NeuroLogic Hospitalist Assistant to Railway.

## Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **GitHub Account** - Your repository should be pushed to GitHub
3. **Anthropic API Key** - Get one from [console.anthropic.com](https://console.anthropic.com/)

## Deployment Steps

### 1. Prepare Your Repository

Ensure all code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create New Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `neurologic-hospitalist` repository
5. Railway will automatically detect the Dockerfile

### 3. Configure Environment Variables

In the Railway dashboard, go to your project's **Variables** tab and add:

#### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Your Anthropic API key |
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3001` | Server port (Railway auto-assigns) |

#### Optional Variables (Advanced)

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `LOG_LEVEL` | `info` | Logging verbosity |

### 4. Configure Railway Settings

#### Domain Setup
1. In Railway dashboard, go to **Settings** → **Networking**
2. Click **Generate Domain** to get a public URL
3. (Optional) Add a custom domain if you have one

#### Build Configuration
Railway automatically uses the provided `railway.toml` which configures:
- Dockerfile build
- Health checks on `/api/health`
- Restart policy

### 5. Deploy

Railway will automatically deploy when you:
1. Push to your main branch (automatic deployments)
2. Click **"Deploy"** in the Railway dashboard (manual deployment)

Monitor deployment progress in the **Deployments** tab.

### 6. Verify Deployment

Once deployed, verify the application is working:

```bash
# Replace YOUR-APP-URL with your Railway-provided URL
curl https://YOUR-APP-URL.railway.app/api/health

# Expected response:
# {"status":"ok","service":"NeuroLogic Hospitalist Assistant","timestamp":"..."}
```

Or visit the URL in your browser to access the web interface.

## Post-Deployment Configuration

### Enable Automatic Deployments

1. In Railway dashboard, go to **Settings**
2. Under **Deployments**, enable **"Deploy on push to main"**
3. Every push to `main` branch will trigger automatic deployment

### Configure Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `neurologic.yourdomain.com`)
4. Configure DNS records as shown:
   - Type: `CNAME`
   - Name: `neurologic` (or your subdomain)
   - Value: Your Railway app URL

### Set Up Health Monitoring

Railway provides built-in health checks using the `/api/health` endpoint.

To monitor application health:
1. Go to **Observability** tab
2. View deployment logs, metrics, and health status
3. Set up alerts in **Settings** → **Notifications**

## Environment-Specific Configuration

### Development vs Production

The application automatically adjusts based on `NODE_ENV`:

**Development** (`NODE_ENV=development`):
- Detailed error messages
- CORS enabled for all origins
- Verbose logging

**Production** (`NODE_ENV=production`):
- Secure error handling
- Optimized performance
- Serves static frontend files
- Health checks enabled

### Frontend Configuration

The frontend automatically detects the backend URL:
- In development: `http://localhost:3001`
- In production: Uses same domain (served by backend)

No additional configuration needed!

## Troubleshooting

### Build Failures

**Issue**: Docker build fails
**Solution**:
1. Check build logs in Railway dashboard
2. Verify all dependencies are in `package.json`
3. Ensure `Dockerfile` is in repository root

**Issue**: `ANTHROPIC_API_KEY` missing
**Solution**:
1. Add the variable in Railway dashboard → Variables
2. Redeploy the application

### Runtime Errors

**Issue**: Application crashes on startup
**Solution**:
1. Check runtime logs in Railway dashboard
2. Verify `ANTHROPIC_API_KEY` is valid
3. Check Node version compatibility (requires Node 18+)

**Issue**: API returns 500 errors
**Solution**:
1. Check application logs for error details
2. Verify Anthropic API key is valid and has credits
3. Check for API rate limiting (429 errors)

### Connection Issues

**Issue**: Cannot connect to application
**Solution**:
1. Verify deployment is successful (green checkmark)
2. Check health endpoint: `https://YOUR-APP.railway.app/api/health`
3. Review networking settings and domain configuration

**Issue**: CORS errors in browser
**Solution**:
1. Ensure `CORS_ORIGIN` is configured correctly
2. In production, backend serves frontend, so CORS shouldn't be an issue
3. Check browser console for specific CORS error details

## Scaling & Performance

### Resource Allocation

Railway provides:
- **8 GB RAM** (default)
- **8 vCPU** (shared)
- Auto-scaling based on load

### Optimize Performance

1. **Caching**: Application includes response caching for static assets
2. **CDN**: Railway provides global CDN automatically
3. **Keep-Alive**: HTTP keep-alive enabled by default

### Monitor Resource Usage

1. Go to **Observability** → **Metrics**
2. Monitor:
   - CPU usage
   - Memory usage
   - Request rate
   - Response times

### Upgrade Plan

If you need more resources:
1. Go to **Settings** → **Plan**
2. Upgrade to **Pro** or **Team** plan for:
   - More CPU/RAM
   - Priority support
   - Custom metrics
   - SLA guarantees

## Cost Optimization

### Railway Pricing (as of 2024)

**Hobby Plan** (Free):
- $5 credit/month
- Perfect for testing and light usage
- Sleeps after inactivity

**Developer Plan** ($5/month):
- $5 monthly credit
- Additional usage billed per resource
- No sleeping

**Pro Plan** ($20/month):
- $20 monthly credit
- Priority support
- Enhanced monitoring

### Optimize Costs

1. **Use Hobby Plan for Development/Testing**
   - Separate dev and prod deployments
   - Dev can use hobby plan

2. **Monitor API Usage**
   - Anthropic Claude API charges per token
   - Implement request caching
   - Set reasonable max_tokens limits

3. **Efficient Resource Usage**
   - Application is already optimized
   - Uses Alpine Linux (smaller image)
   - Production dependencies only

## Security Best Practices

### API Key Security

✅ **DO**:
- Store `ANTHROPIC_API_KEY` in Railway environment variables
- Rotate API keys regularly
- Use separate keys for dev/prod

❌ **DON'T**:
- Commit API keys to repository
- Share API keys in public channels
- Use production keys in development

### Application Security

The application includes:
- CORS protection
- Rate limiting (via Anthropic API)
- Input validation
- Secure error handling in production

### Additional Recommendations

1. **Enable HTTPS** (automatic on Railway)
2. **Monitor API usage** for unusual activity
3. **Set up alerts** for errors and downtime
4. **Regular updates** to dependencies

## Continuous Integration/Deployment

### GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: neurologic-hospitalist
```

### Automated Testing

Add pre-deployment tests:

```bash
# In package.json
"scripts": {
  "test": "npm run test:server && npm run test:client",
  "test:server": "cd server && npm test",
  "test:client": "cd client && npm test"
}
```

## Backup & Disaster Recovery

### Database Backups

If you add a database in the future:
1. Railway provides automatic backups for PostgreSQL/MySQL
2. Enable backups in database settings
3. Configure retention period

### Code Backups

1. **GitHub** (primary backup)
   - All code is version controlled
   - Easy rollback to previous versions

2. **Railway Deployments**
   - Previous deployments are saved
   - Can rollback from dashboard

### Rollback Procedure

If deployment fails:

1. **From Railway Dashboard**:
   - Go to **Deployments** tab
   - Click on previous successful deployment
   - Click **"Redeploy"**

2. **From Git**:
   ```bash
   git revert HEAD
   git push origin main
   # Railway will auto-deploy previous version
   ```

## Monitoring & Observability

### Built-in Monitoring

Railway provides:
- Deployment logs
- Application logs
- Resource metrics
- Error tracking

### Custom Monitoring (Optional)

Integrate with external services:
- **Sentry** for error tracking
- **Datadog** for APM
- **LogRocket** for session replay

## Support & Resources

### Railway Support
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### Application Support
- [GitHub Issues](https://github.com/Peshwa707/neurologic-hospitalist/issues)
- [Documentation](./COGNITIVE_BIAS_FEATURES.md)
- [Clinical Decision Support Guide](./CLINICAL_DECISION_SUPPORT.md)

### Anthropic Claude Support
- [Anthropic Docs](https://docs.anthropic.com)
- [API Status](https://status.anthropic.com)
- [Support Email](mailto:support@anthropic.com)

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domain (optional)
4. ✅ Enable automatic deployments
5. ✅ Set up staging environment (optional)
6. ✅ Configure backup strategy
7. ✅ Review security settings
8. ✅ Monitor API usage and costs

## Quick Reference

### Essential Railway Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Open dashboard
railway open

# Deploy manually
railway up

# Run command in production
railway run <command>
```

### Common Tasks

| Task | Command |
|------|---------|
| View logs | `railway logs` or Dashboard → Logs |
| Restart app | Dashboard → Deployments → Restart |
| Rollback | Dashboard → Deployments → Redeploy previous |
| Update env var | Dashboard → Variables → Edit |
| Custom domain | Dashboard → Settings → Networking |

## Conclusion

Your NeuroLogic Hospitalist Assistant is now deployed on Railway! 🎉

The application includes:
- ✅ AI-powered clinical decision support
- ✅ Cognitive bias detection
- ✅ Alternative diagnosis exploration
- ✅ Real-time transcription
- ✅ Medical coding
- ✅ Care progression tracking

For questions or issues, open a GitHub issue or consult the documentation.

---

**Last Updated**: December 2024
**Railway Version**: v2
**Node Version**: 18+
