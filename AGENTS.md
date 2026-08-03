<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Env vars

Read env from `src/lib/env.ts` (server) or `src/lib/publicEnv.ts` (client). Do not use `process.env` directly. Optional keys (e.g. `SHEETS_*`) are local/script-only — unset is fine for the app.
