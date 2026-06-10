import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — TuitionMeter',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <div className="text-[#059669] text-xs font-bold tracking-wider uppercase mb-3">Legal</div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] mb-3">Privacy Policy</h1>
        <p className="text-[#94A3B8] text-sm">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8 text-sm text-[#475569] leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-[#0F172A] mb-3">1. What we collect</h2>
          <p>TuitionMeter collects <strong className="text-[#0F172A]">zero personally identifiable information (PII)</strong>. We do not ask for, store, or process:</p>
          <ul className="mt-2 space-y-1.5 list-none pl-0">
            {['Names', 'Phone numbers', 'Email addresses', 'Student IDs or government IDs', 'IP addresses (not stored)', 'Location beyond manually entered area'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#059669] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#0F172A] mb-3">2. What each submission stores</h2>
          <p>Each tuition salary submission stores only:</p>
          <ul className="mt-2 space-y-1.5 list-none pl-0">
            {[
              'Monthly salary (BDT)',
              'Area (manually selected)',
              'Curriculum type',
              'Student level',
              'Subjects',
              'Days per week and hours per session',
              'Tutor university, department, and academic year',
              'Timestamp of submission',
              'Approval status',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#94A3B8] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3">No field can be traced to an individual person. There is no "user account" to associate records with.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#0F172A] mb-3">3. How data is used</h2>
          <p>All submitted data is used exclusively in aggregate form to compute salary benchmarks. Individual records are never displayed publicly. The platform shows statistical summaries (median, average, percentiles) across groups of submissions.</p>
          <p className="mt-3">Submissions older than 18 months are excluded from public benchmark calculations. Records may be retained for internal data quality review.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#0F172A] mb-3">4. Third-party services</h2>
          <p>TuitionMeter uses <strong className="text-[#0F172A]">Firebase (Google)</strong> for data storage and authentication (admin-only). Firebase's privacy practices are governed by Google's Privacy Policy. No third-party advertising networks, tracking pixels, or analytics are used.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#0F172A] mb-3">5. Data accuracy disclaimer</h2>
          <p>Salary submissions are self-reported and unverified. TuitionMeter does not guarantee the accuracy, completeness, or timeliness of any benchmark data. All benchmarks should be used as one reference point among many, not as a definitive salary authority.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#0F172A] mb-3">6. Changes to this policy</h2>
          <p>This privacy policy may be updated without prior notice. The "last updated" date at the top of this page reflects the most recent revision.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[#0F172A] mb-3">7. Contact</h2>
          <p>This is a community platform. For questions about privacy or data practices, please reach out through the About page.</p>
        </section>
      </div>
    </div>
  );
}
