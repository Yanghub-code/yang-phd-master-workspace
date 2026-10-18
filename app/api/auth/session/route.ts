import { getOwner, sessionUser } from "../../_lib/auth";

export async function GET(request: Request) {
  try {
    const [owner, user] = await Promise.all([getOwner(), sessionUser(request)]);
    return Response.json({ authenticated: Boolean(user), username: user?.username ?? null, hasAccount: Boolean(owner) });
  } catch {
    return Response.json({ error: "工作台账户服务暂不可用。" }, { status: 503 });
  }
}
