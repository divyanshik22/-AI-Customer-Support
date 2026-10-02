# 8–9 minute video walkthrough

Use real OpenAI mode. Prepare the API key privately, seed fresh dates, and open the admin page in a second tab. Avoid showing `.env.local` or API credentials in the recording.

## 0:00–0:45 — Introduce the problem

“This is Resolve, an AI customer support agent built with Next.js. It uses a mock CRM with 15 customers and a strict refund policy. The LLM selects tools, but the backend enforces eligibility and records simulated refunds.” Show the customer page, policy page, and admin console.

## 0:45–2:10 — Standard approval

Select C001. Ask: “Please refund ORD-1001. It is unused.” Show the approval and refund reference. In admin, expand lookup, policy check, and processing logs. Explain that the amount comes from the original order.

## 2:10–3:10 — Policy violation

Select C002. Ask to refund ORD-1002 and confirm unused. Show denial due to R3 (45 days). Optionally select C003 for a digital-product exclusion.

## 3:10–4:00 — Failure and retry

Enable the simulated CRM failure. Select C009 and ask the agent to list your orders before handling the refund. Show error → retry → successful tool result. Repeat the refund request to show duplicate protection.

## 4:00–5:15 — Voice

Choose another eligible customer, such as C011, with an unrefunded order. Click Start voice, permit the microphone, and request its refund aloud. Say the item is unused. Show the transcript, audio response, and matching admin tool events. End the call. If a provider or microphone failure occurs, explain the actual error rather than presenting demo text as live voice.

## 5:15–7:30 — Code walkthrough

- `app/page.tsx`: customer selection, chat fetches, order cards.
- `app/api/chat/route.ts`: session-bound request validation.
- `lib/agent.mjs`: model request, tool calls, result messages, bounded loop.
- `lib/tools.mjs`: allowlisted functions, input validation, backend enforcement.
- `lib/policy.mjs`: strict document and executable eligibility rules.
- `lib/db.mjs`: seed, sessions, refund ledger, unique order constraint.
- `components/Voice.tsx`: microphone capture, WebRTC, data-channel tool forwarding, playback, cleanup.
- `app/api/voice/session/route.ts`: server-side API key and SDP handshake.

Explain why refund processing rechecks policy inside a transaction, regardless of the LLM's proposed action.

## 7:30–8:30 — Verification and limits

Run `npm test` and show passing checks. Explain that admin logs show tool actions and short decision summaries. Describe mock login, simulated payments, persistent-disk requirement, and the difference between free demo mode and real OpenAI mode.

Upload the recording to Google Drive or Loom, grant the evaluator viewing access, and verify the link works before submitting it with the source ZIP.
