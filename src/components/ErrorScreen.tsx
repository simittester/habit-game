import { useState } from 'react';
import { tg } from '../lib/telegram';

interface Props { message: string; diagnostic?: ReturnType<typeof tg.diagnostic> }

export function ErrorScreen({ message, diagnostic }: Props) {
  const [showDiag, setShowDiag] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center fade-in">
      <div className="text-4xl">🤔</div>
      <h2 className="text-lg font-semibold">Can't sign you in</h2>
      <p className="text-sm text-hint max-w-xs">{message}</p>
      <button
        onClick={() => location.reload()}
        className="mt-2 px-5 py-2 rounded-full bg-accent text-white text-sm font-medium"
      >
        Try again
      </button>
      <button
        onClick={() => setShowDiag((v) => !v)}
        className="text-[11px] text-hint underline"
      >
        {showDiag ? 'Hide diagnostics' : 'Show diagnostics'}
      </button>
      {showDiag && diagnostic && (
        <pre className="text-[10px] text-left bg-bg-2 p-3 rounded-xl max-w-[300px] w-full overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(diagnostic, null, 2)}
        </pre>
      )}
    </div>
  );
}
