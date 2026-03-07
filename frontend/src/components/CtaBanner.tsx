import { ArrowRight } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-12">
        <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold tracking-tight leading-[1.1] text-[#c8ff00] max-w-xl">
          Building the future of private lending
        </h2>
        <div className="max-w-md">
          <p className="text-gray-300 leading-relaxed mb-8 text-base">
            Unifying sealed-bid rate discovery and confidential settlement, creating a secure, innovative, and accessible lending protocol for all.
          </p>
          <button className="inline-flex items-center gap-2.5 px-7 py-3.5 text-gray-900 text-sm font-semibold rounded-full hover:opacity-90 transition-all" style={{ backgroundColor: "#e2a9f1" }}>
            Explore the product
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="mt-4">
            <a href="#" className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-gray-300 transition-colors">
              Talk to an expert
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
