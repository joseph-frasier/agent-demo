"use client";

import { useReducer, useRef } from "react";
import { pipelineReducer, initialState, isLive } from "@/lib/pipeline-reducer";
import { fetchEnrich, fetchAgents, fetchBuild, fetchProject } from "@/lib/api";
import {
  fallbackEnriched,
  fallbackAgents,
  fallbackProject,
  fallbackBuild,
} from "@/lib/fallback-data";
import type { PhaseStatus } from "@/lib/types";

import { PipelineStepper } from "@/components/PipelineStepper";
import { PhaseToggle } from "@/components/PhaseToggle";
import IntakeForm from "@/components/IntakeForm";
import PayloadCard from "@/components/PayloadCard";
import EnrichedPayload from "@/components/EnrichedPayload";
import AgentCard, {
  CrmCardContent,
  CreativeCardContent,
  DesignCardContent,
  AssetCardContent,
} from "@/components/AgentCard";
import { ApprovalPanel } from "@/components/ApprovalPanel";
import SitePreview from "@/components/SitePreview";
import DeploymentCards from "@/components/DeploymentCards";

// ── Phase ordering ─────────────────────────────────────────────────────────────

const PHASE_ORDER: Record<PhaseStatus, number> = {
  intake: 0,
  enriching: 1,
  enriched: 2,
  processing_agents: 3,
  agents_complete: 4,
  approval: 5,
  building: 6,
  build_complete: 7,
  deployment_ready: 8,
};

// ── PhaseSection internal component ───────────────────────────────────────────

interface PhaseSectionProps {
  title: string;
  phaseNumber: number;
  currentPhase: PhaseStatus;
  thresholdPhase: PhaseStatus;
  liveToggle?: React.ReactNode;
  children: React.ReactNode;
}

function PhaseSection({
  title,
  phaseNumber,
  currentPhase,
  thresholdPhase,
  liveToggle,
  children,
}: PhaseSectionProps) {
  const currentIdx = PHASE_ORDER[currentPhase];
  const thresholdIdx = PHASE_ORDER[thresholdPhase];

  let status: "complete" | "active" | "pending";
  if (currentIdx > thresholdIdx) {
    status = "complete";
  } else if (currentIdx === thresholdIdx) {
    status = "active";
  } else {
    status = "pending";
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
            status === "complete"
              ? "bg-green-500/20 text-green-400"
              : status === "active"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-white/10 text-white/40"
          }`}
        >
          {status === "complete" ? "✓" : phaseNumber}
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {liveToggle && <div className="ml-auto">{liveToggle}</div>}
      </div>
      {children}
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);
  const startTimeRef = useRef<number>(Date.now());

  function phaseAtLeast(phase: PhaseStatus): boolean {
    return PHASE_ORDER[state.phase] >= PHASE_ORDER[phase];
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleIntakeSubmit(
    data: import("@/lib/types").IntakeData
  ) {
    startTimeRef.current = Date.now();
    dispatch({ type: "SUBMIT_INTAKE", payload: data });

    try {
      // Phase 2a: Enrich
      const enriched = isLive(state, "enrich")
        ? await fetchEnrich(data)
        : fallbackEnriched;
      dispatch({ type: "SET_ENRICHED", payload: enriched });

      // Phase 2b: Agents
      dispatch({ type: "SET_PHASE", payload: "processing_agents" });
      const agents = isLive(state, "agents")
        ? await fetchAgents(enriched)
        : fallbackAgents;
      dispatch({ type: "SET_AGENTS", payload: agents });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "An error occurred",
      });
    }
  }

  async function handleApprove() {
    if (!state.enriched || !state.agents.creative || !state.agents.design)
      return;

    dispatch({ type: "APPROVE" });

    try {
      const site = isLive(state, "build")
        ? await fetchBuild({
            enriched: state.enriched,
            creative: state.agents.creative,
            design: state.agents.design,
          })
        : fallbackBuild;
      dispatch({ type: "SET_BUILD", payload: site });

      setTimeout(() => {
        dispatch({ type: "SET_DEPLOYMENT_READY" });
      }, 1000);
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Build failed",
      });
    }
  }

  async function handleCreateProject() {
    if (!state.enriched || !state.agents.creative) return;

    try {
      const project = isLive(state, "project")
        ? await fetchProject({
            enriched: state.enriched,
            creative: state.agents.creative,
            mode: "live",
          })
        : fallbackProject;
      dispatch({ type: "SET_PROJECT", payload: project });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Project creation failed",
      });
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const { phase, intake, enriched, agents, build, error } = state;

  const agentStatus = (key: "crm" | "creative" | "design" | "assets") => {
    if (agents[key]) return "complete";
    if (phase === "processing_agents") return "processing";
    return "pending";
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-brand-dark text-white">
      {/* ── Left Sidebar ── */}
      <aside className="w-72 shrink-0 border-r border-brand-border flex flex-col gap-8 p-6">
        <div>
          <h1 className="text-lg font-bold tracking-widest uppercase text-white">
            Irongrove
          </h1>
          <p className="text-sm text-white/50 mt-1">Agent Pipeline Demo</p>
        </div>

        <PipelineStepper currentPhase={phase} />

        <div className="mt-auto pt-4 border-t border-brand-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50 uppercase tracking-widest">
              Master Live/Cached
            </span>
            <PhaseToggle
              isLive={state.settings.masterLive}
              onToggle={() => dispatch({ type: "TOGGLE_MASTER_LIVE" })}
            />
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-8 max-w-4xl">
        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <span className="text-sm text-red-400">{error}</span>
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="ml-4 rounded-lg border border-red-500/30 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Reset
            </button>
          </div>
        )}

        {/* ── Phase 1: Client Intake ── */}
        <PhaseSection
          title="Client Intake"
          phaseNumber={1}
          currentPhase={phase}
          thresholdPhase="intake"
          liveToggle={
            <PhaseToggle
              isLive={isLive(state, "intake")}
              onToggle={() =>
                dispatch({ type: "TOGGLE_PHASE_LIVE", payload: "intake" })
              }
            />
          }
        >
          {phase === "intake" ? (
            <IntakeForm onSubmit={handleIntakeSubmit} />
          ) : intake ? (
            <PayloadCard data={intake} />
          ) : null}
        </PhaseSection>

        {/* ── Phase 2: Enrichment + Agents ── */}
        {phaseAtLeast("enriching") && (
          <PhaseSection
            title="AI Enrichment & Agent Processing"
            phaseNumber={2}
            currentPhase={phase}
            thresholdPhase="enriching"
            liveToggle={
              <PhaseToggle
                isLive={isLive(state, "enrich")}
                onToggle={() =>
                  dispatch({ type: "TOGGLE_PHASE_LIVE", payload: "enrich" })
                }
              />
            }
          >
            {/* Loading spinner while enriching */}
            {phase === "enriching" && (
              <div className="flex items-center gap-3 text-white/60 py-6">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                <span className="text-sm">Enriching intake data with AI...</span>
              </div>
            )}

            {/* Enriched payload once available */}
            {enriched && intake && (
              <div className="mb-8">
                <EnrichedPayload raw={intake} enriched={enriched} />
              </div>
            )}

            {/* Loading spinner while running agents */}
            {phase === "processing_agents" && !agents.crm && (
              <div className="flex items-center gap-3 text-white/60 py-4">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                <span className="text-sm">Running specialist agents...</span>
              </div>
            )}

            {/* Agent cards (visible during processing_agents and after) */}
            {phaseAtLeast("processing_agents") && (
              <div className="flex flex-col gap-3 mb-6">
                <AgentCard title="CRM Agent" status={agentStatus("crm")}>
                  {agents.crm && <CrmCardContent data={agents.crm} />}
                </AgentCard>
                <AgentCard
                  title="Creative Agent"
                  status={agentStatus("creative")}
                >
                  {agents.creative && (
                    <CreativeCardContent data={agents.creative} />
                  )}
                </AgentCard>
                <AgentCard title="Design Agent" status={agentStatus("design")}>
                  {agents.design && <DesignCardContent data={agents.design} />}
                </AgentCard>
                <AgentCard title="Asset Agent" status={agentStatus("assets")}>
                  {agents.assets && <AssetCardContent data={agents.assets} />}
                </AgentCard>
              </div>
            )}

            {/* Claude Project card */}
            {phaseAtLeast("processing_agents") && (
              <div className="rounded-xl border border-brand-border bg-brand-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Claude Project</h3>
                    {agents.project ? (
                      <p className="mt-1 text-xs text-white/50 font-mono">
                        {agents.project.projectId}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-white/50">
                        Create a Claude project to house all generated docs
                      </p>
                    )}
                  </div>
                  {!agents.project && (
                    <button
                      onClick={handleCreateProject}
                      className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      Create for real
                    </button>
                  )}
                  {agents.project && (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                      Created
                    </span>
                  )}
                </div>
              </div>
            )}
          </PhaseSection>
        )}

        {/* ── Phase 3: Approval ── */}
        {phase === "agents_complete" && enriched && agents.crm && agents.creative && agents.design && (
          <PhaseSection
            title="Lead Approval"
            phaseNumber={3}
            currentPhase={phase}
            thresholdPhase="agents_complete"
          >
            <ApprovalPanel
              enriched={enriched}
              agents={{
                crm: agents.crm,
                creative: agents.creative,
                design: agents.design,
                assets: agents.assets ?? fallbackAgents.assets,
              }}
              project={agents.project}
              onApprove={handleApprove}
            />
          </PhaseSection>
        )}

        {/* ── Phase 4: Website Build ── */}
        {phaseAtLeast("building") && phase !== "agents_complete" && (
          <PhaseSection
            title="Website Build"
            phaseNumber={4}
            currentPhase={phase}
            thresholdPhase="building"
            liveToggle={
              <PhaseToggle
                isLive={isLive(state, "build")}
                onToggle={() =>
                  dispatch({ type: "TOGGLE_PHASE_LIVE", payload: "build" })
                }
              />
            }
          >
            {phase === "building" && (
              <div className="flex items-center gap-3 text-white/60 py-6">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                <span className="text-sm">Generating website...</span>
              </div>
            )}
            {build && <SitePreview site={build} />}
          </PhaseSection>
        )}

        {/* ── Phase 5: Deployment ── */}
        {phase === "deployment_ready" && enriched && (
          <PhaseSection
            title="Deployment Ready"
            phaseNumber={5}
            currentPhase={phase}
            thresholdPhase="deployment_ready"
          >
            <DeploymentCards
              enriched={enriched}
              startTime={startTimeRef.current}
            />
          </PhaseSection>
        )}
      </main>
    </div>
  );
}
