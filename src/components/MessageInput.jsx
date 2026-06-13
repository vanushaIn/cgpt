export default function MessageInput({ value, onChange, onSend, disabled, placeholder }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-chat-border bg-chat-bg p-4">
      <div className="max-w-3xl mx-auto relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none rounded-xl bg-chat-input border border-chat-border px-4 py-3 pr-12 text-[15px] text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 disabled:opacity-50 max-h-48"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="absolute right-2 bottom-2 p-2 rounded-lg bg-white text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition"
          aria-label="Отправить"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">
        AI может ошибаться. Проверяйте важную информацию.
      </p>
    </div>
  );
}
