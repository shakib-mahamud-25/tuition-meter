'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [showPopup, setShowPopup] = useState(false)

  return (
    <>
      <footer className="bg-[#0F172A] border-t border-[#1E3A8A] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-md bg-[#059669] flex items-center justify-center text-white font-bold text-sm">
                  T
                </span>
                <span className="text-white font-bold text-lg tracking-tight">
                  Tuition<span className="text-[#059669]">Meter</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Community-driven, anonymous salary benchmarking for private tutors in Bangladesh.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-8">
              <div>
                <h4 className="text-white text-sm font-semibold mb-3">Platform</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/about" className="text-slate-400 text-sm hover:text-white transition-colors">About</Link>
                  <Link href="/about#methodology" className="text-slate-400 text-sm hover:text-white transition-colors">Methodology</Link>
                  <Link href="/privacy" className="text-slate-400 text-sm hover:text-white transition-colors">Privacy Policy</Link>
                </div>
              </div>
              <div>
                <h4 className="text-white text-sm font-semibold mb-3">Actions</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/benchmark" className="text-slate-400 text-sm hover:text-white transition-colors">Check Benchmark</Link>
                  <Link href="/submit" className="text-slate-400 text-sm hover:text-white transition-colors">Submit Salary</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#1E3A8A] flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} TuitionMeter. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs">
              Developed by{' '}
              <button
                onClick={() => setShowPopup(true)}
                className="text-slate-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
              >
                Shakib Mahamud
              </button>
            </p>
          </div>
        </div>
      </footer>

      {/* Developer popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-16 h-16 rounded-full bg-[#059669] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              S
            </div>
            <h3 className="text-gray-900 font-bold text-xl mb-1">Shakib Mahamud</h3>
            <p className="text-gray-500 text-sm mb-6">Developer & Designer</p>

            <div className="flex gap-3 justify-center">
              <a
                href="https://shakib-mahamud.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#059669] text-white text-sm font-semibold hover:bg-emerald-600 transition-colors text-center"
              >
                Portfolio
              </a>
              <a
                href="https://facebook.com/Mahamud.deepto"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors text-center"
                style={{ backgroundColor: '#1877F2' }}
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
