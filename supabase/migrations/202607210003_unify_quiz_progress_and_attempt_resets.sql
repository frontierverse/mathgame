begin;

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
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text := trim(p_student_name);
  v_solve_count integer := 0;
begin
  if p_progress_protocol is distinct from 3 then
    raise exception using
      errcode = '22023',
      message = 'Unsupported quiz progress protocol.';
  end if;

  if
    v_student_name is null
    or v_student_name = ''
    or p_quiz_index is null
    or p_quiz_index not between 0 and 99
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid quiz progress decrement.';
  end if;

  update public."QuizProgress" as progress
  set
    "solveCount" = greatest(0, progress."solveCount" - 1),
    "updatedAt" = now()
  where
    progress."studentName" = v_student_name
    and progress."quizIndex" = p_quiz_index
  returning progress."solveCount"
  into v_solve_count;

  if not found then
    v_solve_count := 0;
  end if;

  if v_solve_count = 0 then
    delete from public."QuizSolveAttempt" as attempt
    where
      attempt."studentName" = v_student_name
      and attempt."quizIndex" = p_quiz_index;
  end if;

  return query
  select v_student_name, p_quiz_index, v_solve_count;
end;
$$;

revoke all on function public.decrement_quiz_progress(text, integer, integer) from public;
revoke all on function public.decrement_quiz_progress(text, integer, integer) from anon;
revoke all on function public.decrement_quiz_progress(text, integer, integer) from authenticated;
grant execute on function public.decrement_quiz_progress(text, integer, integer) to service_role;

create or replace function public.reset_quiz_round_data(
  p_round_id text,
  p_quiz_indexes integer[],
  p_progress_protocol integer
)
returns table (
  "roundId" text,
  "progressResetCount" bigint,
  "attemptResetCount" bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id text := trim(p_round_id);
  v_progress_reset_count bigint := 0;
  v_attempt_reset_count bigint := 0;
begin
  if p_progress_protocol is distinct from 3 then
    raise exception using
      errcode = '22023',
      message = 'Unsupported quiz progress protocol.';
  end if;

  if
    v_round_id is null
    or v_round_id = ''
    or coalesce(cardinality(p_quiz_indexes), 0) = 0
    or exists (
      select 1
      from unnest(p_quiz_indexes) as quiz_index
      where quiz_index is null or quiz_index not between 0 and 99
    )
  then
    raise exception using
      errcode = '22023',
      message = 'Invalid quiz round reset.';
  end if;

  delete from public."QuizSolveAttempt" as attempt
  where
    attempt."roundId" = v_round_id
    and attempt."quizIndex" = any(p_quiz_indexes);
  get diagnostics v_attempt_reset_count = row_count;

  delete from public."QuizProgress" as progress
  where progress."quizIndex" = any(p_quiz_indexes);
  get diagnostics v_progress_reset_count = row_count;

  return query
  select
    v_round_id,
    v_progress_reset_count,
    v_attempt_reset_count;
end;
$$;

revoke all on function public.reset_quiz_round_data(text, integer[], integer) from public;
revoke all on function public.reset_quiz_round_data(text, integer[], integer) from anon;
revoke all on function public.reset_quiz_round_data(text, integer[], integer) from authenticated;
grant execute on function public.reset_quiz_round_data(text, integer[], integer) to service_role;

notify pgrst, 'reload schema';

commit;
