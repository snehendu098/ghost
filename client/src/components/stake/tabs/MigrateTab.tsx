"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const MigrateTab = () => {
  const [subTab, setSubTab] = useState<"Active" | "History">("Active");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-medium text-foreground">
        Manage your positions
      </h1>

      {/* Positions Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {/* Active / History toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSubTab("Active")}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              subTab === "Active"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Loans
          </button>
          <button
            onClick={() => setSubTab("History")}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              subTab === "History"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by loan ID or address"
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-muted-foreground/50 transition-colors"
          />
        </div>

        {/* Empty state */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your lending and borrowing positions
          </p>
        </div>

        {/* Cancel Lend */}
        <button className="w-full text-gray-900 font-semibold py-4 rounded-xl transition-colors cursor-pointer text-base" style={{ backgroundColor: "#e2a9f1" }}>
          Cancel Lend Position
        </button>

        {/* Withdraw */}
        <button className="w-full border border-border text-muted-foreground font-semibold py-4 rounded-xl transition-colors cursor-pointer text-base hover:text-foreground hover:border-muted-foreground/50">
          Withdraw from Vault
        </button>
      </div>
    </div>
  );
};

export default MigrateTab;
