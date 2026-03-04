"use client";

import { CircleDot } from "lucide-react";

const methods = ["Direct deposit", "Via Jupiter"];

interface StakeMethodSelectorProps {
  activeMethod: string;
  onMethodChange: (method: string) => void;
}

const StakeMethodSelector = ({
  activeMethod,
  onMethodChange,
}: StakeMethodSelectorProps) => {
  return (
    <div className="space-y-3">
      {/* Method toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground">
            Stake Method
          </span>
          <span className="text-sm text-muted-foreground">(How to choose?)</span>
        </div>

        <div className="flex items-center bg-muted/50 rounded-full p-0.5 border border-border">
          {methods.map((method) => (
            <button
              key={method}
              onClick={() => onMethodChange(method)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                activeMethod === method
                  ? "bg-muted text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Method info */}
      <div className="flex items-center justify-between bg-muted/30 border border-border rounded-xl px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <CircleDot className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {activeMethod}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeMethod === "Direct deposit"
                ? "Mint the LST via its stake pool"
                : "Swap via Jupiter aggregator"}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-medium text-emerald-400">
            0% Deposit Fee
          </div>
          <div className="text-sm font-medium text-emerald-400">
            0% Price Impact
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeMethodSelector;
