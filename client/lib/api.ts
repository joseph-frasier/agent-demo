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

export async function fetchProjectKit(data: {
  enriched: EnrichedData;
  creative: unknown;
  design: unknown;
}): Promise<ProjectResult> {
  const res = await fetch(`${API_BASE}/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || "Project kit download failed");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? "claude-project-kit.zip";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { filename, downloadedAt: new Date().toISOString() };
}
