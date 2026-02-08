"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { overlayVariants, modalVariants, modalTransition } from "@/lib/motion";

const ALIAS_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,18}[a-zA-Z0-9]$/;

export function SetGhostNameModal({
  currentAlias,
  onSave,
  onClose,
}: {
  currentAlias: string | null;
  onSave: (name: string | null) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentAlias ?? "");
  const trimmed = value.trim().toLowerCase();
  const valid = trimmed === "" || ALIAS_REGEX.test(trimmed);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="absolute inset-0 bg-black/60"
        variants={overlayVariants}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 w-[380px]"
        variants={modalVariants}
        transition={modalTransition}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="text-[16px] font-semibold text-white">Set Ghost Name</span>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mb-2">
          <div className="flex items-center bg-[#050505] border border-[#222222] rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="yourname"
              className="flex-1 bg-transparent text-white text-[14px] px-4 py-3 outline-none placeholder:text-[#444]"
              maxLength={20}
            />
            <span className="text-[13px] text-[#555] pr-4 shrink-0">.ghost.eth</span>
          </div>
          {!valid && (
            <div className="text-[11px] text-[#555555] mt-1.5 px-1">
              3-20 chars, alphanumeric + hyphens only
            </div>
          )}
        </div>

        {trimmed && valid && (
          <div className="text-[12px] text-[#888] mb-4 px-1">
            Preview: <span className="text-white font-medium">{trimmed}.ghost.eth</span>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {currentAlias && (
            <button
              onClick={() => { onSave(null); onClose(); }}
              className="flex-1 text-[13px] py-2.5 rounded-xl border border-[#222222] text-[#888] hover:text-white hover:border-[#555] transition-colors"
            >
              Remove
            </button>
          )}
          <button
            disabled={!valid || !trimmed}
            onClick={() => { onSave(trimmed); onClose(); }}
            className="flex-1 text-[13px] py-2.5 rounded-xl bg-white text-black font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
