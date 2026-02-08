"use client";

export function HealthBar({ ratio }: { ratio: number }) {
  const pct = Math.min(100, Math.max(0, ((ratio - 1) / 0.5) * 100)); // 1.0=0%, 1.5=100%
  const color = ratio >= 1.3 ? "#d4d4d4" : ratio >= 1.1 ? "#ffffff" : "#555555";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[6px] bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[12px] font-medium" style={{ color }}>
        {(ratio * 100).toFixed(0)}%
      </span>
    </div>
  );
}
