import "server-only";
import { openYouthJson, readYouthDataKeys, sealYouthJson } from "./youthEncryptionCore";

export class DataError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

export async function databaseRequest(path: string, params: Record<string, string> = {}, options: { method?: string; body?: unknown; prefer?: string } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new DataError("DB 연결 설정을 확인해 주세요.", 503);
  const endpoint = new URL(`/rest/v1/${path}`, url);
  Object.entries(params).forEach(([name, value]) => endpoint.searchParams.set(name, value));
  const keys = readYouthDataKeys();
  let body = options.body;
  if (path === "MathLearningProgress" && keys && body && typeof body === "object" && "progress" in body) {
    body = { ...body, progress: sealYouthJson((body as Record<string, unknown>).progress, "MathLearningProgress.progress", keys) };
  }
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: options.method ?? "GET",
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json", "Content-Type": "application/json", ...(options.prefer ? { Prefer: options.prefer } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw new DataError("DB에 연결하지 못했습니다. 다시 시도해 주세요."); }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new DataError("기록을 불러오거나 저장하지 못했습니다.");
  if (path === "MathLearningProgress" && Array.isArray(payload)) return payload.map(row => {
    if (!row || typeof row !== "object" || !("progress" in row)) return row;
    if (keys && !keys.migrating && (!row.progress || typeof row.progress !== "object" || !("$youthEncrypted" in row.progress))) throw new DataError("학습 기록의 암호화 상태를 확인해 주세요.", 503);
    return { ...row, progress: openYouthJson(row.progress, "MathLearningProgress.progress", keys) };
  });
  return payload;
}

export async function databaseRows(path: string, params: Record<string, string> = {}) {
  const all: Record<string, unknown>[] = [];
  for (let offset = 0; offset < 50000; offset += 1000) {
    const rows = await databaseRequest(path, { ...params, limit: "1000", offset: String(offset) });
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== "object")) throw new DataError("DB 응답을 확인하지 못했습니다.");
    all.push(...rows);
    if (rows.length < 1000) return all;
  }
  throw new DataError("명단을 모두 불러오지 못했습니다.");
}
