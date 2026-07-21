begin;

create table if not exists public."QuizSolveAttempt" (
  "id" uuid primary key,
  "studentName" text not null check (length(trim("studentName")) > 0),
  "quizId" text not null check (length(trim("quizId")) > 0),
  "quizIndex" integer not null check ("quizIndex" between 0 and 99),
  "roundId" text not null check (length(trim("roundId")) > 0),
  "variantSeed" bigint check ("variantSeed" between 0 and 4294967295),
  "questionText" text not null check (length(trim("questionText")) > 0),
  "stageBefore" smallint not null check ("stageBefore" between 0 and 2),
  "stageAfter" smallint not null check ("stageAfter" between 1 and 3),
  "outcome" text not null check ("outcome" in ('shagal', 'yar')),
  "durationMs" integer not null check ("durationMs" between 0 and 604800000),
  "startedAt" timestamptz not null,
  "answeredAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  check ("answeredAt" >= "startedAt"),
  check (
    ("stageBefore" = 0 and "stageAfter" in (1, 3))
    or ("stageBefore" = 1 and "stageAfter" in (1, 2))
    or ("stageBefore" = 2 and "stageAfter" in (2, 3))
  ),
  check (
    "outcome" = case
      when
        "stageAfter" = 3
        or ("stageBefore" > 0 and "stageAfter" > "stageBefore")
      then 'yar'
      else 'shagal'
    end
  )
);

create index if not exists quiz_solve_attempt_student_completed_idx
  on public."QuizSolveAttempt" ("studentName", "answeredAt" desc);

create index if not exists quiz_solve_attempt_quiz_completed_idx
  on public."QuizSolveAttempt" ("quizId", "answeredAt" desc);

create index if not exists quiz_solve_attempt_round_completed_idx
  on public."QuizSolveAttempt" ("roundId", "answeredAt" desc);

alter table public."QuizSolveAttempt" enable row level security;

create or replace function public.record_quiz_solve_attempt(
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
  p_answered_at timestamptz
)
returns setof public."QuizSolveAttempt"
language plpgsql
security definer
set search_path = public
as $$
begin
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
    "answeredAt"
  )
  values (
    p_id,
    trim(p_student_name),
    trim(p_quiz_id),
    p_quiz_index,
    trim(p_round_id),
    p_variant_seed,
    p_question_text,
    p_stage_before,
    p_stage_after,
    case
      when
        p_stage_after = 3
        or (p_stage_before > 0 and p_stage_after > p_stage_before)
      then 'yar'
      else 'shagal'
    end,
    p_duration_ms,
    p_started_at,
    p_answered_at
  )
  on conflict ("id") do nothing;

  if not exists (
    select 1
    from public."QuizSolveAttempt" as existing
    where existing."id" = p_id
      and existing."studentName" = trim(p_student_name)
      and existing."quizId" = trim(p_quiz_id)
      and existing."quizIndex" = p_quiz_index
      and existing."roundId" = trim(p_round_id)
      and existing."variantSeed" is not distinct from p_variant_seed
      and existing."questionText" = p_question_text
      and existing."stageBefore" = p_stage_before
      and existing."stageAfter" = p_stage_after
      and existing."outcome" = case
        when
          p_stage_after = 3
          or (p_stage_before > 0 and p_stage_after > p_stage_before)
        then 'yar'
        else 'shagal'
      end
      and existing."durationMs" = p_duration_ms
      and existing."startedAt" = p_started_at
      and existing."answeredAt" = p_answered_at
  ) then
    raise unique_violation
      using message = 'Quiz attempt id already exists with different data.';
  end if;

  return query
  select attempt.*
  from public."QuizSolveAttempt" as attempt
  where attempt."id" = p_id;
end;
$$;

revoke all on function public.record_quiz_solve_attempt(
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
) from public;
revoke all on function public.record_quiz_solve_attempt(
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
) from anon;
revoke all on function public.record_quiz_solve_attempt(
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
) from authenticated;
grant execute on function public.record_quiz_solve_attempt(
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
) to service_role;

notify pgrst, 'reload schema';

commit;
