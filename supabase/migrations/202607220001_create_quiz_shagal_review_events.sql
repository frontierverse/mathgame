begin;

-- Review history is intentionally independent from QuizSolveAttempt. Progress
-- undo and round reset may delete attempts, but a question that once produced
-- shagal must remain available for the student's review worksheet.
create table if not exists public."QuizShagalReviewEvent" (
  "attemptId" uuid primary key,
  "studentName" text not null check (length(trim("studentName")) > 0),
  "quizId" text not null check (length(trim("quizId")) > 0),
  "quizIndex" integer not null check ("quizIndex" between 0 and 99),
  "roundId" text not null check (length(trim("roundId")) > 0),
  "variantSeed" bigint check ("variantSeed" between 0 and 4294967295),
  "questionText" text not null check (length(trim("questionText")) > 0),
  "stageBefore" smallint not null check ("stageBefore" between 0 and 2),
  "stageAfter" smallint not null check ("stageAfter" between 1 and 3),
  "completionMode" text not null check ("completionMode" in ('random', 'direct')),
  "completionReason" text not null check ("completionReason" in ('answer', 'timeout')),
  "receivedAt" timestamptz not null,
  "recordedAt" timestamptz not null default now(),
  check (
    ("stageBefore" = 0 and "stageAfter" = 1)
    or ("stageBefore" = 1 and "stageAfter" = 1)
    or ("stageBefore" = 2 and "stageAfter" = 2)
  )
);

create index if not exists quiz_shagal_review_event_student_received_idx
  on public."QuizShagalReviewEvent" ("studentName", "receivedAt" desc);

create index if not exists quiz_shagal_review_event_student_quiz_idx
  on public."QuizShagalReviewEvent" (
    "studentName",
    "quizId",
    "quizIndex"
  );

alter table public."QuizShagalReviewEvent" enable row level security;
revoke all on table public."QuizShagalReviewEvent" from public;
revoke all on table public."QuizShagalReviewEvent" from anon;
revoke all on table public."QuizShagalReviewEvent" from authenticated;
grant select on table public."QuizShagalReviewEvent" to service_role;

create or replace function public.capture_quiz_shagal_review_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new."outcome" <> 'shagal' then
    return new;
  end if;

  insert into public."QuizShagalReviewEvent" (
    "attemptId",
    "studentName",
    "quizId",
    "quizIndex",
    "roundId",
    "variantSeed",
    "questionText",
    "stageBefore",
    "stageAfter",
    "completionMode",
    "completionReason",
    "receivedAt"
  )
  values (
    new."id",
    new."studentName",
    new."quizId",
    new."quizIndex",
    new."roundId",
    new."variantSeed",
    new."questionText",
    new."stageBefore",
    new."stageAfter",
    new."completionMode",
    new."completionReason",
    new."answeredAt"
  )
  on conflict ("attemptId") do nothing;

  return new;
end;
$$;

revoke all on function public.capture_quiz_shagal_review_event() from public;
revoke all on function public.capture_quiz_shagal_review_event() from anon;
revoke all on function public.capture_quiz_shagal_review_event() from authenticated;

drop trigger if exists capture_quiz_shagal_review_event
  on public."QuizSolveAttempt";

create trigger capture_quiz_shagal_review_event
after insert on public."QuizSolveAttempt"
for each row
execute function public.capture_quiz_shagal_review_event();

-- Preserve every shagal attempt that still exists when this migration runs.
-- Attempts already removed by an older reset cannot be reconstructed exactly.
insert into public."QuizShagalReviewEvent" (
  "attemptId",
  "studentName",
  "quizId",
  "quizIndex",
  "roundId",
  "variantSeed",
  "questionText",
  "stageBefore",
  "stageAfter",
  "completionMode",
  "completionReason",
  "receivedAt",
  "recordedAt"
)
select
  attempt."id",
  attempt."studentName",
  attempt."quizId",
  attempt."quizIndex",
  attempt."roundId",
  attempt."variantSeed",
  attempt."questionText",
  attempt."stageBefore",
  attempt."stageAfter",
  attempt."completionMode",
  attempt."completionReason",
  attempt."answeredAt",
  attempt."createdAt"
from public."QuizSolveAttempt" as attempt
where attempt."outcome" = 'shagal'
on conflict ("attemptId") do nothing;

create or replace function public.get_quiz_shagal_review_summary()
returns table (
  "studentName" text,
  "questionCount" bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    questions."studentName",
    count(*)::bigint as "questionCount"
  from (
    select distinct
      event."studentName",
      event."quizId",
      event."questionText"
    from public."QuizShagalReviewEvent" as event
  ) as questions
  group by questions."studentName"
  order by questions."studentName";
$$;

revoke all on function public.get_quiz_shagal_review_summary() from public;
revoke all on function public.get_quiz_shagal_review_summary() from anon;
revoke all on function public.get_quiz_shagal_review_summary() from authenticated;
grant execute on function public.get_quiz_shagal_review_summary() to service_role;

create or replace function public.get_student_quiz_shagal_review_questions(
  p_student_name text
)
returns table (
  "quizId" text,
  "quizIndex" integer,
  "questionText" text,
  "receivedAt" timestamptz,
  "occurrenceCount" bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    questions."quizId",
    questions."quizIndex",
    questions."questionText",
    questions."receivedAt",
    questions."occurrenceCount"
  from (
    select distinct on (event."quizId", event."questionText")
      event."quizId",
      event."quizIndex",
      event."questionText",
      event."receivedAt",
      count(*) over (
        partition by event."quizId", event."questionText"
      )::bigint as "occurrenceCount",
      event."attemptId"
    from public."QuizShagalReviewEvent" as event
    where event."studentName" = trim(p_student_name)
    order by
      event."quizId",
      event."questionText",
      event."receivedAt" desc,
      event."attemptId" desc
  ) as questions
  order by
    questions."quizIndex",
    questions."receivedAt",
    questions."quizId",
    questions."questionText";
$$;

revoke all on function public.get_student_quiz_shagal_review_questions(text)
  from public;
revoke all on function public.get_student_quiz_shagal_review_questions(text)
  from anon;
revoke all on function public.get_student_quiz_shagal_review_questions(text)
  from authenticated;
grant execute on function public.get_student_quiz_shagal_review_questions(text)
  to service_role;

notify pgrst, 'reload schema';

commit;
