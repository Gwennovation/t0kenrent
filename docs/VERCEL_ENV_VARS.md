# Vercel Environment Variables Configuration

## Your Vercel Domain
**Production URL:** https://t0kenrent.vercel.app

## Required Environment Variables

Go to your Vercel Dashboard → t0kenrent project → Settings → Environment Variables

Add these variables:

### HandCash Configuration
```
NEXT_PUBLIC_HANDCASH_APP_ID=692c5eedaecc93a4d1907d4e
HANDCASH_APP_SECRET=0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f
NEXT_PUBLIC_HANDCASH_REDIRECT_URL=https://t0kenrent.vercel.app
```

### BSV Network
```
NETWORK=main
WHATSONCHAIN_API=https://api.whatsonchain.com/v1/bsv/main
```

### HTTP 402 Settings
```
DEFAULT_UNLOCK_FEE_BSV=0.0001
PAYMENT_EXPIRY_MINUTES=5
ACCESS_TOKEN_EXPIRY_MINUTES=30
```

### Security
```
JWT_SECRET=t0kenrent_secure_jwt_secret_key_change_in_production_min_32_chars
```

### Database (MongoDB)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/t0kenrent?retryWrites=true&w=majority
```
**Note:** If MONGODB_URI is not set, the application will run in **MOCK MODE** using in-memory storage (data will not persist across deployments).

### Application
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://t0kenrent.vercel.app
```

## CRITICAL: Update HandCash Dashboard

**You MUST update your HandCash app settings:**

1. Go to: https://dashboard.handcash.io/
2. Find your app with ID: `692c5eedaecc93a4d1907d4e`
3. Click "Edit" or "Settings"
4. Update the **Redirect URL** to: `https://t0kenrent.vercel.app`
5. Save changes

**Required Permissions:**
- Public profile (get $handle, display name, profile picture)
- Pay (trigger payments)
- Data signing (sign data)
- Read balance (recommended)

## After Setting Environment Variables

1. Redeploy your Vercel project (or it will auto-deploy on next push)
2. Test HandCash authentication at: https://t0kenrent.vercel.app
3. Verify the redirect works correctly after HandCash authorization

## Verify Configuration

Test URLs:
- **Production**: https://t0kenrent.vercel.app
- **Demo Mode**: https://t0kenrent.vercel.app/?demo=true

## Troubleshooting

**If HandCash auth fails:**
1. Double-check redirect URL in HandCash Dashboard matches exactly: `https://t0kenrent.vercel.app`
2. Verify environment variables are set in Vercel
3. Make sure you redeployed after setting env vars
4. Check browser console for errors

**Common Issues:**
- "Invalid redirect URI" → Redirect URL in HandCash doesn't match
- "App ID not found" → Check NEXT_PUBLIC_HANDCASH_APP_ID env var
- "Authentication failed" → Check HANDCASH_APP_SECRET env var
