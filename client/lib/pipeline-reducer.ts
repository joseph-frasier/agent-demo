import type { PipelineState, PipelineAction } from "./types";

export const initialState: PipelineState = {
  phase: "intake",
  intake: null,
  enriched: null,
  agents: {
    crm: null,
    creative: null,
    design: null,
    project: null,
    assets: null,
  },
  build: null,
  error: null,
  settings: {
    masterLive: true,
    phaseLive: {},
  },
};

export function pipelineReducer(
  state: PipelineState,
  action: PipelineAction
): PipelineState {
  switch (action.type) {
    case "SUBMIT_INTAKE":
      return { ...state, phase: "enriching", intake: action.payload, error: null };

    case "SET_ENRICHED":
      return { ...state, phase: "enriched", enriched: action.payload };

    case "SET_AGENTS":
      return {
        ...state,
        phase: "agents_complete",
        agents: {
          ...state.agents,
          crm: action.payload.crm,
          creative: action.payload.creative,
          design: action.payload.design,
          assets: action.payload.assets,
        },
      };

    case "SET_PROJECT":
      return {
        ...state,
        agents: { ...state.agents, project: action.payload },
      };

    case "APPROVE":
      return { ...state, phase: "building", error: null };

    case "SET_BUILD":
      return { ...state, phase: "build_complete", build: action.payload };

    case "SET_DEPLOYMENT_READY":
      return { ...state, phase: "deployment_ready" };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_PHASE":
      return { ...state, phase: action.payload };

    case "TOGGLE_MASTER_LIVE":
      return {
        ...state,
        settings: {
          ...state.settings,
          masterLive: !state.settings.masterLive,
        },
      };

    case "TOGGLE_PHASE_LIVE": {
      const phaseKey = action.payload;
      const current = state.settings.phaseLive[phaseKey] ?? state.settings.masterLive;
      return {
        ...state,
        settings: {
          ...state.settings,
          phaseLive: { ...state.settings.phaseLive, [phaseKey]: !current },
        },
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function isLive(state: PipelineState, phaseKey: string): boolean {
  return state.settings.phaseLive[phaseKey] ?? state.settings.masterLive;
}
