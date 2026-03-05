"use client";

import { useState, useEffect } from "react";
import { get } from "@/lib/ghost";
import { gUSD, gETH } from "@/lib/constants";
import LSTTableRow from "./LSTTableRow";
import type { LSTRow } from "./data/mockData";

const headers = ["#", "Name", "Lend Intents", "Borrow Intents", "Network", "Contract"];

const LSTTable = () => {
  const [rows, setRows] = useState<LSTRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await get("/api/v1/internal/pending-intents");
        const lendIntents = data.lendIntents ?? [];
        const borrowIntents = data.borrowIntents ?? [];

        const gusdLends = lendIntents.filter(
          (i: any) => i.token?.toLowerCase() === gUSD.toLowerCase()
        ).length;
        const gusdBorrows = borrowIntents.filter(
          (i: any) => i.token?.toLowerCase() === gUSD.toLowerCase()
        ).length;
        const gethBorrows = borrowIntents.filter(
          (i: any) => i.token?.toLowerCase() === gETH.toLowerCase()
        ).length;

        setRows([
          { rank: 1, name: "Ghost USD", ticker: "gUSD", icon: "💵", apy: gusdLends, solStaked: gusdBorrows, marketCap: 0, holders: 0, commission: 0 },
          { rank: 2, name: "Ghost ETH", ticker: "gETH", icon: "💎", apy: 0, solStaked: gethBorrows, marketCap: 0, holders: 0, commission: 0 },
        ]);
      } catch {
        setRows([
          { rank: 1, name: "Ghost USD", ticker: "gUSD", icon: "💵", apy: 0, solStaked: 0, marketCap: 0, holders: 0, commission: 0 },
          { rank: 2, name: "Ghost ETH", ticker: "gETH", icon: "💎", apy: 0, solStaked: 0, marketCap: 0, holders: 0, commission: 0 },
        ]);
      }
    };
    load();
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-accent/30">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <LSTTableRow key={row.rank} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LSTTable;
