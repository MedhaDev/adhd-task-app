-- Record steps being added and ticked, for the experiment data.
-- Runs as the signed-in person, so Row Level Security still applies.
create function public.log_step_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.events (user_id, task_id, name, details)
    values (new.user_id, new.task_id, 'step_added',
            jsonb_build_object('step_id', new.id, 'position', new.position));
  elsif new.done_at is distinct from old.done_at then
    insert into public.events (user_id, task_id, name, details)
    values (new.user_id, new.task_id,
            case when new.done_at is null then 'step_unticked' else 'step_ticked' end,
            jsonb_build_object('step_id', new.id, 'position', new.position));
  end if;
  return new;
end;
$$;

create trigger steps_log_events
  after insert or update on public.steps
  for each row execute function public.log_step_event();
