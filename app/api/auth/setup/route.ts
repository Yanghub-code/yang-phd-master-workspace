import { asText, createSessionResponse, getDb, getOwner, nowIso, passwordCredentials, setupTokenMatches, validatePassword, validateUsername } from "../../_lib/auth";

export async function POST(request: Request) {
  try {
    if (await getOwner()) return Response.json({ error: "账户已经设置，请直接登录。" }, { status: 409 });
    const payload = await request.json() as Record<string, unknown>;
    const username = asText(payload.username, 32);
    const password = typeof payload.password === "string" ? payload.password : "";
    const setupCode = asText(payload.setupCode, 256);
    if (!(await setupTokenMatches(setupCode))) return Response.json({ error: "初始化码不正确。" }, { status: 403 });
    if (!validateUsername(username)) return Response.json({ error: "账号使用 3–32 位字母、数字、点、下划线或连字符。" }, { status: 400 });
    if (!validatePassword(password)) return Response.json({ error: "密码至少 10 位。" }, { status: 400 });
    const credentials = await passwordCredentials(password);
    const user = { id: crypto.randomUUID(), username };
    const timestamp = nowIso();
    await (await getDb()).prepare("INSERT INTO workspace_users (id, owner_slot, username, password_hash, password_salt, created_at, password_updated_at) VALUES (?, 1, ?, ?, ?, ?, ?)").bind(user.id, user.username, credentials.hash, credentials.salt, timestamp, timestamp).run();
    return createSessionResponse(user, { hasAccount: true });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("UNIQUE") ? "账户已经设置，请直接登录。" : "账户初始化失败，请稍后重试。";
    return Response.json({ error: message }, { status: 500 });
  }
}
