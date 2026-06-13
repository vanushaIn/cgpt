export default function Sidebar({
  chats,
  activeChatId,
  onSelect,
  onNew,
  onDelete,
  user,
  onLogin,
  onLogout,
  limitInfo,
  sidebarOpen,
  onClose,
}) {
  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-chat-sidebar flex flex-col border-r border-chat-border transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3 border-b border-chat-border">
          <button
            type="button"
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-chat-border hover:bg-chat-input transition text-sm"
          >
            <span className="text-lg leading-none">+</span>
            Новый чат
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center rounded-lg ${
                chat.id === activeChatId ? 'bg-chat-input' : 'hover:bg-chat-input/60'
              }`}
            >
              <button
                type="button"
                onClick={() => { onSelect(chat.id); onClose?.(); }}
                className="flex-1 text-left px-3 py-2.5 text-sm truncate"
              >
                {chat.title}
              </button>
              {chats.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDelete(chat.id)}
                  className="opacity-0 group-hover:opacity-100 px-2 py-1 text-chat-border hover:text-white text-xs"
                  aria-label="Удалить чат"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-chat-border space-y-2">
          {limitInfo && (
            <p className="text-xs text-gray-400 px-1">
              Сообщений сегодня: {limitInfo.used}/{limitInfo.limit}
            </p>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-gray-400 hover:text-white px-2 py-1"
              >
                Выйти
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Войти через Google
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
