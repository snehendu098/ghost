import type { LSTRow } from "./data/mockData";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const LSTTableRow = ({ row }: { row: LSTRow }) => {
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
        {row.apy}%
      </td>
      <td className="py-4 px-4 text-sm text-foreground">
        {formatNumber(row.solStaked)} SOL
      </td>
      <td className="py-4 px-4 text-sm text-foreground">
        ${formatNumber(row.marketCap)}
      </td>
      <td className="py-4 px-4 text-sm text-foreground">
        {formatNumber(row.holders)}
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {row.commission}%
      </td>
    </tr>
  );
};

export default LSTTableRow;
