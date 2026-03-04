import type { FeaturedLST } from "./data/mockData";

const FeaturedCard = ({ lst }: { lst: FeaturedLST }) => {
  return (
    <div className="flex-shrink-0 w-[270px] rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-5 cursor-pointer transition-colors hover:border-zinc-600">
      {/* Top: icon + name/ticker */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${lst.iconBg} text-white text-sm font-bold`}
        >
          {lst.iconText}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{lst.name}</p>
          <p className="text-xs text-muted-foreground">{lst.ticker}</p>
        </div>
      </div>

      {/* Bottom: APY */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-foreground">{lst.apy}%</span>
        <span className="text-sm text-muted-foreground">APY</span>
      </div>
    </div>
  );
};

export default FeaturedCard;
