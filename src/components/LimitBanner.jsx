export default function LimitBanner({ error, onLogin }) {
  if (!error) return null;

  const isAnonLimit = error.code === 'ANON_LIMIT';
  const isAuthLimit = error.code === 'AUTH_LIMIT';

  return (
    <div className="mx-auto mt-4 max-w-3xl px-4 rounded-xl border border-amber-600/40 bg-amber-900/20 py-4 text-sm">
      <p className="font-medium text-amber-200 mb-1">
        {isAnonLimit && 'Дневной лимит исчерпан'}
        {isAuthLimit && 'Лимит на сегодня исчерпан'}
        {!isAnonLimit && !isAuthLimit && 'Не удалось отправить сообщение'}
      </p>
      <p className="text-gray-300">
        {isAnonLimit && (
          <>
            Без входа доступно 5 сообщений в сутки.{' '}
            <button type="button" onClick={onLogin} className="text-amber-300 underline hover:text-amber-200">
              Войдите через Google
            </button>
            {' '}для 15 сообщений в день.
          </>
        )}
        {isAuthLimit && 'Вы использовали все 15 бесплатных сообщений на сегодня. Лимит сбросится через 24 часа.'}
        {!isAnonLimit && !isAuthLimit && (error.message || 'Попробуйте позже.')}
      </p>
    </div>
  );
}
