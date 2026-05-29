import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Crown, Search, RefreshCw, ShieldOff, Calendar } from 'lucide-react';
import { Section, Card } from '../components/Card';
import { TextField } from '../components/Input';
import { adminListUsers, adminSetSubscription, isAdmin, type AdminUserRow } from '../api/admin';
import { tg } from '../lib/telegram';
import { format } from 'date-fns';
import type { Profile } from '../lib/auth';

interface Props { profile: Profile }

const FAR_FUTURE_ISO = '2099-12-31T23:59:59Z';

export default function AdminScreen(_props: Props) {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');

  const adminQ = useQuery({ queryKey: ['is_admin'], queryFn: isAdmin, staleTime: 60_000 });
  const usersQ = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => adminListUsers(200),
    enabled: adminQ.data === true,
  });

  const compM = useMutation({
    mutationFn: (user_id: string) => adminSetSubscription({ user_id, status: 'active', renews_at: FAR_FUTURE_ISO }),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries({ queryKey: ['admin_users'] }); },
  });

  const revokeM = useMutation({
    mutationFn: (user_id: string) => adminSetSubscription({ user_id, status: 'expired' }),
    onSuccess: () => { tg.notify('success'); qc.invalidateQueries({ queryKey: ['admin_users'] }); },
  });

  const filtered = useMemo(() => {
    const rows = usersQ.data ?? [];
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((u) =>
      String(u.telegram_id).includes(q) ||
      (u.first_name ?? '').toLowerCase().includes(q) ||
      (u.last_name ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q),
    );
  }, [usersQ.data, query]);

  if (adminQ.isLoading) {
    return <div className="p-6 text-hint">Checking access…</div>;
  }
  if (adminQ.data !== true) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-6">
            <ShieldOff className="mx-auto mb-2 text-hint" size={28} />
            <div className="text-[16px] font-semibold">Not authorized</div>
            <div className="text-[12px] text-hint mt-1">This area is for admins only.</div>
          </div>
        </Card>
      </div>
    );
  }

  const activeCount = (usersQ.data ?? []).filter((u) => u.subscription_status === 'active').length;
  const trialCount = (usersQ.data ?? []).filter((u) => u.subscription_status === 'trial').length;
  const expiredCount = (usersQ.data ?? []).filter((u) => u.subscription_status === 'expired').length;

  return (
    <div className="pb-6">
      <Section title="">
        <div className="flex items-center gap-2 mt-2">
          <Crown size={20} className="text-amber-400" />
          <h1 className="text-[28px] font-bold leading-tight">Admin</h1>
        </div>
        <div className="text-[14px] text-hint">Comp users, revoke access, see signups.</div>
      </Section>

      <Section title="">
        <div className="grid grid-cols-3 gap-2">
          <Card><div className="text-[10px] text-hint tracking-wider uppercase">Active</div><div className="text-[20px] font-bold tabular-nums text-emerald-400">{activeCount}</div></Card>
          <Card><div className="text-[10px] text-hint tracking-wider uppercase">Trial</div><div className="text-[20px] font-bold tabular-nums">{trialCount}</div></Card>
          <Card><div className="text-[10px] text-hint tracking-wider uppercase">Expired</div><div className="text-[20px] font-bold tabular-nums text-hint">{expiredCount}</div></Card>
        </div>
      </Section>

      <Section title="">
        <div className="px-0 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hint pointer-events-none" />
            <TextField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search id / name / username" className="pl-9" />
          </div>
          <button
            onClick={() => { tg.haptic('light'); usersQ.refetch(); }}
            className="w-10 h-10 rounded-full bg-bg-3 flex items-center justify-center active:opacity-60"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={usersQ.isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </Section>

      <Section title={`Users · ${filtered.length}`}>
        {usersQ.isLoading ? (
          <Card><div className="text-hint text-sm text-center py-4">Loading…</div></Card>
        ) : filtered.length === 0 ? (
          <Card><div className="text-hint text-sm text-center py-4">No users match.</div></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <UserRow
                key={u.user_id}
                user={u}
                onComp={() => { tg.haptic('medium'); compM.mutate(u.user_id); }}
                onRevoke={() => { tg.haptic('medium'); revokeM.mutate(u.user_id); }}
                isMutating={compM.isPending || revokeM.isPending}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function UserRow({ user, onComp, onRevoke, isMutating }: {
  user: AdminUserRow;
  onComp: () => void;
  onRevoke: () => void;
  isMutating: boolean;
}) {
  const display = [user.first_name, user.last_name].filter(Boolean).join(' ') || (user.username ? `@${user.username}` : '—');
  const created = format(new Date(user.created_at), 'MMM d, yyyy');
  const renewsAt = user.subscription_renews_at ? new Date(user.subscription_renews_at) : null;
  const isCompedForever = renewsAt && renewsAt.getFullYear() >= 2090;
  const isActive = user.subscription_status === 'active';

  const badgeClass =
    user.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
    user.subscription_status === 'trial'  ? 'bg-accent/20 text-accent' :
    'bg-bg-3 text-hint';

  return (
    <Card>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{display}</div>
          <div className="text-[11px] text-hint truncate">
            tg: <span className="tabular-nums">{user.telegram_id}</span>
            {user.username && <> · @{user.username}</>}
            {user.language_code && <> · {user.language_code}</>}
          </div>
          <div className="text-[11px] text-hint mt-0.5 flex items-center gap-1">
            <Calendar size={10} /> joined {created}
            {renewsAt && <> · {isCompedForever ? 'comp ∞' : `renews ${format(renewsAt, 'MMM d, yyyy')}`}</>}
          </div>
        </div>
        <div className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${badgeClass}`}>
          {user.subscription_status}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {!isActive && (
          <button
            onClick={onComp}
            disabled={isMutating}
            className="flex-1 py-2 rounded-full bg-accent text-white text-[13px] font-semibold active:scale-95 disabled:opacity-50 transition"
          >
            Comp ∞
          </button>
        )}
        {isActive && (
          <button
            onClick={onRevoke}
            disabled={isMutating}
            className="flex-1 py-2 rounded-full bg-bg-3 text-text text-[13px] font-semibold active:scale-95 disabled:opacity-50 transition"
          >
            Revoke
          </button>
        )}
      </div>
    </Card>
  );
}
