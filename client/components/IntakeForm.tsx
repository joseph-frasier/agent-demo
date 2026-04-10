"use client";

import { useState } from "react";
import { IntakeData } from "@/lib/types";

const DEFAULT_DATA: IntakeData = {
  businessName: "Lone Star Pet Grooming",
  ownerName: "Maria Santos",
  email: "maria@demo.irongrove.dev",
  phone: "(281) 555-0142",
  industry: "Pet services",
  services: "Dog grooming, cat grooming, nail trimming, flea treatment",
  brandColors: { primary: "#2D5F2D", secondary: "#F5E6D3" },
  tagline: "Where every pet leaves happy",
  tone: "Friendly, warm, trustworthy",
  pagesNeeded: ["Home", "Services", "About", "Contact"],
  desiredDomain: "lonestarpetgrooming.com",
  budgetTier: "Standard ($1,500)",
  logoUrl: "/demo-logo.svg",
  heroImageUrl: "/demo-hero.jpg",
};

const ALL_PAGES = ["Home", "Services", "About", "Contact", "Blog", "Gallery"];
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
}: {
  onSubmit: (data: IntakeData) => void;
}) {
  const [data, setData] = useState<IntakeData>(DEFAULT_DATA);

  function set<K extends keyof IntakeData>(key: K, value: IntakeData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function togglePage(page: string) {
    setData((prev) => ({
      ...prev,
      pagesNeeded: prev.pagesNeeded.includes(page)
        ? prev.pagesNeeded.filter((p) => p !== page)
        : [...prev.pagesNeeded, page],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

      {/* Pages Needed */}
      <Field label="Pages Needed">
        <div className="flex flex-wrap gap-2">
          {ALL_PAGES.map((page) => {
            const active = data.pagesNeeded.includes(page);
            return (
              <button
                key={page}
                type="button"
                onClick={() => togglePage(page)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? "bg-brand-green border-brand-green text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Domain */}
      <Field label="Desired Domain">
        <input
          className="input"
          value={data.desiredDomain}
          onChange={(e) => set("desiredDomain", e.target.value)}
        />
      </Field>

      {/* Assets — pre-staged placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Logo">
          <div className="input flex items-center gap-3 text-white/50 cursor-default select-none">
            <span className="text-lg">🖼</span>
            <span className="text-sm">{data.logoUrl} (pre-staged)</span>
          </div>
        </Field>
        <Field label="Hero Image">
          <div className="input flex items-center gap-3 text-white/50 cursor-default select-none">
            <span className="text-lg">🖼</span>
            <span className="text-sm">{data.heroImageUrl} (pre-staged)</span>
          </div>
        </Field>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 rounded-xl bg-brand-green text-white font-semibold text-sm tracking-wide hover:opacity-90 active:opacity-80 transition-opacity"
      >
        Submit Intake
      </button>
    </form>
  );
}
