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
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive ? "bg-green-400" : "bg-amber-400"
        }`}
      />
      {isLive ? "Live" : "Cached"}
    </button>
  );
}
