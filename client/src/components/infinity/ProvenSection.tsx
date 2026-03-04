"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ProvenSection = () => {
  const [solAmount, setSolAmount] = useState("100");

  return (
    <section className="w-full py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-sm font-semibold text-emerald-400">Proven</span>
        <h2 className="text-3xl font-semibold text-foreground">
          Compare real, historic yields.
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Past returns show that INF is more than just liquid staking. It&apos;s a
          strategy that earns trading fees on top of staking rewards from
          highest-yielding LSTs.
        </p>
      </div>

      {/* Comparison pills */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-green-400 to-blue-500" />
          <div className="text-xs">
            <span className="font-medium text-foreground">Infinity</span>
            <span className="ml-1.5 text-muted-foreground">Last Epoch&apos;s APY</span>
            <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">6.33%</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
          <div className="h-5 w-5 rounded-full bg-green-500" />
          <div className="text-xs">
            <span className="font-medium text-foreground">JitoSOL</span>
            <span className="ml-1.5 text-muted-foreground">Last Epoch&apos;s APY</span>
            <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">5.82%</span>
          </div>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Calculator row */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Staking</span>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5">
          <span className="text-foreground font-medium">◆</span>
          <input
            type="number"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            className="w-12 bg-transparent text-foreground font-medium outline-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <span>with INF in the last year would have</span>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        earned you an extra{" "}
        <span className="font-semibold text-foreground">1.67 SOL</span>{" "}
        <span className="font-semibold text-foreground">($149.65)</span>
      </p>

      {/* Chart area */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground"><span className="font-medium text-foreground">INF</span> 107.98 SOL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span className="text-muted-foreground"><span className="font-medium text-foreground">JitoSOL</span> 106.30 SOL</span>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="relative h-48 w-full overflow-hidden rounded-xl">
          <svg viewBox="0 0 600 200" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="infGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* INF line area */}
            <path
              d="M0,180 C50,175 100,170 150,155 C200,140 250,120 300,105 C350,90 400,70 450,55 C500,40 550,30 600,20 L600,200 L0,200 Z"
              fill="url(#infGrad)"
            />
            {/* INF line */}
            <path
              d="M0,180 C50,175 100,170 150,155 C200,140 250,120 300,105 C350,90 400,70 450,55 C500,40 550,30 600,20"
              fill="none"
              stroke="rgb(52, 211, 153)"
              strokeWidth="2"
            />
            {/* JitoSOL line */}
            <path
              d="M0,185 C50,180 100,176 150,165 C200,154 250,138 300,125 C350,112 400,95 450,80 C500,68 550,55 600,45"
              fill="none"
              stroke="rgb(96, 165, 250)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default ProvenSection;
