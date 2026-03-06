"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { Loader2, Shield, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { get } from "@/lib/ghost";

interface CreditInfo {
  tier: string;
  loansRepaid: number;
  loansDefaulted: number;
  collateralMultiplier: number;
  ethPrice: number;
}

const tierColors: Record<string, string> = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-gray-400 to-gray-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-400 to-cyan-200",
};

const tierBorderColors: Record<string, string> = {
  bronze: "border-amber-600/30",
  silver: "border-gray-400/30",
  gold: "border-yellow-500/30",
  platinum: "border-cyan-400/30",
};

const InfoTab = () => {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address;

  const [info, setInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInfo = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError("");
    try {
      const data = await get(`/api/v1/credit-score/${walletAddress}`);
      setInfo(data);
    } catch {
      setError("Failed to load account info.");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  if (!authenticated) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-foreground">Account Info</h1>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your credit score and account details.
          </p>
        </div>
        <button
          onClick={login}
          className="w-full text-gray-900 font-medium py-4 rounded-2xl transition-colors cursor-pointer text-lg"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-foreground">Account Info</h1>
          <p className="text-sm text-muted-foreground">
            Your credit score and protocol statistics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-red-500/10 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-foreground">Account Info</h1>
          <p className="text-sm text-muted-foreground">
            Your credit score and protocol statistics.
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          No account info available.
        </div>
      </div>
    );
  }

  const tierGradient = tierColors[info.tier] || tierColors.bronze;
  const tierBorder = tierBorderColors[info.tier] || tierBorderColors.bronze;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium text-foreground">Account Info</h1>
        <p className="text-sm text-muted-foreground">
          Your credit score and protocol statistics.
        </p>
      </div>

      {/* Credit Tier Card */}
      <div className={`bg-card border ${tierBorder} rounded-2xl px-5 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tierGradient} flex items-center justify-center`}>
              <Shield className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Credit Tier</div>
              <div className="text-xl font-semibold text-foreground capitalize">
                {info.tier}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Collateral Ratio</div>
            <div className="text-xl font-semibold text-foreground">
              {info.collateralMultiplier}x
            </div>
          </div>
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Wallet</div>
        <div className="font-mono text-xs text-foreground">
          {walletAddress}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm text-foreground">Loans Repaid</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{info.loansRepaid}</span>
        </div>

        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm text-foreground">Loans Defaulted</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{info.loansDefaulted}</span>
        </div>

        <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-sm text-foreground">ETH Price</span>
          </div>
          <span className="text-sm font-semibold text-foreground">${info.ethPrice.toFixed(0)}</span>
        </div>
      </div>

      {/* Tier Progression */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground space-y-2">
        <p className="font-medium text-foreground text-sm">Tier Progression</p>
        <p>Repay loans on time to improve your credit tier and lower your collateral requirements.</p>
        <div className="flex items-center gap-2 pt-1">
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">Bronze 2x</span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className="px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-300 font-medium">Silver 1.5x</span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">Gold 1.25x</span>
          <span className="text-muted-foreground">&rarr;</span>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">Platinum 1.1x</span>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;
