import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function TokenBanner() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="gradient-card-dark rounded-[28px] p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-10 overflow-hidden relative border border-white/[0.06]">
          <div className="relative z-10 max-w-md">
            <h3 className="text-4xl sm:text-5xl font-semibold text-white mb-5 tracking-tight">$GHOST</h3>
            <p className="text-gray-400 leading-relaxed mb-8 text-base">
              Ghost is building ethical, user-first lending. $GHOST is our community token to prove that crypto can and will be better.
            </p>
            <button className="inline-flex items-center gap-2.5 px-7 py-3.5 text-gray-900 text-sm font-semibold rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5 active:translate-y-0" style={{ backgroundColor: "#e2a9f1" }}>
              Learn more
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative z-10 shrink-0">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-purple-500/15 to-violet-900/10 flex items-center justify-center border border-purple-500/10">
              <Image src="/logo-new.png" alt="Ghost" width={120} height={120} className="w-28 h-28 sm:w-32 sm:h-32 rounded-full drop-shadow-2xl" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-600/[0.06] blur-[120px]" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-indigo-600/[0.05] blur-[100px]" />
        </div>
      </div>
    </section>
  );
}
