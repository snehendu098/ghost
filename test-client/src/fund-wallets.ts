import { createPublicClient, createWalletClient, http, parseEther, formatEther, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "viem/chains";

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY as Hex;

if (!SERVER_PRIVATE_KEY) {
  console.error("SERVER_PRIVATE_KEY not set in .env");
  process.exit(1);
}

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const funderAccount = privateKeyToAccount(SERVER_PRIVATE_KEY);
const funder = createWalletClient({
  account: funderAccount,
  chain: arcTestnet,
  transport: http(),
});

const walletKeys = [
  process.env.LENDER1_PRIVATE_KEY,
  process.env.LENDER2_PRIVATE_KEY,
  process.env.BORROWER1_PRIVATE_KEY,
  process.env.BORROWER2_PRIVATE_KEY,
] as (Hex | undefined)[];

const FUND_AMOUNT = parseEther("0.5");

async function main() {
  console.log(`Funder: ${funderAccount.address}`);
  const balance = await publicClient.getBalance({ address: funderAccount.address });
  console.log(`Funder balance: ${formatEther(balance)} ETH`);

  for (const key of walletKeys) {
    if (!key) {
      console.warn("Skipping undefined wallet key");
      continue;
    }
    const account = privateKeyToAccount(key);
    const existing = await publicClient.getBalance({ address: account.address });
    if (existing >= FUND_AMOUNT) {
      console.log(`${account.address} already funded (${formatEther(existing)})`);
      continue;
    }
    console.log(`Funding ${account.address}...`);
    const hash = await funder.sendTransaction({
      to: account.address,
      value: FUND_AMOUNT,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  tx: ${hash}`);
  }
  console.log("Done!");
}

main().catch(console.error);
