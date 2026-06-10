import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">About TuitionMeter</h1>
        <p className="text-slate-500 text-base leading-relaxed">
          A community-powered salary intelligence tool for private tutors in Bangladesh.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-[#0F172A] rounded-2xl p-8 mb-10">
        <blockquote className="text-white text-xl font-semibold leading-relaxed italic">
          &ldquo;Every tutor deserves to know what the market pays — not just what their last student agreed to.&rdquo;
        </blockquote>
        <p className="text-slate-400 text-sm mt-4">
          TuitionMeter exists because private tutoring in Bangladesh has always been an informal, opaque market. Rates are negotiated in isolation, students and tutors both lack reference points, and the entire system runs on word-of-mouth and guesswork.
        </p>
        <p className="text-slate-400 text-sm mt-3">
          We&apos;re changing that with anonymous, community-sourced data and transparent statistical methodology.
        </p>
      </div>

      {/* Methodology */}
      <section id="methodology" className="mb-10">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Methodology</h2>
        <div className="space-y-4">
          {[
            {
              n: '1',
              title: 'Anonymous Submission',
              desc: 'Tutors submit one record per tuition. No name, phone, email, or any identifying information is collected. The only data stored is what you see in the form.',
            },
            {
              n: '2',
              title: 'Data Validation',
              desc: 'Submissions are validated server-side through Firestore security rules. Salary must be between ৳500 and ৳500,000. All required fields must be present and correctly typed.',
            },
            {
              n: '3',
              title: 'Statistical Aggregation',
              desc: 'We calculate mean, median (P50), P25, P75, minimum, and maximum using linear interpolation. Individual records are never exposed — only aggregated statistics are surfaced.',
            },
            {
              n: '4',
              title: 'Confidence Ratings',
              desc: 'Results are rated Low (under 10 reports), Medium (10–49 reports), or High (50+ reports). Low-confidence results should be interpreted with caution.',
            },
          ].map((item) => (
            <div key={item.n} className="flex gap-4 bg-white border border-[#E2E8F0] rounded-xl p-5">
              <span className="w-8 h-8 rounded-full bg-[#D1FAE5] text-[#059669] font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.n}
              </span>
              <div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-10">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-5">Privacy Commitment</h2>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <ul className="space-y-3">
            {[
              'No names, phone numbers, or email addresses are ever collected',
              'No user accounts required for submission or benchmarking',
              'IP addresses are not logged or stored',
              'Submissions cannot be linked back to any individual',
              'Data is used solely for statistical aggregation',
              'No data is sold to third parties',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <svg className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
            <Link href="/privacy" className="text-[#059669] text-sm font-medium hover:underline">
              Read the full Privacy Policy →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-[#0F172A] rounded-2xl p-8 text-center">
        <h2 className="text-white font-extrabold text-xl mb-3">Help the Community</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          The more tutors contribute, the more accurate and useful the benchmarks become.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/submit" className="px-6 py-2.5 rounded-lg bg-[#059669] text-white font-semibold text-sm hover:bg-emerald-600 transition-colors text-center">
            Submit Your Salary
          </Link>
          <Link href="/benchmark" className="px-6 py-2.5 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors border border-white/10 text-center">
            Browse Benchmarks
          </Link>
        </div>
      </div>
    </div>
  )
}
