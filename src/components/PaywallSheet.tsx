import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, ExternalLink } from 'lucide-react';
import { Sheet } from './Sheet';
import { subscribePaywall } from '../lib/paywall';
import { useSubscription } from '../hooks/useSubscription';
import { getCachedProfile } from '../lib/auth';
import { tg } from '../lib/telegram';

type Tier = 'month' | 'year';

interface PlanCfg {
  tier: Tier;
  label: string;
  priceLine: string;
  perDay: string;
  badge?: string;
}

const PLANS: PlanCfg[] = [
  {
    tier: 'year',
    label: 'Annual',
    priceLine: '$59.99 / year',
    perDay: '$0.16 / day',
    badge: 'Save 50%',
  },
  {
    tier: 'month',
    label: 'Monthly',
    priceLine: '$9.99 / month',
    perDay: '$0.33 / day',
  },
];

const VALUE_PROPS = [
  { emoji: '🔥', text: 'Unlimited habits with milestone confetti & streak heatmap' },
  { emoji: '🎯', text: 'Projects + linked tasks with progress that fills as you finish' },
  { emoji: '🌙', text: 'Evening shutdown & weekly review rituals built in' },
  { emoji: '📈', text: 'Full progress history, BMI / body / money tracking' },
  { emoji: '🛡️', text: 'Your data stays yours — encrypted, owned by you' },
];

const GUMROAD_BASE = 'https://getmomentum.gumroad.com/l/momentum';

function buildCheckoutUrl(tier: Tier, telegramId: number): string {
  const params = new URLSearchParams({
    wanted: 'true',
    recurrence: tier === 'year' ? 'yearly' : 'monthly',
    telegram_id: String(telegramId),
  });
  return `${GUMROAD_BASE}?${params.toString()}`;
}

export function PaywallSheet() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Tier>('year');
  const [pollingAfterCheckout, setPollingAfterCheckout] = useState(false);
  const sub = useSubscription();
  const qc = useQueryClient();

  useEffect(() => {
    return subscribePaywall(() => setOpen(true));
  }, []);

  // Poll subscription status for 90s after user is sent to Gumroad
  useEffect(() => {
    if (!pollingAfterCheckout) return;
    const started = Date.now();
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      if (Date.now() - started > 90_000) {
        setPollingAfterCheckout(false);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingAfterCheckout, qc]);

  // Auto-close + celebrate when subscription becomes active
  useEffect(() => {
    if (sub.status === 'active' && pollingAfterCheckout) {
      tg.notify('success');
      setPollingAfterCheckout(false);
      setOpen(false);
    }
  }, [sub.status, pollingAfterCheckout]);

  const handleSubscribe = () => {
    const profile = getCachedProfile();
    if (!profile?.telegram_id) {
      tg.showAlert("Couldn't find your Telegram ID. Try closing and reopening the app.");
      return;
    }
    tg.haptic('medium');
    const url = buildCheckoutUrl(picked, profile.telegram_id);
    const w = tg.webApp();
    if (w && typeof (w as unknown as { openLink?: (u: string) => void }).openLink === 'function') {
      (w as unknown as { openLink: (u: string) => void }).openLink(url);
    } else {
      window.open(url, '_blank');
    }
    setPollingAfterCheckout(true);
  };

  // Even when trial is expired, allow dismissal so users can browse their data.
  // Mutations stay blocked via useGate (they'd re-open this sheet on tap).
  const isExpired = sub.status === 'expired';

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="Unlock Momentum"
      fullHeight
    >
      <div className="relative">
        <button
          onClick={() => { tg.haptic('light'); setOpen(false); }}
          className="absolute right-0 top-0 w-9 h-9 rounded-full bg-bg-3 flex items-center justify-center active:opacity-70"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="text-center pt-1">
          <div className="text-5xl mb-2">🔥</div>
          <h2 className="text-[24px] font-bold leading-tight">
            {isExpired ? 'Trial ended — pick a plan' : 'Get the full Momentum'}
          </h2>
          <p className="text-[13px] text-hint mt-1 max-w-[280px] mx-auto">
            {isExpired
              ? 'Your data is safe. Browse any time — pick a plan to keep adding.'
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

        {pollingAfterCheckout ? (
          <div className="mt-5 w-full py-4 rounded-full bg-bg-3 text-text font-semibold text-center flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-divider border-t-accent spin" />
            Waiting for payment confirmation…
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            className="mt-5 w-full py-4 rounded-full bg-accent text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
          >
            Continue to checkout <ExternalLink size={16} />
          </button>
        )}

        <div className="text-[10px] text-hint text-center mt-3 leading-snug">
          You'll be sent to a secure Gumroad page to complete payment. Then come back to Momentum — your subscription unlocks automatically.
        </div>

        <button
          onClick={() => {
            tg.haptic('light');
            qc.invalidateQueries({ queryKey: ['settings'] });
            tg.showAlert('Refreshing your subscription status…');
          }}
          className="w-full py-3 mt-2 text-hint text-[13px] active:opacity-60"
        >
          I just paid — refresh status
        </button>

        <div className="text-[10px] text-hint text-center mt-4 leading-snug">
          Subscriptions auto-renew until cancelled. Cancel any time at <span className="text-accent">getmomentum.gumroad.com/library</span> or message <span className="text-accent">@momentumcore_bot</span>.
          By subscribing you agree to our <a href="/legal/terms.html" target="_blank" rel="noopener noreferrer" className="text-accent">Terms</a> and <a href="/legal/privacy.html" target="_blank" rel="noopener noreferrer" className="text-accent">Privacy Policy</a>.
        </div>

        <div className="h-8" />
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
