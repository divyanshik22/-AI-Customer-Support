import test from "node:test";
import assert from "node:assert/strict";
process.env.DATABASE_PATH = ":memory:";
const { db, createSession } = await import("../lib/db.mjs");
const { runAgent } = await import("../lib/agent.mjs");
test("demo workflow writes history, decision and refund", async () => {
  process.env.AGENT_MODE = "demo";
  const id = createSession("C001");
  const session = db.prepare("SELECT * FROM sessions WHERE id=?").get(id);
  const reply = await runAgent(
    session,
    "Please refund ORD-1001. The item is unused.",
    true,
  );
  assert.match(reply, /approved/i);
  assert.equal(
    JSON.parse(
      db.prepare("SELECT history FROM sessions WHERE id=?").get(id).history,
    ).length,
    2,
  );
  assert.ok(
    db
      .prepare("SELECT * FROM logs WHERE session_id=? AND type='decision'")
      .get(id),
  );
});
test("real agent loop consumes dynamic model tool calls and returns result", async () => {
  process.env.AGENT_MODE = "openai";
  process.env.OPENAI_API_KEY = "fake-test-key";
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    calls++;
    if (calls === 1) {
      assert.ok(
        body.tools.some((t) => t.function.name === "get_customer_orders"),
      );
      return Response.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_test",
                  type: "function",
                  function: { name: "get_customer_orders", arguments: "{}" },
                },
              ],
            },
          },
        ],
      });
    }
    assert.equal(body.messages.at(-1).role, "tool");
    assert.equal(JSON.parse(body.messages.at(-1).content)[0].id, "ORD-1009");
    return Response.json({
      choices: [
        {
          message: {
            role: "assistant",
            content: "Your backpack order is ORD-1009. Is it unused?",
          },
        },
      ],
    });
  };
  try {
    const id = createSession("C009");
    const reply = await runAgent(
      db.prepare("SELECT * FROM sessions WHERE id=?").get(id),
      "Find my orders",
    );
    assert.match(reply, /ORD-1009/);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
  }
});
