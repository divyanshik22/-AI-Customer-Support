import { sessionFrom, log } from "../../../lib/db.mjs";
import { runAgent } from "../../../lib/agent.mjs";
import { sameOrigin, error } from "../../../lib/http.mjs";
export const runtime = "nodejs";
const active = new Set<string>();
export async function POST(req: Request) {
  let id: string | undefined;
  let acquired = false;
  try {
    sameOrigin(req);
    const s = sessionFrom(req);
    id = s.id;
    if (active.has(id!))
      return Response.json(
        { error: "Wait for the current reply." },
        { status: 409 },
      );
    const { message, failOnce } = await req.json();
    if (typeof message !== "string" || !message.trim() || message.length > 2000)
      throw new Error("Message must be 1–2000 characters");
    active.add(id!);
    acquired = true;
    return Response.json({
      reply: await runAgent(s, message, failOnce === true),
    });
  } catch (e) {
    if (id) log(id, "error", { message: (e as Error).message });
    return error(e);
  } finally {
    if (id && acquired) active.delete(id);
  }
}
