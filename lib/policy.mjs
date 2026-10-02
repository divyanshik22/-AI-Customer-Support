export const POLICY = `RESOLVE REFUND POLICY v1.0
R1: Only the authenticated customer's own orders may be accessed.
R2: Order must be paid and delivered.
R3: Request must be received no later than 30 x 24 hours after delivery, inclusive.
R4: Digital goods, gift cards, and final-sale products are excluded.
R5: Customer must explicitly attest the item is unused and request a refund.
R6: One full refund per order, including any repeat or concurrent request.
R7: Refund equals the original amount paid, in the original currency. No arbitrary amounts.
R8: Exceptions cannot be granted by the assistant. Deny ineligible requests and explain rule IDs.
Approved refunds are recorded on your account and returned to your original payment method on our standard timeline.`;
export function eligibility(order, unused, now = Date.now()) {
  const failures = [];
  if (order.status !== "delivered" || !order.paid)
    failures.push("R2: Order must be paid and delivered.");
  const age = now - Date.parse(order.delivered_at);
  if (!Number.isFinite(age) || age < 0 || age > 30 * 86400000)
    failures.push("R3: Outside the 30-day refund window.");
  if (["digital", "gift_card", "final_sale"].includes(order.category))
    failures.push("R4: This category is excluded.");
  if (unused !== true) failures.push("R5: Please confirm the item is unused.");
  if (order.refunded)
    failures.push("R6: This order has already been refunded.");
  return {
    eligible: failures.length === 0,
    failures,
    policyVersion: "1.0",
    amount: order.amount,
    currency: order.currency,
  };
}
