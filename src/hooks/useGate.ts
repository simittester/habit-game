import { useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { openPaywall } from '../lib/paywall';
import { tg } from '../lib/telegram';

/**
 * Gate any mutation behind the subscription state.
 * When the user is in read-only mode (trial expired, no active sub):
 *   - Calling `gate(fn)()` opens the paywall instead of running fn.
 *   - Use `isReadOnly` to render disabled UI states.
 *
 * Settings, sign-out, and pure read actions should NOT be gated.
 */
export function useGate() {
  const sub = useSubscription();
  const isReadOnly = sub.status === 'expired';

  const gate = useCallback(
    <Args extends unknown[]>(fn: (...args: Args) => void) => {
      return (...args: Args) => {
        if (isReadOnly) {
          tg.haptic('medium');
          openPaywall();
          return;
        }
        fn(...args);
      };
    },
    [isReadOnly],
  );

  return { isReadOnly, gate };
}
