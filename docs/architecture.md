# T0kenRent Architecture

Technical architecture documentation for the T0kenRent decentralized rental platform.

## System Overview

T0kenRent is built on the BSV blockchain following the 3-Layer Mandala Network architecture, providing scalability, security, and efficiency for peer-to-peer asset rentals.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         T0kenRent Architecture                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Layer 3: Application Layer                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │   Next.js    │  │  HTTP 402    │  │    Wallet Interface      │ │ │
│  │  │   Frontend   │  │   Gateway    │  │    (Babbage SDK)         │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘ │ │
│  │         │                 │                        │               │ │
│  │         └────────────────┼────────────────────────┘               │ │
│  │                          │                                         │ │
│  │  ┌───────────────────────▼───────────────────────────────────────┐ │ │
│  │  │                    API Routes (Next.js)                        │ │ │
│  │  │  /api/assets  │  /api/payment  │  /api/escrow                 │ │ │
│  │  └───────────────────────┬───────────────────────────────────────┘ │ │
│  └──────────────────────────┼─────────────────────────────────────────┘ │
│                             │                                            │
│  ┌──────────────────────────▼─────────────────────────────────────────┐ │
│  │                    Layer 2: Overlay Services                        │ │
│  │  ┌────────────────────────────┐  ┌──────────────────────────────┐ │ │
│  │  │      Topic Manager         │  │     Lookup Service           │ │ │
│  │  │      (tm_tokenrent)        │  │     (ls_tokenrent)           │ │ │
│  │  │                            │  │                              │ │ │
│  │  │  • Protocol validation     │  │  • Asset token registry      │ │ │
│  │  │  • Transaction monitoring  │  │  • Escrow UTXO tracking      │ │ │
│  │  │  • State transition rules  │  │  • Payment verification      │ │ │
│  │  └────────────────────────────┘  └──────────────────────────────┘ │ │
│  └──────────────────────────┬─────────────────────────────────────────┘ │
│                             │                                            │
│  ┌──────────────────────────▼─────────────────────────────────────────┐ │
│  │                    Layer 1: BSV Protocol                            │ │
│  │  ┌──────────────────────┐  ┌─────────────────────────────────────┐ │ │
│  │  │   BRC-76 Tokens      │  │      Bitcoin Script Escrows         │ │ │
│  │  │   (Asset NFTs)       │  │      (Information Locks)            │ │ │
│  │  │                      │  │                                     │ │ │
│  │  │  ┌────────────────┐  │  │  ┌─────────────────────────────┐   │ │ │
│  │  │  │ PushDrop Data  │  │  │  │  2-of-2 Multisig Script    │   │ │ │
│  │  │  │ • Token ID     │  │  │  │  • Owner key               │   │ │ │
│  │  │  │ • Metadata     │  │  │  │  • Renter key              │   │ │ │
│  │  │  │ • Owner Key    │  │  │  │  • Timeout fallback        │   │ │ │
│  │  │  └────────────────┘  │  │  └─────────────────────────────┘   │ │ │
│  │  └──────────────────────┘  └─────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layer 1: BSV Protocol

### BRC-76 Token Standard

T0kenRent uses BRC-76 compliant tokens to represent rentable assets. Each token contains:

```javascript
// BRC-76 Token Structure
{
  protocol: "BRC-76",
  type: "rental-asset",
  tokenId: "t0ken_1234567890_abc123",
  name: "Canon EOS R5 Camera",
  category: "photography",
  metadata: {
    rentalRate: 50.00,
    deposit: 500.00,
    currency: "USD",
    condition: "excellent",
    unlockFee: 0.0001
  },
  owner: "03a3ee5b5d8d0e4b8f3c2e1d4a7b6c9f..."
}
```

### PushDrop Protocol

Asset metadata is stored on-chain using the PushDrop protocol:

```
OP_FALSE OP_RETURN
<protocol_id>
<token_id>
<name>
<category>
<metadata_json>
<owner_key>
```

### Escrow Script

Security deposits use Bitcoin Script predicates:

```
# Standard 2-of-2 Multisig
OP_2
<owner_pubkey>
<renter_pubkey>
OP_2
OP_CHECKMULTISIG

# With Timeout (Advanced)
OP_IF
    # Normal path: 2-of-2 multisig
    OP_2 <owner_pubkey> <renter_pubkey> OP_2 OP_CHECKMULTISIG
OP_ELSE
    # Timeout path: owner recovery after N blocks
    <timeout_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
    <owner_pubkey> OP_CHECKSIG
OP_ENDIF
```

## Layer 2: Overlay Services

### Topic Manager (tm_tokenrent)

Monitors BSV network for T0kenRent protocol transactions:

```typescript
interface TopicManager {
  // Register transaction topics
  topics: [
    'tokenrent.asset.create',
    'tokenrent.asset.transfer',
    'tokenrent.escrow.fund',
    'tokenrent.escrow.release',
    'tokenrent.payment.402'
  ];
  
  // Validate incoming transactions
  validateTransaction(tx: Transaction): boolean;
  
  // Extract protocol data
  parseProtocolData(tx: Transaction): TokenRentData;
}
```

### Lookup Service (ls_tokenrent)

Maintains application state:

```typescript
interface LookupService {
  // Asset queries
  getAssetByTokenId(tokenId: string): Asset;
  getAssetsByOwner(ownerKey: string): Asset[];
  getAvailableAssets(filters: AssetFilters): Asset[];
  
  // Escrow queries
  getEscrowById(escrowId: string): Escrow;
  getActiveEscrows(partyKey: string): Escrow[];
  
  // Payment queries
  getPaymentStatus(reference: string): PaymentStatus;
  verifyPayment(txid: string, amount: number): boolean;
}
```

## Layer 3: Application

### Frontend Architecture

```
src/
├── components/
│   ├── RentalMarketplace.tsx    # Main marketplace view
│   ├── AssetCard.tsx            # Asset display card
│   ├── HTTP402Modal.tsx         # Payment gate modal
│   ├── EscrowModal.tsx          # Escrow creation flow
│   ├── CreateAssetModal.tsx     # Asset listing wizard
│   ├── WalletAuth.tsx           # Wallet connection
│   └── ...
├── pages/
│   ├── index.tsx                # Landing page
│   └── api/                     # API routes
│       ├── assets/
│       │   ├── create.ts
│       │   ├── list.ts
│       │   └── my.ts
│       ├── payment/
│       │   ├── initiate.ts
│       │   └── verify.ts
│       └── escrow/
│           ├── create.ts
│           ├── confirm.ts
│           └── release.ts
├── lib/
│   ├── mnee.ts                  # MNEE token handling
│   ├── overlay.ts               # Overlay service client
│   ├── mongodb.ts               # Database connection
│   └── error-utils.ts           # Error handling
├── models/
│   ├── RentalAsset.ts           # Asset schema
│   └── Escrow.ts                # Escrow schema
└── types/
    └── index.ts                 # TypeScript definitions
```

### API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Assets    │  │  Payments   │  │      Escrow         │ │
│  │   Service   │  │   Service   │  │      Service        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐ │
│  │                 Service Layer                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  MongoDB     │  │   Overlay    │  │  Babbage    │ │ │
│  │  │  (State)     │  │   Network    │  │    SDK      │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Asset Listing Flow

```
User Input → CreateAssetModal → POST /api/assets/create
                                        │
                                        ▼
                              ┌─────────────────────┐
                              │  Create BRC-76 Token │
                              │  via Babbage SDK    │
                              └──────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │  Store in MongoDB   │
                              │  (off-chain state)  │
                              └──────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │  Broadcast to       │
                              │  Overlay Network    │
                              └──────────┬──────────┘
                                        │
                                        ▼
                              Return tokenId to User
```

### Rental Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Rental Flow                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Browse Marketplace                                                   │
│     User → GET /api/assets/list → Display available assets              │
│                                                                          │
│  2. HTTP 402 Payment (Unlock Details)                                   │
│     User → POST /api/payment/initiate → 402 Response                    │
│     User → Create BSV micropayment → POST /api/payment/verify           │
│     User ← Receive rental details (location, access code)               │
│                                                                          │
│  3. Create Escrow                                                        │
│     User → POST /api/escrow/create → Generate multisig contract         │
│     User → Fund escrow (BSV transaction)                                │
│     User → POST /api/escrow/confirm → Rental becomes active             │
│                                                                          │
│  4. Rental Period                                                        │
│     Asset status: "rented"                                              │
│     Renter uses asset                                                   │
│                                                                          │
│  5. Return & Release                                                     │
│     Owner → POST /api/escrow/release (sign)                             │
│     Renter → POST /api/escrow/release (sign)                            │
│     Both signed → Escrow released → Funds distributed                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### RentalAsset Collection

```javascript
{
  tokenId: String,           // Unique BRC-76 token ID
  name: String,
  description: String,
  category: String,
  imageUrl: String,
  
  // Pricing
  rentalRatePerDay: Number,
  depositAmount: Number,
  currency: String,
  unlockFee: Number,
  
  // Location (public)
  location: {
    city: String,
    state: String
  },
  
  // Protected (HTTP 402)
  rentalDetails: {
    pickupLocation: {
      address: String,
      coordinates: { lat: Number, lng: Number }
    },
    accessCode: String,
    ownerContact: Object
  },
  
  // HTTP 402 payments
  http402Payments: [{
    paymentReference: String,
    amount: Number,
    transactionId: String,
    status: String,
    accessToken: String,
    accessTokenExpiry: Date
  }],
  
  // Ownership
  ownerKey: String,
  status: String,
  
  // Metrics
  rating: Number,
  totalRentals: Number,
  totalEarnings: Number,
  
  // Blockchain
  mintTransactionId: String,
  brc76Metadata: Object,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Escrow Collection

```javascript
{
  escrowId: String,
  rentalTokenId: String,
  assetName: String,
  
  // Parties
  ownerKey: String,
  renterKey: String,
  arbitratorKey: String,
  
  // Period
  rentalPeriod: {
    startDate: Date,
    endDate: Date
  },
  
  // Financial
  depositAmount: Number,
  rentalFee: Number,
  totalAmount: Number,
  
  // Blockchain
  escrowAddress: String,
  escrowScript: String,
  multisigScript: String,
  fundingTxid: String,
  releaseTxid: String,
  
  // State
  status: String,  // created, funded, completed, disputed, etc.
  
  // Signatures
  signatures: {
    ownerSigned: Boolean,
    ownerSignature: String,
    renterSigned: Boolean,
    renterSignature: String
  },
  
  // Release
  releaseBreakdown: {
    toOwner: Number,
    toRenter: Number,
    toArbitrator: Number
  },
  
  createdAt: Date,
  fundedAt: Date,
  completedAt: Date
}
```

## Security Architecture

### Authentication

```
┌──────────────┐     ┌───────────────┐     ┌────────────────┐
│   User       │────▶│  BSV Wallet   │────▶│  Babbage SDK   │
│              │     │  (Signing)    │     │  (Auth)        │
└──────────────┘     └───────────────┘     └────────────────┘
                                                  │
                                                  ▼
                                          ┌────────────────┐
                                          │  JWT Token     │
                                          │  Generation    │
                                          └────────────────┘
```

### Transaction Security

- **Escrow Protection**: 2-of-2 multisig prevents unilateral withdrawal
- **Timeout Safety**: Fallback release if parties become unresponsive
- **On-chain Verification**: All payments verified on BSV network
- **Access Control**: HTTP 402 tokens expire after 30 minutes

### Data Security

- **Sensitive Data Encryption**: Contact info encrypted at rest
- **Payment Reference Uniqueness**: Prevents replay attacks
- **Rate Limiting**: Prevents abuse of payment endpoints
- **Input Validation**: All inputs sanitized and validated

## Scalability

### BSV Advantages

- **Unbounded Blocks**: No congestion from rental transactions
- **Sub-cent Fees**: Micropayments economically viable
- **Instant Propagation**: Real-time transaction visibility

### Application Scaling

```
                    Load Balancer
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ App     │    │ App     │    │ App     │
    │ Server  │    │ Server  │    │ Server  │
    │   #1    │    │   #2    │    │   #3    │
    └────┬────┘    └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                    ┌────▼────┐
                    │ MongoDB │
                    │ Cluster │
                    └─────────┘
```

## Deployment Architecture

### Production Setup

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/t0kenrent
      - OVERLAY_URL=https://overlay-us-1.bsvb.tech
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/t0kenrent` |
| `NETWORK` | BSV network (main/test) | `main` |
| `OVERLAY_URL` | Overlay service URL | `https://overlay-us-1.bsvb.tech` |
| `ARC_API_KEY` | TAAL ARC API key | `mainnet_xxx` |
| `JWT_SECRET` | JWT signing secret | `random_string` |

## Monitoring

### Metrics to Track

- HTTP 402 payment success rate
- Escrow completion rate
- Average rental duration
- Transaction confirmation times
- API response latency

### Logging

```typescript
// Structured logging format
{
  timestamp: "2025-01-15T10:30:00Z",
  level: "info",
  service: "t0kenrent",
  event: "escrow_funded",
  escrowId: "escrow_123",
  amount: 600.00,
  txid: "a1b2c3..."
}
```
