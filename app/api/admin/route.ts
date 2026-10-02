import { db, admin } from "../../../lib/db.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!admin(req))
    return Response.json({ error: "Invalid admin token" }, { status: 401 });
  return Response.json({
    logs: db.prepare("SELECT * FROM logs ORDER BY id DESC LIMIT 200").all(),
    refunds: db.prepare("SELECT * FROM refunds ORDER BY created_at DESC").all(),
    customers: db.prepare("SELECT count(*) AS n FROM customers").get(),
  });
}
