"use client";

import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PhaseStatus, PipelineState } from "@/lib/types";

// ── Phase metadata ────────────────────────────────────────────────────────────

const PHASES = [
  {
    key: "intake",
    label: "Client Intake",
    phase: 1,
    targetId: "section-intake",
    activeKind: "waiting" as const,
  },
  {
    key: "enriching",
    label: "Agent Processing",
    phase: 2,
    targetId: "section-agents",
    activeKind: "processing" as const,
  },
  {
    key: "approval",
    label: "Lead Approval",
    phase: 3,
    targetId: "section-approval",
    activeKind: "waiting" as const,
  },
  {
    key: "building",
    label: "Website Build",
    phase: 4,
    targetId: "section-build",
    activeKind: "processing" as const,
  },
  {
    key: "deployment_ready",
    label: "Deployment Ready",
    phase: 5,
    targetId: "section-deployment",
    activeKind: "waiting" as const,
  },
] as const;

const PHASE_ORDER: Record<string, number> = {
  intake: 0,
  enriching: 1,
  enriched: 1,
  processing_agents: 1,
  agents_complete: 2,
  approval: 2,
  building: 3,
  build_complete: 3,
  deployment_ready: 4,
};

type StepStatus = "complete" | "active" | "pending";
type ActiveKind = "processing" | "waiting";

function getStatus(phaseKey: string, currentPhase: PhaseStatus): StepStatus {
  if (currentPhase === "deployment_ready" && phaseKey === "deployment_ready") {
    return "complete";
  }
  const currentIdx = PHASE_ORDER[currentPhase] ?? 0;
  const phaseIdx = PHASE_ORDER[phaseKey] ?? 0;
  if (phaseIdx < currentIdx) return "complete";
  if (phaseIdx === currentIdx) return "active";
  return "pending";
}

// ── Agent sub-node ────────────────────────────────────────────────────────────

type AgentSlotStatus = "processing" | "complete";

function AgentSubNode({
  label,
  status,
}: {
  label: string;
  status: AgentSlotStatus;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-4 h-4 shrink-0">
        {status === "processing" && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-brand-blue/40 animate-halo-pulse"
              style={{ animationDuration: "1.6s" }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-brand-blue border-t-transparent animate-spin"
              style={{ animationDuration: "1.4s" }}
            />
          </>
        )}
        {status === "complete" && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 14 }}
            className="absolute inset-0 rounded-full bg-brand-accent flex items-center justify-center"
          >
            <span className="text-[8px] font-bold text-brand-dark leading-none">✓</span>
          </motion.div>
        )}
      </div>
      <span
        className={`text-[10px] uppercase tracking-widest ${
          status === "complete" ? "text-brand-accent" : "text-brand-blue"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ── Sub-cluster (agents or pages) ─────────────────────────────────────────────

function SubCluster({
  slots,
}: {
  slots: { key: string; label: string; status: AgentSlotStatus }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden relative"
    >
      {/* Horizontal branch line from the main vertical line (at left=33) into
          the cluster's own left edge (at left=42). 9px wide, vertically
          centered on the first sub-node row. */}
      <div
        aria-hidden
        className="absolute bg-brand-accent/50 rounded-full"
        style={{
          left: "33px",
          top: "18px",
          width: "9px",
          height: "2px",
        }}
      />
      <div className="ml-[42px] mt-2 mb-1 grid grid-cols-2 gap-x-3 gap-y-2 pl-3">
        {slots.map((slot) => (
          <AgentSubNode key={slot.key} label={slot.label} status={slot.status} />
        ))}
      </div>
    </motion.div>
  );
}

function agentSlots(
  agents: PipelineState["agents"]
): { key: string; label: string; status: AgentSlotStatus }[] {
  const entries: { key: keyof PipelineState["agents"]; label: string }[] = [
    { key: "crm", label: "CRM" },
    { key: "creative", label: "Creative" },
    { key: "design", label: "Design" },
    { key: "assets", label: "Assets" },
  ];
  return entries.map(({ key, label }) => ({
    key,
    label,
    status: agents[key] ? "complete" : "processing",
  }));
}

function buildSlots(
  pagesCompleted: string[]
): { key: string; label: string; status: AgentSlotStatus }[] {
  const entries = ["Home", "Services", "About", "Contact"];
  const completedLower = new Set(pagesCompleted.map((n) => n.toLowerCase()));
  return entries.map((name) => ({
    key: name,
    label: name,
    status: completedLower.has(name.toLowerCase()) ? "complete" : "processing",
  }));
}

// ── Step node ─────────────────────────────────────────────────────────────────

function StepNode({
  status,
  phaseNumber,
  activeKind,
}: {
  status: StepStatus;
  phaseNumber: number;
  activeKind: ActiveKind;
}) {
  const isProcessing = status === "active" && activeKind === "processing";

  // Color targets for smooth morphing between states. These are approximate
  // opaque equivalents of the layered bg we used before — imperceptible at
  // 28px circle size and they let framer-motion interpolate smoothly.
  const bg =
    status === "complete"
      ? "#FF901B"
      : status === "active"
        ? "#1F2249"
        : "#1d1f33";
  const border =
    status === "complete"
      ? "rgba(255,144,27,0)"
      : status === "active"
        ? "rgba(81,91,206,0.6)"
        : "rgba(255,255,255,0.15)";
  const shadow =
    status === "complete"
      ? "0 0 14px rgba(255,144,27,0.4)"
      : status === "active"
        ? "0 0 18px rgba(96,178,240,0.45)"
        : "0 0 0px rgba(0,0,0,0)";
  const textColor =
    status === "complete"
      ? "#121428"
      : status === "active"
        ? "#515BCE"
        : "rgba(255,255,255,0.4)";

  return (
    <div className="relative w-9 h-9 flex items-center justify-center shrink-0 z-10">
      {/* Halos + spinner ring — only during processing, fades in/out */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            key="fx"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 rounded-full bg-brand-blue/30 animate-halo-pulse"
              style={{ animationDuration: "1.8s" }}
            />
            <div
              className="absolute inset-0 rounded-full bg-brand-blue/20 animate-halo-pulse"
              style={{ animationDuration: "2.4s", animationDelay: "0.6s" }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-brand-blue border-t-transparent animate-spin"
              style={{ animationDuration: "1.6s" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent inner circle — morphs colors instead of unmounting */}
      <motion.div
        className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border"
        animate={{
          backgroundColor: bg,
          borderColor: border,
          boxShadow: shadow,
          color: textColor,
          scale: 1,
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={status === "complete" ? "check" : "num"}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
          >
            {status === "complete" ? "✓" : phaseNumber}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PipelineStepper({
  currentPhase,
  agents,
  buildProgress,
}: {
  currentPhase: PhaseStatus;
  agents?: PipelineState["agents"];
  buildProgress?: PipelineState["buildProgress"];
}) {
  const handleClick = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showAgentCluster =
    !!agents &&
    (currentPhase === "processing_agents" ||
      !!agents.crm ||
      !!agents.creative ||
      !!agents.design ||
      !!agents.assets);
  const showBuildCluster =
    !!buildProgress &&
    (currentPhase === "building" || buildProgress.pagesCompleted.length > 0);

  // How many of the 5 steps are complete. Used to compute the progress-line
  // fill percentage. Denominator is (PHASES.length - 1) because the line
  // spans from the first node's center to the last node's center, so 4 steps
  // complete = fully filled.
  const completeCount = PHASES.filter(
    (p) => getStatus(p.key, currentPhase) === "complete"
  ).length;
  let fillPct = Math.min(
    100,
    (completeCount / (PHASES.length - 1)) * 100
  );

  const stepFraction = (1 / (PHASES.length - 1)) * 100;

  // During agent processing, creep the line forward as each agent completes.
  if (currentPhase === "processing_agents" && agents) {
    const agentsDone = [agents.crm, agents.creative, agents.design, agents.assets]
      .filter(Boolean).length;
    fillPct = Math.min(100, fillPct + (agentsDone / 4) * stepFraction);
  }

  // During building, creep the line forward as each page completes.
  if (currentPhase === "building" && buildProgress) {
    const pageProgress = buildProgress.pagesCompleted.length / 4;
    fillPct = Math.min(100, fillPct + pageProgress * stepFraction);
  }

  return (
    <nav className="relative flex flex-col">
      {/* Continuous background line — spans from step 1 center to step 5 center.
          top-[26px] matches the step node vertical center within a 52px-tall
          row (py-2 padding + half of the 36px node = 8 + 18 = 26). */}
      <div
        aria-hidden
        className="absolute w-0.5 bg-white/10 rounded-full"
        style={{ left: "33px", top: "26px", bottom: "26px" }}
      />
      {/* Filled portion — grows downward as steps complete. */}
      <motion.div
        aria-hidden
        className={`absolute w-0.5 rounded-full ${
          completeCount >= PHASES.length
            ? "bg-brand-accent"
            : "bg-gradient-to-b from-brand-accent to-brand-blue"
        }`}
        style={{
          left: "33px",
          top: "26px",
          boxShadow: "0 0 10px rgba(255, 144, 27, 0.45)",
        }}
        initial={false}
        animate={{
          height: `calc(${fillPct}% - ${(fillPct / 100) * 52}px)`,
        }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />

      {PHASES.map(({ key, label, phase, targetId, activeKind }) => {
        const status = getStatus(key, currentPhase);
        const clickable = status !== "pending";
        const isAgentStep = key === "enriching";
        const isBuildStep = key === "building";
        const showAgents = isAgentStep && showAgentCluster;
        const showBuild = isBuildStep && showBuildCluster;

        return (
          <Fragment key={key}>
            <button
              type="button"
              onClick={() => clickable && handleClick(targetId)}
              disabled={!clickable}
              className={`relative group flex items-center gap-3 px-4 py-2 rounded-lg text-left w-full transition-colors duration-300 ${
                status === "active" ? "bg-brand-card/60" : ""
              } ${clickable ? "enabled:hover:bg-white/5" : ""} disabled:cursor-default`}
            >
              <StepNode
                status={status}
                phaseNumber={phase}
                activeKind={activeKind}
              />
              <span
                className={`text-sm font-medium transition-all duration-300 ${
                  status === "active"
                    ? "text-white"
                    : status === "complete"
                      ? "text-white/85"
                      : "text-white/40"
                }`}
                style={
                  status === "active"
                    ? { textShadow: "0 0 14px rgba(96, 178, 240, 0.55)" }
                    : undefined
                }
              >
                {label}
              </span>
            </button>

            <AnimatePresence>
              {showAgents && <SubCluster slots={agentSlots(agents!)} />}
              {showBuild && (
                <SubCluster
                  slots={buildSlots(buildProgress!.pagesCompleted)}
                />
              )}
            </AnimatePresence>
          </Fragment>
        );
      })}
    </nav>
  );
}
