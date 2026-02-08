"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { CryptoIcon } from "./CryptoIcon";
import { overlayVariants, modalVariants, modalTransition } from "@/lib/motion";

interface SelectItem {
  id: string;
  name: string;
  symbol?: string;
}

interface SelectModalProps {
  title: string;
  items: SelectItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function SelectModal({ title, items, selectedId, onSelect, onClose }: SelectModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.symbol && item.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        variants={overlayVariants}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-[400px] bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] overflow-hidden"
        variants={modalVariants}
        transition={modalTransition}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-[16px] font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#050505] rounded-xl border border-[#1a1a1a]">
            <Search size={16} className="text-[#555] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[#555] outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[320px] overflow-y-auto px-2 pb-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                item.id === selectedId ? "bg-[#111111]" : "hover:bg-[#050505]"
              }`}
            >
              <CryptoIcon id={item.id} size={32} />
              <div className="text-left">
                <div className="text-[14px] font-medium text-white">{item.symbol || item.name}</div>
                <div className="text-[12px] text-[#666]">{item.name}</div>
              </div>
              {item.id === selectedId && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-[14px] text-[#555] py-8">No results found</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
