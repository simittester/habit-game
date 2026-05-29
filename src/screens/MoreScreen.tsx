import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { Section } from '../components/Card';
import { GlobalAddButton } from '../components/AddSheet';
import { isAdmin } from '../api/admin';
import { tg } from '../lib/telegram';
import { useT } from '../i18n';
import type { Profile } from '../lib/auth';

interface Item { to: string; emoji: string; title: string; hint: string }

interface Props { profile: Profile }

export default function MoreScreen({ profile }: Props) {
  const navigate = useNavigate();
  const { t } = useT();
  const adminQ = useQuery({ queryKey: ['is_admin'], queryFn: isAdmin, staleTime: 5 * 60_000 });
  const baseItems: Item[] = [
    { to: '/more/projects',    emoji: '📁',  title: t.more.projects,    hint: t.more.projectsHint },
    { to: '/more/areas',       emoji: '🗂️', title: t.more.areas,       hint: t.more.areasHint },
    { to: '/more/rituals',     emoji: '🔁', title: t.more.rituals,     hint: t.more.ritualsHint },
    { to: '/more/health',      emoji: '🩺', title: t.more.health,      hint: t.more.healthHint },
    { to: '/more/money',       emoji: '💵', title: t.more.money,       hint: t.more.moneyHint },
    { to: '/more/daily-plans', emoji: '📋', title: t.more.dailyPlans,  hint: t.more.dailyPlansHint },
    { to: '/more/captures',    emoji: '💡', title: t.more.captures,    hint: t.more.capturesHint },
    { to: '/more/activity',    emoji: '⚡', title: t.more.activity,    hint: t.more.activityHint },
    { to: '/more/settings',    emoji: '⚙️', title: t.more.settings,    hint: t.more.settingsHint },
  ];
  const adminItem: Item = { to: '/more/admin', emoji: '👑', title: t.more.admin, hint: t.more.adminHint };
  const items = adminQ.data === true ? [...baseItems, adminItem] : baseItems;
  return (
    <div className="pb-6">
      <Section title={t.tab.more}>
        <h1 className="text-[28px] font-bold leading-tight">{t.more.title}</h1>
        <div className="text-[14px] text-hint">{t.more.subtitle}</div>
      </Section>

      <Section title="">
        <div className="space-y-2">
          {items.map((it) => (
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

      <Section title={t.more.signedInAs}>
        <div className="bg-bg-2 rounded-2xl p-4">
          <div className="text-[13px] text-hint">{t.more.signedInAs}</div>
          <div className="text-[15px] font-semibold">{profile.first_name ?? ''} {profile.last_name ?? ''}</div>
          {profile.username && <div className="text-[12px] text-accent">@{profile.username}</div>}
          <div className="text-[11px] text-hint mt-2">{t.more.telegramId}: {profile.telegram_id}</div>
        </div>
      </Section>

      <GlobalAddButton />
    </div>
  );
}
