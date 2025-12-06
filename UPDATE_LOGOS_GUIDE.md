# Logo Update Guide

## Files You Need to Upload

You have these files locally:
1. `/Users/ian/Documents/GitHub/t0kenrent/public/wallets/HandCash Logo.png`
2. `/Users/ian/Documents/GitHub/t0kenrent/public/wallets/Relysia Logo.png`
3. `/Users/ian/Documents/GitHub/t0kenrent/public/t0kenrent logo.png`

## Step 1: Rename and Copy Files

From your local machine (`/Users/ian/Documents/GitHub/t0kenrent/`), run these commands:

```bash
cd /Users/ian/Documents/GitHub/t0kenrent

# Rename the files to lowercase without spaces
mv "public/wallets/HandCash Logo.png" "public/wallets/handcash-new.png"
mv "public/wallets/Relysia Logo.png" "public/wallets/relysia-new.png"
mv "public/t0kenrent logo.png" "public/t0kenrent-logo-new.png"

# Or keep original names and we'll update references
```

## Step 2: Git Commands to Upload

```bash
cd /Users/ian/Documents/GitHub/t0kenrent

# Add the new logo files
git add "public/wallets/HandCash Logo.png"
git add "public/wallets/Relysia Logo.png"
git add "public/t0kenrent logo.png"

# Commit
git commit -m "feat: Add new brand logos for HandCash, Relysia, and T0kenRent"

# Push to GitHub
git push origin main
```

## Step 3: Files That Need Updates

After uploading, these files need to be updated:

### 1. `/src/components/WalletSelector.tsx` (lines 8-12)
Current:
```typescript
const WALLET_LOGOS = {
  handcash: '/wallets/handcash.png',
  metanet: '/wallets/metanet.svg',
  relysia: '/wallets/relysia.png'
}
```

Update to:
```typescript
const WALLET_LOGOS = {
  handcash: '/wallets/HandCash Logo.png',
  metanet: '/wallets/metanet.svg',
  relysia: '/wallets/Relysia Logo.png'
}
```

### 2. `/src/pages/index.tsx` (line 590)
Current:
```typescript
src="/wallets/relysia.svg"
```

Update to:
```typescript
src="/wallets/Relysia Logo.png"
```

### 3. `/public/t0kenrent-logo.png`
Replace the existing `/public/t0kenrent-logo.png` with your new `t0kenrent logo.png` file.

## Quick Copy-Paste Solution

If the files are already in your local repo at:
- `public/wallets/HandCash Logo.png`
- `public/wallets/Relysia Logo.png`
- `public/t0kenrent logo.png`

Then just run:
```bash
cd /Users/ian/Documents/GitHub/t0kenrent
git add public/
git commit -m "feat: Update brand logos"
git push origin main
```

Then I can update the code references remotely!
