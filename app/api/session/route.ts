import { db, createSession, sessionFrom } from "../../../lib/db.mjs";
import { sameOrigin, error } from "../../../lib/http.mjs";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { customerId } = await req.json();
    if (!db.prepare("SELECT id FROM customers WHERE id=?").get(customerId))
      throw new Error("Invalid customer");
    const id = createSession(customerId);
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": `support_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`,
        },
      },
    );
  } catch (e) {
    return error(e);
  }
}
export async function GET(req: Request) {
  try {
    const s = sessionFrom(req);
    return Response.json({
      orders: db
        .prepare("SELECT * FROM orders WHERE customer_id=?")
        .all(s.customer_id),
    });
  } catch (e) {
    return error(e, 401);
  }
}
