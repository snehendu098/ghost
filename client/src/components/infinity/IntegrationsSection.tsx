const categories = [
  {
    title: "Borrow/Lend",
    description: "Use INF as collateral to borrow assets or earn interest by lending.",
    icons: ["bg-blue-600", "bg-indigo-600", "bg-teal-500", "bg-pink-500", "bg-emerald-500", "bg-green-600"],
  },
  {
    title: "Trading",
    description: "Trade INF on top-tier DEXs.",
    icons: ["bg-pink-600", "bg-emerald-500"],
  },
  {
    title: "Provide Liquidity",
    description: "Earn rewards by supplying liquidity to decentralized pools.",
    icons: ["bg-zinc-700", "bg-rose-500", "bg-orange-500", "bg-emerald-600", "bg-purple-600"],
  },
  {
    title: "Vaults",
    description: "Earn yield by putting your INF to work.",
    icons: ["bg-blue-500", "bg-teal-400"],
  },
  {
    title: "Leveraged Staking",
    description: "Multiply your yield by staking INF with leverage.",
    icons: ["bg-cyan-500"],
  },
];

const IntegrationsSection = () => {
  return (
    <section className="w-full py-16">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Left */}
        <div className="flex-1 max-w-sm space-y-4">
          <span className="text-sm font-semibold text-emerald-400">Integrated</span>
          <h2 className="text-3xl font-semibold text-foreground leading-tight">
            Over 15+ DeFi Integrations
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            With integrations across top DeFi apps, INF gives you more ways to earn,
            trade, and maximize rewards.
          </p>
        </div>

        {/* Right - Categories */}
        <div className="flex-1 space-y-6">
          {categories.map((cat) => (
            <div key={cat.title} className="flex items-start justify-between gap-6 py-3 border-b border-border last:border-0">
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end max-w-[180px]">
                {cat.icons.map((color, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 rounded-full ${color} flex items-center justify-center`}
                  >
                    <span className="text-white text-xs font-medium">
                      {cat.title[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
