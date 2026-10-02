export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    throw new Error("Origin rejected");
}
export function error(e, status = 400) {
  return Response.json({ error: e.message || "Request failed" }, { status });
}
