"use client";

import { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { get } from "@/lib/ghost";
import { gUSD, gETH } from "@/lib/constants";

interface CreditInfo {
  tier: string;
  loansRepaid: number;
  loansDefaulted: number;
  collateralMultiplier: number;
}

interface ActiveLoan {
  loanId: string;
  token: string;
  principal: string;
  effectiveRate?: number;
  rate?: number;
}

const tokenSymbol = (addr: string) => {
  const l = addr.toLowerCase();
  if (l === gUSD.toLowerCase()) return "gUSD";
  if (l === gETH.toLowerCase()) return "gETH";
  return addr.slice(0, 6);
};

const tierStyle: Record<string, string> = {
  bronze: "bg-amber-500/15 text-amber-400",
  silver: "bg-zinc-400/15 text-zinc-300",
  gold: "bg-yellow-500/15 text-yellow-400",
  platinum: "bg-cyan-400/15 text-cyan-300",
};

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
      <div className="w-full max-w-xl mx-auto py-24 px-4 text-center space-y-6">
        <p className="text-muted-foreground text-sm">
          Connect your wallet to view your profile.
        </p>
        <ShimmerButton
          onClick={login}
          background="rgba(99,102,241,1)"
          className="mx-auto text-sm font-medium"
        >
          Connect Wallet
        </ShimmerButton>
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
    <div className="w-full max-w-xl mx-auto py-10 px-4 space-y-6">
      {/* Wallet */}
      <Card>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback>{addr?.slice(2, 4).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
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
            </div>
          </div>
          <Badge
            variant="outline"
            className={`capitalize ${tierStyle[tier] ?? tierStyle.bronze} border-0`}
          >
            {tier}
          </Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Repaid", value: credit?.loansRepaid ?? 0 },
          { label: "Defaulted", value: credit?.loansDefaulted ?? 0 },
          { label: "Borrowing", value: borrowCount },
          { label: "Lending", value: lendCount },
        ].map((s) => (
          <Card key={s.label} className="py-4">
            <CardContent className="text-center px-2">
              <div className="text-xl font-semibold text-foreground">
                <NumberTicker value={s.value} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Collateral & Intents */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Collateral Ratio</span>
            <span className="text-sm font-medium text-foreground">{multiplier}x</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending Intents</span>
            <span className="text-sm font-medium text-foreground">{intentCount}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network</span>
            <Badge variant="secondary" className="text-xs">Sepolia</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tier progression */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Tier Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Repay loans on time to lower your collateral requirements.
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { name: "Bronze", mult: "2x", style: "bronze" },
              { name: "Silver", mult: "1.5x", style: "silver" },
              { name: "Gold", mult: "1.25x", style: "gold" },
              { name: "Platinum", mult: "1.1x", style: "platinum" },
            ].map((t, i) => (
              <span key={t.name} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground text-xs">&rarr;</span>}
                <Badge
                  variant="outline"
                  className={`text-[11px] border-0 ${tierStyle[t.style]}`}
                >
                  {t.name} {t.mult}
                </Badge>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
