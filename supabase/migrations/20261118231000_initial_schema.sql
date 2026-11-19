-- Initial schema for the Today app.
-- Every table has Row Level Security: a signed-in person can only read and
-- change their own rows. Signed-out visitors (the publishable key alone) see nothing.

-- ---------- Fixed lists ----------
create type public.task_area as enum ('work', 'job_search', 'personal', 'fun');
create type public.task_status as enum ('later', 'today', 'done');
create type public.timer_kind as enum ('starter', 'focus', 'break');
create type public.timer_outcome as enum ('kept_going', 'stopped', 'finished', 'abandoned');
create type public.parked_resolution as enum ('kept', 'deleted');

-- ---------- Keep updated_at current ----------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Tasks ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 500),
  area public.task_area,
  status public.task_status not null default 'later',
  today_position smallint check (today_position between 0 and 9),
  moved_to_today_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index tasks_user_status_idx on public.tasks (user_id, status);
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------- Steps (step at position 0 is the tiny first step) ----------
create table public.steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid not null,
  body text not null check (char_length(body) between 1 and 500),
  position integer not null default 0 check (position >= 0),
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete cascade
);
create index steps_task_idx on public.steps (task_id, user_id);
create index steps_user_idx on public.steps (user_id);

-- ---------- Timer sessions (5-minute starters, focus rounds, breaks) ----------
create table public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid,
  step_id uuid,
  kind public.timer_kind not null,
  planned_minutes smallint not null check (planned_minutes in (5, 15, 25)),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  outcome public.timer_outcome,
  unique (id, user_id),
  -- Keep timer history for the experiment even if the task or step is deleted.
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete set null (task_id),
  foreign key (step_id, user_id) references public.steps (id, user_id) on delete set null (step_id)
);
create index timer_sessions_task_idx on public.timer_sessions (task_id, user_id);
create index timer_sessions_step_idx on public.timer_sessions (step_id, user_id);
create index timer_sessions_user_started_idx on public.timer_sessions (user_id, started_at);

-- ---------- Parked thoughts ----------
create table public.parked_thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid,
  body text not null check (char_length(body) between 1 and 500),
  resolution public.parked_resolution,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id) references public.timer_sessions (id, user_id) on delete set null (session_id)
);
create index parked_thoughts_session_idx on public.parked_thoughts (session_id, user_id);
create index parked_thoughts_user_idx on public.parked_thoughts (user_id);

-- ---------- Events (time-stamped log for the experiment CSV) ----------
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id uuid,
  name text not null check (char_length(name) between 1 and 64),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  foreign key (task_id, user_id) references public.tasks (id, user_id) on delete set null (task_id)
);
create index events_task_idx on public.events (task_id, user_id);
create index events_user_time_idx on public.events (user_id, occurred_at);

-- ---------- Row Level Security: owner-only access on every table ----------
alter table public.tasks enable row level security;
alter table public.steps enable row level security;
alter table public.timer_sessions enable row level security;
alter table public.parked_thoughts enable row level security;
alter table public.events enable row level security;

create policy "Owner can read tasks" on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add tasks" on public.tasks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner can change tasks" on public.tasks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner can delete tasks" on public.tasks
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Owner can read steps" on public.steps
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add steps" on public.steps
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner can change steps" on public.steps
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner can delete steps" on public.steps
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Owner can read timer sessions" on public.timer_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add timer sessions" on public.timer_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner can change timer sessions" on public.timer_sessions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner can delete timer sessions" on public.timer_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Owner can read parked thoughts" on public.parked_thoughts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add parked thoughts" on public.parked_thoughts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner can change parked thoughts" on public.parked_thoughts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owner can delete parked thoughts" on public.parked_thoughts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Events are an append-only log: read and add, never edit.
create policy "Owner can read events" on public.events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owner can add events" on public.events
  for insert to authenticated with check ((select auth.uid()) = user_id);
