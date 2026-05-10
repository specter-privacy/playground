export const SNIPPETS = {
  'full-flow': `// Full end-to-end flow: recipient setup → sender payment → recipient scan
await initSpecterSdk();

// 1. Recipient generates identity keys
const recipient = generateSpecterKeys();
console.log('Spending PK:', recipient.spending.publicKey.slice(0, 40) + '...');
console.log('Viewing  PK:', recipient.viewing.publicKey.slice(0, 40) + '...');

// 2. Build a meta-address to publish
const meta = metaAddressFromPublicKeys(
  recipient.spending.publicKey,
  recipient.viewing.publicKey,
  { description: 'Alice playground' }
);
console.log('Meta-address size:', meta.bytes.length, 'bytes');

// 3. Sender creates a stealth payment (only needs the meta-address hex)
const payment = createStealthPayment(meta.hex);
console.log('\\nETH stealth address:', payment.ethAddress);
console.log('Sui stealth address:', payment.suiAddress);
console.log('View tag:', payment.viewTag);

// 4. Recipient scans the announcement
const result = scanAnnouncement(
  { ephemeralCiphertext: payment.ephemeralCiphertext, viewTag: payment.viewTag },
  recipient.viewing,
  recipient.spending.publicKey
);
console.log('\\nisMatch:', result.isMatch);
if (result.isMatch) {
  console.log('Stealth ETH address:', result.stealthKeys.ethAddress);
  console.log('Stealth Sui address:', result.stealthKeys.suiAddress);
  console.log('ethPrivateKey: [redacted by SDK]');
}`,

  keygen: `await initSpecterSdk();

// Single ML-KEM-768 keypair
const kp = generateKeysLocal();
console.log('Public key:', kp.publicKey.slice(0, 60) + '...');
console.log('Expected size:', KYBER_PUBLIC_KEY_SIZE, 'bytes');

// Full identity (spending + viewing keypairs)
const keys = generateSpecterKeys();
console.log('\\nSpending PK:', keys.spending.publicKey.slice(0, 40) + '...');
console.log('Viewing  PK:', keys.viewing.publicKey.slice(0, 40) + '...');
console.log('\\nSecret keys are redacted in JSON:');
console.log(JSON.stringify(keys.spending));`,

  meta: `await initSpecterSdk();

const keys = generateSpecterKeys();

const meta = metaAddressFromPublicKeys(
  keys.spending.publicKey,
  keys.viewing.publicKey,
  { description: 'My wallet', createdAt: Math.floor(Date.now() / 1000) }
);

console.log('Meta hex (first 80):', meta.hex.slice(0, 80) + '...');
console.log('Total size:', meta.bytes.length, 'bytes');
console.log('Protocol version:', meta.address.version);

// Round-trip: parse it back
const parsed = parseMetaAddress(meta.hex);
console.log('\\nSpending PK matches:', parsed.address.spendingPk === keys.spending.publicKey);
console.log('Viewing  PK matches:', parsed.address.viewingPk === keys.viewing.publicKey);`,

  payment: `await initSpecterSdk();

const recipient = generateSpecterKeys();
const meta = metaAddressFromPublicKeys(
  recipient.spending.publicKey,
  recipient.viewing.publicKey
);

const payment = createStealthPayment(meta.hex);
console.log('ETH stealth address:', payment.ethAddress);
console.log('Sui stealth address:', payment.suiAddress);
console.log('View tag (1 byte):', payment.viewTag);
console.log('Ciphertext bytes:', payment.ephemeralCiphertext.length / 2);
console.log('Expected:', KYBER_CIPHERTEXT_SIZE, 'bytes');`,

  scan: `await initSpecterSdk();

const recipient = generateSpecterKeys();
const meta = metaAddressFromPublicKeys(
  recipient.spending.publicKey,
  recipient.viewing.publicKey
);
const payment = createStealthPayment(meta.hex);

// Single scan
const result = scanAnnouncement(
  { ephemeralCiphertext: payment.ephemeralCiphertext, viewTag: payment.viewTag },
  recipient.viewing,
  recipient.spending.publicKey
);
console.log('isMatch:', result.isMatch);
if (result.isMatch) {
  console.log('ETH:', result.stealthKeys.ethAddress);
  console.log('Sui:', result.stealthKeys.suiAddress);
}

// Batch: 5 noise payments + 1 ours
const noise = Array.from({ length: 5 }, () => {
  const tmp = generateSpecterKeys();
  const tmpMeta = metaAddressFromPublicKeys(tmp.spending.publicKey, tmp.viewing.publicKey);
  return createStealthPayment(tmpMeta.hex);
});
const batch = [...noise, payment];
const batchResults = scanAnnouncements(batch, recipient.viewing, recipient.spending.publicKey);
const matches = batchResults.filter(r => r.isMatch);
console.log('\\nBatch:', matches.length, 'match(es) in', batch.length, 'announcements');`,

  'low-level': `await initSpecterSdk();

const recipient = generateSpecterKeys();

// Encapsulate to viewing public key (sender side)
const enc = encapsulate(recipient.viewing.publicKey);
console.log('Ciphertext:', enc.ciphertext.slice(0, 40) + '...');

// Decapsulate (recipient side)
const sharedSecret = decapsulate(enc.ciphertext, recipient.viewing.secretKey);
console.log('Decapsulation OK:', typeof sharedSecret === 'string');

// View tag
const tag = computeViewTag(sharedSecret);
console.log('View tag:', tag);
console.log('View tag verified:', verifyViewTag(sharedSecret, tag));

// Derive stealth addresses
const ethAddr = deriveStealthAddress(recipient.spending.publicKey, sharedSecret);
const suiAddr = deriveStealthSuiAddress(recipient.spending.publicKey, sharedSecret);
console.log('\\nETH stealth address:', ethAddr);
console.log('Sui stealth address:', suiAddr);

const keys = deriveStealthKeys(recipient.spending.publicKey, sharedSecret);
console.log('secp256k1 pubkey:', keys.publicKey.slice(0, 40) + '...');`,

  blank: `await initSpecterSdk();

// Write your code here.
// All SDK functions are available as globals — no imports needed.
`,
};
