import { db } from "../../../lib/db.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({
    customers: db.prepare("SELECT id,name FROM customers").all(),
    mode: process.env.AGENT_MODE || "demo",
  });
}
