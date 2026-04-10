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
