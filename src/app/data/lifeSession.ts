import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import {
  createSupabaseAdminHeaders,
  getSupabaseAdminConfig,
} from "./supabaseAdmin";

const COOKIE = "student-life-session";
const ADMIN_SESSION_MS = 60 * 60 * 1000;
const STUDENT_SESSION_MS = 20 * 60 * 1000;
const CLIENT_LOGIN_LIMIT = 5;
const GLOBAL_LOGIN_LIMIT = 20;

type LifeSession =
  | { role: "admin"; expires: number }
  | { role: "student"; studentId: string; expires: number };

type SessionRow = {
  role?: unknown;
  studentId?: unknown;
  expiresAt?: unknown;
};

export class LifeAuthError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}

export function lifePasswordIsConfigured() {
  return (
    typeof process.env.LIFE_ADMIN_PASSWORD === "string" &&
    process.env.LIFE_ADMIN_PASSWORD.length > 0 &&
    (process.env.AUTH_SECRET?.length ?? 0) >= 32
  );
}

export function lifeIsConfigured() {
  return (
    lifePasswordIsConfigured() &&
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
  );
}

function passwordDigest(value: string) {
  return createHmac("sha256", process.env.AUTH_SECRET!)
    .update(`life-admin-password:${value}`)
    .digest();
}

function correctPassword(password: string) {
  if (!lifePasswordIsConfigured()) return false;
  return timingSafeEqual(
    passwordDigest(password),
    passwordDigest(process.env.LIFE_ADMIN_PASSWORD!),
  );
}

export function verifyLifeAdminPassword(password: string) {
  if (!correctPassword(password)) {
    throw new LifeAuthError("비밀번호를 확인해 주세요.", 401);
  }
}

function loginClientHash(request: Request) {
  const clientAddress =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return createHmac("sha256", process.env.AUTH_SECRET!)
    .update(`life-login-client:${clientAddress}`)
    .digest("hex");
}

function globalLoginHash() {
  return createHmac("sha256", process.env.AUTH_SECRET!)
    .update("life-login-global")
    .digest("hex");
}

async function registerLoginAttempt(
  clientHash: string,
  succeeded: boolean,
  maxFailures: number,
) {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const endpoint = new URL(
    "/rest/v1/rpc/register_student_life_login_attempt",
    url,
  );
  const response = await fetch(endpoint, {
    method: "POST",
    headers: createSupabaseAdminHeaders(serviceRoleKey, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      p_client_hash: clientHash,
      p_succeeded: succeeded,
      p_max_failures: maxFailures,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new LifeAuthError(
      "로그인 보안을 확인하지 못했어요. 다시 시도해 주세요.",
    );
  }
  const blockedUntil: unknown = await response.json().catch(() => undefined);
  if (blockedUntil === null) return null;
  if (
    typeof blockedUntil !== "string" ||
    !Number.isFinite(Date.parse(blockedUntil))
  ) {
    throw new LifeAuthError(
      "로그인 보안을 확인하지 못했어요. 다시 시도해 주세요.",
    );
  }
  return Date.parse(blockedUntil);
}

export async function verifyLifeAdminPasswordForRequest(
  request: Request,
  password: string,
) {
  const succeeded = correctPassword(password);
  const globalBlockedUntil = await registerLoginAttempt(
    globalLoginHash(),
    succeeded,
    GLOBAL_LOGIN_LIMIT,
  );
  if (globalBlockedUntil !== null && globalBlockedUntil > Date.now()) {
    throw new LifeAuthError("잠시 후 다시 로그인해 주세요.", 429);
  }
  const clientBlockedUntil = await registerLoginAttempt(
    loginClientHash(request),
    succeeded,
    CLIENT_LOGIN_LIMIT,
  );
  if (clientBlockedUntil !== null && clientBlockedUntil > Date.now()) {
    throw new LifeAuthError("잠시 후 다시 로그인해 주세요.", 429);
  }
  verifyLifeAdminPassword(password);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionEndpoint(token?: string) {
  const { url } = getSupabaseAdminConfig();
  const endpoint = new URL("/rest/v1/StudentLifeSession", url);
  if (token) endpoint.searchParams.set("tokenHash", `eq.${tokenHash(token)}`);
  return endpoint;
}

function parseSessionRow(value: unknown): LifeSession | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as SessionRow;
  if (typeof row.expiresAt !== "string") return null;
  const expires = Date.parse(row.expiresAt);
  if (!Number.isFinite(expires) || expires <= Date.now()) return null;
  if (row.role === "admin" && row.studentId === null) {
    return { role: "admin", expires };
  }
  if (
    row.role === "student" &&
    typeof row.studentId === "string" &&
    row.studentId
  ) {
    return { role: "student", studentId: row.studentId, expires };
  }
  return null;
}

async function createSession(session: LifeSession) {
  const token = randomBytes(32).toString("base64url");
  const { serviceRoleKey } = getSupabaseAdminConfig();
  const response = await fetch(sessionEndpoint(), {
    method: "POST",
    headers: createSupabaseAdminHeaders(serviceRoleKey, {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify({
      tokenHash: tokenHash(token),
      role: session.role,
      studentId: session.role === "student" ? session.studentId : null,
      expiresAt: new Date(session.expires).toISOString(),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new LifeAuthError(
      "관리자 세션을 만들지 못했어요. 다시 시도해 주세요.",
    );
  }
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // Session cookie: closing the browser always requires the password again.
  });
}

async function deleteSession(token: string, requireAdmin = false) {
  const { serviceRoleKey } = getSupabaseAdminConfig();
  const response = await fetch(sessionEndpoint(token), {
    method: "DELETE",
    headers: createSupabaseAdminHeaders(serviceRoleKey, {
      Prefer: "return=representation",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new LifeAuthError(
      "로그아웃을 확인하지 못했어요. 다시 시도해 주세요.",
    );
  }
  const deleted: unknown = await response.json().catch(() => null);
  if (
    requireAdmin &&
    (!Array.isArray(deleted) ||
      deleted.length !== 1 ||
      (deleted[0] as SessionRow | undefined)?.role !== "admin")
  ) {
    throw new LifeAuthError(
      "관리자 로그인이 만료됐어요. 다시 로그인해 주세요.",
      401,
    );
  }
}

export async function loginLifeAdmin(password: string) {
  verifyLifeAdminPassword(password);
  await clearLifeSession();
  await createSession({
    role: "admin",
    expires: Date.now() + ADMIN_SESSION_MS,
  });
}

export async function getLifeSession(): Promise<LifeSession | null> {
  if (!lifeIsConfigured()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;

  const { serviceRoleKey } = getSupabaseAdminConfig();
  const endpoint = sessionEndpoint(token);
  endpoint.searchParams.set("select", "role,studentId,expiresAt");
  endpoint.searchParams.set("limit", "1");
  const response = await fetch(endpoint, {
    headers: createSupabaseAdminHeaders(serviceRoleKey),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new LifeAuthError(
      "관리자 세션을 확인하지 못했어요. 다시 시도해 주세요.",
    );
  }
  const rows: unknown = await response.json().catch(() => null);
  const session =
    Array.isArray(rows) && rows.length === 1 ? parseSessionRow(rows[0]) : null;
  if (!session) cookieStore.delete(COOKIE);
  return session;
}

export async function revokeLifeAdminSession() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE)?.value;
  if (!adminToken) {
    throw new LifeAuthError(
      "관리자 로그인이 만료됐어요. 다시 로그인해 주세요.",
      401,
    );
  }
  try {
    await deleteSession(adminToken, true);
  } finally {
    cookieStore.delete(COOKIE);
  }
}

export async function createLifeStudentSession(studentId: string) {
  await createSession({
    role: "student",
    studentId,
    expires: Date.now() + STUDENT_SESSION_MS,
  });
}

export async function clearLifeSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  try {
    if (token) await deleteSession(token);
  } finally {
    cookieStore.delete(COOKIE);
  }
}
