"use client";

import { useState } from "react";

const networkMap: Record<string, string> = {
  ethereum: "eth",
  bnb: "bnb",
  avalanche: "avax",
  polygon: "pol",
  arbitrum: "arb",
  optimism: "op",
  solana: "sol",
  base: "base",
};

// CoinMarketCap static asset IDs
const CMC_IDS: Record<string, number> = {
  btc: 1,
  eth: 1027,
  bnb: 1839,
  sol: 5426,
  usdt: 825,
  usdc: 3408,
  avax: 5805,
  pol: 3890,
  arb: 11841,
  op: 11840,
  dai: 4943,
  link: 1975,
  base: 9195,
  wbtc: 3717,
};

const fallbackMeta: Record<string, { color: string; letter: string }> = {
  btc: { color: "#f7931a", letter: "B" },
  eth: { color: "#627eea", letter: "E" },
  bnb: { color: "#f0b90b", letter: "B" },
  sol: { color: "#9945ff", letter: "S" },
  usdt: { color: "#26a17b", letter: "T" },
  usdc: { color: "#2775ca", letter: "U" },
  avax: { color: "#e84142", letter: "A" },
  pol: { color: "#8247e5", letter: "P" },
  arb: { color: "#28a0f0", letter: "A" },
  op: { color: "#ff0420", letter: "O" },
  dai: { color: "#f5ac37", letter: "D" },
  link: { color: "#2a5ada", letter: "L" },
  base: { color: "#0052ff", letter: "B" },
  wbtc: { color: "#f09242", letter: "W" },
};

function Fallback({ iconId, size }: { iconId: string; size: number }) {
  const meta = fallbackMeta[iconId];
  const bgColor = meta?.color || "#666";
  const letter = meta?.letter || iconId.charAt(0).toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <circle cx="15" cy="15" r="15" fill={bgColor} />
      <text
        x="15"
        y="20"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {letter}
      </text>
    </svg>
  );
}

export function CryptoIcon({ id, size = 30 }: { id: string; size?: number }) {
  const iconId = networkMap[id] || id;
  const [imgError, setImgError] = useState(false);

  const cmcId = CMC_IDS[iconId];

  if (cmcId && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`}
        alt={iconId}
        width={size}
        height={size}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className="rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return <Fallback iconId={iconId} size={size} />;
}
