/**
 * BSV Desktop Wallet to BRC-100 Bridge
 * 
 * This script allows you to import your existing BSV Desktop wallet
 * private key and create a BRC-100 compatible identity for T0kenRent.
 * 
 * Team: ChibiTech
 * Project: T0kenRent - BSV Hackathon 2025
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// BSV SDK for key handling
let bsvSdk;
try {
  bsvSdk = require('@bsv/sdk');
} catch (e) {
  console.log('Note: @bsv/sdk not installed. Install with: npm install @bsv/sdk');
}

const CONFIG_DIR = path.join(__dirname, '..', 'Config');
const IDENTITY_FILE = path.join(CONFIG_DIR, 'babbage-identity.json');
const WALLET_BRIDGE_FILE = path.join(CONFIG_DIR, 'wallet-bridge.json');

/**
 * Convert WIF (Wallet Import Format) private key to hex
 */
function wifToHex(wif) {
  if (!bsvSdk) {
    throw new Error('@bsv/sdk required for WIF conversion. Run: npm install @bsv/sdk');
  }
  
  const { PrivateKey } = bsvSdk;
  const privateKey = PrivateKey.fromWif(wif);
  return privateKey.toString();
}

/**
 * Derive public key from private key hex
 */
function derivePublicKey(privateKeyHex) {
  if (bsvSdk) {
    const { PrivateKey } = bsvSdk;
    const privateKey = PrivateKey.fromString(privateKeyHex);
    return privateKey.toPublicKey().toString();
  }
  
  // Fallback using Node.js crypto
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.setPrivateKey(Buffer.from(privateKeyHex, 'hex'));
  return ecdh.getPublicKey('hex');
}

/**
 * Create BRC-100 compatible identity from private key
 */
function createBRC100Identity(privateKeyHex, metadata = {}) {
  const publicKeyHex = derivePublicKey(privateKeyHex);
  const identityHash = crypto.createHash('sha256')
    .update(Buffer.from(publicKeyHex, 'hex'))
    .digest('hex');
  
  return {
    id: identityHash,
    publicKey: publicKeyHex,
    privateKey: privateKeyHex,
    createdAt: new Date().toISOString(),
    source: 'bsv-desktop-import',
    metadata: {
      ...metadata,
      importedAt: new Date().toISOString(),
      team: 'ChibiTech',
      project: 'T0kenRent'
    },
    brc100: {
      version: '1.0',
      keyDerivation: 'direct-import',
      protocols: ['Pay MNEE', 'messagebox', 'tm_supplychain']
    },
    note: 'Imported from BSV Desktop wallet for T0kenRent testing'
  };
}

/**
 * Create attestation for linking old address to new identity
 */
function createAttestation(oldAddress, newIdentityId, privateKeyHex) {
  const message = `I, owner of ${oldAddress}, attest that identity ${newIdentityId} is my T0kenRent identity. Timestamp: ${Date.now()}`;
  
  // Create signature (simplified - in production use proper BSV signing)
  const messageHash = crypto.createHash('sha256').update(message).digest();
  const sign = crypto.createSign('SHA256');
  
  // Note: This is a demonstration. Real BSV signatures need proper ECDSA
  const attestation = {
    type: 'identity-attestation',
    version: '1.0',
    oldAddress,
    newIdentityId,
    message,
    messageHash: messageHash.toString('hex'),
    timestamp: new Date().toISOString(),
    // signature would go here with proper BSV signing
  };
  
  return attestation;
}

/**
 * Interactive wallet bridge setup
 */
async function interactiveSetup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     T0kenRent - BSV Desktop Wallet Bridge Setup           ║');
  console.log('║                    Team ChibiTech                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('This tool will help you bridge your BSV Desktop wallet');
  console.log('to create a BRC-100 compatible identity for T0kenRent.\n');

  console.log('Options:');
  console.log('  1. Import WIF private key from BSV Desktop wallet');
  console.log('  2. Import hex private key');
  console.log('  3. Generate new identity (keep existing)');
  console.log('  4. View current identity');
  console.log('  5. Export identity for MetaNet Client import');
  console.log('  0. Exit\n');

  const choice = await question('Select option (0-5): ');

  switch (choice) {
    case '1':
      console.log('\n⚠️  WARNING: Never share your private key!');
      console.log('This is processed locally and never transmitted.\n');
      
      const wif = await question('Enter WIF private key: ');
      try {
        const privateKeyHex = wifToHex(wif.trim());
        const identity = createBRC100Identity(privateKeyHex, { importType: 'wif' });
        
        // Save to config
        if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
        fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2), { mode: 0o600 });
        
        console.log('\n✅ Identity created successfully!');
        console.log(`   Identity ID: ${identity.id.substring(0, 16)}...`);
        console.log(`   Public Key: ${identity.publicKey.substring(0, 16)}...`);
        console.log(`   Saved to: ${IDENTITY_FILE}`);
      } catch (err) {
        console.error('\n❌ Error:', err.message);
      }
      break;

    case '2':
      console.log('\n⚠️  WARNING: Never share your private key!\n');
      const hexKey = await question('Enter hex private key: ');
      try {
        const identity = createBRC100Identity(hexKey.trim(), { importType: 'hex' });
        
        if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
        fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2), { mode: 0o600 });
        
        console.log('\n✅ Identity created successfully!');
        console.log(`   Identity ID: ${identity.id.substring(0, 16)}...`);
      } catch (err) {
        console.error('\n❌ Error:', err.message);
      }
      break;

    case '3':
      // Generate new identity
      const ecdh = crypto.createECDH('secp256k1');
      ecdh.generateKeys();
      const newIdentity = createBRC100Identity(ecdh.getPrivateKey('hex'), { importType: 'generated' });
      
      if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
      fs.writeFileSync(IDENTITY_FILE, JSON.stringify(newIdentity, null, 2), { mode: 0o600 });
      
      console.log('\n✅ New identity generated!');
      console.log(`   Identity ID: ${newIdentity.id.substring(0, 16)}...`);
      console.log(`   Public Key: ${newIdentity.publicKey.substring(0, 16)}...`);
      break;

    case '4':
      if (fs.existsSync(IDENTITY_FILE)) {
        const current = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'));
        console.log('\n📋 Current Identity:');
        console.log(`   ID: ${current.id}`);
        console.log(`   Public Key: ${current.publicKey}`);
        console.log(`   Created: ${current.createdAt}`);
        console.log(`   Source: ${current.source || 'unknown'}`);
        if (current.metadata) {
          console.log(`   Team: ${current.metadata.team || 'N/A'}`);
        }
      } else {
        console.log('\n⚠️  No identity found. Create one first.');
      }
      break;

    case '5':
      if (fs.existsSync(IDENTITY_FILE)) {
        const identity = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'));
        
        // Create export format compatible with MetaNet Client
        const exportData = {
          version: '1.0',
          type: 'brc100-identity-export',
          identity: {
            id: identity.id,
            publicKey: identity.publicKey,
            // Note: privateKey excluded for security - user must have it separately
          },
          protocols: identity.brc100?.protocols || [],
          exportedAt: new Date().toISOString(),
          instructions: [
            '1. Open MetaNet Client',
            '2. Go to Settings > Import Identity',
            '3. Use this identity ID with your private key',
            '4. Verify the public key matches'
          ]
        };
        
        const exportFile = path.join(CONFIG_DIR, 'identity-export.json');
        fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
        console.log(`\n✅ Export saved to: ${exportFile}`);
        console.log('\n📋 Export Data:');
        console.log(JSON.stringify(exportData, null, 2));
      } else {
        console.log('\n⚠️  No identity to export.');
      }
      break;

    case '0':
      console.log('\nGoodbye! 👋\n');
      break;

    default:
      console.log('\nInvalid option.');
  }

  rl.close();
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
T0kenRent Wallet Bridge - Team ChibiTech

Usage:
  node wallet-bridge.js                    Interactive mode
  node wallet-bridge.js --import-wif <WIF> Import WIF private key
  node wallet-bridge.js --import-hex <HEX> Import hex private key  
  node wallet-bridge.js --view             View current identity
  node wallet-bridge.js --export           Export for MetaNet Client

Examples:
  node wallet-bridge.js --import-wif L1aW4aubDFB7yfras2S1mN...
  node wallet-bridge.js --view
`);
    return;
  }

  if (args.includes('--import-wif')) {
    const idx = args.indexOf('--import-wif');
    const wif = args[idx + 1];
    if (!wif) {
      console.error('Error: WIF key required');
      process.exit(1);
    }
    const privateKeyHex = wifToHex(wif);
    const identity = createBRC100Identity(privateKeyHex, { importType: 'wif-cli' });
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2), { mode: 0o600 });
    console.log('✅ Identity imported:', identity.id.substring(0, 16) + '...');
    return;
  }

  if (args.includes('--import-hex')) {
    const idx = args.indexOf('--import-hex');
    const hex = args[idx + 1];
    if (!hex) {
      console.error('Error: Hex key required');
      process.exit(1);
    }
    const identity = createBRC100Identity(hex, { importType: 'hex-cli' });
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2), { mode: 0o600 });
    console.log('✅ Identity imported:', identity.id.substring(0, 16) + '...');
    return;
  }

  if (args.includes('--view')) {
    if (fs.existsSync(IDENTITY_FILE)) {
      const identity = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'));
      console.log(JSON.stringify(identity, null, 2));
    } else {
      console.log('No identity found');
    }
    return;
  }

  if (args.includes('--export')) {
    if (fs.existsSync(IDENTITY_FILE)) {
      const identity = JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf8'));
      console.log(JSON.stringify({
        id: identity.id,
        publicKey: identity.publicKey,
        protocols: identity.brc100?.protocols || []
      }, null, 2));
    } else {
      console.log('No identity to export');
    }
    return;
  }

  // Default: interactive mode
  await interactiveSetup();
}

main().catch(console.error);
