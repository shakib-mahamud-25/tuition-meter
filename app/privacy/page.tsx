import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How TuitionMeter handles your data.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      <div className="text-slate-600 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-slate-500 text-sm mb-10">Last updated: June 2026</p>

      <Section title="1. What data we collect">
        <p>TuitionMeter collects only the tuition-related data you voluntarily submit: salary amount, area, student level, curriculum, subjects, days per week, hours per session, university, department, and academic year.</p>
        <p>We do not collect your name, email address, phone number, or any personally identifying information.</p>
      </Section>

      <Section title="2. Submission fields">
        <p>Each submission includes only the fields listed above. There is no account creation or login required to submit data. Submissions are associated with a browser session identifier only to prevent rapid duplicate submissions.</p>
      </Section>

      <Section title="3. How we use your data">
        <p>Submitted data is used solely to calculate aggregated salary benchmarks. Individual submissions are never displayed publicly — only statistical summaries (median, percentiles, averages) are shown.</p>
        <p>All submissions are reviewed by an administrator before being included in benchmark calculations.</p>
      </Section>

      <Section title="4. Third parties">
        <p>TuitionMeter uses Firebase (Google) for its database and authentication services. Usage analytics are collected via Firebase Analytics and Google Analytics. These services operate under their own privacy policies.</p>
        <p>We do not sell, rent, or share your submitted data with any third party for commercial purposes.</p>
      </Section>

      <Section title="5. Data accuracy disclaimer">
        <p>All salary data on TuitionMeter is self-reported by community members and is provided for informational purposes only. TuitionMeter does not verify the accuracy of individual reports and makes no guarantees about the completeness or accuracy of benchmark data.</p>
        <p>Use benchmark data as a general reference point, not a definitive salary guide.</p>
      </Section>

      <Section title="6. Changes to this policy">
        <p>We may update this policy periodically. Any significant changes will be reflected by updating the date at the top of this page. Continued use of TuitionMeter after a policy update constitutes acceptance of the new terms.</p>
      </Section>

      <Section title="7. Contact">
        <p>Questions about this privacy policy can be directed to the developer via the contact information in the footer.</p>
      </Section>
    </div>
  )
}
