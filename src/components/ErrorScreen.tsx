import { useState } from 'react';
import { tg } from '../lib/telegram';

interface Props { message: string; diagnostic?: ReturnType<typeof tg.diagnostic> }

export function ErrorScreen({ message, diagnostic }: Props) {
  const [showDiag, setShowDiag] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = JSON.stringify({ message, ...diagnostic }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center fade-in overflow-y-auto py-6">
      <div className="text-4xl">🤔</div>
      <h2 className="text-lg font-semibold">Can't sign you in</h2>
      <p className="text-xs text-hint max-w-xs break-all">{message}</p>
      <div className="flex gap-2">
        <button
          onClick={() => location.reload()}
          className="px-5 py-2 rounded-full bg-accent text-white text-sm font-medium"
        >
          Try again
        </button>
        <button onClick={copy} className="px-5 py-2 rounded-full bg-bg-3 text-text text-sm font-medium">
          {copied ? 'Copied ✓' : 'Copy debug'}
        </button>
      </div>
      <button
        onClick={() => setShowDiag((v) => !v)}
        className="text-[11px] text-hint underline"
      >
        {showDiag ? 'Hide diagnostics' : 'Show diagnostics'}
      </button>
      {showDiag && diagnostic && (
        <pre className="text-[9px] text-left bg-bg-2 p-3 rounded-xl max-w-[320px] w-full overflow-x-auto whitespace-pre-wrap break-all">
{JSON.stringify(diagnostic, null, 2)}
        </pre>
      )}
    </div>
  );
}
