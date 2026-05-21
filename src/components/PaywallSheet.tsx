import { useEffect, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { Sheet } from './Sheet';
import { subscribePaywall } from '../lib/paywall';
import { useSubscription } from '../hooks/useSubscription';
import { tg } from '../lib/telegram';

type Tier = 'week' | 'month' | 'year';

interface PlanCfg {
  tier: Tier;
  label: string;
  priceLine: string;
  perDay: string;
  badge?: string;
  highlight?: boolean;
}

const PLANS: PlanCfg[] = [
  {
    tier: 'year',
    label: '12 months',
    priceLine: '$59.99 / year',
    perDay: '$0.16 / day',
    badge: 'Best value',
    highlight: true,
  },
  {
    tier: 'month',
    label: '1 month',
    priceLine: '$9.99 / month',
    perDay: '$0.33 / day',
  },
  {
    tier: 'week',
    label: 'Try for $1',
    priceLine: '$1 / first week, then $9.99 / month',
    perDay: 'Cancel any time',
  },
];

const VALUE_PROPS = [
  { emoji: '🔥', text: 'Unlimited habits with milestone confetti & streak heatmap' },
  { emoji: '🎯', text: 'Projects + linked tasks with progress that fills as you finish' },
  { emoji: '🌙', text: 'Evening shutdown & weekly review rituals built in' },
  { emoji: '📈', text: 'Full progress history, BMI / body / money tracking' },
  { emoji: '🛡️', text: 'Your data stays yours — encrypted, owned by you' },
];

export function PaywallSheet() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Tier>('year');
  const sub = useSubscription();

  useEffect(() => {
    return subscribePaywall(() => setOpen(true));
  }, []);

  const blocking = sub.status === 'expired';

  return (
    <Sheet
      open={open}
      onClose={() => { if (!blocking) setOpen(false); }}
      title="Unlock Momentum"
      fullHeight
    >
      <div className="relative">
        {!blocking && (
          <button
            onClick={() => { tg.haptic('light'); setOpen(false); }}
            className="absolute right-0 top-0 w-9 h-9 rounded-full bg-bg-3 flex items-center justify-center active:opacity-70"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}

        <div className="text-center pt-1">
          <div className="text-5xl mb-2">🔥</div>
          <h2 className="text-[24px] font-bold leading-tight">
            {blocking ? 'Trial ended — pick a plan' : 'Get the full Momentum'}
          </h2>
          <p className="text-[13px] text-hint mt-1 max-w-[280px] mx-auto">
            {blocking
              ? 'Your data is safe. Pick a plan to keep editing and adding.'
              : 'Build the days you actually want. Cancel any time.'}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {VALUE_PROPS.map((v) => (
            <div key={v.text} className="flex items-start gap-3">
              <div className="text-base shrink-0">{v.emoji}</div>
              <div className="text-[13px] leading-snug">{v.text}</div>
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          {PLANS.map((p) => (
            <PlanCard
              key={p.tier}
              cfg={p}
              selected={picked === p.tier}
              onSelect={() => { tg.selection(); setPicked(p.tier); }}
            />
          ))}
        </div>

        <button
          onClick={() => {
            tg.haptic('medium');
            tg.showAlert(
              `Selected: ${picked}\n\nPayments aren't wired yet — coming soon via Telegram Stars.`,
            );
          }}
          className="mt-5 w-full py-4 rounded-full bg-accent text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {picked === 'week' ? 'Start $1 week' : `Start ${picked === 'year' ? '12 months' : '1 month'}`}
          <Sparkles size={18} />
        </button>

        <button
          onClick={() => { tg.haptic('light'); tg.showAlert('No subscription to restore yet.'); }}
          className="w-full py-3 mt-1 text-hint text-[13px] active:opacity-60"
        >
          Restore purchase
        </button>

        <div className="text-[10px] text-hint text-center mt-4 leading-snug">
          Subscriptions auto-renew until cancelled. Manage in Telegram payments or message
          <span className="text-accent"> @momentumcore_bot</span> to cancel.
          By subscribing you agree to our <a href="/legal/terms.html" target="_blank" rel="noopener noreferrer" className="text-accent">Terms</a> and <a href="/legal/privacy.html" target="_blank" rel="noopener noreferrer" className="text-accent">Privacy Policy</a>.
        </div>
      </div>
    </Sheet>
  );
}

function PlanCard({ cfg, selected, onSelect }: { cfg: PlanCfg; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`relative w-full flex items-center gap-3 p-4 rounded-2xl text-left transition active:scale-[0.99] ${
        selected ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-2 ring-1 ring-divider'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
          selected ? 'bg-accent border-accent' : 'border-white/25'
        }`}
      >
        {selected && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[15px] font-semibold">{cfg.label}</div>
          {cfg.badge && (
            <span className="text-[10px] font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{cfg.badge}</span>
          )}
        </div>
        <div className="text-[12px] text-hint mt-0.5">{cfg.priceLine}</div>
      </div>
      <div className="text-[11px] text-hint shrink-0 text-right">{cfg.perDay}</div>
    </button>
  );
}
