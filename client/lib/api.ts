import type {
  IntakeData,
  EnrichedData,
  CrmRecord,
  CreativeBrief,
  DesignTokens,
  AssetManifest,
  GeneratedSite,
  ProjectResult,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

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

export function fetchAgentCrm(
  enriched: EnrichedData
): Promise<{ crm: CrmRecord }> {
  return post("/agents/crm", enriched);
}

export function fetchAgentCreative(
  enriched: EnrichedData
): Promise<{ creative: CreativeBrief }> {
  return post("/agents/creative", enriched);
}

export function fetchAgentDesign(
  enriched: EnrichedData
): Promise<{ design: DesignTokens }> {
  return post("/agents/design", enriched);
}

export function fetchAgentAssets(
  enriched: EnrichedData
): Promise<{ assets: AssetManifest }> {
  return post("/agents/assets", enriched);
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
