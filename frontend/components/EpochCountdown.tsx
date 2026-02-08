"use client";

import { useState, useEffect } from "react";

export function EpochCountdown({ epochNumber, endsIn }: { epochNumber: number; endsIn: number }) {
  const [remaining, setRemaining] = useState(endsIn);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[#666]">Epoch #{epochNumber}</span>
      <span className="text-[12px] font-mono text-white">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}
