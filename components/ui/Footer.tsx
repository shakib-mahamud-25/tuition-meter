import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] border-t border-[#1E3A8A]/40 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-[#059669] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M2 10 L7 4 L12 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-white font-bold text-sm">
                Tuition<span className="text-[#059669]">Meter</span>
              </span>
            </div>
            <p className="text-[#94A3B8] text-xs max-w-sm leading-relaxed">
              Tuition Meter provides anonymous salary benchmarks and does not verify individual submissions.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/about" className="text-[#94A3B8] hover:text-white text-sm transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-[#94A3B8] hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/about#methodology" className="text-[#94A3B8] hover:text-white text-sm transition-colors">
              Methodology
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-[#475569] text-xs">
            © {new Date().getFullYear()} TuitionMeter. A community-driven salary intelligence platform for Bangladesh.
          </p>
        </div>
      </div>
    </footer>
  );
}
