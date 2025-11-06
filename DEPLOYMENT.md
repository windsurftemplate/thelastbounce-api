# Deployment Guide - The Last Bounce API

Step-by-step guide to deploy the API to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: For repository hosting
3. **Node.js**: Version 20+ installed locally

## Step 1: Push to GitHub

1. Create a new repository on GitHub:
   - Go to [github.com/new](https://github.com/new)
   - Name: `thelastbounce-api`
   - Visibility: Private (recommended)
   - Don't initialize with README (we already have one)

2. Push your code:
```bash
cd /Users/nelson/projects/thelastbounce-api
git remote add origin git@github.com:YOUR_USERNAME/thelastbounce-api.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `thelastbounce-api` repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: Leave empty (serverless functions)
   - **Output Directory**: Leave empty
5. Click "Deploy"

### Option B: Deploy via CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
cd /Users/nelson/projects/thelastbounce-api
vercel --prod
```

## Step 3: Configure Environment Variables

1. Go to Vercel dashboard → Your Project → Settings → Environment Variables

2. Add these variables:

**Required:**
```
NODE_ENV=production
ALLOWED_ORIGINS=https://thelastbounce.com,https://www.thelastbounce.com
API_VERSION=1.0.0
```

**Optional (for production features):**
```
# Rate limiting (recommended)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Error tracking (recommended)
SENTRY_DSN=https://your-sentry-dsn

# Database (if storing roots)
DATABASE_URL=postgresql://...

# AWS KMS (for root verification)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
ROOT_KEY_ID=alias/thelastbounce-root-key
```

3. Redeploy to apply environment variables

## Step 4: Configure Custom Domain

1. Go to Vercel dashboard → Your Project → Settings → Domains

2. Add domain: `api.thelastbounce.com`

3. Configure DNS at your domain provider:

**For Vercel DNS:**
```
Type    Name    Value
CNAME   api     cname.vercel-dns.com
```

**For Cloudflare or other providers:**
```
Type    Name    Value
CNAME   api     cname.vercel-dns.com
```

4. Wait for DNS propagation (5-10 minutes)

5. Verify SSL certificate is issued automatically

## Step 5: Update CORS Settings

Once your custom domain is live, update CORS in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://thelastbounce.com"
        }
      ]
    }
  ]
}
```

Commit and push changes to redeploy.

## Step 6: Test the Deployment

### Test Health Endpoint

```bash
curl https://api.thelastbounce.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 123
}
```

### Test Verification Endpoint

```bash
curl -X POST https://api.thelastbounce.com/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "proof": "SGVsbG8gV29ybGQ=",
    "publicInputs": ["0x123...", "0xabc..."],
    "tagSignature": "c2lnbmF0dXJl",
    "challenge": "Y2hhbGxlbmdl",
    "tagUid": "E004012345678910"
  }'
```

### Test CORS

```bash
curl -X OPTIONS https://api.thelastbounce.com/api/verify \
  -H "Origin: https://thelastbounce.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Should see CORS headers in response.

## Step 7: Monitor Performance

### Vercel Analytics

1. Go to Vercel dashboard → Your Project → Analytics
2. View:
   - Request count
   - Response times
   - Error rates
   - Geographic distribution

### Set Up Alerts

1. Go to Settings → Notifications
2. Configure alerts for:
   - Deployment failures
   - High error rates
   - Performance degradation

## Optional: Set Up Upstash Redis

For production-grade rate limiting:

1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy REST URL and token
4. Add to Vercel environment variables:
   ```
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```

5. Update `lib/rate-limit.ts` to use Redis:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});
```

## Optional: Set Up Sentry

For error tracking:

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (Node.js)
3. Copy DSN
4. Add to Vercel environment variables:
   ```
   SENTRY_DSN=https://your-sentry-dsn
   ```

5. Install Sentry:
```bash
npm install @sentry/node
```

6. Initialize in `api/verify.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN
});
```

## Troubleshooting

### Deployment Fails

**Error**: `Build failed`

**Solution**: Check build logs in Vercel dashboard. Ensure:
- `package.json` is valid
- TypeScript compiles without errors
- All dependencies are listed

### CORS Issues

**Error**: `CORS policy blocked`

**Solution**:
1. Verify `ALLOWED_ORIGINS` in environment variables
2. Check `vercel.json` CORS configuration
3. Ensure origin matches exactly (including protocol)

### Rate Limit Not Working

**Error**: Rate limit doesn't reset

**Solution**:
- In-memory rate limiting resets on cold starts
- Upgrade to Upstash Redis for persistent rate limiting

### 500 Internal Server Error

**Error**: All requests return 500

**Solution**:
1. Check Vercel function logs
2. Enable Sentry for detailed error tracking
3. Verify environment variables are set
4. Test locally with `vercel dev`

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Custom domain configured (api.thelastbounce.com)
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] CORS configured for production domain
- [ ] Health endpoint returns 200
- [ ] Verification endpoint accepts requests
- [ ] Rate limiting tested
- [ ] Upstash Redis configured (optional)
- [ ] Sentry error tracking enabled (optional)
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Website integration tested

## Next Steps

1. **Integrate with Website**: Use client example in `examples/client.js`
2. **Integrate with Mobile App**: Update API URL in React Native app
3. **Monitor Usage**: Check Vercel analytics daily
4. **Optimize Performance**: Review response times and optimize slow endpoints
5. **Security Review**: Regular security audits and dependency updates

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Issues**: Create issue on GitHub
- **Email**: hello@thelastbounce.com

---

**Deployment Platform**: Vercel Edge Network
**Expected Response Time**: < 100ms globally
**Uptime SLA**: 99.99%
