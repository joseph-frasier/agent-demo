// === Intake (Phase 1) ===

export type IntakeData = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  industry: string;
  services: string;
  brandColors: { primary: string; secondary: string };
  tagline: string;
  tone: string;
  pagesNeeded: string[];
  desiredDomain: string;
  budgetTier: string;
  logoUrl: string;
  heroImageUrl: string;
};

// === Enrichment (Phase 2, Stage 1) ===

export type EnrichedData = {
  client: {
    name: string;
    businessName: string;
    email: string;
    phone: string;
    industry: string;
    industryCategory: string;
    location: string;
  };
  brand: {
    tagline: string;
    tone: string[];
    voiceGuidelines: string;
    colors: {
      primary: { hex: string; name: string };
      secondary: { hex: string; name: string };
    };
  };
  services: Array<{
    name: string;
    description: string;
    keywords: string[];
  }>;
  seo: {
    primaryKeywords: string[];
    secondaryKeywords: string[];
    metaDescription: string;
  };
  businessDetails: {
    yearsInBusiness: string;
    serviceArea: string;
    uniqueSellingPoints: string[];
  };
};

// === Agent Results (Phase 2, Stage 2) ===

export type CrmRecord = {
  clientId: string;
  projectId: string;
  status: string;
  pipeline: string;
  dealValue: string;
  createdAt: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    businessName: string;
  };
};

export type CreativeBrief = {
  brandVoice: {
    tone: string;
    personality: string;
    languageGuidelines: string[];
  };
  heroSection: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  pages: Array<{
    name: string;
    sections: Array<{
      type: string;
      heading: string;
      content: string;
    }>;
    metaTitle: string;
    metaDescription: string;
  }>;
  seoStrategy: {
    primaryKeywords: string[];
    contentThemes: string[];
  };
  colorRationale: string;
};

export type DesignTokens = {
  colors: Array<{
    role: string;
    hex: string;
    name: string;
    usage: string;
  }>;
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: string;
    bodyWeight: string;
  };
  layout: {
    maxWidth: string;
    sections: Array<{
      name: string;
      type: string;
      columns?: number;
    }>;
  };
  spacing: {
    sectionPadding: string;
    componentGap: string;
  };
};

export type AssetManifest = {
  logo: { filename: string; dimensions: string; size: string };
  generated: Array<{
    filename: string;
    dimensions: string;
    purpose: string;
  }>;
};

export type ProjectResult = {
  filename: string;
  downloadedAt: string;
};

export type AgentsResult = {
  crm: CrmRecord;
  creative: CreativeBrief;
  design: DesignTokens;
  assets: AssetManifest;
};

// === Build (Phase 4) ===

export type GeneratedPage = {
  name: string;
  filename: string;
  html: string;
};

export type GeneratedSite = {
  sessionId: string;
  pages: GeneratedPage[];
  metadata: {
    framework: string;
    styling: string;
    pageCount: number;
    generatedAt: string;
  };
};

// === Pipeline State ===

export type PhaseStatus =
  | "intake"
  | "enriching"
  | "enriched"
  | "processing_agents"
  | "agents_complete"
  | "approval"
  | "building"
  | "build_complete"
  | "deployment_ready";

export type PipelineState = {
  phase: PhaseStatus;
  intake: IntakeData | null;
  enriched: EnrichedData | null;
  agents: {
    crm: CrmRecord | null;
    creative: CreativeBrief | null;
    design: DesignTokens | null;
    project: ProjectResult | null;
    assets: AssetManifest | null;
  };
  build: GeneratedSite | null;
  error: string | null;
  settings: {
    masterLive: boolean;
    phaseLive: Record<string, boolean>;
  };
};

export type PipelineAction =
  | { type: "SUBMIT_INTAKE"; payload: IntakeData }
  | { type: "SET_ENRICHED"; payload: EnrichedData }
  | { type: "SET_AGENTS"; payload: AgentsResult }
  | {
      type: "SET_AGENT_RESULT";
      payload:
        | { agent: "crm"; data: CrmRecord }
        | { agent: "creative"; data: CreativeBrief }
        | { agent: "design"; data: DesignTokens }
        | { agent: "assets"; data: AssetManifest };
    }
  | { type: "SET_PROJECT"; payload: ProjectResult }
  | { type: "APPROVE" }
  | { type: "SET_BUILD"; payload: GeneratedSite }
  | { type: "SET_DEPLOYMENT_READY" }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_PHASE"; payload: PhaseStatus }
  | { type: "TOGGLE_MASTER_LIVE" }
  | { type: "TOGGLE_PHASE_LIVE"; payload: string }
  | { type: "RESET" };
