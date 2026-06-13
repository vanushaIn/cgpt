const { getAuth, isFirebaseConfigured } = require('./lib/firebase-admin');
const {
  getAnonStatus,
  incrementAnon,
  getUserStatus,
  incrementUser,
} = require('./lib/limits-wrapper');

const MODEL = 'nex-agi/nex-n2-pro:free';
const SYSTEM_PROMPT = 'Ты полезный ассистент. Отвечай на русском языке, если пользователь пишет по-русски. Будь кратким и точным.';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Anon-Id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function getClientIp(event) {
  return (
    event.headers['x-nf-client-connection-ip']
    || event.headers['client-ip']
    || event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || 'unknown'
  );
}

async function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

async function callOpenRouter(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.URL || process.env.SITE_URL || 'https://localhost',
      'X-Title': 'AI Chat',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || `OpenRouter error ${response.status}`;
    throw new Error(msg);
  }

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error('Empty response from AI');
  return reply;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const decoded = await verifyToken(event.headers.authorization || event.headers.Authorization);
  const ip = getClientIp(event);
  const anonId = event.headers['x-anon-id'] || event.headers['X-Anon-Id'] || '';

  // Status check (no message sent)
  if (body.action === 'status') {
    if (decoded) {
      const status = await getUserStatus(decoded.uid);
      return json(200, { used: status.used, limit: status.limit, remaining: status.remaining });
    }
    const status = await getAnonStatus(ip, anonId);
    return json(200, { used: status.used, limit: status.limit, remaining: status.remaining });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json(400, { error: 'messages array required' });
  }

  try {
    let used;
    let limit;

    if (decoded) {
      const status = await getUserStatus(decoded.uid);
      if (!status.allowed) {
        return json(429, {
          error: 'Дневной лимит исчерпан',
          code: 'AUTH_LIMIT',
          used: status.used,
          limit: status.limit,
          remaining: 0,
        });
      }

      const reply = await callOpenRouter(messages);
      used = await incrementUser(status, decoded);
      limit = status.limit;

      return json(200, { reply, used, limit, remaining: limit - used });
    }

    const status = await getAnonStatus(ip, anonId);
    if (!status.allowed) {
      return json(429, {
        error: 'Дневной лимит исчерпан. Войдите через Google для 15 сообщений.',
        code: 'ANON_LIMIT',
        used: status.used,
        limit: status.limit,
        remaining: 0,
      });
    }

    const reply = await callOpenRouter(messages);
    used = await incrementAnon(status);
    limit = status.limit;

    return json(200, { reply, used, limit, remaining: limit - used });
  } catch (err) {
    console.error('Chat error:', err);
    return json(500, { error: err.message || 'Internal server error' });
  }
};
