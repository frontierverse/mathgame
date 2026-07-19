create temporary table shifted_quiz_progress (
  "studentName" text not null,
  "quizIndex" integer not null,
  "solveCount" integer not null,
  "updatedAt" timestamptz not null,
  primary key ("studentName", "quizIndex")
);

insert into shifted_quiz_progress (
  "studentName",
  "quizIndex",
  "solveCount",
  "updatedAt"
)
select
  progress."studentName",
  case
    when progress."quizIndex" >= 2 then progress."quizIndex" + 1
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
