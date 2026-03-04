const HeroSection = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-10 text-white">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 rounded-full bg-white/5 blur-xl" />

      <div className="relative z-10 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Explore over 1,000 LSTs
        </h1>
        <p className="max-w-lg text-base text-white/80">
          Discover liquid staking tokens, compare APYs, and find the best yield
          opportunities across the Solana ecosystem.
        </p>

        <div className="flex items-center gap-8 pt-2">
          <div>
            <p className="text-2xl font-bold">$4.2B+</p>
            <p className="text-sm text-white/60">Total Value Locked</p>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold">1,024</p>
            <p className="text-sm text-white/60">LSTs Available</p>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold">7.4%</p>
            <p className="text-sm text-white/60">Avg. APY</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
