"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const MigrateTab = () => {
  const [subTab, setSubTab] = useState<"Active" | "Deactivating">("Active");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-medium text-foreground">
        Migrate stake accounts to LSTs
      </h1>

      {/* Migrate Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {/* Active / Deactivating toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSubTab("Active")}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              subTab === "Active"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setSubTab("Deactivating")}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              subTab === "Deactivating"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Deactivating
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search account or validator"
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-muted-foreground/50 transition-colors"
          />
        </div>

        {/* Empty state */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your stake accounts
          </p>
        </div>

        {/* Migrate button */}
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition-colors cursor-pointer text-base">
          Migrate to LST
        </button>

        {/* Unstake instantly */}
        <button className="w-full border border-border text-muted-foreground font-semibold py-4 rounded-xl transition-colors cursor-pointer text-base hover:text-foreground hover:border-muted-foreground/50">
          Unstake Instantly
        </button>
      </div>
    </div>
  );
};

export default MigrateTab;
