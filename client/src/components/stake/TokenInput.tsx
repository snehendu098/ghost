"use client";

import { ChevronDown } from "lucide-react";

interface TokenInputProps {
  label: string;
  token: string;
  tokenIcon: React.ReactNode;
  value: string;
  usdValue: string;
  onChange?: (value: string) => void;
  hasDropdown?: boolean;
  readOnly?: boolean;
}

const TokenInput = ({
  label,
  token,
  tokenIcon,
  value,
  usdValue,
  onChange,
  hasDropdown = false,
  readOnly = false,
}: TokenInputProps) => {
  return (
    <div className="bg-muted/50 rounded-xl px-5 py-4">
      <div className="text-sm text-muted-foreground mb-3">{label}</div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={readOnly}
            placeholder="0"
            className="bg-transparent text-3xl font-medium text-foreground outline-none w-full placeholder:text-muted-foreground/60"
          />
          <div className="text-xs text-muted-foreground mt-1.5">
            ${usdValue}
          </div>
        </div>

        <button className="flex items-center gap-2 bg-background/60 rounded-full px-3.5 py-2 border border-border hover:border-muted-foreground/50 transition-colors cursor-pointer">
          {tokenIcon}
          <span className="text-base font-semibold text-foreground">
            {token}
          </span>
          {hasDropdown && (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
};

export default TokenInput;
