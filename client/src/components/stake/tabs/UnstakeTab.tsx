"use client";

import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import TokenInput from "../TokenInput";
import ConnectWalletButton from "@/components/shared/ConnectWalletButton";

const SolIcon = () => (
  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-teal-400" />
);

const SelectIcon = () => (
  <Plus className="w-4 h-4 text-foreground" />
);

const unstakeMethods = ["Instant", "Delayed"];

const UnstakeTab = () => {
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [unstakeMethod, setUnstakeMethod] = useState("Instant");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium text-foreground">Unstake SOL</h1>
        <p className="text-sm text-muted-foreground">
          Need SOL? Unstake from an LST to get instant liquidity.
        </p>
      </div>

      {/* Unstake Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <TokenInput
            label="You're unstaking"
            token="Select"
            tokenIcon={<SelectIcon />}
            value={unstakeAmount}
            usdValue="0"
            onChange={setUnstakeAmount}
            hasDropdown
          />

          <TokenInput
            label="To receive"
            token="SOL"
            tokenIcon={<SolIcon />}
            value={receiveAmount}
            usdValue="0"
            readOnly
          />
        </div>

        {/* Unstake Method */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Unstake Method
              </span>
              <span className="text-sm text-muted-foreground">
                (How to choose?)
              </span>
            </div>

            <div className="flex items-center bg-muted/50 rounded-full p-0.5 border border-border">
              {unstakeMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => setUnstakeMethod(method)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    unstakeMethod === method
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
          <div className="flex items-center justify-between bg-muted/30 border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Zap className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {unstakeMethod === "Instant"
                    ? "Instant unstake"
                    : "Delayed unstake"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {unstakeMethod === "Instant"
                    ? "Get SOL now at market price"
                    : "Wait 2-3 days, no price impact"}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-foreground">
                {unstakeMethod === "Instant"
                  ? "Variable price impact"
                  : "No price impact"}
              </span>
            </div>
          </div>
        </div>

        <ConnectWalletButton />
      </div>
    </div>
  );
};

export default UnstakeTab;
