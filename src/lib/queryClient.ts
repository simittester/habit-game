import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { tg } from './telegram';

function describe(err: unknown): string {
  if (!err) return 'Unknown error';
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    return e.message || e.details || e.hint || e.code || JSON.stringify(err);
  }
  return String(err);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err) => {
      // Quiet for queries — surface via UI states, but log so we see it in devtools
      console.warn('[query]', describe(err), err);
    },
  }),
  mutationCache: new MutationCache({
    onError: (err) => {
      const msg = describe(err);
      console.warn('[mutation]', msg, err);
      tg.notify('error');
      tg.showAlert(`Couldn't save: ${msg}`);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
