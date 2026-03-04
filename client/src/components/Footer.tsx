"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const faqItems = [
  {
    question: "What does it mean to swap from one LST to another?",
    answer:
      "Swapping from one LST to another means exchanging your liquid staking token for a different one, allowing you to switch between different staking strategies or providers.",
  },
  {
    question: "Why can't I swap to or from SOL here?",
    answer:
      "This swap interface is specifically designed for LST-to-LST swaps. To swap to or from SOL, please use the Stake or Unstake tabs.",
  },
  {
    question: "How is my LST swap routed?",
    answer:
      "Your LST swap is routed through the most efficient path available, which may involve multiple intermediate swaps to get you the best rate.",
  },
];

const Footer = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <footer className="w-full max-w-xl mx-auto py-10">
      <h2 className="text-lg font-semibold text-foreground mb-4">FAQs</h2>

      {faqItems.map((item, index) => (
        <div key={index} className="border-b border-border">
          <button
            onClick={() =>
              setOpenIndex(openIndex === index ? null : index)
            }
            className="w-full flex items-center justify-between py-4 cursor-pointer"
          >
            <span className="text-sm font-medium text-foreground text-left">
              {item.question}
            </span>
            <Plus className="w-4 h-4 text-indigo-500 shrink-0 ml-4" />
          </button>

          {openIndex === index && (
            <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </footer>
  );
};

export default Footer;
