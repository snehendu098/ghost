"use client";

import Image from "next/image";
import { ArrowRight, Zap, TrendingUp, Clock } from "lucide-react";

export default function Hero() {
  return (
    <section className="gradient-hero pt-36 pb-24 overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-gradient-to-br from-purple-500/20 to-indigo-500/20 mb-8 border border-white/10">
          <Image src="/logo-new.png" alt="Ghost" width={40} height={40} className="rounded-xl" />
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.1] mb-6 text-white">
          Meet the Ghost App
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
          Earn up to 10% on your tokens, with daily
          <br className="hidden sm:block" />
          rewards and easy withdrawals.
        </p>

        <button className="inline-flex items-center gap-2.5 px-8 py-4 text-gray-900 text-sm font-semibold rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#e2a9f1]/25" style={{ backgroundColor: "#e2a9f1" }}>
          Get Early Access
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="relative mt-20 max-w-3xl mx-auto">
          <div className="absolute -left-6 top-6 glass-card rounded-2xl px-5 py-3.5 flex items-center gap-3 z-10 hover-lift">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-blue-500/20">+</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Deposit</p>
              <p className="text-xs text-gray-500">From: 54Gg...9f</p>
            </div>
          </div>

          <div className="absolute -left-10 top-44 glass-card rounded-2xl px-5 py-3.5 flex items-center gap-3 z-10 hover-lift">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-green-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Rewards</p>
              <p className="text-xs text-emerald-400 font-semibold">+0.00103 gUSD</p>
              <p className="text-[10px] text-gray-500">Woohoo!</p>
            </div>
          </div>

          <div className="absolute -right-4 top-2 glass-card rounded-2xl px-5 py-3.5 flex items-center gap-3 z-10 hover-lift">
            <p className="text-sm font-medium text-gray-400">reward 45:03</p>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-green-500/20">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="absolute -right-10 top-36 glass-card rounded-2xl px-5 py-4 z-10 hover-lift">
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">last month</p>
              <p className="text-xl font-bold text-white mt-0.5">0.59162 SOL</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500">$129.89</p>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">8.20% APY</span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-72 sm:w-80">
            <div className="bg-[#1a1a1a] rounded-[3rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/[0.06]">
              <div className="bg-[#101010] rounded-[2.4rem] overflow-hidden">
                <div className="flex items-center justify-between px-8 pt-3 pb-1">
                  <span className="text-[11px] font-semibold text-white">9:41</span>
                  <div className="w-28 h-7 bg-[#1a1a1a] rounded-full" />
                  <div className="flex items-center gap-0.5">
                    <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none"><rect x="0" y="4" width="3" height="8" rx="1" fill="white" opacity="0.3"/><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="white" opacity="0.5"/><rect x="9" y="1" width="3" height="11" rx="1" fill="white" opacity="0.7"/><rect x="13" y="0" width="3" height="12" rx="1" fill="white"/></svg>
                  </div>
                </div>

                <div className="px-6 pt-5 pb-8">
                  <div className="flex items-center justify-center gap-1.5 mb-6">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Earning 8.05%</span>
                  </div>
                  <p className="text-[32px] font-bold text-center text-white leading-none">10.00438 SOL</p>
                  <p className="text-sm text-gray-500 text-center mt-1.5">$2,410.05</p>

                  <div className="mt-7 flex items-center justify-center gap-2 bg-white/[0.04] rounded-full py-3 px-5 border border-white/[0.06]">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-400">
                      <span className="font-semibold text-white">23h 45m</span>
                      <span className="text-gray-600 mx-1">...</span>till next reward
                    </span>
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <button className="text-gray-900 text-xs font-semibold py-3.5 rounded-2xl" style={{ backgroundColor: "#e2a9f1" }}>Lend</button>
                    <button className="bg-white/[0.06] text-white text-xs font-semibold py-3.5 rounded-2xl border border-white/[0.06]">Borrow</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -left-2 bottom-10 glass-card rounded-2xl px-5 py-3.5 z-10 hover-lift">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium">Next reward</span>
            </div>
            <p className="text-2xl font-bold mt-1 tabular-nums text-white">6:45:03</p>
          </div>

          <div className="absolute right-0 bottom-6 glass-card rounded-2xl px-5 py-3.5 z-10 flex items-center gap-3 hover-lift">
            <span className="text-sm font-semibold text-white">Withdraw</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-lg shadow-md shadow-red-500/20">-</div>
          </div>
        </div>
      </div>
    </section>
  );
}
