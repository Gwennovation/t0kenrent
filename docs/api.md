# T0kenRent API Documentation

Complete API reference for the T0kenRent platform.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

### HandCash OAuth

Exchange HandCash auth token for access credentials.

```http
POST /api/auth/handcash
Content-Type: application/json

{
  "authToken": "handcash_auth_token_from_oauth"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "publicKey": "03a3ee5b5d8d...",
  "handle": "johndoe",
  "displayName": "John Doe",
  "paymail": "johndoe@handcash.io",
  "balance": 0.12345678,
  "accessToken": "hc_access_token..."
}
```

### Paymail Resolution

Resolve paymail to public key.

```http
POST /api/auth/paymail
Content-Type: application/json

{
  "paymail": "user@handcash.io"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "paymail": "user@handcash.io",
  "publicKey": "03b4cc5a6d7e..."
}
```

---

## Asset Management

### Create Asset

Create a new rental asset listing.

```http
POST /api/assets/create
Content-Type: application/json

{
  "name": "Canon EOS R5 Camera",
  "description": "Professional mirrorless camera with 45MP sensor",
  "category": "photography",
  "imageUrl": "https://example.com/camera.jpg",
  "rentalRatePerDay": 75,
  "depositAmount": 500,
  "currency": "USD",
  "location": {
    "city": "San Francisco",
    "state": "CA",
    "address": "123 Market St, Suite 100"
  },
  "accessCode": "CAM-2024",
  "specialInstructions": "Handle with care",
  "ownerContact": {
    "name": "John Doe",
    "phone": "(415) 555-0123",
    "email": "john@example.com"
  },
  "unlockFee": 0.0001,
  "condition": "excellent",
  "accessories": ["battery", "charger", "memory_card"],
  "ownerKey": "03a3ee5b5d8d...",
  "ordinalId": "optional_1sat_ordinal_id"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "tokenId": "token_1234567890_abc123",
  "ordinalId": "1sat_ord_camera_abc123",
  "ordinalVerified": true,
  "message": "Ordinal verified on-chain",
  "asset": {
    "id": "asset_001",
    "tokenId": "token_1234567890_abc123",
    "name": "Canon EOS R5 Camera",
    "status": "available",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### List Assets

Fetch available assets from the marketplace.

```http
GET /api/assets/list?category=photography&maxPrice=100&status=available&page=1&limit=20
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (photography, tools, electronics, sports, vehicles, other) |
| maxPrice | number | Maximum daily rental rate |
| status | string | Filter by status (default: available) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response (200 OK):**
```json
{
  "assets": [
    {
      "id": "asset_001",
      "tokenId": "token_camera_001",
      "name": "Canon EOS R5 Camera Kit",
      "description": "Professional mirrorless camera...",
      "category": "photography",
      "imageUrl": "https://images.unsplash.com/...",
      "rentalRatePerDay": 75,
      "depositAmount": 500,
      "currency": "USD",
      "location": { "city": "San Francisco", "state": "CA" },
      "status": "available",
      "rating": 4.8,
      "unlockFee": 0.0001,
      "ownerKey": "demo_owner_001",
      "createdAt": "2025-01-10T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### Get My Assets

Fetch assets owned by a specific user.

```http
GET /api/assets/my?ownerKey=03a3ee5b5d8d...
```

**Response (200 OK):**
```json
{
  "assets": [...],
  "count": 3
}
```

### Unlock Asset Details

Unlock protected rental details after payment.

```http
POST /api/assets/unlock
Content-Type: application/json

{
  "assetId": "asset_001",
  "userKey": "03b4cc5a6d7e...",
  "demoMode": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "unlocked": true,
  "rentalDetails": {
    "pickupLocation": {
      "address": "123 Market Street, Suite 400",
      "city": "San Francisco",
      "state": "CA"
    },
    "accessCode": "CAM-2024",
    "ownerContact": {
      "name": "Alex Chen",
      "phone": "(415) 555-0123",
      "email": "alex@example.com"
    },
    "specialInstructions": "Please return with battery fully charged."
  }
}
```

---

## HTTP 402 Payment Gateway

### Initiate 402 Payment

Request payment details to unlock protected content.

```http
POST /api/402/initiate
Content-Type: application/json

{
  "resourceId": "asset_001",
  "resourceType": "asset"
}
```

**Response (402 Payment Required):**
```json
{
  "success": true,
  "message": "Payment required to access rental details",
  "payment": {
    "paymentReference": "pay_asset_001_1705312200_xyz789",
    "resourceId": "asset_001",
    "resourceType": "asset",
    "resourceName": "Canon EOS R5 Camera Kit",
    "amount": 0.0001,
    "currency": "BSV",
    "paymentAddress": "demo_owner_001",
    "expiresAt": "2025-01-15T10:35:00Z",
    "expiresIn": 300,
    "status": "pending"
  }
}
```

**Response Headers:**
```
Accept-Payment: BSV
Payment-Amount: 0.0001
Payment-Address: demo_owner_001
Payment-Reference: pay_asset_001_1705312200_xyz789
Payment-Expires: 2025-01-15T10:35:00Z
```

### Initiate Payment Request

Create a payment request for wallet integration.

```http
POST /api/payment/initiate
Content-Type: application/json

{
  "assetId": "asset_001",
  "amount": 0.0001,
  "userKey": "03b4cc5a6d7e..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "paymentReference": "pay_1705312200_abc123",
  "amount": 0.0001,
  "recipient": "demo_owner_001",
  "description": "Unlock rental details for Canon EOS R5 Camera Kit",
  "expiresAt": "2025-01-15T10:35:00Z"
}
```

### Verify Payment

Submit payment proof and receive rental details.

```http
POST /api/payment/verify
Content-Type: application/json

{
  "paymentReference": "pay_1705312200_abc123",
  "transactionId": "a1b2c3d4e5f6...",
  "amount": 0.0001,
  "resourceId": "asset_001"
}
```

**Response (200 OK):**
```json
{
  "verified": true,
  "status": "verified",
  "accessToken": "access_1705312200_abc123",
  "expiresIn": 1800,
  "transactionId": "a1b2c3d4e5f6...",
  "rentalDetails": {
    "pickupLocation": {
      "address": "123 Market Street, Suite 400",
      "city": "San Francisco",
      "state": "CA"
    },
    "accessCode": "CAM-2024",
    "ownerContact": {
      "phone": "(415) 555-0123",
      "email": "alex@example.com"
    },
    "specialInstructions": "Please return with battery fully charged."
  }
}
```

### HandCash Payment

Process payment via HandCash wallet.

```http
POST /api/payment/handcash
Content-Type: application/json

{
  "accessToken": "hc_access_token...",
  "assetId": "asset_001",
  "amount": 0.0001,
  "paymentType": "unlock"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transactionId": "hc_tx_1234567890",
  "paymentReference": "pay_1705312200_abc123"
}
```

---

## Escrow Management

### Create Escrow

Create a new 2-of-2 multisig escrow for a rental.

```http
POST /api/escrow/create
Content-Type: application/json

{
  "assetId": "asset_001",
  "renterKey": "03b4cc5a6d7e...",
  "ownerKey": "demo_owner_001",
  "rentalPeriod": {
    "startDate": "2025-01-20",
    "endDate": "2025-01-22"
  },
  "depositAmount": 500,
  "rentalFee": 150
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "escrowId": "escrow_1705312200_def456",
  "escrowAddress": "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  "multisigScript": "OP_2 03a3ee... 03b4cc... OP_2 OP_CHECKMULTISIG",
  "requiredSignatures": 2,
  "timeoutBlocks": 144,
  "totalAmount": 650,
  "depositAmount": 500,
  "rentalFee": 150,
  "status": "created",
  "statusInfo": {
    "status": "created",
    "canRelease": false,
    "message": "Waiting for funding"
  },
  "rentalPeriod": {
    "startDate": "2025-01-20",
    "endDate": "2025-01-22"
  }
}
```

### Fund Escrow

Record escrow funding transaction.

```http
POST /api/escrow/fund
Content-Type: application/json

{
  "escrowId": "escrow_1705312200_def456",
  "transactionId": "b2c3d4e5f6a7...",
  "renterKey": "03b4cc5a6d7e..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "escrowId": "escrow_1705312200_def456",
  "status": "funded",
  "fundingTxId": "b2c3d4e5f6a7...",
  "message": "Escrow funded successfully. Rental is now active."
}
```

### Confirm Escrow

Confirm escrow funding (MongoDB version).

```http
POST /api/escrow/confirm
Content-Type: application/json

{
  "escrowId": "escrow_1705312200_def456",
  "fundingTxid": "b2c3d4e5f6a7...",
  "fundingVout": 0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "escrowId": "escrow_1705312200_def456",
  "status": "funded",
  "fundingTxid": "b2c3d4e5f6a7...",
  "fundedAt": "2025-01-15T11:00:00Z",
  "message": "Escrow funded successfully. Rental is now active."
}
```

### Get Escrow Status

Check current escrow status.

```http
GET /api/escrow/status?escrowId=escrow_1705312200_def456
```

**Response (200 OK):**
```json
{
  "success": true,
  "escrow": {
    "id": "escrow_1705312200_def456",
    "status": "funded",
    "ownerSigned": false,
    "renterSigned": false,
    "totalAmount": 650,
    "depositAmount": 500,
    "rentalFee": 150,
    "fundingTxId": "b2c3d4e5f6a7...",
    "canRelease": true
  }
}
```

### Release Escrow

Sign and release escrow funds.

```http
POST /api/escrow/release
Content-Type: application/json

{
  "escrowId": "escrow_1705312200_def456",
  "signerKey": "03a3ee5b5d8d...",
  "signature": "304402...",
  "releaseType": "standard"
}
```

**Release Types:**
- `standard` - Normal completion (deposit to renter, fee to owner)
- `partial` - Damage deduction from deposit
- `owner_full` - All funds to owner (renter breach)

**Response (200 OK) - First Signature:**
```json
{
  "success": true,
  "escrowId": "escrow_1705312200_def456",
  "status": "funded",
  "signatures": {
    "ownerSigned": true,
    "renterSigned": false
  },
  "message": "Signature recorded. Waiting for other party."
}
```

**Response (200 OK) - Both Signed:**
```json
{
  "success": true,
  "escrowId": "escrow_1705312200_def456",
  "status": "released",
  "signatures": {
    "ownerSigned": true,
    "renterSigned": true
  },
  "releaseBreakdown": {
    "toOwner": 150,
    "toRenter": 500
  },
  "releaseTxId": "c3d4e5f6a7b8...",
  "message": "Escrow released successfully."
}
```

---

## Rental Management

### Create Rental

Create a new rental record.

```http
POST /api/rentals/create
Content-Type: application/json

{
  "assetId": "asset_001",
  "renterKey": "03b4cc5a6d7e...",
  "startDate": "2025-01-20",
  "endDate": "2025-01-22",
  "escrowId": "escrow_1705312200_def456"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "rental": {
    "id": "rental_1705312200_ghi789",
    "assetId": "asset_001",
    "assetName": "Canon EOS R5 Camera Kit",
    "renterKey": "03b4cc5a6d7e...",
    "ownerKey": "demo_owner_001",
    "status": "pending",
    "totalAmount": 650,
    "createdAt": "2025-01-15T11:00:00Z"
  }
}
```

### Get My Rentals

Fetch user's rental history.

```http
GET /api/rentals/my?userKey=03b4cc5a6d7e...
```

**Response (200 OK):**
```json
{
  "rentals": [
    {
      "id": "rental_1705312200_ghi789",
      "assetId": "asset_001",
      "assetName": "Canon EOS R5 Camera Kit",
      "status": "active",
      "role": "renter",
      "startDate": "2025-01-20",
      "endDate": "2025-01-22",
      "totalAmount": 650,
      "escrowId": "escrow_1705312200_def456"
    }
  ],
  "count": 1
}
```

### Complete Rental

Mark rental as completed.

```http
POST /api/rentals/complete
Content-Type: application/json

{
  "rentalId": "rental_1705312200_ghi789",
  "userKey": "03b4cc5a6d7e..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "rental": {
    "id": "rental_1705312200_ghi789",
    "status": "completed",
    "completedAt": "2025-01-22T10:00:00Z"
  }
}
```

### Mint Rental Proof

Mint on-chain proof of rental.

```http
POST /api/rentals/mint-proof
Content-Type: application/json

{
  "rentalId": "rental_1705312200_ghi789",
  "userKey": "03b4cc5a6d7e..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "proofTxId": "d4e5f6a7b8c9...",
  "ordinalId": "1sat_proof_rental_ghi789"
}
```

### Submit to Overlay

Submit rental transaction to overlay network.

```http
POST /api/rentals/submit-overlay
Content-Type: application/json

{
  "rentalId": "rental_1705312200_ghi789",
  "txId": "d4e5f6a7b8c9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "overlayResponse": {
    "accepted": true,
    "topic": "tokenrent.rental.complete"
  }
}
```

---

## User Management

### Get User Profile

Fetch user profile information.

```http
GET /api/user/profile?publicKey=03b4cc5a6d7e...
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "publicKey": "03b4cc5a6d7e...",
    "handle": "johndoe",
    "displayName": "John Doe",
    "walletType": "handcash",
    "rating": 4.9,
    "reviewCount": 15,
    "totalListings": 3,
    "totalRentals": 12,
    "totalEarnings": 1250,
    "totalSpent": 450,
    "createdAt": "2024-06-15T00:00:00Z"
  }
}
```

### Get User Stats

Fetch user statistics.

```http
GET /api/user/stats?publicKey=03b4cc5a6d7e...
```

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalListings": 3,
    "totalRentals": 12,
    "activeRentals": 1,
    "completedRentals": 11,
    "totalEarnings": 1250,
    "totalSpent": 450,
    "rating": 4.9,
    "reviewCount": 15
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid parameters |
| 402 | Payment Required | Micropayment needed |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Invalid HTTP method |
| 500 | Internal Server Error | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Public endpoints | 100 requests/minute |
| Payment endpoints | 50 requests/minute |

---

## Demo Mode

All endpoints support demo mode when:
- User's publicKey starts with `demo_`
- `demoMode: true` is passed in request body
- URL contains `?demo=true`

In demo mode:
- No real blockchain transactions occur
- Payments are simulated
- Mock data is returned
