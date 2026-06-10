import Link from 'next/link';
import { Suspense } from 'react';

// Stats display with client-side fetch
async function HeroStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
      {[
        { label: 'Tuition Reports', id: 'total' },
        { label: 'Areas Covered', id: 'areas' },
        { label: 'Universities', id: 'unis' },
        { label: 'Subjects', id: 'subjects' },
      ].map((s) => (
        <div key={s.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 text-center">
          <div className="skeleton h-8 w-16 mx-auto mb-2 rounded bg-white/20" />
          <div className="text-blue-200 text-xs font-medium">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#0F172A] relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-[#059669]/10 border border-[#059669]/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span className="text-[#059669] text-xs font-semibold tracking-wide">SALARY INTELLIGENCE PLATFORM</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.08] mb-6 max-w-3xl">
            Know Your<br />
            <span className="text-[#059669]">Tuition Market</span><br />
            Value
          </h1>

          <p className="text-[#94A3B8] text-lg md:text-xl max-w-xl leading-relaxed mb-10">
            Anonymous salary intelligence for private tutors across Bangladesh.
            Community-contributed. Aggregated. Transparent.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/benchmark"
              className="px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Check Market Rate
            </Link>
            <Link
              href="/submit"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Submit Tuition Salary
            </Link>
          </div>

          {/* Live stats banner */}
          <StatsBar />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-3">How TuitionMeter works</h2>
          <p className="text-[#94A3B8] max-w-lg mx-auto">Three steps from raw data to trusted salary benchmarks.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Submit anonymously',
              desc: 'Tutors submit salary details with no name, phone, or email required. One tuition equals one record.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#059669]">
                  <path d="M10 2v8m0 0l-3-3m3 3l3-3M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
            },
            {
              num: '02',
              title: 'Data is aggregated',
              desc: 'Submissions from the last 18 months are pooled. Statistical outliers are handled. Only approved records are counted.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#059669]">
                  <path d="M3 12l4-4 4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="7" cy="8" r="1.5" fill="currentColor"/>
                  <circle cx="11" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="17" cy="6" r="1.5" fill="currentColor"/>
                </svg>
              ),
            },
            {
              num: '03',
              title: 'Get instant benchmarks',
              desc: 'Filter by area, level, curriculum, university and see real percentile data — median, IQR, and a confidence rating.',
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#059669]">
                  <rect x="3" y="10" width="3" height="7" rx="1" fill="currentColor" opacity="0.4"/>
                  <rect x="8.5" y="6" width="3" height="11" rx="1" fill="currentColor" opacity="0.7"/>
                  <rect x="14" y="3" width="3" height="14" rx="1" fill="currentColor"/>
                </svg>
              ),
            },
          ].map((step) => (
            <div key={step.num} className="bg-white border border-[#E2E8F0] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#94A3B8] tracking-widest mb-1">{step.num}</div>
                  <h3 className="font-bold text-[#0F172A] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why section */}
      <section className="bg-[#0F172A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[#059669] text-xs font-bold tracking-wider uppercase mb-4">The Problem</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
                The tuition market runs on guesswork
              </h2>
              <div className="space-y-4">
                {[
                  'New tutors accept whatever rate a guardian offers — often far below market.',
                  'Guardians overpay without realizing what\'s actually standard for their area.',
                  'There\'s no public data source. Salary norms spread by rumor.',
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#059669] flex-shrink-0" />
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[#059669] text-xs font-bold tracking-wider uppercase mb-4">Our Approach</div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-tight">
                Transparency through community data
              </h2>
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
                TuitionMeter builds a transparent salary layer for Bangladesh&apos;s private tuition market — the same way Glassdoor did for formal employment.
              </p>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                Every submission is anonymous. The aggregate is public. No names, no profiles, no marketplace — just clean, community-sourced salary data.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 mt-6 text-[#059669] text-sm font-medium hover:underline"
              >
                Read our methodology
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-[#0F172A] mb-3">Ready to benchmark your rate?</h2>
          <p className="text-[#64748B] mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Takes 2 minutes. Completely anonymous. Helps the entire tutoring community.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/benchmark"
              className="px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Check Market Rate
            </Link>
            <Link
              href="/submit"
              className="px-6 py-3 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] font-semibold rounded-lg text-sm transition-colors"
            >
              Submit Your Salary
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Client component for live stats
function StatsBar() {
  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Tuition Reports', placeholder: '—' },
        { label: 'Areas Covered', placeholder: '—' },
        { label: 'Universities', placeholder: '—' },
        { label: 'Subjects', placeholder: '—' },
      ].map((s) => (
        <div key={s.label} className="border border-white/10 rounded-xl p-4 text-center bg-white/5">
          <div id={`stat-${s.label}`} className="text-2xl font-bold text-white tabular-nums mb-0.5">
            {s.placeholder}
          </div>
          <div className="text-blue-300/70 text-xs font-medium">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
