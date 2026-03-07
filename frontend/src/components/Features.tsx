"use client";

import { ArrowUpRight, Shield, Lock, Cpu, Award } from "lucide-react";

const features = [
  {
    badge: "6.41% APY",
    badgeDot: "bg-emerald-500",
    title: "Private Lending",
    desc: "Earn the best yields on your gUSD, powered by Ghost's sealed-bid rate discovery engine.",
    visualBg: "bg-gradient-to-br from-emerald-200/10 via-teal-300/10 to-emerald-100/5",
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-48 h-48">
          <div className="absolute inset-0 rounded-full border-[18px] border-emerald-500/10" />
          <div className="absolute inset-5 rounded-full border-[16px] border-emerald-500/15" />
          <div className="absolute inset-11 rounded-full border-[14px] border-emerald-400/25" />
          <div className="absolute inset-[3.5rem] rounded-full border-[10px] border-teal-400/35" />
          <div className="absolute inset-[4.8rem] rounded-full bg-gradient-to-br from-purple-500/50 via-blue-400/50 to-emerald-400/50 blur-sm" />
          <div className="absolute inset-[4.8rem] rounded-full bg-gradient-to-br from-purple-400 via-blue-300 to-green-300 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white/80" />
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: "Over $5M in partner revenue",
    badgeDot: "bg-orange-500",
    title: "Sealed-Bid Rates",
    desc: "Join lenders and borrowers in fair-rate auctions. Rates encrypted with CRE's public key — zero leakage.",
    visualBg: "bg-gradient-to-b from-amber-400 to-yellow-500",
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-600 to-orange-700 rotate-45 rounded-3xl shadow-lg shadow-orange-900/30" />
          <div className="absolute inset-0 w-24 h-24 flex items-center justify-center">
            <Lock className="w-10 h-10 text-amber-200 -rotate-45" />
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-36 h-10 bg-white/20 rounded-full blur-lg" />
        </div>
      </div>
    ),
  },
  {
    badge: "Delivered 350,000 txs",
    badgeDot: "bg-indigo-500",
    title: "CRE Settlement",
    desc: "Send transactions faster and more reliably.",
    visualBg: "bg-[#1a1a1a]",
    visual: (
      <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
        <div className="absolute top-5 left-6 right-6 h-2.5 bg-indigo-500 rounded-full" />
        <div className="w-[80%] bg-[#232326] rounded-t-2xl p-5 space-y-3 border border-white/[0.06] border-b-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Gateway</p>
              <p className="text-[10px] text-gray-400">Dashboard</p>
            </div>
          </div>
          <div className="bg-white/[0.05] rounded-lg px-4 py-2.5 flex items-center gap-3 border border-white/[0.04]">
            <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-sm bg-white/40" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Delivery Methods</p>
          </div>
          <div className="bg-white/[0.05] rounded-lg px-4 py-2.5 flex items-center gap-3 border border-white/[0.04]">
            <p className="text-[9px] text-white/40 font-mono font-bold leading-none w-5 text-center">0101<br/>1001</p>
            <p className="text-xs text-gray-400 font-medium">Developer Logs</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    badge: "300M requests handled daily",
    badgeDot: "bg-purple-500",
    title: "Credit Tiers",
    desc: "The complete Web3 credit reputation platform.",
    visualBg: "bg-[#1a1a1a]",
    visual: (
      <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
        {/* Layered cards behind */}
        <div className="absolute bottom-0 left-[5%] w-[75%] h-[70%] bg-[#2a2a2e] rounded-t-2xl border border-white/[0.04] border-b-0" />
        {/* Front dashboard card */}
        <div className="relative w-[80%] bg-[#232326] rounded-t-2xl p-5 border border-white/[0.06] border-b-0 z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Credit Engine</p>
              <p className="text-[10px] text-gray-400">Dashboard</p>
            </div>
          </div>
          <div className="h-16 px-1">
            <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 50 Q30 45 50 35 T100 25 T150 15 T200 10 V60 H0Z" fill="url(#chartGrad)" />
              <path d="M0 50 Q30 45 50 35 T100 25 T150 15 T200 10" fill="none" stroke="rgb(139, 92, 246)" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-[40px] font-semibold tracking-tight leading-tight mb-3 text-white">
          Ghost&apos;s leading lending infrastructure.
        </h2>
        <p className="text-gray-400 mb-14 max-w-lg text-base leading-relaxed">
          Ghost is the leading infrastructure powering sealed-bid rates, automated matching, and credit tiers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-[20px] bg-[#161616] border border-white/[0.06] hover:border-white/[0.1] transition-all hover-lift group cursor-pointer overflow-hidden flex flex-col">
              {/* Visual area */}
              <div className={`relative h-64 ${f.visualBg} overflow-hidden`}>
                {/* Badge pill — top right */}
                <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 bg-[#101010]/70 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/[0.08]">
                  <span className={`w-2 h-2 rounded-full ${f.badgeDot}`} />
                  <span className="text-xs font-medium text-white">{f.badge}</span>
                </div>
                {f.visual}
              </div>
              {/* Text area */}
              <div className="p-6 pt-5 pb-7">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                  <ArrowUpRight className="w-5.5 h-5.5 text-gray-500 group-hover:text-white transition-colors shrink-0" />
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
