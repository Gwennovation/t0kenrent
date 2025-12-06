# 🚀 Add MongoDB to Vercel - Quick Guide

## ⚡ Quick Instructions

You need to add ONE environment variable to Vercel.

---

## 📝 The Variable

**Name**: `MONGODB_URI`

**Value**:
```
mongodb+srv://t0kenrent_admin:W5DOgD0EAVK2db2U@t0kenrent.u2pyvn9.mongodb.net/t0kenrent?retryWrites=true&w=majority&appName=T0kenRent
```

---

## 🎯 Step-by-Step

### 1. Open Vercel Dashboard
Go to: https://vercel.com/dashboard

### 2. Select Your Project
Click on: **t0kenrent**

### 3. Go to Settings
Click: **Settings** (top navigation)

### 4. Environment Variables
Click: **Environment Variables** (left sidebar)

### 5. Add Variable
Click: **"Add New"** button

Fill in:
- **Name**: `MONGODB_URI`
- **Value**: (copy the connection string above)
- **Environments**: Check ALL three boxes:
  - ☑️ Production
  - ☑️ Preview
  - ☑️ Development

### 6. Save
Click: **"Save"**

### 7. Redeploy
- Go to **"Deployments"** tab
- Click ⋯ menu on latest deployment
- Click **"Redeploy"**

---

## ✅ Verify It Works

After redeploying:

1. Check Vercel logs for:
   ```
   ✅ MongoDB connected successfully
   ```

2. Test at https://t0kenrent.vercel.app:
   - Create an asset
   - Refresh page
   - Asset should persist ✅

3. Check MongoDB Atlas:
   - Go to https://cloud.mongodb.com/
   - Database → Browse Collections
   - See `rentalassets`, `rentals`, `users` ✅

---

## ⚠️ Important Notes

### If you get "authentication failed":

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Database Access** → Find `t0kenrent_admin`
3. **Edit** → **Edit Password**
4. **Set password to**: `W5DOgD0EAVK2db2U`
5. **Update User**
6. **Wait 2-3 minutes**
7. **Try again**

### Network Access:

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Network Access** (left sidebar)
3. **Check for**: `0.0.0.0/0`
4. **If missing**:
   - Add IP Address
   - Allow Access from Anywhere
   - Confirm
   - Wait 2-3 minutes

---

## 🎉 That's It!

Once added to Vercel:
- ✅ All data persists in MongoDB
- ✅ No more "MOCK MODE"
- ✅ Production-ready database
- ✅ Multi-user support

---

## 📚 More Help

If you need detailed troubleshooting:
- See: `MONGODB_FINAL_SETUP.md`
- See: `YOUR_MONGODB_SETUP.md`

---

**Your connection string is ready - just add it to Vercel!** 🚀
