"use client";
import { ArrowUpRight } from "lucide-react";
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

          {/* Right visual — thumbnail with hover scale like Features */}
          <div className="relative w-52 h-48 shrink-0 hidden sm:block overflow-visible">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-48 rounded-2xl border border-white/[0.08] overflow-hidden bg-[#1e1e1e]">
              <img
                src="/litepaper-thumb.png"
                alt="GHOST Litepaper"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.08]"
              />
            </div>
          </div>
        </a>
      </motion.div>
    </section>
  );
}
