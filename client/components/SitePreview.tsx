"use client";

import { useState } from "react";
import { GeneratedSite } from "@/lib/types";

export default function SitePreview({ site }: { site: GeneratedSite }) {
  const [activePage, setActivePage] = useState(0);

  const currentPage = site.pages[activePage];
  const isFallback = site.sessionId === "fallback";
  const iframeUrl = `http://localhost:3001/generated/${site.sessionId}/${currentPage?.filename}`;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Toolbar */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-green inline-block" />
          <span className="text-white font-semibold text-sm">Preview: Generated Website</span>
        </div>
        {!isFallback && currentPage && (
          <a
            href={iframeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-green text-sm hover:underline"
          >
            Open in new tab ↗
          </a>
        )}
      </div>

      {/* Page navigation */}
      {site.pages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {site.pages.map((page, index) => (
            <button
              key={page.filename}
              onClick={() => setActivePage(index)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                index === activePage
                  ? "bg-brand-green text-black border-brand-green"
                  : "bg-brand-card border-brand-border text-white/70 hover:text-white"
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}

      {/* Iframe / Fallback */}
      {isFallback ? (
        <div className="bg-brand-card border border-brand-border rounded-xl flex items-center justify-center h-[600px]">
          <p className="text-white/50 text-sm">Website preview not available in cached mode</p>
        </div>
      ) : (
        <iframe
          src={iframeUrl}
          title={currentPage?.name ?? "Preview"}
          className="w-full rounded-xl border border-brand-border bg-white"
          style={{ height: "600px" }}
        />
      )}

      {/* Metadata */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-wrap gap-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-white/40 text-xs uppercase tracking-widest">Pages</span>
          <span className="text-white text-sm font-medium">{site.metadata.pageCount}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white/40 text-xs uppercase tracking-widest">Framework</span>
          <span className="text-white text-sm font-medium">{site.metadata.framework}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white/40 text-xs uppercase tracking-widest">Generated</span>
          <span className="text-white text-sm font-medium">
            {new Date(site.metadata.generatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
