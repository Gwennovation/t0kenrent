# HTTP 402 Payment Required Protocol

This document describes T0kenRent's implementation of the HTTP 402 "Payment Required" status code for micropayment-gated content.

## Overview

HTTP 402 is a reserved status code originally intended for digital payments. T0kenRent uses this protocol to gate access to sensitive rental information behind BSV micropayments, creating a seamless pay-per-view experience.

## Why HTTP 402?

### Traditional Problems
- **Spam Inquiries**: Free access attracts casual browsers who waste owner time
- **Serious Intent Verification**: No way to identify genuinely interested renters
- **Revenue Loss**: Owners share valuable information without compensation
- **Payment Friction**: Traditional payments have minimum thresholds

### HTTP 402 Solutions
- **Economic Filter**: Small payment demonstrates serious interest
- **Owner Compensation**: Every detail access generates revenue
- **Micropayment Efficiency**: BSV enables sub-cent transactions
- **Seamless UX**: Payment feels like a normal web interaction

## Protocol Implementation

### Standard Flow

```

Renter T0kenRent BSV Network 


1. GET /rental/xyz 


2. 402 Payment Required 

+ payment details 

3. Create BSV tx 


4. POST /payment/verify 

+ txid, reference 
5. Verify tx 



6. 200 OK + details 

+ access token 

```

### Request/Response Examples

#### Step 1: Initial Request

```http
GET /api/rental/details/t0ken_123 HTTP/1.1
Host: tokenrent.io
Authorization: Bearer user_jwt_token
```

#### Step 2: 402 Response

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
Accept-Payment: BSV
Payment-Amount: 0.0001
Payment-Address: 1OwnerAddressXyz...
Payment-Reference: pay_t0ken_123_1705312200_abc

{
"error": "Payment required",
"message": "Access to rental details requires micropayment",
"payment": {
"currency": "BSV",
"amount": "0.0001",
"address": "1OwnerAddressXyz...",
"reference": "pay_t0ken_123_1705312200_abc",
"expires_in": 300
}
}
```

#### Steps 3-4: Payment Submission

```http
POST /api/payment/verify HTTP/1.1
Host: tokenrent.io
Content-Type: application/json

{
"payment_reference": "pay_t0ken_123_1705312200_abc",
"transaction_id": "a1b2c3d4e5f6g7h8...",
"amount": "0.0001",
"from_address": "1RenterAddressAbc..."
}
```

#### Step 6: Success Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
Payment-Verified: true
Access-Token: access_1705312200_xyz

{
"status": "verified",
"access_token": "access_1705312200_xyz",
"expires_in": 1800,
"rental_details": {
"pickup_location": {
"lat": 37.7749,
"lng": -122.4194,
"address": "123 Market St, San Francisco, CA"
},
"access_code": "CAMERA2024",
"owner_contact": "encrypted_contact_info",
"special_instructions": "Equipment is in blue case"
}
}
```

## Security Measures

### Transaction Verification

```typescript
async function verifyPayment(txid: string, expectedAmount: number): Promise<boolean> {
// 1. Fetch transaction from BSV network
const tx = await overlayService.getTransaction(txid);

// 2. Verify transaction exists and is confirmed
if (!tx || tx.confirmations < 1) {
return false;
}

// 3. Verify payment amount
const outputAmount = decodePaymentAmount(tx.outputs);
if (outputAmount < expectedAmount) {
return false;
}

// 4. Verify recipient address
const recipient = extractRecipient(tx.outputs);
if (recipient !== expectedOwnerAddress) {
return false;
}

return true;
}
```

### Anti-Fraud Measures

| Measure | Description |
|---------|-------------|
| **Amount Validation** | Exact payment amount required |
| **Reference Uniqueness** | One-time use payment references |
| **Timestamp Validation** | References expire after 5 minutes |
| **Rate Limiting** | Max 50 payment requests per minute per IP |
| **Replay Protection** | Transaction IDs can only be used once |
| **Double-Spend Detection** | Integration with BSV network monitoring |

### Access Token Management

```typescript
interface AccessToken {
token: string;
assetId: string;
payerKey: string;
createdAt: Date;
expiresAt: Date; // 30 minutes after creation
txid: string;
}
```

Access tokens:
- Expire after 30 minutes
- Are bound to specific asset IDs
- Cannot be transferred between users
- Are invalidated after single use (optional)

## Implementation Details

### Server-Side Handler

```typescript
// /api/payment/initiate.ts
export async function handleHTTP402(assetId: string): Promise<HTTP402Response> {
const asset = await RentalAsset.findOne({ tokenId: assetId });

if (!asset) {
throw new NotFoundError('Asset not found');
}

// Generate payment reference
const reference = `pay_${assetId}_${Date.now()}_${randomString(6)}`;

// Store payment request
await PaymentRequest.create({
reference,
assetId,
amount: asset.unlockFee,
ownerAddress: asset.ownerKey,
expiresAt: new Date(Date.now() + 5 * 60 * 1000),
status: 'pending'
});

return {
statusCode: 402,
headers: {
'Accept-Payment': 'BSV',
'Payment-Amount': asset.unlockFee.toString(),
'Payment-Address': asset.ownerKey,
'Payment-Reference': reference
},
body: {
error: 'Payment required',
payment: {
currency: 'BSV',
amount: asset.unlockFee,
address: asset.ownerKey,
reference,
expiresIn: 300
}
}
};
}
```

### Client-Side Handler

```typescript
// components/HTTP402Modal.tsx
async function handlePayment() {
// 1. Get payment details from 402 response
const paymentDetails = await initiatePayment(assetId);

// 2. Create BSV transaction via wallet
const tx = await babbageSDK.createAction({
description: `HTTP 402 payment for ${assetName}`,
outputs: [{
satoshis: Math.ceil(paymentDetails.amount * 100000000),
script: createPaymentScript(paymentDetails.address),
basket: 'HTTP 402 Payments'
}]
});

// 3. Submit for verification
const result = await verifyPayment({
reference: paymentDetails.reference,
txid: tx.txid,
amount: paymentDetails.amount
});

// 4. Return rental details
return result.rentalDetails;
}
```

## Economic Model

### Pricing Guidelines

| Asset Category | Suggested Unlock Fee |
|----------------|---------------------|
| Photography Equipment | 0.0001 - 0.0005 BSV |
| Tools & Equipment | 0.00005 - 0.0002 BSV |
| Vehicles | 0.0005 - 0.001 BSV |
| Electronics | 0.0001 - 0.0003 BSV |
| Sports Equipment | 0.00005 - 0.0001 BSV |

### Revenue Distribution

```
Unlock Fee → 100% to Asset Owner

Example:
- 100 detail views per week
- 0.0001 BSV per view
- Owner earns: 0.01 BSV/week (~$0.50 at $50/BSV)
```

## Best Practices

### For Asset Owners

1. **Set Reasonable Fees**: Balance spam prevention with accessibility
2. **Keep Details Updated**: Ensure unlocked information is accurate
3. **Respond Promptly**: Users paid to see your details - be available
4. **Provide Value**: Include all necessary pickup/access information

### For Platform Developers

1. **Cache Verification Results**: Avoid repeated blockchain queries
2. **Handle Network Delays**: BSV transactions may take seconds to propagate
3. **Implement Fallbacks**: Handle overlay service downtime gracefully
4. **Log All Transactions**: Maintain audit trail for disputes

### For Renters

1. **Verify Before Paying**: Check asset details visible without payment
2. **Save Access Tokens**: Don't let tokens expire unused
3. **Report Issues**: Contact support if details are inaccurate

## Error Handling

| Error | HTTP Code | Resolution |
|-------|-----------|------------|
| Payment expired | 400 | Initiate new payment request |
| Invalid amount | 422 | Verify exact amount sent |
| Transaction not found | 404 | Wait for network propagation |
| Already paid | 200 | Return cached access token |
| Asset not found | 404 | Verify asset ID |
| Rate limited | 429 | Wait and retry |

## Testing

### Mock Mode

For development and testing without real BSV:

```typescript
// .env
MOCK_PAYMENTS=true
```

Mock mode:
- Accepts any transaction ID
- Skips blockchain verification
- Returns test rental details
- Still enforces flow logic

### Test Vectors

```typescript
// Valid payment reference format
const validRef = 'pay_t0ken_123_1705312200_abc123';

// Valid transaction ID format
const validTxid = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';

// Minimum unlock fee
const minFee = 0.00001; // BSV
```

## Future Enhancements

1. **Streaming Payments**: Continuous micropayments for extended access
2. **Subscription Model**: Monthly unlimited access option
3. **Refund Protocol**: Automatic refund if details are invalid
4. **Multi-Currency**: Support for BSV-based stablecoins
5. **Lightning-style Channels**: Pre-funded payment channels for frequent users
