"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { get } from "@/lib/ghost";

interface CreditInfo {
  tier: string;
  loansRepaid: number;
  loansDefaulted: number;
  collateralMultiplier: number;
}

const ProfilePage = () => {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const addr = wallets[0]?.address;

  const [credit, setCredit] = useState<CreditInfo | null>(null);
  const [borrowCount, setBorrowCount] = useState(0);
  const [lendCount, setLendCount] = useState(0);
  const [intentCount, setIntentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!addr) return;
    setLoading(true);
    try {
      const [c, b, l] = await Promise.all([
        get(`/api/v1/credit-score/${addr}`).catch(() => null),
        get(`/api/v1/borrower-status/${addr}`).catch(() => ({})),
        get(`/api/v1/lender-status/${addr}`).catch(() => ({})),
      ]);
      setCredit(c);
      setBorrowCount((b.activeLoans ?? []).length);
      setLendCount((l.activeLoans ?? []).length);
      setIntentCount(
        (b.pendingIntents ?? []).length + (l.activeLends ?? []).length
      );
    } finally {
      setLoading(false);
    }
  }, [addr]);

  useEffect(() => { load(); }, [load]);

  const copy = () => {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!authenticated) {
    return (
      <div className="w-full max-w-lg mx-auto py-32 px-4 text-center space-y-4">
        <h2 className="text-lg font-medium text-foreground">Connect to view your profile</h2>
        <p className="text-sm text-muted-foreground">
          Your credit tier, positions, and protocol stats live here.
        </p>
        <button
          onClick={login}
          className="text-gray-900 px-8 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tier = credit?.tier ?? "bronze";
  const multiplier = credit?.collateralMultiplier ?? 2;

  return (
    <div className="w-full max-w-lg mx-auto py-10 px-4 space-y-6">
      {/* Address */}
      <div>
        <p className="font-mono text-sm text-foreground truncate">{addr}</p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={copy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            href={`https://sepolia.etherscan.io/address/${addr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Etherscan
          </a>
          <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
            Sepolia
          </span>
        </div>
      </div>

      {/* Tier + Collateral */}
      <div className="rounded-xl border border-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Credit Tier</p>
          <p className="text-lg font-semibold capitalize text-foreground">{tier}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Collateral Ratio</p>
          <p className="text-lg font-semibold text-foreground">{multiplier}x</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px rounded-xl overflow-hidden border border-border">
        {[
          { label: "Repaid",    value: credit?.loansRepaid ?? 0 },
          { label: "Defaulted", value: credit?.loansDefaulted ?? 0 },
          { label: "Borrowing", value: borrowCount },
          { label: "Lending",   value: lendCount },
        ].map((s) => (
          <div key={s.label} className="bg-card px-3 py-3.5 text-center">
            <p className="text-lg font-semibold tabular-nums text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending intents */}
      {intentCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">Pending intents</span>
          <span className="text-sm font-medium text-foreground tabular-nums">{intentCount}</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
