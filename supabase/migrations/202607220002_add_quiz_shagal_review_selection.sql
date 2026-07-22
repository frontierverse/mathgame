begin;

-- A review question is the same item as the summary/list dedupe tuple. The
-- versioned deterministic key stays stable when the student receives shagal
-- for the same randomized question again.
create or replace function public.quiz_shagal_review_question_id(
  p_student_name text,
  p_quiz_id text,
  p_question_text text
)
returns text
language sql
immutable
strict
parallel safe
as $$
  select 'rq1_' || md5(
    jsonb_build_array(p_student_name, p_quiz_id, p_question_text)::text
  );
$$;

revoke all on function public.quiz_shagal_review_question_id(text, text, text)
  from public;
revoke all on function public.quiz_shagal_review_question_id(text, text, text)
  from anon;
revoke all on function public.quiz_shagal_review_question_id(text, text, text)
  from authenticated;

create or replace function public.get_student_quiz_shagal_review_questions_v2(
  p_student_name text
)
returns table (
  "reviewQuestionId" text,
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
    public.quiz_shagal_review_question_id(
      questions."studentName",
      questions."quizId",
      questions."questionText"
    ) as "reviewQuestionId",
    questions."quizId",
    questions."quizIndex",
    questions."questionText",
    questions."receivedAt",
    questions."occurrenceCount"
  from (
    select distinct on (event."quizId", event."questionText")
      event."studentName",
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

revoke all on function public.get_student_quiz_shagal_review_questions_v2(text)
  from public;
revoke all on function public.get_student_quiz_shagal_review_questions_v2(text)
  from anon;
revoke all on function public.get_student_quiz_shagal_review_questions_v2(text)
  from authenticated;
grant execute on function public.get_student_quiz_shagal_review_questions_v2(text)
  to service_role;

create or replace function public.get_selected_student_quiz_shagal_review_questions(
  p_student_name text,
  p_review_question_ids text[]
)
returns table (
  "reviewQuestionId" text,
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
  select question.*
  from public.get_student_quiz_shagal_review_questions_v2(
    trim(p_student_name)
  ) as question
  where question."reviewQuestionId" = any(p_review_question_ids)
  order by
    question."quizIndex",
    question."receivedAt",
    question."quizId",
    question."questionText";
$$;

revoke all on function public.get_selected_student_quiz_shagal_review_questions(text, text[])
  from public;
revoke all on function public.get_selected_student_quiz_shagal_review_questions(text, text[])
  from anon;
revoke all on function public.get_selected_student_quiz_shagal_review_questions(text, text[])
  from authenticated;
grant execute on function public.get_selected_student_quiz_shagal_review_questions(text, text[])
  to service_role;

notify pgrst, 'reload schema';

commit;
