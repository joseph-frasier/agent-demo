"use client";

import { useReducer, useRef } from "react";
import { motion } from "framer-motion";
import { pipelineReducer, initialState, isLive } from "@/lib/pipeline-reducer";
import {
  fetchEnrich,
  fetchAgentCrm,
  fetchAgentCreative,
  fetchAgentDesign,
  fetchAgentAssets,
  fetchBuildStream,
  fetchProjectKit,
} from "@/lib/api";
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
  id: string;
  title: string;
  phaseNumber: number;
  currentPhase: PhaseStatus;
  thresholdPhase: PhaseStatus;
  liveToggle?: React.ReactNode;
  children: React.ReactNode;
}

function PhaseSection({
  id,
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
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-12 scroll-mt-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
            status === "complete"
              ? "bg-brand-accent/15 text-brand-accent"
              : status === "active"
                ? "bg-brand-blue/15 text-brand-blue"
                : "bg-white/10 text-white/40"
          }`}
        >
          {status === "complete" ? "✓" : phaseNumber}
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {liveToggle && <div className="ml-auto">{liveToggle}</div>}
      </div>
      {children}
    </motion.section>
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

      // Phase 2b: Agents — fan out four calls, dispatch each as it settles
      dispatch({ type: "SET_PHASE", payload: "processing_agents" });

      if (isLive(state, "agents")) {
        const crmP = fetchAgentCrm(enriched).then((r) =>
          dispatch({ type: "SET_AGENT_RESULT", payload: { agent: "crm", data: r.crm } })
        );
        const creativeP = fetchAgentCreative(enriched).then((r) =>
          dispatch({
            type: "SET_AGENT_RESULT",
            payload: { agent: "creative", data: r.creative },
          })
        );
        const designP = fetchAgentDesign(enriched).then((r) =>
          dispatch({
            type: "SET_AGENT_RESULT",
            payload: { agent: "design", data: r.design },
          })
        );
        const assetsP = fetchAgentAssets(enriched).then((r) =>
          dispatch({
            type: "SET_AGENT_RESULT",
            payload: { agent: "assets", data: r.assets },
          })
        );
        await Promise.all([crmP, creativeP, designP, assetsP]);
      } else {
        dispatch({
          type: "SET_AGENT_RESULT",
          payload: { agent: "crm", data: fallbackAgents.crm },
        });
        dispatch({
          type: "SET_AGENT_RESULT",
          payload: { agent: "creative", data: fallbackAgents.creative },
        });
        dispatch({
          type: "SET_AGENT_RESULT",
          payload: { agent: "design", data: fallbackAgents.design },
        });
        dispatch({
          type: "SET_AGENT_RESULT",
          payload: { agent: "assets", data: fallbackAgents.assets },
        });
      }
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "An error occurred",
      });
      dispatch({ type: "SET_PHASE", payload: "intake" });
    }
  }

  async function handleApprove() {
    if (!state.enriched || !state.agents.creative || !state.agents.design)
      return;

    dispatch({ type: "APPROVE" });

    try {
      let site;
      if (isLive(state, "build")) {
        site = await fetchBuildStream(
          {
            enriched: state.enriched,
            creative: state.agents.creative,
            design: state.agents.design,
            logoUrl: state.intake?.logoUrl,
            designStyle: state.intake?.designStyle,
          },
          {
            onPageComplete: ({ name }) => {
              dispatch({
                type: "BUILD_PAGE_COMPLETE",
                payload: { name },
              });
            },
          }
        );
      } else {
        // Cached path: fake the per-page progress so the sub-cluster still
        // animates through its states. Each page "completes" 250ms apart.
        site = fallbackBuild;
        const fakeNames = ["Home", "Services", "About", "Contact"];
        for (let i = 0; i < fakeNames.length; i++) {
          await new Promise((r) => setTimeout(r, 250));
          dispatch({
            type: "BUILD_PAGE_COMPLETE",
            payload: { name: fakeNames[i] },
          });
        }
      }
      dispatch({ type: "SET_BUILD", payload: site });

      setTimeout(() => {
        dispatch({ type: "SET_DEPLOYMENT_READY" });
      }, 1000);
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Build failed",
      });
      dispatch({ type: "SET_PHASE", payload: "agents_complete" });
    }
  }

  async function handleCreateProject() {
    if (!state.enriched || !state.agents.creative) return;

    try {
      const project = isLive(state, "project")
        ? await fetchProjectKit({
            enriched: state.enriched,
            creative: state.agents.creative,
            design: state.agents.design,
          })
        : fallbackProject;
      dispatch({ type: "SET_PROJECT", payload: project });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error ? err.message : "Project kit download failed",
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
      <aside className="w-72 shrink-0 border-r border-brand-border flex flex-col gap-8 p-6 sticky top-0 h-screen self-start">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/irongrove-logo.png"
            alt="Irongrove"
            className="h-20 w-auto"
          />
          <p className="text-xs text-white/60 uppercase tracking-widest">
            Agent Pipeline Demo
          </p>
        </div>

        <PipelineStepper
          currentPhase={phase}
          agents={agents}
          buildProgress={state.buildProgress}
        />

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
      <main className="flex-1 min-w-0 p-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-3">
            <span className="text-sm text-brand-error">{error}</span>
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="ml-4 rounded-lg border border-brand-error/30 px-3 py-1 text-xs font-medium text-brand-error hover:bg-brand-error/20 transition-colors"
            >
              Reset
            </button>
          </div>
        )}

        {/* ── Phase 1: Client Intake ── */}
        <PhaseSection
          id="section-intake"
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
            id="section-agents"
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

            {/* Claude Project card — only after creative agent finishes since the kit needs its output */}
            {agents.creative && (
              <div className="rounded-xl border border-brand-border bg-brand-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">Claude Project Kit</h3>
                    {agents.project ? (
                      <p className="mt-1 text-xs text-white/50 font-mono truncate">
                        {agents.project.filename}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-white/50">
                        Download a ready-to-import bundle for claude.ai Projects
                      </p>
                    )}
                  </div>
                  {!agents.project && (
                    <button
                      onClick={handleCreateProject}
                      className="shrink-0 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-dark hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Download Kit
                    </button>
                  )}
                  {agents.project && (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-brand-accent/15 px-3 py-1 text-xs font-semibold text-brand-accent">
                        Downloaded ✓
                      </span>
                      <button
                        onClick={handleCreateProject}
                        className="rounded-lg border border-brand-border px-3 py-1 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Re-download
                      </button>
                    </div>
                  )}
                </div>
                {agents.project && (
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-widest">
                      Next Steps
                    </p>
                    <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside">
                      <li>
                        Open{" "}
                        <a
                          href="https://claude.ai/projects"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-blue hover:underline"
                        >
                          claude.ai/projects
                        </a>{" "}
                        and create a new project
                      </li>
                      <li>Paste <code className="font-mono text-brand-blue">system-prompt.md</code> into Project instructions</li>
                      <li>Upload files from <code className="font-mono text-brand-blue">knowledge/</code> as project knowledge</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </PhaseSection>
        )}

        {/* ── Phase 3: Approval ── */}
        {phaseAtLeast("agents_complete") && enriched && agents.crm && agents.creative && agents.design && (
          <PhaseSection
            id="section-approval"
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
              approved={PHASE_ORDER[phase] > PHASE_ORDER["agents_complete"]}
            />
          </PhaseSection>
        )}

        {/* ── Phase 4: Website Build ── */}
        {phaseAtLeast("building") && (
          <PhaseSection
            id="section-build"
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
            id="section-deployment"
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
