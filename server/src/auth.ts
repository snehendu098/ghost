import { ethers } from "ethers";
import { config } from "./config";

export const EIP712_DOMAIN = {
  name: "GhostProtocol",
  version: "0.0.1",
  chainId: config.CHAIN_ID,
  verifyingContract: config.EXTERNAL_VAULT_ADDRESS as `0x${string}`,
};

export const MESSAGE_TYPES = {
  "Confirm Deposit": [
    { name: "account", type: "address" },
    { name: "shieldedAddress", type: "address" },
    { name: "encryptedRate", type: "string" },
    { name: "timestamp", type: "uint256" },
  ],
  "Cancel Lend": [
    { name: "account", type: "address" },
    { name: "shieldedAddress", type: "address" },
    { name: "timestamp", type: "uint256" },
  ],
} satisfies Record<string, ethers.TypedDataField[]>;

const FIVE_MINUTES = 5 * 60;

export function checkTimestamp(timestamp: number): void {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > FIVE_MINUTES) {
    throw new Error("Signature expired: timestamp outside 5-minute window");
  }
}

export function verifySignature(
  types: Record<string, ethers.TypedDataField[]>,
  message: Record<string, unknown>,
  signature: string
): string {
  return ethers.verifyTypedData(EIP712_DOMAIN, types, message, signature);
}

export function authenticate(
  primaryType: keyof typeof MESSAGE_TYPES,
  message: Record<string, unknown>,
  signature: string,
  expectedAccount: string
): void {
  checkTimestamp(Number(message.timestamp));

  const types: Record<string, ethers.TypedDataField[]> = {
    [primaryType]: [...MESSAGE_TYPES[primaryType]],
  };
  const recovered = verifySignature(types, message, signature);

  if (recovered.toLowerCase() !== expectedAccount.toLowerCase()) {
    throw new Error(
      `Signature mismatch: recovered ${recovered}, expected ${expectedAccount}`
    );
  }
}
