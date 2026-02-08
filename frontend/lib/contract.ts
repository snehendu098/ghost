import { defineChain, getContract, prepareContractCall, readContract } from "thirdweb";
import { thirdwebClient } from "./thirdweb-client";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const arcChain = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  rpc: "https://rpc-testnet.arc.xyz",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  blockExplorers: [{ name: "Arc Explorer", url: "https://testnet.arc.xyz" }],
});

export const GHOST_ABI = [
  "function lenderBalances(address) view returns (uint256)",
  "function borrowerCollateral(address) view returns (uint256)",
  "function loanCount() view returns (uint256)",
  "function getLenderBalance(address) view returns (uint256)",
  "function getBorrowerCollateral(address) view returns (uint256)",
  "function getLoan(uint256) view returns (address,uint256,uint256,uint256,uint256,uint256,bool,bool)",
  "function getLoanLenders(uint256) view returns (address[],uint256[],address[],uint256[])",
  "function getOwed(uint256) view returns (uint256)",
  "function isOverdue(uint256) view returns (bool)",
  "function getRequiredCollateral(address,uint256) view returns (uint256)",
  "function getCreditScore(address) view returns (uint256)",
  "function depositLend() payable",
  "function withdrawLend(uint256)",
  "function depositCollateral() payable",
  "function withdrawCollateral(uint256)",
  "function repay(uint256) payable",
  "event LendDeposited(address indexed lender, uint256 amount)",
  "event CollateralDeposited(address indexed borrower, uint256 amount)",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 principal)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalPaid)",
  "event LoanDefaulted(uint256 indexed loanId, address indexed borrower)",
] as const;

export function getGhostContract() {
  return getContract({
    client: thirdwebClient,
    chain: arcChain,
    address: CONTRACT_ADDRESS,
  });
}

// ── Read helpers ──

export function readLenderBalance(address: string) {
  return readContract({
    contract: getGhostContract(),
    method: "function getLenderBalance(address) view returns (uint256)",
    params: [address],
  });
}

export function readBorrowerCollateral(address: string) {
  return readContract({
    contract: getGhostContract(),
    method: "function getBorrowerCollateral(address) view returns (uint256)",
    params: [address],
  });
}

export function readCreditScore(address: string) {
  return readContract({
    contract: getGhostContract(),
    method: "function getCreditScore(address) view returns (uint256)",
    params: [address],
  });
}

export function readRequiredCollateral(address: string, amount: bigint) {
  return readContract({
    contract: getGhostContract(),
    method: "function getRequiredCollateral(address,uint256) view returns (uint256)",
    params: [address, amount],
  });
}

export function readOwed(loanId: bigint) {
  return readContract({
    contract: getGhostContract(),
    method: "function getOwed(uint256) view returns (uint256)",
    params: [loanId],
  });
}

// ── Write helpers (return prepared transactions for sendTransaction) ──

export function prepareDepositLend(amountWei: bigint) {
  return prepareContractCall({
    contract: getGhostContract(),
    method: "function depositLend() payable",
    params: [],
    value: amountWei,
  });
}

export function prepareDepositCollateral(amountWei: bigint) {
  return prepareContractCall({
    contract: getGhostContract(),
    method: "function depositCollateral() payable",
    params: [],
    value: amountWei,
  });
}

export function prepareRepay(loanId: bigint, amountWei: bigint) {
  return prepareContractCall({
    contract: getGhostContract(),
    method: "function repay(uint256) payable",
    params: [loanId],
    value: amountWei,
  });
}
