import { clearSessionResponse, deleteCurrentSession } from "../../_lib/auth";

export async function POST(request: Request) {
  try {
    await deleteCurrentSession(request);
  } catch { /* Always clear the browser session cookie. */ }
  return clearSessionResponse({ hasAccount: true });
}
