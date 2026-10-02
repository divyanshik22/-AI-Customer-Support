import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
const path = process.env.DATABASE_PATH || "./data/support.sqlite";
mkdirSync(dirname(path), { recursive: true });
export const db = new DatabaseSync(path);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY,name TEXT,email TEXT);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,customer_id TEXT,product TEXT,category TEXT,amount INTEGER,currency TEXT,paid INTEGER,status TEXT,delivered_at TEXT,refunded INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,customer_id TEXT,expires INTEGER,history TEXT DEFAULT '[]');
CREATE TABLE IF NOT EXISTS refunds(id TEXT PRIMARY KEY,order_id TEXT UNIQUE,amount INTEGER,created_at TEXT);
CREATE TABLE IF NOT EXISTS logs(id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT,type TEXT,detail TEXT,created_at TEXT);
`);
if (!db.prepare("SELECT id FROM customers LIMIT 1").get()) {
  const names = [
    "Aarav Sharma",
    "Priya Patel",
    "Maya Rao",
    "Rohan Mehta",
    "Ananya Iyer",
    "Kabir Singh",
    "Neha Gupta",
    "Arjun Das",
    "Sara Khan",
    "Dev Shah",
    "Isha Nair",
    "Vikram Jain",
    "Tara Bose",
    "Aditya Roy",
    "Zoya Ali",
  ];
  const cases = [
    ["Headphones", "electronics", 10, "delivered", 0],
    ["Running shoes", "apparel", 45, "delivered", 0],
    ["Photo presets", "digital", 3, "delivered", 0],
    ["Coffee grinder", "home", 8, "delivered", 1],
    ["Backpack", "apparel", 30, "delivered", 0],
    ["Gift card", "gift_card", 2, "delivered", 0],
    ["Desk lamp", "home", 4, "shipped", 0],
    ["Winter jacket", "final_sale", 5, "delivered", 0],
  ];
  names.forEach((name, i) => {
    const id = `C${String(i + 1).padStart(3, "0")}`;
    db.prepare("INSERT INTO customers VALUES(?,?,?)").run(
      id,
      name,
      `customer${i + 1}@example.test`,
    );
    const c = cases[i % cases.length];
    const date = new Date(
      Date.now() - c[2] * 86400000 + (i === 4 ? 60000 : 0),
    ).toISOString();
    db.prepare("INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?,?)").run(
      `ORD-${1001 + i}`,
      id,
      c[0],
      c[1],
      (i + 1) * 1500 + 3499,
      "INR",
      1,
      c[3],
      date,
      c[4],
    );
  });
}
export function log(session, type, detail) {
  db.prepare(
    "INSERT INTO logs(session_id,type,detail,created_at) VALUES(?,?,?,?)",
  ).run(session, type, JSON.stringify(detail), new Date().toISOString());
}
export function sessionFrom(req) {
  const token = (req.headers.get("cookie") || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("support_session="))
    ?.slice(16);
  const s =
    token &&
    db
      .prepare("SELECT * FROM sessions WHERE id=? AND expires>?")
      .get(token, Date.now());
  if (!s) throw new Error("Please sign in to your account first.");
  return s;
}
export function createSession(customer) {
  const id = randomUUID();
  db.prepare("INSERT INTO sessions(id,customer_id,expires) VALUES(?,?,?)").run(
    id,
    customer,
    Date.now() + 3600000,
  );
  return id;
}
export function admin(req) {
  return (
    Boolean(process.env.ADMIN_TOKEN) &&
    req.headers.get("authorization") === `Bearer ${process.env.ADMIN_TOKEN}`
  );
}
