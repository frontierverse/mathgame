begin;

create or replace function public.save_quiz_progress(
  p_student_name text,
  p_quiz_index integer,
  p_solve_count integer,
  p_progress_protocol integer
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
  insert into public."QuizProgress" as progress (
    "studentName",
    "quizIndex",
    "solveCount",
    "updatedAt"
  )
  select
    trim(p_student_name),
    p_quiz_index,
    least(3, greatest(0, p_solve_count)),
    now()
  where p_progress_protocol = 2
  on conflict ("studentName", "quizIndex") do update
  set
    "solveCount" = greatest(progress."solveCount", excluded."solveCount"),
    "updatedAt" = now()
  returning
    progress."studentName",
    progress."quizIndex",
    progress."solveCount";
$$;

revoke all on function public.save_quiz_progress(text, integer, integer, integer) from public;
revoke all on function public.save_quiz_progress(text, integer, integer, integer) from anon;
revoke all on function public.save_quiz_progress(text, integer, integer, integer) from authenticated;
grant execute on function public.save_quiz_progress(text, integer, integer, integer) to service_role;

create or replace function public.decrement_quiz_progress(
  p_student_name text,
  p_quiz_index integer,
  p_progress_protocol integer
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
    and p_progress_protocol = 2
  returning
    progress."studentName",
    progress."quizIndex",
    progress."solveCount";
$$;

revoke all on function public.decrement_quiz_progress(text, integer, integer) from public;
revoke all on function public.decrement_quiz_progress(text, integer, integer) from anon;
revoke all on function public.decrement_quiz_progress(text, integer, integer) from authenticated;
grant execute on function public.decrement_quiz_progress(text, integer, integer) to service_role;

drop function if exists public.save_quiz_progress(text, integer, integer);
drop function if exists public.decrement_quiz_progress(text, integer);

delete from public."QuizProgress";

notify pgrst, 'reload schema';

commit;
