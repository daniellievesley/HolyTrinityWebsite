// set-claim.mjs
import admin from 'firebase-admin';
import fs from 'node:fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node set-claim.mjs <uid>');
  process.exit(1);
}

await admin.auth().setCustomUserClaims(uid, { publisher: true });
console.log(`Set publisher claim for ${uid}`);