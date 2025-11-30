# T0kenRent

> **Decentralized Peer-to-Peer Rental Platform on BSV**

[![BSV Hackathon](https://img.shields.io/badge/BSV-Hackathon%202025-orange)](https://bsvhackathon.com)
[![Built on BSV](https://img.shields.io/badge/Built%20on-BSV-green)](https://bsvblockchain.org)
[![HTTP 402](https://img.shields.io/badge/HTTP-402%20Payment%20Required-purple)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)

T0kenRent is a decentralized rental marketplace built on the BSV blockchain. Rent everyday items from people near you with secure BSV payments, smart contract escrow, and on-chain proof of every transaction.

## Live Demo

**🚀 [Try T0kenRent Live](https://3000-ivkd2o96dkwj9eeevj6yh-18e660f9.sandbox.novita.ai)**

## Key Features

- **🔐 Multi-Wallet Support**: Connect with HandCash, MetaNet/Babbage, or Paymail
- **💰 HTTP 402 Micropayments**: Pay tiny fees (~$0.001) to unlock rental details
- **🔒 2-of-2 Multisig Escrow**: Secure deposits with smart contract protection
- **📜 On-Chain Logging**: Every transaction recorded on BSV blockchain
- **🎯 1Sat Ordinal Integration**: Link assets to ordinals for proof of ownership
- **🌐 Overlay Network**: Transaction broadcasting via BSV overlay services

## Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB** (optional - works without it in demo mode)
- **BSV Wallet**: HandCash, MetaNet, or Paymail

### Installation

```bash
# Clone the repository
git clone https://github.com/Gwennovation/t0kenrent.git
cd t0kenrent

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following:

```bash
# HandCash Connect (get from https://dashboard.handcash.io)
NEXT_PUBLIC_HANDCASH_APP_ID=your_app_id
HANDCASH_APP_SECRET=your_app_secret
NEXT_PUBLIC_HANDCASH_REDIRECT_URL=http://localhost:3000

# MongoDB (optional - app works without it)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/t0kenrent

# BSV Network
NETWORK=main
WHATSONCHAIN_API=https://api.whatsonchain.com/v1/bsv/main

# Overlay Network
OVERLAY_URL=https://overlay.example.com

# HTTP 402 Settings
DEFAULT_UNLOCK_FEE_BSV=0.0001
PAYMENT_EXPIRY_MINUTES=5

# Security
JWT_SECRET=your_secret_key
```

## Demo Mode

Test T0kenRent without connecting a wallet:

1. Visit the application
2. Click **"Try Demo Mode"** button
3. Or add `?demo=true` to any URL

**Demo Assets Available:**
- Canon EOS R5 Camera Kit ($75/day)
- Trek Mountain Bike ($45/day)
- Milwaukee Power Tool Set ($35/day)
- Epson 4K Projector ($55/day)
- DJI Mavic 3 Pro Drone ($95/day)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Marketplace  │  │   Dashboard  │  │ Wallet Auth  │       │
│  │  RentalCard  │  │  RentalCard  │  │  HandCash    │       │
│  │  HTTP402Modal│  │  EscrowModal │  │  MetaNet     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  /api/auth/*     /api/assets/*    /api/escrow/*             │
│  /api/402/*      /api/payment/*   /api/rentals/*            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   MongoDB    │  │  In-Memory   │  │  BSV Chain   │       │
│  │   (prod)     │  │   (demo)     │  │  (overlay)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## MongoDB Models

| Model | Description |
|-------|-------------|
| **User** | User accounts with wallet info, stats, ratings |
| **RentalAsset** | Asset listings with HTTP 402 payment support |
| **Rental** | Rental agreements with status tracking |
| **Escrow** | 2-of-2 multisig escrow contracts |

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/handcash` | POST | HandCash OAuth callback |
| `/api/auth/paymail` | POST | Paymail resolution |

### Assets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/assets/create` | POST | Create new rental asset |
| `/api/assets/list` | GET | List marketplace assets |
| `/api/assets/my` | GET | Get user's owned assets |
| `/api/assets/unlock` | POST | Unlock asset details |

### HTTP 402 Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/402/initiate` | POST | Initiate 402 payment request |
| `/api/402/callback` | POST | Payment callback |
| `/api/payment/initiate` | POST | Create payment request |
| `/api/payment/verify` | POST | Verify payment transaction |
| `/api/payment/handcash` | POST | HandCash payment |

### Escrow

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/escrow/create` | POST | Create 2-of-2 escrow |
| `/api/escrow/fund` | POST | Fund escrow contract |
| `/api/escrow/confirm` | POST | Confirm funding |
| `/api/escrow/status` | GET | Get escrow status |
| `/api/escrow/release` | POST | Release escrow funds |

### Rentals

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rentals/create` | POST | Create rental record |
| `/api/rentals/my` | GET | Get user's rentals |
| `/api/rentals/complete` | POST | Complete rental |
| `/api/rentals/mint-proof` | POST | Mint rental proof |
| `/api/rentals/submit-overlay` | POST | Submit to overlay |

### User

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET/POST | User profile |
| `/api/user/stats` | GET | User statistics |

## Project Structure

```
t0kenrent/
├── src/
│   ├── components/           # React components
│   │   ├── AssetCard.tsx         # Asset display card
│   │   ├── CreateAssetModal.tsx  # Asset creation form
│   │   ├── EscrowModal.tsx       # Escrow checkout
│   │   ├── HTTP402Modal.tsx      # Payment modal
│   │   ├── RentalCard.tsx        # Rental display
│   │   ├── RentalDashboard.tsx   # User dashboard
│   │   ├── RentalMarketplace.tsx # Browse assets
│   │   ├── WalletSelector.tsx    # Wallet connection
│   │   └── Portal.tsx            # Modal portal
│   ├── models/               # MongoDB schemas
│   │   ├── User.ts
│   │   ├── RentalAsset.ts
│   │   ├── Rental.ts
│   │   └── Escrow.ts
│   ├── lib/                  # Utilities
│   │   ├── handcash.ts           # HandCash SDK
│   │   ├── escrow.ts             # Escrow logic
│   │   ├── http402.ts            # HTTP 402 protocol
│   │   ├── mongodb.ts            # Database connection
│   │   ├── overlay.ts            # Overlay network
│   │   ├── ordinals.ts           # 1Sat ordinals
│   │   ├── pushdrop.ts           # PushDrop tokens
│   │   └── storage.ts            # In-memory storage
│   ├── pages/
│   │   ├── api/              # API routes
│   │   │   ├── 402/
│   │   │   ├── assets/
│   │   │   ├── auth/
│   │   │   ├── escrow/
│   │   │   ├── payment/
│   │   │   ├── rentals/
│   │   │   └── user/
│   │   ├── index.tsx         # Main page
│   │   ├── _app.tsx          # App wrapper
│   │   └── _document.tsx     # HTML document
│   ├── context/              # React context
│   └── styles/               # CSS styles
├── docs/                     # Documentation
│   ├── api.md
│   ├── architecture.md
│   ├── http402.md
│   └── wallet-integration.md
├── public/                   # Static assets
└── scripts/                  # Utility scripts
```

## Wallet Integration

### HandCash
1. Create app at [dashboard.handcash.io](https://dashboard.handcash.io)
2. Add redirect URL to your app settings
3. Configure `NEXT_PUBLIC_HANDCASH_APP_ID` and `HANDCASH_APP_SECRET`

### MetaNet/Babbage
- Uses `babbage-sdk` for transaction signing
- Requires MetaNet Portal extension or compatible wallet

### Paymail
- Enter your paymail address (e.g., `user@handcash.io`)
- System resolves public key via paymail protocol

## HTTP 402 Flow

```
1. User clicks "Unlock Contact Info" on asset
2. Frontend calls POST /api/402/initiate
3. API returns 402 with payment details
4. User's wallet creates payment transaction
5. Frontend calls POST /api/payment/verify with txId
6. API verifies on-chain, returns access token
7. Asset details unlocked for 30 minutes
```

## Escrow Flow

```
1. Renter selects dates and clicks "Rent Now"
2. POST /api/escrow/create creates 2-of-2 multisig
3. Renter funds escrow via wallet
4. POST /api/escrow/fund records funding tx
5. Rental becomes active
6. Both parties sign to release
7. POST /api/escrow/release distributes funds
```

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- **BSV Blockchain** - Scalable, low-cost transactions
- **HandCash** - Wallet integration
- **Babbage SDK** - MetaNet wallet support
- **WhatsOnChain** - Blockchain explorer API

---

**Built with ❤️ on BSV Blockchain**
