import { BenchmarkStats } from '@/lib/types';
import { formatBDT, generateInsight } from '@/lib/benchmark';
import ConfidenceBadge from '@/components/ui/ConfidenceBadge';
import SalaryRangeBar from './SalaryRangeBar';

interface BenchmarkResultProps {
  stats: BenchmarkStats | null;
  loading: boolean;
  filtersApplied: boolean;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
      <div className="text-xs text-[#94A3B8] font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-bold text-[#0F172A] tabular-nums">{value}</div>
      {sub && <div className="text-xs text-[#94A3B8] mt-0.5">{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
      <div className="skeleton h-3 w-16 mb-2" />
      <div className="skeleton h-6 w-24" />
    </div>
  );
}

export default function BenchmarkResult({ stats, loading, filtersApplied }: BenchmarkResultProps) {
  if (!filtersApplied && !loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#94A3B8]">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 12H9v-4h2v4zm0-6H9V6h2v2z" fill="currentColor"/>
          </svg>
        </div>
        <h3 className="font-semibold text-[#0F172A] mb-2">Select filters to benchmark</h3>
        <p className="text-sm text-[#94A3B8] max-w-xs mx-auto">
          Use the filters on the left to narrow down by area, level, curriculum, or university.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-7 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="skeleton h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!stats) return null;

  if (stats.sample_size === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 12H9v-2h2v2zm0-4H9V6h2v4z" fill="#DC2626"/>
          </svg>
        </div>
        <h3 className="font-semibold text-[#0F172A] mb-2">No data for these filters</h3>
        <p className="text-sm text-[#94A3B8]">Try broadening your search criteria.</p>
      </div>
    );
  }

  const insight = generateInsight(stats);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-[#0F172A]">Salary Benchmark</h2>
        <ConfidenceBadge level={stats.confidence} sampleSize={stats.sample_size} />
      </div>

      {/* Insight box */}
      <div className="bg-[#F0FDF4] border border-[#A7F3D0] rounded-lg px-4 py-3">
        <p className="text-sm text-[#065F46] font-medium leading-relaxed">{insight}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Average"
          value={`৳${formatBDT(stats.average)}`}
          sub="per month"
        />
        <StatCard
          label="Median"
          value={`৳${formatBDT(stats.median)}`}
          sub="50th percentile"
        />
        <StatCard
          label="Sample Size"
          value={stats.sample_size.toString()}
          sub="reports (18 mo)"
        />
        <StatCard
          label="Lowest"
          value={`৳${formatBDT(stats.min)}`}
        />
        <StatCard
          label="Highest"
          value={`৳${formatBDT(stats.max)}`}
        />
        <StatCard
          label="IQR Range"
          value={`৳${formatBDT(stats.p25)}–${formatBDT(stats.p75)}`}
          sub="middle 50%"
        />
      </div>

      {/* Salary range bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-1">Salary Distribution</h3>
        <p className="text-xs text-[#94A3B8] mb-2">Visual range across all matching reports</p>
        <SalaryRangeBar
          min={stats.min}
          max={stats.max}
          p25={stats.p25}
          p75={stats.p75}
          median={stats.median}
        />
      </div>
    </div>
  );
}
