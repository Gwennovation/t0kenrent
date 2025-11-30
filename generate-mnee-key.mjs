import { PrivateKey } from '@bsv/sdk';

function generateMneeKey() {
  // Generate random private key
  const privateKey = PrivateKey.fromRandom();
  const publicKey = privateKey.toPublicKey();

  console.log('---- MNEE KEYPAIR ----');
  console.log('Private key (WIF, KEEP THIS SECRET):');
  console.log(privateKey.toWif());
  console.log('');
  console.log('Public key (use this in MNEE_ISSUER_KEY):');
  console.log(publicKey.toString()); // compressed hex (02... or 03...)
}

generateMneeKey();
