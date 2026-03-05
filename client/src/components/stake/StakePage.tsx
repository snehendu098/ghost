"use client";

import { useState } from "react";
import TabSwitcher from "./TabSwitcher";
import BorrowCard from "../borrow/BorrowCard";
import { SwapTab, MigrateTab, UnstakeTab } from "./tabs";

const StakePage = () => {
  const [activeTab, setActiveTab] = useState("Borrow");

  return (
    <div className="w-full max-w-xl mx-auto py-10 space-y-8">
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "Borrow" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium text-foreground">
              Borrow with Privacy
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit a private borrow intent. Your max rate is encrypted and only
              revealed inside the CRE settlement engine.
            </p>
          </div>
          <BorrowCard />
        </div>
      )}
      {activeTab === "Swap" && <SwapTab />}
      {activeTab === "Migrate" && <MigrateTab />}
      {activeTab === "Unstake" && <UnstakeTab />}
      {activeTab === "Lend" && <LendTab />}
    </div>
  );
};

export default StakePage;
