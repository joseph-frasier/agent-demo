/**
 * Seed the demo cache by running the full pipeline for selected companies.
 *
 * Usage:
 *   npm run seed-cache                        # seeds all configured companies
 *   npx tsx scripts/seed-cache.ts ridgeline   # seed just one (substring match)
 *
 * Requires the Express server running on :3001.
 */
import { writeFileSync, mkdirSync, cpSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CACHE_DIR = path.join(ROOT, "client", "lib", "cache");
const SERVER_GENERATED = path.join(ROOT, "server", "generated");
const SERVER = "http://localhost:3001";

// ── Companies to cache ─────────────────────────────────────────────────────────

interface DemoCompany {
  slug: string;
  sessionId: string;
  intake: Record<string, unknown>;
}

const COMPANIES: DemoCompany[] = [
  {
    slug: "ridgeline-outdoor",
    sessionId: "ridgeline-std",
    intake: {
      businessName: "Ridgeline Outdoor Education",
      ownerName: "Tom Yazzie",
      email: "tom@ridgelineoutdoor.org",
      phone: "(928) 554-0076",
      industry: "Education / Outdoor recreation",
      services:
        "Wilderness survival courses, youth camps, guided backpacking, team building retreats, first aid certification",
      brandColors: { primary: "#3B6E45", secondary: "#F2EAD8" },
      tagline: "Go further. Come back changed.",
      tone: "Adventurous, inspiring, grounded, community-focused",
      pagesNeeded: ["Home", "Services", "Gallery", "About", "Contact"],
      desiredDomain: "ridgelineoutdoor.org",
      budgetTier: "Standard ($1,500)",
      logoUrl: "/logos/ridgeline-outdoor.svg",
      designStyle: "standard",
      heroImageUrl: "/demo-hero.jpg",
    },
  },
  {
    slug: "nimbus-cloud",
    sessionId: "nimbus-bold",
    intake: {
      businessName: "Nimbus Cloud Solutions",
      ownerName: "Priya Anand",
      email: "priya@nimbuscloud.io",
      phone: "(415) 600-7742",
      industry: "B2B SaaS / Cloud infrastructure",
      services:
        "Cloud migration, DevOps automation, Kubernetes management, security compliance, 24/7 monitoring",
      brandColors: { primary: "#1B3DE8", secondary: "#E8EFFE" },
      tagline: "Infrastructure that scales with ambition.",
      tone: "Confident, technical, forward-thinking, enterprise-grade",
      pagesNeeded: ["Home", "Services", "About", "Blog", "Contact"],
      desiredDomain: "nimbuscloud.io",
      budgetTier: "Premium ($3,500)",
      logoUrl: "/logos/nimbus-cloud.svg",
      designStyle: "bold",
      heroImageUrl: "/demo-hero.jpg",
    },
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SERVER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/** Read an SSE stream chunk-by-chunk and return the data payload of `targetEvent`. */
async function parseSSE<T = unknown>(
  path: string,
  body: unknown,
  targetEvent: string
): Promise<T> {
  const res = await fetch(`${SERVER}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${path} SSE failed (${res.status})`);
  }
  if (!res.body) {
    throw new Error(`${path} SSE response has no body`);
  }

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });

    // Process any complete frames (separated by double newline)
    const parts = buffer.split("\n\n");
    // Keep the last part — it may be an incomplete frame
    buffer = parts.pop() ?? "";

    for (const frame of parts) {
      if (!frame.trim()) continue;
      const eventMatch = frame.match(/^event:\s*(.+)$/m);
      const dataMatch = frame.match(/^data:\s*(.+)$/m);

      if (eventMatch?.[1] === "error" && dataMatch?.[1]) {
        const err = JSON.parse(dataMatch[1]);
        throw new Error(`Build error: ${err.message || err.error}`);
      }
      if (eventMatch?.[1] === "page_complete" && dataMatch?.[1]) {
        const page = JSON.parse(dataMatch[1]);
        console.log(`      ✓ Page complete: ${page.name}`);
      }
      if (eventMatch?.[1] === targetEvent && dataMatch?.[1]) {
        return JSON.parse(dataMatch[1]) as T;
      }
    }
  }

  throw new Error(`No "${targetEvent}" event found in SSE stream`);
}

// ── Seed one company ────────────────────────────────────────────────────────────

async function seedCompany(company: DemoCompany) {
  const { slug, sessionId, intake } = company;
  const label = intake.businessName as string;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  Seeding: ${label} (${slug})`);
  console.log(`${"═".repeat(60)}\n`);

  // 1. Enrich
  console.log("  1/5 Enriching intake data...");
  const enriched = await post("/enrich", intake);
  console.log("      ✓ Enrichment complete");

  // 2. Agents (parallel)
  console.log("  2/5 Running agents (crm, creative, design, assets)...");
  const [crmRes, creativeRes, designRes, assetsRes] = await Promise.all([
    post<{ crm: unknown }>("/agents/crm", enriched),
    post<{ creative: unknown }>("/agents/creative", enriched),
    post<{ design: unknown }>("/agents/design", enriched),
    post<{ assets: unknown }>("/agents/assets", enriched),
  ]);
  const agents = {
    crm: crmRes.crm,
    creative: creativeRes.creative,
    design: designRes.design,
    assets: assetsRes.assets,
  };
  console.log("      ✓ All agents complete");

  // 3. Build (SSE stream → wait for "complete" event)
  console.log("  3/5 Generating website (this may take a few minutes)...");
  const buildResult = await parseSSE("/build", {
    enriched,
    creative: agents.creative,
    design: agents.design,
    logoUrl: intake.logoUrl,
    designStyle: intake.designStyle,
  }, "complete");
  console.log("      ✓ Build complete");

  // 4. Copy generated HTML to deterministic session dir
  const origSessionId = (buildResult as Record<string, unknown>).sessionId as string;
  const origDir = path.join(SERVER_GENERATED, origSessionId);
  const destDir = path.join(SERVER_GENERATED, sessionId);

  console.log(`  4/5 Copying ${origSessionId} → ${sessionId}...`);
  if (existsSync(destDir)) {
    // Remove existing to get a clean copy
    const { rmSync } = await import("fs");
    rmSync(destDir, { recursive: true });
  }
  cpSync(origDir, destDir, { recursive: true });
  console.log("      ✓ HTML files copied");

  // 5. Write TypeScript cache fixture
  console.log("  5/5 Writing cache fixture...");
  mkdirSync(CACHE_DIR, { recursive: true });

  // Patch the sessionId in the build result to use the deterministic one
  const patchedBuild = {
    ...(buildResult as Record<string, unknown>),
    sessionId,
  };

  const fixture = `// AUTO-GENERATED by scripts/seed-cache.ts — do not edit manually
import type { EnrichedData, AgentsResult, GeneratedSite } from "../types";

export const SESSION_ID = ${JSON.stringify(sessionId)};

export const enriched: EnrichedData = ${JSON.stringify(enriched, null, 2)} as EnrichedData;

export const agents: AgentsResult = ${JSON.stringify(agents, null, 2)} as unknown as AgentsResult;

export const build: GeneratedSite = ${JSON.stringify(patchedBuild, null, 2)} as GeneratedSite;
`;

  writeFileSync(path.join(CACHE_DIR, `${slug}.ts`), fixture);
  console.log("      ✓ Fixture written");

  console.log(`\n  ✓ ${label} cached successfully!`);
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Demo Cache Seeder");
  console.log("Make sure the Express server is running on :3001\n");

  const filter = process.argv[2]?.toLowerCase();
  const targets = filter
    ? COMPANIES.filter(
        (c) =>
          c.slug.includes(filter) ||
          (c.intake.businessName as string).toLowerCase().includes(filter)
      )
    : COMPANIES;

  if (targets.length === 0) {
    console.error(`No companies match "${filter}". Available: ${COMPANIES.map((c) => c.slug).join(", ")}`);
    process.exit(1);
  }

  console.log(`Seeding ${targets.length} company(ies): ${targets.map((c) => c.slug).join(", ")}`);

  for (const company of targets) {
    await seedCompany(company);
  }

  // Write the cache index — always includes ALL companies, not just the ones seeded this run
  console.log("\nWriting cache index...");
  const indexTs = `// AUTO-GENERATED by scripts/seed-cache.ts — do not edit manually
import type { EnrichedData, AgentsResult, GeneratedSite, ProjectResult } from "../types";

${COMPANIES.map((c) => `import * as ${camel(c.slug)} from "./${c.slug}";`).join("\n")}

export interface CachedPipeline {
  enriched: EnrichedData;
  agents: AgentsResult;
  build: GeneratedSite;
  project: ProjectResult;
}

const CACHE: Record<string, CachedPipeline> = {
${COMPANIES
  .map(
    (c) => `  ${JSON.stringify(c.intake.businessName)}: {
    enriched: ${camel(c.slug)}.enriched,
    agents: ${camel(c.slug)}.agents,
    build: ${camel(c.slug)}.build,
    project: {
      filename: "${slugify(c.intake.businessName as string)}-claude-project-kit.zip",
      downloadedAt: ${JSON.stringify(new Date().toISOString())},
    },
  },`
  )
  .join("\n")}
};

export function getCachedPipeline(businessName: string): CachedPipeline | undefined {
  return CACHE[businessName];
}
`;
  writeFileSync(path.join(CACHE_DIR, "index.ts"), indexTs);
  console.log("  ✓ cache/index.ts written");

  console.log("\n✓ All done! Cache files written to client/lib/cache/");
}

function camel(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

main().catch((err) => {
  console.error("\nCache seeding failed:", err.message);
  process.exit(1);
});
