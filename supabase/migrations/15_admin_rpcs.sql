-- Admin RPCs for comping users without raw SQL.
-- Admin allow-list is hardcoded by telegram_id below. Add more by extending the
-- IN (...) clause in is_admin().

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = public.app_user_id()
      and telegram_id in (958247905)
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.admin_list_users(p_limit int default 200)
returns table (
  user_id uuid,
  telegram_id bigint,
  first_name text,
  last_name text,
  username text,
  language_code text,
  photo_url text,
  created_at timestamptz,
  onboarded_at timestamptz,
  subscription_status text,
  subscription_tier text,
  subscription_renews_at timestamptz,
  trial_ends_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select
      p.id,
      p.telegram_id,
      p.first_name,
      p.last_name,
      p.username,
      p.language_code,
      p.photo_url,
      p.created_at,
      us.onboarded_at,
      us.subscription_status::text,
      us.subscription_tier::text,
      us.subscription_renews_at,
      us.trial_ends_at
    from public.profiles p
    left join public.user_settings us on us.user_id = p.id
    order by p.created_at desc
    limit p_limit;
end;
$$;

grant execute on function public.admin_list_users(int) to authenticated;

create or replace function public.admin_set_subscription(
  p_user_id uuid,
  p_status text,
  p_renews_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('trial', 'active', 'cancelled', 'expired') then
    raise exception 'invalid status: %', p_status using errcode = '22023';
  end if;
  update public.user_settings
  set
    subscription_status = p_status,
    subscription_renews_at = coalesce(p_renews_at, subscription_renews_at)
  where user_id = p_user_id;
end;
$$;

grant execute on function public.admin_set_subscription(uuid, text, timestamptz) to authenticated;
