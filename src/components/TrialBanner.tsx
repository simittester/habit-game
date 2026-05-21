import { useSubscription } from '../hooks/useSubscription';
import { openPaywall } from '../lib/paywall';
import { tg } from '../lib/telegram';
import { Sparkles } from 'lucide-react';

export function TrialBanner() {
  const sub = useSubscription();
  if (sub.status === 'loading' || sub.status === 'active') return null;

  const handle = () => { tg.haptic('medium'); openPaywall(); };

  if (sub.status === 'trial') {
    const urgent = sub.trialDaysLeft <= 1;
    return (
      <button
        onClick={handle}
        className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left active:opacity-80 transition border-b border-divider ${urgent ? 'bg-amber-500/10' : 'bg-accent/10'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={14} className={urgent ? 'text-amber-300' : 'text-accent'} />
          <div className="text-[12px] truncate">
            <span className={`font-semibold ${urgent ? 'text-amber-300' : 'text-accent'}`}>
              {sub.trialDaysLeft} {sub.trialDaysLeft === 1 ? 'day' : 'days'} left
            </span>
            <span className="text-hint"> in your free trial</span>
          </div>
        </div>
        <div className={`text-[12px] font-semibold shrink-0 ${urgent ? 'text-amber-300' : 'text-accent'}`}>Upgrade →</div>
      </button>
    );
  }

  // status === 'expired'
  return (
    <button
      onClick={handle}
      className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left active:opacity-80 transition bg-red-500/10 border-b border-divider"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles size={14} className="text-red-400" />
        <div className="text-[12px] truncate">
          <span className="font-semibold text-red-400">Trial ended.</span>
          <span className="text-hint"> Upgrade to keep editing.</span>
        </div>
      </div>
      <div className="text-[12px] font-semibold text-red-400 shrink-0">Upgrade →</div>
    </button>
  );
}
