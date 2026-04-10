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
