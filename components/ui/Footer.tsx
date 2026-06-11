'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export function Footer() {
  const [popupOpen, setPopupOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popupOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopupOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    popupRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKey)
  }, [popupOpen])

  return (
    <footer className="bg-[#0F172A] border-t border-[#1E3A8A]/40 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[#059669] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="9" width="3" height="7" rx="1" fill="white" />
                  <rect x="7.5" y="5" width="3" height="11" rx="1" fill="white" />
                  <rect x="13" y="2" width="3" height="14" rx="1" fill="white" />
                </svg>
              </div>
              <span className="text-white font-semibold">Tuition<span className="text-[#059669]">Meter</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Community-driven salary benchmarking for private tutors in Bangladesh.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2">
              {[
                { href: '/benchmark', label: 'Benchmark' },
                { href: '/submit', label: 'Submit Salary' },
                { href: '/about', label: 'About' },
                { href: '/privacy', label: 'Privacy Policy' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-4">About</h3>
            <p className="text-slate-400 text-sm mb-3">
              All submissions are anonymous and moderated. Data is used solely for aggregated salary benchmarks.
            </p>
            <button
              onClick={() => setPopupOpen(true)}
              className="text-[#059669] hover:text-emerald-400 text-sm transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Developed by Shakib Mahamud →
            </button>
          </div>
        </div>

        <div className="border-t border-[#1E3A8A]/40 mt-10 pt-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} TuitionMeter. All rights reserved.
        </div>
      </div>

      {/* Developer popup */}
      {popupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPopupOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Developer information"
        >
          <div
            ref={popupRef}
            tabIndex={-1}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 relative focus:outline-none"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPopupOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#059669] flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">S</span>
              </div>
              <h2 className="text-slate-900 font-bold text-xl">Shakib Mahamud</h2>
              <p className="text-slate-500 text-sm mt-1 mb-6">Developer & Designer</p>

              <div className="flex gap-3 justify-center">
                <a
                  href="https://shakib-mahamud.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  Portfolio
                </a>
                <a
                  href="https://facebook.com/Mahamud.deepto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1877F2] hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
