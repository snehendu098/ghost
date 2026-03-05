function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

export const config = {
  POOL_PRIVATE_KEY: required("POOL_PRIVATE_KEY"),
  TOKEN_ADDRESS: required("TOKEN_ADDRESS"),
  CRE_PUBLIC_KEY: required("CRE_PUBLIC_KEY"),
  EXTERNAL_API_URL:
    process.env.EXTERNAL_API_URL ??
    "https://convergence2026-token-api.cldev.cloud",
  EXTERNAL_VAULT_ADDRESS:
    process.env.EXTERNAL_VAULT_ADDRESS ??
    "0xE588a6c73933BFD66Af9b4A07d48bcE59c0D2d13",
  CHAIN_ID: Number(process.env.CHAIN_ID ?? "11155111"),
  PORT: Number(process.env.PORT ?? "3000"),
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY ?? "",
};
