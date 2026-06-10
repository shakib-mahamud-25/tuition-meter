export default function PrivacyPage() {
  const sections = [
    {
      title: 'What We Collect',
      content: `TuitionMeter collects only the data you explicitly enter into the submission form: your tuition salary, area, student level, curriculum, subjects, days per week, hours per session, university, department, and academic year. We do not collect your name, phone number, email address, device identifiers, IP address, or any information that could identify you as an individual.`,
    },
    {
      title: 'What Each Submission Stores',
      content: `Each tuition submission creates a single anonymous record in our database containing: salary (number), area (text), student level (category), curriculum (category), subjects (list), days per week (number), hours per session (category), university (text), department (text), academic year (category), submission status, and a server-generated timestamp. No user identifier or session token is attached to any record.`,
    },
    {
      title: 'How Data Is Used',
      content: `Submitted data is used exclusively to compute statistical benchmarks — mean, median, percentile ranges, and confidence ratings. Individual records are never displayed to any user. The platform queries aggregate statistics only. Records are retained indefinitely to maintain historical benchmark quality, but data older than 18 months is excluded from active benchmark calculations.`,
    },
    {
      title: 'Third-Party Services',
      content: `TuitionMeter uses Firebase (Google) for database storage and Google Analytics for anonymous usage statistics (page views, session counts). Firebase processes data on Google's infrastructure under their privacy policies. Google Analytics data is anonymized and aggregated. We do not use advertising networks, tracking pixels, or social media widgets that could track you across sites.`,
    },
    {
      title: 'Data Accuracy Disclaimer',
      content: `Benchmarks are community-sourced and represent self-reported data. TuitionMeter does not verify the accuracy of individual submissions. Statistical aggregation reduces the impact of outliers, but results should be interpreted as directional guidance rather than authoritative salary data. Confidence ratings indicate sample reliability — Low confidence results (fewer than 10 reports) should be treated with particular caution.`,
    },
    {
      title: 'Changes to This Policy',
      content: `TuitionMeter may update this privacy policy as the platform evolves. Material changes will be noted on this page. Continued use of the platform after policy updates constitutes acceptance of the revised terms. We will never retroactively change how previously submitted data is used in ways that compromise the anonymity commitments made at the time of submission.`,
    },
    {
      title: 'Contact',
      content: `TuitionMeter is an independent community project. For privacy-related inquiries, reach out through the developer's portfolio at shakib-mahamud.vercel.app.`,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Privacy Policy</h1>
        <p className="text-slate-500 text-sm">Last updated: January 2025</p>
      </div>

      <div className="bg-[#D1FAE5]/40 border border-[#059669]/20 rounded-xl px-5 py-4 mb-8 flex gap-3 items-start">
        <svg className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong>TuitionMeter is designed to be fully anonymous.</strong> We have no way to identify who submitted what — and that&apos;s intentional. No personal data is required, requested, or stored.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-3">{section.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
