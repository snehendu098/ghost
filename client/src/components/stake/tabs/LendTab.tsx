"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import ConnectWalletButton from "@/components/shared/ConnectWalletButton";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import {
  GHOST_DOMAIN,
  VAULT_ADDRESS,
  GUSD_ADDRESS,
  ERC20_ABI,
  VAULT_ABI,
  ts,
  encryptRate,
  ghostPost,
  ghostGet,
  fetchPoolAddress,
  fetchCREPublicKey,
  privateTransfer,
} from "@/lib/ghost";

const gUSDIcon = () => (
  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
);

const formatAmount = (wei: string) => {
  const num = Number(wei) / 1e18;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  matched: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-red-500/20 text-red-400",
};

function friendlyError(e: any): string {
  const code = e?.code ?? e?.info?.error?.code;
  if (code === "ACTION_REJECTED" || code === 4001) return "Transaction rejected by user";
  if (e?.code === "INSUFFICIENT_FUNDS") return "Insufficient funds for transaction";
  const msg = e?.shortMessage ?? e?.reason ?? e?.message ?? "Something went wrong";
  // Truncate overly verbose ethers errors
  return msg.length > 120 ? msg.slice(0, 120) + "..." : msg;
}

const STEPS = [
  "Approving gUSD",
  "Depositing to vault",
  "Initializing lend intent",
  "Transferring to pool",
  "Confirming intent",
];

interface LendIntent {
  intentId: string;
  slotId: string;
  token: string;
  amount: string;
  createdAt: number;
}

const LendTab = () => {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [duration, setDuration] = useState("30");
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const [step, setStep] = useState(-1); // -1 = idle
  const [error, setError] = useState("");
  const [intents, setIntents] = useState<LendIntent[]>([]);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const durations = ["1", "7", "14", "30", "90"];
  const isLoading = step >= 0;
  const address = user?.wallet?.address;

  const loadIntents = useCallback(async () => {
    if (!address) return;
    try {
      const data: any = await ghostGet(`/api/v1/lender-status/${address}`);
      setIntents(data.activeLends ?? []);
    } catch {
      // silent
    }
  }, [address]);

  useEffect(() => {
    loadIntents();
  }, [loadIntents]);

  const getSigner = async () => {
    const wallet = wallets.find((w) => w.walletClientType !== "privy") ?? wallets[0];
    if (!wallet) throw new Error("No wallet connected");
    await wallet.switchChain(11155111);
    const provider = await wallet.getEthereumProvider();
    const ethProvider = new ethers.BrowserProvider(provider);
    return ethProvider.getSigner();
  };

  const handleLend = async () => {
    setError("");
    try {
      const signer = await getSigner();
      const account = await signer.getAddress();
      const amountWei = ethers.parseEther(amount).toString();

      // Step 0: Approve
      setStep(0);
      const token = new ethers.Contract(GUSD_ADDRESS, ERC20_ABI, signer);
      const approveTx = await token.approve(VAULT_ADDRESS, amountWei);
      await approveTx.wait();

      // Step 1: Deposit
      setStep(1);
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const depositTx = await vault.deposit(GUSD_ADDRESS, amountWei);
      await depositTx.wait();

      // Step 2: Init
      setStep(2);
      const init: any = await ghostPost("/api/v1/deposit-lend/init", {
        account,
        token: GUSD_ADDRESS,
        amount: amountWei,
      });
      const slotId = init.slotId;

      // Step 3: Private transfer
      setStep(3);
      const poolAddr = await fetchPoolAddress();
      await privateTransfer(signer, poolAddr, GUSD_ADDRESS, amountWei);

      // Step 4: Confirm with encrypted rate
      setStep(4);
      const crePubKey = await fetchCREPublicKey();
      const encrypted = encryptRate(crePubKey, (Number(rate) / 100).toString());
      const timestamp = ts();
      const confirmMsg = { account, slotId, encryptedRate: encrypted, timestamp };
      const auth = await (signer as any).signTypedData(GHOST_DOMAIN, {
        "Confirm Deposit": [
          { name: "account", type: "address" },
          { name: "slotId", type: "string" },
          { name: "encryptedRate", type: "string" },
          { name: "timestamp", type: "uint256" },
        ],
      }, confirmMsg);
      await ghostPost("/api/v1/deposit-lend/confirm", { ...confirmMsg, auth });

      // Done
      setStep(-1);
      setAmount("");
      setRate("");
      await loadIntents();
    } catch (e: any) {
      setError(friendlyError(e));
      setStep(-1);
    }
  };

  const handleCancel = async (slotId: string) => {
    setCancelling(slotId);
    setError("");
    try {
      const signer = await getSigner();
      const account = await signer.getAddress();
      const timestamp = ts();
      const message = { account, slotId, timestamp };
      const auth = await (signer as any).signTypedData(GHOST_DOMAIN, {
        "Cancel Lend": [
          { name: "account", type: "address" },
          { name: "slotId", type: "string" },
          { name: "timestamp", type: "uint256" },
        ],
      }, message);
      await ghostPost("/api/v1/cancel-lend", { ...message, auth });
      await loadIntents();
    } catch (e: any) {
      setError(friendlyError(e));
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium text-foreground">
          Lend privately on GHOST
        </h1>
        <p className="text-sm text-muted-foreground">
          Set your rate, deposit funds. Rates are sealed — only matched inside
          CRE confidential compute.
        </p>
      </div>

      {/* Lend Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {/* Amount Input */}
        <div className="bg-muted/50 rounded-xl px-5 py-4">
          <div className="text-sm text-muted-foreground mb-3">
            Amount to lend
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                disabled={isLoading}
                className="bg-transparent text-3xl font-medium text-foreground outline-none w-full placeholder:text-muted-foreground/60"
              />
              <div className="text-xs text-muted-foreground mt-1.5">
                ${amount || "0"}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background/60 rounded-full px-3.5 py-2 border border-border">
              {gUSDIcon()}
              <span className="text-base font-semibold text-foreground">
                gUSD
              </span>
            </div>
          </div>
        </div>

        {/* Rate Input */}
        <div className="bg-muted/50 rounded-xl px-5 py-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Your interest rate (sealed)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
                className="bg-transparent text-3xl font-medium text-foreground outline-none w-full placeholder:text-muted-foreground/60"
              />
              <div className="text-xs text-muted-foreground mt-1.5">
                Encrypted with CRE public key before submission
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background/60 rounded-full px-3.5 py-2 border border-border">
              <span className="text-base font-semibold text-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Duration Selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Duration
            </span>
          </div>
          <div className="flex items-center bg-muted/50 rounded-full p-0.5 border border-border">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                disabled={isLoading}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  duration === d
                    ? "bg-muted text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {amount && rate && (
          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Lending</span>
              <span className="text-foreground font-medium">
                {amount} gUSD
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate (sealed)</span>
              <span className="text-foreground font-medium">{rate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-foreground font-medium">
                {duration} days
              </span>
            </div>
          </div>
        )}

        {/* Progress Stepper */}
        {isLoading && (
          <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 space-y-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {i < step ? (
                  <span className="text-green-400">&#10003;</span>
                ) : i === step ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <span className="text-muted-foreground/40">&#9675;</span>
                )}
                <span className={i <= step ? "text-foreground" : "text-muted-foreground/40"}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Action Button */}
        {authenticated ? (
          <button
            onClick={handleLend}
            disabled={isLoading || !amount || !rate}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 rounded-2xl transition-colors cursor-pointer text-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {STEPS[step]}...
              </>
            ) : (
              "Publish Lend Intent"
            )}
          </button>
        ) : (
          <ConnectWalletButton />
        )}
      </div>

      {/* Pending Lend Intents */}
      {authenticated && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">
            Your Lend Intents
          </h2>

          {intents.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
              No pending lend intents
            </div>
          ) : (
            <div className="space-y-2">
              {intents.map((intent) => (
                <div
                  key={intent.intentId}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {formatAmount(intent.amount)} gUSD
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {intent.intentId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors.active}`}>
                      active
                    </span>
                    <button
                      onClick={() => handleCancel(intent.slotId)}
                      disabled={cancelling === intent.slotId}
                      className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer disabled:opacity-50"
                    >
                      {cancelling === intent.slotId ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LendTab;
