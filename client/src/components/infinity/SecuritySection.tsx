import { ExternalLink } from "lucide-react";

const auditors = [
  { name: "Neodyme", color: "bg-red-600" },
  { name: "OtterSec", color: "bg-zinc-700" },
  { name: "sec3", color: "bg-zinc-700" },
];

const SecuritySection = () => {
  return (
    <section className="w-full py-16">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left - Illustration */}
          <div className="flex-1 bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-transparent p-10 flex items-center justify-center min-h-[280px]">
            <div className="relative">
              {/* Decorative shield illustration */}
              <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-2xl">★★★</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-8 h-16 w-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center -rotate-12">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="absolute -top-4 -right-8 h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center rotate-12">
                <span className="text-lg">🔒</span>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="flex-1 p-10 space-y-5">
            <span className="text-sm font-semibold text-emerald-400">Secure</span>
            <h2 className="text-2xl font-semibold text-foreground leading-tight">
              A Staking Strategy Built for Security
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our open-source code is rigorously reviewed by leading security
              firms. Verified by:
            </p>

            {/* Auditor badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {auditors.map((a) => (
                <span
                  key={a.name}
                  className={`${a.color} rounded-lg px-4 py-2 text-sm font-semibold text-white`}
                >
                  {a.name}
                </span>
              ))}
            </div>

            {/* Links */}
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="flex items-center gap-1 text-sm text-emerald-400 hover:underline">
                View security Audits <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="flex items-center gap-1 text-sm text-emerald-400 hover:underline">
                Github <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
