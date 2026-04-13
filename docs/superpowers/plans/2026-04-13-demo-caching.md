# Demo Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-cache pipeline outputs (enrichment, agents, build HTML) for Ridgeline Outdoor Education (standard) and Nimbus Cloud Solutions (bold) so the demo can run instantly without calling Claude.

**Architecture:** The app already has a `fallbackData` system — a single set of hardcoded fallback objects for Lone Star Pet Grooming. We'll expand this into a keyed cache that maps company slugs to their full pipeline outputs. When the live toggle is off, the pipeline looks up the selected company's slug and serves its cached data (including real generated HTML with a stable sessionId). The generated HTML files live in `server/generated/` under deterministic session IDs so the iframe preview works.

**Tech Stack:** TypeScript, existing `fallback-data.ts` pattern, static JSON fixtures

---

### Task 1: Generate cached pipeline data for both companies

Before writing any code, we need the actual data. Run the full pipeline live for both companies and capture the outputs. This is a manual step — run the app, select each company, and save the results.

**Files:**
- Create: `client/lib/cache/ridgeline-outdoor.ts`
- Create: `client/lib/cache/nimbus-cloud.ts`

- [ ] **Step 1: Run the pipeline for Ridgeline Outdoor Education**

Start the dev servers (`npm run dev` for client and server). Select "Ridgeline Outdoor Education" from the company picker. Make sure the live toggle is ON for all phases. Let the full pipeline run through to deployment ready.

- [ ] **Step 2: Capture Ridgeline enrichment + agent data**

Once the pipeline completes, open the browser console. The pipeline state is in the React component — use React DevTools or add a temporary `console.log(JSON.stringify(state, null, 2))` in `page.tsx` after agents complete (around line 163, after `Promise.all`). Save the `enriched` and `agents` objects.

Alternatively, intercept the network responses in the browser's Network tab:
- `POST /enrich` response → enriched data
- `POST /agents/crm` response → CRM data
- `POST /agents/creative` response → creative data
- `POST /agents/design` response → design data
- `POST /agents/assets` response → assets data

- [ ] **Step 3: Capture Ridgeline build output**

From the Network tab, find the `POST /build` SSE stream. The final `complete` event contains the `sessionId`. Note the sessionId — the generated HTML files are at `server/generated/{sessionId}/`.

- [ ] **Step 4: Write `client/lib/cache/ridgeline-outdoor.ts`**

Create the cache file with the captured data. Follow this structure:

```typescript
import type { EnrichedData, AgentsResult, GeneratedSite } from "../types";

export const SESSION_ID = "ridgeline-std"; // deterministic, not random

export const enriched: EnrichedData = {
  // paste captured enrichment data
};

export const agents: AgentsResult = {
  // paste captured agent data (crm, creative, design, assets)
};

export const build: GeneratedSite = {
  sessionId: SESSION_ID,
  pages: [
    { name: "Home", filename: "index.html", html: "" },
    { name: "Services", filename: "services.html", html: "" },
    { name: "About", filename: "about.html", html: "" },
    { name: "Contact", filename: "contact.html", html: "" },
  ],
  metadata: {
    framework: "Static HTML + Tailwind CSS CDN",
    styling: "Tailwind CSS",
    pageCount: 4,
    generatedAt: "2026-04-13T00:00:00.000Z",
  },
};
```

- [ ] **Step 5: Copy Ridgeline generated HTML to deterministic session directory**

```bash
# From the repo root — replace {original-session-id} with the actual ID from step 3
cp -r server/generated/{original-session-id} server/generated/ridgeline-std
```

This gives the cached build a stable, predictable path that won't be overwritten by future live runs.

- [ ] **Step 6: Repeat steps 1-5 for Nimbus Cloud Solutions**

Same process. Use `SESSION_ID = "nimbus-bold"`. Create `client/lib/cache/nimbus-cloud.ts`. Copy HTML to `server/generated/nimbus-bold/`.

- [ ] **Step 7: Commit the cache fixtures**

```bash
git add client/lib/cache/ server/generated/ridgeline-std/ server/generated/nimbus-bold/
git commit -m "feat(cache): add cached pipeline data for Ridgeline and Nimbus demos"
```

---

### Task 2: Create the cache index module

**Files:**
- Create: `client/lib/cache/index.ts`

- [ ] **Step 1: Write the cache index**

```typescript
import type { EnrichedData, AgentsResult, GeneratedSite, ProjectResult } from "../types";

import * as ridgeline from "./ridgeline-outdoor";
import * as nimbus from "./nimbus-cloud";

export interface CachedPipeline {
  enriched: EnrichedData;
  agents: AgentsResult;
  build: GeneratedSite;
  project: ProjectResult;
}

const CACHE: Record<string, CachedPipeline> = {
  "Ridgeline Outdoor Education": {
    enriched: ridgeline.enriched,
    agents: ridgeline.agents,
    build: ridgeline.build,
    project: {
      filename: "ridgeline-outdoor-education-claude-project-kit.zip",
      downloadedAt: "2026-04-13T00:00:00.000Z",
    },
  },
  "Nimbus Cloud Solutions": {
    enriched: nimbus.enriched,
    agents: nimbus.agents,
    build: nimbus.build,
    project: {
      filename: "nimbus-cloud-solutions-claude-project-kit.zip",
      downloadedAt: "2026-04-13T00:00:00.000Z",
    },
  },
};

/**
 * Look up cached pipeline data by business name.
 * Returns undefined if no cache exists for this company.
 */
export function getCachedPipeline(businessName: string): CachedPipeline | undefined {
  return CACHE[businessName];
}
```

- [ ] **Step 2: Commit**

```bash
git add client/lib/cache/index.ts
git commit -m "feat(cache): add cache index with company lookup"
```

---

### Task 3: Wire cached data into the pipeline orchestration

**Files:**
- Modify: `client/app/page.tsx` (the `handleIntakeSubmit` and `handleApprove` functions)

The existing code already branches on `isLive(state, "enrich")`, `isLive(state, "agents")`, and `isLive(state, "build")` — and falls back to hardcoded `fallbackEnriched`, `fallbackAgents`, `fallbackBuild`. We need the cached path to use company-specific data instead.

- [ ] **Step 1: Import the cache lookup**

At the top of `page.tsx`, add:

```typescript
import { getCachedPipeline } from "@/lib/cache";
```

- [ ] **Step 2: Update `handleIntakeSubmit` — enrichment fallback**

In `handleIntakeSubmit` (around line 133-136), change the enrichment fallback:

```typescript
// Before:
const enriched = isLive(state, "enrich")
  ? await fetchEnrich(data)
  : fallbackEnriched;

// After:
const cached = getCachedPipeline(data.businessName);
const enriched = isLive(state, "enrich")
  ? await fetchEnrich(data)
  : cached?.enriched ?? fallbackEnriched;
```

- [ ] **Step 3: Update `handleIntakeSubmit` — agents fallback**

In the agents `else` branch (around lines 164-180), use cached agents:

```typescript
// Before:
dispatch({
  type: "SET_AGENT_RESULT",
  payload: { agent: "crm", data: fallbackAgents.crm },
});
// ... (same for creative, design, assets)

// After:
const agentData = cached?.agents ?? fallbackAgents;
dispatch({
  type: "SET_AGENT_RESULT",
  payload: { agent: "crm", data: agentData.crm },
});
dispatch({
  type: "SET_AGENT_RESULT",
  payload: { agent: "creative", data: agentData.creative },
});
dispatch({
  type: "SET_AGENT_RESULT",
  payload: { agent: "design", data: agentData.design },
});
dispatch({
  type: "SET_AGENT_RESULT",
  payload: { agent: "assets", data: agentData.assets },
});
```

Note: `cached` was declared in the enrichment section above — it needs to be accessible in the agents section too. Since both are inside `handleIntakeSubmit`, declare `cached` at the top of the function before the `try` block, or at the start of the `try` block before the enrichment call.

- [ ] **Step 4: Update `handleApprove` — build fallback**

In `handleApprove` (around lines 217-229), replace the hardcoded fallback:

```typescript
// Before:
site = fallbackBuild;

// After:
const cached = getCachedPipeline(state.intake?.businessName ?? "");
site = cached?.build ?? fallbackBuild;
```

- [ ] **Step 5: Update `handleCreateProject` — project fallback**

In `handleCreateProject` (around line 254), replace the hardcoded fallback:

```typescript
// Before:
: fallbackProject;

// After:
const cached = getCachedPipeline(state.intake?.businessName ?? "");
// ... use cached?.project ?? fallbackProject
```

- [ ] **Step 6: Verify the iframe preview works**

Start the dev servers. Select Ridgeline Outdoor Education. Turn OFF the live toggle. Run through the pipeline. When the build completes:
- The stepper should animate through page completions
- The `SitePreview` iframe should load `http://localhost:3001/generated/ridgeline-std/index.html`
- The page tabs (Home, Services, About, Contact) should each load their HTML in the iframe
- The "Open in new tab" link should work

Repeat for Nimbus Cloud Solutions (should load from `nimbus-bold` session).

- [ ] **Step 7: Verify the "no cache" fallback still works**

Select a company that has no cache (e.g., Blue Mesa Roofing). Turn OFF live toggle. Run through. It should fall back to the existing `fallbackEnriched`/`fallbackAgents`/`fallbackBuild` behavior — the old "Website preview not available in cached mode" message for the iframe.

- [ ] **Step 8: Commit**

```bash
git add client/app/page.tsx
git commit -m "feat(cache): wire company-specific cached data into pipeline fallbacks"
```

---

### Task 4: Tune the fake timing for demo feel

**Files:**
- Modify: `client/app/page.tsx`

The current cached build path fires page completions 250ms apart — way too fast for a demo where you want the audience to see progress. The enrichment and agent fallbacks also resolve instantly with no visual delay.

- [ ] **Step 1: Add staggered delays to the enrichment fallback**

After dispatching `SET_ENRICHED` in the cached path, add a short delay before starting agents so the stepper has time to show the enrichment phase:

```typescript
const enriched = isLive(state, "enrich")
  ? await fetchEnrich(data)
  : cached?.enriched ?? fallbackEnriched;
dispatch({ type: "SET_ENRICHED", payload: enriched });

// Give the stepper a beat to show enrichment before agents start
if (!isLive(state, "enrich")) {
  await new Promise((r) => setTimeout(r, 800));
}
```

- [ ] **Step 2: Add staggered delays to the agent fallback**

In the agents `else` block, stagger each agent result ~600-900ms apart so they visually tick in one by one:

```typescript
const agentData = cached?.agents ?? fallbackAgents;
const agentEntries: Array<[string, unknown]> = [
  ["crm", agentData.crm],
  ["creative", agentData.creative],
  ["design", agentData.design],
  ["assets", agentData.assets],
];
for (const [agent, data] of agentEntries) {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));
  dispatch({
    type: "SET_AGENT_RESULT",
    payload: { agent, data } as PipelineAction & { type: "SET_AGENT_RESULT" }["payload"],
  });
}
```

Note: The type assertion above may need adjustment — check that it compiles. The simpler approach is to keep the 4 explicit dispatches and add `await new Promise((r) => setTimeout(r, 700))` before each one.

- [ ] **Step 3: Slow down the build page completions**

Change the 250ms delay between page completions to ~1200ms so each page "completing" is visible in the stepper:

```typescript
// Before:
await new Promise((r) => setTimeout(r, 250));

// After:
await new Promise((r) => setTimeout(r, 1200));
```

- [ ] **Step 4: Test the full demo flow with timing**

Run through both companies in cached mode. The flow should feel like:
- Enrichment: ~1s pause
- Agents: ~3s total (4 agents ticking in ~700ms apart)
- Build: ~5s total (4 pages ticking in ~1200ms apart)
- Total cached demo: ~10-12s — fast enough to not bore, slow enough to show each step

Adjust timings if anything feels too fast or too slow.

- [ ] **Step 5: Commit**

```bash
git add client/app/page.tsx
git commit -m "feat(cache): tune demo timing for enrichment, agents, and build phases"
```
