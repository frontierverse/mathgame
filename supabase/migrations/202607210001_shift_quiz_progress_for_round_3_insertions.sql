begin;

lock table public."QuizProgress" in access exclusive mode;

do $$
begin
  if exists (
    select 1
    from public."QuizProgress"
    where "quizIndex" between 30 and 32
  ) then
    raise exception
      'Cannot shift quiz progress: target quiz indexes 30 through 32 already contain data.';
  end if;
end;
$$;

create temporary table shifted_quiz_progress (
  "studentName" text not null,
  "quizIndex" integer not null,
  "solveCount" integer not null,
  "updatedAt" timestamptz not null,
  primary key ("studentName", "quizIndex")
) on commit drop;

insert into shifted_quiz_progress (
  "studentName",
  "quizIndex",
  "solveCount",
  "updatedAt"
)
select
  progress."studentName",
  case
    when progress."quizIndex" between 27 and 29 then progress."quizIndex" + 3
    else progress."quizIndex"
  end,
  progress."solveCount",
  progress."updatedAt"
from public."QuizProgress" as progress;

delete from public."QuizProgress";

insert into public."QuizProgress" (
  "studentName",
  "quizIndex",
  "solveCount",
  "updatedAt"
)
select
  "studentName",
  "quizIndex",
  "solveCount",
  "updatedAt"
from shifted_quiz_progress;

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
  where p_progress_protocol = 3
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
    and p_progress_protocol = 3
  returning
    progress."studentName",
    progress."quizIndex",
    progress."solveCount";
$$;

revoke all on function public.decrement_quiz_progress(text, integer, integer) from public;
revoke all on function public.decrement_quiz_progress(text, integer, integer) from anon;
revoke all on function public.decrement_quiz_progress(text, integer, integer) from authenticated;
grant execute on function public.decrement_quiz_progress(text, integer, integer) to service_role;

notify pgrst, 'reload schema';

commit;
