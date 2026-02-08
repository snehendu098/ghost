import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseEther,
  formatEther,
  type Address,
  type Hex,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

// -- Config --
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "ghost-secret-key";
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || "") as Address;

// -- ABI --
export const ghostAbi = parseAbi([
  "function depositLend() payable",
  "function withdrawLend(uint256 amount)",
  "function depositCollateral() payable",
  "function withdrawCollateral(uint256 amount)",
  "function repay(uint256 loanId) payable",
  "function getLenderBalance(address) view returns (uint256)",
  "function getBorrowerCollateral(address) view returns (uint256)",
  "function getLoan(uint256) view returns (address,uint256,uint256,uint256,uint256,uint256,bool,bool)",
  "function getLoanLenders(uint256) view returns (address[],uint256[],address[],uint256[])",
  "function getOwed(uint256) view returns (uint256)",
  "function isOverdue(uint256) view returns (bool)",
  "function getRequiredCollateral(address,uint256) view returns (uint256)",
  "function getCreditScore(address) view returns (uint256)",
  "function loanCount() view returns (uint256)",
]);

// -- Clients --
export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

function loadWalletClient(envKey: string) {
  const key = process.env[envKey] as Hex;
  if (!key) throw new Error(`${envKey} not set in .env`);
  const account = privateKeyToAccount(key);
  return createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });
}

export const lender1 = loadWalletClient("LENDER1_PRIVATE_KEY");
export const lender2 = loadWalletClient("LENDER2_PRIVATE_KEY");
export const borrower1 = loadWalletClient("BORROWER1_PRIVATE_KEY");
export const borrower2 = loadWalletClient("BORROWER2_PRIVATE_KEY");

// -- Contract helpers --
export async function readContract<T>(
  functionName: string,
  args: any[] = [],
): Promise<T> {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: ghostAbi,
    functionName: functionName as any,
    args: args as any,
  }) as Promise<T>;
}

export async function writeContract(
  wallet: WalletClient<Transport, Chain, Account>,
  functionName: string,
  args: any[] = [],
  value?: bigint,
) {
  const hash = await wallet.writeContract({
    address: CONTRACT_ADDRESS,
    abi: ghostAbi,
    functionName: functionName as any,
    args: args as any,
    value,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt };
}

// -- API helpers --
export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SERVER_URL}${path}`, opts);
  return res.json() as Promise<{ ok: boolean; data?: any; error?: string }>;
}

export async function apiGet(path: string) {
  return api(path);
}

export async function apiPost(path: string, body: any) {
  return api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path: string) {
  return api(path, { method: "DELETE" });
}

export async function triggerSettle() {
  return api("/trigger/settle", {
    method: "POST",
    headers: { "x-api-key": API_KEY },
  });
}

export async function triggerLiquidate() {
  return api("/trigger/liquidate", {
    method: "POST",
    headers: { "x-api-key": API_KEY },
  });
}

// -- Utils --
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export async function waitForIndexer(ms = 3000) {
  await sleep(ms);
}

/** Poll an API endpoint until predicate is true or timeout */
export async function pollUntil(
  path: string,
  predicate: (data: any) => boolean,
  timeoutMs = 30_000,
  intervalMs = 2000,
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await apiGet(path);
    if (res.ok && predicate(res.data)) return res;
    await sleep(intervalMs);
  }
  throw new Error(`pollUntil timeout for ${path}`);
}

export { parseEther, formatEther, CONTRACT_ADDRESS };
