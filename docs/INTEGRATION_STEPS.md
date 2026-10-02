# Integration checklist

1. Extract the ZIP; open the `refund-agent` folder in VS Code.
2. Install Node 22.13+ and run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Start in `AGENT_MODE=demo` with `npm run dev`.
5. Select C001, request its unused-item refund, then verify admin logs.
6. Create an OpenAI API key and enable API billing.
7. Put the key in `.env.local`; never use a `NEXT_PUBLIC_` variable for it.
8. Set `AGENT_MODE=openai`; choose available chat and Realtime models.
9. Restart the server and test a real chat request.
10. Click Start voice, allow the microphone, and test a spoken request.
11. Run tests, typecheck, and build.
12. Record the 7–10 minute walkthrough and submit its viewing link.

The customer UI, backend routes, database, OpenAI calls, and voice bridge are already connected. Follow README.md for endpoint details, examples, and troubleshooting.
