import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

type Env = Record<string, string | undefined>;
export type YouthDataKeys = { active: string; keys: Record<string, Buffer>; index: Buffer; migrating: boolean };
const prefix = "yd1:";
const jsonMarker = "$youthEncrypted";

export class YouthDataEncryptionError extends Error {
  constructor() { super("청소년 정보 암호화 설정 또는 데이터 무결성을 확인하세요."); this.name = "YouthDataEncryptionError"; }
}

function key(value: unknown) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value)) throw new YouthDataEncryptionError();
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 32 || decoded.toString("base64") !== value) throw new YouthDataEncryptionError();
  return decoded;
}

export function readYouthDataKeys(env: Env = process.env): YouthDataKeys | null {
  const raw = env.YOUTH_DATA_ENCRYPTION_KEYS?.trim();
  const index = env.YOUTH_NAME_INDEX_KEY?.trim();
  if (!raw && !index && env.YOUTH_DATA_ENCRYPTION_REQUIRED !== "true" && env.YOUTH_DATA_ENCRYPTION_MIGRATING !== "true") return null;
  try {
    const parsed = JSON.parse(raw ?? "") as { active: unknown; keys: unknown };
    if (typeof parsed.active !== "string" || !/^[a-zA-Z0-9_-]{1,32}$/.test(parsed.active) || !parsed.keys || typeof parsed.keys !== "object" || Array.isArray(parsed.keys)) throw new YouthDataEncryptionError();
    const keys: Record<string, Buffer> = Object.create(null);
    for (const [id, value] of Object.entries(parsed.keys)) {
      if (!/^[a-zA-Z0-9_-]{1,32}$/.test(id)) throw new YouthDataEncryptionError();
      keys[id] = key(value);
    }
    if (!keys[parsed.active] || Object.keys(keys).length > 8) throw new YouthDataEncryptionError();
    const indexKey = key(index);
    if (Object.values(keys).some(value => value.equals(indexKey))) throw new YouthDataEncryptionError();
    return { active: parsed.active, keys, index: indexKey, migrating: env.YOUTH_DATA_ENCRYPTION_MIGRATING === "true" };
  } catch { throw new YouthDataEncryptionError(); }
}

export function isYouthCiphertext(value: unknown): value is string { return typeof value === "string" && value.startsWith(prefix); }
export function youthFieldIndex(value: string, field: string, keys: YouthDataKeys) {
  return createHmac("sha256", keys.index).update(`youth-field-index:v1:${field}\0`).update(value).digest("hex");
}
export function youthNameIndex(name: string, keys: YouthDataKeys) {
  return createHmac("sha256", keys.index).update("youth-name-index:v1\0").update(name.trim().normalize("NFC")).digest("hex");
}
function aad(field: string) { return Buffer.from(`youth-data:v1:${field}`, "utf8"); }
export function sealYouthBytes(value: Uint8Array, field: string, keys: YouthDataKeys) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", keys.keys[keys.active], iv);
  cipher.setAAD(aad(field));
  const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
  return `${prefix}${keys.active}:${iv.toString("base64url")}:${encrypted.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}`;
}
export function openYouthBytes(value: string, field: string, keys: YouthDataKeys): Buffer {
  try {
    const pieces = value.split(":");
    if (pieces.length !== 5 || pieces[0] !== "yd1" || !keys.keys[pieces[1]] || pieces.slice(2).some(piece => !/^[A-Za-z0-9_-]*$/.test(piece))) throw new YouthDataEncryptionError();
    const iv = Buffer.from(pieces[2], "base64url"), encrypted = Buffer.from(pieces[3], "base64url"), tag = Buffer.from(pieces[4], "base64url");
    if (iv.length !== 12 || tag.length !== 16) throw new YouthDataEncryptionError();
    const decipher = createDecipheriv("aes-256-gcm", keys.keys[pieces[1]], iv);
    decipher.setAAD(aad(field)); decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch { throw new YouthDataEncryptionError(); }
}
export function sealYouthText(value: string, field: string, keys: YouthDataKeys) { return sealYouthBytes(Buffer.from(value, "utf8"), field, keys); }
export function protectYouthText(value: string, field: string) {
  const keys = readYouthDataKeys();
  return keys && value ? sealYouthText(value, field, keys) : value;
}
export function openYouthText(value: string, field: string, keys: YouthDataKeys | null) {
  if (!isYouthCiphertext(value)) {
    if (keys && !keys.migrating && value) throw new YouthDataEncryptionError();
    return value;
  }
  if (!keys) throw new YouthDataEncryptionError();
  return openYouthBytes(value, field, keys).toString("utf8");
}
export function sealYouthJson(value: unknown, field: string, keys: YouthDataKeys) {
  if (value && typeof value === "object" && Object.keys(value).length === 1 && jsonMarker in value) {
    const encrypted = (value as Record<string, unknown>)[jsonMarker];
    if (typeof encrypted !== "string") throw new YouthDataEncryptionError();
    const plain = openYouthText(encrypted, field, keys);
    if (encrypted.startsWith(`${prefix}${keys.active}:`)) return value;
    return { [jsonMarker]: sealYouthText(plain, field, keys) };
  }
  return { [jsonMarker]: sealYouthText(JSON.stringify(value), field, keys) };
}
export function openYouthJson(value: unknown, field: string, keys: YouthDataKeys | null): unknown {
  if (Array.isArray(value)) return value.map(item => openYouthJson(item, field, keys));
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return value;
  const object = value as Record<string, unknown>;
  if (Object.keys(object).length === 1 && typeof object[jsonMarker] === "string") return JSON.parse(openYouthText(object[jsonMarker], field, keys));
  return Object.fromEntries(Object.entries(object).map(([name, item]) => [name, openYouthJson(item, field, keys)]));
}
