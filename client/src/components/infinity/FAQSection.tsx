"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  "What is Infinity and INF?",
  "Where do INF's staking yields come from?",
  "How do I get my staking rewards from INF?",
  "Why is 1 INF not equal to 1 SOL?",
  "Why does INF's APY fluctuate?",
  "What are the risks when staking with INF?",
  "Why should I stake my SOL with INF?",
  "How can INF provide higher potential rewards than other LSTs?",
  "Can I unstake my INF at any time?",
  "How long does it take to unstake my INF?",
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-full py-16 space-y-8">
      <h2 className="text-3xl font-semibold text-foreground">
        Frequently Asked Questions
      </h2>

      <div className="divide-y divide-border">
        {faqs.map((q, i) => (
          <button
            key={i}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-4 text-left cursor-pointer group"
          >
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {q}
            </span>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};

export default FAQSection;
