# AI Chat — бесплатный ChatGPT-клон

Одностраничное веб-приложение с интерфейсом чата в стиле ChatGPT. AI работает через **OpenRouter** (модель `nex-agi/nex-n2-pro:free`). Оплата отключена — всё бесплатно.

## Возможности

- Тёмный интерфейс в стиле ChatGPT
- История чатов в `localStorage`
- Бесплатный AI через OpenRouter
- Лимиты: **5 сообщений/день** без входа, **15 сообщений/день** с Google-аккаунтом
- Вход через Google (Firebase Auth)
- Netlify Functions скрывают API-ключи

## Стек

| Компонент | Технология |
|-----------|------------|
| Фронтенд | React + Vite + Tailwind CSS |
| Хостинг | Netlify |
| AI | OpenRouter (`nex-agi/nex-n2-pro:free`) |
| Auth | Firebase Auth (Google) |
| Лимиты | Cloud Firestore |
| Аналитика | GA4 + Hotjar (опционально) |

## Быстрый старт

### 1. Установка

```bash
cd ai-chat
npm install
cd netlify/functions && npm install && cd ../..
```

### 2. Переменные окружения

Скопируйте `.env.example` → `.env` и заполните Firebase-конфиг для клиента.

Для Netlify Functions (локально — файл `.env` в корне, на Netlify — Dashboard → Environment variables):

```env
OPENROUTER_API_KEY=sk-or-v1-...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Firebase

1. Создайте проект на [console.firebase.google.com](https://console.firebase.google.com)
2. Включите **Authentication → Google**
3. Создайте **Firestore Database**
4. Скачайте service account key (Project Settings → Service accounts → Generate new private key) для Netlify Functions
5. Добавьте веб-приложение и скопируйте конфиг в `.env`

### 4. OpenRouter

1. Зарегистрируйтесь на [openrouter.ai](https://openrouter.ai)
2. Создайте API-ключ
3. Добавьте `OPENROUTER_API_KEY` в переменные окружения

### 5. Локальная разработка

```bash
npm install -g netlify-cli
netlify dev
```

Откройте `http://localhost:8888`

> Без Firebase-переменных лимиты работают в памяти (только для теста).

### 6. Деплой на Netlify

1. Загрузите репозиторий на GitHub
2. Подключите к [Netlify](https://app.netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Добавьте переменные окружения из п.2
6. Деплой

## Структура Firestore

**users** (авторизованные):
```
uid → { email, displayName, dailyMessageCount, lastResetDate, createdAt }
```

**anonymous_limits** (анонимы по IP):
```
ip_anonId → { dailyMessageCount, lastResetDate }
```

## API

`POST /api/chat`

```json
{ "messages": [{ "role": "user", "content": "Привет" }] }
```

Заголовки:
- `Authorization: Bearer <firebase-id-token>` — для авторизованных
- `X-Anon-Id: <session-id>` — для анонимов

Статус лимита:
```json
{ "action": "status" }
```

## Лицензия

MIT
