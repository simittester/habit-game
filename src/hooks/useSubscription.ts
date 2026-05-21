import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../api/settings';

export type SubState =
  | { status: 'loading' }
  | { status: 'trial'; trialDaysLeft: number; trialEndsAt: Date; isReadOnly: false }
  | { status: 'active'; tier: 'week' | 'month' | 'year'; renewsAt: Date | null; isReadOnly: false }
  | { status: 'expired'; trialEndedAt: Date | null; isReadOnly: true };

export function useSubscription(): SubState {
  const q = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  if (q.isLoading) return { status: 'loading' };
  const s = q.data;
  if (!s) return { status: 'loading' };

  const now = new Date();

  // Active paid subscription
  if (s.subscription_status === 'active') {
    const renewsAt = s.subscription_renews_at ? new Date(s.subscription_renews_at) : null;
    const stillValid = !renewsAt || renewsAt > now;
    if (stillValid) {
      return {
        status: 'active',
        tier: (s.subscription_tier ?? 'month') as 'week' | 'month' | 'year',
        renewsAt,
        isReadOnly: false,
      };
    }
  }

  // Trial period
  const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at) : null;
  if (trialEnd && trialEnd > now) {
    const msLeft = trialEnd.getTime() - now.getTime();
    const trialDaysLeft = Math.max(1, Math.ceil(msLeft / 86_400_000));
    return { status: 'trial', trialDaysLeft, trialEndsAt: trialEnd, isReadOnly: false };
  }

  return { status: 'expired', trialEndedAt: trialEnd, isReadOnly: true };
}
