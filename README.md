# Resolve — AI Customer Support Agent

A Next.js application with a mock CRM, strict refund policy, tool-calling agent, customer chat, live admin timeline, and OpenAI Realtime WebRTC voice.

## 1. Requirements

- Node.js 22.13 or newer (Node 24 LTS recommended). Built-in `node:sqlite` is used; no database server or Python needed.
- npm, an editor, and a browser with microphone support.
- For real chat and voice: an OpenAI API key with model access and API billing. A ChatGPT subscription is not API credit. No key is needed for deterministic demo mode.

## 2. Install and run

Extract the ZIP and open a terminal inside `refund-agent`:

```bash
npm install
```

Copy `.env.example` to `.env.local` (Windows: create a copy in your editor, or run `Copy-Item .env.example .env.local` in PowerShell). On macOS/Linux:

```bash
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Select a customer. Open http://localhost:3000/admin in a second tab and enter the `ADMIN_TOKEN` from `.env.local`. The default token is `change-me-local-admin`; change it before sharing the application.

The CRM seeds automatically on first use. Demo mode is explicitly labeled and uses deterministic JavaScript, not an LLM. It is useful for UI and backend testing; use real OpenAI mode in the assignment video.

## 3. Connect OpenAI chat

Create an API key at https://platform.openai.com/api-keys and configure API billing on your OpenAI account. Keep the key private. Edit `.env.local`:

```dotenv
AGENT_MODE=openai
OPENAI_API_KEY=your-private-key
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_REALTIME_MODEL=gpt-realtime-2.1
ADMIN_TOKEN=your-own-long-random-token
DATABASE_PATH=./data/support.sqlite
```

Restart `npm run dev` after changing environment variables. Model names are configurable: select available tool-capable chat and Realtime models for your account if a default returns a model-access error. Check current API pricing and account limits; real OpenAI calls are not guaranteed free.

Test with C001 / Aarav: `Please refund ORD-1001. The item is unused.` The agent dynamically selects tools, and the backend revalidates every rule at mutation time. The UI should display an approved **simulated** refund and its reference.

## 4. Connect frontend and backend

Already integrated: no Express server, separate frontend project, or CORS configuration is needed.

| Browser action | Next.js backend | Implementation |
| --- | --- | --- |
| Load customers | GET `/api/customers` | 15 CRM profiles and active mode |
| Select demo identity | POST `/api/session` | HttpOnly session cookie |
| View own orders | GET `/api/session` | Session-scoped order lookup |
| Send a chat message | POST `/api/chat` | `lib/agent.mjs` agent loop |
| Admin updates | GET `/api/admin` | Token-protected polling every second |
| Start voice | POST `/api/voice/session` | Server exchanges SDP with OpenAI |
| Voice function call | POST `/api/voice/tool` | Same validated refund tools |

Customer identity is read from a server-issued cookie, not from tool arguments. Customer selection is intentionally a mock login; it is not production authentication.

## 5. Use the voice bonus

1. Add a funded OpenAI API key. Voice can run alongside either chat mode, but always uses real OpenAI Realtime.
2. Select a customer and click **Start voice**.
3. Allow microphone access. Use localhost or HTTPS; microphone capture will not work on ordinary remote HTTP.
4. Say: “Please refund my headphones, order ORD-1001. They are unused.”
5. The Realtime model emits tool calls over the data channel. The browser forwards them to `/api/voice/tool`, receives the backend result, and returns a `function_call_output` to the model. Audio comes through WebRTC media tracks.
6. The same backend enforces ownership, eligibility, and duplicate protection. Watch the admin tab for voice tool logs.
7. Click **End call**. Calls also stop after five minutes to bound demo sessions. Audio controls let you recover from autoplay blocking.

The standard API key stays on the server. Voice and text have separate model conversation histories but share database state. Starting a new voice call does not replay previous chat history. Switching customer ends the previous call.

## 6. Demo scenarios

| Customer | Order | Expected result |
| --- | --- | --- |
| C001 Aarav | ORD-1001 | Approve if unused and explicitly requested |
| C002 Priya | ORD-1002 | Deny: 45 days since delivery, R3 |
| C003 Maya | ORD-1003 | Deny: digital goods, R4 |
| C004 Rohan | ORD-1004 | Deny: already refunded, R6 |
| C005 Ananya | ORD-1005 | Near 30-day boundary; eligible only until actual deadline |
| C006 Kabir | ORD-1006 | Deny: gift card, R4 |
| C007 Neha | ORD-1007 | Deny: not delivered, R2 |
| C008 Arjun | ORD-1008 | Deny: final sale, R4 |

For a retry demo, enable **Simulate one CRM failure** before submitting a refund. The first `get_customer_orders` call fails transiently and retries once. In real LLM mode, the model must call that tool for the injected failure to occur: ask “List my orders first, then refund my unused item.” Inspect `error`, `retry`, `tool_result`, and `policy_check` events.

For missing confirmation: ask “Refund ORD-1001” without saying unused. For ownership: choose C001 and ask for ORD-1002. For duplicate protection: repeat an approved refund. To demonstrate voice approval after chat approval, reset the database first or choose a different eligible customer, such as C009.

Dates are seeded relative to the first run, so the dataset ages naturally. To get fresh demo dates and remove all mock refunds, stop the server, run `npm run reset`, then restart. Reset uses the default path unless DATABASE_PATH is exported in your shell (the standalone reset script does not load `.env.local`).

## 7. Project architecture

```text
app/
  page.tsx                  Customer chat, CRM selector, orders
  admin/page.tsx            Live admin timeline
  policy/page.tsx           Policy page
  api/                      Next.js backend route handlers
components/Voice.tsx        WebRTC microphone, audio, and events
lib/
  db.mjs                    SQLite schema, seed, sessions, audit logs
  policy.mjs                Document plus deterministic policy rules
  tools.mjs                 Validated tools and transactional refund ledger
  agent.mjs                 OpenAI loop and labeled offline simulation
  http.mjs                  Origin checks and error responses
scripts/reset.mjs           Reset mock database
tests/refunds.test.mjs       Meaningful refund-rule and retry checks
docs/                       Setup, policy, video, and verification notes
```

The chat agent performs at most 10 model turns, executes selected tools, appends tool results, and asks the model for its next action or final answer. API calls time out after 30 seconds and retry 429/server errors up to three attempts. Tool retries apply only to explicitly transient failures. SQLite uses a transaction and a unique order refund constraint; duplicate refunds are denied even if the assistant attempts them.

Admin logs contain tool inputs/results, rule checks, failures, retries, and final response summaries. They do not expose private model chain-of-thought. Refund amounts are stored in integer paise and are chosen by the backend, not the model.

## 8. Checks and production build

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build. This application requires a persistent Node server and writable disk for SQLite; do not deploy it as a static export or assume an ephemeral serverless filesystem persists data.

## 9. Before public deployment

This is a local assignment application, not a production financial service. Refunds never move real money. Replace the mock identity selector with real authentication, require role-based admin access, introduce rate limits and voice spend controls, use a durable database for multiple instances, and authenticate voice tool requests against a server-managed call context. The browser-mediated voice tool bridge is suitable for this mock demo; a hardened deployment should execute tools using server-side Realtime controls. Attestations such as “unused” are customer claims, not physical inspection.

## 10. Troubleshooting

- **node:sqlite unavailable:** install Node 22.13+; Node 24 recommended.
- **401 / API key:** confirm `.env.local`, billing, and restart the server.
- **429:** quota or rate limit; wait, inspect your account, or use demo mode locally.
- **Model not found:** set a model your API project can access.
- **Admin unauthorized:** enter the exact `ADMIN_TOKEN`; restart after editing it.
- **Microphone unavailable:** allow permission and use localhost/HTTPS.
- **Refund denied after successful demo:** expected duplicate protection; use another customer or reset.
- **No voice transcript:** verify transcription model access and inspect browser network errors.

Official references:
- https://developers.openai.com/api/docs/guides/function-calling
- https://developers.openai.com/api/docs/guides/voice-webrtc
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://platform.openai.com/docs/pricing

See `docs/VIDEO_WALKTHROUGH.md` for your 7–10 minute recording plan and `docs/VERIFICATION.md` for what was tested when this ZIP was prepared.
