import { asText, checkLoginLock, clearLoginLock, createSessionResponse, getOwner, passwordMatches, registerFailedLogin } from "../../_lib/auth";

export async function POST(request: Request) {
  try {
    if (await checkLoginLock()) return Response.json({ error: "尝试次数过多，请 15 分钟后再试。" }, { status: 429 });
    const payload = await request.json() as Record<string, unknown>;
    const username = asText(payload.username, 32);
    const password = typeof payload.password === "string" ? payload.password : "";
    const owner = await getOwner();
    if (!owner || owner.username !== username || !(await passwordMatches(password, owner.password_salt, owner.password_hash))) {
      await registerFailedLogin();
      return Response.json({ error: "账号或密码不正确。" }, { status: 401 });
    }
    await clearLoginLock();
    return createSessionResponse({ id: owner.id, username: owner.username }, { hasAccount: true });
  } catch {
    return Response.json({ error: "登录服务暂不可用，请稍后重试。" }, { status: 503 });
  }
}
