# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start dev server (Next.js + Turbopack)
bun run build    # Production build
bun run lint     # ESLint (uses Next.js defaults, no .eslintrc)
bun add <pkg> --no-cache  # Install packages (use --no-cache for large deps)
```

No test framework is configured.

## Architecture

Ghost Protocol is a USDC-only batch auction fixed-rate lending platform with risk tranches and on-chain credit scores, built with Next.js 16 (App Router), React 19, and Tailwind CSS 4. Uses Thirdweb v5 ConnectButton for wallet connection and Circle Gateway for cross-chain USDC.

### Key Patterns

- **All page/component code is client-side** (`"use client"`) — wallet hooks, animations require it. Only `layout.tsx` is a server component.
- **Providers pattern**: `app/providers.tsx` wraps the app with `ThirdwebProvider` + `PythPriceProvider` + `GatewayProvider`.
- **Navbar**: `components/Navbar.tsx` — shared client component in `layout.tsx`. Nav links: Lend (`/`), Borrow (`/borrow`), Markets (`/markets`), Portfolio (`/portfolio`). Uses `usePathname()` with `startsWith` for active state, Thirdweb `ConnectButton` for wallet connect/disconnect.
- **Thirdweb Wallet**: `lib/thirdweb-client.ts` — creates thirdweb client with `NEXT_PUBLIC_TW_CLIENT_ID`. Use `useActiveAccount()` from `thirdweb/react` for wallet address. `ConnectButton` handles MetaMask, Coinbase, etc.
- **Circle Gateway**: `contexts/GatewayContext.tsx` — queries Gateway API for cross-chain USDC balances. Uses `useActiveAccount()` for wallet address. `components/GatewayBalance.tsx` displays them. `lib/gateway-contracts.ts` has chain configs for ETH-SEPOLIA, Base Sepolia, Avalanche Fuji.
- **Token/Network data**: `lib/tokens.ts` — token and network lists with mock prices. Helpers: `getTokenById()`, `getNetworkById()`, `getRate()`, `getTokensForNetwork()`.
- **Ghost Protocol data**: `lib/ghost-data.ts` — USDC-only lending protocol mock data. Types: `CreditScore`, `Market`, `Epoch`, `LendPosition`, `BorrowPosition`, `LoanHistory`. Single USDC market only. Mock generators: `getMockCreditScore()`, `getMockMarkets()` (1 USDC market), `getMockEpochs()`, `getMockLendPositions()`, `getMockActiveBorrows()`, `getMockLoanHistory()`. Collateral tiers: score-based (0→150%, 600+→100%). Helpers: `fmtCompact()`, `fmtUsd()`, `getMarketSymbol()`, `getMarketAsset()`.
- **Seeded random for deterministic mock data**: Custom `seededRandom()` (LCG algorithm) + `hashStr()`. Produces consistent output across rerenders.
- **Path aliases**: `@/*` maps to project root (e.g., `import { cn } from "@/lib/utils"`).

### Live Price Data (Pyth Hermes)

`lib/pyth.ts` defines Pyth feed IDs for 12 tokens and provides REST/SSE helpers. `contexts/PythPriceContext.tsx` manages the price lifecycle:

1. On mount: REST fetch via `fetchLatestPrices()` for initial prices
2. Opens SSE stream via `createPriceStream()` for real-time updates
3. Falls back to 10-second REST polling if SSE fails

Hooks for components:
- `usePythPrices()` — full `{ prices: Record<string, number>, loading }` state
- `useLivePrice(tokenId)` — single token price, falls back to static `token.price`
- `useLiveRate(fromId, toId)` — exchange rate between two tokens

**Critical**: Pyth Hermes batch requests 404 if ANY feed ID is invalid — all prices fail. Price calculation: `parseInt(price.price) * 10^(price.expo)`.

### Shared Components

- **CryptoIcon** (`components/CryptoIcon.tsx`): Token/network icons from CoinMarketCap CDN. Fallback: colored circle with first letter.
- **SelectModal** (`components/SelectModal.tsx`): Generic dark-themed modal with search for selecting tokens or networks.
- **CreditScoreGauge** (`components/CreditScoreGauge.tsx`): Semicircular SVG arc gauge (0-1000), grayscale brightness by range.
- **EpochCountdown** (`components/EpochCountdown.tsx`): Live countdown timer via `setInterval`.
- **HealthBar** (`components/HealthBar.tsx`): Linear grayscale bar for collateral health ratio.
- **TrancheToggle** (`components/TrancheToggle.tsx`): Senior/junior tranche selector with rate display.
- **GatewayBalance** (`components/GatewayBalance.tsx`): Cross-chain USDC balance display from Gateway API.
- **DotPattern** (`components/ui/dot-pattern.tsx`): Animated background dots.

### Styling

- **Tailwind CSS 4** with `@theme inline {}` in `globals.css` — no `tailwind.config.js`.
- Colors are hardcoded hex values. Use `cn()` from `lib/utils.ts` for conditional class merging.
- **Icons**: Lucide React for standard icons, `CryptoIcon` for token/network icons.
- **Fonts**: Geist Sans + Geist Mono via `next/font/google` CSS variables.

### Design Tokens (Noir B&W Theme)

- Background: `#000000` (pure black), card: `#0a0a0a`, panel: `#050505`, hover: `#080808`
- Active/selected bg: `#111111`
- Accent/CTA: `#ffffff` (white) — buttons, highlights, selected states
- Borders: `#1a1a1a` (primary), `#222222` (secondary)
- Positive/senior tranche: `#d4d4d4`, Junior tranche: `#888888`, Negative/error: `#555555`
- CreditScoreGauge bands: `#555` (<200), `#888` (200-400), `#aaa` (400-600), `#d4d4d4` (600-800), `#fff` (800+)
- HealthBar: `#d4d4d4` (healthy), `#fff` (warning), `#555` (danger)
- Crypto brand colors (in `lib/tokens.ts`, `CryptoIcon.tsx`) are **kept as-is** for token recognition

### Pages

- **`/` (Lend)**: Lending interface. Overview stats (Total Lent, Earnings, Avg APY, Active Bids). Expandable USDC market card with Place Bid form (TrancheToggle, min rate, amount + shortcuts, duration pills, summary) and Your Positions view.
- **`/borrow`**: Borrowing interface. Credit score banner with CreditScoreGauge. Borrow form (hardcoded USDC market, amount, max rate, collateral asset via SelectModal, duration pills, summary). Active borrows table with HealthBar per position.
- **`/markets`**: USDC lending market overview (full-width card with epoch countdown, senior/junior rates, supply/demand, utilization bar, Lend/Borrow CTAs). Epochs tab with historical epoch table.
- **`/portfolio`**: Overview tab (CreditScoreGauge, Gateway balance, lending positions, borrow positions with HealthBar). Loan History tab (repaid/late/default with credit score impact). Rewards tab (Ghost Points + credit score boost).

## Environment Variables

- `NEXT_PUBLIC_TW_CLIENT_ID` — Thirdweb client ID (in `.env.local`)
