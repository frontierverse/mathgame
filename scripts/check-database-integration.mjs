import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import pg from "pg";
import { loadTypeScript } from "../tests/load-typescript.mjs";

const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());
const client = new pg.Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
const id = `math-integration-${randomUUID()}`;
const today = "2026-10-08";
let created = false;
try {
  await client.connect();
  // A closed, synthetic fixture is excluded from the public roster. Existing
  // students are never written. Deleting this fixture cascades its test state.
  await client.query('INSERT INTO public."Youth" ("id","name","updatedAt","caseClosedDate") VALUES ($1,$2,now(),$3)', [id, "DB integration fixture", today]);
  created = true;
  const { getStudents } = loadTypeScript("src/app/server/students.ts");
  assert.equal((await getStudents()).some(student => student.id === id), false);
  const { getProgress, saveProgressAction } = loadTypeScript("src/app/server/progress.ts");
  assert.equal((await getProgress(id)).stars, 0);
  await saveProgressAction(id, { type: "practice", index: 0, answer: "d", date: today }, today);
  assert.equal((await getProgress(id)).stars, 0);
  const first = { type: "practice", index: 0, answer: "a", date: today };
  await Promise.all([saveProgressAction(id, first, today), saveProgressAction(id, first, today)]);
  assert.equal((await getProgress(id)).stars, 1);
  for (const [index, answer] of ["a", "b", "c", "d", "b", "d"].entries()) await saveProgressAction(id, { type: "practice", index, answer, date: today }, today);
  await saveProgressAction(id, { type: "coupon" }, today);
  await saveProgressAction(id, { type: "reflection", value: "integration-check" }, today);
  for (const [index, answer] of ["b", "c", "b"].entries()) await saveProgressAction(id, { type: "test", index, answer }, today);
  const reloaded = await getProgress(id);
  assert.equal(reloaded.stars, 6); assert.equal(reloaded.couponClaimed, true);
  assert.deepEqual(reloaded.completedDays, [today]); assert.deepEqual(reloaded.testAnswers, ["b", "c", "b"]);
  assert.equal(reloaded.reflection, "integration-check");
  await assert.rejects(saveProgressAction(id, { type: "test", index: 0, answer: "a" }, today));
  const security = await client.query('SELECT c.relrowsecurity AS rls, has_table_privilege(\'anon\', c.oid, \'SELECT\') AS anon_read, has_table_privilege(\'authenticated\', c.oid, \'UPDATE\') AS authenticated_write FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=\'public\' AND c.relname=\'MathLearningProgress\'');
  assert.deepEqual(security.rows, [{ rls: true, anon_read: false, authenticated_write: false }]);
  console.log("Live DB checks passed: roster, grading, concurrent retry, persistence, coupon, reflection, immutable test, private table.");
} catch {
  console.error("Live DB integration check failed.");
  process.exitCode = 1;
} finally {
  if (created) {
    await client.query('DELETE FROM public."Youth" WHERE "id"=$1', [id]);
    const remaining = await client.query('SELECT 1 FROM public."MathLearningProgress" WHERE "studentId"=$1', [id]);
    assert.equal(remaining.rowCount, 0);
    console.log("Synthetic fixture and its test records removed.");
  }
  await client.end();
}
