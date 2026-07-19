create temporary table migrated_quiz_progress (
  "studentName" text not null,
  "quizIndex" integer not null,
  "solveCount" integer not null,
  "updatedAt" timestamptz not null,
  primary key ("studentName", "quizIndex")
);

-- A local v5 cache may have already copied the new atomic indexes to the server.
-- In that case, keep the v2 rows instead of expanding the legacy indexes twice.
insert into migrated_quiz_progress (
  "studentName",
  "quizIndex",
  "solveCount",
  "updatedAt"
)
select
  progress."studentName",
  progress."quizIndex",
  progress."solveCount",
  progress."updatedAt"
from public."QuizProgress" as progress
where
  progress."quizIndex" between 0 and 59
  and exists (
    select 1
    from public."QuizProgress" as atomic_progress
    where atomic_progress."quizIndex" between 30 and 59
  );

with quiz_index_map (old_index, new_index) as (
  values
    (0, 0),
    (1, 1), (1, 2),
    (2, 3), (2, 4), (2, 5),
    (3, 6), (3, 7), (3, 8), (3, 9),
    (4, 10), (4, 11), (4, 12),
    (5, 13), (5, 14),
    (6, 15), (6, 16), (6, 17),
    (7, 18), (7, 19), (7, 20), (7, 21),
    (8, 22), (8, 23), (8, 24), (8, 25),
    (9, 26),
    (10, 30), (10, 31), (10, 32),
    (11, 33), (11, 34),
    (12, 35), (12, 36),
    (13, 37), (13, 38),
    (14, 39), (14, 40),
    (15, 41), (15, 42), (15, 43),
    (16, 44), (16, 45), (16, 46), (16, 47), (16, 48), (16, 49),
    (17, 50), (17, 51), (17, 52),
    (18, 34), (18, 36), (18, 53), (18, 54), (18, 55), (18, 56),
    (19, 34), (19, 35), (19, 57), (19, 58)
)
insert into migrated_quiz_progress (
  "studentName",
  "quizIndex",
  "solveCount",
  "updatedAt"
)
select
  progress."studentName",
  mapping.new_index,
  max(progress."solveCount"),
  max(progress."updatedAt")
from public."QuizProgress" as progress
join quiz_index_map as mapping
  on mapping.old_index = progress."quizIndex"
where not exists (
  select 1
  from public."QuizProgress" as atomic_progress
  where atomic_progress."quizIndex" between 30 and 59
)
group by progress."studentName", mapping.new_index;

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
from migrated_quiz_progress;
