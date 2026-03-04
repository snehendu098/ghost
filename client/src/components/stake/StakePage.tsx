"use client";

import { useState } from "react";
import TabSwitcher from "./TabSwitcher";
import { StakeTab, SwapTab, MigrateTab, UnstakeTab } from "./tabs";

const StakePage = () => {
  const [activeTab, setActiveTab] = useState("Stake");

  return (
    <div className="w-full max-w-xl mx-auto py-10 space-y-8">
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "Stake" && <StakeTab />}
      {activeTab === "Swap" && <SwapTab />}
      {activeTab === "Migrate" && <MigrateTab />}
      {activeTab === "Unstake" && <UnstakeTab />}
    </div>
  );
};

export default StakePage;
