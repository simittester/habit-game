import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Section } from '../components/Card';
import { GlobalAddButton } from '../components/AddSheet';
import { tg } from '../lib/telegram';
import type { Profile } from '../lib/auth';

interface Item { to: string; emoji: string; title: string; hint: string }

const ITEMS: Item[] = [
  { to: '/more/projects', emoji: '📁', title: 'Projects', hint: 'Track bigger outcomes' },
  { to: '/more/areas', emoji: '🗂️', title: 'Areas', hint: 'Balance life domains' },
  { to: '/more/rituals', emoji: '🔁', title: 'Rituals', hint: 'Evening shutdown & weekly review' },
  { to: '/more/health', emoji: '🩺', title: 'Health', hint: 'Weight, water, meals' },
  { to: '/more/money', emoji: '💵', title: 'Money', hint: 'Expenses & budget' },
  { to: '/more/daily-plans', emoji: '📋', title: 'Daily Plans', hint: 'Plan tomorrow tonight' },
  { to: '/more/captures', emoji: '💡', title: 'Captures', hint: 'Ideas waiting for action' },
  { to: '/more/activity', emoji: '⚡', title: 'Activity', hint: 'Everything you logged' },
  { to: '/more/settings', emoji: '⚙️', title: 'Settings', hint: 'Preferences & account' },
];

interface Props { profile: Profile }

export default function MoreScreen({ profile }: Props) {
  const navigate = useNavigate();
  return (
    <div className="pb-6">
      <Section title="More">
        <h1 className="text-[28px] font-bold leading-tight">Everything else, still close</h1>
        <div className="text-[14px] text-hint">Secondary spaces for deeper planning, reviews, health, money, and preferences.</div>
      </Section>

      <Section title="">
        <div className="space-y-2">
          {ITEMS.map((it) => (
            <button
              key={it.to}
              onClick={() => { tg.haptic('light'); navigate(it.to); }}
              className="w-full flex items-center gap-3 bg-bg-2 rounded-2xl p-3 active:opacity-70 transition"
            >
              <div className="w-11 h-11 rounded-2xl bg-bg-3 flex items-center justify-center text-2xl">{it.emoji}</div>
              <div className="flex-1 text-left">
                <div className="text-[15px] font-semibold">{it.title}</div>
                <div className="text-[12px] text-hint">{it.hint}</div>
              </div>
              <ChevronRight size={18} className="text-hint" />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Account">
        <div className="bg-bg-2 rounded-2xl p-4">
          <div className="text-[13px] text-hint">Signed in as</div>
          <div className="text-[15px] font-semibold">{profile.first_name ?? ''} {profile.last_name ?? ''}</div>
          {profile.username && <div className="text-[12px] text-accent">@{profile.username}</div>}
          <div className="text-[11px] text-hint mt-2">Telegram ID: {profile.telegram_id}</div>
        </div>
      </Section>

      <GlobalAddButton />
    </div>
  );
}
