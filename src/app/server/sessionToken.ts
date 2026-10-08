import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "math-student-session";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("Session secret is not configured");
  return value;
}

export function createSessionToken(studentId: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ studentId, expires: now + SESSION_SECONDS * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readSessionToken(token: string | undefined, now = Date.now()): string | null {
  if (!token || token.length > 1024) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const expected = createHmac("sha256", secret()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.studentId === "string" && data.studentId.length > 0 && data.studentId.length <= 200 && Number.isFinite(data.expires) && data.expires > now ? data.studentId : null;
  } catch { return null; }
}
