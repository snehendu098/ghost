import { Check } from "lucide-react";
import StakeCard from "./StakeCard";

const features = [
  ["Earn INF Trading Fees", "Highest-yielding LSTs"],
  ["Use INF in DeFi", "Earn Staking Rewards"],
  ["Earn Block Rewards", "Earn MEV Rewards"],
];

const partners = ["Jupiter", "Phantom", "Ledger", "Solflare"];

const UpgradedSection = () => {
  return (
    <section className="w-full rounded-2xl border border-border bg-card p-10">
      <div className="flex flex-col lg:flex-row gap-10 items-start justify-between">
        {/* Left */}
        <div className="flex-1 space-y-6 max-w-md">
          <span className="text-sm font-semibold text-emerald-400">Upgraded</span>
          <h2 className="text-3xl font-semibold text-foreground leading-tight">
            Enjoy the best LSTs.<br />Earn trading fees too.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            INF lets you earn trading fees on top of staking, MEV, and block
            rewards—something no other staking token does.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {features.flat().map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          {/* Partners */}
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Supported by leading partners:</p>
            <div className="flex items-center gap-6">
              {partners.map((p) => (
                <span key={p} className="text-sm font-semibold text-muted-foreground">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Stake card */}
        <StakeCard />
      </div>
    </section>
  );
};

export default UpgradedSection;
