"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createPublicClient, http } from "viem";
import { useWallet } from "@/contexts/WalletContext";
import {
  GATEWAY_CONFIG,
  gatewayChains,
  getDomainName,
  getGatewayChainByChainId,
  ERC20_APPROVE_ABI,
  GATEWAY_DEPOSIT_ABI,
} from "@/lib/gateway-contracts";

// Gateway testnet supported domains
const GATEWAY_TESTNET_DOMAINS = new Set([0, 1, 6, 26]);
const gatewayBalanceChains = gatewayChains.filter((c) => GATEWAY_TESTNET_DOMAINS.has(c.domain));

export interface GatewayBalance {
  domain: number;
  chainName: string;
  balance: string;
}

interface GatewayState {
  balances: GatewayBalance[];
  totalBalance: number;
  loading: boolean;
  depositing: boolean;
  depositStatus: string;
  refresh: () => void;
  approveAndDeposit: (chainId: number, amount: bigint) => Promise<void>;
}

const GatewayContext = createContext<GatewayState>({
  balances: [],
  totalBalance: 0,
  loading: false,
  depositing: false,
  depositStatus: "",
  refresh: () => {},
  approveAndDeposit: async () => {},
});

export function useGateway() {
  return useContext(GatewayContext);
}

export function GatewayProvider({ children }: { children: ReactNode }) {
  const { address: walletAddress, walletClient, switchChain } = useWallet();

  const [balances, setBalances] = useState<GatewayBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [depositStatus, setDepositStatus] = useState("");

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) {
      setBalances([]);
      return;
    }

    setLoading(true);
    try {
      const sources = gatewayBalanceChains.map((chain) => ({
        domain: chain.domain,
        depositor: walletAddress,
      }));

      const response = await fetch(`${GATEWAY_CONFIG.TESTNET_URL}/balances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "USDC", sources }),
      });

      if (response.ok) {
        const data = await response.json();
        const gwBalances: GatewayBalance[] = (data.balances || []).map(
          (b: { domain: number; balance: string }) => ({
            domain: b.domain,
            chainName: getDomainName(b.domain),
            balance: b.balance,
          })
        );
        setBalances(gwBalances);
      }
    } catch {
      // Gateway may not be available in dev
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
    }
  }, [walletAddress, fetchBalances]);

  const totalBalance = balances.reduce(
    (sum, b) => sum + parseFloat(b.balance || "0"),
    0
  );

  // Ref to keep fetchBalances stable for polling without stale closures
  const fetchBalancesRef = useRef(fetchBalances);
  fetchBalancesRef.current = fetchBalances;

  const approveAndDeposit = useCallback(
    async (chainId: number, amount: bigint) => {
      if (!walletClient || !walletAddress) throw new Error("Wallet not connected");

      const gwChain = getGatewayChainByChainId(chainId);
      if (!gwChain) throw new Error(`No Gateway config for chain ${chainId}`);

      const publicClient = createPublicClient({
        transport: http(gwChain.testnet.RPC),
      });

      setDepositing(true);
      try {
        const usdcAddress = gwChain.testnet.USDCAddress as `0x${string}`;
        const gatewayWallet = gwChain.testnet.GatewayWallet as `0x${string}`;

        // Switch to the deposit chain if needed
        await switchChain(chainId);

        // 1. Approve USDC spend
        setDepositStatus("Approving USDC...");
        const approveTx = await walletClient.writeContract({
          address: usdcAddress,
          abi: ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [gatewayWallet, amount],
          chain: null,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });

        // 2. Deposit into Gateway Wallet
        setDepositStatus("Depositing...");
        const depositTx = await walletClient.writeContract({
          address: gatewayWallet,
          abi: GATEWAY_DEPOSIT_ABI,
          functionName: "deposit",
          args: [usdcAddress, amount],
          chain: null,
        });
        await publicClient.waitForTransactionReceipt({ hash: depositTx });

        // 3. Poll balances until they change (handles finality delay)
        setDepositStatus("Waiting for finality...");
        const prevTotal = balances.reduce(
          (sum, b) => sum + parseFloat(b.balance || "0"),
          0
        );
        for (let i = 0; i < 6; i++) {
          await fetchBalancesRef.current();
          // Re-check after fetch — need to read from state indirectly
          // Since fetchBalances updates state, we re-fetch and compare
          const resp = await fetch(`${GATEWAY_CONFIG.TESTNET_URL}/balances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: "USDC",
              sources: gatewayBalanceChains.map((c) => ({ domain: c.domain, depositor: walletAddress })),
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            const newTotal = (data.balances || []).reduce(
              (sum: number, b: { balance: string }) => sum + parseFloat(b.balance || "0"),
              0
            );
            if (newTotal !== prevTotal) break;
          }
          if (i < 5) await new Promise((r) => setTimeout(r, 5000));
        }
      } finally {
        setDepositing(false);
        setDepositStatus("");
      }
    },
    [walletClient, walletAddress, switchChain, balances]
  );

  return (
    <GatewayContext.Provider
      value={{ balances, totalBalance, loading, depositing, depositStatus, refresh: fetchBalances, approveAndDeposit }}
    >
      {children}
    </GatewayContext.Provider>
  );
}
