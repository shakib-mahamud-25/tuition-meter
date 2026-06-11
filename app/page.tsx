import Link from 'next/link'
import { fetchSiteStats } from '../lib/benchmark'

async function SiteStats() {
  try {
    const stats = await fetchSiteStats()
    const items = [
      { value: stats.total_reports.toLocaleString(), label: 'Salary Reports' },
      { value: stats.areas_covered.toString(), label: 'Areas Covered' },
      { value: stats.universities_covered.toString(), label: 'Universities' },
      { value: stats.subjects_covered.toString(), label: 'Subjects' },
    ]
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 max-w-2xl mx-auto">
        {items.map(item => (
          <div key={item.label} className="text-center">
            <p className="text-3xl font-bold text-white tabular-nums">{item.value}</p>
            <p className="text-slate-400 text-sm mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    )
  } catch {
    return null
  }
}

export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-[#0F172A] px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#059669]/20 text-[#059669] text-xs font-semibold rounded-full mb-6 border border-[#059669]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            Community-powered · Fully anonymous
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Know the Market Rate<br />
            <span className="text-[#059669]">Before Accepting a Tuition</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            TuitionMeter is Bangladesh&apos;s community-driven salary benchmark for private tutors.
            Real data, submitted anonymously by tutors like you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/benchmark"
              className="px-7 py-3.5 bg-[#059669] hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Check Market Rate →
            </Link>
            <Link
              href="/submit"
              className="px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors text-sm border border-white/20"
            >
              Submit Tuition Salary
            </Link>
          </div>
        </div>
        <SiteStats />
      </section>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How TuitionMeter works</h2>
            <p className="text-slate-500 mt-3">Three steps. Zero personal data.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Submit anonymously',
                desc: 'Share your tuition details — area, student level, subjects, days, and salary. No name, no contact, no personal info.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ),
              },
              {
                step: '2',
                title: 'Data is aggregated',
                desc: 'Your report is reviewed and added to the pool. Statistics are calculated across all approved reports.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <rect x="2" y="9" width="3" height="13" /><rect x="9.5" y="5" width="3" height="17" />
                    <rect x="17" y="1" width="3" height="21" />
                  </svg>
                ),
              },
              {
                step: '3',
                title: 'Get instant benchmarks',
                desc: 'Filter by area, student level, curriculum, or your university. See median salary, IQR range, and confidence level.',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                ),
              },
            ].map(item => (
              <div key={item.step} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-slate-800 text-base mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benchmark Quality Explainer ─────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How benchmark quality works</h2>
            <p className="text-slate-500 mt-3">Every result shows a confidence level so you know how much to trust it.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                badge: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', dot: 'bg-[#DC2626]', label: 'Low Confidence' },
                threshold: 'Fewer than 10 reports',
                desc: 'Not enough data to be reliable. Treat this as a rough signal, not a market rate.',
              },
              {
                badge: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', dot: 'bg-[#D97706]', label: 'Moderate Confidence' },
                threshold: '10 – 49 reports',
                desc: 'A reasonable sample. The benchmark is useful but may shift as more data comes in.',
              },
              {
                badge: { bg: 'bg-[#D1FAE5]', text: 'text-[#059669]', dot: 'bg-[#059669]', label: 'High Confidence' },
                threshold: '50+ reports',
                desc: 'A solid, reliable benchmark. This reflects the actual market rate for this category.',
              },
            ].map(item => (
              <div key={item.badge.label} className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${item.badge.bg} ${item.badge.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.badge.dot}`} />
                  {item.badge.label}
                </span>
                <p className="text-slate-700 font-semibold text-sm mb-2">{item.threshold}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why TuitionMeter ────────────────────────────────────── */}
      <section className="bg-[#0F172A] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-[#059669] text-xs font-semibold uppercase tracking-widest mb-4">The Problem</p>
            <h2 className="text-2xl font-bold text-white mb-4">Information asymmetry in private tutoring</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Bangladesh has millions of private tutors, yet there is no shared salary data.
              Parents don&apos;t know what&apos;s fair. Tutors don&apos;t know if they&apos;re being underpaid.
              Every negotiation starts with no reference point.
            </p>
          </div>
          <div>
            <p className="text-[#059669] text-xs font-semibold uppercase tracking-widest mb-4">Our Approach</p>
            <h2 className="text-2xl font-bold text-white mb-4">Community data, moderated and aggregated</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              TuitionMeter collects anonymous salary reports from tutors, moderates each submission,
              then surfaces statistical benchmarks — median, IQR, weighted average — filtered by
              area, student level, curriculum, and tutor background. Every query shows a confidence
              level based on sample size.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA strip ───────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto text-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to benchmark?</h2>
          <p className="text-slate-500 text-sm mb-7">
            Check what tutors in your area earn, or add your salary to help the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/benchmark"
              className="px-7 py-3 bg-[#059669] hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              View Benchmarks
            </Link>
            <Link
              href="/submit"
              className="px-7 py-3 border border-[#E2E8F0] hover:border-[#059669] text-slate-700 hover:text-[#059669] font-semibold rounded-xl transition-colors text-sm"
            >
              Submit Your Salary
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
