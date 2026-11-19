-- Record thoughts parked during a timer and what happened to them, for the
-- experiment (how often stray thoughts show up, and how many were worth keeping).
-- Runs as the signed-in person, so Row Level Security still applies.
create function public.log_parked_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.events (user_id, name, details)
    values (new.user_id, 'thought_parked',
            jsonb_build_object('parked_id', new.id, 'session_id', new.session_id));
  elsif new.resolution is distinct from old.resolution and new.resolution is not null then
    insert into public.events (user_id, name, details)
    values (new.user_id, 'thought_' || new.resolution::text,
            jsonb_build_object('parked_id', new.id, 'session_id', new.session_id));
  end if;
  return new;
end;
$$;

create trigger parked_thoughts_log_events
  after insert or update on public.parked_thoughts
  for each row execute function public.log_parked_event();
