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
  logoUrl?: string;
}): Promise<GeneratedSite> {
  return post("/build", data);
}

export interface BuildStreamCallbacks {
  onStatus?: (message: string) => void;
  onPageComplete?: (page: { name: string; index: number }) => void;
}

export async function fetchBuildStream(
  data: {
    enriched: EnrichedData;
    creative: unknown;
    design: unknown;
    logoUrl?: string;
    designStyle?: "standard" | "bold";
  },
  callbacks: BuildStreamCallbacks
): Promise<GeneratedSite> {
  const res = await fetch(`${API_BASE}/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || "Build stream failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: GeneratedSite | null = null;
  let errorMessage: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by \n\n. Anything left after the last \n\n is
    // an incomplete frame to keep buffered for the next read.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      if (!frame.trim()) continue;

      let eventType = "message";
      let dataStr = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataStr = line.slice(6);
      }
      if (!dataStr) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(dataStr);
      } catch {
        continue;
      }

      if (eventType === "status" && callbacks.onStatus) {
        callbacks.onStatus((parsed as { message: string }).message);
      } else if (eventType === "page_complete" && callbacks.onPageComplete) {
        callbacks.onPageComplete(
          parsed as { name: string; index: number }
        );
      } else if (eventType === "complete") {
        result = parsed as GeneratedSite;
      } else if (eventType === "error") {
        errorMessage =
          (parsed as { message?: string; error?: string }).message ??
          (parsed as { message?: string; error?: string }).error ??
          "Build failed";
      }
    }
  }

  if (errorMessage) throw new Error(errorMessage);
  if (!result) throw new Error("Build stream ended without a complete event");
  return result;
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
