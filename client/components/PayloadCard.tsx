"use client";

import { IntakeData } from "@/lib/types";

export default function PayloadCard({ data }: { data: IntakeData }) {
  const rows: { label: string; value: string }[] = [
    { label: "Client", value: data.ownerName },
    { label: "Business", value: data.businessName },
    { label: "Industry", value: data.industry },
    { label: "Tier", value: data.budgetTier },
    { label: "Domain", value: data.desiredDomain },
    { label: "Phone", value: data.phone },
  ];

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-6 animate-fade-in-up flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-brand-green font-bold text-lg">✓</span>
        <h2 className="text-white font-semibold text-lg">Parsed Intake Payload</h2>
      </div>

      {/* Key-value grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-white/50 text-sm">{label}</span>
            <span className="text-white text-sm font-medium text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Brand */}
      <div className="flex flex-col gap-2">
        <span className="text-white/50 text-xs uppercase tracking-widest">Brand</span>
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-md border border-white/10 flex-shrink-0"
            style={{ backgroundColor: data.brandColors.primary }}
            title={`Primary: ${data.brandColors.primary}`}
          />
          <div
            className="w-7 h-7 rounded-md border border-white/10 flex-shrink-0"
            style={{ backgroundColor: data.brandColors.secondary }}
            title={`Secondary: ${data.brandColors.secondary}`}
          />
          <span className="text-white/40 text-sm">
            {data.brandColors.primary} · {data.brandColors.secondary}
          </span>
        </div>
        <p className="text-white/80 text-sm italic">"{data.tagline}"</p>
        <p className="text-white/50 text-sm">Tone: {data.tone}</p>
      </div>

      {/* Pages */}
      <div className="flex flex-col gap-1">
        <span className="text-white/50 text-xs uppercase tracking-widest">Pages</span>
        <p className="text-white text-sm">{data.pagesNeeded.join(" · ")}</p>
      </div>

      {/* Assets */}
      <div className="flex flex-col gap-1">
        <span className="text-white/50 text-xs uppercase tracking-widest">Assets</span>
        <p className="text-white/70 text-sm">logo.svg (24KB) · hero.jpg (1.2MB)</p>
      </div>

      {/* Validation */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <span className="text-brand-green text-sm font-semibold">✓ Validation passed</span>
      </div>
    </div>
  );
}
