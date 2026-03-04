import { Check, ArrowLeftRight, ChevronDown } from "lucide-react";

const PriceInfo = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Best Price</span>
        <Check className="w-4 h-4 text-emerald-400" />
      </div>

      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <span>1 SOL</span>
        <ArrowLeftRight className="w-3.5 h-3.5" />
        <span>0.710874514 INF</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default PriceInfo;
