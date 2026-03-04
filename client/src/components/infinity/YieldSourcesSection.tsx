const sources = [
  { label: "Inflation", sublabel: "Native Staking", value: "7.08%", width: "w-[40%]", color: "bg-blue-600" },
  { label: "MEV", sublabel: "", value: "2.98%", width: "w-[20%]", color: "bg-slate-700" },
  { label: "Block Rewards", sublabel: "Oracle Staking", value: "3.17%", width: "w-[22%]", color: "bg-teal-600" },
  { label: "Trading Fees", sublabel: "", value: "", width: "w-[18%]", color: "bg-purple-600" },
];

const YieldSourcesSection = () => {
  return (
    <section className="w-full py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-sm font-semibold text-emerald-400">Unmatched</span>
        <h2 className="text-3xl font-semibold text-foreground">
          Where INF&apos;s Yield Comes From
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          See how INF gives you the most rewards on your SOL.
        </p>
      </div>

      {/* Yield bar chart */}
      <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
        {/* Labels row */}
        <div className="flex items-end">
          {sources.map((s) => (
            <div key={s.label} className={`${s.width} text-center`}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="flex items-end gap-2 h-32">
          {sources.map((s) => (
            <div key={s.label} className={`${s.width} flex flex-col items-center gap-2`}>
              <div
                className={`w-full rounded-xl ${s.color} flex items-center justify-center ${
                  s.label === "Inflation" ? "h-32" : s.label === "Block Rewards" ? "h-24" : s.label === "MEV" ? "h-20" : "h-28"
                }`}
              >
                {s.value && (
                  <span className="text-sm font-semibold text-white">{s.value}</span>
                )}
                {!s.value && (
                  <span className="text-lg">⚡</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sublabels */}
        <div className="flex items-start">
          {sources.map((s) => (
            <div key={s.label} className={`${s.width} text-center`}>
              {s.sublabel && (
                <p className="text-[10px] text-muted-foreground">{s.sublabel}</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-emerald-400 cursor-pointer hover:underline">
          For illustration purposes only
        </p>
      </div>
    </section>
  );
};

export default YieldSourcesSection;
