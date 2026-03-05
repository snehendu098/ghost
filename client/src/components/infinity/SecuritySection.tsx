import { ExternalLink } from "lucide-react";

const techStack = [
  { name: "Chainlink CRE", color: "bg-blue-600" },
  { name: "EIP-712", color: "bg-indigo-600" },
  { name: "eciesjs", color: "bg-zinc-700" },
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
                  <span className="text-yellow-400 text-2xl">&#9733;&#9733;&#9733;</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-8 h-16 w-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center -rotate-12">
                <span className="text-2xl">&#128737;&#65039;</span>
              </div>
              <div className="absolute -top-4 -right-8 h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center rotate-12">
                <span className="text-lg">&#128274;</span>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="flex-1 p-10 space-y-5">
            <span className="text-sm font-semibold text-emerald-400">Secure</span>
            <h2 className="text-2xl font-semibold text-foreground leading-tight">
              Privacy-First Architecture
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rates are encrypted client-side with the CRE public key using secp256k1
              ECIES. Only Chainlink&apos;s confidential runtime can decrypt them. The
              server never sees plaintext rates — it&apos;s &quot;dumb storage&quot; by design.
            </p>

            {/* Tech badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {techStack.map((a) => (
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
                Architecture Docs <ExternalLink className="h-3.5 w-3.5" />
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
