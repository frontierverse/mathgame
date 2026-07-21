begin;

-- A round reset advances this barrier for every quiz in the round.
create table if not exists public."QuizResetGeneration" (
  "quizIndex" integer primary key check ("quizIndex" between 0 and 99),
  "generation" bigint not null default 0
    constraint quiz_reset_generation_safe_integer_check
    check ("generation" between 0 and 9007199254740991),
  "updatedAt" timestamptz not null default now()
);

insert into public."QuizResetGeneration" (
  "quizIndex",
  "generation",
  "updatedAt"
)
select quiz_index, 0, now()
from generate_series(0, 99) as generated(quiz_index)
on conflict ("quizIndex") do nothing;

alter table public."QuizResetGeneration" enable row level security;
revoke all on table public."QuizResetGeneration" from public;
revoke all on table public."QuizResetGeneration" from anon;
revoke all on table public."QuizResetGeneration" from authenticated;
grant select on table public."QuizResetGeneration" to service_role;

-- An individual undo advances only this student's barrier for the quiz.
create table if not exists public."QuizStudentResetGeneration" (
  "studentName" text not null check (length(trim("studentName")) > 0),
  "quizIndex" integer not null check ("quizIndex" between 0 and 99),
  "generation" bigint not null default 0
    constraint quiz_student_reset_generation_safe_integer_check
    check ("generation" between 0 and 9007199254740991),
  "updatedAt" timestamptz not null default now(),
  primary key ("studentName", "quizIndex")
);

insert into public."QuizStudentResetGeneration" (
  "studentName",
  "quizIndex",
  "generation",
  "updatedAt"
)
select
  student."studentName",
  quiz_indexes.quiz_index,
  0,
  now()
from (
  select distinct trim(youth.name) as "studentName"
  from public."Youth" as youth
  where youth.name is not null and length(trim(youth.name)) > 0
) as student
cross join generate_series(0, 99) as quiz_indexes(quiz_index)
on conflict ("studentName", "quizIndex") do nothing;

alter table public."QuizStudentResetGeneration" enable row level security;
revoke all on table public."QuizStudentResetGeneration" from public;
revoke all on table public."QuizStudentResetGeneration" from anon;
revoke all on table public."QuizStudentResetGeneration" from authenticated;
grant select on table public."QuizStudentResetGeneration" to service_role;

alter table public."QuizSolveAttempt"
  add column if not exists "completionMode" text,
  add column if not exists "completionReason" text,
  add column if not exists "timeLimitSeconds" integer,
  add column if not exists "resetGeneration" bigint,
  add column if not exists "studentResetGeneration" bigint;

-- Every attempt recorded before this migration came from the random quiz flow.
-- The timer default was 25 seconds and both reset generations start at 0.
update public."QuizSolveAttempt"
set
  "completionMode" = coalesce("completionMode", 'random'),
  "completionReason" = coalesce("completionReason", 'answer'),
  "timeLimitSeconds" = coalesce("timeLimitSeconds", 25),
  "resetGeneration" = coalesce("resetGeneration", 0),
  "studentResetGeneration" = coalesce("studentResetGeneration", 0)
where
  "completionMode" is null
  or "completionReason" is null
  or "timeLimitSeconds" is null
  or "resetGeneration" is null
  or "studentResetGeneration" is null;

alter table public."QuizSolveAttempt"
  alter column "completionMode" set default 'random',
  alter column "completionMode" set not null,
  alter column "completionReason" set default 'answer',
  alter column "completionReason" set not null,
  alter column "timeLimitSeconds" set default 25,
  alter column "timeLimitSeconds" set not null,
  alter column "resetGeneration" set default 0,
  alter column "resetGeneration" set not null,
  alter column "studentResetGeneration" set default 0,
  alter column "studentResetGeneration" set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where
      conrelid = 'public."QuizSolveAttempt"'::regclass
      and conname = 'quiz_solve_attempt_completion_mode_check'
  ) then
    alter table public."QuizSolveAttempt"
      add constraint quiz_solve_attempt_completion_mode_check
      check ("completionMode" in ('random', 'direct'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where
      conrelid = 'public."QuizSolveAttempt"'::regclass
      and conname = 'quiz_solve_attempt_completion_reason_check'
  ) then
    alter table public."QuizSolveAttempt"
      add constraint quiz_solve_attempt_completion_reason_check
      check ("completionReason" in ('answer', 'timeout'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where
      conrelid = 'public."QuizSolveAttempt"'::regclass
      and conname = 'quiz_solve_attempt_time_limit_seconds_check'
  ) then
    alter table public."QuizSolveAttempt"
      add constraint quiz_solve_attempt_time_limit_seconds_check
      check ("timeLimitSeconds" between 5 and 300);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where
      conrelid = 'public."QuizSolveAttempt"'::regclass
      and conname = 'quiz_solve_attempt_reset_generation_check'
  ) then
    alter table public."QuizSolveAttempt"
      add constraint quiz_solve_attempt_reset_generation_check
      check ("resetGeneration" between 0 and 9007199254740991);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where
      conrelid = 'public."QuizSolveAttempt"'::regclass
      and conname = 'quiz_solve_attempt_student_reset_generation_check'
  ) then
    alter table public."QuizSolveAttempt"
      add constraint quiz_solve_attempt_student_reset_generation_check
      check ("studentResetGeneration" between 0 and 9007199254740991);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where
      conrelid = 'public."QuizSolveAttempt"'::regclass
      and conname = 'quiz_solve_attempt_timeout_outcome_check'
  ) then
    alter table public."QuizSolveAttempt"
      add constraint quiz_solve_attempt_timeout_outcome_check
      check ("completionReason" <> 'timeout' or "outcome" = 'shagal');
  end if;
end;
$$;

create index if not exists quiz_solve_attempt_quiz_index_idx
  on public."QuizSolveAttempt" ("quizIndex");

drop function if exists public.record_quiz_solve_attempt(
  uuid,
  text,
  text,
  integer,
  text,
  bigint,
  text,
  smallint,
  smallint,
  integer,
  timestamptz,
  timestamptz
);

drop function if exists public.complete_quiz_attempt(
  uuid,
  text,
  text,
  integer,
  text,
  bigint,
  text,
  smallint,
  smallint,
  integer,
  timestamptz,
  timestamptz,
  text,
  text,
  integer,
  bigint
);

create or replace function public.complete_quiz_attempt(
  p_id uuid,
  p_student_name text,
  p_quiz_id text,
  p_quiz_index integer,
  p_round_id text,
  p_variant_seed bigint,
  p_question_text text,
  p_stage_before smallint,
  p_stage_after smallint,
  p_duration_ms integer,
  p_started_at timestamptz,
  p_answered_at timestamptz,
  p_completion_mode text,
  p_completion_reason text,
  p_time_limit_seconds integer,
  p_expected_reset_generation bigint,
  p_expected_student_reset_generation bigint
)
returns table (
  "id" uuid,
  "solveCount" integer,
  "resetGeneration" bigint,
  "studentResetGeneration" bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text := trim(p_student_name);
  v_quiz_id text := trim(p_quiz_id);
  v_round_id text := trim(p_round_id);
  v_completion_mode text := lower(trim(p_completion_mode));
  v_completion_reason text := lower(trim(p_completion_reason));
  v_reset_generation bigint;
  v_student_reset_generation bigint;
  v_current_stage integer := 0;
  v_outcome text;
begin
  if
    p_id is null
    or v_student_name is null
    or v_student_name = ''
    or v_quiz_id is null
    or v_quiz_id = ''
    or p_quiz_index is null
    or p_quiz_index not between 0 and 99
    or v_round_id is null
    or v_round_id = ''
    or (p_variant_seed is not null and p_variant_seed not between 0 and 4294967295)
    or p_question_text is null
    or length(trim(p_question_text)) = 0
    or p_stage_before is null
    or p_stage_before not between 0 and 2
    or p_stage_after is null
    or p_stage_after not between 1 and 3
    or p_duration_ms is null
    or p_duration_ms not between 0 and 604800000
    or p_started_at is null
    or p_answered_at is null
    or p_answered_at < p_started_at
    or v_completion_mode is null
    or v_completion_mode not in ('random', 'direct')
    or v_completion_reason is null
    or v_completion_reason not in ('answer', 'timeout')
    or p_time_limit_seconds is null
    or p_time_limit_seconds not between 5 and 300
    or p_expected_reset_generation is null
    or p_expected_reset_generation not between 0 and 9007199254740991
    or p_expected_student_reset_generation is null
    or p_expected_student_reset_generation not between 0 and 9007199254740991
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid quiz completion.';
  end if;

  if not (
    (p_stage_before = 0 and p_stage_after in (1, 3))
    or (p_stage_before = 1 and p_stage_after in (1, 2))
    or (p_stage_before = 2 and p_stage_after in (2, 3))
  ) then
    raise exception using
      errcode = '22023',
      message = 'Invalid quiz stage transition.';
  end if;

  if
    v_completion_reason = 'timeout'
    and p_stage_after <> (
      case p_stage_before
        when 0 then 1
        when 1 then 1
        else 2
      end
    )
  then
    raise exception using
      errcode = '22023',
      message = 'A timeout cannot award quiz progress.';
  end if;

  v_outcome := case
    when
      p_stage_after = 3
      or (p_stage_before > 0 and p_stage_after > p_stage_before)
    then 'yar'
    else 'shagal'
  end;

  insert into public."QuizResetGeneration" (
    "quizIndex",
    "generation",
    "updatedAt"
  )
  values (p_quiz_index, 0, now())
  on conflict ("quizIndex") do nothing;

  select generation."generation"
  into v_reset_generation
  from public."QuizResetGeneration" as generation
  where generation."quizIndex" = p_quiz_index
  for update;

  if p_expected_reset_generation is distinct from v_reset_generation then
    raise exception using
      errcode = '40001',
      message = 'Stale quiz reset generation.';
  end if;

  insert into public."QuizStudentResetGeneration" (
    "studentName",
    "quizIndex",
    "generation",
    "updatedAt"
  )
  values (v_student_name, p_quiz_index, 0, now())
  on conflict ("studentName", "quizIndex") do nothing;

  select generation."generation"
  into v_student_reset_generation
  from public."QuizStudentResetGeneration" as generation
  where
    generation."studentName" = v_student_name
    and generation."quizIndex" = p_quiz_index
  for update;

  if
    p_expected_student_reset_generation
      is distinct from v_student_reset_generation
  then
    raise exception using
      errcode = '40001',
      message = 'Stale quiz student reset generation.';
  end if;

  -- A retry of a committed request returns the original result without applying
  -- the stage transition twice. Reusing the UUID with any changed field is rejected.
  if exists (
    select 1
    from public."QuizSolveAttempt" as existing
    where existing."id" = p_id
  ) then
    if not exists (
      select 1
      from public."QuizSolveAttempt" as existing
      where
        existing."id" = p_id
        and existing."studentName" = v_student_name
        and existing."quizId" = v_quiz_id
        and existing."quizIndex" = p_quiz_index
        and existing."roundId" = v_round_id
        and existing."variantSeed" is not distinct from p_variant_seed
        and existing."questionText" = p_question_text
        and existing."stageBefore" = p_stage_before
        and existing."stageAfter" = p_stage_after
        and existing."outcome" = v_outcome
        and existing."durationMs" = p_duration_ms
        and existing."startedAt" = p_started_at
        and existing."answeredAt" = p_answered_at
        and existing."completionMode" = v_completion_mode
        and existing."completionReason" = v_completion_reason
        and existing."timeLimitSeconds" = p_time_limit_seconds
        and existing."resetGeneration" = v_reset_generation
        and existing."studentResetGeneration" = v_student_reset_generation
    ) then
      raise unique_violation using
        message = 'Quiz attempt id already exists with different data.';
    end if;

    return query
    select
      existing."id",
      existing."stageAfter"::integer,
      existing."resetGeneration",
      existing."studentResetGeneration"
    from public."QuizSolveAttempt" as existing
    where existing."id" = p_id;
    return;
  end if;

  select progress."solveCount"
  into v_current_stage
  from public."QuizProgress" as progress
  where
    progress."studentName" = v_student_name
    and progress."quizIndex" = p_quiz_index
  for update;

  if not found then
    v_current_stage := 0;
  end if;

  if v_current_stage is distinct from p_stage_before::integer then
    raise exception using
      errcode = '40001',
      message = 'Quiz progress changed before completion.';
  end if;

  insert into public."QuizSolveAttempt" (
    "id",
    "studentName",
    "quizId",
    "quizIndex",
    "roundId",
    "variantSeed",
    "questionText",
    "stageBefore",
    "stageAfter",
    "outcome",
    "durationMs",
    "startedAt",
    "answeredAt",
    "completionMode",
    "completionReason",
    "timeLimitSeconds",
    "resetGeneration",
    "studentResetGeneration"
  )
  values (
    p_id,
    v_student_name,
    v_quiz_id,
    p_quiz_index,
    v_round_id,
    p_variant_seed,
    p_question_text,
    p_stage_before,
    p_stage_after,
    v_outcome,
    p_duration_ms,
    p_started_at,
    p_answered_at,
    v_completion_mode,
    v_completion_reason,
    p_time_limit_seconds,
    v_reset_generation,
    v_student_reset_generation
  );

  insert into public."QuizProgress" as progress (
    "studentName",
    "quizIndex",
    "solveCount",
    "updatedAt"
  )
  values (
    v_student_name,
    p_quiz_index,
    p_stage_after,
    now()
  )
  on conflict ("studentName", "quizIndex") do update
  set
    "solveCount" = excluded."solveCount",
    "updatedAt" = now();

  return query
  select
    p_id,
    p_stage_after::integer,
    v_reset_generation,
    v_student_reset_generation;
end;
$$;

revoke all on function public.complete_quiz_attempt(
  uuid,
  text,
  text,
  integer,
  text,
  bigint,
  text,
  smallint,
  smallint,
  integer,
  timestamptz,
  timestamptz,
  text,
  text,
  integer,
  bigint,
  bigint
) from public;
revoke all on function public.complete_quiz_attempt(
  uuid,
  text,
  text,
  integer,
  text,
  bigint,
  text,
  smallint,
  smallint,
  integer,
  timestamptz,
  timestamptz,
  text,
  text,
  integer,
  bigint,
  bigint
) from anon;
revoke all on function public.complete_quiz_attempt(
  uuid,
  text,
  text,
  integer,
  text,
  bigint,
  text,
  smallint,
  smallint,
  integer,
  timestamptz,
  timestamptz,
  text,
  text,
  integer,
  bigint,
  bigint
) from authenticated;
grant execute on function public.complete_quiz_attempt(
  uuid,
  text,
  text,
  integer,
  text,
  bigint,
  text,
  smallint,
  smallint,
  integer,
  timestamptz,
  timestamptz,
  text,
  text,
  integer,
  bigint,
  bigint
) to service_role;

drop function if exists public.save_quiz_progress(text, integer, integer, integer);
drop function if exists public.save_quiz_progress(
  text,
  integer,
  integer,
  integer,
  bigint
);

create or replace function public.save_quiz_progress(
  p_student_name text,
  p_quiz_index integer,
  p_solve_count integer,
  p_progress_protocol integer,
  p_expected_reset_generation bigint,
  p_expected_student_reset_generation bigint
)
returns table (
  "studentName" text,
  "quizIndex" integer,
  "solveCount" integer,
  "resetGeneration" bigint,
  "studentResetGeneration" bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text := trim(p_student_name);
  v_solve_count integer;
  v_reset_generation bigint;
  v_student_reset_generation bigint;
begin
  if p_progress_protocol is distinct from 4 then
    raise exception using
      errcode = '22023',
      message = 'Unsupported quiz progress protocol.';
  end if;

  if
    v_student_name is null
    or v_student_name = ''
    or p_quiz_index is null
    or p_quiz_index not between 0 and 99
    or p_solve_count is null
    or p_solve_count not between 0 and 3
    or p_expected_reset_generation is null
    or p_expected_reset_generation not between 0 and 9007199254740991
    or p_expected_student_reset_generation is null
    or p_expected_student_reset_generation not between 0 and 9007199254740991
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid quiz progress update.';
  end if;

  insert into public."QuizResetGeneration" (
    "quizIndex",
    "generation",
    "updatedAt"
  )
  values (p_quiz_index, 0, now())
  on conflict ("quizIndex") do nothing;

  select generation."generation"
  into v_reset_generation
  from public."QuizResetGeneration" as generation
  where generation."quizIndex" = p_quiz_index
  for update;

  if p_expected_reset_generation is distinct from v_reset_generation then
    raise exception using
      errcode = '40001',
      message = 'Stale quiz reset generation.';
  end if;

  insert into public."QuizStudentResetGeneration" (
    "studentName",
    "quizIndex",
    "generation",
    "updatedAt"
  )
  values (v_student_name, p_quiz_index, 0, now())
  on conflict ("studentName", "quizIndex") do nothing;

  select generation."generation"
  into v_student_reset_generation
  from public."QuizStudentResetGeneration" as generation
  where
    generation."studentName" = v_student_name
    and generation."quizIndex" = p_quiz_index
  for update;

  if
    p_expected_student_reset_generation
      is distinct from v_student_reset_generation
  then
    raise exception using
      errcode = '40001',
      message = 'Stale quiz student reset generation.';
  end if;

  insert into public."QuizProgress" as progress (
    "studentName",
    "quizIndex",
    "solveCount",
    "updatedAt"
  )
  values (
    v_student_name,
    p_quiz_index,
    p_solve_count,
    now()
  )
  on conflict ("studentName", "quizIndex") do update
  set
    "solveCount" = greatest(progress."solveCount", excluded."solveCount"),
    "updatedAt" = now()
  returning progress."solveCount"
  into v_solve_count;

  return query
  select
    v_student_name,
    p_quiz_index,
    v_solve_count,
    v_reset_generation,
    v_student_reset_generation;
end;
$$;

revoke all on function public.save_quiz_progress(
  text,
  integer,
  integer,
  integer,
  bigint,
  bigint
) from public;
revoke all on function public.save_quiz_progress(
  text,
  integer,
  integer,
  integer,
  bigint,
  bigint
) from anon;
revoke all on function public.save_quiz_progress(
  text,
  integer,
  integer,
  integer,
  bigint,
  bigint
) from authenticated;
grant execute on function public.save_quiz_progress(
  text,
  integer,
  integer,
  integer,
  bigint,
  bigint
) to service_role;

drop function if exists public.decrement_quiz_progress(text, integer, integer);
drop function if exists public.decrement_quiz_progress(
  text,
  integer,
  integer,
  bigint
);

create or replace function public.decrement_quiz_progress(
  p_student_name text,
  p_quiz_index integer,
  p_progress_protocol integer,
  p_expected_reset_generation bigint,
  p_expected_student_reset_generation bigint
)
returns table (
  "studentName" text,
  "quizIndex" integer,
  "solveCount" integer,
  "resetGeneration" bigint,
  "studentResetGeneration" bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text := trim(p_student_name);
  v_solve_count integer := 0;
  v_reset_generation bigint;
  v_student_reset_generation bigint;
begin
  if p_progress_protocol is distinct from 4 then
    raise exception using
      errcode = '22023',
      message = 'Unsupported quiz progress protocol.';
  end if;

  if
    v_student_name is null
    or v_student_name = ''
    or p_quiz_index is null
    or p_quiz_index not between 0 and 99
    or p_expected_reset_generation is null
    or p_expected_reset_generation not between 0 and 9007199254740991
    or p_expected_student_reset_generation is null
    or p_expected_student_reset_generation not between 0 and 9007199254740991
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid quiz progress decrement.';
  end if;

  insert into public."QuizResetGeneration" (
    "quizIndex",
    "generation",
    "updatedAt"
  )
  values (p_quiz_index, 0, now())
  on conflict ("quizIndex") do nothing;

  select generation."generation"
  into v_reset_generation
  from public."QuizResetGeneration" as generation
  where generation."quizIndex" = p_quiz_index
  for update;

  if p_expected_reset_generation is distinct from v_reset_generation then
    raise exception using
      errcode = '40001',
      message = 'Stale quiz reset generation.';
  end if;

  insert into public."QuizStudentResetGeneration" (
    "studentName",
    "quizIndex",
    "generation",
    "updatedAt"
  )
  values (v_student_name, p_quiz_index, 0, now())
  on conflict ("studentName", "quizIndex") do nothing;

  select generation."generation"
  into v_student_reset_generation
  from public."QuizStudentResetGeneration" as generation
  where
    generation."studentName" = v_student_name
    and generation."quizIndex" = p_quiz_index
  for update;

  if
    p_expected_student_reset_generation
      is distinct from v_student_reset_generation
  then
    raise exception using
      errcode = '40001',
      message = 'Stale quiz student reset generation.';
  end if;

  update public."QuizProgress" as progress
  set
    "solveCount" = greatest(0, progress."solveCount" - 1),
    "updatedAt" = now()
  where
    progress."studentName" = v_student_name
    and progress."quizIndex" = p_quiz_index
    and progress."solveCount" > 0
  returning progress."solveCount"
  into v_solve_count;

  if found then
    if v_student_reset_generation >= 9007199254740991 then
      raise exception using
        errcode = '22023',
        message = 'Quiz student reset generation is exhausted.';
    end if;

    update public."QuizStudentResetGeneration" as generation
    set
      "generation" = generation."generation" + 1,
      "updatedAt" = now()
    where
      generation."studentName" = v_student_name
      and generation."quizIndex" = p_quiz_index
    returning generation."generation"
    into v_student_reset_generation;

    delete from public."QuizSolveAttempt" as attempt
    where
      attempt."studentName" = v_student_name
      and attempt."quizIndex" = p_quiz_index;
  else
    v_solve_count := 0;
  end if;

  return query
  select
    v_student_name,
    p_quiz_index,
    v_solve_count,
    v_reset_generation,
    v_student_reset_generation;
end;
$$;

revoke all on function public.decrement_quiz_progress(
  text,
  integer,
  integer,
  bigint,
  bigint
) from public;
revoke all on function public.decrement_quiz_progress(
  text,
  integer,
  integer,
  bigint,
  bigint
) from anon;
revoke all on function public.decrement_quiz_progress(
  text,
  integer,
  integer,
  bigint,
  bigint
) from authenticated;
grant execute on function public.decrement_quiz_progress(
  text,
  integer,
  integer,
  bigint,
  bigint
) to service_role;

drop function if exists public.reset_quiz_round_data(text, integer[], integer);

create or replace function public.reset_quiz_round_data(
  p_round_id text,
  p_quiz_indexes integer[],
  p_progress_protocol integer,
  p_expected_reset_generations bigint[]
)
returns table (
  "roundId" text,
  "progressResetCount" bigint,
  "attemptResetCount" bigint,
  "resetGenerations" jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id text := trim(p_round_id);
  v_quiz_index integer;
  v_progress_reset_count bigint := 0;
  v_attempt_reset_count bigint := 0;
  v_reset_generations jsonb := '{}'::jsonb;
begin
  if p_progress_protocol is distinct from 4 then
    raise exception using
      errcode = '22023',
      message = 'Unsupported quiz progress protocol.';
  end if;

  if
    v_round_id is null
    or v_round_id = ''
    or coalesce(cardinality(p_quiz_indexes), 0) = 0
    or cardinality(p_quiz_indexes) is distinct from cardinality(p_expected_reset_generations)
    or exists (
      select 1
      from unnest(p_quiz_indexes, p_expected_reset_generations)
        as expected(quiz_index, reset_generation)
      where
        expected.quiz_index is null
        or expected.quiz_index not between 0 and 99
        or expected.reset_generation is null
        or expected.reset_generation not between 0 and 9007199254740991
    )
    or (
      select count(*) <> count(distinct quiz_index)
      from unnest(p_quiz_indexes) as indexes(quiz_index)
    )
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid quiz round reset.';
  end if;

  insert into public."QuizResetGeneration" (
    "quizIndex",
    "generation",
    "updatedAt"
  )
  select quiz_index, 0, now()
  from unnest(p_quiz_indexes) as indexes(quiz_index)
  on conflict ("quizIndex") do nothing;

  -- Lock every quiz generation in index order so concurrent completion,
  -- decrement and round-reset transactions cannot interleave or deadlock.
  for v_quiz_index in
    select generation."quizIndex"
    from public."QuizResetGeneration" as generation
    where generation."quizIndex" = any(p_quiz_indexes)
    order by generation."quizIndex"
    for update
  loop
    null;
  end loop;

  if exists (
    select 1
    from unnest(p_quiz_indexes, p_expected_reset_generations)
      as expected(quiz_index, reset_generation)
    join public."QuizResetGeneration" as generation
      on generation."quizIndex" = expected.quiz_index
    where generation."generation" is distinct from expected.reset_generation
  ) then
    raise exception using
      errcode = '40001',
      message = 'Stale quiz reset generation.';
  end if;

  if exists (
    select 1
    from public."QuizResetGeneration" as generation
    where
      generation."quizIndex" = any(p_quiz_indexes)
      and generation."generation" >= 9007199254740991
  ) then
    raise exception using
      errcode = '22023',
      message = 'Quiz reset generation is exhausted.';
  end if;

  -- Advance the reset barrier before deleting data. Any delayed request carrying
  -- the previous generation will fail after this transaction commits.
  update public."QuizResetGeneration" as generation
  set
    "generation" = generation."generation" + 1,
    "updatedAt" = now()
  where generation."quizIndex" = any(p_quiz_indexes);

  delete from public."QuizSolveAttempt" as attempt
  where attempt."quizIndex" = any(p_quiz_indexes);
  get diagnostics v_attempt_reset_count = row_count;

  delete from public."QuizProgress" as progress
  where progress."quizIndex" = any(p_quiz_indexes);
  get diagnostics v_progress_reset_count = row_count;

  select coalesce(
    jsonb_object_agg(
      generation."quizIndex"::text,
      generation."generation"
      order by generation."quizIndex"
    ),
    '{}'::jsonb
  )
  into v_reset_generations
  from public."QuizResetGeneration" as generation
  where generation."quizIndex" = any(p_quiz_indexes);

  return query
  select
    v_round_id,
    v_progress_reset_count,
    v_attempt_reset_count,
    v_reset_generations;
end;
$$;

revoke all on function public.reset_quiz_round_data(
  text,
  integer[],
  integer,
  bigint[]
) from public;
revoke all on function public.reset_quiz_round_data(
  text,
  integer[],
  integer,
  bigint[]
) from anon;
revoke all on function public.reset_quiz_round_data(
  text,
  integer[],
  integer,
  bigint[]
) from authenticated;
grant execute on function public.reset_quiz_round_data(
  text,
  integer[],
  integer,
  bigint[]
) to service_role;

create or replace function public.get_quiz_progress_snapshot()
returns table (
  "progressRows" jsonb,
  "resetGenerationRows" jsonb,
  "studentResetGenerationRows" jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'studentName', progress."studentName",
            'quizIndex', progress."quizIndex",
            'solveCount', progress."solveCount"
          )
          order by progress."studentName", progress."quizIndex"
        )
        from public."QuizProgress" as progress
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'quizIndex', generation."quizIndex",
            'generation', generation."generation"
          )
          order by generation."quizIndex"
        )
        from public."QuizResetGeneration" as generation
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'studentName', generation."studentName",
            'quizIndex', generation."quizIndex",
            'generation', generation."generation"
          )
          order by generation."studentName", generation."quizIndex"
        )
        from public."QuizStudentResetGeneration" as generation
      ),
      '[]'::jsonb
    );
$$;

revoke all on function public.get_quiz_progress_snapshot() from public;
revoke all on function public.get_quiz_progress_snapshot() from anon;
revoke all on function public.get_quiz_progress_snapshot() from authenticated;
grant execute on function public.get_quiz_progress_snapshot() to service_role;

create or replace function public.get_quiz_statistics_snapshot()
returns table (
  "attemptRows" jsonb,
  "progressRows" jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', attempt."id",
            'studentName', attempt."studentName",
            'quizId', attempt."quizId",
            'quizIndex', attempt."quizIndex",
            'roundId', attempt."roundId",
            'variantSeed', attempt."variantSeed",
            'questionText', attempt."questionText",
            'stageBefore', attempt."stageBefore",
            'stageAfter', attempt."stageAfter",
            'outcome', attempt."outcome",
            'durationMs', attempt."durationMs",
            'startedAt', attempt."startedAt",
            'answeredAt', attempt."answeredAt"
          )
          order by attempt."answeredAt" desc, attempt."id" desc
        )
        from public."QuizSolveAttempt" as attempt
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'studentName', progress."studentName",
            'quizIndex', progress."quizIndex",
            'solveCount', progress."solveCount"
          )
          order by progress."studentName", progress."quizIndex"
        )
        from public."QuizProgress" as progress
        where progress."solveCount" > 0
      ),
      '[]'::jsonb
    );
$$;

revoke all on function public.get_quiz_statistics_snapshot() from public;
revoke all on function public.get_quiz_statistics_snapshot() from anon;
revoke all on function public.get_quiz_statistics_snapshot() from authenticated;
grant execute on function public.get_quiz_statistics_snapshot() to service_role;

-- Only assignments persisted before the fixed 10-quiz batching rollout are
-- stale. Keep assignments written by a current or future deployment intact.
delete from public."QuizRoundAssignment" as assignment
where
  (
    assignment."roundId" in ('round-1', 'round-4')
    and assignment."updatedAt" < timestamptz '2026-07-19 07:04:00+00:00'
  )
  or assignment."roundId" in (
    'round-7',
    'round-m1-s1-u1-su1',
    'round-m1-s1-u1-su2'
  );

notify pgrst, 'reload schema';

commit;
