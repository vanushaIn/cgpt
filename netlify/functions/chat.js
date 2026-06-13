const { getAuth } = require('./lib/firebase-admin');
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

function getHeader(event, name) {
  const h = event.headers || {};
  const lower = name.toLowerCase();
  return h[lower] ?? h[name] ?? '';
}

function getClientIp(event) {
  return (
    getHeader(event, 'x-nf-client-connection-ip')
    || getHeader(event, 'client-ip')
    || getHeader(event, 'x-forwarded-for').split(',')[0]?.trim()
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

function extractTextContent(content) {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text' && part.text) return part.text;
        if (part?.text) return part.text;
        return '';
      })
      .join('')
      .trim();
  }
  return '';
}

function extractReply(data) {
  const message = data?.choices?.[0]?.message;
  if (!message) return '';

  const fromContent = extractTextContent(message.content);
  if (fromContent) return fromContent;

  const fromReasoning = extractTextContent(message.reasoning);
  if (fromReasoning) return fromReasoning;

  if (typeof message.reasoning_details === 'string') {
    return message.reasoning_details.trim();
  }

  if (Array.isArray(message.reasoning_details)) {
    return message.reasoning_details
      .map((item) => extractTextContent(item?.text ?? item?.content ?? item))
      .join('')
      .trim();
  }

  return extractTextContent(data?.choices?.[0]?.text);
}

async function callOpenRouter(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const safeMessages = (messages || [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  if (safeMessages.length === 0) {
    throw new Error('No valid messages to send');
  }

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
        ...safeMessages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid OpenRouter response: ${raw.slice(0, 200)}`);
  }

  if (!response.ok) {
    const msg = data?.error?.message || `OpenRouter error ${response.status}`;
    throw new Error(msg);
  }

  const reply = extractReply(data);
  if (!reply) {
    console.error('Unexpected OpenRouter payload:', JSON.stringify(data).slice(0, 500));
    throw new Error('Empty response from AI');
  }

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

  const authHeader = getHeader(event, 'authorization');
  const decoded = await verifyToken(authHeader);
  const ip = getClientIp(event);
  const anonId = getHeader(event, 'x-anon-id');

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
