import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '../components/ui/Navbar'
import { Footer } from '../components/ui/Footer'

export const metadata: Metadata = {
  title: {
    default: 'TuitionMeter — Private Tutor Salary Benchmarks in Bangladesh',
    template: '%s | TuitionMeter',
  },
  description:
    'Know the market rate before accepting a tuition. Community-driven, anonymous salary benchmarks for private tutors across Dhaka and Bangladesh.',
  keywords: [
    'tuition salary Bangladesh',
    'private tutor pay Dhaka',
    'tutoring rates Bangladesh',
    'salary benchmark tutors',
  ],
  openGraph: {
    title: 'TuitionMeter — Private Tutor Salary Benchmarks',
    description: 'Find out what tutors in your area actually earn.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Inter',sans-serif] bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
