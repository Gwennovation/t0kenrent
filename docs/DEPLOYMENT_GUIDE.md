# T0kenRent - Deployment Guide

## Quick Deploy to Vercel (Recommended)

Vercel is the easiest and most stable option for Next.js apps.

### Step 1: Prepare Your Repository

```bash
# Make sure everything is committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/
2. Click "Add New" → "Project"
3. Import your GitHub repository: `Gwennovation/t0kenrent`
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

#### Option B: Via CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd /path/to/t0kenrent
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: t0kenrent
# - Directory: ./
# - Override settings? No (use detected settings)

# After first deploy, subsequent deploys:
vercel --prod
```

### Step 3: Configure Environment Variables

After deployment, add environment variables in Vercel:

1. Go to your project dashboard on Vercel
2. Click "Settings" → "Environment Variables"
3. Add these variables:

```
NEXT_PUBLIC_HANDCASH_APP_ID=692c5eedaecc93a4d1907d4e
HANDCASH_APP_SECRET=0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f
NEXT_PUBLIC_HANDCASH_REDIRECT_URL=https://your-app.vercel.app
NETWORK=main
WHATSONCHAIN_API=https://api.whatsonchain.com/v1/bsv/main
DEFAULT_UNLOCK_FEE_BSV=0.0001
PAYMENT_EXPIRY_MINUTES=5
ACCESS_TOKEN_EXPIRY_MINUTES=30
JWT_SECRET=t0kenrent_secure_jwt_secret_key_change_in_production_min_32_chars
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Replace `your-app.vercel.app` with your actual Vercel URL**

### Step 4: Update HandCash Redirect URL

1. Go to https://dashboard.handcash.io/
2. Select your app (ID: `692c5eedaecc93a4d1907d4e`)
3. Update Redirect URL to your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
4. Save changes

### Step 5: Redeploy

After adding environment variables:

```bash
# Trigger a redeploy to use new env vars
vercel --prod
```

Or click "Redeploy" in the Vercel dashboard.

---

## Alternative: Deploy to Netlify

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login

```bash
netlify login
```

### Step 3: Configure Build Settings

Create `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Step 4: Deploy

```bash
netlify init
netlify deploy --prod
```

### Step 5: Add Environment Variables

```bash
netlify env:set NEXT_PUBLIC_HANDCASH_APP_ID "692c5eedaecc93a4d1907d4e"
netlify env:set HANDCASH_APP_SECRET "0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f"
netlify env:set NEXT_PUBLIC_HANDCASH_REDIRECT_URL "https://your-app.netlify.app"
# ... add other variables
```

---

## Alternative: Deploy to Railway

### Step 1: Install Railway CLI

```bash
npm i -g @railway/cli
```

### Step 2: Login

```bash
railway login
```

### Step 3: Initialize and Deploy

```bash
railway init
railway up
```

### Step 4: Add Environment Variables

```bash
railway variables set NEXT_PUBLIC_HANDCASH_APP_ID=692c5eedaecc93a4d1907d4e
railway variables set HANDCASH_APP_SECRET=0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f
# ... add other variables
```

---

## Alternative: Deploy to Render.com

### Step 1: Push to GitHub

```bash
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to https://render.com/
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: t0kenrent
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Add Environment Variables

In Render dashboard, go to "Environment" and add all variables.

---

## Comparison

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Vercel** | Best Next.js support, auto SSL, fast CDN | Limited build minutes (free) | Next.js apps (⭐ Recommended) |
| **Netlify** | Great UI, plugins, forms | Less Next.js optimized | Static sites |
| **Railway** | Simple, good for APIs | Costs after free tier | Full-stack apps |
| **Render** | Free tier, databases | Slower cold starts | Full apps with DB |

---

## After Deployment Checklist

- [ ] App deployed and accessible
- [ ] All environment variables configured
- [ ] HandCash redirect URL updated
- [ ] Demo mode works (`?demo=true`)
- [ ] HandCash authentication works
- [ ] Can create assets
- [ ] Can initiate rentals
- [ ] Custom domain configured (optional)

---

## Troubleshooting

### Build Fails

```bash
# Check build locally first
npm run build

# If successful locally, check Vercel logs
# Usually missing environment variables
```

### HandCash Auth Fails

- Verify redirect URL matches exactly (no trailing slash)
- Check App ID and Secret in environment variables
- Ensure permissions enabled in HandCash dashboard

### 500 Errors

- Check server logs in deployment platform
- Verify all environment variables are set
- Check MongoDB connection (if using)

---

## Recommended: Vercel Deployment

**Why Vercel?**
- Built by Next.js team
- Zero configuration
- Automatic HTTPS
- Global CDN
- Preview deployments for PRs
- Free tier is generous

**Deploy in 2 minutes:**

```bash
npm i -g vercel
vercel login
vercel
```

That's it! 🚀

---

**Questions?**
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
