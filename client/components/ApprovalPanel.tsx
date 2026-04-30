"use client";

import { useState } from "react";
import type { EnrichedData, AgentsResult, ProjectResult } from "@/lib/types";

interface ApprovalPanelProps {
  enriched: EnrichedData;
  agents: AgentsResult;
  project: ProjectResult | null;
  onApprove: () => void;
  approved?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border border-brand-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-card hover:bg-white/5 transition-colors duration-200 text-left"
      >
        <span className="text-sm font-semibold text-white/90">{title}</span>
        <span className="text-white/50 text-xs font-mono">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-3 bg-brand-card border-t border-brand-border">
          {children}
        </div>
      )}
    </div>
  );
}

export function ApprovalPanel({
  enriched,
  agents,
  project,
  onApprove,
  approved = false,
}: ApprovalPanelProps) {
  const [openSection, setOpenSection] = useState<string | null>("brief");

  const toggle = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const { creative, design, crm } = agents;

  // Derive domain from business name
  const derivedDomain =
    enriched.client.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) + ".com";

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-6 animate-fade-in-up space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">
          {enriched.client.businessName}
        </h2>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/50">
          <span>Pipeline: {crm.pipeline}</span>
          <span>·</span>
          <span>Deal: {crm.dealValue}</span>
          <span>·</span>
          <span>Status: {crm.status}</span>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-2">
        {/* Creative Brief */}
        <CollapsibleSection
          title="Creative Brief"
          isOpen={openSection === "brief"}
          onToggle={() => toggle("brief")}
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                Voice & Tone
              </p>
              <p className="text-sm text-white/80">
                {creative.brandVoice.tone}
                {creative.brandVoice.personality
                  ? ` · ${creative.brandVoice.personality}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                Hero Headline
              </p>
              <p className="text-sm font-semibold text-white">
                {creative.heroSection.headline}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {creative.heroSection.subheadline}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                Pages
              </p>
              <ul className="space-y-0.5">
                {creative.pages.map((page) => (
                  <li key={page.name} className="text-sm text-white/70">
                    · {page.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        {/* Brand Assets */}
        <CollapsibleSection
          title="Brand Assets"
          isOpen={openSection === "assets"}
          onToggle={() => toggle("assets")}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                Color Palette
              </p>
              <div className="flex flex-wrap gap-3">
                {design.colors.map((color) => (
                  <div key={color.hex} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-md border border-white/10 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                    <div>
                      <p className="text-xs font-medium text-white/80">
                        {color.name}
                      </p>
                      <p className="text-xs text-white/40">{color.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                Typography
              </p>
              <div className="text-sm text-white/70 space-y-0.5">
                <p>
                  Heading:{" "}
                  <span className="text-white/90 font-medium">
                    {design.typography.headingFont}
                  </span>{" "}
                  ({design.typography.headingWeight})
                </p>
                <p>
                  Body:{" "}
                  <span className="text-white/90 font-medium">
                    {design.typography.bodyFont}
                  </span>{" "}
                  ({design.typography.bodyWeight})
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Domain */}
        <CollapsibleSection
          title="Domain"
          isOpen={openSection === "domain"}
          onToggle={() => toggle("domain")}
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono text-white font-semibold">
                {derivedDomain}
              </span>
              <span className="text-brand-accent text-xs font-semibold">
                ✓ Available
              </span>
            </div>
            <div className="text-white/50 space-y-0.5">
              <p>
                Registrar:{" "}
                <span className="text-white/70">Javelina (OpenSRS)</span>
              </p>
              <p>
                Nameservers:{" "}
                <span className="font-mono text-white/70">
                  ns1.javelina.host, ns2.javelina.host
                </span>
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Claude Project (conditional) */}
        {project && (
          <CollapsibleSection
            title="Claude Project Kit"
            isOpen={openSection === "claude"}
            onToggle={() => toggle("claude")}
          >
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Downloaded file
                </p>
                <p className="font-mono text-white/80 text-xs break-all">
                  {project.filename}
                </p>
              </div>
              <p className="text-xs text-white/50">
                Import into{" "}
                <a
                  href="https://claude.ai/projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  claude.ai/projects
                </a>
                .
              </p>
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onApprove}
          disabled={approved}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-brand-accent hover:opacity-90 text-brand-dark text-sm font-semibold rounded-lg transition-opacity duration-200 disabled:opacity-60 disabled:cursor-default disabled:hover:opacity-60 cursor-pointer"
        >
          <span>✓</span>
          <span>{approved ? "Approved" : "Approve & Build"}</span>
        </button>
        <button
          onClick={() => {}}
          disabled={approved}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-transparent border border-brand-border hover:bg-white/5 text-white/70 hover:text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-white/70 cursor-pointer"
        >
          <span>✎</span>
          <span>Request Revisions</span>
        </button>
      </div>
    </div>
  );
}
