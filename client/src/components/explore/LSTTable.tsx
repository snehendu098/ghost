import { lstTableData } from "./data/mockData";
import LSTTableRow from "./LSTTableRow";

const headers = ["#", "Name", "APY", "SOL Staked", "Market Cap", "Holders", "Commission"];

const LSTTable = () => {
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
          {lstTableData.map((row) => (
            <LSTTableRow key={row.rank} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LSTTable;
