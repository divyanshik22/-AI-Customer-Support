"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function Admin() {
  const [token, setToken] = useState(""),
    [active, setActive] = useState(""),
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("");
  useEffect(() => {
    if (!active) return;
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/admin", {
          headers: { Authorization: `Bearer ${active}` },
          cache: "no-store",
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (alive) {
          setData(d);
          setError("");
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    }
    load();
    const t = setInterval(load, 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [active]);
  return (
    <main>
      <nav>
        <Link href="/" className="brand">
          ◈ resolve<span>Team dashboard</span>
        </Link>
        <Link href="/">Back to support ↗</Link>
      </nav>
      <div className="hero">
        <h1>What’s happening behind the scenes</h1>
        <p>
          Policy checks, tool calls, and outcomes—refreshed every second while
          you’re connected.
        </p>
      </div>
      <form
        className="card composer"
        onSubmit={(e) => {
          e.preventDefault();
          setActive(token);
        }}
      >
        <input
          type="password"
          aria-label="Admin token"
          placeholder="Enter your admin access token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button>Connect</button>
      </form>
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <div className="stats">
            <div className="card">
              <small>CUSTOMERS</small>
              <h2>{data.customers.n}</h2>
            </div>
            <div className="card">
              <small>REFUNDS</small>
              <h2>{data.refunds.length}</h2>
            </div>
            <div className="card">
              <small>RECENT EVENTS</small>
              <h2>{data.logs.length}</h2>
            </div>
          </div>
          <div className="card">
            <div className="chathead">
              <h2>Execution timeline</h2>
              <input
                placeholder="Filter by session ID or event"
                aria-label="Filter logs"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <p className="muted">
              Auditable action logs and brief outcome summaries; no private
              chain-of-thought. Newest first.
            </p>
            {data.logs
              .filter((l: any) => (l.session_id + l.type).includes(filter))
              .map((l: any) => (
                <details
                  key={l.id}
                  className={`event ${l.type}`}
                  open={["policy_check", "decision", "retry", "error"].includes(
                    l.type,
                  )}
                >
                  <summary>
                    <span className="badge">{l.type}</span>{" "}
                    <time>{new Date(l.created_at).toLocaleTimeString()}</time>{" "}
                    <small>
                      Session {l.session_id.slice(0, 8)} · #{l.id}
                    </small>
                  </summary>
                  <pre>{JSON.stringify(JSON.parse(l.detail), null, 2)}</pre>
                </details>
              ))}
          </div>
        </>
      )}
      <footer>
        Keep this open in another tab while you chat with customers.
      </footer>
    </main>
  );
}
