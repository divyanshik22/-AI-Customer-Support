import { db, log } from "./db.mjs";
import { POLICY, eligibility } from "./policy.mjs";
import { randomUUID } from "node:crypto";
const defs = [
  ["get_refund_policy", "Read the strict policy.", {}],
  ["get_customer_orders", "List the authenticated customer orders.", {}],
  [
    "get_order_details",
    "Fetch one owned order.",
    { order_id: { type: "string" } },
  ],
  [
    "check_refund_eligibility",
    "Validate all policy rules.",
    { order_id: { type: "string" }, unused: { type: "boolean" } },
  ],
  [
    "process_refund",
    "Process the requested refund only after customer confirms unused and explicitly requests refund.",
    {
      order_id: { type: "string" },
      unused: { type: "boolean" },
      confirmed: { type: "boolean" },
    },
  ],
];
export const tools = defs.map(([name, description, properties]) => ({
  type: "function",
  name,
  description,
  parameters: {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  },
}));
export function execute(name, args, session) {
  const def = tools.find((x) => x.name === name);
  if (!def) throw new Error("Unknown tool");
  if (!args || typeof args !== "object" || Array.isArray(args))
    throw new Error("Invalid tool arguments");
  const props = def.parameters.properties;
  if (
    Object.keys(args).some((k) => !Object.hasOwn(props, k)) ||
    Object.entries(props).some(([k, v]) => typeof args[k] !== v.type)
  )
    throw new Error("Invalid tool arguments");
  log(session.id, "tool_call", { name, args });
  let result;
  if (name === "get_refund_policy") result = { policy: POLICY };
  else if (name === "get_customer_orders")
    result = db
      .prepare("SELECT * FROM orders WHERE customer_id=?")
      .all(session.customer_id);
  else {
    const order = db
      .prepare("SELECT * FROM orders WHERE id=? AND customer_id=?")
      .get(args.order_id, session.customer_id);
    if (!order)
      result = { error: "Order not found for this customer.", rule: "R1" };
    else if (name === "get_order_details") result = order;
    else if (name === "check_refund_eligibility") {
      result = eligibility(order, args.unused);
      log(session.id, "policy_check", result);
    } else {
      db.exec("BEGIN IMMEDIATE");
      try {
        const fresh = db
          .prepare("SELECT * FROM orders WHERE id=? AND customer_id=?")
          .get(args.order_id, session.customer_id);
        const check = eligibility(fresh, args.unused);
        log(session.id, "policy_check", check);
        if (!check.eligible || args.confirmed !== true)
          result = {
            status: "denied",
            ...check,
            reason:
              args.confirmed !== true
                ? "R5: Explicit refund request required."
                : check.failures.join(" "),
          };
        else {
          const id = "RF-" + randomUUID().slice(0, 8);
          db.prepare("INSERT INTO refunds VALUES(?,?,?,?)").run(
            id,
            order.id,
            order.amount,
            new Date().toISOString(),
          );
          db.prepare("UPDATE orders SET refunded=1 WHERE id=?").run(order.id);
          result = {
            status: "approved",
            refundId: id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            message: "Refund recorded. It will post to the original payment method.",
          };
        }
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    }
  }
  log(session.id, "tool_result", { name, result });
  return result;
}
export async function executeWithRetry(name, args, session, failOnce = false) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (failOnce && attempt === 1 && name === "get_customer_orders") {
        const e = new Error("Simulated temporary CRM outage");
        e.transient = true;
        throw e;
      }
      return execute(name, args, session);
    } catch (e) {
      log(session.id, "error", { tool: name, attempt, message: e.message });
      if (!e.transient || attempt === 2) return { error: e.message };
      log(session.id, "retry", { tool: name, nextAttempt: attempt + 1 });
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}
