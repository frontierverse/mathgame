begin;

create table if not exists public."StudentMood" (
  "studentId" text not null references public."Youth"(id) on delete restrict,
  "recordedOn" date not null,
  score smallint not null check (score between 0 and 5),
  "wantsTalk" boolean not null default false,
  "careStatus" text not null default 'pending' check ("careStatus" in ('pending', 'scheduled', 'done')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "careUpdatedAt" timestamptz,
  primary key ("studentId", "recordedOn")
);

create index if not exists student_mood_date_idx on public."StudentMood" ("recordedOn", "studentId");
alter table public."StudentMood" enable row level security;
revoke all on table public."StudentMood" from public, anon, authenticated;
grant select, insert, update on table public."StudentMood" to service_role;

-- Browser cookies hold an opaque random token. Only its SHA-256 hash is kept
-- here so a database read cannot be used directly as a live session cookie.
create table if not exists public."StudentLifeSession" (
  "tokenHash" text primary key check ("tokenHash" ~ '^[0-9a-f]{64}$'),
  role text not null check (role in ('admin', 'student')),
  "studentId" text references public."Youth"(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "expiresAt" timestamptz not null,
  constraint student_life_session_role_student_check check (
    (role = 'admin' and "studentId" is null) or
    (role = 'student' and "studentId" is not null)
  ),
  constraint student_life_session_expiry_check check ("expiresAt" > "createdAt")
);

create index if not exists student_life_session_expiry_idx
  on public."StudentLifeSession" ("expiresAt");
alter table public."StudentLifeSession" enable row level security;
revoke all on table public."StudentLifeSession" from public, anon, authenticated;
grant select, insert, delete on table public."StudentLifeSession" to service_role;

-- Failed password checks are limited per client. The client address is HMACed
-- by the application before it reaches this table.
create table if not exists public."StudentLifeLoginThrottle" (
  "clientHash" text primary key check ("clientHash" ~ '^[0-9a-f]{64}$'),
  "failedCount" smallint not null default 0 check ("failedCount" between 0 and 100),
  "windowStartedAt" timestamptz not null default now(),
  "blockedUntil" timestamptz,
  "updatedAt" timestamptz not null default now()
);

create index if not exists student_life_login_throttle_updated_idx
  on public."StudentLifeLoginThrottle" ("updatedAt");
alter table public."StudentLifeLoginThrottle" enable row level security;
revoke all on table public."StudentLifeLoginThrottle" from public, anon, authenticated;

create or replace function public.register_student_life_login_attempt(
  p_client_hash text, p_succeeded boolean, p_max_failures integer
)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public."StudentLifeLoginThrottle"%rowtype;
  v_failed_count smallint;
  v_window_started_at timestamptz;
  v_blocked_until timestamptz;
begin
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$'
    or p_succeeded is null or p_max_failures is null
    or p_max_failures < 1 or p_max_failures > 100 then
    raise exception 'Invalid login attempt' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_client_hash, 0));
  select * into v_row
    from public."StudentLifeLoginThrottle"
    where "clientHash" = p_client_hash
    for update;

  if found and v_row."blockedUntil" is not null and v_row."blockedUntil" > v_now then
    return v_row."blockedUntil";
  end if;

  if p_succeeded then
    delete from public."StudentLifeLoginThrottle" where "clientHash" = p_client_hash;
    return null;
  end if;

  if not found
    or v_row."windowStartedAt" <= v_now - interval '10 minutes'
    or (v_row."blockedUntil" is not null and v_row."blockedUntil" <= v_now) then
    v_failed_count := 1;
    v_window_started_at := v_now;
  else
    v_failed_count := least(v_row."failedCount" + 1, p_max_failures);
    v_window_started_at := v_row."windowStartedAt";
  end if;

  v_blocked_until := case when v_failed_count >= p_max_failures
    then v_now + interval '5 minutes' else null end;

  insert into public."StudentLifeLoginThrottle" as attempt
    ("clientHash", "failedCount", "windowStartedAt", "blockedUntil", "updatedAt")
  values
    (p_client_hash, v_failed_count, v_window_started_at, v_blocked_until, v_now)
  on conflict ("clientHash") do update set
    "failedCount" = excluded."failedCount",
    "windowStartedAt" = excluded."windowStartedAt",
    "blockedUntil" = excluded."blockedUntil",
    "updatedAt" = excluded."updatedAt";

  return v_blocked_until;
end;
$$;

create or replace function public.save_student_mood(
  p_student_id text, p_score integer, p_wants_talk boolean, p_recorded_on date
)
returns setof public."StudentMood"
language plpgsql security definer set search_path = '' as $$
begin
  if p_recorded_on is null or p_recorded_on <> (now() at time zone 'Asia/Seoul')::date then
    raise exception 'Only today can be recorded' using errcode = 'P0001';
  end if;
  if p_score is null or p_score < 0 or p_score > 5 or p_wants_talk is null then
    raise exception 'Invalid mood' using errcode = '22023';
  end if;
  return query
  insert into public."StudentMood" as mood ("studentId", "recordedOn", score, "wantsTalk")
  values (p_student_id, p_recorded_on, p_score, p_wants_talk)
  on conflict ("studentId", "recordedOn") do update set
    score = excluded.score,
    "wantsTalk" = excluded."wantsTalk",
    "careStatus" = case when mood.score <> excluded.score or mood."wantsTalk" <> excluded."wantsTalk"
      then 'pending' else mood."careStatus" end,
    "careUpdatedAt" = case when mood.score <> excluded.score or mood."wantsTalk" <> excluded."wantsTalk"
      then null else mood."careUpdatedAt" end,
    "updatedAt" = now()
  returning mood.*;
end;
$$;

create or replace function public.update_student_mood_care(
  p_student_id text, p_recorded_on date, p_care_status text
)
returns setof public."StudentMood"
language plpgsql security definer set search_path = '' as $$
begin
  if p_care_status is null or p_care_status not in ('pending', 'scheduled', 'done') then
    raise exception 'Invalid follow-up status' using errcode = '22023';
  end if;
  return query update public."StudentMood" as mood
    set "careStatus" = p_care_status, "careUpdatedAt" = now(), "updatedAt" = now()
    where mood."studentId" = p_student_id and mood."recordedOn" = p_recorded_on
    returning mood.*;
  if not found then raise exception 'Record not found' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function public.save_student_mood(text, integer, boolean, date) from public, anon, authenticated;
revoke all on function public.update_student_mood_care(text, date, text) from public, anon, authenticated;
revoke all on function public.register_student_life_login_attempt(text, boolean, integer) from public, anon, authenticated;
grant execute on function public.save_student_mood(text, integer, boolean, date) to service_role;
grant execute on function public.update_student_mood_care(text, date, text) to service_role;
grant execute on function public.register_student_life_login_attempt(text, boolean, integer) to service_role;
notify pgrst, 'reload schema';
commit;
