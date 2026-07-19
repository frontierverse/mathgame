create table if not exists public."QuizRoundAssignment" (
  "roundId" text primary key check (length(trim("roundId")) > 0),
  "studentNames" text[] not null default '{}'::text[],
  "updatedAt" timestamptz not null default now()
);

alter table public."QuizRoundAssignment" enable row level security;
