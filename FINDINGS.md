# Findings

Running log of issues hit during development and how they were resolved.

---

## 2026-04-11 — Agents step fails with 500 after intake submit

**Symptom:** Enrich step succeeds, but the agents step returns HTTP 500. Browser surfaces a vague failure that looks cross-origin-ish.

**Root cause:** Next.js dev-server rewrite proxy (`/api/:path*` → `http://localhost:3001`) has a ~30s upstream timeout. The `/agents` route fans out three parallel Claude calls, and the creative agent runs with `maxTokens: 8192` (`server/routes/agents.ts:23`), which routinely takes longer than 30s. Next kills the upstream before `Promise.all` resolves and returns `Internal Server Error`. Not CORS.

**Evidence:**
- Direct `curl` to `http://localhost:3001/agents`: HTTP 200 in ~75s.
- Same payload via `http://localhost:3000/api/agents`: HTTP 500 at exactly 30.01s.

**Fix:** Bypass the Next rewrite in dev. Changed `API_BASE` in `client/lib/api.ts` from `/api` to `http://localhost:3001` (overridable via `NEXT_PUBLIC_API_BASE`). The Express server already allows `http://localhost:3000` in its CORS config (`server/index.ts:18`), so the browser calls the backend directly and the 30s proxy limit no longer applies.

**Alternatives considered:**
- Lower `maxTokens` on the creative agent — risks truncated JSON and parse failures.
- Stream responses from `callClaude` — best UX, most work.

---

## 2026-04-11 — Website build fails after ~6 minutes with "Connection error"

**Symptom:** `/build` returned HTTP 500 after ~6 minutes. Browser showed `{ error: "Website build failed", message: "Connection error." }`. Server log showed `APIConnectionError: Connection error` wrapping `FetchError: request to https://api.anthropic.com/v1/messages failed, reason: read ETIMEDOUT`, with `status: undefined` — meaning Anthropic's API never responded with an error code, the TCP socket simply died while waiting for the response body.

**Root cause:** `callClaude` used non-streaming `client.messages.create(...)`. The build route requests `maxTokens: 16384` (`server/routes/build.ts:37`), and generating that many tokens takes several minutes. During that window no bytes flow on the HTTPS socket, and some middlebox (or the underlying `node-fetch` socket read timeout) drops the idle connection. Anthropic's own guidance: stream any request expecting more than a few thousand output tokens to avoid network timeouts.

**Fix:** Switched `callClaude` in `server/services/claude.ts` to `client.messages.stream(...).finalMessage()`. Streaming keeps the socket active with SSE events as tokens arrive, so nothing goes idle long enough to trigger a timeout. Same return contract — `finalMessage()` yields the fully-assembled `Message` with the same `content` blocks the old `create` call returned, so the JSON-parsing tail of the function is unchanged. This fixes the build path and also makes all three agent calls more resilient for free.

**Alternatives considered:**
- Lower `maxTokens` on build — risks truncated HTML / invalid JSON.
- Split build into per-page calls — significant rewrite of route and prompt.

---

## 2026-04-11 — Agent status cards all flip to "complete" at once

**Symptom (UX, not a bug):** The four agent cards (CRM, Creative, Design, Assets) all flipped from "processing" to "complete" simultaneously at the end of the 2-minute agents phase, even though CRM and Design typically finish in ~30s while Creative is the long pole at `maxTokens: 8192`.

**Root cause:** The original `/agents` route awaited `Promise.all` over all three Claude calls and returned one monolithic response. The client dispatched `SET_AGENTS` once with the whole payload, so the reducer had no chance to show partial progress.

**Fix:** Fan-out refactor.
- Server (`server/routes/agents.ts`): replaced the single POST with four endpoints — `/agents/crm`, `/agents/creative`, `/agents/design`, `/agents/assets`. Each owns one Claude call (assets is the synchronous mock).
- Client (`client/lib/api.ts`): split `fetchAgents` into four per-agent fetchers.
- Reducer (`client/lib/pipeline-reducer.ts`): added a `SET_AGENT_RESULT` action that merges a single agent's result into state and promotes `phase` to `agents_complete` only once all four slots are populated.
- Page (`client/app/page.tsx`): `handleIntakeSubmit` now fires all four fetches in parallel and each `.then` dispatches `SET_AGENT_RESULT`, so cards flip to "complete" individually as each call settles. `Promise.all` still awaits the whole set so errors still surface.

**Trade-off:** Four HTTP requests instead of one. Worth it for the demo UX — and the existing `agentStatus` helper in `page.tsx` already keyed off per-agent state, so this was almost a no-op on the render side.

---

## 2026-04-11 — Spinner stuck forever after a phase failure

**Symptom:** A build request failed 20 minutes ago but the UI still showed the "Generating website..." spinner and the phase card was still flagged active. The red error banner at the top was correct, but the in-phase loading state underneath it never cleared.

**Root cause:** The catch blocks in `handleIntakeSubmit` and `handleApprove` only dispatched `SET_ERROR`, which touches `state.error` but leaves `state.phase` unchanged. Every spinner in `client/app/page.tsx` is gated on `phase === "<phase>"` (e.g. `phase === "building"` at page.tsx:392), so with `phase` still stuck on `"building"` the spinner rendered indefinitely. Same latent bug existed on the `enriching` and `processing_agents` paths — they just hadn't failed long enough to notice.

**Fix:** In every catch block, dispatch a `SET_PHASE` rollback alongside `SET_ERROR`:
- Enrich/agents failure in `handleIntakeSubmit` → roll back to `"intake"` so the form reappears and the user can resubmit.
- Build failure in `handleApprove` → roll back to `"agents_complete"` so the `ApprovalPanel` reappears and the user can retry by clicking Approve again without losing the ~2 minutes of agent output.

**Alternatives considered:**
- Extend `SET_ERROR` in the reducer to take an optional `revertPhase`. Slightly cleaner but changes the action shape; two dispatches is minimal-diff and keeps the reducer untouched.
- Add a dedicated `FAIL_PHASE` action. Overkill for the demo.
