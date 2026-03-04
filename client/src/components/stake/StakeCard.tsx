"use client";

import { useState } from "react";
import TokenInput from "./TokenInput";
import StakeMethodSelector from "./StakeMethodSelector";
import ConnectWalletButton from "@/components/shared/ConnectWalletButton";

const SolIcon = () => (
  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-teal-400" />
);

const InfIcon = () => (
  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500" />
);

const StakeCard = () => {
  const [stakeAmount, setStakeAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [stakeMethod, setStakeMethod] = useState("Direct deposit");

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="space-y-2">
        <TokenInput
          label="You're staking"
          token="SOL"
          tokenIcon={<SolIcon />}
          value={stakeAmount}
          usdValue="0"
          onChange={setStakeAmount}
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

      <StakeMethodSelector
        activeMethod={stakeMethod}
        onMethodChange={setStakeMethod}
      />

      <ConnectWalletButton />
    </div>
  );
};

export default StakeCard;
