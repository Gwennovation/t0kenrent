# T0kenRent Quick Start Guide

Get T0kenRent up and running in under 5 minutes.

## Prerequisites

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

## Step 1: Clone and Install

```bash
git clone https://github.com/Gwennovation/t0kenrent.git
cd t0kenrent
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with minimum settings:

```bash
# HandCash Connect (get from https://dashboard.handcash.io)
NEXT_PUBLIC_HANDCASH_APP_ID=your_app_id
HANDCASH_APP_SECRET=your_app_secret
NEXT_PUBLIC_HANDCASH_REDIRECT_URL=http://localhost:3000

# Optional: MongoDB (app works without it using in-memory storage)
# MONGODB_URI=mongodb://localhost:27017/t0kenrent
```

## Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 4: Try Demo Mode

No wallet? No problem!

1. Click **"Try Demo Mode"** on the landing page
2. Browse the marketplace with sample assets
3. Test the full user flow without any setup

## Step 5: Connect a Real Wallet

### HandCash
1. Click **"HandCash"** button
2. Authorize in the popup
3. Return to T0kenRent authenticated

### MetaNet/Babbage
1. Install [MetaNet Portal](https://www.babbage.systems/)
2. Click **"MetaNet"** button
3. Approve connection in your wallet

### Paymail
1. Click **"Paymail"** button
2. Enter your paymail (e.g., `user@handcash.io`)
3. Start browsing

## Try the Features

### Browse Marketplace
- View rental listings
- Filter by category
- See pricing and locations

### Unlock Details (HTTP 402)
1. Click **"Unlock Contact Info"** on any asset
2. Review the micropayment (~$0.001)
3. Pay with your connected wallet
4. View pickup address, access codes, contact info

### Rent an Item (Escrow)
1. Click **"Rent Now"** on an unlocked asset
2. Select rental dates
3. Review deposit + rental fee
4. Fund the 2-of-2 escrow
5. Rental confirmed!

### My Dashboard
- View active and past rentals
- See your listed assets
- Track earnings and spending

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_HANDCASH_APP_ID` | For HandCash | Your HandCash App ID |
| `HANDCASH_APP_SECRET` | For HandCash | Your HandCash App Secret |
| `NEXT_PUBLIC_HANDCASH_REDIRECT_URL` | For HandCash | OAuth callback URL |
| `MONGODB_URI` | No | MongoDB connection string |
| `NETWORK` | No | BSV network (main/test) |
| `OVERLAY_URL` | No | Overlay network URL |

## Common Issues

### "Port 3000 already in use"
```bash
# Use a different port
PORT=3001 npm run dev
```

### "HandCash login not working"
- Ensure redirect URL matches in HandCash Dashboard
- Check App ID and Secret are correct

### "Wallet not connecting"
- Install MetaNet Portal browser extension
- Try refreshing the page
- Check browser console for errors

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

## Project Structure

```
t0kenrent/
├── src/
│   ├── components/   # React components
│   ├── pages/api/    # API routes
│   ├── lib/          # Utilities
│   └── models/       # MongoDB schemas
├── docs/             # Documentation
└── public/           # Static assets
```

## Next Steps

- Read [README.md](README.md) for full documentation
- See [docs/api.md](docs/api.md) for API reference
- Check [docs/http402.md](docs/http402.md) for payment protocol

---

**Built on BSV Blockchain**
