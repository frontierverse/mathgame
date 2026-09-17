begin;

-- Students in this table stay in Youth for the rest of the learning app but
-- do not appear anywhere in the student-life feature.
create table if not exists public."StudentLifeHiddenYouth" (
  "studentId" text primary key references public."Youth"(id) on delete cascade,
  "createdAt" timestamptz not null default now()
);

alter table public."StudentLifeHiddenYouth" enable row level security;
revoke all on table public."StudentLifeHiddenYouth" from public, anon, authenticated;
grant select, insert, delete on table public."StudentLifeHiddenYouth" to service_role;

-- This database guard closes the race between an application visibility check
-- and a mood insert/update.
create or replace function public.enforce_visible_student_mood()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public."StudentLifeHiddenYouth"
    where "studentId" = new."studentId"
  ) then
    raise exception 'Student is hidden from student life' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

drop trigger if exists student_mood_visible_student_guard on public."StudentMood";
create trigger student_mood_visible_student_guard
before insert or update on public."StudentMood"
for each row execute function public.enforce_visible_student_mood();

revoke all on function public.enforce_visible_student_mood() from public, anon, authenticated;
notify pgrst, 'reload schema';
commit;
