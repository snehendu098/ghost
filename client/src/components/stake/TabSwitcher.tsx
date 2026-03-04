"use client";

import { useState } from "react";

const tabs = ["Stake", "Swap", "Migrate", "Unstake"];

interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabSwitcher = ({ activeTab, onTabChange }: TabSwitcherProps) => {
  return (
    <div className="flex items-center bg-card border border-border rounded-full p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            activeTab === tab
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabSwitcher;
