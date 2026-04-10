# Frasier Digital Agent Pipeline Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished single-page demo app that shows an AI-automated pipeline from client intake form to live generated website, for a sales presentation on April 16, 2026.

**Architecture:** Next.js 15 frontend with a separate Express 5 backend. Next.js proxies API calls to Express via `rewrites` in `next.config.ts`. Express calls the Anthropic SDK for Claude responses. Two-stage AI pipeline: enrichment (Stage 1) then parallel specialized agents (Stage 2). Generated website served as static HTML in an iframe. Full fallback/caching system for demo reliability.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, TypeScript, Express 5, Anthropic SDK (`@anthropic-ai/sdk`), Zod, `concurrently`, `tsx`

---

## File Map

### Root

| File | Purpose |
|---|---|
| `package.json` | Root scripts: `dev` runs both servers via concurrently |
| `.env` | `ANTHROPIC_API_KEY` (gitignored) |
| `.gitignore` | node_modules, .env, .next, generated sites, .superpowers |
| `tsconfig.base.json` | Shared TypeScript config |

### `client/` — Next.js Frontend

| File | Purpose |
|---|---|
| `package.json` | Next.js dependencies |
| `tsconfig.json` | Extends base, Next.js paths |
| `next.config.ts` | Rewrites `/api/*` to Express on :3001 |
| `app/layout.tsx` | Shell: fonts, Tailwind, metadata |
| `app/page.tsx` | Main pipeline page — state machine + phase rendering |
| `app/globals.css` | Tailwind directives + custom animations |
| `components/IntakeForm.tsx` | Phase 1: intake form with all fields |
| `components/PayloadCard.tsx` | Reusable formatted data card (key-value, color swatches) |
| `components/EnrichedPayload.tsx` | Phase 2 Stage 1: side-by-side raw vs enriched |
| `components/AgentCard.tsx` | Phase 2 Stage 2: reusable agent result card with spinner/complete states |
| `components/ApprovalPanel.tsx` | Phase 3: summary + approve/revise buttons |
| `components/SitePreview.tsx` | Phase 4: iframe + nav toolbar |
| `components/DeploymentCards.tsx` | Phase 5: Vercel, domain, DNS payload cards |
| `components/PipelineStepper.tsx` | Left sidebar phase stepper |
| `components/PhaseToggle.tsx` | Live/Cached toggle pill |
| `lib/types.ts` | All shared TypeScript types |
| `lib/pipeline-reducer.ts` | useReducer state machine |
| `lib/fallback-data.ts` | Pre-cached responses for offline/fallback |
| `lib/api.ts` | Fetch helpers for each endpoint |
| `public/demo-logo.svg` | Pre-staged fake client logo |
| `public/demo-hero.jpg` | Pre-staged fake client hero image |

### `server/` — Express Backend

| File | Purpose |
|---|---|
| `package.json` | Express + Anthropic SDK dependencies |
| `tsconfig.json` | Extends base, Node target |
| `index.ts` | Express app: CORS, JSON parsing, static serving, route mounting |
| `routes/enrich.ts` | POST /enrich — Stage 1 enrichment |
| `routes/agents.ts` | POST /agents — Stage 2 parallel agent calls |
| `routes/build.ts` | POST /build — Generate website HTML files |
| `routes/project.ts` | POST /project — Claude Project creation (toggle-gated) |
| `services/claude.ts` | Anthropic SDK wrapper: init client, call with system+user prompt, return parsed JSON |
| `prompts/enrich.ts` | System prompt for enrichment |
| `prompts/crm.ts` | System prompt for CRM agent |
| `prompts/creative.ts` | System prompt for creative brief agent |
| `prompts/design.ts` | System prompt for design tokens agent |
| `prompts/build.ts` | System prompt for website generation |
| `generated/.gitkeep` | Directory for generated site files |

### `scripts/`

| File | Purpose |
|---|---|
| `seed-cache.ts` | Run full pipeline against Claude, save responses to fallback-data.ts |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env`
- Create: `tsconfig.base.json`
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/next.config.ts`
- Create: `client/app/globals.css`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/generated/.gitkeep`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "frasier-demo",
  "private": true,
  "scripts": {
    "dev": "concurrently -n client,server -c blue,green \"npm run dev --prefix client\" \"npm run dev --prefix server\"",
    "seed-cache": "tsx scripts/seed-cache.ts"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.env
.next/
dist/
server/generated/*
!server/generated/.gitkeep
.superpowers/
*.tsbuildinfo
```

- [ ] **Step 3: Create .env**

```
ANTHROPIC_API_KEY=your-key-here
```

- [ ] **Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true
  }
}
```

- [ ] **Step 5: Create client/package.json**

```json
{
  "name": "frasier-demo-client",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build"
  },
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 6: Create client/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 7: Create client/next.config.ts**

This rewrites `/api/*` to Express on port 3001, so the frontend calls `/api/enrich` and it transparently proxies to `http://localhost:3001/enrich`.

```typescript
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*",
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 8: Create client/postcss.config.mjs**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 9: Create client/app/globals.css**

```css
@import "tailwindcss";

@theme {
  --color-frasier-green: #2D5F2D;
  --color-frasier-cream: #F5E6D3;
  --color-frasier-dark: #1a1a2e;
  --color-frasier-card: #16213e;
  --color-frasier-border: #0f3460;
  --font-sans: "Inter", system-ui, sans-serif;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out forwards;
}

.animate-pulse-dot {
  animation: pulse-dot 1.5s ease-in-out infinite;
}
```

- [ ] **Step 10: Create server/package.json**

```json
{
  "name": "frasier-demo-server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 11: Create server/tsconfig.json**

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "noEmit": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 12: Create server/generated/.gitkeep**

Empty file.

- [ ] **Step 13: Install dependencies**

Run: `npm install && cd client && npm install && cd ../server && npm install && cd ..`

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold project structure with Next.js + Express"
```

---

## Task 2: Shared TypeScript Types

**Files:**
- Create: `client/lib/types.ts`

- [ ] **Step 1: Write all shared types**

```typescript
// === Intake (Phase 1) ===

export type IntakeData = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  industry: string;
  services: string;
  brandColors: { primary: string; secondary: string };
  tagline: string;
  tone: string;
  pagesNeeded: string[];
  desiredDomain: string;
  budgetTier: string;
  logoUrl: string;
  heroImageUrl: string;
};

// === Enrichment (Phase 2, Stage 1) ===

export type EnrichedData = {
  client: {
    name: string;
    businessName: string;
    email: string;
    phone: string;
    industry: string;
    industryCategory: string;
    location: string;
  };
  brand: {
    tagline: string;
    tone: string[];
    voiceGuidelines: string;
    colors: {
      primary: { hex: string; name: string };
      secondary: { hex: string; name: string };
    };
  };
  services: Array<{
    name: string;
    description: string;
    keywords: string[];
  }>;
  seo: {
    primaryKeywords: string[];
    secondaryKeywords: string[];
    metaDescription: string;
  };
  businessDetails: {
    yearsInBusiness: string;
    serviceArea: string;
    uniqueSellingPoints: string[];
  };
};

// === Agent Results (Phase 2, Stage 2) ===

export type CrmRecord = {
  clientId: string;
  projectId: string;
  status: string;
  pipeline: string;
  dealValue: string;
  createdAt: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
  };
};

export type CreativeBrief = {
  brandVoice: {
    tone: string;
    personality: string;
    languageGuidelines: string[];
  };
  heroSection: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  pages: Array<{
    name: string;
    sections: Array<{
      type: string;
      heading: string;
      content: string;
    }>;
    metaTitle: string;
    metaDescription: string;
  }>;
  seoStrategy: {
    primaryKeywords: string[];
    contentThemes: string[];
  };
  colorRationale: string;
};

export type DesignTokens = {
  colors: Array<{
    role: string;
    hex: string;
    name: string;
    usage: string;
  }>;
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: string;
    bodyWeight: string;
  };
  layout: {
    maxWidth: string;
    sections: Array<{
      name: string;
      type: string;
      columns?: number;
    }>;
  };
  spacing: {
    sectionPadding: string;
    componentGap: string;
  };
};

export type AssetManifest = {
  logo: { filename: string; dimensions: string; size: string };
  generated: Array<{
    filename: string;
    dimensions: string;
    purpose: string;
  }>;
};

export type ProjectResult = {
  projectId: string;
  name: string;
  docsCount: number;
  mode: "live" | "display";
};

export type AgentsResult = {
  crm: CrmRecord;
  creative: CreativeBrief;
  design: DesignTokens;
  assets: AssetManifest;
};

// === Build (Phase 4) ===

export type GeneratedPage = {
  name: string;
  filename: string;
  html: string;
};

export type GeneratedSite = {
  sessionId: string;
  pages: GeneratedPage[];
  metadata: {
    framework: string;
    styling: string;
    pageCount: number;
    generatedAt: string;
  };
};

// === Pipeline State ===

export type PhaseStatus =
  | "intake"
  | "enriching"
  | "enriched"
  | "processing_agents"
  | "agents_complete"
  | "approval"
  | "building"
  | "build_complete"
  | "deployment_ready";

export type PipelineState = {
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

export type PipelineAction =
  | { type: "SUBMIT_INTAKE"; payload: IntakeData }
  | { type: "SET_ENRICHED"; payload: EnrichedData }
  | { type: "SET_AGENTS"; payload: AgentsResult }
  | { type: "SET_PROJECT"; payload: ProjectResult }
  | { type: "APPROVE" }
  | { type: "SET_BUILD"; payload: GeneratedSite }
  | { type: "SET_DEPLOYMENT_READY" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_PHASE"; payload: PhaseStatus }
  | { type: "TOGGLE_MASTER_LIVE" }
  | { type: "TOGGLE_PHASE_LIVE"; payload: string }
  | { type: "RESET" };
```

- [ ] **Step 2: Commit**

```bash
git add client/lib/types.ts
git commit -m "feat: add shared TypeScript types for pipeline state and API responses"
```

---

## Task 3: Express Server Skeleton + Claude Service

**Files:**
- Create: `server/services/claude.ts`
- Create: `server/index.ts`

- [ ] **Step 1: Write the Claude service wrapper**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function callClaude<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response — handle markdown code fences
  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  return JSON.parse(jsonStr) as T;
}
```

- [ ] **Step 2: Write the Express server entry point**

```typescript
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { enrichRouter } from "./routes/enrich.js";
import { agentsRouter } from "./routes/agents.js";
import { buildRouter } from "./routes/build.js";
import { projectRouter } from "./routes/project.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));

// Serve generated site files statically
app.use("/generated", express.static(path.join(__dirname, "generated")));

// Mount routes
app.use("/enrich", enrichRouter);
app.use("/agents", agentsRouter);
app.use("/build", buildRouter);
app.use("/project", projectRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 3: Create placeholder route files**

Create four placeholder files so the server compiles. Each will be replaced in later tasks.

`server/routes/enrich.ts`:
```typescript
import { Router } from "express";
export const enrichRouter = Router();
enrichRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
```

`server/routes/agents.ts`:
```typescript
import { Router } from "express";
export const agentsRouter = Router();
agentsRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
```

`server/routes/build.ts`:
```typescript
import { Router } from "express";
export const buildRouter = Router();
buildRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
```

`server/routes/project.ts`:
```typescript
import { Router } from "express";
export const projectRouter = Router();
projectRouter.post("/", (_req, res) => {
  res.json({ placeholder: true });
});
```

- [ ] **Step 4: Verify server starts**

Run: `cd server && npx tsx index.ts`
Expected: `Express server running on http://localhost:3001`

Kill the process after verifying.

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "feat: add Express server skeleton with Claude service wrapper"
```

---

## Task 4: Enrichment Endpoint

**Files:**
- Create: `server/prompts/enrich.ts`
- Modify: `server/routes/enrich.ts`

- [ ] **Step 1: Write the enrichment system prompt**

```typescript
export const enrichSystemPrompt = `You are a business data analyst at Frasier Digital, a web design agency in Tomball, TX. 

Given raw client intake form data, your job is to enrich and structure it into a comprehensive client profile. You must:

1. Expand terse service descriptions into professional, detailed descriptions
2. Infer the industry category from the business description
3. Generate SEO-ready keywords based on the business and location
4. Identify unique selling points
5. Fill in reasonable defaults for any sparse fields
6. Ensure all text is professional and client-ready

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):

{
  "client": {
    "name": "owner's full name",
    "businessName": "official business name",
    "email": "email",
    "phone": "formatted phone",
    "industry": "specific industry",
    "industryCategory": "broad category",
    "location": "city, state"
  },
  "brand": {
    "tagline": "polished tagline (improve if needed)",
    "tone": ["array", "of", "tone", "descriptors"],
    "voiceGuidelines": "2-3 sentence brand voice description",
    "colors": {
      "primary": { "hex": "#hexcode", "name": "color name" },
      "secondary": { "hex": "#hexcode", "name": "color name" }
    }
  },
  "services": [
    {
      "name": "Service Name",
      "description": "2-3 sentence professional description",
      "keywords": ["seo", "keywords"]
    }
  ],
  "seo": {
    "primaryKeywords": ["top 5 primary keywords"],
    "secondaryKeywords": ["5-8 secondary/long-tail keywords"],
    "metaDescription": "155 character meta description for the homepage"
  },
  "businessDetails": {
    "yearsInBusiness": "inferred or stated",
    "serviceArea": "geographic service area",
    "uniqueSellingPoints": ["3-5 unique selling points"]
  }
}`;
```

- [ ] **Step 2: Implement the enrichment route**

Replace `server/routes/enrich.ts`:

```typescript
import { Router } from "express";
import { callClaude } from "../services/claude.js";
import { enrichSystemPrompt } from "../prompts/enrich.js";

export const enrichRouter = Router();

enrichRouter.post("/", async (req, res) => {
  try {
    const intake = req.body;
    const result = await callClaude({
      system: enrichSystemPrompt,
      user: `Here is the raw client intake data:\n\n${JSON.stringify(intake, null, 2)}`,
    });
    res.json(result);
  } catch (error) {
    console.error("Enrichment error:", error);
    res.status(500).json({
      error: "Enrichment failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
```

- [ ] **Step 3: Verify with curl**

Start the server, then test:

Run: `curl -X POST http://localhost:3001/enrich -H "Content-Type: application/json" -d '{"businessName":"Lone Star Pet Grooming","ownerName":"Maria Santos","services":"Dog grooming, cat grooming","brandColors":{"primary":"#2D5F2D","secondary":"#F5E6D3"},"tagline":"Where every pet leaves happy","tone":"Friendly","industry":"Pet services"}'`

Expected: A JSON response with the enriched structure containing `client`, `brand`, `services`, `seo`, and `businessDetails` fields.

- [ ] **Step 4: Commit**

```bash
git add server/prompts/enrich.ts server/routes/enrich.ts
git commit -m "feat: add enrichment endpoint with Claude prompt"
```

---

## Task 5: Agent Prompts + Agents Endpoint

**Files:**
- Create: `server/prompts/crm.ts`
- Create: `server/prompts/creative.ts`
- Create: `server/prompts/design.ts`
- Modify: `server/routes/agents.ts`

- [ ] **Step 1: Write the CRM agent prompt**

```typescript
export const crmSystemPrompt = `You are a CRM data agent at Frasier Digital. Given enriched client data, generate a structured CRM record ready for database insertion.

Return ONLY valid JSON (no markdown, no explanation):

{
  "clientId": "cli_XXXX (generate a realistic 4-digit ID)",
  "projectId": "proj_XXXX (generate a realistic 4-digit ID)",
  "status": "intake_complete",
  "pipeline": "Website · [budget tier]",
  "dealValue": "$X,XXX",
  "createdAt": "ISO 8601 timestamp (use current date/time)",
  "contact": {
    "name": "full name",
    "email": "email",
    "phone": "phone",
    "businessName": "business name"
  }
}`;
```

- [ ] **Step 2: Write the creative brief agent prompt**

```typescript
export const creativeSystemPrompt = `You are a creative director at Frasier Digital, a web design agency in Tomball, TX. Given enriched client data, generate a comprehensive creative brief for their website.

Return ONLY valid JSON (no markdown, no explanation):

{
  "brandVoice": {
    "tone": "overall tone description",
    "personality": "brand personality in 2-3 sentences",
    "languageGuidelines": ["5-7 specific writing guidelines"]
  },
  "heroSection": {
    "headline": "compelling hero headline",
    "subheadline": "supporting subheadline (1-2 sentences)",
    "ctaText": "call-to-action button text"
  },
  "pages": [
    {
      "name": "page name",
      "sections": [
        {
          "type": "hero|features|content|testimonials|cta|contact|about",
          "heading": "section heading",
          "content": "full section copy (3-5 sentences minimum, real content, not placeholder)"
        }
      ],
      "metaTitle": "SEO page title (under 60 chars)",
      "metaDescription": "meta description (under 155 chars)"
    }
  ],
  "seoStrategy": {
    "primaryKeywords": ["keywords"],
    "contentThemes": ["themes for blog/content marketing"]
  },
  "colorRationale": "2-3 sentences explaining why the chosen colors work for this brand"
}

IMPORTANT: Generate REAL, detailed content for every section. No placeholder text. Every word should be specific to this business. The pages array must include: Home, Services, About, and Contact.`;
```

- [ ] **Step 3: Write the design tokens agent prompt**

```typescript
export const designSystemPrompt = `You are a UI designer at Frasier Digital. Given enriched client data including brand colors, generate a complete design token system for their website.

Return ONLY valid JSON (no markdown, no explanation):

{
  "colors": [
    { "role": "primary", "hex": "#hexcode", "name": "color name", "usage": "where this is used" },
    { "role": "secondary", "hex": "#hexcode", "name": "color name", "usage": "where this is used" },
    { "role": "accent", "hex": "#hexcode", "name": "derived accent color", "usage": "buttons, links, highlights" },
    { "role": "neutral", "hex": "#hexcode", "name": "neutral color", "usage": "body text, borders" },
    { "role": "background", "hex": "#hexcode", "name": "background color", "usage": "page background" }
  ],
  "typography": {
    "headingFont": "Google Font name for headings",
    "bodyFont": "Google Font name for body text",
    "headingWeight": "font weight",
    "bodyWeight": "font weight"
  },
  "layout": {
    "maxWidth": "max container width (e.g. 1280px)",
    "sections": [
      { "name": "section name", "type": "full-bleed|contained|split|grid", "columns": 1 }
    ]
  },
  "spacing": {
    "sectionPadding": "vertical padding between sections",
    "componentGap": "gap between components in a grid"
  }
}

The color palette should complement and extend the client's brand colors. Choose typography that matches the brand tone. Design the layout for a modern, professional small-business website.`;
```

- [ ] **Step 4: Implement the agents route with parallel calls**

Replace `server/routes/agents.ts`:

```typescript
import { Router } from "express";
import { callClaude } from "../services/claude.js";
import { crmSystemPrompt } from "../prompts/crm.js";
import { creativeSystemPrompt } from "../prompts/creative.js";
import { designSystemPrompt } from "../prompts/design.js";

export const agentsRouter = Router();

agentsRouter.post("/", async (req, res) => {
  try {
    const enriched = req.body;
    const enrichedStr = JSON.stringify(enriched, null, 2);

    // Run CRM, Creative, and Design agents in parallel
    const [crm, creative, design] = await Promise.all([
      callClaude({
        system: crmSystemPrompt,
        user: `Enriched client data:\n\n${enrichedStr}`,
      }),
      callClaude({
        system: creativeSystemPrompt,
        user: `Enriched client data:\n\n${enrichedStr}`,
        maxTokens: 8192,
      }),
      callClaude({
        system: designSystemPrompt,
        user: `Enriched client data:\n\n${enrichedStr}`,
      }),
    ]);

    // Asset agent is mocked — no Claude call
    const assets = {
      logo: {
        filename: "demo-logo.svg",
        dimensions: "400x120",
        size: "24KB",
      },
      generated: [
        { filename: "favicon.ico", dimensions: "32x32", purpose: "Browser tab icon" },
        { filename: "og-image.png", dimensions: "1200x630", purpose: "Social sharing" },
        { filename: "hero-2560.webp", dimensions: "2560x1440", purpose: "Desktop hero" },
        { filename: "hero-1280.webp", dimensions: "1280x720", purpose: "Tablet hero" },
        { filename: "hero-640.webp", dimensions: "640x360", purpose: "Mobile hero" },
      ],
    };

    res.json({ crm, creative, design, assets });
  } catch (error) {
    console.error("Agents error:", error);
    res.status(500).json({
      error: "Agent processing failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
```

- [ ] **Step 5: Commit**

```bash
git add server/prompts/ server/routes/agents.ts
git commit -m "feat: add CRM, creative, and design agent prompts with parallel execution"
```

---

## Task 6: Build Endpoint (Website Generation)

**Files:**
- Create: `server/prompts/build.ts`
- Modify: `server/routes/build.ts`

- [ ] **Step 1: Write the website generation prompt**

```typescript
export function buildSystemPrompt(opts: {
  logoUrl: string;
  heroImageUrl: string;
}): string {
  return `You are an expert frontend developer at Frasier Digital. Generate a complete, production-quality website as static HTML pages.

REQUIREMENTS:
- Each page is a standalone HTML file with <!DOCTYPE html>
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Use Google Fonts via CDN (link in <head>)
- Responsive design — mobile-first with breakpoints for tablet and desktop
- Professional, modern design — NOT generic AI-looking output
- Full-bleed hero section with overlay text on the homepage
- Sticky navigation bar with smooth scroll and links between pages
- Footer on every page with business info and copyright
- Color scheme uses the design tokens provided (apply as Tailwind config)
- All content comes from the creative brief — NO placeholder text whatsoever
- Logo URL: ${opts.logoUrl}
- Hero image URL: ${opts.heroImageUrl}

TAILWIND CONFIG — include this script after the CDN script on every page:
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      }
    }
  }
}
</script>

Then define CSS custom properties in a <style> block using the provided design tokens.

DESIGN QUALITY STANDARDS:
- Hero: full-viewport height, background image with dark overlay, white text, centered content
- Services: card grid (3 columns desktop, 1 column mobile), subtle shadows, hover effects
- About: split layout (image left, text right on desktop, stacked on mobile)
- Contact: form with styled inputs, business hours sidebar, map placeholder
- Testimonials: carousel-style or card layout with quote marks
- Consistent spacing: py-20 for sections, gap-8 for grids
- Transitions: hover effects on buttons and cards (transition-all duration-300)
- Buttons: rounded, primary color background, white text, hover darkening

Return ONLY a JSON object (no markdown, no explanation):

{
  "pages": [
    { "name": "Home", "filename": "index.html", "html": "<!DOCTYPE html>..." },
    { "name": "Services", "filename": "services.html", "html": "<!DOCTYPE html>..." },
    { "name": "About", "filename": "about.html", "html": "<!DOCTYPE html>..." },
    { "name": "Contact", "filename": "contact.html", "html": "<!DOCTYPE html>..." }
  ]
}

CRITICAL: The html field must contain the COMPLETE HTML document for each page. Every page must be fully functional on its own.`;
}
```

- [ ] **Step 2: Implement the build route**

Replace `server/routes/build.ts`:

```typescript
import { Router } from "express";
import { callClaude } from "../services/claude.js";
import { buildSystemPrompt } from "../prompts/build.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const buildRouter = Router();

buildRouter.post("/", async (req, res) => {
  try {
    const { enriched, creative, design } = req.body;
    const sessionId = crypto.randomUUID().slice(0, 8);

    const prompt = buildSystemPrompt({
      logoUrl: "/generated/demo-logo.svg",
      heroImageUrl: "/generated/demo-hero.jpg",
    });

    const result = await callClaude<{
      pages: Array<{ name: string; filename: string; html: string }>;
    }>({
      system: prompt,
      user: `Generate the website using this data:

ENRICHED CLIENT DATA:
${JSON.stringify(enriched, null, 2)}

CREATIVE BRIEF:
${JSON.stringify(creative, null, 2)}

DESIGN TOKENS:
${JSON.stringify(design, null, 2)}`,
      maxTokens: 16384,
    });

    // Write generated HTML files to disk
    const sessionDir = path.join(__dirname, "..", "generated", sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Copy demo assets into the session directory
    const publicDir = path.join(__dirname, "..", "..", "client", "public");
    try {
      await fs.copyFile(
        path.join(publicDir, "demo-logo.svg"),
        path.join(sessionDir, "demo-logo.svg")
      );
      await fs.copyFile(
        path.join(publicDir, "demo-hero.jpg"),
        path.join(sessionDir, "demo-hero.jpg")
      );
    } catch {
      // Assets may not exist yet — non-fatal
    }

    for (const page of result.pages) {
      // Fix asset paths to be relative
      const fixedHtml = page.html
        .replace(/\/generated\/demo-logo\.svg/g, "demo-logo.svg")
        .replace(/\/generated\/demo-hero\.jpg/g, "demo-hero.jpg");
      await fs.writeFile(path.join(sessionDir, page.filename), fixedHtml);
    }

    res.json({
      sessionId,
      pages: result.pages.map((p) => ({
        name: p.name,
        filename: p.filename,
      })),
      metadata: {
        framework: "Static HTML + Tailwind CSS CDN",
        styling: "Tailwind CSS",
        pageCount: result.pages.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Build error:", error);
    res.status(500).json({
      error: "Website build failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add server/prompts/build.ts server/routes/build.ts
git commit -m "feat: add website generation endpoint with HTML file writing"
```

---

## Task 7: Claude Project Endpoint

**Files:**
- Modify: `server/routes/project.ts`

- [ ] **Step 1: Implement the project route**

Replace `server/routes/project.ts`:

```typescript
import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

export const projectRouter = Router();

const client = new Anthropic();

projectRouter.post("/", async (req, res) => {
  try {
    const { enriched, creative, mode } = req.body;

    const projectPayload = {
      name: `${enriched.client.businessName} — Website Build`,
      description: `Web design project for ${enriched.client.businessName}. ${enriched.brand.tagline}`,
      knowledgeDocs: [
        {
          name: "Client Intake Data",
          content: JSON.stringify(enriched, null, 2),
        },
        {
          name: "Creative Brief",
          content: JSON.stringify(creative, null, 2),
        },
        {
          name: "Brand Guidelines",
          content: `Brand: ${enriched.client.businessName}\nTagline: ${enriched.brand.tagline}\nTone: ${enriched.brand.tone.join(", ")}\nVoice: ${enriched.brand.voiceGuidelines}\nPrimary Color: ${enriched.brand.colors.primary.hex} (${enriched.brand.colors.primary.name})\nSecondary Color: ${enriched.brand.colors.secondary.hex} (${enriched.brand.colors.secondary.name})`,
        },
      ],
    };

    if (mode === "live") {
      // Actually create the Claude Project via API
      try {
        const project = await client.beta.projects.create({
          name: projectPayload.name,
          description: projectPayload.description,
        });

        // Upload knowledge docs
        for (const doc of projectPayload.knowledgeDocs) {
          await client.beta.projects.docs.create(project.id, {
            name: doc.name,
            content: doc.content,
          });
        }

        res.json({
          projectId: project.id,
          name: project.name,
          docsCount: projectPayload.knowledgeDocs.length,
          mode: "live",
        });
      } catch (apiError) {
        // If the Projects API call fails, fall back to display mode
        console.error("Projects API error, falling back to display:", apiError);
        res.json({
          projectId: `proj_${Date.now().toString(36)}`,
          name: projectPayload.name,
          docsCount: projectPayload.knowledgeDocs.length,
          mode: "display",
          fallbackReason: "Projects API unavailable",
        });
      }
    } else {
      // Display mode — just return the payload
      res.json({
        projectId: `proj_${Date.now().toString(36)}`,
        name: projectPayload.name,
        docsCount: projectPayload.knowledgeDocs.length,
        mode: "display",
      });
    }
  } catch (error) {
    console.error("Project error:", error);
    res.status(500).json({
      error: "Project creation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/project.ts
git commit -m "feat: add Claude Project creation endpoint with live/display toggle"
```

---

## Task 8: Pipeline State Machine (Frontend)

**Files:**
- Create: `client/lib/pipeline-reducer.ts`
- Create: `client/lib/api.ts`

- [ ] **Step 1: Write the pipeline reducer**

```typescript
import type { PipelineState, PipelineAction } from "./types";

export const initialState: PipelineState = {
  phase: "intake",
  intake: null,
  enriched: null,
  agents: {
    crm: null,
    creative: null,
    design: null,
    project: null,
    assets: null,
  },
  build: null,
  error: null,
  settings: {
    masterLive: true,
    phaseLive: {},
  },
};

export function pipelineReducer(
  state: PipelineState,
  action: PipelineAction
): PipelineState {
  switch (action.type) {
    case "SUBMIT_INTAKE":
      return { ...state, phase: "enriching", intake: action.payload, error: null };

    case "SET_ENRICHED":
      return { ...state, phase: "enriched", enriched: action.payload };

    case "SET_AGENTS":
      return {
        ...state,
        phase: "agents_complete",
        agents: {
          ...state.agents,
          crm: action.payload.crm,
          creative: action.payload.creative,
          design: action.payload.design,
          assets: action.payload.assets,
        },
      };

    case "SET_PROJECT":
      return {
        ...state,
        agents: { ...state.agents, project: action.payload },
      };

    case "APPROVE":
      return { ...state, phase: "building", error: null };

    case "SET_BUILD":
      return { ...state, phase: "build_complete", build: action.payload };

    case "SET_DEPLOYMENT_READY":
      return { ...state, phase: "deployment_ready" };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_PHASE":
      return { ...state, phase: action.payload };

    case "TOGGLE_MASTER_LIVE":
      return {
        ...state,
        settings: {
          ...state.settings,
          masterLive: !state.settings.masterLive,
        },
      };

    case "TOGGLE_PHASE_LIVE": {
      const phaseKey = action.payload;
      const current = state.settings.phaseLive[phaseKey] ?? state.settings.masterLive;
      return {
        ...state,
        settings: {
          ...state.settings,
          phaseLive: { ...state.settings.phaseLive, [phaseKey]: !current },
        },
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function isLive(state: PipelineState, phaseKey: string): boolean {
  return state.settings.phaseLive[phaseKey] ?? state.settings.masterLive;
}
```

- [ ] **Step 2: Write the API fetch helpers**

```typescript
import type {
  IntakeData,
  EnrichedData,
  AgentsResult,
  GeneratedSite,
  ProjectResult,
} from "./types";

const API_BASE = "/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || "API call failed");
  }
  return res.json() as Promise<T>;
}

export function fetchEnrich(intake: IntakeData): Promise<EnrichedData> {
  return post("/enrich", intake);
}

export function fetchAgents(enriched: EnrichedData): Promise<AgentsResult> {
  return post("/agents", enriched);
}

export function fetchBuild(data: {
  enriched: EnrichedData;
  creative: unknown;
  design: unknown;
}): Promise<GeneratedSite> {
  return post("/build", data);
}

export function fetchProject(data: {
  enriched: EnrichedData;
  creative: unknown;
  mode: "live" | "display";
}): Promise<ProjectResult> {
  return post("/project", data);
}
```

- [ ] **Step 3: Commit**

```bash
git add client/lib/pipeline-reducer.ts client/lib/api.ts
git commit -m "feat: add pipeline state machine and API fetch helpers"
```

---

## Task 9: Fallback Data

**Files:**
- Create: `client/lib/fallback-data.ts`

- [ ] **Step 1: Write pre-cached fallback data**

This file contains realistic static data for every pipeline phase. It will be used when toggles are set to "Cached" or when the Claude API is unavailable. Write it with the Lone Star Pet Grooming demo data.

```typescript
import type {
  EnrichedData,
  AgentsResult,
  GeneratedSite,
  ProjectResult,
} from "./types";

export const fallbackEnriched: EnrichedData = {
  client: {
    name: "Maria Santos",
    businessName: "Lone Star Pet Grooming",
    email: "maria@demo.frasierdigital.com",
    phone: "(281) 555-0142",
    industry: "Pet Grooming Services",
    industryCategory: "Pet Services & Care",
    location: "Tomball, TX",
  },
  brand: {
    tagline: "Where Every Pet Leaves Happy",
    tone: ["Friendly", "Warm", "Trustworthy", "Professional"],
    voiceGuidelines:
      "Speak like a caring neighbor who happens to be a pet expert. Use warm, approachable language that puts pet owners at ease. Avoid clinical or corporate tone — this is about love for animals.",
    colors: {
      primary: { hex: "#2D5F2D", name: "Forest Green" },
      secondary: { hex: "#F5E6D3", name: "Warm Cream" },
    },
  },
  services: [
    {
      name: "Dog Grooming",
      description:
        "Full-service dog grooming including bath, haircut, blow-dry, and style. We work with all breeds and sizes, from tiny Chihuahuas to gentle Great Danes.",
      keywords: ["dog grooming tomball", "dog haircut", "pet bath"],
    },
    {
      name: "Cat Grooming",
      description:
        "Gentle cat grooming services tailored to your feline's temperament. Includes bath, brush-out, nail trim, and ear cleaning in a calm, stress-free environment.",
      keywords: ["cat grooming tomball", "cat bath", "feline grooming"],
    },
    {
      name: "Nail Trimming",
      description:
        "Quick, safe nail trimming for dogs and cats. Walk-ins welcome. We use gentle techniques to keep your pet comfortable throughout the process.",
      keywords: ["pet nail trimming", "dog nail clip", "cat nail trim"],
    },
    {
      name: "Flea Treatment",
      description:
        "Effective flea treatment baths using veterinarian-approved products. We'll get your pet flea-free and smelling fresh, with tips to prevent re-infestation.",
      keywords: ["flea treatment dogs", "flea bath tomball", "pet flea removal"],
    },
  ],
  seo: {
    primaryKeywords: [
      "pet grooming tomball tx",
      "dog grooming tomball",
      "cat grooming near me",
      "pet groomer tomball texas",
      "lone star pet grooming",
    ],
    secondaryKeywords: [
      "affordable pet grooming tomball",
      "best dog groomer tomball tx",
      "cat grooming tomball texas",
      "flea treatment for dogs tomball",
      "walk-in pet grooming near me",
      "professional pet grooming services",
      "mobile pet grooming tomball",
      "pet nail trimming near me",
    ],
    metaDescription:
      "Professional pet grooming in Tomball, TX. Dog grooming, cat grooming, nail trimming & flea treatment. Where every pet leaves happy! Book today.",
  },
  businessDetails: {
    yearsInBusiness: "Established local business",
    serviceArea: "Tomball, TX and surrounding communities",
    uniqueSellingPoints: [
      "Personalized attention — we treat every pet like family",
      "Experienced groomers with breed-specific expertise",
      "Calm, stress-free environment for anxious pets",
      "Convenient walk-in nail trimming services",
      "Locally owned and operated in the Tomball community",
    ],
  },
};

export const fallbackAgents: AgentsResult = {
  crm: {
    clientId: "cli_0042",
    projectId: "proj_0042",
    status: "intake_complete",
    pipeline: "Website · Standard",
    dealValue: "$1,500",
    createdAt: new Date().toISOString(),
    contact: {
      name: "Maria Santos",
      email: "maria@demo.frasierdigital.com",
      phone: "(281) 555-0142",
      businessName: "Lone Star Pet Grooming",
    },
  },
  creative: {
    brandVoice: {
      tone: "Warm, friendly, and approachable — like a trusted neighbor",
      personality:
        "Lone Star Pet Grooming is the friendly expert next door. We combine professional expertise with genuine warmth, making every pet parent feel confident their furry family member is in loving hands.",
      languageGuidelines: [
        "Use 'furry family member' instead of 'animal' or 'pet' when appropriate",
        "Address pet owners directly with 'your' and 'you'",
        "Keep sentences short and friendly — no jargon",
        "Emphasize the emotional bond between pets and owners",
        "Use active, positive language ('We love...' not 'Services include...')",
        "Reference Tomball/local community when natural",
        "End CTAs with warmth: 'Book your visit' not 'Schedule now'",
      ],
    },
    heroSection: {
      headline: "Where Every Pet Leaves Happy",
      subheadline:
        "Professional grooming services in Tomball, TX — because your furry family deserves the very best.",
      ctaText: "Book Your Visit",
    },
    pages: [
      {
        name: "Home",
        sections: [
          {
            type: "hero",
            heading: "Where Every Pet Leaves Happy",
            content:
              "Welcome to Lone Star Pet Grooming, Tomball's trusted destination for professional pet care. From playful pups to pampered cats, we treat every furry family member with the love and attention they deserve. Our experienced groomers specialize in breed-specific styling, ensuring your pet looks and feels their absolute best.",
          },
          {
            type: "features",
            heading: "Our Services",
            content:
              "Full-service dog grooming for all breeds and sizes. Gentle cat grooming in a stress-free environment. Quick walk-in nail trimming. Effective flea treatment with vet-approved products.",
          },
          {
            type: "testimonials",
            heading: "What Pet Parents Say",
            content:
              "Our Tomball neighbors trust us with their beloved pets. From first-time puppy grooms to senior cat care, we've built lasting relationships with families across the community.",
          },
          {
            type: "cta",
            heading: "Ready to Pamper Your Pet?",
            content:
              "Book a grooming appointment today and see why Tomball families choose Lone Star Pet Grooming. Walk-ins welcome for nail trims!",
          },
        ],
        metaTitle: "Lone Star Pet Grooming | Tomball TX Dog & Cat Grooming",
        metaDescription:
          "Professional pet grooming in Tomball, TX. Dog grooming, cat grooming, nail trimming & flea treatment. Where every pet leaves happy!",
      },
      {
        name: "Services",
        sections: [
          {
            type: "hero",
            heading: "Our Grooming Services",
            content:
              "Every pet deserves to look and feel their best. Explore our full range of professional grooming services, each delivered with patience, expertise, and a whole lot of love.",
          },
          {
            type: "features",
            heading: "Dog Grooming",
            content:
              "Full-service dog grooming including bath, haircut, blow-dry, and style. We work with all breeds and sizes, from tiny Chihuahuas to gentle Great Danes. Each session includes ear cleaning, nail trim, and a spritz of pet-safe cologne.",
          },
          {
            type: "features",
            heading: "Cat Grooming",
            content:
              "Gentle cat grooming tailored to your feline's temperament. Our calm, quiet grooming stations help even the most anxious cats relax. Services include bath, brush-out, nail trim, and ear cleaning.",
          },
          {
            type: "features",
            heading: "Nail Trimming",
            content:
              "Quick, safe nail trimming for dogs and cats. Walk-ins welcome — no appointment needed. We use gentle techniques and positive reinforcement to keep your pet comfortable.",
          },
          {
            type: "features",
            heading: "Flea Treatment",
            content:
              "Effective flea treatment baths using veterinarian-approved products. We'll get your pet flea-free and smelling fresh, plus share tips to prevent re-infestation at home.",
          },
        ],
        metaTitle: "Pet Grooming Services | Lone Star Pet Grooming Tomball TX",
        metaDescription:
          "Dog grooming, cat grooming, nail trimming & flea treatment in Tomball, TX. Professional, gentle care for every pet.",
      },
      {
        name: "About",
        sections: [
          {
            type: "hero",
            heading: "About Lone Star Pet Grooming",
            content:
              "Founded with a simple belief: every pet deserves to be treated like family. Lone Star Pet Grooming has been serving the Tomball community with professional, compassionate pet care.",
          },
          {
            type: "about",
            heading: "Meet Maria Santos",
            content:
              "Owner Maria Santos started Lone Star Pet Grooming after years of working with animals and realizing that Tomball needed a grooming salon that truly put pets first. Her philosophy is simple — if you wouldn't want it done to your own pet, we won't do it to anyone else's.",
          },
          {
            type: "content",
            heading: "Our Promise",
            content:
              "We promise a clean, safe, and stress-free environment for every pet. Our groomers are trained in breed-specific techniques, fear-free handling, and first aid. We use only premium, pet-safe products and never rush a grooming session.",
          },
        ],
        metaTitle: "About Us | Lone Star Pet Grooming Tomball TX",
        metaDescription:
          "Meet the team behind Lone Star Pet Grooming in Tomball, TX. Passionate about pets, dedicated to quality grooming.",
      },
      {
        name: "Contact",
        sections: [
          {
            type: "hero",
            heading: "Get in Touch",
            content:
              "Ready to book a grooming appointment or have questions about our services? We'd love to hear from you. Walk-ins are welcome for nail trims!",
          },
          {
            type: "contact",
            heading: "Visit Us",
            content:
              "Phone: (281) 555-0142. Email: maria@demo.frasierdigital.com. Location: Tomball, TX 77375. Hours: Monday–Friday 8am–6pm, Saturday 9am–4pm, Sunday Closed.",
          },
        ],
        metaTitle: "Contact | Lone Star Pet Grooming Tomball TX",
        metaDescription:
          "Contact Lone Star Pet Grooming in Tomball, TX. Book an appointment or walk in for nail trims. (281) 555-0142.",
      },
    ],
    seoStrategy: {
      primaryKeywords: [
        "pet grooming tomball tx",
        "dog grooming tomball",
        "cat grooming tomball",
      ],
      contentThemes: [
        "Pet care tips for Texas weather",
        "Breed-specific grooming guides",
        "Seasonal pet health advice",
      ],
    },
    colorRationale:
      "Forest green evokes nature, health, and trustworthiness — perfect for a business that cares for living creatures. Warm cream provides a soft, inviting contrast that feels welcoming and clean, like a well-kept home. Together they create a palette that says 'professional yet personal.'",
  },
  design: {
    colors: [
      { role: "primary", hex: "#2D5F2D", name: "Forest Green", usage: "Headers, buttons, nav background" },
      { role: "secondary", hex: "#F5E6D3", name: "Warm Cream", usage: "Section backgrounds, card backgrounds" },
      { role: "accent", hex: "#8B4513", name: "Saddle Brown", usage: "Accent text, borders, icons" },
      { role: "neutral", hex: "#374151", name: "Charcoal", usage: "Body text, subtle borders" },
      { role: "background", hex: "#FAFAF5", name: "Off-White", usage: "Page background" },
    ],
    typography: {
      headingFont: "DM Serif Display",
      bodyFont: "Plus Jakarta Sans",
      headingWeight: "400",
      bodyWeight: "400",
    },
    layout: {
      maxWidth: "1280px",
      sections: [
        { name: "Hero", type: "full-bleed" },
        { name: "Services", type: "grid", columns: 3 },
        { name: "Testimonials", type: "contained" },
        { name: "About", type: "split", columns: 2 },
        { name: "Contact", type: "split", columns: 2 },
        { name: "CTA", type: "full-bleed" },
      ],
    },
    spacing: {
      sectionPadding: "5rem",
      componentGap: "2rem",
    },
  },
  assets: {
    logo: { filename: "demo-logo.svg", dimensions: "400x120", size: "24KB" },
    generated: [
      { filename: "favicon.ico", dimensions: "32x32", purpose: "Browser tab icon" },
      { filename: "og-image.png", dimensions: "1200x630", purpose: "Social sharing" },
      { filename: "hero-2560.webp", dimensions: "2560x1440", purpose: "Desktop hero" },
      { filename: "hero-1280.webp", dimensions: "1280x720", purpose: "Tablet hero" },
      { filename: "hero-640.webp", dimensions: "640x360", purpose: "Mobile hero" },
    ],
  },
};

export const fallbackProject: ProjectResult = {
  projectId: "proj_01JXYZ789ABC",
  name: "Lone Star Pet Grooming — Website Build",
  docsCount: 3,
  mode: "display",
};

export const fallbackBuild: GeneratedSite = {
  sessionId: "fallback",
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
    generatedAt: new Date().toISOString(),
  },
};
```

Note: `fallbackBuild` has empty `html` fields as a placeholder. The `seed-cache` script (Task 16) will populate these with real generated HTML. For now, the fallback build shows metadata only.

- [ ] **Step 2: Commit**

```bash
git add client/lib/fallback-data.ts
git commit -m "feat: add pre-cached fallback data for all pipeline phases"
```

---

## Task 10: Layout, Pipeline Stepper, and Phase Toggle Components

**Files:**
- Create: `client/app/layout.tsx`
- Create: `client/components/PipelineStepper.tsx`
- Create: `client/components/PhaseToggle.tsx`

- [ ] **Step 1: Write the root layout**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frasier Digital — Agent Pipeline Demo",
  description: "AI-automated pipeline from intake to live website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-frasier-dark text-white min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write the PipelineStepper component**

```tsx
import type { PhaseStatus } from "@/lib/types";

const PHASES = [
  { key: "intake", label: "Client Intake", phase: 1 },
  { key: "enriching", label: "Agent Processing", phase: 2 },
  { key: "approval", label: "Lead Approval", phase: 3 },
  { key: "building", label: "Website Build", phase: 4 },
  { key: "deployment_ready", label: "Deployment Ready", phase: 5 },
] as const;

const PHASE_ORDER: Record<string, number> = {
  intake: 0,
  enriching: 1,
  enriched: 1,
  processing_agents: 1,
  agents_complete: 1,
  approval: 2,
  building: 3,
  build_complete: 3,
  deployment_ready: 4,
};

function getStatus(
  phaseKey: string,
  currentPhase: PhaseStatus
): "complete" | "active" | "pending" {
  const currentIdx = PHASE_ORDER[currentPhase] ?? 0;
  const phaseIdx = PHASE_ORDER[phaseKey] ?? 0;

  if (phaseIdx < currentIdx) return "complete";
  if (phaseIdx === currentIdx) return "active";
  return "pending";
}

export function PipelineStepper({
  currentPhase,
}: {
  currentPhase: PhaseStatus;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {PHASES.map(({ key, label, phase }) => {
        const status = getStatus(key, currentPhase);
        return (
          <div
            key={key}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              status === "active"
                ? "bg-frasier-card border border-frasier-border"
                : status === "complete"
                  ? "opacity-70"
                  : "opacity-40"
            }`}
          >
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                status === "complete"
                  ? "bg-green-500/20 text-green-400"
                  : status === "active"
                    ? "bg-blue-500/20 text-blue-400 animate-pulse-dot"
                    : "bg-white/10 text-white/50"
              }`}
            >
              {status === "complete" ? "✓" : phase}
            </span>
            <span className="text-sm font-medium">{label}</span>
          </div>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Write the PhaseToggle component**

```tsx
"use client";

export function PhaseToggle({
  isLive,
  onToggle,
}: {
  isLive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        isLive
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive ? "bg-green-400" : "bg-amber-400"
        }`}
      />
      {isLive ? "Live" : "Cached"}
    </button>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/app/layout.tsx client/components/PipelineStepper.tsx client/components/PhaseToggle.tsx
git commit -m "feat: add layout, pipeline stepper, and phase toggle components"
```

---

## Task 11: Phase 1 — Intake Form + Payload Card

**Files:**
- Create: `client/components/IntakeForm.tsx`
- Create: `client/components/PayloadCard.tsx`

- [ ] **Step 1: Write the IntakeForm component**

```tsx
"use client";

import { useState } from "react";
import type { IntakeData } from "@/lib/types";

const DEFAULT_INTAKE: IntakeData = {
  businessName: "Lone Star Pet Grooming",
  ownerName: "Maria Santos",
  email: "maria@demo.frasierdigital.com",
  phone: "(281) 555-0142",
  industry: "Pet services",
  services: "Dog grooming, cat grooming, nail trimming, flea treatment",
  brandColors: { primary: "#2D5F2D", secondary: "#F5E6D3" },
  tagline: "Where every pet leaves happy",
  tone: "Friendly, warm, trustworthy",
  pagesNeeded: ["Home", "Services", "About", "Contact"],
  desiredDomain: "lonestarpetgrooming.com",
  budgetTier: "Standard ($1,500)",
  logoUrl: "/demo-logo.svg",
  heroImageUrl: "/demo-hero.jpg",
};

const PAGE_OPTIONS = ["Home", "Services", "About", "Contact", "Blog", "Gallery"];

export function IntakeForm({
  onSubmit,
}: {
  onSubmit: (data: IntakeData) => void;
}) {
  const [form, setForm] = useState<IntakeData>(DEFAULT_INTAKE);

  const update = <K extends keyof IntakeData>(key: K, value: IntakeData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const togglePage = (page: string) => {
    setForm((f) => ({
      ...f,
      pagesNeeded: f.pagesNeeded.includes(page)
        ? f.pagesNeeded.filter((p) => p !== page)
        : [...f.pagesNeeded, page],
    }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business Name">
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            className="input"
            required
          />
        </Field>
        <Field label="Owner Name">
          <input
            type="text"
            value={form.ownerName}
            onChange={(e) => update("ownerName", e.target.value)}
            className="input"
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="input"
            required
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="input"
            required
          />
        </Field>
        <Field label="Industry">
          <input
            type="text"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Budget Tier">
          <select
            value={form.budgetTier}
            onChange={(e) => update("budgetTier", e.target.value)}
            className="input"
          >
            <option>Starter ($750)</option>
            <option>Standard ($1,500)</option>
            <option>Premium ($3,000)</option>
          </select>
        </Field>
      </div>

      <Field label="Services">
        <textarea
          value={form.services}
          onChange={(e) => update("services", e.target.value)}
          className="input min-h-[80px]"
          placeholder="Describe your services..."
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tagline">
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => update("tagline", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Tone">
          <input
            type="text"
            value={form.tone}
            onChange={(e) => update("tone", e.target.value)}
            className="input"
            placeholder="e.g. Friendly, professional"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Primary Brand Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.brandColors.primary}
              onChange={(e) =>
                update("brandColors", { ...form.brandColors, primary: e.target.value })
              }
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm text-white/60 font-mono">
              {form.brandColors.primary}
            </span>
          </div>
        </Field>
        <Field label="Secondary Brand Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.brandColors.secondary}
              onChange={(e) =>
                update("brandColors", { ...form.brandColors, secondary: e.target.value })
              }
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm text-white/60 font-mono">
              {form.brandColors.secondary}
            </span>
          </div>
        </Field>
      </div>

      <Field label="Pages Needed">
        <div className="flex flex-wrap gap-2">
          {PAGE_OPTIONS.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => togglePage(page)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                form.pagesNeeded.includes(page)
                  ? "bg-frasier-green text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Desired Domain">
        <input
          type="text"
          value={form.desiredDomain}
          onChange={(e) => update("desiredDomain", e.target.value)}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Logo">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center text-xs text-white/40">
              SVG
            </div>
            <span className="text-sm text-white/60">demo-logo.svg (pre-staged)</span>
          </div>
        </Field>
        <Field label="Hero Image">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center text-xs text-white/40">
              JPG
            </div>
            <span className="text-sm text-white/60">demo-hero.jpg (pre-staged)</span>
          </div>
        </Field>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-6 bg-frasier-green hover:bg-frasier-green/80 text-white font-semibold rounded-lg transition-all duration-300"
      >
        Submit Intake
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/70 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}
```

- [ ] **Step 2: Add the input styles to globals.css**

Append to `client/app/globals.css`:

```css
.input {
  @apply w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-frasier-green focus:ring-1 focus:ring-frasier-green transition-all;
}
```

- [ ] **Step 3: Write the PayloadCard component**

```tsx
import type { IntakeData } from "@/lib/types";

export function PayloadCard({ data }: { data: IntakeData }) {
  return (
    <div className="animate-fade-in-up bg-frasier-card border border-frasier-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white/50 uppercase tracking-wider">
        <span className="text-green-400">✓</span> Parsed Intake Payload
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <Row label="Client" value={data.ownerName} />
        <Row label="Business" value={data.businessName} />
        <Row label="Industry" value={data.industry} />
        <Row label="Tier" value={data.budgetTier} />
        <Row label="Domain" value={data.desiredDomain} />
        <Row label="Phone" value={data.phone} />
      </div>

      <div className="pt-2 border-t border-white/10">
        <span className="text-xs text-white/40 uppercase tracking-wider">
          Brand
        </span>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded"
              style={{ backgroundColor: data.brandColors.primary }}
            />
            <span className="text-xs font-mono text-white/60">
              {data.brandColors.primary}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded"
              style={{ backgroundColor: data.brandColors.secondary }}
            />
            <span className="text-xs font-mono text-white/60">
              {data.brandColors.secondary}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/70">
          Tagline: &ldquo;{data.tagline}&rdquo;
        </p>
        <p className="text-sm text-white/70">Tone: {data.tone}</p>
      </div>

      <div className="pt-2 border-t border-white/10">
        <span className="text-xs text-white/40 uppercase tracking-wider">
          Pages
        </span>
        <p className="mt-1 text-sm text-white/70">
          {data.pagesNeeded.join(" · ")}
        </p>
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center gap-2">
        <span className="text-xs text-white/40 uppercase tracking-wider">
          Assets
        </span>
        <span className="text-xs text-white/50">
          logo.svg (24KB) · hero.jpg (1.2MB)
        </span>
      </div>

      <div className="text-green-400/80 text-xs font-medium">
        ✓ Validation passed
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/components/IntakeForm.tsx client/components/PayloadCard.tsx client/app/globals.css
git commit -m "feat: add intake form and parsed payload card components"
```

---

## Task 12: Phase 2 — Enrichment Display + Agent Cards

**Files:**
- Create: `client/components/EnrichedPayload.tsx`
- Create: `client/components/AgentCard.tsx`

- [ ] **Step 1: Write the EnrichedPayload component (side-by-side comparison)**

```tsx
import type { IntakeData, EnrichedData } from "@/lib/types";

export function EnrichedPayload({
  raw,
  enriched,
}: {
  raw: IntakeData;
  enriched: EnrichedData;
}) {
  return (
    <div className="animate-fade-in-up space-y-4">
      <h3 className="text-lg font-semibold text-white/90">
        Stage 1: AI Enrichment
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw input */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            What you typed
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-white/60">
              <span className="text-white/40">Business:</span> {raw.businessName}
            </p>
            <p className="text-white/60">
              <span className="text-white/40">Services:</span> {raw.services}
            </p>
            <p className="text-white/60">
              <span className="text-white/40">Tagline:</span> {raw.tagline}
            </p>
            <p className="text-white/60">
              <span className="text-white/40">Tone:</span> {raw.tone}
            </p>
          </div>
        </div>

        {/* Enriched output */}
        <div className="bg-frasier-card border border-frasier-border rounded-xl p-5">
          <div className="text-xs font-medium text-green-400/80 uppercase tracking-wider mb-3">
            What AI structured
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-white/40 text-xs">Brand Voice</span>
              <p className="text-white/80">{enriched.brand.voiceGuidelines}</p>
            </div>
            <div>
              <span className="text-white/40 text-xs">Services</span>
              {enriched.services.map((s) => (
                <div key={s.name} className="mt-1">
                  <span className="text-white/70 font-medium">{s.name}</span>
                  <p className="text-white/50 text-xs mt-0.5">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <span className="text-white/40 text-xs">SEO Keywords</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {enriched.seo.primaryKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 bg-frasier-green/20 text-green-400 rounded text-xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-white/40 text-xs">
                Unique Selling Points
              </span>
              <ul className="mt-1 space-y-0.5">
                {enriched.businessDetails.uniqueSellingPoints.map((usp) => (
                  <li key={usp} className="text-white/60 text-xs">
                    • {usp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the AgentCard component**

```tsx
"use client";

import { useState } from "react";

export function AgentCard({
  title,
  status,
  children,
  note,
}: {
  title: string;
  status: "pending" | "processing" | "complete";
  children: React.ReactNode;
  note?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="animate-fade-in-up bg-frasier-card border border-frasier-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <span className="text-white/30 text-xs">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5">
          <div className="mt-3 space-y-2 text-sm">{children}</div>
          {note && (
            <p className="mt-3 text-xs text-white/30 italic">{note}</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "processing" | "complete";
}) {
  if (status === "complete") {
    return <span className="text-green-400 text-xs">✓ Complete</span>;
  }
  if (status === "processing") {
    return (
      <span className="text-blue-400 text-xs flex items-center gap-1">
        <span className="animate-pulse-dot">◉</span> Processing...
      </span>
    );
  }
  return <span className="text-white/30 text-xs">○ Pending</span>;
}

// Sub-components for specific agent card content

export function CrmCardContent({
  data,
}: {
  data: {
    clientId: string;
    projectId: string;
    status: string;
    pipeline: string;
    dealValue: string;
    createdAt: string;
  };
}) {
  return (
    <div className="space-y-1 font-mono text-xs">
      <Row label="client_id" value={data.clientId} />
      <Row label="project_id" value={data.projectId} />
      <Row label="status" value={data.status} />
      <Row label="pipeline" value={data.pipeline} />
      <Row label="deal_value" value={data.dealValue} />
      <Row label="created_at" value={data.createdAt} />
    </div>
  );
}

export function DesignCardContent({
  data,
}: {
  data: {
    colors: Array<{ role: string; hex: string; name: string; usage: string }>;
    typography: { headingFont: string; bodyFont: string };
  };
}) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs text-white/40">Color Palette</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {data.colors.map((c) => (
            <div key={c.role} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded border border-white/10"
                style={{ backgroundColor: c.hex }}
              />
              <div className="text-xs">
                <span className="text-white/50 capitalize">{c.role}</span>
                <span className="text-white/30 ml-1 font-mono">{c.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <span className="text-xs text-white/40">Typography</span>
        <p className="text-xs text-white/60 mt-1">
          Headings: {data.typography.headingFont} · Body:{" "}
          {data.typography.bodyFont}
        </p>
      </div>
    </div>
  );
}

export function AssetCardContent({
  data,
}: {
  data: {
    logo: { filename: string; dimensions: string; size: string };
    generated: Array<{
      filename: string;
      dimensions: string;
      purpose: string;
    }>;
  };
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/40">
          SVG
        </div>
        <span className="text-xs text-white/60">
          {data.logo.filename} ({data.logo.dimensions}, {data.logo.size})
        </span>
      </div>
      <div className="text-xs text-white/40 mt-2">Generated:</div>
      {data.generated.map((a) => (
        <div key={a.filename} className="text-xs text-white/50 ml-2">
          • {a.filename} ({a.dimensions}) — {a.purpose}
        </div>
      ))}
    </div>
  );
}

export function CreativeCardContent({
  data,
}: {
  data: {
    brandVoice: { tone: string; personality: string };
    heroSection: { headline: string; subheadline: string; ctaText: string };
    colorRationale: string;
    pages: Array<{ name: string }>;
  };
}) {
  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs text-white/40">Brand Voice</span>
        <p className="text-xs text-white/60 mt-1">{data.brandVoice.tone}</p>
        <p className="text-xs text-white/50 mt-0.5">
          {data.brandVoice.personality}
        </p>
      </div>
      <div>
        <span className="text-xs text-white/40">Hero Section</span>
        <p className="text-sm text-white/80 font-semibold mt-1">
          &ldquo;{data.heroSection.headline}&rdquo;
        </p>
        <p className="text-xs text-white/60">{data.heroSection.subheadline}</p>
        <p className="text-xs text-frasier-green mt-1">
          CTA: {data.heroSection.ctaText}
        </p>
      </div>
      <div>
        <span className="text-xs text-white/40">Pages</span>
        <p className="text-xs text-white/60 mt-1">
          {data.pages.map((p) => p.name).join(" · ")}
        </p>
      </div>
      <div>
        <span className="text-xs text-white/40">Color Rationale</span>
        <p className="text-xs text-white/50 mt-1">{data.colorRationale}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-white/30 w-24 shrink-0">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/components/EnrichedPayload.tsx client/components/AgentCard.tsx
git commit -m "feat: add enrichment display and agent card components"
```

---

## Task 13: Phase 3 — Approval Panel

**Files:**
- Create: `client/components/ApprovalPanel.tsx`

- [ ] **Step 1: Write the ApprovalPanel component**

```tsx
"use client";

import { useState } from "react";
import type { EnrichedData, AgentsResult, ProjectResult } from "@/lib/types";

export function ApprovalPanel({
  enriched,
  agents,
  project,
  onApprove,
}: {
  enriched: EnrichedData;
  agents: AgentsResult;
  project: ProjectResult | null;
  onApprove: () => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggle = (section: string) =>
    setExpandedSection((s) => (s === section ? null : section));

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="bg-frasier-card border border-frasier-border rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {enriched.client.businessName}
          </h3>
          <p className="text-sm text-white/50">
            {agents.crm.pipeline} · Submitted{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <CollapsibleSection
          title="Creative Brief"
          expanded={expandedSection === "creative"}
          onToggle={() => toggle("creative")}
        >
          <div className="space-y-2 text-sm">
            <p className="text-white/70">
              <span className="text-white/40">Voice:</span>{" "}
              {agents.creative.brandVoice.tone}
            </p>
            <p className="text-white/70">
              <span className="text-white/40">Hero:</span>{" "}
              &ldquo;{agents.creative.heroSection.headline}&rdquo;
            </p>
            <p className="text-white/70">
              <span className="text-white/40">Pages:</span>{" "}
              {agents.creative.pages.map((p) => p.name).join(", ")}
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Brand Assets"
          expanded={expandedSection === "assets"}
          onToggle={() => toggle("assets")}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">Colors:</span>
              {agents.design.colors.map((c) => (
                <div key={c.role} className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded border border-white/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs text-white/50 font-mono">
                    {c.hex}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/50">
              Typography: {agents.design.typography.headingFont} /{" "}
              {agents.design.typography.bodyFont}
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Domain"
          expanded={expandedSection === "domain"}
          onToggle={() => toggle("domain")}
        >
          <div className="text-sm space-y-1">
            <p className="text-white/70">
              {enriched.client.businessName.toLowerCase().replace(/\s+/g, "")}.com
              — <span className="text-green-400">✓ Available</span>
            </p>
            <p className="text-white/50 text-xs">
              Registrar: Javelina (OpenSRS)
            </p>
            <p className="text-white/50 text-xs">
              Nameservers: ns1.javelina.cloud, ns2.javelina.cloud
            </p>
          </div>
        </CollapsibleSection>

        {project && (
          <CollapsibleSection
            title="Claude Project"
            expanded={expandedSection === "project"}
            onToggle={() => toggle("project")}
          >
            <div className="text-sm space-y-1">
              <p className="text-white/70">
                {project.projectId} — {project.docsCount} knowledge docs loaded
              </p>
              <p className="text-xs text-white/50">
                Mode: {project.mode === "live" ? "Created in Claude" : "Display only"}
              </p>
            </div>
          </CollapsibleSection>
        )}

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onApprove}
            className="flex-1 py-3 bg-frasier-green hover:bg-frasier-green/80 text-white font-semibold rounded-lg transition-all"
          >
            ✓ Approve & Build
          </button>
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-all border border-white/10">
            ✎ Request Revisions
          </button>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5 transition-all"
      >
        {title}
        <span className="text-white/30 text-xs">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/ApprovalPanel.tsx
git commit -m "feat: add approval panel component with collapsible sections"
```

---

## Task 14: Phase 4 — Site Preview

**Files:**
- Create: `client/components/SitePreview.tsx`

- [ ] **Step 1: Write the SitePreview component**

```tsx
"use client";

import { useState } from "react";
import type { GeneratedSite } from "@/lib/types";

export function SitePreview({ site }: { site: GeneratedSite }) {
  const [activePage, setActivePage] = useState(0);

  const baseUrl =
    site.sessionId === "fallback"
      ? null
      : `http://localhost:3001/generated/${site.sessionId}`;

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Toolbar */}
      <div className="bg-frasier-card border border-frasier-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-sm font-medium">
              Preview: {site.pages[0]?.name ? "Generated Website" : "Loading..."}
            </span>
          </div>
          {baseUrl && (
            <a
              href={`${baseUrl}/${site.pages[activePage]?.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open in new tab ↗
            </a>
          )}
        </div>

        {/* Page navigation */}
        <div className="flex gap-1">
          {site.pages.map((page, i) => (
            <button
              key={page.filename}
              onClick={() => setActivePage(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                i === activePage
                  ? "bg-frasier-green text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      </div>

      {/* Iframe preview */}
      {baseUrl ? (
        <div className="bg-white rounded-xl overflow-hidden border border-frasier-border">
          <iframe
            src={`${baseUrl}/${site.pages[activePage]?.filename}`}
            className="w-full h-[600px] border-0"
            title={`Preview: ${site.pages[activePage]?.name}`}
          />
        </div>
      ) : (
        <div className="bg-frasier-card border border-frasier-border rounded-xl p-12 text-center">
          <p className="text-white/40">
            Website preview not available in cached mode.
          </p>
          <p className="text-white/30 text-sm mt-1">
            Run with Live AI to generate and preview the website.
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-frasier-card border border-frasier-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs text-green-400/80 font-medium mb-2">
          ✓ {site.metadata.pageCount} pages · {site.metadata.framework}
        </div>
        <p className="text-xs text-white/30">
          Generated at {site.metadata.generatedAt}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/SitePreview.tsx
git commit -m "feat: add site preview component with iframe and page navigation"
```

---

## Task 15: Phase 5 — Deployment Cards

**Files:**
- Create: `client/components/DeploymentCards.tsx`

- [ ] **Step 1: Write the DeploymentCards component**

```tsx
import type { EnrichedData } from "@/lib/types";

export function DeploymentCards({
  enriched,
  startTime,
}: {
  enriched: EnrichedData;
  startTime: number;
}) {
  const domain =
    enriched.client.businessName.toLowerCase().replace(/\s+/g, "") + ".com";
  const projectSlug =
    enriched.client.businessName.toLowerCase().replace(/\s+/g, "-");
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Vercel */}
      <Card title="Vercel Deployment" status="Ready to deploy">
        <Row label="project" value={projectSlug} />
        <Row label="framework" value="Next.js 14 (App Router)" />
        <Row label="source" value={`github/frasier-digital/${projectSlug}`} />
        <Row label="branch" value="main" />
        <Row label="node" value="20.x" />
        <Divider />
        <span className="text-xs text-white/40">Environment variables</span>
        <Row label="NEXT_PUBLIC_SITE_URL" value={domain} />
        <Row
          label="NEXT_PUBLIC_BUSINESS_NAME"
          value={enriched.client.businessName}
        />
        <Row label="NEXT_PUBLIC_GA_ID" value="G-XXXXXXXXXX" />
        <Note text="In production, this fires automatically after approval." />
      </Card>

      {/* Domain */}
      <Card title="Domain Registration — Javelina" status="Ready to register">
        <Row label="Domain" value={domain} />
        <Row label="Status" value="✓ Available" highlight />
        <Row label="Registrar" value="OpenSRS via Javelina" />
        <Row label="Period" value="1 year" />
        <Divider />
        <span className="text-xs text-white/40">Registrant</span>
        <Row label="Name" value={enriched.client.name} />
        <Row label="Organization" value={enriched.client.businessName} />
        <Row label="Location" value={enriched.client.location} />
        <Row label="Phone" value={enriched.client.phone} />
        <Row label="Email" value={enriched.client.email} />
        <Divider />
        <span className="text-xs text-white/40">Nameservers</span>
        <Row label="" value="ns1.javelina.cloud" />
        <Row label="" value="ns2.javelina.cloud" />
        <Note text="Javelina handles registration and manages the zone via MCP — no manual DNS configuration needed." />
      </Card>

      {/* DNS */}
      <Card title="DNS Zone — Javelina MCP" status="Ready to provision">
        <span className="text-xs text-white/40">
          Zone: {domain}
        </span>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/40 border-b border-white/10">
                <th className="text-left py-1 pr-4">Type</th>
                <th className="text-left py-1 pr-4">Name</th>
                <th className="text-left py-1 pr-4">Value</th>
                <th className="text-left py-1">TTL</th>
              </tr>
            </thead>
            <tbody className="text-white/60 font-mono">
              <tr>
                <td className="py-1 pr-4">A</td>
                <td className="pr-4">@</td>
                <td className="pr-4">76.76.21.21</td>
                <td>300</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">CNAME</td>
                <td className="pr-4">www</td>
                <td className="pr-4">cname.vercel-dns.com</td>
                <td>300</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">MX</td>
                <td className="pr-4">@</td>
                <td className="pr-4">mx1.improvmx.com (pri: 10)</td>
                <td>3600</td>
              </tr>
              <tr>
                <td className="py-1 pr-4">TXT</td>
                <td className="pr-4">@</td>
                <td className="pr-4">v=spf1 include:spf.improvmx.com ~all</td>
                <td>3600</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Note text="The Javelina MCP server handles zone creation, record management, and SSL verification — all triggered by the agent pipeline." />
      </Card>

      {/* Pipeline Complete */}
      <div className="bg-frasier-card border border-green-500/30 rounded-xl p-6 text-center space-y-4">
        <div className="text-green-400 text-2xl font-bold">
          Pipeline Complete
        </div>
        <div className="text-sm text-white/60">
          Total pipeline time:{" "}
          <span className="text-white font-semibold">
            {elapsed} seconds
          </span>
        </div>
        <div className="text-sm text-white/40">
          Traditional timeline: 2–4 weeks
        </div>
        <div className="mt-4 p-4 bg-white/5 rounded-lg text-sm text-white/70 italic max-w-lg mx-auto">
          &ldquo;From one form submission to a fully built, content-populated,
          brand-themed website — with domain registration, DNS, and deployment —
          all orchestrated by AI agents. The only human touchpoint was clicking
          Approve.&rdquo;
        </div>
        <p className="text-frasier-green font-semibold">
          This is what Frasier Digital builds for you.
        </p>
      </div>
    </div>
  );
}

function Card({
  title,
  status,
  children,
}: {
  title: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-frasier-card border border-frasier-border rounded-xl p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-amber-400/80">{status}</span>
      </div>
      <div className="space-y-1 text-sm font-mono">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-4">
      {label && (
        <span className="text-white/30 w-44 shrink-0 text-xs">{label}</span>
      )}
      <span
        className={`text-xs ${highlight ? "text-green-400" : "text-white/70"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-white/5 my-1" />;
}

function Note({ text }: { text: string }) {
  return <p className="text-xs text-white/30 italic mt-2">{text}</p>;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/components/DeploymentCards.tsx
git commit -m "feat: add deployment payload cards and pipeline complete summary"
```

---

## Task 16: Main Page — Orchestrating All Phases

**Files:**
- Create: `client/app/page.tsx`

- [ ] **Step 1: Write the main pipeline page**

This is the central orchestration component that ties all phases together.

```tsx
"use client";

import { useReducer, useRef, useCallback } from "react";
import { pipelineReducer, initialState, isLive } from "@/lib/pipeline-reducer";
import { fetchEnrich, fetchAgents, fetchBuild, fetchProject } from "@/lib/api";
import {
  fallbackEnriched,
  fallbackAgents,
  fallbackProject,
  fallbackBuild,
} from "@/lib/fallback-data";
import type { IntakeData } from "@/lib/types";

import { PipelineStepper } from "@/components/PipelineStepper";
import { PhaseToggle } from "@/components/PhaseToggle";
import { IntakeForm } from "@/components/IntakeForm";
import { PayloadCard } from "@/components/PayloadCard";
import { EnrichedPayload } from "@/components/EnrichedPayload";
import {
  AgentCard,
  CrmCardContent,
  CreativeCardContent,
  DesignCardContent,
  AssetCardContent,
} from "@/components/AgentCard";
import { ApprovalPanel } from "@/components/ApprovalPanel";
import { SitePreview } from "@/components/SitePreview";
import { DeploymentCards } from "@/components/DeploymentCards";

const PHASE_ORDER = [
  "intake",
  "enriching",
  "enriched",
  "processing_agents",
  "agents_complete",
  "approval",
  "building",
  "build_complete",
  "deployment_ready",
] as const;

function phaseAtLeast(
  current: string,
  target: string
): boolean {
  return PHASE_ORDER.indexOf(current as (typeof PHASE_ORDER)[number]) >=
    PHASE_ORDER.indexOf(target as (typeof PHASE_ORDER)[number]);
}

export default function Home() {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);
  const startTimeRef = useRef<number>(0);

  const handleIntakeSubmit = useCallback(
    async (intake: IntakeData) => {
      startTimeRef.current = Date.now();
      dispatch({ type: "SUBMIT_INTAKE", payload: intake });

      try {
        // Stage 1: Enrichment
        const enriched = isLive(state, "enrich")
          ? await fetchEnrich(intake)
          : fallbackEnriched;
        dispatch({ type: "SET_ENRICHED", payload: enriched });

        // Stage 2: Agents (auto-trigger)
        dispatch({ type: "SET_PHASE", payload: "processing_agents" });
        const agents = isLive(state, "agents")
          ? await fetchAgents(enriched)
          : fallbackAgents;
        dispatch({ type: "SET_AGENTS", payload: agents });
      } catch (error) {
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [state]
  );

  const handleApprove = useCallback(async () => {
    dispatch({ type: "APPROVE" });

    try {
      const buildData = {
        enriched: state.enriched!,
        creative: state.agents.creative!,
        design: state.agents.design!,
      };
      const build = isLive(state, "build")
        ? await fetchBuild(buildData)
        : fallbackBuild;
      dispatch({ type: "SET_BUILD", payload: build });

      // Auto-advance to deployment
      setTimeout(() => {
        dispatch({ type: "SET_DEPLOYMENT_READY" });
      }, 1000);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [state]);

  const handleCreateProject = useCallback(async () => {
    try {
      const mode = isLive(state, "project") ? "live" : "display";
      const project = isLive(state, "project")
        ? await fetchProject({
            enriched: state.enriched!,
            creative: state.agents.creative!,
            mode,
          })
        : fallbackProject;
      dispatch({ type: "SET_PROJECT", payload: project });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [state]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 p-6 border-r border-white/10 bg-frasier-dark/50">
        <div className="mb-8">
          <h1 className="text-lg font-bold tracking-tight">FRASIER DIGITAL</h1>
          <p className="text-xs text-white/40 mt-1">Agent Pipeline Demo</p>
        </div>
        <PipelineStepper currentPhase={state.phase} />
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Master</span>
            <PhaseToggle
              isLive={state.settings.masterLive}
              onToggle={() => dispatch({ type: "TOGGLE_MASTER_LIVE" })}
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 max-w-4xl">
        {state.error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            Error: {state.error}
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="ml-4 underline text-xs"
            >
              Reset
            </button>
          </div>
        )}

        {/* Phase 1: Intake */}
        <PhaseSection
          title="Phase 1: Client Intake"
          phase={1}
          active={state.phase === "intake"}
          complete={phaseAtLeast(state.phase, "enriching")}
          liveToggle={
            <PhaseToggle
              isLive={isLive(state, "enrich")}
              onToggle={() =>
                dispatch({ type: "TOGGLE_PHASE_LIVE", payload: "enrich" })
              }
            />
          }
        >
          {state.phase === "intake" && (
            <IntakeForm onSubmit={handleIntakeSubmit} />
          )}
          {state.intake && phaseAtLeast(state.phase, "enriching") && (
            <PayloadCard data={state.intake} />
          )}
        </PhaseSection>

        {/* Phase 2: Agent Processing */}
        {phaseAtLeast(state.phase, "enriching") && (
          <PhaseSection
            title="Phase 2: Agent Processing"
            phase={2}
            active={
              phaseAtLeast(state.phase, "enriching") &&
              !phaseAtLeast(state.phase, "approval")
            }
            complete={phaseAtLeast(state.phase, "approval")}
            liveToggle={
              <PhaseToggle
                isLive={isLive(state, "agents")}
                onToggle={() =>
                  dispatch({ type: "TOGGLE_PHASE_LIVE", payload: "agents" })
                }
              />
            }
          >
            {state.phase === "enriching" && (
              <div className="flex items-center gap-3 py-8 text-white/50">
                <span className="animate-pulse-dot text-blue-400">◉</span>
                Enriching intake data...
              </div>
            )}

            {state.enriched && state.intake && (
              <EnrichedPayload raw={state.intake} enriched={state.enriched} />
            )}

            {phaseAtLeast(state.phase, "processing_agents") && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-semibold text-white/90">
                  Stage 2: Specialized Agents
                </h3>

                {state.phase === "processing_agents" && (
                  <div className="flex items-center gap-3 py-4 text-white/50">
                    <span className="animate-pulse-dot text-blue-400">◉</span>
                    Running agents in parallel...
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AgentCard
                    title="CRM Agent"
                    status={state.agents.crm ? "complete" : "processing"}
                    note="In production, this writes to your CRM via Composio — HubSpot, Salesforce, or a custom DB."
                  >
                    {state.agents.crm && (
                      <CrmCardContent data={state.agents.crm} />
                    )}
                  </AgentCard>

                  <AgentCard
                    title="Creative Brief"
                    status={state.agents.creative ? "complete" : "processing"}
                  >
                    {state.agents.creative && (
                      <CreativeCardContent data={state.agents.creative} />
                    )}
                  </AgentCard>

                  <AgentCard
                    title="Design Tokens"
                    status={state.agents.design ? "complete" : "processing"}
                  >
                    {state.agents.design && (
                      <DesignCardContent data={state.agents.design} />
                    )}
                  </AgentCard>

                  <AgentCard
                    title="Asset Agent"
                    status={state.agents.assets ? "complete" : "processing"}
                    note="In production, Sharp processes and optimizes all uploaded assets."
                  >
                    {state.agents.assets && (
                      <AssetCardContent data={state.agents.assets} />
                    )}
                  </AgentCard>
                </div>

                {/* Claude Project card */}
                {phaseAtLeast(state.phase, "agents_complete") && (
                  <div className="mt-3">
                    <AgentCard
                      title="Claude Project"
                      status={state.agents.project ? "complete" : "pending"}
                    >
                      {state.agents.project ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex gap-4">
                            <span className="text-white/30 w-24">project_id</span>
                            <span className="text-white/70 font-mono">
                              {state.agents.project.projectId}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-white/30 w-24">name</span>
                            <span className="text-white/70">
                              {state.agents.project.name}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-white/30 w-24">docs</span>
                            <span className="text-white/70">
                              {state.agents.project.docsCount} knowledge docs
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-white/30 w-24">mode</span>
                            <span className="text-white/70">
                              {state.agents.project.mode}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleCreateProject}
                          className="px-4 py-2 bg-frasier-green/20 text-frasier-green text-xs rounded-lg hover:bg-frasier-green/30 transition-all"
                        >
                          Create Claude Project
                        </button>
                      )}
                    </AgentCard>
                  </div>
                )}
              </div>
            )}
          </PhaseSection>
        )}

        {/* Phase 3: Approval */}
        {phaseAtLeast(state.phase, "agents_complete") &&
          !phaseAtLeast(state.phase, "building") && (
            <PhaseSection
              title="Phase 3: Lead Approval"
              phase={3}
              active={true}
              complete={false}
            >
              <ApprovalPanel
                enriched={state.enriched!}
                agents={{
                  crm: state.agents.crm!,
                  creative: state.agents.creative!,
                  design: state.agents.design!,
                  assets: state.agents.assets!,
                }}
                project={state.agents.project}
                onApprove={handleApprove}
              />
            </PhaseSection>
          )}

        {/* Phase 4: Website Build */}
        {phaseAtLeast(state.phase, "building") && (
          <PhaseSection
            title="Phase 4: Website Build"
            phase={4}
            active={
              state.phase === "building" || state.phase === "build_complete"
            }
            complete={phaseAtLeast(state.phase, "deployment_ready")}
            liveToggle={
              <PhaseToggle
                isLive={isLive(state, "build")}
                onToggle={() =>
                  dispatch({ type: "TOGGLE_PHASE_LIVE", payload: "build" })
                }
              />
            }
          >
            {state.phase === "building" && (
              <div className="flex items-center gap-3 py-8 text-white/50">
                <span className="animate-pulse-dot text-blue-400">◉</span>
                Generating website...
              </div>
            )}
            {state.build && <SitePreview site={state.build} />}
          </PhaseSection>
        )}

        {/* Phase 5: Deployment Ready */}
        {state.phase === "deployment_ready" && (
          <PhaseSection
            title="Phase 5: Deployment Ready"
            phase={5}
            active={true}
            complete={false}
          >
            <DeploymentCards
              enriched={state.enriched!}
              startTime={startTimeRef.current}
            />
          </PhaseSection>
        )}
      </main>
    </div>
  );
}

function PhaseSection({
  title,
  phase,
  active,
  complete,
  children,
  liveToggle,
}: {
  title: string;
  phase: number;
  active: boolean;
  complete: boolean;
  children: React.ReactNode;
  liveToggle?: React.ReactNode;
}) {
  return (
    <section className={`mb-8 ${active ? "" : "opacity-60"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
              complete
                ? "bg-green-500/20 text-green-400"
                : active
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/10 text-white/50"
            }`}
          >
            {complete ? "✓" : phase}
          </span>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        {liveToggle}
      </div>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Verify the full app starts**

Run: `npm run dev` (from root)
Expected: Next.js on :3000, Express on :3001. Open http://localhost:3000 — should see the intake form.

- [ ] **Step 3: Commit**

```bash
git add client/app/page.tsx
git commit -m "feat: add main pipeline page orchestrating all phases"
```

---

## Task 17: Demo Assets

**Files:**
- Create: `client/public/demo-logo.svg`
- Create: `client/public/demo-hero.jpg` (placeholder)

- [ ] **Step 1: Create the demo logo SVG**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" fill="none">
  <rect width="400" height="120" rx="8" fill="#2D5F2D"/>
  <text x="200" y="55" text-anchor="middle" fill="#F5E6D3" font-family="Georgia, serif" font-size="28" font-weight="bold">
    LONE STAR
  </text>
  <text x="200" y="85" text-anchor="middle" fill="#F5E6D3" font-family="Georgia, serif" font-size="18">
    Pet Grooming
  </text>
  <text x="200" y="105" text-anchor="middle" fill="#F5E6D3" font-family="Arial, sans-serif" font-size="10" opacity="0.7">
    Where Every Pet Leaves Happy
  </text>
</svg>
```

- [ ] **Step 2: Create a placeholder hero image**

For the demo, download a free stock photo of a groomed dog to `client/public/demo-hero.jpg`. If no image is available, create a simple placeholder SVG renamed to `.jpg` — but for demo day, a real photo is strongly recommended.

As a fallback, create a simple gradient placeholder:

```bash
# If ImageMagick is available:
convert -size 1920x1080 gradient:'#2D5F2D'-'#F5E6D3' client/public/demo-hero.jpg

# Otherwise, the build prompt will work without it — the hero section will just lack a background image
```

- [ ] **Step 3: Commit**

```bash
git add client/public/demo-logo.svg
git add client/public/demo-hero.jpg 2>/dev/null  # only if created
git commit -m "feat: add demo logo and placeholder hero image"
```

---

## Task 18: Cache Seeding Script

**Files:**
- Create: `scripts/seed-cache.ts`

- [ ] **Step 1: Write the seed cache script**

```typescript
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_CACHE = path.join(__dirname, "..", "server", "cache");
const FALLBACK_FILE = path.join(
  __dirname,
  "..",
  "client",
  "lib",
  "fallback-data.ts"
);

const SERVER = "http://localhost:3001";

const DEMO_INTAKE = {
  businessName: "Lone Star Pet Grooming",
  ownerName: "Maria Santos",
  email: "maria@demo.frasierdigital.com",
  phone: "(281) 555-0142",
  industry: "Pet services",
  services: "Dog grooming, cat grooming, nail trimming, flea treatment",
  brandColors: { primary: "#2D5F2D", secondary: "#F5E6D3" },
  tagline: "Where every pet leaves happy",
  tone: "Friendly, warm, trustworthy",
  pagesNeeded: ["Home", "Services", "About", "Contact"],
  desiredDomain: "lonestarpetgrooming.com",
  budgetTier: "Standard ($1,500)",
  logoUrl: "/demo-logo.svg",
  heroImageUrl: "/demo-hero.jpg",
};

async function post(path: string, body: unknown) {
  const res = await fetch(`${SERVER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log("Seeding cache — make sure Express server is running on :3001\n");

  mkdirSync(SERVER_CACHE, { recursive: true });

  // Stage 1: Enrich
  console.log("1/4 Enriching intake data...");
  const enriched = await post("/enrich", DEMO_INTAKE);
  writeFileSync(
    path.join(SERVER_CACHE, "enrich.json"),
    JSON.stringify(enriched, null, 2)
  );
  console.log("    ✓ Enrichment cached");

  // Stage 2: Agents
  console.log("2/4 Running agents...");
  const agents = await post("/agents", enriched);
  writeFileSync(
    path.join(SERVER_CACHE, "agents.json"),
    JSON.stringify(agents, null, 2)
  );
  console.log("    ✓ Agents cached");

  // Stage 3: Project (display mode)
  console.log("3/4 Creating project payload...");
  const project = await post("/project", {
    enriched,
    creative: agents.creative,
    mode: "display",
  });
  writeFileSync(
    path.join(SERVER_CACHE, "project.json"),
    JSON.stringify(project, null, 2)
  );
  console.log("    ✓ Project cached");

  // Stage 4: Build
  console.log("4/4 Generating website...");
  const build = await post("/build", {
    enriched,
    creative: agents.creative,
    design: agents.design,
  });
  writeFileSync(
    path.join(SERVER_CACHE, "build.json"),
    JSON.stringify(build, null, 2)
  );
  console.log("    ✓ Build cached");

  // Write fallback-data.ts
  console.log("\nWriting client/lib/fallback-data.ts...");
  const fallbackTs = `// AUTO-GENERATED by scripts/seed-cache.ts — do not edit manually
import type {
  EnrichedData,
  AgentsResult,
  GeneratedSite,
  ProjectResult,
} from "./types";

export const fallbackEnriched: EnrichedData = ${JSON.stringify(enriched, null, 2)} as EnrichedData;

export const fallbackAgents: AgentsResult = ${JSON.stringify(agents, null, 2)} as AgentsResult;

export const fallbackProject: ProjectResult = ${JSON.stringify(project, null, 2)} as ProjectResult;

export const fallbackBuild: GeneratedSite = ${JSON.stringify(build, null, 2)} as GeneratedSite;
`;
  writeFileSync(FALLBACK_FILE, fallbackTs);
  console.log("    ✓ fallback-data.ts written");

  console.log("\n✓ Cache seeding complete!");
  console.log("  Server cache: server/cache/");
  console.log("  Client fallback: client/lib/fallback-data.ts");
}

main().catch((err) => {
  console.error("Cache seeding failed:", err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Add cache directory to .gitignore**

Append to `.gitignore`:
```
server/cache/*.json
```

- [ ] **Step 3: Create server/cache/.gitkeep**

Empty file to ensure the directory exists.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-cache.ts server/cache/.gitkeep .gitignore
git commit -m "feat: add cache seeding script for demo fallback data"
```

---

## Task 19: End-to-End Smoke Test

**Files:** None (testing only)

- [ ] **Step 1: Start both servers**

Run: `npm run dev`
Expected: Next.js on :3000, Express on :3001

- [ ] **Step 2: Test the intake form**

Open http://localhost:3000. The intake form should appear pre-filled with demo data. Verify:
- All fields are populated
- Color pickers show the correct colors
- Page checkboxes are selected
- Logo and hero image placeholders are visible

- [ ] **Step 3: Submit the form and test the full pipeline**

Click "Submit Intake." Verify each phase:
1. Parsed payload card appears with formatted data
2. Enrichment card shows side-by-side comparison
3. Agent cards appear and populate with results
4. Approval panel shows summary with expand/collapse
5. Click "Approve & Build"
6. Website generates and appears in iframe preview
7. Deployment payload cards appear with pipeline complete summary

- [ ] **Step 4: Test cached mode**

Click the master toggle to "Cached." Click Reset (if available) or refresh. Run through the pipeline again — all phases should use cached data and complete instantly.

- [ ] **Step 5: Test the cache seeding script**

With the Express server running:
Run: `npm run seed-cache`
Expected: All 4 stages complete, `server/cache/` has JSON files, `client/lib/fallback-data.ts` is updated.

- [ ] **Step 6: Fix any issues found**

Address any bugs, layout issues, or runtime errors discovered during testing.

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end smoke test"
```

---

## Task 20: Pre-Demo Polish

**Files:** Various

- [ ] **Step 1: Add loading states for all async operations**

Verify each phase shows appropriate loading indicators:
- Enrichment: "Enriching intake data..." with spinner
- Agents: "Running agents in parallel..." with spinner
- Build: "Generating website..." with spinner

Fix any missing loading states.

- [ ] **Step 2: Test with a different business input**

Change the form data to a different business (e.g., "Tomball Auto Repair") and run the full pipeline with Live AI. Verify the generated content is specific to the new business, not generic or recycled from the pet grooming data.

- [ ] **Step 3: Test the "Create Claude Project" button**

With a real API key and the project toggle set to Live, click "Create Claude Project." Verify:
- The request succeeds or falls back gracefully
- The project card shows the result

- [ ] **Step 4: Run one full live demo rehearsal**

Run the complete demo flow as if presenting to the client:
1. Start with the intake form
2. Fill out demo data
3. Submit and narrate through each phase
4. Approve and wait for website generation
5. Preview the generated site in the iframe
6. Walk through deployment cards

Time it — aim for under 15 minutes total.

- [ ] **Step 5: Seed the production cache**

After a successful live rehearsal, run `npm run seed-cache` to capture those outputs as the fallback data.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: pre-demo polish and final cache seed"
```
