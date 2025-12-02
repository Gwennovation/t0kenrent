# T0kenRent

Decentralized Peer-to-Peer Rental Platform on BSV

T0kenRent enables peer-to-peer asset rentals using BSV blockchain technology. The platform provides secure payments through micropayments and smart contract escrow, with complete transaction records stored on-chain.

## Live Demo


## Features

- **Multi-Wallet Support**: Connect using HandCash, MetaNet/Babbage, or Paymail
- **HTTP 402 Micropayments**: Unlock rental details with small payments (approximately $0.001)
- **2-of-2 Multisig Escrow**: Deposits protected by smart contracts requiring both parties to sign
- **On-Chain Transaction Records**: All transactions recorded on the BSV blockchain
- **1Sat Ordinal Integration**: Assets can be linked to ordinals for ownership verification
- **Overlay Network**: Transaction broadcasting through BSV overlay services

## Requirements

- Node.js version 18 or higher
- npm or yarn package manager
- MongoDB (optional - the application functions without it in demo mode)
- BSV Wallet: HandCash, MetaNet, or Paymail address

## Installation

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

## Environment Variables

Create a `.env.local` file with the following configuration:

```bash
# HandCash Connect (obtain from https://dashboard.handcash.io)
NEXT_PUBLIC_HANDCASH_APP_ID=your_app_id
HANDCASH_APP_SECRET=your_app_secret
NEXT_PUBLIC_HANDCASH_REDIRECT_URL=http://localhost:3000

# MongoDB (optional - application works without it)
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

1. Open the application
2. Click the "Try Demo Mode" button
3. Alternatively, append `?demo=true` to any URL

Sample assets available in demo mode:
- Canon EOS R5 Camera Kit ($75/day)
- Trek Mountain Bike ($45/day)
- Milwaukee Power Tool Set ($35/day)
- Epson 4K Projector ($55/day)
- DJI Mavic 3 Pro Drone ($95/day)

## Architecture

```
Frontend (Next.js)
  - Marketplace: Browse and filter rental listings
  - Dashboard: Manage rentals and view history
  - Wallet Auth: HandCash, MetaNet, Paymail connections
      |
API Routes (Next.js)
  - /api/auth/*: Authentication endpoints
  - /api/assets/*: Asset management
  - /api/402/*: Micropayment gateway
  - /api/escrow/*: Smart contract escrow
  - /api/payment/*: Payment processing
  - /api/rentals/*: Rental management
      |
Data Layer
  - MongoDB: Production database
  - In-Memory: Demo mode storage
  - BSV Chain: On-chain records via overlay
```

## Database Models

| Model | Description |
|-------|-------------|
| User | User accounts with wallet information and statistics |
| RentalAsset | Asset listings with HTTP 402 payment support |
| Rental | Rental agreements with status tracking |
| Escrow | 2-of-2 multisig escrow contracts |

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
| `/api/assets/my` | GET | Get user-owned assets |
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
| `/api/rentals/my` | GET | Get user rentals |
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
│   │   ├── AssetCard.tsx
│   │   ├── CreateAssetModal.tsx
│   │   ├── EscrowModal.tsx
│   │   ├── HTTP402Modal.tsx
│   │   ├── RentalCard.tsx
│   │   ├── RentalDashboard.tsx
│   │   ├── RentalMarketplace.tsx
│   │   ├── WalletSelector.tsx
│   │   └── Portal.tsx
│   ├── models/               # MongoDB schemas
│   │   ├── User.ts
│   │   ├── RentalAsset.ts
│   │   ├── Rental.ts
│   │   └── Escrow.ts
│   ├── lib/                  # Utilities
│   │   ├── handcash.ts
│   │   ├── escrow.ts
│   │   ├── http402.ts
│   │   ├── mongodb.ts
│   │   ├── overlay.ts
│   │   ├── ordinals.ts
│   │   ├── pushdrop.ts
│   │   └── storage.ts
│   ├── pages/
│   │   ├── api/              # API routes
│   │   ├── index.tsx
│   │   ├── _app.tsx
│   │   └── _document.tsx
│   ├── context/
│   └── styles/
├── config/
│   └── deployment-info.json
├── docs/
│   ├── CONTRIBUTING.md
│   ├── QUICKSTART.md
│   ├── api.md
│   ├── architecture.md
│   ├── http402.md
│   └── wallet-integration.md
├── public/
└── scripts/
```

## Wallet Integration

### HandCash
1. Create an application at dashboard.handcash.io
2. Add your redirect URL to the application settings
3. Configure `NEXT_PUBLIC_HANDCASH_APP_ID` and `HANDCASH_APP_SECRET`

### MetaNet/Babbage
- Uses babbage-sdk for transaction signing
- Requires MetaNet Portal extension or compatible wallet

### Paymail
- Enter your paymail address (e.g., user@handcash.io)
- System resolves public key via paymail protocol

## HTTP 402 Payment Flow

```
1. User clicks "Unlock Contact Info" on asset
2. Frontend calls POST /api/402/initiate
3. API returns 402 status with payment details
4. User wallet creates payment transaction
5. Frontend calls POST /api/payment/verify with transaction ID
6. API verifies on-chain payment, returns access token
7. Asset details unlocked for 30 minutes
```

## Escrow Flow

```
1. Renter selects dates and clicks "Rent Now"
2. POST /api/escrow/create creates 2-of-2 multisig
3. Renter funds escrow via wallet
4. POST /api/escrow/fund records funding transaction
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

See docs/CONTRIBUTING.md for detailed guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE for details.

## Acknowledgments

- BSV Blockchain - Scalable, low-cost transactions
- HandCash - Wallet integration
- Babbage SDK - MetaNet wallet support
- WhatsOnChain - Blockchain explorer API

---

Built on BSV Blockchain
