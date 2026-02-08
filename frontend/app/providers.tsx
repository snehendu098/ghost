"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { PythPriceProvider } from "@/contexts/PythPriceContext";
import { GatewayProvider } from "@/contexts/GatewayContext";
import { IdentityProvider } from "@/contexts/IdentityContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <IdentityProvider>
        <PythPriceProvider>
          <GatewayProvider>
            {children}
          </GatewayProvider>
        </PythPriceProvider>
      </IdentityProvider>
    </ThirdwebProvider>
  );
}
