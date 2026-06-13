const admin = require('firebase-admin');

let db = null;

function isFirebaseConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY,
  );
}

function getDb() {
  if (!isFirebaseConfigured()) return null;
  if (db) return db;

  if (!admin.apps.length) {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  db = admin.firestore();
  return db;
}

function getAuth() {
  if (!isFirebaseConfigured()) {
    return {
      verifyIdToken: async () => { throw new Error('Firebase not configured'); },
    };
  }
  if (!admin.apps.length) getDb();
  return admin.auth();
}

module.exports = { getDb, getAuth, admin, isFirebaseConfigured };
