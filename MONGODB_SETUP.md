# MongoDB Setup Guide for T0kenRent

## Why MongoDB is Needed

Your application is currently running in **MOCK MODE** because no MongoDB connection string is configured. This means:
- ❌ Data is stored in memory only (lost on each deployment)
- ❌ No persistent storage across sessions
- ❌ Can't scale to multiple users properly

With MongoDB configured:
- ✅ All data persists permanently
- ✅ Multi-user support
- ✅ Production-ready database
- ✅ Query and relationship capabilities

---

## Step 1: Create MongoDB Database (FREE)

### Option A: MongoDB Atlas (Recommended - Free Forever)

1. **Sign up for MongoDB Atlas**:
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with email or Google account (FREE)

2. **Create a Free Cluster**:
   - After login, click "Build a Database"
   - Select **M0 FREE** tier (0.5GB storage, always free)
   - Choose a cloud provider (AWS, Google Cloud, or Azure)
   - Select a region close to your Vercel deployment (e.g., US East for `iad1`)
   - Click "Create Cluster" (takes 1-3 minutes)

3. **Create Database User**:
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication method
   - Username: `t0kenrent_user` (or your choice)
   - Password: Click "Autogenerate Secure Password" (SAVE THIS!)
   - Database User Privileges: Select "Atlas admin"
   - Click "Add User"

4. **Allow Network Access**:
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel serverless)
   - IP Address: `0.0.0.0/0` (should auto-fill)
   - Click "Confirm"

5. **Get Connection String**:
   - Click "Database" in left sidebar
   - Click "Connect" button on your cluster
   - Click "Connect your application"
   - Driver: Node.js, Version: 4.1 or later
   - Copy the connection string, it looks like:
     ```
     mongodb+srv://t0kenrent_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **IMPORTANT**: Replace `<password>` with your actual password
   - Add database name: Change `/?retryWrites` to `/t0kenrent?retryWrites`

**Final connection string should look like**:
```
mongodb+srv://t0kenrent_user:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/t0kenrent?retryWrites=true&w=majority
```

---

## Step 2: Add MongoDB URI to Vercel (REQUIRED)

### Adding Environment Variable to Vercel:

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Log in with your account

2. **Select Your Project**:
   - Find and click on **t0kenrent** project

3. **Open Settings**:
   - Click on "Settings" tab at the top

4. **Add Environment Variable**:
   - Click "Environment Variables" in left sidebar
   - Click "Add New" button
   - Fill in:
     - **Name (Key)**: `MONGODB_URI`
     - **Value**: Paste your full connection string from Step 1
       ```
       mongodb+srv://t0kenrent_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/t0kenrent?retryWrites=true&w=majority
       ```
     - **Environments**: Check all three:
       - ☑️ Production
       - ☑️ Preview  
       - ☑️ Development
   - Click "Save"

5. **Redeploy Application**:
   - Option A: Push any commit to trigger auto-deploy
   - Option B: Go to "Deployments" tab → Click ⋯ menu → "Redeploy"

---

## Step 3: Verify MongoDB is Working

### Check Vercel Logs:

1. Go to your Vercel project
2. Click "Deployments" tab
3. Click on the latest deployment
4. Click "Functions" or "Logs"
5. Look for these success messages:
   ```
   🔌 Connecting to MongoDB...
   ✅ MongoDB connected successfully to: cluster0.xxxxx.mongodb.net
   💾 Using MongoDB for asset creation
   ✅ Asset created in MongoDB: 67...
   ```

### Check MongoDB Atlas:

1. Go to MongoDB Atlas dashboard
2. Click "Database" → "Browse Collections"
3. Select `t0kenrent` database
4. You should see these collections:
   - `rentalassets` - Your asset listings
   - `rentals` - Rental agreements
   - `users` - User profiles

### Test in Application:

1. Go to https://t0kenrent.vercel.app
2. Connect wallet
3. Create a new asset listing
4. Refresh the page → Asset should still be there ✅
5. Create a rental → Check MongoDB collections ✅

---

## Step 4: Local Development Setup (Optional)

If you want to test MongoDB locally:

1. **Edit `.env.local`** file:
   ```bash
   # Uncomment and add your MongoDB URI
   MONGODB_URI=mongodb+srv://t0kenrent_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/t0kenrent?retryWrites=true&w=majority
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Check console**:
   ```
   ✅ MongoDB connected successfully
   ```

---

## Troubleshooting

### Error: "Authentication failed"
- ✅ Check your username and password are correct
- ✅ Make sure you replaced `<password>` with actual password
- ✅ Password should NOT have `<` or `>` characters

### Error: "IP not whitelisted"
- ✅ Go to MongoDB Atlas → Network Access
- ✅ Add `0.0.0.0/0` to allow all IPs (required for Vercel)

### Error: "Connection timeout"
- ✅ Check your connection string format
- ✅ Make sure you selected the correct driver version (Node.js 4.1+)

### Still seeing "MOCK MODE" in logs:
- ✅ Verify `MONGODB_URI` environment variable is saved in Vercel
- ✅ Make sure you redeployed after adding the variable
- ✅ Check the variable name is exactly `MONGODB_URI` (case-sensitive)

### Collections not appearing:
- ✅ Create an asset first (this creates the collection)
- ✅ Refresh MongoDB Atlas browse collections page
- ✅ Make sure you're looking in the `t0kenrent` database

---

## Environment Variable Summary

**Vercel Environment Variables Required**:

```bash
# MongoDB (MUST ADD THIS)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/t0kenrent?retryWrites=true&w=majority

# HandCash (Already configured)
NEXT_PUBLIC_HANDCASH_APP_ID=692c5eedaecc93a4d1907d4e
HANDCASH_APP_SECRET=0d0f7416bd5ab0a54ebe443c524a5b753a90894d46925ac8ed5291cd19eae66f
NEXT_PUBLIC_HANDCASH_REDIRECT_URL=https://t0kenrent.vercel.app

# BSV Network (Already configured)
NETWORK=main
WHATSONCHAIN_API=https://api.whatsonchain.com/v1/bsv/main

# HTTP 402 (Already configured)
DEFAULT_UNLOCK_FEE_BSV=0.0001
PAYMENT_EXPIRY_MINUTES=5
ACCESS_TOKEN_EXPIRY_MINUTES=30

# Security (Already configured)
JWT_SECRET=t0kenrent_secure_jwt_secret_key_change_in_production_min_32_chars

# Application (Already configured)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://t0kenrent.vercel.app
```

**Only Missing**: `MONGODB_URI` ← **ADD THIS ONE!**

---

## What Happens After Adding MongoDB?

### Before (Mock Mode - Current State):
```
📦 Running in MOCK MODE - no MONGODB_URI configured
📦 Using in-memory storage for asset creation
⚠️  Data will be lost on next deployment
```

### After (Production Mode - With MongoDB):
```
🔌 Connecting to MongoDB...
✅ MongoDB connected successfully
💾 Using MongoDB for asset creation
✅ Asset created in MongoDB: 674...
💾 Using MongoDB for rental creation
✅ Rental created in MongoDB: 674...
```

---

## Security Best Practices

1. **Never commit** `.env.local` to git (already in `.gitignore`)
2. **Use strong passwords** for MongoDB users
3. **Rotate credentials** periodically
4. **Monitor access** in MongoDB Atlas
5. **Enable alerts** for suspicious activity

---

## Cost Information

- **MongoDB Atlas M0 (Free tier)**: $0/month forever
  - 512MB storage
  - Shared RAM
  - Perfect for development and small production apps

- **MongoDB Atlas M10 (Paid)**: $0.08/hour (~$57/month)
  - 10GB storage
  - 2GB RAM
  - For production scaling (upgrade when needed)

**Start with FREE tier** - it's more than enough for testing and initial production!

---

## Support Resources

- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Connection String Guide**: https://docs.mongodb.com/manual/reference/connection-string/
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **t0kenrent Repository**: https://github.com/Gwennovation/t0kenrent

---

## Quick Summary

**To enable MongoDB**:

1. ✅ Create MongoDB Atlas account (FREE)
2. ✅ Create cluster (M0 FREE tier)
3. ✅ Create database user
4. ✅ Allow network access (0.0.0.0/0)
5. ✅ Copy connection string
6. ✅ Add `MONGODB_URI` to Vercel environment variables
7. ✅ Redeploy application
8. ✅ Test and verify in MongoDB Atlas

**That's it!** Your application will automatically use MongoDB for all data storage.

---

## Need Help?

If you encounter any issues:
1. Check the Troubleshooting section above
2. Review Vercel deployment logs
3. Check MongoDB Atlas metrics
4. Verify connection string format

**Your data will be safe and persistent once MongoDB is configured!** 🎉
