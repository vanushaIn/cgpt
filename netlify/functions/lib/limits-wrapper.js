const memoryStore = new Map();

const ANON_LIMIT = 5;
const AUTH_LIMIT = 15;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function memoryGet(key, today) {
  const entry = memoryStore.get(key);
  if (!entry || entry.lastResetDate !== today) return 0;
  return entry.count || 0;
}

function memorySet(key, count, today) {
  memoryStore.set(key, { count, lastResetDate: today });
  return count;
}

function isFirebaseConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY,
  );
}

let firestoreLimits = null;

function getFirestoreLimits() {
  if (!firestoreLimits) {
    firestoreLimits = require('./limits');
  }
  return firestoreLimits;
}

async function getAnonStatus(ip, anonId) {
  const today = todayKey();
  const key = `anon:${ip}_${anonId || 'default'}`;

  if (!isFirebaseConfigured()) {
    const used = memoryGet(key, today);
    return {
      used,
      limit: ANON_LIMIT,
      remaining: Math.max(0, ANON_LIMIT - used),
      allowed: used < ANON_LIMIT,
      memoryKey: key,
      today,
      mode: 'memory',
    };
  }

  return { ...await getFirestoreLimits().getAnonStatus(ip, anonId), mode: 'firestore' };
}

async function incrementAnon(status) {
  if (status.mode === 'memory') {
    const used = memoryGet(status.memoryKey, status.today) + 1;
    return memorySet(status.memoryKey, used, status.today);
  }
  return getFirestoreLimits().incrementAnon(status.ref, status.today);
}

async function getUserStatus(uid) {
  const today = todayKey();
  const key = `user:${uid}`;

  if (!isFirebaseConfigured()) {
    const used = memoryGet(key, today);
    return {
      used,
      limit: AUTH_LIMIT,
      remaining: Math.max(0, AUTH_LIMIT - used),
      allowed: used < AUTH_LIMIT,
      memoryKey: key,
      today,
      mode: 'memory',
      uid,
    };
  }

  return { ...await getFirestoreLimits().getUserStatus(uid), mode: 'firestore' };
}

async function incrementUser(status, decoded) {
  if (status.mode === 'memory') {
    const used = memoryGet(status.memoryKey, status.today) + 1;
    return memorySet(status.memoryKey, used, status.today);
  }
  return getFirestoreLimits().incrementUser(
    status.ref,
    status.today,
    decoded.uid,
    decoded.email,
    decoded.name,
    status.isNew,
    status.data,
  );
}

module.exports = {
  ANON_LIMIT,
  AUTH_LIMIT,
  isFirebaseConfigured,
  getAnonStatus,
  incrementAnon,
  getUserStatus,
  incrementUser,
};
