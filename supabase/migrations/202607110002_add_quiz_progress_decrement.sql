create or replace function public.decrement_quiz_progress(
  p_student_name text,
  p_quiz_index integer
)
returns table (
  "studentName" text,
  "quizIndex" integer,
  "solveCount" integer
)
language sql
security definer
set search_path = public
as $$
  update public."QuizProgress" as progress
  set
    "solveCount" = greatest(0, progress."solveCount" - 1),
    "updatedAt" = now()
  where
    progress."studentName" = trim(p_student_name)
    and progress."quizIndex" = p_quiz_index
  returning
    progress."studentName",
    progress."quizIndex",
    progress."solveCount";
$$;

revoke all on function public.decrement_quiz_progress(text, integer) from public;
revoke all on function public.decrement_quiz_progress(text, integer) from anon;
revoke all on function public.decrement_quiz_progress(text, integer) from authenticated;
grant execute on function public.decrement_quiz_progress(text, integer) to service_role;
