function formatContent(text) {
  const safe = typeof text === 'string' ? text : String(text ?? '');
  const lines = safe.split('\n');
  return lines.map((line, i) => (
    <span key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </span>
  ));
}

export default function Message({ role, content, isTyping }) {
  const isUser = role === 'user';

  return (
    <div className={`py-6 ${isUser ? 'bg-chat-bg' : 'bg-chat-bot'}`}>
      <div className="max-w-3xl mx-auto px-4 flex gap-4">
        <div
          className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 text-sm font-medium ${
            isUser ? 'bg-green-600' : 'bg-purple-600'
          }`}
        >
          {isUser ? 'Вы' : 'AI'}
        </div>
        <div className="flex-1 pt-0.5 text-[15px] leading-7 text-gray-100 whitespace-pre-wrap break-words">
          {isTyping ? (
            <div className="flex gap-1 py-2">
              <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          ) : (
            formatContent(content)
          )}
        </div>
      </div>
    </div>
  );
}
