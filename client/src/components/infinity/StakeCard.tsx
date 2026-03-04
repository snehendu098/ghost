"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

const StakeCard = () => {
  const [amount, setAmount] = useState("");

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 space-y-5">
      {/* Header */}
      <h3 className="text-base font-semibold text-foreground">Stake to INF</h3>

      {/* Input */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">You&apos;re staking</p>
        <div className="flex items-center rounded-xl border border-border bg-background overflow-hidden">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="flex-1 min-w-0 bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground outline-none px-4 py-3 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-foreground cursor-pointer mr-3">
            <span className="h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0" />
            SOL
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">$0</p>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-sm">
        <div className="space-y-0.5">
          <p className="text-lg font-semibold text-emerald-400">6.33%</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            APY <Info className="h-3 w-3" />
          </div>
        </div>
        <div className="space-y-0.5 text-center">
          <p className="text-lg font-semibold text-foreground">–</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            Est. SOL per yr <Info className="h-3 w-3" />
          </div>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-lg font-semibold text-foreground">–</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            Est. $ per yr <Info className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <button className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors cursor-pointer">
        Connect Wallet
      </button>

      {/* Conversion */}
      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" />
          <span>1 SOL ≈ 0.711800229 INF</span>
        </div>
        <span className="text-emerald-400 font-medium cursor-pointer hover:underline">Learn why</span>
      </div>
    </div>
  );
};

export default StakeCard;
