import { tg } from './telegram';

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [maybeError.message, maybeError.details, maybeError.hint, maybeError.code]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);

    if (parts.length > 0) return parts.join(' ');
  }

  return 'Please try again.';
}

export function reportMutationError(error: unknown) {
  const message = extractErrorMessage(error);
  console.error('Mutation failed', error);
  tg.notify('error');
  tg.showAlert(`Could not save changes.\n\n${message}`);
}
