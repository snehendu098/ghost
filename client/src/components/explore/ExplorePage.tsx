"use client";

import HeroSection from "./HeroSection";
import FeaturedCarousel from "./FeaturedCarousel";
import FilterBar from "./FilterBar";
import PoolTable from "./PoolTable";

const ExplorePage = () => {
  return (
    <div className="w-full max-w-6xl mx-auto py-10 space-y-8 px-4">
      <HeroSection />
      <FeaturedCarousel />
      <FilterBar />
      <PoolTable />
    </div>
  );
};

export default ExplorePage;
