import type { LSTRow } from "./data/mockData";
import { gUSD, gETH } from "@/lib/constants";

const contractAddress = (ticker: string) => {
  if (ticker === "gUSD") return gUSD;
  if (ticker === "gETH") return gETH;
  return "";
};

const LSTTableRow = ({ row }: { row: LSTRow }) => {
  const address = contractAddress(row.ticker);

  return (
    <tr className="border-b border-border transition-colors hover:bg-accent/50 cursor-pointer">
      <td className="py-4 px-4 text-sm text-muted-foreground">{row.rank}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-base">
            {row.icon}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.ticker}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-sm font-medium text-emerald-500">
        {row.apy}
      </td>
      <td className="py-4 px-4 text-sm font-medium text-foreground">
        {row.solStaked}
      </td>
      <td className="py-4 px-4 text-sm text-foreground">
        Sepolia
      </td>
      <td className="py-4 px-4 text-xs text-muted-foreground font-mono">
        {address.slice(0, 6)}...{address.slice(-4)}
      </td>
    </tr>
  );
};

export default LSTTableRow;
