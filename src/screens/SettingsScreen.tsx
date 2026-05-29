import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LogOut, Check } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { getSettings, upsertSettings } from '../api/settings';
import { signOut } from '../lib/auth';
import { tg } from '../lib/telegram';
import type { Profile } from '../lib/auth';

interface Props { profile: Profile }

const CURRENCIES = ['USD', 'EUR', 'GBP', 'RUB', 'JPY', 'TRY', 'KZT', 'AZN'];
const WEEK_STARTS: Array<{ v: number; label: string }> = [
  { v: 0, label: 'Sunday' },
  { v: 1, label: 'Monday' },
];

export default function SettingsScreen({ profile }: Props) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [water, setWater] = useState(8);
  const [sleepTarget, setSleepTarget] = useState(8);
  const [currency, setCurrency] = useState('USD');
  const [startOfWeek, setStartOfWeek] = useState(1);
  const [focusCount, setFocusCount] = useState(3);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (q.data) {
      setWater(q.data.water_daily_target);
      setSleepTarget(q.data.sleep_target_hours ? Number(q.data.sleep_target_hours) : 8);
      setCurrency(q.data.currency);
      setStartOfWeek(q.data.start_of_week);
      setFocusCount(q.data.daily_focus_count);
    }
  }, [q.data]);

  const saveM = useMutation({
    mutationFn: () => upsertSettings({
      water_daily_target: water,
      sleep_target_hours: sleepTarget,
      currency,
      start_of_week: startOfWeek,
      daily_focus_count: focusCount,
    }),
    onSuccess: () => {
      tg.notify('success');
      qc.invalidateQueries({ queryKey: ['settings'] });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    },
  });

  // Detect unsaved changes
  const dirty = Boolean(q.data) && (
    q.data!.water_daily_target !== water ||
    Number(q.data!.sleep_target_hours ?? 8) !== sleepTarget ||
    q.data!.currency !== currency ||
    q.data!.start_of_week !== startOfWeek ||
    q.data!.daily_focus_count !== focusCount
  );

  const showButton = dirty || saveM.isPending || justSaved;
  const buttonLabel = saveM.isPending ? 'Saving…' : justSaved ? 'Saved' : 'Save changes';
  const buttonClass = justSaved
    ? 'bg-green-500/15 text-green-400'
    : 'bg-accent text-white';

  return (
    <div className="pb-6">
      <Section title="">
        <h1 className="text-[28px] font-bold leading-tight mt-2">Settings</h1>
        <div className="text-[14px] text-hint">Tune the app to fit your life.</div>
      </Section>

      <Section title="Account">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-xl font-bold">
              {(profile.first_name?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{profile.first_name ?? ''} {profile.last_name ?? ''}</div>
              {profile.username && <div className="text-[12px] text-accent">@{profile.username}</div>}
              <div className="text-[11px] text-hint">Telegram ID: {profile.telegram_id}</div>
            </div>
          </div>
          <div className="h-px bg-divider my-3" />
          <button
            onClick={async () => {
              const ok = await tg.showConfirm('Sign out? Your data stays safe — you can sign back in by reopening the mini app.');
              if (!ok) return;
              signOut();
              location.reload();
            }}
            className="w-full flex items-center justify-center gap-2 text-red-400 text-[14px] font-medium py-2 active:opacity-60"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </Card>
      </Section>

      <Section title="Health targets">
        <Card>
          <Row label="Daily water target" hint={`${water} glasses`}>
            <Stepper value={water} min={1} max={20} onChange={setWater} />
          </Row>
          <div className="h-px bg-divider my-2" />
          <Row label="Nightly sleep target" hint={`${sleepTarget.toFixed(1)} hours`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { tg.haptic('light'); setSleepTarget((v) => Math.max(4, +(v - 0.5).toFixed(1))); }}
                className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center"
              >−</button>
              <div className="w-10 text-center font-semibold tabular-nums">{sleepTarget.toFixed(1)}</div>
              <button
                onClick={() => { tg.haptic('light'); setSleepTarget((v) => Math.min(12, +(v + 0.5).toFixed(1))); }}
                className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center"
              >+</button>
            </div>
          </Row>
        </Card>
      </Section>

      <Section title="Money">
        <Card>
          <Row label="Currency" hint="Used for expense logging">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-bg-3 rounded-xl px-3 py-2 text-sm outline-none"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Row>
        </Card>
      </Section>

      <Section title="Week">
        <Card>
          <Row label="Start of week" hint="Affects weekly review">
            <div className="flex gap-2">
              {WEEK_STARTS.map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setStartOfWeek(v)}
                  className={`px-3 py-1.5 rounded-full text-[13px] ${startOfWeek === v ? 'bg-accent text-white' : 'bg-bg-3'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Row>
          <div className="h-px bg-divider my-2" />
          <Row label="Daily priorities" hint="How many tasks count as 'Top'">
            <Stepper value={focusCount} min={1} max={10} onChange={setFocusCount} />
          </Row>
        </Card>
      </Section>

      {showButton && (
        <div className="px-4 mt-2">
          <button
            onClick={() => saveM.mutate()}
            disabled={saveM.isPending || justSaved}
            className={`w-full py-3.5 rounded-full font-semibold transition flex items-center justify-center gap-2 ${buttonClass}`}
          >
            {justSaved && <Check size={18} strokeWidth={3} />}
            {buttonLabel}
          </button>
        </div>
      )}

      <Section title="Legal">
        <Card>
          <a
            href="/legal/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-2.5 text-[14px] active:opacity-60"
          >
            <span>Privacy policy</span>
            <span className="text-hint">↗</span>
          </a>
          <div className="h-px bg-divider" />
          <a
            href="/legal/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-2.5 text-[14px] active:opacity-60"
          >
            <span>Terms of service</span>
            <span className="text-hint">↗</span>
          </a>
        </Card>
      </Section>

      <div className="px-4 pt-2 text-[11px] text-hint text-center">
        Momentum · made for you
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-1">
        <div className="text-[15px]">{label}</div>
        {hint && <div className="text-[11px] text-hint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => { tg.haptic('light'); onChange(Math.max(min, value - 1)); }}
        className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center"
      >−</button>
      <div className="w-8 text-center font-semibold tabular-nums">{value}</div>
      <button
        onClick={() => { tg.haptic('light'); onChange(Math.min(max, value + 1)); }}
        className="w-8 h-8 rounded-full bg-bg-3 flex items-center justify-center"
      >+</button>
    </div>
  );
}
