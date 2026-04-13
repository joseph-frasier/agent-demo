"use client";

import { useState, useEffect } from "react";
import { IntakeData } from "@/lib/types";
import { DEMO_COMPANIES } from "@/lib/demo-companies";
import { getCachedPipeline } from "@/lib/cache";

const INCLUDED_PAGES = ["Home", "Services", "About", "Contact"] as const;
const BUDGET_TIERS = ["Starter ($750)", "Standard ($1,500)", "Premium ($3,000)"];

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl">
      {/* Demo client picker */}
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3 block">
          Choose a Demo Client
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {companies.map((company) => {
            const isSelected = company.businessName === data.businessName;
            return (
              <button
                key={company.businessName}
                type="button"
                onClick={() => setData(company)}
                className={`relative flex flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                  isSelected
                    ? "border-brand-accent bg-brand-accent/10"
                    : "border-brand-border bg-brand-card/40 hover:border-white/20 hover:bg-brand-card/70"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: company.brandColors.primary }}
                  />
                  <span
                    className="w-3 h-3 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: company.brandColors.secondary }}
                  />
                </div>
                <h3
                  className={`text-xs font-semibold leading-tight line-clamp-2 ${
                    isSelected ? "text-brand-accent" : "text-white"
                  }`}
                >
                  {company.businessName}
                </h3>
                <p className="text-[10px] text-white/50 line-clamp-1">
                  {company.industry}
                </p>
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 text-brand-accent text-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
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
          <select
            className="input"
            value={data.budgetTier}
            onChange={(e) => set("budgetTier", e.target.value)}
          >
            {BUDGET_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
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
        className="w-full py-3 rounded-xl bg-brand-accent text-brand-dark font-semibold text-sm tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
      >
        Submit Intake
      </button>
    </form>
  );
}
