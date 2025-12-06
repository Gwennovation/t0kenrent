# 🚀 Deploy T0kenRent to Vercel NOW

## Method 1: Via Vercel Dashboard (Easiest - 5 Minutes)

### Step 1: Import from GitHub

1. **Go to**: https://vercel.com/
2. **Sign up/Login** with GitHub
3. **Click**: "Add New" → "Project"
4. **Import**: `Gwennovation/t0kenrent` repository
5. **Click**: "Import"

### Step 2: Configure Project

Vercel will auto-detect Next.js. Just verify:

- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

**Click "Deploy"** - Wait 2-3 minutes

### Step 3: Add Environment Variables

After deployment completes:

1. Go to **Project Settings** → **Environment Variables**
2. Add these one by one:

```
NEXT_PUBLIC_HANDCASH_APP_ID = 692c5eedaecc93a4d1907d4e
HANDCASH_APP_SECRET = 0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f
NEXT_PUBLIC_HANDCASH_REDIRECT_URL = https://YOUR-PROJECT.vercel.app
NETWORK = main
WHATSONCHAIN_API = https://api.whatsonchain.com/v1/bsv/main
DEFAULT_UNLOCK_FEE_BSV = 0.0001
PAYMENT_EXPIRY_MINUTES = 5
ACCESS_TOKEN_EXPIRY_MINUTES = 30
JWT_SECRET = t0kenrent_secure_jwt_secret_key_change_in_production_min_32_chars
NODE_ENV = production
NEXT_PUBLIC_APP_URL = https://YOUR-PROJECT.vercel.app
```

**⚠️ Replace `YOUR-PROJECT` with your actual Vercel project name**

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. This applies the environment variables

### Step 5: Update HandCash

1. **Go to**: https://dashboard.handcash.io/
2. **Select your app**: App ID `692c5eedaecc93a4d1907d4e`
3. **Update Redirect URL** to: `https://YOUR-PROJECT.vercel.app`
4. **Save**

### Step 6: Test!

Visit your Vercel URL and test:
- ✅ Demo mode: `https://YOUR-PROJECT.vercel.app/?demo=true`
- ✅ HandCash login
- ✅ Create assets
- ✅ Browse marketplace

---

## Method 2: Via CLI (From Your Local Machine)

### Step 1: Install Vercel CLI

```bash
# On your local machine (Mac/Linux/Windows)
npm install -g vercel
```

### Step 2: Clone Repository

```bash
git clone https://github.com/Gwennovation/t0kenrent.git
cd t0kenrent
```

### Step 3: Deploy

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** Y
- **Which scope?** Your account
- **Link to existing project?** N
- **Project name?** t0kenrent
- **In which directory?** ./
- **Override settings?** N

### Step 4: Add Environment Variables

After deployment, you'll get a URL. Then:

```bash
# Add environment variables via CLI
vercel env add HANDCASH_APP_SECRET production
# Paste: 0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f

vercel env add NEXT_PUBLIC_HANDCASH_REDIRECT_URL production
# Paste: https://your-project.vercel.app

vercel env add NETWORK production
# Paste: main

vercel env add WHATSONCHAIN_API production
# Paste: https://api.whatsonchain.com/v1/bsv/main

vercel env add DEFAULT_UNLOCK_FEE_BSV production
# Paste: 0.0001

vercel env add PAYMENT_EXPIRY_MINUTES production
# Paste: 5

vercel env add ACCESS_TOKEN_EXPIRY_MINUTES production
# Paste: 30

vercel env add JWT_SECRET production
# Paste: t0kenrent_secure_jwt_secret_key_change_in_production_min_32_chars

vercel env add NODE_ENV production
# Paste: production

vercel env add NEXT_PUBLIC_APP_URL production
# Paste: https://your-project.vercel.app
```

### Step 5: Redeploy with Env Vars

```bash
vercel --prod
```

### Step 6: Update HandCash

Same as Method 1, Step 5.

---

## Method 3: One-Click with GitHub Integration

### Automatic Deployments

After initial setup via Method 1 or 2:

1. Every `git push` to `main` branch automatically deploys
2. Pull requests get preview deployments
3. No manual deployment needed!

---

## Quick Reference

| What | Value |
|------|-------|
| **Your GitHub Repo** | https://github.com/Gwennovation/t0kenrent |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **HandCash Dashboard** | https://dashboard.handcash.io/ |
| **HandCash App ID** | 692c5eedaecc93a4d1907d4e |

---

## Troubleshooting

### Build Fails

**Error**: TypeScript errors during build

**Solution**: 
```bash
# Test build locally first
npm install
npm run build

# Fix any errors, commit, push
git add .
git commit -m "Fix build errors"
git push origin main
```

### HandCash Auth Fails

**Problem**: "Authentication failed" after authorizing

**Solutions**:
1. Verify redirect URL in HandCash matches Vercel URL exactly
2. Check `NEXT_PUBLIC_HANDCASH_REDIRECT_URL` env var
3. Ensure no trailing slash in URLs
4. Redeploy after env var changes

### Environment Variables Not Working

**Problem**: App can't find HandCash credentials

**Solution**:
1. Check all env vars are added in Vercel
2. Vars starting with `NEXT_PUBLIC_` are exposed to browser
3. Other vars are server-side only
4. **Must redeploy** after adding env vars

---

## Post-Deployment Checklist

- [ ] App deployed to Vercel
- [ ] Vercel URL obtained (e.g., `https://t0kenrent.vercel.app`)
- [ ] All environment variables added in Vercel
- [ ] Redeployed after adding env vars
- [ ] HandCash redirect URL updated to Vercel URL
- [ ] Demo mode works (`?demo=true`)
- [ ] HandCash login works
- [ ] Can create test asset
- [ ] Custom domain configured (optional)

---

## Custom Domain (Optional)

Want your own domain like `t0kenrent.com`?

1. Buy domain from any registrar
2. In Vercel project → Settings → Domains
3. Add your domain
4. Update DNS records as instructed
5. Update HandCash redirect URL to your domain

---

## 🎉 That's It!

Your T0kenRent app is now live on Vercel with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Instant deployments
- ✅ Preview deployments for PRs
- ✅ No more buggy sandbox!

**Questions?**
- Vercel Support: https://vercel.com/support
- Vercel Docs: https://vercel.com/docs
