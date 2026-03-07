"use client";

import { useState } from "react";
import TabSwitcher from "./TabSwitcher";
import BorrowCard from "../borrow/BorrowCard";
import LendCard from "../lend/LendCard";
import SwapTab from "../info/InfoTab";
import StatusTab from "../status/StatusTab";

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
      {activeTab === "Lend" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium text-foreground">
              Lend privately on GHOST
            </h1>
            <p className="text-sm text-muted-foreground">
              Set your rate, deposit funds. Rates are sealed — only matched inside
              CRE confidential compute.
            </p>
          </div>
          <LendCard />
        </div>
      )}
      {activeTab === "Swap" && <SwapTab />}
      {activeTab === "Status" && <StatusTab />}
    </div>
  );
};

export default StakePage;
