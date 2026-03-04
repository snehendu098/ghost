"use client";

import { useState } from "react";
import { CircleHelp, Plus } from "lucide-react";
import TokenInput from "../TokenInput";
import ConnectWalletButton from "@/components/shared/ConnectWalletButton";

const InfIcon = () => (
  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500" />
);

const SelectIcon = () => (
  <Plus className="w-4 h-4 text-foreground" />
);

const SwapTab = () => {
  const [swapAmount, setSwapAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-medium text-foreground">
        Swap your favorite LSTs
      </h1>

      {/* Swap Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <TokenInput
            label="You're swapping"
            token="Select"
            tokenIcon={<SelectIcon />}
            value={swapAmount}
            usdValue="0"
            onChange={setSwapAmount}
            hasDropdown
          />

          <TokenInput
            label="To receive"
            token="INF"
            tokenIcon={<InfIcon />}
            value={receiveAmount}
            usdValue="0"
            onChange={setReceiveAmount}
            hasDropdown
            readOnly
          />
        </div>

        {/* APY Stats */}
        <div className="flex items-start gap-0">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-muted-foreground">APY</span>
              <CircleHelp className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-2xl font-semibold text-foreground">
              0.00%
            </span>
          </div>

          <div className="w-px h-14 bg-border mx-6" />

          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-muted-foreground">INF APY</span>
              <CircleHelp className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-foreground">
                6.33%
              </span>
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500" />
            </div>
          </div>
        </div>

        <ConnectWalletButton />
      </div>
    </div>
  );
};

export default SwapTab;
