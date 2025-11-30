# T0kenRent API Documentation

Complete API reference for the T0kenRent platform.

## Base URL

```
Development: http://localhost:3000/api
Production: https://tokenrent.io/api
```

## Authentication

### Wallet Login

Authenticate using BSV wallet signature.

```http
POST /api/auth/login
Content-Type: application/json

{
  "wallet_address": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  "signature": "signed_message_proof"
}
```

**Response:**
```json
{
  "jwt_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600,
  "user_id": "user123"
}
```

---

## Asset Management

### Create Asset

Mint a new BRC-76 compliant rental asset token.

```http
POST /api/assets/create
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Canon EOS R5 Camera",
  "description": "Professional mirrorless camera with 45MP sensor",
  "category": "photography",
  "imageUrl": "https://example.com/camera.jpg",
  "rentalRatePerDay": 50.00,
  "depositAmount": 500.00,
  "currency": "USD",
  "location": {
    "city": "San Francisco",
    "state": "CA",
    "address": "123 Market St, Suite 100"
  },
  "accessCode": "CAMERA2024",
  "specialInstructions": "Equipment is in blue case",
  "unlockFee": 0.0001,
  "condition": "excellent",
  "accessories": ["battery", "charger", "memory_card"],
  "ownerKey": "03a3ee5b5d8d..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "tokenId": "t0ken_1234567890_abc123",
  "asset": {
    "id": "65abc123...",
    "tokenId": "t0ken_1234567890_abc123",
    "name": "Canon EOS R5 Camera",
    "description": "Professional mirrorless camera with 45MP sensor",
    "category": "photography",
    "imageUrl": "https://example.com/camera.jpg",
    "rentalRatePerDay": 50.00,
    "depositAmount": 500.00,
    "currency": "USD",
    "location": {
      "city": "San Francisco",
      "state": "CA"
    },
    "status": "available",
    "unlockFee": 0.0001,
    "ownerKey": "03a3ee5b5d8d...",
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "brc76Compliant": true
}
```

### List Assets

Fetch available assets from the marketplace.

```http
GET /api/assets/list?category=photography&maxPrice=100&city=San%20Francisco&page=1&limit=20
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| maxPrice | number | Maximum daily rental rate |
| city | string | Filter by city |
| status | string | Filter by status (default: available) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |

**Response (200 OK):**
```json
{
  "assets": [
    {
      "id": "65abc123...",
      "tokenId": "t0ken_1234567890_abc123",
      "name": "Canon EOS R5 Camera",
      "category": "photography",
      "rentalRatePerDay": 50.00,
      "depositAmount": 500.00,
      "location": {
        "city": "San Francisco",
        "state": "CA"
      },
      "status": "available",
      "rating": 4.8,
      "unlockFee": 0.0001
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Get My Assets

Fetch assets owned by the authenticated user.

```http
GET /api/assets/my?owner={publicKey}
```

**Response (200 OK):**
```json
{
  "assets": [...],
  "count": 5
}
```

---

## HTTP 402 Payment Gateway

### Initiate Payment

Request access to protected rental details.

```http
POST /api/payment/initiate
Content-Type: application/json

{
  "resourceId": "t0ken_1234567890_abc123",
  "resourceType": "rental_details",
  "payerKey": "03b4cc5a6d7e..."
}
```

**Response (402 Payment Required):**
```json
{
  "error": "Payment required",
  "message": "Access to rental details requires micropayment",
  "payment": {
    "currency": "BSV",
    "amount": 0.0001,
    "address": "03a3ee5b5d8d...",
    "reference": "pay_t0ken_1234567890_abc123_1705312200_xyz789",
    "expiresAt": "2025-01-15T10:35:00Z",
    "expiresIn": 300,
    "resourceId": "t0ken_1234567890_abc123",
    "resourceType": "rental_details"
  },
  "asset": {
    "name": "Canon EOS R5 Camera",
    "tokenId": "t0ken_1234567890_abc123"
  }
}
```

**Response Headers:**
```
Accept-Payment: BSV
Payment-Amount: 0.0001
Payment-Address: 03a3ee5b5d8d...
Payment-Reference: pay_t0ken_1234567890_abc123_1705312200_xyz789
```

### Verify Payment

Submit payment proof and receive rental details.

```http
POST /api/payment/verify
Content-Type: application/json

{
  "paymentReference": "pay_t0ken_1234567890_abc123_1705312200_xyz789",
  "transactionId": "a1b2c3d4e5f6...",
  "amount": 0.0001,
  "resourceId": "t0ken_1234567890_abc123"
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
      "address": "123 Market St, Suite 100",
      "city": "San Francisco",
      "state": "CA",
      "coordinates": {
        "lat": 37.7749,
        "lng": -122.4194
      }
    },
    "accessCode": "CAMERA2024",
    "ownerContact": {
      "phone": "+1-555-0123",
      "email": "owner@example.com"
    },
    "specialInstructions": "Equipment is in blue case"
  }
}
```

**Response Headers:**
```
Payment-Verified: true
Access-Token: access_1705312200_abc123
```

---

## Escrow Management

### Create Escrow

Create a new escrow contract for a rental agreement.

```http
POST /api/escrow/create
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "rentalTokenId": "t0ken_1234567890_abc123",
  "renterKey": "03b4cc5a6d7e...",
  "ownerKey": "03a3ee5b5d8d...",
  "rentalPeriod": {
    "startDate": "2025-01-20T10:00:00Z",
    "endDate": "2025-01-22T10:00:00Z"
  },
  "depositAmount": 500.00,
  "rentalFee": 100.00
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "escrowId": "escrow_1705312200_def456",
  "escrowAddress": "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  "escrowScript": "5221...",
  "multisigScript": "OP_2 03a3ee... 03b4cc... OP_2 OP_CHECKMULTISIG",
  "requiredSignatures": 2,
  "timeoutBlocks": 144,
  "totalAmount": 600.00,
  "status": "created",
  "rentalPeriod": {
    "startDate": "2025-01-20T10:00:00Z",
    "endDate": "2025-01-22T10:00:00Z"
  }
}
```

### Confirm Escrow Funding

Confirm that escrow has been funded.

```http
POST /api/escrow/confirm
Authorization: Bearer {jwt_token}
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
  "rentalPeriod": {
    "startDate": "2025-01-20T10:00:00Z",
    "endDate": "2025-01-22T10:00:00Z"
  },
  "message": "Escrow funded successfully. Rental is now active."
}
```

### Release Escrow

Sign escrow release (requires both parties).

```http
POST /api/escrow/release
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "escrowId": "escrow_1705312200_def456",
  "signerKey": "03a3ee5b5d8d...",
  "signature": "304402...",
  "releaseType": "standard",
  "damageAmount": 0
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
  "releaseBreakdown": null,
  "message": "Signature recorded. Waiting for renter signature."
}
```

**Response (200 OK) - Both Signed:**
```json
{
  "success": true,
  "escrowId": "escrow_1705312200_def456",
  "status": "completed",
  "signatures": {
    "ownerSigned": true,
    "renterSigned": true
  },
  "releaseBreakdown": {
    "toOwner": 100.00,
    "toRenter": 500.00,
    "toArbitrator": 0
  },
  "message": "Both parties have signed. Escrow released."
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Code | Meaning | T0kenRent Usage |
|------|---------|-----------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid parameters |
| 402 | Payment Required | HTTP 402 micropayment needed |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Invalid HTTP method |
| 409 | Conflict | Resource conflict (e.g., already rented) |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Public endpoints | 100 requests/minute |
| Authenticated endpoints | 200 requests/minute |
| Payment endpoints | 50 requests/minute |

---

## Webhooks (Future)

T0kenRent will support webhooks for:
- Payment verification events
- Escrow status changes
- Rental completion notifications

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { T0kenRentClient } from '@tokenrent/sdk';

const client = new T0kenRentClient({
  baseUrl: 'https://tokenrent.io/api',
  walletProvider: babbageWallet
});

// List available assets
const assets = await client.assets.list({ category: 'photography' });

// Unlock rental details (handles HTTP 402 automatically)
const details = await client.payment.unlockDetails(asset.tokenId);

// Create escrow
const escrow = await client.escrow.create({
  assetId: asset.tokenId,
  startDate: new Date('2025-01-20'),
  endDate: new Date('2025-01-22')
});
```

---

## Changelog

### v1.0.0 (2025-01-15)
- Initial release
- HTTP 402 payment gateway
- BRC-76 asset tokenization
- 2-of-2 multisig escrows
