# T0kenRent Architecture

Technical architecture documentation for the T0kenRent decentralized rental platform.

**Version:** 1.1.0  
**Updated:** November 30, 2025  
**Status:** 100% Workshop Aligned

## System Overview

T0kenRent is built on the BSV blockchain following the 3-Layer Mandala Network architecture, providing scalability, security, and efficiency for peer-to-peer asset rentals.

### New in v1.1.0
- ✅ sCrypt Smart Contracts (RentalEscrow, PaymentChannel)
- ✅ Custom Overlay Network (tm_tokenrent, ls_tokenrent)
- ✅ Payment Channels for streaming rentals
- ✅ BSV Desktop Wallet Bridge

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
│  │  │   BRC-76 Tokens      │  │      sCrypt Smart Contracts         │ │ │
│  │  │   (Asset NFTs)       │  │      (RentalEscrow, PaymentChannel) │ │ │
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

## sCrypt Smart Contracts

### RentalEscrow Contract

Location: `src/contracts/RentalEscrow.ts`

A stateful 2-of-2 multisig escrow contract for rental deposits:

```typescript
export class RentalEscrow extends SmartContract {
  @prop() ownerPubKey: PubKey
  @prop() renterPubKey: PubKey
  @prop() depositAmount: bigint
  @prop() rentalFee: bigint
  @prop() timeoutBlock: bigint
  @prop(true) state: bigint  // Stateful - tracks CREATED/FUNDED/ACTIVE/RELEASED

  @method()
  public release(ownerSig: Sig, renterSig: Sig) {
    assert(this.state === BigInt(EscrowState.ACTIVE))
    assert(this.checkSig(ownerSig, this.ownerPubKey))
    assert(this.checkSig(renterSig, this.renterPubKey))
    this.state = BigInt(EscrowState.RELEASED)
    // Distribute: rental fee to owner, deposit return to renter
  }
  
  @method()
  public timeout(ownerSig: Sig) {
    assert(this.ctx.locktime >= this.timeoutBlock)
    assert(this.checkSig(ownerSig, this.ownerPubKey))
    // Owner claims full deposit after timeout
  }
  
  @method()
  public refund(ownerSig: Sig, renterSig: Sig) {
    assert(this.state === BigInt(EscrowState.FUNDED))
    // Full deposit returns to renter (cancelled rental)
  }
  
  @method()
  public activate(renterSig: Sig) {
    assert(this.state === BigInt(EscrowState.FUNDED))
    // Renter confirms receipt, moves to ACTIVE
  }
}
```

**State Machine:**
```
         fund()
 CREATED ──────▶ FUNDED
                   │
         activate()│
                   ▼
                 ACTIVE
                   │
    ┌──────────────┼──────────────┐
    │              │              │
release()      timeout()      refund()
    │              │              │
    ▼              ▼              ▼
 RELEASED      DISPUTED       REFUNDED
```

### PaymentChannel Contract

Location: `src/contracts/PaymentChannel.ts`

Bidirectional payment channel for streaming rental payments:

```typescript
export class PaymentChannel extends SmartContract {
  @prop() ownerPubKey: PubKey
  @prop() renterPubKey: PubKey
  @prop() capacity: bigint
  @prop(true) ownerBalance: bigint
  @prop(true) renterBalance: bigint
  @prop(true) sequence: bigint
  @prop() disputeTimeout: bigint
  @prop(true) state: bigint

  @method()
  public update(
    newOwnerBalance: bigint,
    newRenterBalance: bigint,
    newSequence: bigint,
    ownerSig: Sig,
    renterSig: Sig
  ) {
    assert(newSequence > this.sequence)
    assert(newOwnerBalance + newRenterBalance === this.capacity)
    // Off-chain state updates
  }
  
  @method()
  public cooperativeClose(ownerSig: Sig, renterSig: Sig) {
    // Both parties agree to final settlement
  }
  
  @method()
  public initiateClose(initiatorSig: Sig, isOwner: boolean) {
    // Unilateral close starts dispute period
  }
  
  @method()
  public finalizeClose(sig: Sig) {
    assert(this.ctx.locktime >= this.disputeTimeout)
    // Finalize after dispute timeout
  }
}
```

**Use Case: Hourly Rentals**
```
Renter funds channel with 10 hours capacity
  │
  ├── Hour 1: Update balance (renter: 9h, owner: 1h)
  ├── Hour 2: Update balance (renter: 8h, owner: 2h)
  ├── ... (off-chain, no fees)
  ├── Hour 5: Rental ends early
  │
  └── Cooperative close: owner gets 5h, renter gets 5h refund
```

## Custom Overlay Network

### Topic Manager (tm_tokenrent)

Location: `src/overlay/TopicManager.ts`

```typescript
export const TOPICS = {
  ASSET_CREATE: 'tokenrent.asset.create',
  ASSET_TRANSFER: 'tokenrent.asset.transfer',
  ESCROW_CREATE: 'tokenrent.escrow.create',
  ESCROW_FUND: 'tokenrent.escrow.fund',
  ESCROW_RELEASE: 'tokenrent.escrow.release',
  PAYMENT_402: 'tokenrent.payment.402',
  RENTAL_START: 'tokenrent.rental.start',
  RENTAL_END: 'tokenrent.rental.end'
}

export const ADMITTANCE_RULES = {
  [TOPICS.ASSET_CREATE]: {
    requiredFields: ['TOKENRENT', 'tokenId', 'name', 'ownerKey'],
    maxDataSize: 10000,
    requireSignature: true
  },
  [TOPICS.ESCROW_CREATE]: {
    requiredFields: ['TOKENRENT', 'escrowId', 'tokenId', 'ownerKey', 'renterKey', 'depositAmount'],
    requireSignature: true
  }
}

export class TokenRentTopicManager {
  validateOutput(output: TopicOutput): ValidationResult
  parseProtocolData(script: Script): ParsedProtocolData
  createProtocolScript(action: string, data: object): string
  async submitToOverlay(tx, topic): Promise<{ txid: string }>
}
```

### Lookup Service (ls_tokenrent)

Location: `src/overlay/LookupService.ts`

```typescript
export class TokenRentLookupService {
  // Asset Queries
  async getAssetByTokenId(tokenId: string): Promise<AssetRecord>
  async getAssetsByOwner(ownerKey: string): Promise<AssetRecord[]>
  async getAvailableAssets(filters?: AssetFilters): Promise<AssetRecord[]>
  async searchAssets(keyword: string): Promise<AssetRecord[]>
  
  // Escrow Queries
  async getEscrowById(escrowId: string): Promise<EscrowRecord>
  async getActiveEscrows(partyKey: string): Promise<EscrowRecord[]>
  async getEscrowsByToken(tokenId: string): Promise<EscrowRecord[]>
  
  // Payment Queries
  async getPaymentStatus(reference: string): Promise<PaymentRecord>
  async verifyPayment(txid: string, expectedAmount?: number): Promise<VerificationResult>
  async get402Payments(tokenId: string): Promise<PaymentRecord[]>
  
  // Analytics
  async getAssetStats(tokenId: string): Promise<AssetStats>
  async getUserStats(userKey: string): Promise<UserStats>
}
```

### Protocol Script Format

```
# T0kenRent Protocol Script
OP_FALSE OP_RETURN
  <TOKENRENT>           # Protocol identifier
  <action>              # e.g., "create", "escrow-create"
  <tokenId>             # Unique asset identifier
  <key>:<value>         # Additional data pairs
  <metadata_json>       # JSON metadata
```

## Monitoring

### Metrics to Track

- HTTP 402 payment success rate
- Escrow completion rate
- Average rental duration
- Transaction confirmation times
- API response latency
- sCrypt contract deployments
- Payment channel utilization

### Logging

```typescript
// Structured logging format
{
  timestamp: "2025-11-30T10:30:00Z",
  level: "info",
  service: "t0kenrent",
  event: "escrow_funded",
  escrowId: "escrow_123",
  amount: 600.00,
  txid: "a1b2c3...",
  contractType: "RentalEscrow"
}
```
