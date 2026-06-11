import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — How TuitionMeter Works',
  description: 'Learn about TuitionMeter\'s mission, methodology, and privacy approach.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      {/* Mission */}
      <div className="bg-[#0F172A] rounded-2xl p-8 mb-10">
        <p className="text-[#059669] text-xs font-semibold uppercase tracking-widest mb-3">Our Mission</p>
        <blockquote className="text-white text-xl sm:text-2xl font-semibold leading-snug">
          &ldquo;Reduce information asymmetry in Bangladesh&apos;s private tutoring market — one anonymous report at a time.&rdquo;
        </blockquote>
      </div>

      {/* Methodology */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-6">How the benchmark is calculated</h2>
        <div className="space-y-4">
          {[
            {
              num: '01',
              title: 'Anonymous submission',
              desc: 'Tutors submit salary data along with area, student level, curriculum, subjects, schedule, and university background. No personal information is collected.',
            },
            {
              num: '02',
              title: 'Moderation',
              desc: 'Every submission is manually reviewed before entering the data pool. Suspicious entries (extreme salary values, rapid submissions) are flagged for closer inspection.',
            },
            {
              num: '03',
              title: 'Statistical aggregation',
              desc: 'Approved reports are aggregated using standard percentile calculations. The median, P25, P75, min, and max are unweighted. The average is freshness-weighted — more recent reports count more.',
            },
            {
              num: '04',
              title: 'Confidence scoring',
              desc: 'Every result displays a confidence level: Low (<10 reports), Moderate (10–49 reports), or High (50+ reports). This tells you how much to rely on the data.',
            },
          ].map(step => (
            <div key={step.num} className="flex gap-5 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="text-[#059669] font-bold text-sm tabular-nums flex-shrink-0 pt-0.5">{step.num}</span>
              <div>
                <p className="font-semibold text-slate-800 mb-1">{step.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Privacy by design</h2>
        <div className="space-y-2">
          {[
            'No names, emails, or phone numbers are collected',
            'Submissions cannot be linked back to any individual',
            'All data is used only for aggregated salary statistics',
            'No data is sold or shared with third parties',
            'Analytics track only aggregate usage, not individual behaviour',
          ].map(item => (
            <div key={item} className="flex items-start gap-3 py-2.5">
              <div className="w-5 h-5 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#059669" strokeWidth="2">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              </div>
              <p className="text-slate-700 text-sm">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 text-center">
        <h3 className="font-bold text-slate-900 text-lg mb-2">Help grow the dataset</h3>
        <p className="text-slate-500 text-sm mb-5">Every submission makes the benchmarks more reliable for everyone.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/submit" className="px-6 py-3 bg-[#059669] text-white font-semibold text-sm rounded-xl hover:bg-emerald-500 transition-colors">
            Submit Your Salary
          </Link>
          <Link href="/benchmark" className="px-6 py-3 border border-[#E2E8F0] text-slate-700 font-semibold text-sm rounded-xl hover:border-[#059669] hover:text-[#059669] transition-colors">
            View Benchmarks
          </Link>
        </div>
      </div>
    </div>
  )
}
