import { getDb, requireSession } from "../_lib/auth";

type WorkspaceRow = { payload_json: string; revision: number; updated_at: string };
const MAX_PAYLOAD_BYTES = 900_000;

export async function GET(request: Request) {
  try {
    const user = await requireSession(request);
    if (user instanceof Response) return user;
    const row = await (await getDb()).prepare("SELECT payload_json, revision, updated_at FROM workspace_data WHERE user_id = ? LIMIT 1").bind(user.id).first<WorkspaceRow>();
    if (!row) return Response.json({ workspace: null });
    return Response.json({ workspace: { data: JSON.parse(row.payload_json), revision: row.revision, updatedAt: row.updated_at } });
  } catch {
    return Response.json({ error: "读取云端数据失败。" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireSession(request);
    if (user instanceof Response) return user;
    const payload = await request.json() as { data?: unknown; revision?: unknown };
    if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) return Response.json({ error: "工作台数据格式不正确。" }, { status: 400 });
    const payloadJson = JSON.stringify(payload.data);
    if (new TextEncoder().encode(payloadJson).byteLength > MAX_PAYLOAD_BYTES) return Response.json({ error: "云端记录暂不能超过 900 KB，请先下载备份并精简大段文本。" }, { status: 413 });
    const dataUpdatedAt = typeof (payload.data as { updatedAt?: unknown }).updatedAt === "string" ? (payload.data as { updatedAt: string }).updatedAt : new Date().toISOString();
    const db = await getDb();
    const current = await db.prepare("SELECT revision FROM workspace_data WHERE user_id = ? LIMIT 1").bind(user.id).first<{ revision: number }>();
    const clientRevision = typeof payload.revision === "number" ? payload.revision : 0;
    if (current && clientRevision !== current.revision) return Response.json({ error: "云端数据已在另一台设备更新。", conflict: true, serverRevision: current.revision }, { status: 409 });
    const revision = (current?.revision ?? 0) + 1;
    if (current) {
      await db.prepare("UPDATE workspace_data SET payload_json = ?, revision = ?, updated_at = ? WHERE user_id = ?").bind(payloadJson, revision, dataUpdatedAt, user.id).run();
    } else {
      await db.prepare("INSERT INTO workspace_data (user_id, payload_json, revision, updated_at) VALUES (?, ?, ?, ?)").bind(user.id, payloadJson, revision, dataUpdatedAt).run();
    }
    return Response.json({ revision, updatedAt: dataUpdatedAt });
  } catch {
    return Response.json({ error: "保存云端数据失败。" }, { status: 500 });
  }
}
