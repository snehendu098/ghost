"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

const filters = ["LST Type", "APY", "SOL Staked", "Holders"];

const FilterBar = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="flex items-center gap-3">
      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            {filter}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Search LST name or symbol"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
        />
        <kbd className="flex-shrink-0 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">/</kbd>
      </div>
    </div>
  );
};

export default FilterBar;
