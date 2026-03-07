"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowDownUp, Loader2, AlertCircle } from "lucide-react";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { get } from "@/lib/ghost";
import {
  CHAIN_ID,
  gUSD,
  gETH,
  ERC20_ABI,
  SWAP_POOL_ADDRESS,
  SWAP_POOL_ABI,
} from "@/lib/constants";

const tokens = [
  { symbol: "gUSD", name: "Ghost USD", address: gUSD, icon: "/gusd.png" },
  { symbol: "gETH", name: "Ghost ETH", address: gETH, icon: "/geth.png" },
];

type Status = "idle" | "quoting" | "approving" | "swapping" | "done" | "error";

function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return "Swap failed";
  const e = err as any;
  const code = e?.code ?? e?.info?.error?.code;
  if (code === "ACTION_REJECTED" || code === 4001) return "Transaction rejected";
  if (e?.code === "INSUFFICIENT_FUNDS") return "Insufficient funds";
  const msg = e?.shortMessage ?? e?.reason ?? e?.message ?? "Swap failed";
  return msg.length > 120 ? msg.slice(0, 120) + "..." : msg;
}

const SwapTab = () => {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [fromIdx, setFromIdx] = useState(0);
  const [amount, setAmount] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [rateLabel, setRateLabel] = useState("");
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const from = tokens[fromIdx];
  const to = tokens[fromIdx === 0 ? 1 : 0];

  const flip = () => {
    setFromIdx(fromIdx === 0 ? 1 : 0);
    setAmount("");
    setAmountOut("");
    setRateLabel("");
    setError("");
    setTxHash("");
    setStatus("idle");
  };

  // Fetch quote when amount changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const parsed = parseFloat(amount);
    if (!amount || !parsed || parsed <= 0) {
      setAmountOut("");
      setRateLabel("");
      return;
    }

    setStatus("quoting");
    debounceRef.current = setTimeout(async () => {
      try {
        const amountWei = ethers.parseEther(parsed.toString()).toString();
        const params = new URLSearchParams({
          tokenIn: from.address,
          tokenOut: to.address,
          amountIn: amountWei,
        });
        const data = await get(`/api/v1/swap-quote?${params}`);
        if (data.error) throw new Error(data.error);

        const outFormatted = parseFloat(ethers.formatEther(data.amountOut));
        setAmountOut(outFormatted.toFixed(outFormatted < 1 ? 8 : 4));
        setRateLabel(data.rate);
        setEthPrice(data.ethPrice);
        setStatus("idle");
      } catch {
        setAmountOut("");
        setRateLabel("");
        setStatus("idle");
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, from.address, to.address]);

  const handleSwap = async () => {
    const wallet = wallets[0];
    if (!wallet || !amount || !amountOut) return;

    setError("");
    try {
      await wallet.switchChain(CHAIN_ID);
      const ethereumProvider = await wallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();

      const amountInWei = ethers.parseEther(amount);
      // 1% slippage tolerance
      const minOut = (ethers.parseEther(amountOut) * BigInt(99)) / BigInt(100);

      // Step 1: Approve
      setStatus("approving");
      const token = new ethers.Contract(from.address, ERC20_ABI, signer);
      const approveTx = await token.approve(SWAP_POOL_ADDRESS, amountInWei);
      await approveTx.wait();

      // Step 2: Swap
      setStatus("swapping");
      const pool = new ethers.Contract(SWAP_POOL_ADDRESS, SWAP_POOL_ABI, signer);
      const swapTx = await pool.swap(from.address, to.address, amountInWei, minOut);
      await swapTx.wait();

      setTxHash(swapTx.hash);
      setStatus("done");
      setAmount("");
      setAmountOut("");
    } catch (err: unknown) {
      setError(friendlyError(err));
      setStatus("error");
    }
  };

  const handleInput = (v: string) => {
    if (v === "" || /^\d*\.?\d*$/.test(v)) {
      setAmount(v);
      if (status === "done" || status === "error") setStatus("idle");
      setError("");
    }
  };

  const isProcessing = status === "approving" || status === "swapping";
  const canSwap = amount && parseFloat(amount) > 0 && amountOut && !isProcessing;

  return (
    <div className="space-y-5 py-4">
      <div>
        <h1 className="text-xl font-medium text-foreground">Swap</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Swap tokens on-chain via the GHOST swap pool.
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
              {status === "quoting" ? (
                <Loader2 className="w-6 h-6 animate-spin inline text-muted-foreground/40" />
              ) : (
                amountOut || "0.00"
              )}
            </p>
            <div className="flex items-center gap-2.5 bg-muted/60 rounded-full pl-2 pr-3.5 py-1.5 shrink-0">
              <img src={to.icon} alt="" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">{to.symbol}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rate info */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{rateLabel || `Enter amount for quote`}</span>
        <span>Sepolia</span>
      </div>

      {/* Status feedback */}
      {status === "approving" && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-muted/50 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Approving {from.symbol}...</span>
        </div>
      )}
      {status === "swapping" && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-muted/50 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Swapping {from.symbol} for {to.symbol}...</span>
        </div>
      )}
      {status === "done" && (
        <div className="text-sm px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 space-y-1">
          <span>Swap successful!</span>
          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-emerald-400/70 hover:text-emerald-300 underline underline-offset-2 truncate"
            >
              View on Etherscan: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          )}
        </div>
      )}
      {status === "error" && error && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-red-500/10 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Action */}
      {authenticated ? (
        <button
          onClick={handleSwap}
          disabled={!canSwap}
          className="w-full text-gray-900 font-semibold py-3.5 rounded-xl transition-colors cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#e2a9f1" }}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {status === "approving" ? "Approving..." : "Swapping..."}
            </span>
          ) : canSwap ? (
            "Swap"
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

      {/* Pool info */}
      {ethPrice && (
        <div className="text-center text-xs text-muted-foreground/60">
          ETH/USD: ${ethPrice.toFixed(2)} (Chainlink)
        </div>
      )}
    </div>
  );
};

export default SwapTab;
