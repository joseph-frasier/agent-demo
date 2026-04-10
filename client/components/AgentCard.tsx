"use client";

import { ReactNode, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type Status = "pending" | "processing" | "complete";

// ── Internal helpers ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  if (status === "complete") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
        <span>✓</span> Complete
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
        <span>◉</span> Processing...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/40">
      <span>○</span> Pending
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-white/40">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}

// ── AgentCard ────────────────────────────────────────────────────────────────

interface AgentCardProps {
  title: string;
  status: Status;
  children: ReactNode;
  note?: string;
}

export default function AgentCard({ title, status, children, note }: AgentCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-frasier-border bg-frasier-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-white">{title}</span>
          {note && <span className="text-xs text-white/40">{note}</span>}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-white/40 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-frasier-border px-5 py-4">{children}</div>
      )}
    </div>
  );
}

// ── CrmCardContent ───────────────────────────────────────────────────────────

interface CrmCardContentProps {
  data: {
    clientId: string;
    projectId: string;
    status: string;
    pipeline: string;
    dealValue: string;
    createdAt: string;
  };
}

export function CrmCardContent({ data }: CrmCardContentProps) {
  return (
    <div className="font-mono text-xs space-y-1">
      <Row label="Client ID" value={data.clientId} />
      <Row label="Project ID" value={data.projectId} />
      <Row label="Status" value={data.status} />
      <Row label="Pipeline" value={data.pipeline} />
      <Row label="Deal Value" value={data.dealValue} />
      <Row label="Created" value={data.createdAt} />
    </div>
  );
}

// ── CreativeCardContent ───────────────────────────────────────────────────────

interface CreativeCardContentProps {
  data: {
    brandVoice: { tone: string; personality: string };
    heroSection: { headline: string; subheadline: string; ctaText: string };
    colorRationale: string;
    pages: Array<{ name: string }>;
  };
}

export function CreativeCardContent({ data }: CreativeCardContentProps) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <span className="block text-xs font-medium text-white/40 mb-1">Brand Voice</span>
        <Row label="Tone" value={data.brandVoice.tone} />
        <Row label="Personality" value={data.brandVoice.personality} />
      </div>

      <div>
        <span className="block text-xs font-medium text-white/40 mb-1">Hero</span>
        <p className="text-white/90 italic">"{data.heroSection.headline}"</p>
        <p className="text-white/50 text-xs mt-0.5">{data.heroSection.subheadline}</p>
        <p className="text-white/60 text-xs mt-1">CTA: {data.heroSection.ctaText}</p>
      </div>

      <div>
        <span className="block text-xs font-medium text-white/40 mb-1">Pages</span>
        <p className="text-white/80">{data.pages.map((p) => p.name).join(", ")}</p>
      </div>

      <div>
        <span className="block text-xs font-medium text-white/40 mb-1">Color Rationale</span>
        <p className="text-white/70">{data.colorRationale}</p>
      </div>
    </div>
  );
}

// ── DesignCardContent ─────────────────────────────────────────────────────────

interface DesignCardContentProps {
  data: {
    colors: Array<{ role: string; hex: string; name: string; usage: string }>;
    typography: { headingFont: string; bodyFont: string };
  };
}

export function DesignCardContent({ data }: DesignCardContentProps) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <span className="block text-xs font-medium text-white/40 mb-2">Colors</span>
        <div className="space-y-2">
          {data.colors.map((color) => (
            <div key={color.role} className="flex items-center gap-3">
              <div
                className="h-6 w-6 rounded shrink-0 border border-white/10"
                style={{ backgroundColor: color.hex }}
              />
              <div className="min-w-0">
                <span className="font-medium text-white/90">{color.name}</span>
                <span className="ml-2 text-xs text-white/40">{color.hex}</span>
                <span className="ml-2 text-xs text-white/40 capitalize">{color.role}</span>
                <p className="text-xs text-white/50">{color.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-medium text-white/40 mb-1">Typography</span>
        <Row label="Headings" value={data.typography.headingFont} />
        <Row label="Body" value={data.typography.bodyFont} />
      </div>
    </div>
  );
}

// ── AssetCardContent ──────────────────────────────────────────────────────────

interface AssetCardContentProps {
  data: {
    logo: { filename: string; dimensions: string; size: string };
    generated: Array<{ filename: string; dimensions: string; purpose: string }>;
  };
}

export function AssetCardContent({ data }: AssetCardContentProps) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <span className="block text-xs font-medium text-white/40 mb-2">Logo</span>
        <div className="flex items-center gap-3">
          {/* SVG placeholder icon */}
          <svg
            className="h-8 w-8 shrink-0 text-white/20"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="4" fill="currentColor" />
            <path
              d="M8 24l5-8 4 6 3-4 4 6H8z"
              fill="white"
              fillOpacity="0.4"
            />
            <circle cx="21" cy="11" r="3" fill="white" fillOpacity="0.4" />
          </svg>
          <div>
            <p className="font-medium text-white/90">{data.logo.filename}</p>
            <p className="text-xs text-white/40">
              {data.logo.dimensions} · {data.logo.size}
            </p>
          </div>
        </div>
      </div>

      {data.generated.length > 0 && (
        <div>
          <span className="block text-xs font-medium text-white/40 mb-2">
            Generated Assets
          </span>
          <ul className="space-y-1">
            {data.generated.map((asset) => (
              <li key={asset.filename} className="flex items-start gap-2">
                <span className="mt-0.5 text-white/30">•</span>
                <div>
                  <span className="text-white/80">{asset.filename}</span>
                  <span className="ml-2 text-xs text-white/40">{asset.dimensions}</span>
                  <p className="text-xs text-white/50">{asset.purpose}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
