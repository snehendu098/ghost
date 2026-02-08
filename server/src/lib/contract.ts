import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  formatEther,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

const GHOST_LENDING_ABI = parseAbi([
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
  "function executeLoan(address,address[],uint256[],address[],uint256[],uint256,uint256,uint256,uint256)",
  "function liquidate(uint256)",
  "event LendDeposited(address indexed lender, uint256 amount)",
  "event LendWithdrawn(address indexed lender, uint256 amount)",
  "event CollateralDeposited(address indexed borrower, uint256 amount)",
  "event CollateralWithdrawn(address indexed borrower, uint256 amount)",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 principal)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 totalPaid)",
  "event LoanDefaulted(uint256 indexed loanId, address indexed borrower)",
]);

const contractAddress = (process.env.CONTRACT_ADDRESS || "") as Address;
const serverKey = process.env.SERVER_PRIVATE_KEY || "";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

export const getWalletClient = () => {
  if (!serverKey) throw new Error("SERVER_PRIVATE_KEY not set");
  const account = privateKeyToAccount(serverKey as Hex);
  return createWalletClient({
    account,
    chain: arcTestnet,
    transport: http(),
  });
};

export async function readContract<T>(functionName: string, args: any[] = []): Promise<T> {
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set");
  return publicClient.readContract({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    functionName: functionName as any,
    args: args as any,
  }) as Promise<T>;
}

export async function writeContract(functionName: string, args: any[] = []) {
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set");
  const wallet = getWalletClient();
  const hash = await wallet.writeContract({
    address: contractAddress,
    abi: GHOST_LENDING_ABI,
    functionName: functionName as any,
    args: args as any,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt };
}

export { GHOST_LENDING_ABI, contractAddress, formatEther };
