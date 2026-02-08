"use client";

function getScoreColor(score: number): string {
  if (score < 200) return "#555555";
  if (score < 400) return "#888888";
  if (score < 600) return "#aaaaaa";
  if (score < 800) return "#d4d4d4";
  return "#ffffff";
}

export function CreditScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const color = getScoreColor(score);
  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r; // semicircle
  const progress = (score / 1000) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <div className="text-[28px] font-bold text-white leading-none">{score}</div>
        <div className="text-[11px] text-[#666]">/ 1000</div>
      </div>
    </div>
  );
}
