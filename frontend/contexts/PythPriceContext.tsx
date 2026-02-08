"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { fetchLatestPrices, createPriceStream } from "@/lib/pyth";
import { getTokenById } from "@/lib/tokens";

interface PythPriceContextValue {
  prices: Record<string, number>;
  loading: boolean;
}

const PythPriceContext = createContext<PythPriceContextValue>({
  prices: {},
  loading: true,
});

export function PythPriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    const poll = async () => {
      try {
        const p = await fetchLatestPrices();
        setPrices((prev) => ({ ...prev, ...p }));
        setLoading(false);
      } catch {
        // will retry on next interval
      }
    };
    poll();
    pollRef.current = setInterval(poll, 10_000);
  }, []);

  const startStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = createPriceStream(
      (newPrices) => {
        setPrices((prev) => ({ ...prev, ...newPrices }));
        setLoading(false);
      },
      () => {
        // SSE failed, fall back to polling
        es.close();
        esRef.current = null;
        startPolling();
      }
    );
    esRef.current = es;
  }, [startPolling]);

  useEffect(() => {
    // Initial REST fetch for immediate data
    fetchLatestPrices()
      .then((p) => {
        setPrices(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Start SSE stream for real-time updates
    startStream();

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [startStream]);

  return (
    <PythPriceContext.Provider value={{ prices, loading }}>
      {children}
    </PythPriceContext.Provider>
  );
}

export function usePythPrices() {
  return useContext(PythPriceContext);
}

export function useLivePrice(tokenId: string): number {
  const { prices } = usePythPrices();
  return prices[tokenId] ?? getTokenById(tokenId)?.price ?? 0;
}

export function useLiveRate(fromId: string, toId: string): number {
  const { prices } = usePythPrices();
  const fromPrice = prices[fromId] ?? getTokenById(fromId)?.price ?? 0;
  const toPrice = prices[toId] ?? getTokenById(toId)?.price ?? 0;
  if (toPrice === 0) return 0;
  return fromPrice / toPrice;
}
