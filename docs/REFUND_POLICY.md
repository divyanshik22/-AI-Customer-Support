# Resolve refund policy v1.0

1. Access only orders belonging to the session customer.
2. Order must be paid and delivered.
3. Request must occur within 30 × 24 hours after delivery, inclusive.
4. Digital goods, gift cards, and final-sale items are excluded.
5. Customer must explicitly request a refund and attest that the item is unused.
6. Only one refund per order; repeated or concurrent requests must not duplicate it.
7. Refund the full original paid amount in the original currency. No arbitrary amounts.
8. The assistant cannot grant exceptions. Explain denials using rule IDs R1–R8.

The authoritative source is `lib/policy.mjs`, which contains the policy text and executable checks. This document is a readable copy. All payments and refunds are simulated.
