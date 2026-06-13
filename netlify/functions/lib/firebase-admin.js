const admin = require('firebase-admin');

let db = null;
let initFailed = false;

function parsePrivateKey() {
  let key = process.env.FIREBASE_PRIVATE_KEY || '';
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

function isFirebaseConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY,
  );
}

function initializeFirebase() {
  if (db) return true;
  if (initFailed) return false;
  if (!isFirebaseConfigured()) return false;

  try {
    if (!admin.apps || admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: parsePrivateKey(),
        }),
      });
    }
    db = admin.firestore();
    return true;
  } catch (err) {
    console.error('Firebase init failed:', err.message);
    initFailed = true;
    return false;
  }
}

function getDb() {
  return initializeFirebase() ? db : null;
}

function getAuth() {
  if (!initializeFirebase()) {
    return {
      verifyIdToken: async () => {
        throw new Error('Firebase not configured');
      },
    };
  }
  return admin.auth();
}

module.exports = { getDb, getAuth, admin, isFirebaseConfigured, initializeFirebase };
