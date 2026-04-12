"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { IntakeData, EnrichedData } from "@/lib/types";

// ── Word count utilities ──────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countInputWords(raw: IntakeData): number {
  return [
    raw.businessName,
    raw.ownerName,
    raw.industry,
    raw.services,
    raw.tagline,
    raw.tone,
    raw.desiredDomain,
  ].reduce((sum, s) => sum + countWords(s), 0);
}

function countOutputWords(enriched: EnrichedData): number {
  let total = 0;
  total += countWords(enriched.client.name);
  total += countWords(enriched.client.businessName);
  total += countWords(enriched.client.industry);
  total += countWords(enriched.client.industryCategory);
  total += countWords(enriched.client.location);
  total += countWords(enriched.brand.tagline);
  total += countWords(enriched.brand.voiceGuidelines);
  total += enriched.brand.tone.reduce((s, t) => s + countWords(t), 0);
  total += countWords(enriched.seo.metaDescription);
  total += enriched.seo.primaryKeywords.reduce((s, k) => s + countWords(k), 0);
  total += enriched.seo.secondaryKeywords.reduce(
    (s, k) => s + countWords(k),
    0
  );
  for (const svc of enriched.services) {
    total += countWords(svc.name);
    total += countWords(svc.description);
    total += svc.keywords.reduce((s, k) => s + countWords(k), 0);
  }
  total += countWords(enriched.businessDetails.yearsInBusiness);
  total += countWords(enriched.businessDetails.serviceArea);
  total += enriched.businessDetails.uniqueSellingPoints.reduce(
    (s, u) => s + countWords(u),
    0
  );
  return total;
}

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(mv, target, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = rounded.on("change", setDisplay);
    return () => {
      controls.stop();
      unsub();
    };
  }, [mv, rounded, target]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function DetailSection({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left transition-colors hover:bg-white/5 -mx-1 px-1 rounded"
      >
        <span className="text-sm font-medium text-white/90">{title}</span>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-brand-blue/15 px-2 py-0.5 text-[10px] font-medium text-brand-blue">
              {badge}
            </span>
          )}
          <span className="text-white/40 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden pb-4"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EnrichedPayloadProps {
  raw: IntakeData;
  enriched: EnrichedData;
}

export default function EnrichedPayload({
  raw,
  enriched,
}: EnrichedPayloadProps) {
  const wordsIn = countInputWords(raw);
  const wordsOut = countOutputWords(enriched);
  const expansion = wordsIn > 0 ? (wordsOut / wordsIn).toFixed(1) : "—";
  const allKeywords = [
    ...enriched.seo.primaryKeywords,
    ...enriched.seo.secondaryKeywords,
  ];

  return (
    <div className="animate-fade-in-up flex flex-col gap-6">
      {/* ── Stats hero ── */}
      <div className="rounded-xl bg-brand-card border border-brand-border p-6">
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/5">
            <span className="text-2xl font-bold text-white">
              <AnimatedCounter target={wordsIn} />
            </span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest">
              words in
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-brand-accent/10">
            <span className="text-2xl font-bold text-brand-accent">
              <AnimatedCounter target={wordsOut} />
            </span>
            <span className="text-[10px] text-brand-accent/70 uppercase tracking-widest">
              words out
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 py-3 rounded-lg bg-white/5">
            <span className="text-2xl font-bold text-white">
              <AnimatedCounter
                target={parseFloat(expansion as string) || 0}
                suffix="x"
              />
            </span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest">
              expansion
            </span>
          </div>
        </div>

        {/* Quick-glance summary pills */}
        <div className="flex flex-wrap gap-2 pb-2">
          <span className="rounded-full bg-brand-blue/15 px-3 py-1 text-xs font-medium text-brand-blue">
            {enriched.services.length} services
          </span>
          <span className="rounded-full bg-brand-blue/15 px-3 py-1 text-xs font-medium text-brand-blue">
            {allKeywords.length} SEO keywords
          </span>
          <span className="rounded-full bg-brand-blue/15 px-3 py-1 text-xs font-medium text-brand-blue">
            {enriched.businessDetails.uniqueSellingPoints.length} USPs
          </span>
          <span className="rounded-full bg-brand-blue/15 px-3 py-1 text-xs font-medium text-brand-blue">
            1 brand voice
          </span>
        </div>
      </div>

      {/* ── Detail sections ── */}
      <div className="rounded-xl bg-brand-card border border-brand-border px-5 py-1">
        <DetailSection
          title="Services"
          badge={`${enriched.services.length} identified`}
          defaultOpen
        >
          <div className="space-y-3">
            {enriched.services.map((svc) => (
              <div key={svc.name}>
                <h4 className="text-sm font-semibold text-white/90">
                  {svc.name}
                </h4>
                <p className="text-xs text-white/60 mt-0.5">{svc.description}</p>
                {svc.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {svc.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DetailSection>

        <DetailSection
          title="SEO Strategy"
          badge={`${allKeywords.length} keywords`}
        >
          <div className="space-y-3">
            <div>
              <span className="text-xs font-medium text-white/40 block mb-1">
                Meta Description
              </span>
              <p className="text-sm text-white/80 italic">
                "{enriched.seo.metaDescription}"
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-white/40 block mb-1.5">
                Primary Keywords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {enriched.seo.primaryKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-medium text-brand-accent"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            {enriched.seo.secondaryKeywords.length > 0 && (
              <div>
                <span className="text-xs font-medium text-white/40 block mb-1.5">
                  Secondary Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {enriched.seo.secondaryKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-brand-blue/15 px-2.5 py-0.5 text-xs font-medium text-brand-blue"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DetailSection>

        <DetailSection title="Brand & Voice">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {enriched.brand.tone.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {enriched.brand.voiceGuidelines}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-md border border-white/10"
                style={{
                  backgroundColor: enriched.brand.colors.primary.hex,
                }}
                title={enriched.brand.colors.primary.name}
              />
              <div
                className="w-6 h-6 rounded-md border border-white/10"
                style={{
                  backgroundColor: enriched.brand.colors.secondary.hex,
                }}
                title={enriched.brand.colors.secondary.name}
              />
              <span className="text-xs text-white/40">
                {enriched.brand.colors.primary.name} ·{" "}
                {enriched.brand.colors.secondary.name}
              </span>
            </div>
          </div>
        </DetailSection>

        <DetailSection
          title="Business Intelligence"
          badge={`${enriched.businessDetails.uniqueSellingPoints.length} USPs`}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-white/40">
                  Years in Business
                </span>
                <p className="text-sm text-white/80 mt-0.5">
                  {enriched.businessDetails.yearsInBusiness}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-white/40">
                  Service Area
                </span>
                <p className="text-sm text-white/80 mt-0.5">
                  {enriched.businessDetails.serviceArea}
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-white/40 block mb-1.5">
                Unique Selling Points
              </span>
              <ul className="space-y-1.5">
                {enriched.businessDetails.uniqueSellingPoints.map((usp) => (
                  <li
                    key={usp}
                    className="flex items-start gap-2 text-sm text-white/80"
                  >
                    <span className="text-brand-accent text-xs mt-0.5">●</span>
                    {usp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DetailSection>

        <DetailSection title="Original Input">
          <div className="space-y-2">
            {[
              { label: "Business", value: raw.businessName },
              { label: "Industry", value: raw.industry },
              { label: "Services", value: raw.services },
              { label: "Tagline", value: raw.tagline },
              { label: "Tone", value: raw.tone },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-xs font-medium text-white/40">
                  {label}
                </span>
                <p className="text-sm text-white/60 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </DetailSection>
      </div>
    </div>
  );
}
