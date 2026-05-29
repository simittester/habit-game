alter table public.user_settings add column if not exists language text;
comment on column public.user_settings.language is 'Override language code (en/ru). NULL = auto-detect from profile.language_code.';
