"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { IntakeData } from "@/lib/types";
import { DEMO_COMPANIES } from "@/lib/demo-companies";
import { getCachedPipeline } from "@/lib/cache";

const INCLUDED_PAGES = ["Home", "Services", "About", "Contact"] as const;
const BUDGET_TIERS = ["Starter ($750)", "Standard ($1,500)", "Premium ($3,000)"];

function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input flex items-center justify-between gap-2 cursor-pointer text-left"
      >
        <span>{value}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`shrink-0 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-brand-border bg-[#1C1C39] shadow-xl shadow-black/40 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                opt === value
                  ? "bg-brand-accent/15 text-brand-accent font-medium"
                  : "text-white/80 hover:bg-white/5"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white/70">{label}</label>
      {children}
    </div>
  );
}

export default function IntakeForm({
  onSubmit,
  isLive = true,
}: {
  onSubmit: (data: IntakeData) => void;
  isLive?: boolean;
}) {
  const companies = isLive
    ? DEMO_COMPANIES
    : DEMO_COMPANIES.filter((c) => getCachedPipeline(c.businessName));
  const [data, setData] = useState<IntakeData>(companies[0]);

  // Reset selection when the company list changes (live toggle flipped)
  useEffect(() => {
    if (!companies.find((c) => c.businessName === data.businessName)) {
      setData(companies[0]);
    }
  }, [isLive]); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof IntakeData>(key: K, value: IntakeData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(data);
  }

  // ── Scrollable picker fade state ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollFade, setScrollFade] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: true,
  });

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollFade({
      top: el.scrollTop > 8,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 8,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateFade();
    el.addEventListener("scroll", updateFade, { passive: true });
    return () => el.removeEventListener("scroll", updateFade);
  }, [updateFade, companies.length]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl">
      {/* Demo client picker — scrollable */}
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3 block">
          Choose a Demo Client
          <span className="ml-2 text-white/30 normal-case tracking-normal font-normal">
            {companies.length} available
          </span>
        </label>
        <div className="relative">
          {/* Top fade */}
          <div
            className={`pointer-events-none absolute top-0 left-0 right-0 h-6 z-10 bg-gradient-to-b from-brand-dark to-transparent rounded-t-xl transition-opacity duration-200 ${
              scrollFade.top ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Scrollable list */}
          <div
            ref={scrollRef}
            className="max-h-[220px] overflow-y-auto overscroll-contain rounded-xl border border-brand-border scrollbar-thin"
          >
            <div className="flex flex-col gap-0.5 p-1">
              {companies.map((company) => {
                const isSelected = company.businessName === data.businessName;
                return (
                  <button
                    key={company.businessName}
                    type="button"
                    onClick={() => setData(company)}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-accent/10 ring-1 ring-brand-accent/40"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full ring-1 ring-white/10"
                        style={{ backgroundColor: company.brandColors.primary }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full ring-1 ring-white/10 -ml-1"
                        style={{ backgroundColor: company.brandColors.secondary }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-sm font-semibold leading-tight truncate ${
                          isSelected ? "text-brand-accent" : "text-white"
                        }`}
                      >
                        {company.businessName}
                      </h3>
                      <p className="text-xs text-white/40 truncate">
                        {company.industry}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 text-brand-accent text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Bottom fade */}
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10 bg-gradient-to-t from-brand-dark to-transparent rounded-b-xl transition-opacity duration-200 ${
              scrollFade.bottom ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </div>

      <div className="border-t border-brand-border" />
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business Name">
          <input
            className="input"
            value={data.businessName}
            onChange={(e) => set("businessName", e.target.value)}
          />
        </Field>
        <Field label="Owner Name">
          <input
            className="input"
            value={data.ownerName}
            onChange={(e) => set("ownerName", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            className="input"
            type="email"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <input
            className="input"
            value={data.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Industry">
          <input
            className="input"
            value={data.industry}
            onChange={(e) => set("industry", e.target.value)}
          />
        </Field>
        <Field label="Budget Tier">
          <CustomSelect
            value={data.budgetTier}
            options={BUDGET_TIERS}
            onChange={(v) => set("budgetTier", v)}
          />
        </Field>
      </div>

      {/* Services */}
      <Field label="Services">
        <textarea
          className="input resize-none"
          rows={3}
          value={data.services}
          onChange={(e) => set("services", e.target.value)}
        />
      </Field>

      {/* Brand */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tagline">
          <input
            className="input"
            value={data.tagline}
            onChange={(e) => set("tagline", e.target.value)}
          />
        </Field>
        <Field label="Tone">
          <input
            className="input"
            value={data.tone}
            onChange={(e) => set("tone", e.target.value)}
          />
        </Field>
        <Field label="Primary Brand Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={data.brandColors.primary}
              onChange={(e) =>
                set("brandColors", {
                  ...data.brandColors,
                  primary: e.target.value,
                })
              }
              className="h-10 w-12 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <input
              className="input"
              value={data.brandColors.primary}
              onChange={(e) =>
                set("brandColors", {
                  ...data.brandColors,
                  primary: e.target.value,
                })
              }
            />
          </div>
        </Field>
        <Field label="Secondary Brand Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={data.brandColors.secondary}
              onChange={(e) =>
                set("brandColors", {
                  ...data.brandColors,
                  secondary: e.target.value,
                })
              }
              className="h-10 w-12 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <input
              className="input"
              value={data.brandColors.secondary}
              onChange={(e) =>
                set("brandColors", {
                  ...data.brandColors,
                  secondary: e.target.value,
                })
              }
            />
          </div>
        </Field>
      </div>

      {/* Pages Included — read-only, the pipeline always generates these four */}
      <Field label="Pages Included">
        <div className="flex flex-wrap gap-2">
          {INCLUDED_PAGES.map((page) => (
            <div
              key={page}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-brand-accent/10 border border-brand-accent/30 text-brand-accent/90"
            >
              <span className="text-xs">✓</span>
              <span>{page}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/40">
          Every site generated by Irongrove includes these four core pages.
        </p>
      </Field>

      {/* Domain */}
      <Field label="Desired Domain">
        <input
          className="input"
          value={data.desiredDomain}
          onChange={(e) => set("desiredDomain", e.target.value)}
        />
      </Field>

      {/* Design Style */}
      <Field label="Design Style">
        <div className="flex gap-2">
          {(
            [
              {
                value: "standard",
                label: "Clean & Professional",
                desc: "Straightforward, appropriate to the brand",
              },
              {
                value: "bold",
                label: "Bold & Expressive",
                desc: "Dramatic layouts, gradients, more motion",
              },
            ] as const
          ).map(({ value, label, desc }) => {
            const active = data.designStyle === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => set("designStyle", value)}
                className={`flex-1 flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                  active
                    ? "border-brand-accent bg-brand-accent/10"
                    : "border-brand-border bg-brand-card/40 hover:border-white/20"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    active ? "text-brand-accent" : "text-white"
                  }`}
                >
                  {label}
                </span>
                <span className="text-[10px] text-white/50">{desc}</span>
              </button>
            );
          })}
        </div>
      </Field>

      {/* Logo — read-only, shows the selected company's logo */}
      <Field label="Logo">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 cursor-default select-none max-w-sm">
          <div className="w-24 h-12 rounded-md overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
            <img
              src={data.logoUrl}
              alt={`${data.businessName} logo`}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-white/70 truncate flex-1 font-mono text-xs">
            {data.logoUrl.split("/").pop()}
          </span>
        </div>
      </Field>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 min-h-[48px] rounded-xl bg-brand-accent text-brand-dark font-semibold text-sm tracking-wide hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
      >
        Submit Intake
      </button>
    </form>
  );
}
