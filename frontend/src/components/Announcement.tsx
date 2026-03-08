"use client";
import { ArrowUpRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Announcement() {
  return (
    <section className="py-16 px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-6xl mx-auto"
      >
        <a
          href="#"
          className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12 bg-[#161616] border border-white/[0.06] rounded-3xl p-8 sm:p-10 hover:border-white/[0.1] transition-all group cursor-pointer overflow-hidden"
        >
          {/* Left content */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#1e1e1e] border border-white/[0.06] rounded-full px-3.5 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-gray-300">Litepaper</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2.5 mb-2">
              GHOST: Privacy-Preserving Rate Discovery
              <ArrowUpRight className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors shrink-0" />
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              Read how sealed-bid discriminatory auctions and confidential compute solve rate manipulation in DeFi lending.
            </p>
          </div>

          {/* Right visual — stacked document cards, centered */}
          <div className="relative w-44 h-44 shrink-0 hidden sm:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 bg-[#1e1e1e] border border-white/[0.04] rounded-2xl -rotate-6 shadow-lg" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 bg-[#1e1e1e] border border-white/[0.04] rounded-2xl rotate-6 shadow-lg" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 bg-[#2a2a2d] border border-white/[0.08] rounded-2xl shadow-2xl">
              <div className="flex flex-col items-center pt-5 px-4">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-base font-semibold text-white mb-4">GHOST</p>
              </div>
              <div className="px-5 space-y-2.5">
                <div className="h-2 w-full rounded-full bg-white/[0.08]" />
                <div className="h-2 w-full rounded-full bg-white/[0.08]" />
              </div>
            </div>
          </div>
        </a>
      </motion.div>
    </section>
  );
}
