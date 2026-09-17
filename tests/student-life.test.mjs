import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function loadTs(path, mocks = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (name) => (Object.hasOwn(mocks, name) ? mocks[name] : require(name)),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const mood = loadTs("src/app/life/mood.ts");
const entry = (date, score, extra = {}) => ({
  studentId: "student-a",
  recordedOn: date,
  score,
  wantsTalk: false,
  careStatus: "pending",
  updatedAt: "2026-09-17T00:00:00Z",
  ...extra,
});
const today = "2026-09-17";

test("private records are absent from the initial DOM, including screen reader content", () => {
  const PrivateRecords = loadTs("src/app/life/PrivateRecords.tsx", {
    "./life.module.css": { default: {} },
  }).default;
  const html = renderToStaticMarkup(
    createElement(
      PrivateRecords,
      { onReveal: async () => true },
      createElement("p", { "aria-label": "private-sentinel" }, "개인 점수 0점"),
    ),
  );
  assert.ok(html.includes("기록 보기"));
  assert.ok(html.includes('aria-expanded="false"'));
  assert.ok(!html.includes("private-sentinel"));
  assert.ok(!html.includes("개인 점수"));
});

test("all six integer scores, including zero, are accepted; malformed values are rejected", () => {
  for (let score = 0; score <= 5; score++)
    assert.equal(mood.isMoodScore(score), true);
  for (const score of [-1, 6, 2.5, "0", null, undefined, NaN, Infinity])
    assert.equal(mood.isMoodScore(score), false);
});
test("day boundaries use Korea time even across months and years", () => {
  assert.equal(mood.koreanDate(new Date("2026-12-31T14:59:59Z")), "2026-12-31");
  assert.equal(mood.koreanDate(new Date("2026-12-31T15:00:00Z")), "2027-01-01");
  assert.deepEqual(mood.recentDates("2026-03-01", 3), [
    "2026-02-27",
    "2026-02-28",
    "2026-03-01",
  ]);
});
test("no entry is different from zero; old low moods do not become current alerts", () => {
  assert.deepEqual(mood.careReasons([], today), []);
  assert.deepEqual(mood.careReasons([entry(today, 0)], today), ["최근 0~1점"]);
  assert.deepEqual(mood.careReasons([entry("2026-09-14", 0)], today), []);
});
test("three consecutive calendar days, not three sparse observations, trigger the sustained-low suggestion", () => {
  assert.ok(
    mood
      .careReasons(
        [entry("2026-09-15", 2), entry("2026-09-16", 2), entry(today, 2)],
        today,
      )
      .includes("3일 연속 2점 이하"),
  );
  assert.deepEqual(
    mood.careReasons(
      [entry("2026-09-12", 2), entry("2026-09-16", 2), entry(today, 2)],
      today,
    ),
    [],
  );
});
test("a two-point drop is flagged only against a recent prior observation", () => {
  assert.deepEqual(
    mood.careReasons([entry("2026-09-16", 5), entry(today, 3)], today),
    ["이전 기록보다 2점 이상 하락"],
  );
  assert.deepEqual(
    mood.careReasons([entry("2026-09-01", 5), entry(today, 3)], today),
    [],
  );
});
test("unresolved talk requests remain visible even after time passes; completion clears the suggestion", () => {
  assert.deepEqual(
    mood.careReasons([entry("2026-08-01", 4, { wantsTalk: true })], today),
    ["대화 요청"],
  );
  assert.deepEqual(
    mood.careReasons(
      [entry(today, 0, { wantsTalk: true, careStatus: "done" })],
      today,
    ),
    [],
  );
});
test("student identity never relies on names and records are chronologically ordered", () => {
  const entries = [
    entry(today, 2),
    entry("2026-09-16", 4, { studentId: "student-b" }),
    entry("2026-09-15", 5),
  ];
  assert.deepEqual(
    mood.studentEntries(entries, "student-a").map((item) => item.score),
    [5, 2],
  );
});

test("hidden life students are excluded from the roster and direct lookup", async () => {
  const oldFetch = globalThis.fetch;
  const requests = [];
  const youth = [
    { id: "student-hidden", name: "숨김 학생" },
    { id: "student-visible", name: "표시 학생" },
  ];
  globalThis.fetch = async (url, options = {}) => {
    const endpoint = new URL(url);
    requests.push({
      path: endpoint.pathname,
      studentId: endpoint.searchParams.get("id"),
    });
    assert.equal(options.method, "GET");
    assert.equal(options.cache, "no-store");
    if (endpoint.pathname === "/rest/v1/StudentLifeHiddenYouth") {
      return Response.json([{ studentId: "student-hidden" }]);
    }
    if (endpoint.pathname === "/rest/v1/Youth") {
      const filter = endpoint.searchParams.get("id");
      const studentId = filter?.startsWith("eq.") ? filter.slice(3) : undefined;
      return Response.json(
        youth.filter((student) => !studentId || student.id === studentId),
      );
    }
    throw new Error(`Unexpected student life request: ${endpoint.pathname}`);
  };
  const studentLife = loadTs("src/app/data/studentLife.ts", {
    "server-only": {},
    "./supabaseAdmin": {
      getSupabaseAdminConfig: () => ({
        url: "https://student-life.test",
        serviceRoleKey: "test-service-key",
      }),
      createSupabaseAdminHeaders: (_key, extras) => new Headers(extras),
    },
    "../life/mood": mood,
  });
  try {
    assert.deepEqual(await studentLife.getLifeStudents(), [
      { id: "student-visible", name: "표시 학생" },
    ]);

    requests.length = 0;
    assert.deepEqual(await studentLife.getLifeStudents("student-hidden"), []);
    assert.deepEqual(
      requests.map((request) => request.path),
      ["/rest/v1/StudentLifeHiddenYouth"],
      "a hidden direct lookup must stop before querying the youth roster",
    );

    requests.length = 0;
    assert.deepEqual(await studentLife.getLifeStudents("student-visible"), [
      { id: "student-visible", name: "표시 학생" },
    ]);
    assert.deepEqual(
      requests.map((request) => [request.path, request.studentId]),
      [
        ["/rest/v1/StudentLifeHiddenYouth", null],
        ["/rest/v1/Youth", "eq.student-visible"],
      ],
    );
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("API requires the password every login and revokes server sessions before student input", async () => {
  const envKeys = [
    "AUTH_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "LIFE_ADMIN_PASSWORD",
  ];
  const oldEnv = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  );
  process.env.AUTH_SECRET = "test-only-auth-secret-at-least-32-characters";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.LIFE_ADMIN_PASSWORD = "5884";
  const oldFetch = globalThis.fetch;
  const jar = new Map();
  const cookieOptions = [];
  const serverSessions = new Map();
  const sessionEvents = [];
  const loginAttempts = new Map();
  const loginAttemptEvents = [];
  let sessionDeleteFails = false;
  globalThis.fetch = async (url, options = {}) => {
    const endpoint = new URL(url);
    if (
      endpoint.pathname === "/rest/v1/rpc/register_student_life_login_attempt"
    ) {
      assert.equal(options.method, "POST");
      const attempt = JSON.parse(options.body);
      assert.match(attempt.p_client_hash, /^[0-9a-f]{64}$/);
      assert.equal(typeof attempt.p_succeeded, "boolean");
      assert.ok([5, 20].includes(attempt.p_max_failures));
      const previous = loginAttempts.get(attempt.p_client_hash);
      if (previous) assert.equal(previous.maxFailures, attempt.p_max_failures);
      if (
        previous?.blockedUntil &&
        Date.parse(previous.blockedUntil) > Date.now()
      ) {
        loginAttemptEvents.push({
          clientHash: attempt.p_client_hash,
          succeeded: attempt.p_succeeded,
          blocked: true,
          maxFailures: attempt.p_max_failures,
        });
        return Response.json(previous.blockedUntil);
      }
      if (attempt.p_succeeded) {
        loginAttempts.delete(attempt.p_client_hash);
        loginAttemptEvents.push({
          clientHash: attempt.p_client_hash,
          succeeded: true,
          blocked: false,
          maxFailures: attempt.p_max_failures,
        });
        return Response.json(null);
      }
      const failedCount = (previous?.failedCount ?? 0) + 1;
      const blockedUntil =
        failedCount >= attempt.p_max_failures
          ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
          : null;
      loginAttempts.set(attempt.p_client_hash, {
        failedCount,
        blockedUntil,
        maxFailures: attempt.p_max_failures,
      });
      loginAttemptEvents.push({
        clientHash: attempt.p_client_hash,
        succeeded: false,
        blocked: blockedUntil !== null,
        maxFailures: attempt.p_max_failures,
      });
      return Response.json(blockedUntil);
    }
    assert.equal(endpoint.pathname, "/rest/v1/StudentLifeSession");
    const method = options.method ?? "GET";
    if (method === "POST") {
      const row = JSON.parse(options.body);
      assert.match(row.tokenHash, /^[0-9a-f]{64}$/);
      assert.ok(!JSON.stringify(row).includes("5884"));
      serverSessions.set(row.tokenHash, row);
      sessionEvents.push(`create:${row.role}`);
      return new Response(null, { status: 201 });
    }
    const filter = endpoint.searchParams.get("tokenHash");
    const hash = filter?.startsWith("eq.") ? filter.slice(3) : "";
    if (method === "DELETE") {
      if (sessionDeleteFails) {
        sessionEvents.push("delete-failed");
        return Response.json({}, { status: 503 });
      }
      const deleted = serverSessions.get(hash);
      serverSessions.delete(hash);
      sessionEvents.push(`delete:${deleted?.role ?? "missing"}`);
      return Response.json(deleted ? [deleted] : []);
    }
    if (method === "GET") {
      const row = serverSessions.get(hash);
      return Response.json(row ? [row] : []);
    }
    throw new Error(`Unexpected session request: ${method}`);
  };
  const session = loadTs("src/app/data/lifeSession.ts", {
    "server-only": {},
    "./supabaseAdmin": {
      getSupabaseAdminConfig: () => ({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }),
      createSupabaseAdminHeaders: (_key, extras) => new Headers(extras),
    },
    "next/headers": {
      cookies: async () => ({
        get: (key) => (jar.has(key) ? { value: jar.get(key) } : undefined),
        set: (key, value, options) => {
          jar.set(key, value);
          cookieOptions.push(options);
        },
        delete: (key) => jar.delete(key),
      }),
    },
  });
  const students = [
    { id: "student-a", name: "동명이인" },
    { id: "student-b", name: "동명이인" },
  ];
  const records = [
    entry(mood.koreanDate(), 4),
    entry(mood.koreanDate(), 1, { studentId: "student-b" }),
    entry(mood.koreanDate(), 0, { studentId: "student-hidden" }),
  ];
  const unavailableStudentIds = new Set();
  const calls = [];
  class LifeDataError extends Error {}
  const routes = loadTs("src/app/api/life/route.ts", {
    "../../data/lifeSession": session,
    "../../life/mood": mood,
    "../../data/studentLife": {
      LifeDataError,
      getLifeStudents: async (id) =>
        students.filter(
          (item) =>
            (!id || item.id === id) && !unavailableStudentIds.has(item.id),
        ),
      getMoodEntries: async (id) =>
        records.filter((item) => !id || item.studentId === id),
      mutateMood: async (name, body) => {
        calls.push({ name, body });
        return entry(body.p_recorded_on, body.p_score, {
          studentId: body.p_student_id,
          wantsTalk: body.p_wants_talk,
        });
      },
    },
  });
  const post = (body, origin = "https://local.test", extraHeaders = {}) =>
    routes.POST(
      new Request("https://local.test/api/life", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...extraHeaders,
        },
        body: JSON.stringify(body),
      }),
    );
  const login = { action: "login", password: "5884" };
  try {
    assert.equal((await routes.GET()).status, 401);
    assert.equal((await post(login, "https://other.test")).status, 403);
    for (const password of ["123", "12345", "12a4"])
      assert.equal((await post({ ...login, password })).status, 400);
    assert.equal(
      loginAttemptEvents.length,
      0,
      "malformed passwords must not reach the throttle RPC",
    );
    for (const attempt of [
      { action: "login", password: "0000" },
      { action: "demoLogin", password: "1111" },
      { action: "login", password: "2222" },
      { action: "demoLogin", password: "3333" },
    ])
      assert.equal((await post(attempt)).status, 401);
    assert.equal(
      (await post({ action: "login", password: "4444" })).status,
      429,
    );
    assert.equal(
      (await post(login)).status,
      429,
      "the correct password stays blocked during the cooldown",
    );
    const globalEvents = loginAttemptEvents.filter(
      (attempt) => attempt.maxFailures === 20,
    );
    const clientEvents = loginAttemptEvents.filter(
      (attempt) => attempt.maxFailures === 5,
    );
    assert.equal(globalEvents.length, 6);
    assert.equal(clientEvents.length, 6);
    assert.equal(
      new Set(globalEvents.map((attempt) => attempt.clientHash)).size,
      1,
    );
    assert.equal(
      new Set(clientEvents.map((attempt) => attempt.clientHash)).size,
      1,
    );
    assert.notEqual(globalEvents[0].clientHash, clientEvents[0].clientHash);
    assert.equal(jar.size, 0);
    assert.equal(serverSessions.size, 0);

    // Isolate the global limiter: spoofing a fresh client address each time
    // must not evade its shared 20-attempt ceiling.
    loginAttempts.clear();
    loginAttemptEvents.length = 0;
    for (let index = 1; index < 20; index++) {
      assert.equal(
        (
          await post(
            { action: index % 2 ? "login" : "demoLogin", password: "0000" },
            undefined,
            { "x-forwarded-for": `203.0.113.${index}` },
          )
        ).status,
        401,
      );
    }
    assert.equal(
      (
        await post({ action: "login", password: "0000" }, undefined, {
          "x-forwarded-for": "203.0.113.20",
        })
      ).status,
      429,
    );
    assert.equal(
      (
        await post(login, undefined, {
          "x-forwarded-for": "203.0.113.250",
        })
      ).status,
      429,
      "a spoofed client address must not bypass the global cooldown",
    );
    const spoofedGlobalEvents = loginAttemptEvents.filter(
      (attempt) => attempt.maxFailures === 20,
    );
    const spoofedClientEvents = loginAttemptEvents.filter(
      (attempt) => attempt.maxFailures === 5,
    );
    assert.equal(spoofedGlobalEvents.length, 21);
    assert.equal(
      new Set(spoofedGlobalEvents.map((attempt) => attempt.clientHash)).size,
      1,
    );
    assert.equal(spoofedClientEvents.length, 19);
    assert.equal(
      new Set(spoofedClientEvents.map((attempt) => attempt.clientHash)).size,
      19,
    );

    // Simulate both durable cooldowns expiring before the session flow.
    loginAttempts.clear();
    loginAttemptEvents.length = 0;
    assert.equal(
      (await post({ action: "demoLogin", password: "5884" })).status,
      200,
    );
    assert.equal(jar.size, 0);
    assert.equal(
      serverSessions.size,
      0,
      "demo password checks must not create a real administrator session",
    );
    assert.equal((await post(login)).status, 200);
    assert.equal(cookieOptions.at(-1).httpOnly, true);
    assert.equal(cookieOptions.at(-1).sameSite, "strict");
    assert.equal(cookieOptions.at(-1).maxAge, undefined);
    assert.equal(cookieOptions.at(-1).expires, undefined);
    assert.equal(serverSessions.size, 1);
    assert.equal([...serverSessions.values()][0].role, "admin");
    assert.ok(
      !serverSessions.has(jar.get("student-life-session")),
      "the database stores only a hash of the opaque cookie",
    );
    unavailableStudentIds.add("student-b");
    let response = await routes.GET();
    assert.match(response.headers.get("cache-control"), /no-store/);
    const adminView = await response.json();
    assert.deepEqual(
      adminView.students.map((student) => student.id),
      ["student-a"],
    );
    assert.deepEqual(
      adminView.entries.map((record) => record.studentId),
      ["student-a"],
      "administrator responses must omit records for unavailable students",
    );
    unavailableStudentIds.delete("student-b");
    assert.equal(
      (
        await post({
          action: "save",
          score: 5,
          wantsTalk: false,
          recordedOn: mood.koreanDate(),
        })
      ).status,
      403,
    );
    const missingStudentAdminCookie = jar.get("student-life-session");
    assert.equal(
      (await post({ action: "select", studentId: "missing" })).status,
      404,
    );
    assert.equal(jar.size, 0);
    assert.equal(serverSessions.size, 0);
    assert.equal(sessionEvents.at(-1), "delete:admin");
    jar.set("student-life-session", missingStudentAdminCookie);
    assert.equal(
      (await routes.GET()).status,
      401,
      "a failed student lookup must still revoke administrator access",
    );
    assert.equal((await post(login)).status, 200);
    const oldAdminCookie = jar.get("student-life-session");
    assert.equal(
      (await post({ action: "select", studentId: "student-a" })).status,
      200,
    );
    assert.deepEqual(
      sessionEvents.slice(-2),
      ["delete:admin", "create:student"],
      "the administrator session must be revoked before input access is granted",
    );
    assert.equal(serverSessions.size, 1);
    assert.equal([...serverSessions.values()][0].role, "student");
    let studentCookie = jar.get("student-life-session");
    jar.set("student-life-session", oldAdminCookie);
    assert.equal(
      (await routes.GET()).status,
      401,
      "revoked administrator session cannot be replayed",
    );
    jar.set("student-life-session", studentCookie);
    const studentView = await (await routes.GET()).json();
    assert.equal(studentView.role, "student");
    assert.deepEqual(
      studentView.students.map((item) => item.id),
      ["student-a"],
    );
    assert.deepEqual(
      studentView.entries,
      [],
      "student responses must not contain stored scores or graphs",
    );
    assert.equal(studentView.hasRecordedToday, true);

    const sessionEventsBeforeUnavailableGet = sessionEvents.length;
    unavailableStudentIds.add("student-a");
    response = await routes.GET();
    assert.equal(response.status, 401);
    assert.equal(jar.size, 0);
    assert.equal(serverSessions.size, 0);
    assert.deepEqual(
      sessionEvents.slice(sessionEventsBeforeUnavailableGet),
      ["delete:student"],
      "an unavailable student's active session must be revoked",
    );
    unavailableStudentIds.delete("student-a");
    jar.set("student-life-session", studentCookie);
    assert.equal(
      (await routes.GET()).status,
      401,
      "an unavailable student's revoked session cannot be replayed",
    );
    assert.equal((await post(login)).status, 200);
    assert.equal(
      (await post({ action: "select", studentId: "student-a" })).status,
      200,
    );
    studentCookie = jar.get("student-life-session");

    assert.equal(
      (await post({ action: "select", studentId: "student-b" })).status,
      403,
    );
    assert.equal(
      (
        await post({
          action: "care",
          studentId: "student-a",
          recordedOn: mood.koreanDate(),
          careStatus: "done",
        })
      ).status,
      403,
    );
    for (const score of [-1, 6, "0", 2.5])
      assert.equal(
        (
          await post({
            action: "save",
            score,
            wantsTalk: false,
            recordedOn: mood.koreanDate(),
          })
        ).status,
        400,
      );
    assert.equal(
      (
        await post({
          action: "save",
          score: 0,
          wantsTalk: "false",
          recordedOn: mood.koreanDate(),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await post({
          action: "save",
          score: 0,
          wantsTalk: false,
          recordedOn: "2000-01-01",
        })
      ).status,
      409,
    );
    const callsBeforeUnavailableSave = calls.length;
    unavailableStudentIds.add("student-a");
    assert.equal(
      (
        await post({
          action: "save",
          score: 0,
          wantsTalk: true,
          recordedOn: mood.koreanDate(),
        })
      ).status,
      404,
    );
    assert.equal(
      calls.length,
      callsBeforeUnavailableSave,
      "an unavailable student must not reach the save mutation",
    );
    unavailableStudentIds.delete("student-a");
    response = await post({
      action: "save",
      studentId: "student-b",
      score: 0,
      wantsTalk: true,
      recordedOn: mood.koreanDate(),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { saved: true });
    assert.equal(calls.at(-1).body.p_student_id, "student-a");
    jar.set("student-life-session", `${studentCookie.slice(0, -1)}!`);
    assert.equal(
      (await routes.GET()).status,
      401,
      "tampered session must be rejected",
    );
    jar.set("student-life-session", studentCookie);
    assert.equal((await post({ action: "lock" })).status, 200);
    assert.equal((await routes.GET()).status, 401);
    assert.equal(
      (await post({ ...login, password: "0000" })).status,
      401,
      "locking requires the password on the next administrator login",
    );
    assert.equal((await post(login)).status, 200);
    const callsBeforeUnavailableCare = calls.length;
    unavailableStudentIds.add("student-a");
    assert.equal(
      (
        await post({
          action: "care",
          studentId: "student-a",
          recordedOn: mood.koreanDate(),
          careStatus: "done",
        })
      ).status,
      404,
    );
    assert.equal(
      calls.length,
      callsBeforeUnavailableCare,
      "an unavailable student must not reach the care mutation",
    );
    unavailableStudentIds.delete("student-a");
    sessionDeleteFails = true;
    const mutationsBeforeFailure = sessionEvents.length;
    assert.equal(
      (await post({ action: "select", studentId: "student-a" })).status,
      503,
    );
    assert.equal(
      jar.size,
      0,
      "revocation failure must remove local administrator credentials",
    );
    assert.deepEqual(sessionEvents.slice(mutationsBeforeFailure), [
      "delete-failed",
    ]);
    assert.equal(
      [...serverSessions.values()].filter((row) => row.role === "student")
        .length,
      0,
      "revocation failure must not issue student access",
    );
    delete process.env.AUTH_SECRET;
    assert.equal((await routes.GET()).status, 503);
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of envKeys) {
      if (oldEnv[key] === undefined) delete process.env[key];
      else process.env[key] = oldEnv[key];
    }
  }
});
