import { sessionFrom } from "../../../../lib/db.mjs";
import { executeWithRetry } from "../../../../lib/tools.mjs";
import { sameOrigin, error } from "../../../../lib/http.mjs";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const s = sessionFrom(req);
    const { name, args } = await req.json();
    return Response.json(await executeWithRetry(name, args, s));
  } catch (e) {
    return error(e);
  }
}
