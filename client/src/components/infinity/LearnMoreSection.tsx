const articles = [
  {
    title: "Sanctum's Infinity: The Ultimate Guide (2025)",
    description: "How Sanctum's Infinity works, why it matters and how to use it.",
    color: "bg-gradient-to-br from-orange-500 to-pink-500",
  },
  {
    title: "Why Is Infinity the Best Strategy to Stake Solana?",
    description: "What makes Infinity the premier Solana staking strategy.",
    color: "bg-gradient-to-br from-blue-500 to-cyan-400",
  },
];

const LearnMoreSection = () => {
  return (
    <section className="w-full py-16">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <h2 className="text-3xl font-semibold text-foreground leading-tight flex-shrink-0">
          Learn more about INF
        </h2>

        <div className="flex-1 space-y-4">
          {articles.map((article) => (
            <a
              key={article.title}
              href="#"
              className="flex items-center gap-5 rounded-xl border border-border p-4 transition-colors hover:bg-accent/50 cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className={`h-16 w-16 rounded-xl ${article.color} flex-shrink-0`} />

              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-muted-foreground">{article.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LearnMoreSection;
