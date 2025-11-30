const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const cfgDir = path.join(repoRoot, 'Config');
const frontendPublic = path.join(repoRoot, 'frontend', 'public');

if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir, { recursive: true });
if (!fs.existsSync(frontendPublic)) fs.mkdirSync(frontendPublic, { recursive: true });

const identityPath = path.join(cfgDir, 'babbage-identity.json');
const manifestPath = path.join(cfgDir, 'babbage-portal.json');
const frontendManifestPath = path.join(frontendPublic, 'portal-manifest.json');

// default to cicada-api (localhost)
const substrateArg = (process.argv[2] || 'cicada-api').toLowerCase();
const force = process.argv.includes('--force');

if ((fs.existsSync(identityPath) || fs.existsSync(manifestPath)) && !force) {
  console.log('Identity or manifest already exists. Use --force to overwrite.');
  process.exit(0);
}

// create or reuse identity
let identity;
if (fs.existsSync(identityPath) && !force) {
  identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
} else {
  const ecdh = crypto.createECDH('secp256k1');
  ecdh.generateKeys();
  const privateKeyHex = ecdh.getPrivateKey('hex');
  const publicKeyHex = ecdh.getPublicKey('hex');
  const id = crypto.createHash('sha256').update(Buffer.from(publicKeyHex, 'hex')).digest('hex');

  identity = {
    id,
    publicKey: publicKeyHex,
    privateKey: privateKeyHex,
    createdAt: new Date().toISOString(),
    note: 'Local dev identity — do NOT use in production'
  };

  fs.writeFileSync(identityPath, JSON.stringify(identity, null, 2), { mode: 0o600 });
}

// substrate-specific template
function substrateTemplate(substrate, id, pubKey) {
  const base = {
    portalId: `metanet-${id.slice(0, 12)}`,
    substrate,
    displayName: 'T0kenRent MetaNet Portal (dev)',
    identityId: id,
    identityPubKey: pubKey,
    createdAt: new Date().toISOString(),
    version: '0.1.0',
    permissions: ['read', 'write', 'sign'] // example/can be tuned
  };

  if (substrate === 'babbage-xdm') {
    base.xdm = {
      targetOrigin: 'https://babbage.example', // replace with real origin
      frameId: 't0kenrent-babbage-xdm',
      allowedMessages: ['init', 'sign', 'broadcast']
    };
  } else if (substrate === 'cicada-api') {
    base.cicada = {
      endpoint: 'http://localhost:8080', // local cicada endpoint for this project
      tenant: 't0kenrent-dev',
      auth: { type: 'none' } // placeholder — update for real auth
    };
  } else {
    // window-api default
    base.windowApi = {
      hint: 'Uses window.Babbage or window.Cicada APIs when available',
      allowedOrigins: ['http://localhost:3000']
    };
  }
  return base;
}

const manifest = substrateTemplate(substrateArg, identity.id, identity.publicKey);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.copyFileSync(manifestPath, frontendManifestPath);

console.log('Identity saved:', identityPath);
console.log('Portal manifest written:', manifestPath);
console.log('Copied to frontend public:', frontendManifestPath);
console.log('Substrate:', substrateArg);
console.log('\nUsage:');
console.log('  node scripts/init-metanet-portal.js babbage-xdm     # create babbage-xdm manifest');
console.log('  node scripts/init-metanet-portal.js cicada-api     # create cicada-api manifest');
console.log('  node scripts/init-metanet-portal.js window-api     # default');
console.log('  add --force to overwrite existing files');