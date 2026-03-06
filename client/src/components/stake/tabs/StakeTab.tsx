import StatsDisplay from "../StatsDisplay";
import StakeCard from "../StakeCard";
import PriceInfo from "../PriceInfo";

const StakeTab = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-foreground">
          Lend privately on GHOST
        </h1>
        <StatsDisplay />
      </div>

      <StakeCard />
      <PriceInfo />
    </div>
  );
};

export default StakeTab;
