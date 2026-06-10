import { ConfidenceLevel } from '@/lib/types';

const config: Record<ConfidenceLevel, { label: string; bg: string; text: string; dot: string }> = {
  high: {
    label: 'High Confidence',
    bg: 'bg-[#D1FAE5]',
    text: 'text-[#059669]',
    dot: 'bg-[#059669]',
  },
  medium: {
    label: 'Medium Confidence',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#D97706]',
    dot: 'bg-[#D97706]',
  },
  low: {
    label: 'Low Confidence',
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#DC2626]',
    dot: 'bg-[#DC2626]',
  },
};

export default function ConfidenceBadge({
  level,
  sampleSize,
}: {
  level: ConfidenceLevel;
  sampleSize: number;
}) {
  const c = config[level];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
      <span className={`text-xs ${c.text} opacity-70`}>({sampleSize} reports)</span>
    </div>
  );
}
