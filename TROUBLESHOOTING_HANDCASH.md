# HandCash Authentication Troubleshooting

## Current Error: 500 Internal Server Error

**Error:** `POST https://t0kenrent.vercel.app/api/auth/handcash 500 (Internal Server Error)`

## Root Cause

The HandCash API endpoint is failing because **environment variables are not set on Vercel**.

## Quick Fix

### Step 1: Set Environment Variables on Vercel

1. Go to: https://vercel.com/[your-account]/t0kenrent/settings/environment-variables
2. Click "Add New" for each variable
3. Set to "Production" environment (or "All")

**Required Variables:**

```
NEXT_PUBLIC_HANDCASH_APP_ID
Value: 692c5eedaecc93a4d1907d4e

HANDCASH_APP_SECRET
Value: 0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f

NEXT_PUBLIC_HANDCASH_REDIRECT_URL
Value: https://t0kenrent.vercel.app

NETWORK
Value: main

WHATSONCHAIN_API
Value: https://api.whatsonchain.com/v1/bsv/main

DEFAULT_UNLOCK_FEE_BSV
Value: 0.0001

PAYMENT_EXPIRY_MINUTES
Value: 5

ACCESS_TOKEN_EXPIRY_MINUTES
Value: 30

JWT_SECRET
Value: t0kenrent_secure_jwt_secret_key_change_in_production_min_32_chars

NODE_ENV
Value: production

NEXT_PUBLIC_APP_URL
Value: https://t0kenrent.vercel.app
```

### Step 2: Redeploy

After adding environment variables:
1. Go to: https://vercel.com/[your-account]/t0kenrent
2. Click on the latest deployment
3. Click "Redeploy" button
4. Wait for deployment to complete (~2 minutes)

### Step 3: Update HandCash Dashboard

**CRITICAL:** Update your HandCash app redirect URL:

1. Go to: https://dashboard.handcash.io/
2. Find app ID: `692c5eedaecc93a4d1907d4e`
3. Set Redirect URL to: `https://t0kenrent.vercel.app`
4. Save changes

### Step 4: Test

1. Visit: https://t0kenrent.vercel.app
2. Click "Connect Wallet" → "HandCash"
3. Authorize
4. Should redirect back and authenticate successfully

## Other Errors You're Seeing (Safe to Ignore)

### 1. MetaNet Wallet Errors
```
GET http://localhost:3301/v1/version net::ERR_CONNECTION_REFUSED
MetaNet wallet not detected or not authenticated
```

**Status:** ✅ Expected behavior
- MetaNet wallet tries to connect to local Babbage wallet
- If not installed, shows this error
- Doesn't affect HandCash authentication
- Users can still use HandCash or demo mode

### 2. Permissions-Policy Warning
```
Error with Permissions-Policy header: Unrecognized feature: 'browsing-topics'.
```

**Status:** ✅ Safe to ignore
- Browser warning about privacy feature
- Doesn't affect functionality
- Common in modern browsers

## How to Verify Environment Variables Are Set

### Check Vercel Logs

1. Go to your Vercel deployment
2. Click "Functions" tab
3. Find `/api/auth/handcash`
4. Check the logs - should see:
   - ✅ "Fetching HandCash profile..."
   - ✅ API URL logged
   - ✅ App ID logged

### Expected Success Flow

```
🔍 Fetching HandCash profile...
📡 API URL: https://cloud.handcash.io/v1/connect/profile/currentUserProfile
🔑 App ID: 692c5eedaecc93a4d1907d4e
✅ Profile fetched: [handle]
```

### Error Flow (Missing Env Vars)

```
❌ HandCash auth error: Cannot read properties of undefined...
```

## Demo Mode (Temporary Workaround)

While setting up environment variables, you can use Demo Mode:

**URL:** https://t0kenrent.vercel.app/?demo=true

This bypasses HandCash authentication for testing the UI.

## Common Issues & Solutions

### Issue 1: "App ID not configured"
**Solution:** Set `NEXT_PUBLIC_HANDCASH_APP_ID` in Vercel

### Issue 2: "Invalid redirect URI"  
**Solution:** Update redirect URL in HandCash Dashboard to match Vercel URL exactly

### Issue 3: "Authentication failed" with profile fetch
**Solution:** Set `HANDCASH_APP_SECRET` in Vercel

### Issue 4: Changes not reflected
**Solution:** Redeploy after setting environment variables

## Quick Test Commands

### Test Environment Variables from Vercel Function
Add this temporary endpoint to test:

```typescript
// pages/api/test-env.ts
export default function handler(req, res) {
  res.json({
    hasAppId: !!process.env.NEXT_PUBLIC_HANDCASH_APP_ID,
    hasSecret: !!process.env.HANDCASH_APP_SECRET,
    redirectUrl: process.env.NEXT_PUBLIC_HANDCASH_REDIRECT_URL
  })
}
```

Visit: https://t0kenrent.vercel.app/api/test-env

## Need More Help?

1. Check Vercel deployment logs
2. Check browser console for detailed errors
3. Verify HandCash Dashboard settings
4. Make sure you redeployed after setting env vars
