'use client';

import Link from 'next/link';
import { useState } from 'react';

function DeveloperPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Card */}
      <div className="relative bg-[#0F172A] border border-[#1E3A8A]/60 rounded-2xl p-6 w-full max-w-xs shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#475569] hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#059669]/20 border border-[#059669]/40 flex items-center justify-center mb-3">
            <span className="text-[#059669] font-bold text-lg">S</span>
          </div>
          <h3 className="text-white font-bold text-base">Shakib Mahamud</h3>
          <p className="text-[#94A3B8] text-xs mt-1 mb-5">Developer & Designer</p>

          <div className="flex gap-3 w-full">
            {/* Portfolio */}
            <a
              href="https://shakib-mahamud.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#059669] hover:bg-[#047857] rounded-lg text-white text-xs font-semibold transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1a5.5 5.5 0 100 11A5.5 5.5 0 006.5 1zM1.2 6.5h1.8M10 6.5h1.8M6.5 1.2v1.8M6.5 10v1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M4 6.5c0-1.38.67-2.6 1.7-3.37M9 6.5c0 1.38-.67 2.6-1.7 3.37" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Portfolio
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com/Mahamud.deepto"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#1565D8] rounded-lg text-white text-xs font-semibold transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
                <path d="M13 6.5A6.5 6.5 0 100 6.5a6.5 6.5 0 0013 0zm-7.15 5.42V7.15H4.6V5.7h1.25V4.64c0-1.24.74-1.91 1.85-1.91.53 0 1.08.04 1.61.12v1.22H8.6c-.87 0-1.04.41-1.04 1.02V5.7h2.08l-.27 1.45H7.56v4.77a6.52 6.52 0 01-1.71-.1z"/>
              </svg>
              Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
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

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[#475569] text-xs">
              © {new Date().getFullYear()} TuitionMeter. A community-driven salary intelligence platform for Bangladesh.
            </p>
            <p className="text-[#475569] text-xs">
              Developed by{' '}
              <button
                onClick={() => setShowPopup(true)}
                className="text-[#94A3B8] hover:text-[#059669] transition-colors underline underline-offset-2"
              >
                Shakib Mahamud
              </button>
            </p>
          </div>
        </div>
      </footer>

      {showPopup && <DeveloperPopup onClose={() => setShowPopup(false)} />}
    </>
  );
}
