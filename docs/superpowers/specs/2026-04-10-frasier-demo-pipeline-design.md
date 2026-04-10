# Frasier Digital — Agent Pipeline Demo App

**Date:** 2026-04-10
**Demo date:** 2026-04-16 (Wednesday)
**Presenter:** Joseph Frasier
**Audience:** Prospective client (local Tomball-area business)

## Goal

A single-page React app that demonstrates an end-to-end AI-automated pipeline: a client fills out an intake form, Claude enriches and structures the data, specialized agents produce CRM records / creative briefs / design tokens, and a live website is generated and previewed — all inside one polished browser UI. No terminals, no CLI, no dashboard-hopping.

The core narrative: "You fill out one form. Our AI agents do the rest."

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 + Express (separate servers) | Express gives flexibility for Claude calls; Next.js proxies via API routes |
| Dev setup | `concurrently` runs both; Next.js on :3000, Express on :3001 | Single `npm run dev` command |
| Proxy pattern | Next.js API routes forward to Express | No CORS, clean `/api/*` URLs, API key stays server-side |
| Streaming | No streaming — complete responses | Demo shows quality of transformation, not characters appearing |
| AI pipeline | Two-stage: enrichment first, then parallel agents | Best story: "AI understood your input, then specialists each did their job" |
| Claude Project | Toggle: display payload or create for real | Safe default with option for maximum wow |
| Generated site | Live HTML/CSS served in iframe with nav toolbar | Client sees their actual website inside the demo app |
| Site quality | One-shot production quality via frontend-design skill | Clients won't do change orders; the AI needs to nail it first try |
| Fallback | Full cached data set with per-phase live/cached toggles | April 16 is a sales demo; Murphy's law applies |

---

## Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, TypeScript
- **Backend:** Express 5, Anthropic SDK (`@anthropic-ai/sdk`), TypeScript
- **Dev tooling:** `concurrently`, `tsx` (Express hot reload)
- **No database** — all state lives in React `useReducer`, generated files go to disk
- **No streaming** — standard request/response

---

## Project Structure

```
agent-demo/
├── client/                    # Next.js frontend
│   ├── app/
│   │   ├── page.tsx           # Main pipeline UI
│   │   ├── layout.tsx         # Shell, fonts, global styles
│   │   └── api/               # Thin proxy routes to Express
│   │       ├── enrich/route.ts
│   │       ├── agents/route.ts
│   │       ├── build/route.ts
│   │       └── project/route.ts
│   ├── components/
│   │   ├── Pipeline.tsx       # Phase stepper + state machine
│   │   ├── IntakeForm.tsx     # Phase 1
│   │   ├── EnrichedPayload.tsx # Stage 1 result display
│   │   ├── AgentCard.tsx      # Reusable agent result card
│   │   ├── ApprovalPanel.tsx  # Phase 3
│   │   ├── SitePreview.tsx    # Iframe preview + page nav toolbar
│   │   ├── PayloadCard.tsx    # Formatted deployment payloads
│   │   └── PhaseToggle.tsx    # Live/Cached toggle per phase
│   ├── lib/
│   │   ├── pipeline-state.ts  # useReducer state machine
│   │   ├── fallback-data.ts   # Pre-cached responses (baked in)
│   │   └── types.ts           # Shared TypeScript types
│   └── public/
│       ├── demo-logo.svg
│       └── demo-hero.jpg
│
├── server/                    # Express backend
│   ├── index.ts               # Express app, CORS, routes
│   ├── routes/
│   │   ├── enrich.ts          # Stage 1: raw input -> structured data
│   │   ├── agents.ts          # Stage 2: parallel agent calls
│   │   ├── build.ts           # Generate HTML/CSS website pages
│   │   └── project.ts        # Claude Project creation (optional)
│   ├── prompts/
│   │   ├── enrich.ts          # Enrichment system prompt
│   │   ├── crm.ts             # CRM agent prompt
│   │   ├── creative.ts        # Creative brief prompt
│   │   ├── design.ts          # Design tokens prompt
│   │   └── build.ts           # Website generation prompt (uses frontend-design)
│   ├── services/
│   │   └── claude.ts          # Anthropic SDK wrapper
│   ├── cache/                 # Cached responses from seed run
│   │   └── .gitkeep
│   └── generated/             # Temp dir for generated site files
│       └── .gitkeep
│
├── scripts/
│   └── seed-cache.ts          # Run full pipeline, save responses
├── package.json               # Root: concurrently runs both
├── .env                       # ANTHROPIC_API_KEY (gitignored)
└── .gitignore
```

---

## Pipeline State Machine

### States

```
INTAKE -> ENRICHING -> ENRICHED -> PROCESSING_AGENTS -> AGENTS_COMPLETE
  -> APPROVAL -> BUILDING -> BUILD_COMPLETE -> DEPLOYMENT_READY
```

### State Shape

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
  settings: {
    useLive: Record<string, boolean>;
  };
};
```

### Data Flow

```
[Intake Form] -- raw form data
     |
     v
POST /api/enrich
     |  Receives: raw form data
     |  Returns: structured client profile, brand data, business details
     v
POST /api/agents
     |  Receives: enriched data
     |  Returns: { crm, creative, design, assets } (parallel on server)
     v
[User clicks Approve]
     |
     v
POST /api/build
     |  Receives: enriched data + creative brief + design tokens
     |  Returns: { pages: [{name, html}], nav, metadata }
     |  Side effect: writes HTML files to server/generated/{session-id}/
     v
[Display deployment payloads -- client-side only, no API call]
```

Each API call receives what it needs from accumulated React state. Express stays stateless.

---

## Express Endpoints

### POST /enrich

**Receives:** Raw intake form data (name, business, services, colors, tagline, tone, etc.)

**Claude's job:** Take casual/incomplete input and return a fully structured, enriched client profile. Fill in gaps intelligently — infer industry category, suggest SEO keywords, expand terse service descriptions, generate a professional tagline if none provided.

**Returns:** Structured JSON with client profile, brand guidelines, business details, SEO seeds, CRM-ready fields.

### POST /agents

**Receives:** Enriched data from Stage 1.

**Runs three Claude calls in parallel** (`Promise.all`):

- **CRM agent** — Formats a CRM/database record: client_id, project_id, deal_value, pipeline stage, timestamps, contact info.
- **Creative agent** — Full creative brief: brand voice, hero copy, page-by-page content structure, SEO strategy, color rationale.
- **Design agent** — Design tokens: full color palette with rationale, typography pairing, layout structure per page, spacing scale, component styles as Tailwind-compatible values.

Plus one non-Claude result:

- **Asset agent** — Returns a mock manifest of processed assets (favicon, og-image, responsive hero images). Display only.

**Returns:** `{ crm, creative, design, assets }`

### POST /build

**Receives:** Enriched data + creative brief + design tokens.

**Claude's job:** Generate complete, production-quality HTML/CSS pages. Uses:
- Tailwind CSS via CDN (no build step)
- Google Fonts via CDN (from design token typography pairing)
- Client's brand colors as CSS custom properties
- All content from the creative brief (no placeholder text)
- Uploaded logo and hero image (served from Express)

**Design quality guardrails in the prompt:**
- Full-bleed hero section with overlay text
- Responsive design (mobile-first)
- Consistent spacing scale
- Professional components: service card grid, testimonials, contact form, sticky nav with smooth scroll
- Footer with business info

**Generates four pages:**
- `index.html` — Hero, services overview, testimonials teaser, CTA
- `services.html` — Full service list with descriptions
- `about.html` — Owner story, business history, values
- `contact.html` — Contact form, business hours, location placeholder

**Side effect:** Writes files to `server/generated/{session-id}/` and serves them statically.

**Returns:** `{ sessionId, pages: [{ name, html }], metadata }`

### POST /project (toggle-gated)

**Receives:** Enriched data + creative brief.

**When toggled to "real":** Hits Claude Projects API to create a project and upload knowledge docs.

**When toggled to "display":** Returns the formatted payload that would be sent.

**Returns:** `{ projectId, name, docsCount, mode: "live" | "display" }`

---

## Frontend UI

### Overall Layout

Single-page app. Left sidebar shows the phase stepper with status badges (pending / active / complete). Main content area shows the active phase. Top bar has Frasier Digital branding and a master Live/Cached toggle.

### Phase 1: Client Intake

Clean form with all demo data fields: business name, owner name, email, phone, industry, services (comma-separated), brand colors (two color pickers), tagline, tone dropdown, pages needed (checkboxes), desired domain, budget tier dropdown. File upload spots for logo SVG and hero image. For the demo, these are pre-staged files (`public/demo-logo.svg`, `public/demo-hero.jpg`) — the upload UI is real but the files are already available at known URLs that the build prompt references.

On submit: a "Parsed Intake Payload" card slides in showing the raw data formatted with color swatches, asset thumbnails, and clean labels. Auto-transitions to Phase 2.

### Phase 2: Agent Processing

**Stage 1 — Enrichment card:** Loading state, then side-by-side: "What you typed" (left) vs "What AI structured" (right). First wow moment.

**Stage 2 — Agent cards:** Four cards appear:
- **CRM Agent** — formatted database record fields
- **Creative Brief** — expandable sections (brand voice, hero copy, page structure, SEO, color rationale)
- **Design Tokens** — live color swatches, typography samples, layout diagram
- **Asset Agent** — file manifest with thumbnails

Optional **Claude Project** card with "Create for real" button (toggle-gated).

### Phase 3: Lead Approval

Summary panel pulling from all Phase 2 data. Expandable sections for creative brief, brand assets, domain info, Claude Project. Two buttons: **"Approve & Build"** and **"Request Revisions"**.

### Phase 4: Website Build

Loading state while Claude generates the site. On completion: iframe preview with toolbar above it showing site name, page navigation buttons (Home / Services / About / Contact), and "Open in new tab" link. The generated site displays inside the iframe — custom content, brand colors, logo. This is the biggest wow moment.

### Phase 5: Deployment Ready

Three display-only payload cards:
- **Vercel Deployment** — project name, framework, source repo, env vars, preview URL
- **Domain Registration (Javelina/OpenSRS)** — domain, registrant info, nameservers
- **DNS Zone (Javelina MCP)** — A, CNAME, MX, TXT records table

**Pipeline Complete** summary: total time elapsed, traditional timeline comparison, closing narrative.

---

## Fallback & Caching Strategy

### Seeding the cache

`npm run seed-cache` runs the full pipeline against real Claude and saves every response to `server/cache/*.json`. It also writes the data into `client/lib/fallback-data.ts` as exported TypeScript constants, so cached data is baked into the frontend bundle.

### Toggle system

- **Master toggle** in the top bar: sets default for all phases
- **Per-phase toggle** on each phase card: overrides master
- When set to "Cached": frontend loads from `fallback-data.ts`, skips Express entirely
- When set to "Live": frontend calls Express, which calls Claude

### Offline resilience

With all toggles set to Cached, the entire demo works with zero network:
- Intake form is client-side
- All phase data comes from the baked-in fallback data
- Generated website HTML is bundled as static assets

### Cache includes

- Enrichment response (structured client profile)
- All agent responses (CRM, creative brief, design tokens, asset manifest)
- Generated website HTML pages (full set)
- Claude Project payload (display version)

---

## Demo Data — Fake Client

| Field | Value |
|---|---|
| Business name | Lone Star Pet Grooming |
| Owner | Maria Santos |
| Email | maria@demo.frasierdigital.com |
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

## What's Real vs. Narrated

| Component | Real? | Notes |
|---|---|---|
| Intake form | Real | User fills it out live |
| Parsed payload | Real | Client-side formatting |
| Enrichment (Stage 1) | Real | Live Claude call |
| CRM record | Real | Live Claude call, displayed as DB record |
| Creative brief | Real | Live Claude call |
| Design tokens | Real | Live Claude call |
| Asset processing | Display | Mock manifest, narrate "Sharp processes these" |
| Claude Project creation | Toggle | Real API call or payload display |
| Approval UI | Real | Interactive buttons |
| Website generation | Real | Live Claude call, rendered in iframe |
| Vercel deployment | Display | Formatted payload card |
| Domain registration | Display | Formatted payload card |
| DNS zone | Display | Formatted payload card |

**Five real Claude calls** (enrich + CRM + creative + design + build) make this demo credible. Everything else is formatted display + narration.
