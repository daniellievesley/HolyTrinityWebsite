import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'node:fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node set-claim.mjs <uid>');
  process.exit(1);
}

await getAuth().setCustomUserClaims(uid, { publisher: true });
console.log(`Set publisher claim for ${uid}`);
