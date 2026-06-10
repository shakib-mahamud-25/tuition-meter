import { formatBDT } from '@/lib/benchmark';

interface SalaryRangeBarProps {
  min: number;
  max: number;
  p25: number;
  p75: number;
  median: number;
}

export default function SalaryRangeBar({ min, max, p25, p75, median }: SalaryRangeBarProps) {
  if (max === 0) return null;

  const range = max - min || 1;
  const p25Pct = ((p25 - min) / range) * 100;
  const p75Pct = ((p75 - min) / range) * 100;
  const medianPct = ((median - min) / range) * 100;
  const fillWidth = p75Pct - p25Pct;

  return (
    <div className="mt-6 mb-2">
      <div className="flex justify-between text-xs text-[#94A3B8] mb-3 tabular-nums">
        <span>Min: ৳{formatBDT(min)}</span>
        <span className="text-[#059669] font-semibold">Median: ৳{formatBDT(median)}</span>
        <span>Max: ৳{formatBDT(max)}</span>
      </div>

      <div className="range-bar-track">
        {/* IQR fill */}
        <div
          className="range-bar-fill"
          style={{ left: `${p25Pct}%`, width: `${fillWidth}%` }}
        />
        {/* Median tick */}
        <div
          className="range-bar-median"
          style={{ left: `${medianPct}%` }}
          title={`Median: ৳${formatBDT(median)}`}
        />
      </div>

      <div className="flex justify-between text-[10px] text-[#94A3B8] mt-3">
        <div className="text-center" style={{ marginLeft: `${p25Pct}%` }}>
          <div className="font-medium text-[#0F172A] tabular-nums">৳{formatBDT(p25)}</div>
          <div>25th pct</div>
        </div>
        <div className="text-center" style={{ marginRight: `${100 - p75Pct}%` }}>
          <div className="font-medium text-[#0F172A] tabular-nums">৳{formatBDT(p75)}</div>
          <div>75th pct</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#059669] opacity-30 rounded-sm" />
          <span>Typical range (IQR)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3 bg-[#059669] rounded" />
          <span>Median</span>
        </div>
      </div>
    </div>
  );
}
