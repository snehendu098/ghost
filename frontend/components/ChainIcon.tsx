"use client";

import { useState } from "react";
import { CHAIN_LOGOS } from "@/lib/wallet";
import { baseSepolia } from "viem/chains";

export function ChainIcon({ chainId, size = 18 }: { chainId: number; size?: number }) {
  const [err, setErr] = useState(false);
  const src = CHAIN_LOGOS[chainId];
  if (!src || err) {
    return (
      <div
        className="rounded-full bg-[#222] flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }
  const isBase = chainId === baseSepolia.id;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`${isBase ? "" : "rounded-full"} shrink-0`}
      onError={() => setErr(true)}
    />
  );
}
