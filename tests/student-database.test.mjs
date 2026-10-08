import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { emptyStudentProgress } = loadTypeScript("src/app/studentProgress.ts");
const { applyProgressAction, parseProgressAction, parseStudentProgressRequest, isStudentProgress } = loadTypeScript("src/app/server/progressRules.ts");
const { createSessionToken, readSessionToken, SESSION_SECONDS } = loadTypeScript("src/app/server/sessionToken.ts");
const { getProgress, saveProgressAction } = loadTypeScript("src/app/server/progress.ts");
const { isSameOrigin } = loadTypeScript("src/app/server/requestOrigin.ts");
const date = "2026-10-08";
const practiceAnswers = ["a", "b", "c", "d", "b", "d"];
test("a stale tab cannot write into the student selected in another tab", () => {
  const action = { type: "practice", index: 0, answer: "a", date };
  assert.deepEqual(parseStudentProgressRequest({ studentId: "a", action }, "a"), action);
  assert.throws(() => parseStudentProgressRequest({ studentId: "a", action }, "b"), error => error.status === 409);
  assert.throws(() => parseStudentProgressRequest({ action }, "b"), error => error.status === 409);
});
test("same-origin check supports a proxy's internal URL and rejects cross-site writes", () => {
  const request = headers => new Request("http://localhost:3000/api/student-session", { headers });
  assert.equal(isSameOrigin(request({ host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" })), true);
  assert.equal(isSameOrigin(request({ host: "app.example", origin: "https://app.example" })), true);
  assert.equal(isSameOrigin(request({ host: "app.example", origin: "https://other.example" })), false);
  assert.equal(isSameOrigin(request({ host: "app.example" })), false);
  assert.equal(isSameOrigin(request({ host: "app.example", origin: "null" })), false);
  assert.equal(isSameOrigin(request({ host: "app.example", origin: "https://app.example", "sec-fetch-site": "cross-site" })), false);
});
function completed() {
  return practiceAnswers.reduce((progress, answer, index) => applyProgressAction(progress, { type: "practice", index, answer, date }, date).progress, emptyStudentProgress());
}

test("server grades practice, rejects skipping, and retries without duplicate stars", () => {
  const initial = emptyStudentProgress();
  assert.throws(() => applyProgressAction(initial, { type: "practice", index: 2, answer: "c", date }, date));
  const wrong = applyProgressAction(initial, { type: "practice", index: 0, answer: "d", date }, date);
  assert.equal(wrong.correct, false); assert.equal(wrong.progress, initial);
  const right = applyProgressAction(initial, { type: "practice", index: 0, answer: "a", date }, date);
  assert.equal(right.correct, true); assert.equal(right.progress.stars, 1);
  assert.equal(applyProgressAction(right.progress, { type: "practice", index: 0, answer: "a", date }, date).progress, right.progress);
  const done = completed(); assert.equal(done.stars, 6); assert.deepEqual(done.completedDays, [date]); assert.ok(isStudentProgress(done));
});

test("coupon and test require completion; test submissions are ordered and immutable", () => {
  assert.throws(() => applyProgressAction(emptyStudentProgress(), { type: "coupon" }, date));
  assert.throws(() => applyProgressAction(emptyStudentProgress(), { type: "test", index: 0, answer: "b" }, date));
  const done = completed(); const coupon = applyProgressAction(done, { type: "coupon" }, date).progress;
  assert.equal(coupon.couponClaimed, true); assert.equal(applyProgressAction(coupon, { type: "coupon" }, date).progress, coupon);
  assert.throws(() => applyProgressAction(done, { type: "test", index: 1, answer: "c" }, date));
  const first = applyProgressAction(done, { type: "test", index: 0, answer: "a" }, date).progress;
  assert.equal(first.testAnswers[0], "a"); assert.equal(first.testDate, date);
  assert.equal(applyProgressAction(first, { type: "test", index: 0, answer: "a" }, date).progress, first);
  assert.throws(() => applyProgressAction(first, { type: "test", index: 0, answer: "b" }, date));
});

test("malformed inputs and invalid persisted states are rejected", () => {
  for (const input of [null, [], { type: "practice", index: 0, answer: "bad", date }, { type: "practice", index: -1, answer: "a", date }, { type: "practice", index: 0, answer: "a", date: "2026-10-17" }, { type: "reflection", value: "x".repeat(301) }]) assert.throws(() => parseProgressAction(input));
  assert.ok(isStudentProgress(emptyStudentProgress()));
  assert.equal(isStudentProgress({ ...emptyStudentProgress(), couponClaimed: true }), false);
  assert.equal(isStudentProgress({ ...emptyStudentProgress(), testAnswers: ["b", null, null] }), false);
  assert.equal(isStudentProgress({ ...completed(), testAnswers: [null, "c", null] }), false);
  assert.equal(isStudentProgress({ ...emptyStudentProgress(), completedDays: ["2026-02-30"] }), false);
});

test("signed session rejects tampering, malformed signatures and expiry", () => {
  const before = process.env.AUTH_SECRET; process.env.AUTH_SECRET = "test-secret-".repeat(8);
  try {
    const now = 100000; const token = createSessionToken("student-a", now);
    assert.equal(readSessionToken(token, now), "student-a");
    assert.equal(readSessionToken(token, now + SESSION_SECONDS * 1000), null);
    assert.equal(readSessionToken(token.replace(/^./, "z"), now), null);
    assert.equal(readSessionToken(token + ".extra", now), null);
    assert.equal(readSessionToken("payload.x", now), null);
    assert.equal(readSessionToken(undefined, now), null);
  } finally { if (before === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = before; }
});

async function withDatabase(run) {
  const originalFetch = globalThis.fetch;
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://database.invalid"; process.env.SUPABASE_SERVICE_ROLE_KEY = "unit-test-key";
  const rows = new Map();
  globalThis.fetch = async (input, init) => {
    const url = new URL(input); assert.equal(url.pathname, "/rest/v1/MathLearningProgress");
    const studentId = url.searchParams.get("studentId")?.slice(3);
    let result;
    if (init.method === "POST") {
      const body = JSON.parse(init.body); result = rows.has(body.studentId) ? [] : [body];
      if (result.length) rows.set(body.studentId, body);
    } else if (init.method === "PATCH") {
      const row = rows.get(studentId); const version = Number(url.searchParams.get("version").slice(3));
      result = row?.version === version ? [{ ...row, ...JSON.parse(init.body) }] : [];
      if (result.length) rows.set(studentId, result[0]);
    } else result = rows.has(studentId) ? [rows.get(studentId)] : [];
    return Response.json(structuredClone(result));
  };
  try { await run(rows); }
  finally {
    globalThis.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
}

test("persisted progress reloads per student and concurrent retries award once", async () => withDatabase(async rows => {
  assert.equal((await getProgress("a")).stars, 0);
  const action = { type: "practice", index: 0, answer: "a", date };
  await Promise.all([saveProgressAction("a", action, date), saveProgressAction("a", action, date)]);
  assert.equal((await getProgress("a")).stars, 1); assert.equal(rows.get("a").version, 1);
  assert.equal((await getProgress("b")).stars, 0);
  await saveProgressAction("a", { type: "practice", index: 1, answer: "b", date }, date);
  assert.equal((await getProgress("a")).stars, 2); assert.equal(rows.get("a").version, 2);
  assert.equal((await getProgress("b")).stars, 0);
}));

test("database failure does not report a saved answer", async () => withDatabase(async () => {
  globalThis.fetch = async () => Response.json({ error: "failed" }, { status: 503 });
  await assert.rejects(saveProgressAction("a", { type: "practice", index: 0, answer: "a", date }, date));
}));
