export type AuthUser = {
  id: string;
  username: string;
};

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  password_salt: string;
};

type SessionRow = {
  user_id: string;
  username: string;
  expires_at: string;
};

const SESSION_COOKIE = "yang_workspace_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PBKDF2_ITERATIONS = 310_000;

async function runtimeEnv() {
  // Keep the Cloudflare binding behind a runtime import so the static server
  // preview used by the repository test can render ordinary pages in Node.
  // API requests run in the Worker and resolve this import normally.
  const { env } = await import("cloudflare:workers");
  return env as typeof env & { OWNER_SETUP_TOKEN?: string };
}

async function db(): Promise<D1Database> {
  const env = await runtimeEnv();
  if (!env.DB) throw new Error("Cloud database is unavailable.");
  return env.DB as D1Database;
}

export function nowIso() {
  return new Date().toISOString();
}

export function asText(value: unknown, max = 8000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateUsername(value: string) {
  return /^[A-Za-z0-9_.-]{3,32}$/.test(value);
}

export function validatePassword(value: string) {
  return value.length >= 10 && value.length <= 256;
}

function bytesToBase64(bytes: Uint8Array) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function base64ToBytes(value: string) {
  const text = atob(value);
  return Uint8Array.from(text, (char) => char.charCodeAt(0));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

async function derivePasswordHash(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS }, material, 256);
  return bytesToBase64(new Uint8Array(bits));
}

export async function passwordCredentials(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: bytesToBase64(salt), hash: await derivePasswordHash(password, salt) };
}

export async function passwordMatches(password: string, salt: string, expectedHash: string) {
  const actual = await derivePasswordHash(password, base64ToBytes(salt));
  return constantTimeEqual(actual, expectedHash);
}

export async function getOwner(): Promise<UserRow | null> {
  return (await db()).prepare("SELECT id, username, password_hash, password_salt FROM workspace_users ORDER BY created_at ASC LIMIT 1").first<UserRow>();
}

export async function sessionUser(request: Request): Promise<AuthUser | null> {
  const cookieValue = sessionToken(request);
  if (!cookieValue) return null;
  const tokenHash = await sha256(cookieValue);
  const database = await db();
  const row = await database.prepare("SELECT s.user_id, u.username, s.expires_at FROM workspace_sessions s INNER JOIN workspace_users u ON u.id = s.user_id WHERE s.token_hash = ? LIMIT 1").bind(tokenHash).first<SessionRow>();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await database.prepare("DELETE FROM workspace_sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }
  return { id: row.user_id, username: row.username };
}

export async function deleteCurrentSession(request: Request) {
  const token = sessionToken(request);
  if (!token) return;
  await (await db()).prepare("DELETE FROM workspace_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export async function requireSession(request: Request): Promise<AuthUser | Response> {
  const user = await sessionUser(request);
  return user ?? Response.json({ error: "请先登录工作台。" }, { status: 401 });
}

export async function createSessionResponse(user: AuthUser, payload: Record<string, unknown> = {}) {
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  const database = await db();
  await database.batch([
    database.prepare("DELETE FROM workspace_sessions WHERE expires_at <= ?").bind(nowIso()),
    database.prepare("INSERT INTO workspace_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(await sha256(token), user.id, expiresAt, nowIso()),
  ]);
  const response = Response.json({ authenticated: true, username: user.username, expiresAt, ...payload });
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`);
  return response;
}

export function clearSessionResponse(payload: Record<string, unknown> = {}) {
  const response = Response.json({ authenticated: false, ...payload });
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  return response;
}

export async function setupTokenMatches(value: string) {
  const token = String((await runtimeEnv()).OWNER_SETUP_TOKEN || "");
  return Boolean(token) && constantTimeEqual(value, token);
}

export async function checkLoginLock() {
  const row = await (await db()).prepare("SELECT failed_attempts, locked_until FROM login_throttle WHERE scope = 'owner-login' LIMIT 1").first<{ failed_attempts: number; locked_until: string | null }>();
  return Boolean(row?.locked_until && new Date(row.locked_until).getTime() > Date.now());
}

export async function registerFailedLogin() {
  const database = await db();
  const row = await database.prepare("SELECT failed_attempts FROM login_throttle WHERE scope = 'owner-login' LIMIT 1").first<{ failed_attempts: number }>();
  const attempts = (row?.failed_attempts || 0) + 1;
  const lockedUntil = attempts >= 6 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
  await database.prepare("INSERT INTO login_throttle (scope, failed_attempts, locked_until, updated_at) VALUES ('owner-login', ?, ?, ?) ON CONFLICT(scope) DO UPDATE SET failed_attempts = excluded.failed_attempts, locked_until = excluded.locked_until, updated_at = excluded.updated_at").bind(lockedUntil ? 0 : attempts, lockedUntil, nowIso()).run();
}

export async function clearLoginLock() {
  await (await db()).prepare("DELETE FROM login_throttle WHERE scope = 'owner-login'").run();
}

export async function getDb() {
  return db();
}

function parseCookies(header: string) {
  const result: Record<string, string> = {};
  for (const item of header.split(";")) {
    const index = item.indexOf("=");
    if (index < 1) continue;
    const key = item.slice(0, index).trim();
    const value = item.slice(index + 1).trim();
    try { result[key] = decodeURIComponent(value); } catch { result[key] = value; }
  }
  return result;
}

function sessionToken(request: Request) {
  return parseCookies(request.headers.get("Cookie") || "")[SESSION_COOKIE];
}
