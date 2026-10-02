# Verification when packaged

- 10 automated Node tests passed: 15 profiles, ownership isolation, unused/request requirements, one-time processing, expiry, exclusions, exact time boundary, malformed arguments, transient retry, demo agent workflow, and mocked OpenAI tool orchestration.
- TypeScript `tsc --noEmit` passed.
- Next.js production build compiled and generated all pages/routes.
- The sandbox restricts Node OS memory/network inspection. Build verification used an external, environment-only shim for those diagnostics; the shim is not included in this project and ordinary local installations should not need it.
- Live OpenAI chat and voice were not exercised: no user API credential or funded account was available. The agent loop was tested with mocked OpenAI responses. The voice integration follows official Realtime WebRTC documentation and requires a live microphone/API smoke test after setup.
- No claim of real payment processing: the database records mock refunds only.

- Running production-server API smoke check passed: 15 customers returned, eligible demo refund approved, expired refund denied, 25 audit events returned, unauthenticated admin access rejected with HTTP 401.
