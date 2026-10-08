BEGIN;

CREATE TABLE IF NOT EXISTS public."MathLearningProgress" (
  "studentId" text PRIMARY KEY REFERENCES public."Youth"("id") ON DELETE CASCADE,
  "progress" jsonb NOT NULL CHECK (jsonb_typeof("progress") = 'object'),
  "version" integer NOT NULL DEFAULT 0 CHECK ("version" >= 0),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public."MathLearningProgress" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."MathLearningProgress" FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public."MathLearningProgress" TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
