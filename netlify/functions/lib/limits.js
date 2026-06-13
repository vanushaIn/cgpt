const { getDb } = require('./firebase-admin');

const ANON_LIMIT = 5;
const AUTH_LIMIT = 15;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function needsReset(lastResetDate) {
  return lastResetDate !== todayKey();
}

async function getAnonStatus(ip, anonId) {
  const db = getDb();
  const docId = `${ip}_${anonId || 'default'}`.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ref = db.collection('anonymous_limits').doc(docId);
  const snap = await ref.get();
  const today = todayKey();

  let count = 0;
  if (snap.exists) {
    const data = snap.data();
    count = data.lastResetDate === today ? (data.dailyMessageCount || 0) : 0;
  }

  return {
    used: count,
    limit: ANON_LIMIT,
    remaining: Math.max(0, ANON_LIMIT - count),
    allowed: count < ANON_LIMIT,
    ref,
    today,
  };
}

async function incrementAnon(ref, today) {
  const snap = await ref.get();
  let count = 0;
  if (snap.exists && snap.data().lastResetDate === today) {
    count = snap.data().dailyMessageCount || 0;
  }
  await ref.set({
    dailyMessageCount: count + 1,
    lastResetDate: today,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  return count + 1;
}

async function getUserStatus(uid) {
  const db = getDb();
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  const today = todayKey();

  if (!snap.exists) {
    return { used: 0, limit: AUTH_LIMIT, remaining: AUTH_LIMIT, allowed: true, ref, today, isNew: true };
  }

  const data = snap.data();
  const count = needsReset(data.lastResetDate) ? 0 : (data.dailyMessageCount || 0);

  return {
    used: count,
    limit: AUTH_LIMIT,
    remaining: Math.max(0, AUTH_LIMIT - count),
    allowed: count < AUTH_LIMIT,
    ref,
    today,
    isNew: false,
    data,
  };
}

async function incrementUser(ref, today, uid, email, displayName, isNew, existingData) {
  let count = 0;
  if (!isNew && existingData?.lastResetDate === today) {
    count = existingData.dailyMessageCount || 0;
  }

  await ref.set({
    email: email || existingData?.email || '',
    displayName: displayName || existingData?.displayName || '',
    dailyMessageCount: count + 1,
    lastResetDate: today,
    updatedAt: new Date().toISOString(),
    createdAt: existingData?.createdAt || new Date().toISOString(),
  }, { merge: true });

  return count + 1;
}

module.exports = {
  ANON_LIMIT,
  AUTH_LIMIT,
  getAnonStatus,
  incrementAnon,
  getUserStatus,
  incrementUser,
};
