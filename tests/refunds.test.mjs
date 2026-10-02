import test from "node:test";
import assert from "node:assert/strict";
process.env.DATABASE_PATH = ":memory:";
const { db } = await import("../lib/db.mjs");
const { execute, executeWithRetry } = await import("../lib/tools.mjs");
const { eligibility } = await import("../lib/policy.mjs");
const s = { id: "test-session", customer_id: "C001" };
test("15 mock profiles", () =>
  assert.equal(db.prepare("SELECT count(*) n FROM customers").get().n, 15));
test("cross-customer lookup and mutation denied", () => {
  assert.equal(
    execute("get_order_details", { order_id: "ORD-1002" }, s).rule,
    "R1",
  );
  assert.equal(
    execute(
      "process_refund",
      { order_id: "ORD-1002", unused: true, confirmed: true },
      s,
    ).rule,
    "R1",
  );
});
test("requires unused and explicit request", () => {
  assert.equal(
    execute(
      "process_refund",
      { order_id: "ORD-1001", unused: false, confirmed: true },
      s,
    ).status,
    "denied",
  );
  assert.equal(
    execute(
      "process_refund",
      { order_id: "ORD-1001", unused: true, confirmed: false },
      s,
    ).status,
    "denied",
  );
});
test("approves once; repeat cannot create a second refund", () => {
  assert.equal(
    execute(
      "process_refund",
      { order_id: "ORD-1001", unused: true, confirmed: true },
      s,
    ).status,
    "approved",
  );
  assert.equal(
    execute(
      "process_refund",
      { order_id: "ORD-1001", unused: true, confirmed: true },
      s,
    ).status,
    "denied",
  );
  assert.equal(
    db
      .prepare("SELECT count(*) n FROM refunds WHERE order_id=?")
      .get("ORD-1001").n,
    1,
  );
});
test("expired and excluded orders denied", () => {
  for (const id of ["C002", "C003", "C006", "C008"]) {
    const order = db
      .prepare("SELECT * FROM orders WHERE customer_id=?")
      .get(id);
    assert.equal(eligibility(order, true).eligible, false);
  }
});
test("30-day boundary inclusive, future dates rejected", () => {
  const now = Date.now(),
    base = { status: "delivered", paid: 1, category: "home", refunded: 0 };
  assert.equal(
    eligibility(
      { ...base, delivered_at: new Date(now - 30 * 86400000).toISOString() },
      true,
      now,
    ).eligible,
    true,
  );
  assert.equal(
    eligibility(
      {
        ...base,
        delivered_at: new Date(now - 30 * 86400000 - 1).toISOString(),
      },
      true,
      now,
    ).eligible,
    false,
  );
  assert.equal(
    eligibility(
      { ...base, delivered_at: new Date(now + 1).toISOString() },
      true,
      now,
    ).eligible,
    false,
  );
});
test("rejects malformed tool args", () =>
  assert.throws(() =>
    execute(
      "process_refund",
      { order_id: "ORD-1001", unused: "true", confirmed: true },
      s,
    ),
  ));
test("transient CRM failure retries and logs", async () => {
  const result = await executeWithRetry("get_customer_orders", {}, s, true);
  assert.equal(result.length, 1);
  assert.ok(db.prepare("SELECT * FROM logs WHERE type='retry'").get());
});
