import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Message from './components/Message.jsx';
import MessageInput from './components/MessageInput.jsx';
import LimitBanner from './components/LimitBanner.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useChats, getAnonSessionId } from './hooks/useChats.js';
import { sendChatMessage } from './utils/api.js';

export default function App() {
  const { user, loading: authLoading, login, logout, getIdToken } = useAuth();
  const {
    chats,
    activeChat,
    selectChat,
    newChat,
    deleteChat,
    addMessage,
  } = useChats();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [limitError, setLimitError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshLimitInfo = useCallback(async () => {
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      else headers['X-Anon-Id'] = getAnonSessionId();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'status' }),
      });
      if (res.ok) {
        const data = await res.json();
        setLimitInfo({ used: data.used, limit: data.limit });
      }
    } catch {
      /* ignore */
    }
  }, [getIdToken]);

  useEffect(() => {
    if (!authLoading) refreshLimitInfo();
  }, [authLoading, user, refreshLimitInfo]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setLimitError(null);
    setIsLoading(true);

    const history = [...(activeChat?.messages ?? []), { role: 'user', content: text }];
    addMessage('user', text);

    try {
      const token = await getIdToken();
      const data = await sendChatMessage({
        messages: history.map(({ role, content }) => ({ role, content })),
        token,
        anonId: token ? null : getAnonSessionId(),
      });

      addMessage('assistant', data.reply);
      if (data.used !== undefined) {
        setLimitInfo({ used: data.used, limit: data.limit });
      }
    } catch (err) {
      setLimitError(err);
      if (err.remaining !== undefined) {
        setLimitInfo({ used: err.limit - err.remaining, limit: err.limit });
      } else if (err.limit !== undefined) {
        setLimitInfo({ used: err.limit, limit: err.limit });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await login();
      setLimitError(null);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-chat-bg">
        <div className="flex gap-1">
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
        </div>
      </div>
    );
  }

  const messages = activeChat?.messages || [];

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar
        chats={chats}
        activeChatId={activeChat?.id}
        onSelect={selectChat}
        onNew={newChat}
        onDelete={deleteChat}
        user={user}
        onLogin={handleLogin}
        onLogout={logout}
        limitInfo={limitInfo}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-chat-bg">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-chat-border md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-chat-input"
            aria-label="Меню"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-medium truncate">AI Chat</h1>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !limitError && (
            <div className="h-full flex items-center justify-center px-4">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-semibold mb-2">Чем могу помочь?</h2>
                <p className="text-gray-400 text-sm">
                  Бесплатный AI-ассистент на базе nex-agi/nex-n2-pro.
                  {!user && ' Без входа — 5 сообщений в день, с Google — 15.'}
                </p>
              </div>
            </div>
          )}

          <LimitBanner error={limitError} onLogin={handleLogin} />

          {messages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} />
          ))}

          {isLoading && <Message role="assistant" content="" isTyping />}
        </div>

        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading || (limitError?.code === 'AUTH_LIMIT')}
          placeholder={
            limitError?.code === 'ANON_LIMIT'
              ? 'Войдите, чтобы продолжить…'
              : limitError?.code === 'AUTH_LIMIT'
                ? 'Лимит на сегодня исчерпан'
                : 'Напишите сообщение…'
          }
        />
      </main>
    </div>
  );
}
