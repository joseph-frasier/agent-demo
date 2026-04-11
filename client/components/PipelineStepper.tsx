"use client";

import type { PhaseStatus } from "@/lib/types";

const PHASES = [
  { key: "intake", label: "Client Intake", phase: 1, targetId: "section-intake" },
  { key: "enriching", label: "Agent Processing", phase: 2, targetId: "section-agents" },
  { key: "approval", label: "Lead Approval", phase: 3, targetId: "section-approval" },
  { key: "building", label: "Website Build", phase: 4, targetId: "section-build" },
  { key: "deployment_ready", label: "Deployment Ready", phase: 5, targetId: "section-deployment" },
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
  // Terminal state: once we reach deployment_ready the whole pipeline is done,
  // so show it as complete rather than perpetually "active".
  if (currentPhase === "deployment_ready" && phaseKey === "deployment_ready") {
    return "complete";
  }

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
  const handleClick = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="flex flex-col gap-1">
      {PHASES.map(({ key, label, phase, targetId }) => {
        const status = getStatus(key, currentPhase);
        const clickable = status !== "pending";
        return (
          <button
            key={key}
            type="button"
            onClick={() => clickable && handleClick(targetId)}
            disabled={!clickable}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left w-full ${
              status === "active"
                ? "bg-brand-card border border-brand-border"
                : status === "complete"
                  ? "opacity-70"
                  : "opacity-40"
            } ${clickable ? "enabled:hover:bg-white/5" : ""} disabled:cursor-default`}
          >
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                status === "complete"
                  ? "bg-brand-accent/15 text-brand-accent"
                  : status === "active"
                    ? "bg-brand-blue/15 text-brand-blue animate-pulse-dot"
                    : "bg-white/10 text-white/50"
              }`}
            >
              {status === "complete" ? "✓" : phase}
            </span>
            <span className="text-sm font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
