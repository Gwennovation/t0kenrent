# Your MongoDB Setup for T0kenRent

## ✅ MongoDB Cluster Already Created!

I can see you already have a MongoDB cluster set up:
- **Cluster**: `t0kenrent.u2pyvn9.mongodb.net`
- **Username**: `t0kenrent_admin`
- **App Name**: `T0kenRent`

Great! You're almost done. You just need to complete these final steps:

---

## 🔑 Step 1: Get Your Database Password

**IMPORTANT**: You need to replace `<db_password>` with your actual password.

### If you remember your password:
- Use that password (the one you set when creating the database user)

### If you forgot your password:
1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Select your **T0kenRent** project
3. Click **"Database Access"** in the left sidebar
4. Find user `t0kenrent_admin`
5. Click **"Edit"** button
6. Click **"Edit Password"**
7. Either:
   - Enter a new password manually, OR
   - Click **"Autogenerate Secure Password"** and SAVE IT!
8. Click **"Update User"**

**Save your password somewhere safe!**

---

## 📝 Step 2: Format Your Connection String

Your connection string should look like this (replace `YOUR_ACTUAL_PASSWORD`):

```
mongodb+srv://t0kenrent_admin:YOUR_ACTUAL_PASSWORD@t0kenrent.u2pyvn9.mongodb.net/t0kenrent?retryWrites=true&w=majority&appName=T0kenRent
```

**Example** (if your password was `MySecurePass123`):
```
mongodb+srv://t0kenrent_admin:MySecurePass123@t0kenrent.u2pyvn9.mongodb.net/t0kenrent?retryWrites=true&w=majority&appName=T0kenRent
```

**IMPORTANT NOTES**:
- ❌ Remove the `<` and `>` brackets
- ❌ Don't include any spaces
- ✅ Use your ACTUAL password
- ✅ Keep the `/t0kenrent?` part (this is the database name)

---

## 🚀 Step 3: Add to Vercel (REQUIRED for Production)

### Go to Vercel Dashboard:

1. **Open Vercel**: https://vercel.com/dashboard
2. **Select Project**: Click on **t0kenrent**
3. **Go to Settings**: Click "Settings" tab at top
4. **Environment Variables**: Click "Environment Variables" in left sidebar
5. **Add Variable**:
   - Click **"Add New"** button
   - **Name**: `MONGODB_URI`
   - **Value**: Paste your FULL connection string (with actual password)
     ```
     mongodb+srv://t0kenrent_admin:YOUR_PASSWORD@t0kenrent.u2pyvn9.mongodb.net/t0kenrent?retryWrites=true&w=majority&appName=T0kenRent
     ```
   - **Environments**: Check ALL three boxes:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
   - Click **"Save"**

6. **Redeploy**:
   - Go to "Deployments" tab
   - Click the ⋯ menu on latest deployment
   - Click **"Redeploy"**
   
   OR simply push a new commit:
   ```bash
   git push origin main
   ```

---

## 🔒 Step 4: Verify Network Access (IMPORTANT)

Make sure Vercel can access your MongoDB:

1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click **"Network Access"** in left sidebar
3. Check if you have these entries:
   - `0.0.0.0/0` (Allow access from anywhere) ✅
   
   **If NOT**, add it:
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0` (auto-fills)
   - Click **"Confirm"**

**Why**: Vercel serverless functions use dynamic IPs, so you need to allow all IPs.

---

## ✅ Step 5: Verify It's Working

### Check Vercel Logs:

1. Go to Vercel → Your project → Deployments
2. Click on latest deployment
3. Click "Functions" or "Logs" tab
4. Look for these SUCCESS messages:
   ```
   🔌 Connecting to MongoDB...
   ✅ MongoDB connected successfully to: t0kenrent.u2pyvn9.mongodb.net
   💾 Using MongoDB for asset creation
   ✅ Asset created in MongoDB: 67...
   ```

### Test the Application:

1. Go to: https://t0kenrent.vercel.app
2. Connect your wallet
3. Create a new asset listing
4. **Refresh the page** → Asset should still be there! ✅

### Check MongoDB Atlas:

1. Go to MongoDB Atlas dashboard
2. Click **"Database"** → **"Browse Collections"**
3. Select **`t0kenrent`** database
4. You should see these collections appear:
   - `rentalassets` (your listings)
   - `rentals` (rental agreements)
   - `users` (user profiles)

---

## 🧪 Test Locally (Optional)

If you want to test with MongoDB on your local machine:

1. **Edit `.env.local`** (replace `<db_password>` with your actual password):
   ```bash
   MONGODB_URI=mongodb+srv://t0kenrent_admin:YOUR_PASSWORD@t0kenrent.u2pyvn9.mongodb.net/t0kenrent?retryWrites=true&w=majority&appName=T0kenRent
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Check terminal output**:
   ```
   🔌 Connecting to MongoDB...
   ✅ MongoDB connected successfully
   ```

4. **Test in browser**: http://localhost:3005

---

## ⚠️ Common Issues & Solutions

### Error: "Authentication failed"
**Cause**: Wrong password or username

**Solution**:
- ✅ Make sure you replaced `<db_password>` with actual password
- ✅ Remove `<` and `>` brackets
- ✅ Check username is `t0kenrent_admin`
- ✅ Reset password in MongoDB Atlas → Database Access

### Error: "IP not whitelisted"
**Cause**: Vercel IP not allowed

**Solution**:
- ✅ Go to MongoDB Atlas → Network Access
- ✅ Add `0.0.0.0/0` (Allow access from anywhere)
- ✅ Wait 1-2 minutes for changes to propagate

### Error: "Could not connect to any servers"
**Cause**: Connection string format incorrect

**Solution**:
- ✅ Check you have `/t0kenrent?` (database name)
- ✅ Check for typos in cluster address
- ✅ Ensure no spaces in connection string
- ✅ Use the format:
  ```
  mongodb+srv://username:password@cluster.mongodb.net/databasename?options
  ```

### Still seeing "📦 MOCK MODE" in logs:
**Causes & Solutions**:
- ❌ `MONGODB_URI` not added to Vercel → **Add it in Vercel dashboard**
- ❌ Not redeployed after adding → **Redeploy in Vercel**
- ❌ Typo in variable name → Must be exactly `MONGODB_URI` (case-sensitive)
- ❌ Wrong environment selected → Check all three boxes (Production, Preview, Development)

---

## 📋 Quick Checklist

Before considering setup complete, verify:

- [ ] MongoDB password retrieved (no `<` `>` brackets)
- [ ] Network access set to `0.0.0.0/0` in MongoDB Atlas
- [ ] `MONGODB_URI` added to Vercel environment variables
- [ ] All three environments checked (Production, Preview, Development)
- [ ] Application redeployed in Vercel
- [ ] Vercel logs show "✅ MongoDB connected successfully"
- [ ] Created a test asset at https://t0kenrent.vercel.app
- [ ] Asset persists after page refresh
- [ ] Collections visible in MongoDB Atlas

---

## 🎯 Summary

**Your MongoDB Details**:
- Cluster: `t0kenrent.u2pyvn9.mongodb.net` ✅
- Username: `t0kenrent_admin` ✅
- Database: `t0kenrent` ✅
- App Name: `T0kenRent` ✅

**What You Need to Do**:
1. Get your password (or reset it)
2. Replace `<db_password>` in connection string
3. Add `MONGODB_URI` to Vercel with your password
4. Ensure network access allows `0.0.0.0/0`
5. Redeploy and verify

**Your Final Connection String Format**:
```
mongodb+srv://t0kenrent_admin:YOUR_ACTUAL_PASSWORD@t0kenrent.u2pyvn9.mongodb.net/t0kenrent?retryWrites=true&w=majority&appName=T0kenRent
```

---

## 🆘 Need Help?

If you're stuck:
1. Check the "Common Issues" section above
2. Verify each step in the checklist
3. Check Vercel deployment logs for error messages
4. Check MongoDB Atlas metrics

**Once `MONGODB_URI` is added to Vercel, your application will automatically use MongoDB for all data storage!** 🎉

---

## 🔐 Security Reminder

- ❌ **Never commit** your password to GitHub
- ❌ **Never share** your connection string publicly
- ✅ **Use environment variables** (Vercel dashboard)
- ✅ **Rotate passwords** periodically
- ✅ **Monitor access** in MongoDB Atlas

The `.env.local` file is already in `.gitignore`, so it won't be committed to your repository.

---

**You're almost done! Just add the password and you're ready to go!** 🚀
