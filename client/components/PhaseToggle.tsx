"use client";

export function PhaseToggle({
  isLive,
  onToggle,
}: {
  isLive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        isLive
          ? "bg-brand-blue/15 text-brand-blue border border-brand-blue/30"
          : "bg-white/5 text-white/50 border border-white/15"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive ? "bg-brand-blue animate-pulse-dot" : "bg-white/40"
        }`}
      />
      {isLive ? "Live" : "Cached"}
    </button>
  );
}
