"use client";

import InfinityHero from "./InfinityHero";
import UpgradedSection from "./UpgradedSection";
import ProvenSection from "./ProvenSection";
import YieldSourcesSection from "./YieldSourcesSection";
import IntegrationsSection from "./IntegrationsSection";
import SecuritySection from "./SecuritySection";
import LearnMoreSection from "./LearnMoreSection";
import FAQSection from "./FAQSection";

const InfinityPage = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-16">
      <InfinityHero />
      <UpgradedSection />
      <ProvenSection />
      <YieldSourcesSection />
      <IntegrationsSection />
      <SecuritySection />
      <LearnMoreSection />
      <FAQSection />
    </div>
  );
};

export default InfinityPage;
