"use client";

import type { Tranche } from "@/lib/ghost-data";

export function TrancheToggle({
  selected,
  onChange,
  seniorRate,
  juniorRate,
}: {
  selected: Tranche;
  onChange: (t: Tranche) => void;
  seniorRate: number;
  juniorRate: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onChange("senior")}
        className={`py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
          selected === "senior"
            ? "bg-white text-[#111]"
            : "bg-[#050505] text-[#555] border border-[#1a1a1a]"
        }`}
      >
        Senior <span className="text-[11px] opacity-70">{seniorRate.toFixed(1)}%</span>
      </button>
      <button
        onClick={() => onChange("junior")}
        className={`py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
          selected === "junior"
            ? "bg-[#888888] text-[#111]"
            : "bg-[#050505] text-[#555] border border-[#1a1a1a]"
        }`}
      >
        Junior <span className="text-[11px] opacity-70">{juniorRate.toFixed(1)}%</span>
      </button>
    </div>
  );
}
