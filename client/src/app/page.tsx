"use client";

import StakePage from "@/components/stake/StakePage";
import ExplorePage from "@/components/explore/ExplorePage";
import InfinityPage from "@/components/infinity/InfinityPage";
import { useNavigation } from "@/components/providers/navigation-provider";

export default function Home() {
  const { activePage } = useNavigation();

  if (activePage === "Explore") return <ExplorePage />;
  if (activePage === "Infinity") return <InfinityPage />;
  return <StakePage />;
}
