"use client";

import { useState } from "react";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ts } from "@/lib/ghost";
import {
  CHAIN_ID,
  gUSD,
  gETH,
  EXTERNAL_DOMAIN,
  PRIVATE_TRANSFER_TYPES,
  EXTERNAL_API,
} from "@/lib/constants";

const tokens = [
  { symbol: "gUSD", name: "Ghost USD", address: gUSD, icon: "/gusd.png" },
  { symbol: "gETH", name: "Ghost ETH", address: gETH, icon: "/geth.png" },
];

const SwapTab = () => {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [fromIdx, setFromIdx] = useState(0);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const from = tokens[fromIdx];
  const to = tokens[fromIdx === 0 ? 1 : 0];

  const flip = () => {
    setFromIdx(fromIdx === 0 ? 1 : 0);
    setAmount("");
    setError("");
    setSuccess("");
  };

  const handleSwap = async () => {
    const wallet = wallets[0];
    if (!wallet || !amount) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await wallet.switchChain(CHAIN_ID);
      const ethereumProvider = await wallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const timestamp = ts();
      const weiAmount = ethers.parseEther(amount).toString();

      const message = {
        sender: account,
        recipient: account,
        token: from.address,
        amount: weiAmount,
        flags: ["swap", to.address],
        timestamp,
      };
      const auth = await signer.signTypedData(
        EXTERNAL_DOMAIN,
        PRIVATE_TRANSFER_TYPES,
        message
      );

      const res = await fetch(`${EXTERNAL_API}/private-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          recipient: account,
          token: from.address,
          amount: weiAmount,
          flags: ["swap", to.address],
          timestamp,
          auth,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Swap failed");

      setSuccess(`Swapped ${amount} ${from.symbol} → ${to.symbol}`);
      setAmount("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInput = (v: string) => {
    if (v === "" || /^\d*\.?\d*$/.test(v)) setAmount(v);
  };

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="text-xl font-medium text-foreground">Swap</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Private token swap via sealed transfer.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* From */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-xs text-muted-foreground mb-3">You pay</p>
          <div className="flex items-center gap-4">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-[28px] font-medium text-foreground outline-none flex-1 min-w-0 placeholder:text-muted-foreground/40"
            />
            <div className="flex items-center gap-2.5 bg-muted/60 rounded-full pl-2 pr-3.5 py-1.5 shrink-0">
              <img src={from.icon} alt="" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">{from.symbol}</span>
            </div>
          </div>
        </div>

        {/* Divider + Flip */}
        <div className="relative h-0">
          <div className="absolute inset-x-5 border-t border-border" />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={flip}
              className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* To */}
        <div className="px-5 pt-5 pb-5">
          <p className="text-xs text-muted-foreground mb-3">You receive</p>
          <div className="flex items-center gap-4">
            <p className="text-[28px] font-medium text-muted-foreground/40 flex-1 min-w-0 truncate">
              {amount || "0.00"}
            </p>
            <div className="flex items-center gap-2.5 bg-muted/60 rounded-full pl-2 pr-3.5 py-1.5 shrink-0">
              <img src={to.icon} alt="" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">{to.symbol}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>1 {from.symbol} = 1 {to.symbol}</span>
        <span>Sepolia</span>
      </div>

      {/* Feedback */}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      {/* Action */}
      {authenticated ? (
        <button
          onClick={handleSwap}
          disabled={submitting || !amount || parseFloat(amount) <= 0}
          className="w-full text-gray-900 font-semibold py-3.5 rounded-xl transition-colors cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Swapping...
            </span>
          ) : amount && parseFloat(amount) > 0 ? (
            `Swap ${from.symbol} → ${to.symbol}`
          ) : (
            "Enter an amount"
          )}
        </button>
      ) : (
        <button
          onClick={login}
          className="w-full text-gray-900 font-semibold py-3.5 rounded-xl transition-colors cursor-pointer text-sm"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default SwapTab;
