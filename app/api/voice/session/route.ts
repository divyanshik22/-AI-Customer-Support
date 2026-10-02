import { sessionFrom, log } from "../../../../lib/db.mjs";
import { instructions } from "../../../../lib/agent.mjs";
import { tools } from "../../../../lib/tools.mjs";
import { sameOrigin, error } from "../../../../lib/http.mjs";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const s = sessionFrom(req);
    if (!process.env.OPENAI_API_KEY)
      throw new Error("Voice requires OPENAI_API_KEY and API billing.");
    const sdp = await req.text();
    if (sdp.length > 100000) throw new Error("SDP too large");
    const fd = new FormData();
    fd.set("sdp", sdp);
    fd.set(
      "session",
      JSON.stringify({
        type: "realtime",
        model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
        instructions,
        tools,
        tool_choice: "auto",
        audio: {
          input: { transcription: { model: "gpt-4o-mini-transcribe" } },
          output: { voice: "marin" },
        },
      }),
    );
    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: fd,
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok)
      throw new Error(
        `Voice connection failed (${r.status}); check model access and billing.`,
      );
    log(s.id, "voice", { event: "session_connected" });
    return new Response(await r.text(), {
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e) {
    return error(e);
  }
}
