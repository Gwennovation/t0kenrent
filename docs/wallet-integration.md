# T0kenRent Wallet Integration Guide

> **Team ChibiTech** | BSV Hackathon 2025

This guide explains how to connect your BSV wallet to T0kenRent for testing and development.

## Table of Contents

1. [Overview](#overview)
2. [Compatible Wallets](#compatible-wallets)
3. [Using BSV Desktop Wallet with T0kenRent](#using-bsv-desktop-wallet-with-t0kenrent)
4. [BabbageBridge Setup](#babbagebridge-setup)
5. [Identity & Certificates](#identity--certificates)
6. [Troubleshooting](#troubleshooting)

---

## Overview

T0kenRent uses the **Babbage SDK** (BRC-100 WalletInterface) for:
- 🔐 User authentication via wallet signatures
- 💰 MNEE token payments for rental access
- 📝 On-chain data storage and transactions
- 🎫 Identity certificates and attestations

### What is BRC-100?

BRC-100 is a standard interface for BSV wallets that enables:
- Consistent key derivation across applications
- Protocol-based permissions (apps request specific capabilities)
- Secure signing and encryption
- Identity management and certificates

---

## Compatible Wallets

### ✅ Natively Compatible

| Wallet | Platform | Status |
|--------|----------|--------|
| **MetaNet Client** | Windows, macOS, Linux | ✅ Full Support |
| **Metanet Mobile** | iOS, Android | ✅ Full Support |

**Download:** [projectbabbage.com](https://projectbabbage.com)

### ❌ Not Directly Compatible

These wallets don't implement BRC-100 natively:

| Wallet | Workaround |
|--------|------------|
| ElectrumSV | Use BabbageBridge (see below) |
| HandCash | Export keys → BabbageBridge |
| Centbee | Export keys → BabbageBridge |
| Simply Cash | Export keys → BabbageBridge |
| Exodus BSV | Export keys → BabbageBridge |
| RelayX | Not supported |

---

## Using BSV Desktop Wallet with T0kenRent

If you have an existing BSV wallet (ElectrumSV, etc.), you can bridge it to work with T0kenRent using our **BabbageBridge** tool.

### Step 1: Export Your Private Key

#### From ElectrumSV:
1. Open ElectrumSV
2. Go to **Wallet** → **Private Keys** → **Export**
3. Enter your password
4. Copy the WIF private key (starts with `K`, `L`, or `5`)

#### From Exodus:
1. Open Exodus Desktop
2. Go to **Settings** → **Security** → **View Private Keys**
3. Select Bitcoin SV
4. Copy the WIF private key

#### From Centbee/SimplyCash:
1. Check the app's backup/export feature
2. Export your 12/24 word seed phrase
3. Use our mnemonic tool to derive the WIF key

### Step 2: Import into BabbageBridge

```bash
# Navigate to T0kenRent directory
cd /path/to/t0kenrent

# Run the wallet bridge tool
node scripts/wallet-bridge.js
```

Select **Option 1: Import WIF private key** and paste your key.

#### Alternative: API Import

```bash
# Import via API (development only)
curl -X POST http://localhost:3000/api/bridge/identity \
  -H "Content-Type: application/json" \
  -d '{"wif": "YOUR_WIF_PRIVATE_KEY"}'
```

### Step 3: Verify Identity

```bash
node scripts/wallet-bridge.js --view
```

You should see:
```json
{
  "id": "810a68535a51...",
  "publicKey": "04813250da3d...",
  "source": "bsv-desktop-import",
  "createdAt": "2025-11-30T..."
}
```

---

## BabbageBridge Setup

BabbageBridge is a compatibility layer that implements the Babbage SDK interface using your imported keys.

### How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your BSV      │────▶│  BabbageBridge  │────▶│    T0kenRent    │
│ Desktop Wallet  │     │  (BRC-100 API)  │     │   Application   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Private Key         Implements SDK         Calls getPublicKey,
     (WIF/Hex)          Interface              createAction, etc.
```

### Architecture

```typescript
// BabbageBridge implements these Babbage SDK methods:
interface BRC100Wallet {
  isAuthenticated(): Promise<boolean>
  waitForAuthentication(): Promise<boolean>
  getPublicKey(options): Promise<string>
  createAction(options): Promise<CreateActionResult>
  createSignature(options): Promise<string>
  encrypt(options): Promise<string>
  decrypt(options): Promise<string>
}
```

### Configuration

The bridge reads from `Config/babbage-identity.json`:

```json
{
  "id": "your-identity-hash",
  "publicKey": "04...",
  "privateKey": "...",
  "source": "bsv-desktop-import",
  "brc100": {
    "version": "1.0",
    "protocols": ["Pay MNEE", "messagebox", "tm_supplychain"]
  }
}
```

### Enabling in Browser

The bridge is automatically loaded in development mode. For manual injection:

```typescript
import { injectBabbageBridge } from '@/lib/babbage-bridge'

// Load your identity
const identity = await fetch('/api/bridge/identity').then(r => r.json())

// Inject bridge
injectBabbageBridge({
  privateKey: identity.privateKey,
  publicKey: identity.publicKey,
  identityId: identity.id
})

// Now window.Babbage is available
const pubKey = await window.Babbage.getPublicKey({
  protocolID: [2, 'Pay MNEE'],
  keyID: '1'
})
```

---

## Identity & Certificates

### BRC-100 Identity

Your identity in the Babbage ecosystem is derived from your public key:

```
Identity ID = SHA256(Public Key)
```

This is deterministic - the same private key always produces the same identity.

### Linking Old Address to New Identity

If you need to prove ownership of your old BSV address:

#### Option A: Signed Message Attestation

Create an on-chain attestation linking your old address to your new BRC-100 identity:

```javascript
const attestation = {
  type: 'identity-link',
  oldAddress: '1ABC...', // Your BSV Desktop address
  newIdentityId: '810a68...', // BRC-100 identity
  message: 'I attest this identity is mine',
  signature: '...' // Signed with old address private key
}

// Broadcast as OP_RETURN transaction
```

#### Option B: Spend-Linking

Spend a small amount from your old address to prove control:

```
Old Address → Small TX → New Identity Address
```

### Trust Certificates (BRC-53)

T0kenRent uses certificates for:
- **Identity verification** - Prove you are who you claim
- **Permission grants** - Allow access to rental data
- **Ownership proofs** - Verify asset ownership

Certificate structure:
```json
{
  "type": "t0kenrent-certificate",
  "certifier": "certifier-public-key",
  "subject": "your-identity-id",
  "fields": {
    "Name": "encrypted-name",
    "Email": "encrypted-email",
    "Verified": true
  },
  "signature": "..."
}
```

---

## Testing Without a Wallet

### Mock Mode

Enable mock mode to test without any wallet:

```bash
# Set in .env
MOCK_PAYMENTS=true
MOCK_WALLET=true
```

Or via environment:

```bash
MOCK_WALLET=true npm run dev
```

Mock mode simulates:
- Wallet authentication
- Key generation
- Transaction creation (returns mock TXIDs)
- Payment verification

### Test Identity

A test identity is pre-generated in development:

```bash
cat Config/babbage-identity.json
```

---

## Troubleshooting

### "No wallet detected"

1. Ensure MetaNet Client is running, OR
2. Import your BSV Desktop key with `node scripts/wallet-bridge.js`
3. Check that `Config/babbage-identity.json` exists

### "Authentication failed"

1. Verify your private key is correct
2. Check the console for detailed errors
3. Try regenerating identity: `node scripts/wallet-bridge.js` → Option 3

### "Transaction failed"

1. Ensure you have BSV/MNEE tokens for fees
2. Check network connectivity to overlay service
3. Verify the transaction format is correct

### "Certificate not found"

1. Certificates must be issued by a recognized certifier
2. For testing, self-signed certificates can be used
3. Check `protocolPermissions` in the manifest

### WIF Key Issues

If WIF conversion fails:

```bash
# Install BSV SDK
npm install @bsv/sdk

# Or use hex key directly
node scripts/wallet-bridge.js --import-hex YOUR_HEX_PRIVATE_KEY
```

---

## Security Best Practices

⚠️ **CRITICAL**: Never share your private key!

1. **Development Only**: The bridge exposes private keys - never use in production
2. **Test Keys**: Use testnet keys or generate new keys for testing
3. **Secure Storage**: Config files have 0600 permissions
4. **Clear After Testing**: Delete `Config/babbage-identity.json` when done

---

## Resources

- [Babbage Documentation](https://docs.projectbabbage.com)
- [BRC-100 Specification](https://hub.bsvblockchain.org/brc/wallet/0100)
- [BSV Wallet Toolbox](https://github.com/bsv-blockchain/wallet-toolbox)
- [Mnemonic to BRC-100 Tool](https://mnemonic-brc100.vercel.app/)
- [T0kenRent Whitepaper](./T0kenRent-Whitepaper-v1.0.pdf)

---

## Quick Reference

| Task | Command |
|------|---------|
| Import WIF key | `node scripts/wallet-bridge.js` → Option 1 |
| View identity | `node scripts/wallet-bridge.js --view` |
| Export for MetaNet | `node scripts/wallet-bridge.js` → Option 5 |
| Enable mock mode | `MOCK_WALLET=true npm run dev` |
| Test API | `curl http://localhost:3000/api/bridge/identity` |

---

*Team ChibiTech - BSV Hackathon 2025*
