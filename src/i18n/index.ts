import { useQuery } from '@tanstack/react-query';
import { en, type Strings } from './en';
import { ru } from './ru';
import { getSettings } from '../api/settings';
import { getCachedProfile } from '../lib/auth';

export type LangCode = 'en' | 'ru';

const DICTS: Record<LangCode, Strings> = { en, ru };

function resolveLang(override: string | null | undefined, profileLang: string | null | undefined): LangCode {
  const explicit = (override ?? '').toLowerCase();
  if (explicit === 'en' || explicit === 'ru') return explicit;
  const auto = (profileLang ?? '').toLowerCase();
  if (auto.startsWith('ru')) return 'ru';
  return 'en';
}

export function useT(): { t: Strings; lang: LangCode } {
  const settingsQ = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: 60_000,
  });
  const profile = getCachedProfile();
  const lang = resolveLang(settingsQ.data?.language, profile?.language_code);
  return { t: DICTS[lang], lang };
}

export function pickDict(lang: LangCode): Strings {
  return DICTS[lang];
}
