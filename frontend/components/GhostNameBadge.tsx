"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useIdentity } from "@/contexts/IdentityContext";
import { SetGhostNameModal } from "@/components/SetGhostNameModal";

export function GhostNameBadge({ showEdit = false }: { showEdit?: boolean }) {
  const { displayName, ghostAlias, setGhostAlias, walletAddress } = useIdentity();
  const [modalOpen, setModalOpen] = useState(false);

  if (!walletAddress) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-[#ccc] font-medium truncate max-w-[180px]">
          {displayName}
        </span>
        {showEdit && (
          <button
            onClick={() => setModalOpen(true)}
            className="text-[#555] hover:text-white transition-colors"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
      {modalOpen && (
        <SetGhostNameModal
          currentAlias={ghostAlias}
          onSave={setGhostAlias}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
