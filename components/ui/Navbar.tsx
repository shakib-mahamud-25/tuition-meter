'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/benchmark', label: 'Benchmark' },
  { href: '/submit', label: 'Submit Tuition' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0F172A] border-b border-[#1E3A8A]/40">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded bg-[#059669] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10 L7 4 L12 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 10 L7 7 L10 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          </div>
          <span className="text-white font-bold text-[15px] tracking-tight">
            Tuition<span className="text-[#059669]">Meter</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-white bg-white/10'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/submit"
            className="ml-3 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-semibold rounded transition-colors"
          >
            Submit Salary
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-[#94A3B8] hover:text-white p-2"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {mobileOpen ? (
              <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            ) : (
              <>
                <rect x="3" y="5" width="14" height="1.5" rx="0.75"/>
                <rect x="3" y="9.25" width="14" height="1.5" rx="0.75"/>
                <rect x="3" y="13.5" width="14" height="1.5" rx="0.75"/>
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1E3A8A]/40 bg-[#0F172A]">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-white bg-white/10'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/submit"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-3 py-2.5 bg-[#059669] text-white text-sm font-semibold rounded text-center"
            >
              Submit Salary
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
