# Irongrove Agent Pipeline Demo — Implementation Plan

**Goal:** A polished single-page demo app that shows an AI-automated pipeline from client intake form to live generated website, for a sales presentation.

**Architecture:** Next.js 15 frontend with a separate Express 5 backend. Next.js proxies API calls to Express via `rewrites` in `next.config.ts`. Express calls the Anthropic SDK for Claude responses. Two-stage AI pipeline: enrichment (Stage 1) then parallel specialized agents (Stage 2). Generated website served as static HTML in an iframe. Full fallback/caching system for demo reliability.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, TypeScript, Express 5, Anthropic SDK (`@anthropic-ai/sdk`), `concurrently`, `tsx`

---

## Quick Start

```bash
# 1. Install dependencies
npm install && cd client && npm install && cd ../server && npm install && cd ..

# 2. Set your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 3. Run both servers
npm run dev

# 4. Open http://localhost:3000
```

---

## Project Structure

```
agent-demo/
├── client/                    # Next.js frontend (port 3000)
│   ├── app/
│   │   ├── page.tsx           # Main pipeline UI — orchestrates all phases
│   │   ├── layout.tsx         # Shell: fonts, Tailwind, metadata
│   │   └── globals.css        # Tailwind 4 theme + custom animations
│   ├── components/
│   │   ├── IntakeForm.tsx     # Phase 1: intake form with demo data
│   │   ├── PayloadCard.tsx    # Formatted intake payload display
│   │   ├── EnrichedPayload.tsx # Phase 2 Stage 1: raw vs enriched side-by-side
│   │   ├── AgentCard.tsx      # Phase 2 Stage 2: reusable agent result cards
│   │   ├── ApprovalPanel.tsx  # Phase 3: summary + approve/revise
│   │   ├── SitePreview.tsx    # Phase 4: iframe + page nav toolbar
│   │   ├── DeploymentCards.tsx # Phase 5: Vercel, domain, DNS payloads
│   │   ├── PipelineStepper.tsx # Left sidebar phase stepper
│   │   └── PhaseToggle.tsx    # Live/Cached toggle pill
│   ├── lib/
│   │   ├── types.ts           # All shared TypeScript types
│   │   ├── pipeline-reducer.ts # useReducer state machine
│   │   ├── api.ts             # Fetch helpers for each endpoint
│   │   └── fallback-data.ts   # Pre-cached responses for offline/demo
│   ├── public/
│   │   ├── demo-logo.svg      # Fake client logo
│   │   └── demo-hero.jpg      # Placeholder hero image
│   └── next.config.ts         # Rewrites /api/* to Express on :3001
│
├── server/                    # Express backend (port 3001)
│   ├── index.ts               # Express app: CORS, JSON, static, routes
│   ├── routes/
│   │   ├── enrich.ts          # POST /enrich — Stage 1 enrichment
│   │   ├── agents.ts          # POST /agents — Stage 2 parallel agents
│   │   ├── build.ts           # POST /build — Generate HTML website
│   │   └── project.ts         # POST /project — Claude Project (toggle)
│   ├── prompts/
│   │   ├── enrich.ts          # Enrichment system prompt
│   │   ├── crm.ts             # CRM agent prompt
│   │   ├── creative.ts        # Creative brief prompt
│   │   ├── design.ts          # Design tokens prompt
│   │   └── build.ts           # Website generation prompt
│   ├── services/
│   │   └── claude.ts          # Anthropic SDK wrapper
│   ├── cache/                 # Cached responses from seed run
│   └── generated/             # Generated site HTML files
│
├── scripts/
│   └── seed-cache.ts          # Run pipeline, cache all outputs
├── .env                       # ANTHROPIC_API_KEY (gitignored)
└── PLAN.md                    # This file
```

---

## Architecture

### Data Flow

```
[Intake Form] -- raw form data
     |
     v
POST /api/enrich  (proxied to Express :3001)
     |  Receives: raw form data
     |  Returns: structured client profile, brand data, SEO, business details
     v
POST /api/agents  (proxied to Express :3001)
     |  Receives: enriched data
     |  Runs 3 Claude calls in parallel (Promise.all):
     |    - CRM agent -> database record
     |    - Creative agent -> full creative brief
     |    - Design agent -> design tokens
     |  Plus mocked asset agent (no Claude call)
     |  Returns: { crm, creative, design, assets }
     v
[User clicks Approve]
     |
     v
POST /api/build  (proxied to Express :3001)
     |  Receives: enriched + creative brief + design tokens
     |  Returns: generated HTML pages (written to disk + served statically)
     v
[Phase 5: Display deployment payloads — client-side only]
```

### Pipeline State Machine

```
INTAKE -> ENRICHING -> ENRICHED -> PROCESSING_AGENTS -> AGENTS_COMPLETE
  -> APPROVAL -> BUILDING -> BUILD_COMPLETE -> DEPLOYMENT_READY
```

Managed by `useReducer` in `client/app/page.tsx`. State shape:

```typescript
type PipelineState = {
  phase: PhaseStatus;
  intake: IntakeData | null;
  enriched: EnrichedData | null;
  agents: {
    crm: CrmRecord | null;
    creative: CreativeBrief | null;
    design: DesignTokens | null;
    project: ProjectResult | null;
    assets: AssetManifest | null;
  };
  build: GeneratedSite | null;
  error: string | null;
  settings: {
    masterLive: boolean;
    phaseLive: Record<string, boolean>;
  };
};
```

### Proxy Pattern

Next.js `rewrites` in `next.config.ts` proxies `/api/*` to Express on `:3001`. No CORS needed from the browser. API key stays server-side.

```
Browser -> GET localhost:3000      (Next.js serves frontend)
Browser -> POST /api/enrich        (Next.js rewrites to localhost:3001/enrich)
Express -> Anthropic SDK           (server-side, API key from .env)
Express <- Claude response         (JSON)
Browser <- response                (proxied back through Next.js)
```

---

## Express Endpoints

### POST /enrich (Stage 1)

- **Input:** Raw intake form data
- **Claude prompt:** `server/prompts/enrich.ts` — business data analyst persona
- **Output:** Structured JSON: client profile, brand guidelines, expanded services, SEO keywords, business details
- **Purpose:** Transform messy human input into professional, structured data

### POST /agents (Stage 2)

- **Input:** Enriched data from Stage 1
- **Runs 3 Claude calls in parallel:**
  - CRM agent (`prompts/crm.ts`) — formatted database record
  - Creative agent (`prompts/creative.ts`) — full creative brief with page content
  - Design agent (`prompts/design.ts`) — color palette, typography, layout tokens
- **Also returns:** Mocked asset manifest (no Claude call)
- **Output:** `{ crm, creative, design, assets }`

### POST /build (Phase 4)

- **Input:** Enriched data + creative brief + design tokens
- **Claude prompt:** `server/prompts/build.ts` — generates complete HTML/CSS pages
- **Output:** 4 HTML pages (Home, Services, About, Contact) using Tailwind CDN
- **Side effect:** Writes HTML files to `server/generated/{session-id}/`, served statically
- **The iframe in SitePreview.tsx loads from:** `http://localhost:3001/generated/{session-id}/index.html`

### POST /project (optional)

- **Input:** Enriched data + creative brief + mode ("live" or "display")
- **Live mode:** Creates a real Claude Project via API (with try/catch fallback)
- **Display mode:** Returns formatted payload showing what would be sent

---

## Frontend Phases

### Phase 1: Client Intake
- `IntakeForm.tsx` — pre-filled with demo data (Lone Star Pet Grooming)
- On submit: `PayloadCard.tsx` shows formatted intake data
- Auto-transitions to Phase 2

### Phase 2: Agent Processing (two stages)
- **Stage 1:** `EnrichedPayload.tsx` — side-by-side "What you typed" vs "What AI structured"
- **Stage 2:** Four `AgentCard.tsx` instances (CRM, Creative, Design, Assets)
- Optional Claude Project card with "Create for real" button

### Phase 3: Lead Approval
- `ApprovalPanel.tsx` — collapsible sections reviewing all Phase 2 output
- "Approve & Build" button triggers Phase 4

### Phase 4: Website Build
- `SitePreview.tsx` — iframe preview with page navigation toolbar
- Generated HTML served from Express static files

### Phase 5: Deployment Ready
- `DeploymentCards.tsx` — formatted payload cards (Vercel, Domain/Javelina, DNS)
- Pipeline Complete summary with elapsed time

---

## Live/Cached Toggle System

Every phase has a toggle between **Live** (real Claude API calls) and **Cached** (pre-baked fallback data).

- **Master toggle** in sidebar sets default for all phases
- **Per-phase toggles** override the master
- When Cached: frontend loads from `client/lib/fallback-data.ts`, skips Express
- When Live: frontend calls Express, which calls Claude

### Seeding the cache

```bash
# Start server first, then:
npm run seed-cache
```

Runs the full pipeline against Claude and writes responses to:
- `server/cache/*.json` — raw cached responses
- `client/lib/fallback-data.ts` — baked into the frontend bundle

---

## Key Design Decisions

| Decision | Choice | Why |
|---|---|---|
| No streaming | Complete responses | Demo shows quality of transformation, not characters appearing |
| Two-stage pipeline | Enrich first, then agents | Best story: "AI understood your input, then specialists did their jobs" |
| Generated site in iframe | HTML/CSS with Tailwind CDN | Client sees their actual website inside the demo app |
| Full fallback system | Per-phase live/cached toggles | Sales demo reliability — Murphy's law applies |
| Next.js rewrites proxy | No individual API route files | Simpler than writing 4 proxy handlers |
| Express separate from Next.js | Two processes via concurrently | Flexibility for Claude calls, hot reload independence |

---

## Demo Data — Fake Client

| Field | Value |
|---|---|
| Business name | Lone Star Pet Grooming |
| Owner | Maria Santos |
| Email | maria@demo.irongrove.dev |
| Phone | (281) 555-0142 |
| Industry | Pet services |
| Services | Dog grooming, cat grooming, nail trimming, flea treatment |
| Brand colors | #2D5F2D (forest green), #F5E6D3 (cream) |
| Tagline | "Where every pet leaves happy" |
| Tone | Friendly, warm, trustworthy |
| Pages | Home, Services, About, Contact |
| Domain | lonestarpetgrooming.com |
| Budget tier | Standard ($1,500) |

---

## What's Real vs. Narrated in the Demo

| Component | Real? | Notes |
|---|---|---|
| Intake form | Real | User fills it out live |
| Parsed payload | Real | Client-side formatting |
| Enrichment (Stage 1) | Real | Live Claude call |
| CRM record | Real | Live Claude call |
| Creative brief | Real | Live Claude call |
| Design tokens | Real | Live Claude call |
| Asset processing | Display | Mock manifest |
| Claude Project | Toggle | Real API or payload display |
| Approval UI | Real | Interactive buttons |
| Website generation | Real | Live Claude call, rendered in iframe |
| Vercel deployment | Display | Formatted payload card |
| Domain registration | Display | Formatted payload card |
| DNS zone | Display | Formatted payload card |

---

## Pre-Demo Checklist

- [ ] Real API key in `.env` with sufficient credits
- [ ] Replace `client/public/demo-hero.jpg` with a real groomed-dog photo
- [ ] Run full pipeline once with Live AI
- [ ] Run `npm run seed-cache` to capture outputs as fallback
- [ ] Full rehearsal run (aim for under 15 minutes)
- [ ] Test cached mode works offline
