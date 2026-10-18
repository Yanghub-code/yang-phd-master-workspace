import { asText, getDb, getOwner, passwordCredentials, passwordMatches, requireSession, validatePassword } from "../../_lib/auth";

export async function POST(request: Request) {
  try {
    const current = await requireSession(request);
    if (current instanceof Response) return current;
    const payload = await request.json() as Record<string, unknown>;
    const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
    const nextPassword = typeof payload.nextPassword === "string" ? payload.nextPassword : "";
    if (!validatePassword(nextPassword)) return Response.json({ error: "新密码至少 10 位。" }, { status: 400 });
    const owner = await getOwner();
    if (!owner || owner.id !== current.id || !(await passwordMatches(currentPassword, owner.password_salt, owner.password_hash))) return Response.json({ error: "当前密码不正确。" }, { status: 401 });
    const credentials = await passwordCredentials(nextPassword);
    await (await getDb()).prepare("UPDATE workspace_users SET password_hash = ?, password_salt = ?, password_updated_at = ? WHERE id = ?").bind(credentials.hash, credentials.salt, new Date().toISOString(), current.id).run();
    return Response.json({ ok: true, username: asText(owner.username, 32) });
  } catch {
    return Response.json({ error: "修改密码失败，请稍后重试。" }, { status: 500 });
  }
}
