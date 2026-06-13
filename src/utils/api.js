const API_URL = '/api/chat';

export async function sendChatMessage({ messages, token, anonId }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (anonId) headers['X-Anon-Id'] = anonId;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
  });

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    if (raw.includes('<!DOCTYPE') || raw.includes('<html')) {
      throw new Error('API недоступен. Запустите netlify dev вместо npm run dev');
    }
    throw new Error('Сервер вернул некорректный ответ');
  }

  if (!response.ok) {
    const error = new Error(data.error || 'Ошибка запроса');
    error.status = response.status;
    error.code = data.code;
    error.remaining = data.remaining;
    error.limit = data.limit;
    throw error;
  }

  return data;
}
