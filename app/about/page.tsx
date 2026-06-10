import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — TuitionMeter',
  description: 'Our mission, methodology, and commitment to privacy.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      {/* Header */}
      <div className="mb-12">
        <div className="text-[#059669] text-xs font-bold tracking-wider uppercase mb-3">About TuitionMeter</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] mb-4">
          Salary transparency for Bangladesh's tutoring market
        </h1>
        <p className="text-[#64748B] leading-relaxed">
          TuitionMeter is an independent, community-driven platform. We don't match tutors with students. We don't run a marketplace. We build the salary layer that makes the whole tutoring economy more equitable.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#0F172A] mb-4">Mission</h2>
        <div className="bg-[#0F172A] rounded-xl p-6 text-[#94A3B8] leading-relaxed text-sm">
          <p className="text-white text-base font-medium mb-3">
            "To give every tutor in Bangladesh the market data they deserve, before they walk into a salary negotiation."
          </p>
          <p>
            The private tutoring market in Bangladesh is enormous — and almost completely opaque. Salary norms are set by whoever asks first, propagated through WhatsApp groups and word of mouth, and rarely backed by data. A BUET student tutoring in Gulshan has no public benchmark to reference. A guardian in Mirpur has no baseline to verify they're paying fairly.
          </p>
          <p className="mt-3">
            TuitionMeter exists to fix that with community-sourced, anonymous, aggregated salary data.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="mb-12" id="methodology">
        <h2 className="text-xl font-bold text-[#0F172A] mb-4">Methodology</h2>
        <div className="space-y-4 text-sm text-[#64748B] leading-relaxed">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#A7F3D0] flex items-center justify-center text-[#059669] font-bold text-xs">1</div>
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">Data collection window</h3>
              <p>Only submissions from the most recent 18 months are used in benchmark calculations. Older records are retained but excluded. This keeps benchmarks reflective of the current market, not historical norms.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#A7F3D0] flex items-center justify-center text-[#059669] font-bold text-xs">2</div>
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">Statistics reported</h3>
              <p>We report mean, median, 25th percentile (P25), 75th percentile (P75), minimum, and maximum salary. The IQR (P25–P75) represents the "typical range" and is most useful for negotiation.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#A7F3D0] flex items-center justify-center text-[#059669] font-bold text-xs">3</div>
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">Confidence levels</h3>
              <p>Results are labeled <strong className="text-[#0F172A]">Low Confidence</strong> (0–9 reports), <strong className="text-[#0F172A]">Medium Confidence</strong> (10–49 reports), or <strong className="text-[#0F172A]">High Confidence</strong> (50+ reports). Narrow filters with few submissions should be interpreted carefully.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F0FDF4] border border-[#A7F3D0] flex items-center justify-center text-[#059669] font-bold text-xs">4</div>
            <div>
              <h3 className="font-semibold text-[#0F172A] mb-1">What we don't do</h3>
              <p>We do not verify individual submissions. We do not cross-reference submissions with any identity. Reported salaries are self-reported and trust-based. We rely on the community to submit honestly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#0F172A] mb-4">Privacy</h2>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 text-sm text-[#64748B] space-y-2 leading-relaxed">
          {[
            'No names are collected.',
            'No phone numbers are collected.',
            'No email addresses are collected.',
            'No student ID or government ID is collected.',
            'Submissions are anonymous by design — there is no way to trace a record to a person.',
            'Data is used only in aggregate form. Individual records are never displayed publicly.',
            'Timestamps are stored to enforce the 18-month data window.',
          ].map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 flex-shrink-0">
                <path d="M2.5 7l3 3 6-6" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{point}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#94A3B8]">
          For the full privacy policy, see our{' '}
          <Link href="/privacy" className="text-[#059669] hover:underline">Privacy Policy page</Link>.
        </p>
      </section>

      {/* CTA */}
      <div className="bg-[#0F172A] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white mb-1">Help build the dataset</h3>
          <p className="text-[#94A3B8] text-sm">Every submission makes benchmarks more accurate for everyone.</p>
        </div>
        <Link
          href="/submit"
          className="flex-shrink-0 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          Submit Your Salary
        </Link>
      </div>
    </div>
  );
}
