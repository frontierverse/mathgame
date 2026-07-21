begin;

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
  on conflict on constraint "QuizResetGeneration_pkey" do nothing;

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
  on conflict on constraint "QuizStudentResetGeneration_pkey" do nothing;

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
  on conflict on constraint "QuizProgress_studentName_quizIndex_key" do update
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
  on conflict on constraint "QuizResetGeneration_pkey" do nothing;

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
  on conflict on constraint "QuizStudentResetGeneration_pkey" do nothing;

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

notify pgrst, 'reload schema';

commit;
