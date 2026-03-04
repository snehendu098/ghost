import { CircleHelp, ArrowUpDown } from "lucide-react";

const StatsDisplay = () => {
  return (
    <div className="flex items-start">
      {/* INF APY */}
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm text-muted-foreground">INF APY</span>
          <CircleHelp className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-medium text-foreground">6.33%</span>
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-blue-500" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-18 bg-border mx-8 self-center" />

      {/* Est. rewards per year */}
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm text-muted-foreground">
            Est. rewards per year
          </span>
          <CircleHelp className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-medium text-foreground">0 SOL</span>
          <ArrowUpDown className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;
