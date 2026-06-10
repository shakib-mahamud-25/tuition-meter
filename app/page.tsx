import Link from 'next/link'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Submit Anonymously',
    desc: 'Share your tuition salary, location, subjects, and academic background. No name, no phone, no email — ever.',
  },
  {
    step: '02',
    title: 'Data is Aggregated',
    desc: 'Submissions are pooled and run through statistical analysis. Individual records are never exposed.',
  },
  {
    step: '03',
    title: 'Get Instant Benchmarks',
    desc: 'Filter by area, level, curriculum, university, and more to see median, average, IQR, and confidence ratings.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0F172A] relative overflow-hidden">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          {/* Eyebrow badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#059669]/10 border border-[#059669]/20 text-[#D1FAE5] text-xs font-semibold mb-6 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            Community-Powered Salary Data
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Know Your Tuition<br />
            <span className="text-[#059669]">Market Value</span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            Anonymous, data-driven salary benchmarks for private tutors in Bangladesh. Find out what the market pays for your subjects, area, and level.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/benchmark"
              className="px-7 py-3.5 rounded-xl bg-[#059669] text-white font-semibold text-base hover:bg-emerald-600 transition-colors"
            >
              Check Market Rate
            </Link>
            <Link
              href="/submit"
              className="px-7 py-3.5 rounded-xl bg-white/10 text-white font-semibold text-base hover:bg-white/20 transition-colors border border-white/10"
            >
              Submit Tuition Salary
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {[
              { label: 'Tuition Reports', value: '500+' },
              { label: 'Areas Covered', value: '40+' },
              { label: 'Universities', value: '25+' },
              { label: 'Subjects Tracked', value: '18' },
            ].map((s) => (
              <div key={s.label} className="bg-[#0F172A] px-4 py-5 text-center">
                <p className="text-2xl font-extrabold text-white tabular-nums">{s.value}</p>
                <p className="text-slate-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">How TuitionMeter Works</h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
            Powered by voluntary, anonymous data submissions — no accounts, no tracking.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-6 hover:border-[#059669]/40 hover:shadow-sm transition-all"
            >
              <span className="text-4xl font-black text-[#059669]/20 tabular-nums block mb-4">
                {item.step}
              </span>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why section */}
      <section className="bg-[#0F172A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-4">The Problem</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Private tutors in Bangladesh have no reliable way to know what their peers are earning. Rates vary wildly between areas, subjects, and student levels — and there&apos;s no transparent data to benchmark against.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                New tutors often undercharge. Experienced tutors don&apos;t know when to raise rates. Students overpay or underpay without reference points. The entire market runs on guesswork.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-4">Our Approach</h2>
              <ul className="space-y-3">
                {[
                  'Anonymous submissions — zero personal data collected',
                  'Statistical aggregation masks individual records',
                  'Confidence ratings based on sample size',
                  'Filters by area, level, curriculum, and university',
                  'Community-powered: more submissions = better data',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-300 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#059669]/20 border border-[#059669]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 shadow-sm">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
            Help Build the Database
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Every submission makes the benchmarks more accurate for everyone. It takes under 2 minutes and is completely anonymous.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/submit"
              className="px-7 py-3 rounded-xl bg-[#059669] text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
            >
              Submit Your Tuition Salary
            </Link>
            <Link
              href="/benchmark"
              className="px-7 py-3 rounded-xl bg-[#F1F5F9] text-gray-700 font-semibold text-sm hover:bg-[#E2E8F0] transition-colors"
            >
              Browse Benchmarks
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
