"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Voice from "../components/Voice";
type Order = {
  id: string;
  product: string;
  amount: number;
  currency: string;
  refunded: number;
  status: string;
};
export default function Home() {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>(
      [],
    ),
    [customer, setCustomer] = useState(""),
    [orders, setOrders] = useState<Order[]>([]),
    [messages, setMessages] = useState<{ role: string; text: string }[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [fail, setFail] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers))
      .catch(() => setError("Cannot load customers."));
  }, []);
  async function refresh() {
    const r = await fetch("/api/session");
    if (r.ok) setOrders((await r.json()).orders);
  }
  async function select(id: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: id }),
      });
      if (!r.ok) throw new Error("Could not select customer");
      setCustomer(id);
      setMessages([
        {
          role: "assistant",
          text: "Hi! I’m Resolve, your AI support assistant. Which order would you like help with?",
        },
      ]);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send(text = input) {
    if (!text.trim() || busy || !customer) return;
    setInput("");
    setBusy(true);
    setError("");
    setMessages((m) => [...m, { role: "user", text }]);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, failOnce: fail }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessages((m) => [...m, { role: "assistant", text: d.reply }]);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <nav>
        <Link href="/" className="brand">
          ◈ resolve<span>Refunds and returns, explained clearly.</span>
        </Link>
        <Link href="/admin">Team dashboard ↗</Link>
      </nav>
      <div className="hero">
        <h1>Need help with a refund?</h1>
        <p>
          Tell us what happened—we’ll look up your order and walk you through
          what we can do.
        </p>
      </div>
      <div className="grid">
        <aside className="card">
          <h2>Your account</h2>
          <label>
            Who’s signing in?
            <select
              value={customer}
              disabled={busy}
              onChange={(e) => select(e.target.value)}
            >
              <option value="">Choose your account</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            Your orders and refund history appear here once you’re signed in.
          </p>
          <h3>Orders</h3>
          {orders.map((o) => (
            <div className="order" key={o.id}>
              <b>{o.product}</b>
              <small>
                {o.id} · ₹{(o.amount / 100).toFixed(2)}
              </small>
              <span className="badge">
                {o.refunded ? "refunded" : o.status}
              </span>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  send(`Please refund ${o.id}. The item is unused.`)
                }
              >
                Request refund →
              </button>
            </div>
          ))}
          <div className="policy">
            <b>Our promise, with clear limits</b>
            <p>
              30 days from delivery · Unused items · Eligible categories · One
              refund per order
            </p>
            <a href="/policy">Read the full policy →</a>
          </div>
        </aside>
        <section className="card chat">
          <div className="chathead">
            <div>
              <b>Resolve</b>
              <small>Here to help with returns and refunds</small>
            </div>
            <span className="badge">{busy ? "Working…" : "Available"}</span>
          </div>
          <div className="messages" aria-live="polite">
            {!messages.length && (
              <div className="empty">
                <span>◈</span>
                <h2>Say hello when you’re ready.</h2>
                <p>
                  Sign in on the left, pick an order if you like, or just type
                  what you need.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <small>{m.role === "user" ? "You" : "Resolve"}</small>
                {m.text}
              </div>
            ))}
            {busy && <p className="muted">Checking the details…</p>}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="composer"
          >
            <input
              aria-label="Message"
              value={input}
              disabled={!customer || busy}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your issue or ask about an order…"
              maxLength={2000}
            />
            <button disabled={!customer || busy || !input.trim()}>
              Send ↗
            </button>
          </form>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
            />{" "}
            Test retry behavior (one temporary lookup failure)
          </label>
          <Voice
            key={customer}
            enabled={!!customer && !busy}
            onTranscript={(role, text) => {
              setMessages((m) => [...m, { role, text }]);
              refresh();
            }}
          />
          <small className="muted">
            Voice calls need microphone access and an OpenAI API key on the
            server.
          </small>
        </section>
      </div>
      <footer>Resolve — clear answers, every time.</footer>
    </main>
  );
}
