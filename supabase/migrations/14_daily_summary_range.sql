-- Date-param replacement for the 60-day rolling daily_summary view.
-- The existing daily_summary view stays in place (backwards compat). New code
-- should call daily_summary_range(p_start, p_end) so users can see history older
-- than 60 days back.

create or replace function public.daily_summary_range(p_start date, p_end date)
returns table (
  user_id uuid,
  day date,
  tasks_done bigint,
  tasks_total bigint,
  habits_done bigint,
  habits_planned bigint,
  water_glasses integer,
  water_target integer,
  meals_logged bigint,
  expenses_total numeric,
  blocks_done bigint,
  blocks_total bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    p.id as user_id,
    d.day,
    coalesce(tasks_done.cnt, 0)     as tasks_done,
    coalesce(tasks_total.cnt, 0)    as tasks_total,
    coalesce(habits_done.cnt, 0)    as habits_done,
    coalesce(habits_planned.cnt, 0) as habits_planned,
    coalesce(water.glasses, 0)      as water_glasses,
    coalesce(water.target, 8)       as water_target,
    coalesce(meals.cnt, 0)          as meals_logged,
    coalesce(expenses.total, 0)     as expenses_total,
    coalesce(blocks_done.cnt, 0)    as blocks_done,
    coalesce(blocks_total.cnt, 0)   as blocks_total
  from profiles p
  cross join lateral (
    select generate_series(p_start::timestamp, p_end::timestamp, '1 day'::interval)::date as day
  ) d
  left join lateral (
    select count(*) as cnt
    from tasks
    where tasks.user_id = p.id
      and tasks.status = 'done'
      and tasks.completed_at::date = d.day
  ) tasks_done on true
  left join lateral (
    select count(*) as cnt
    from tasks
    where tasks.user_id = p.id
      and (tasks.scheduled_for = d.day or tasks.completed_at::date = d.day)
  ) tasks_total on true
  left join lateral (
    select count(*) as cnt
    from habit_logs
    where habit_logs.user_id = p.id
      and habit_logs.log_date = d.day
  ) habits_done on true
  left join lateral (
    select count(*) as cnt
    from habits h
    where h.user_id = p.id
      and h.archived = false
      and (
        h.frequency = 'daily'
        or h.frequency = 'weekdays' and extract(isodow from d.day) between 1 and 5
        or h.frequency = 'weekends' and extract(isodow from d.day) in (6, 7)
        or h.frequency = 'custom'   and extract(dow from d.day)::int = any (coalesce(h.custom_days, '{}'))
      )
  ) habits_planned on true
  left join water_logs water on water.user_id = p.id and water.log_date = d.day
  left join lateral (
    select count(*) as cnt
    from meals
    where meals.user_id = p.id and meals.log_date = d.day
  ) meals on true
  left join lateral (
    select sum(expenses.amount) as total
    from expenses
    where expenses.user_id = p.id and expenses.log_date = d.day
  ) expenses on true
  left join lateral (
    select count(*) as cnt
    from time_blocks
    where time_blocks.user_id = p.id and time_blocks.block_date = d.day and time_blocks.completed = true
  ) blocks_done on true
  left join lateral (
    select count(*) as cnt
    from time_blocks
    where time_blocks.user_id = p.id and time_blocks.block_date = d.day
  ) blocks_total on true
  where p.id = app_user_id();
$$;

grant execute on function public.daily_summary_range(date, date) to authenticated;
