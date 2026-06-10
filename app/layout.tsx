import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'

export const metadata: Metadata = {
  title: 'TuitionMeter — Know Your Tuition Market Value',
  description:
    'Community-driven anonymous salary benchmarking for private tutors in Bangladesh. Find out what tutors in your area charge for your subjects.',
  keywords: [
    'tuition salary Bangladesh',
    'private tutor salary Dhaka',
    'tuition rate benchmark',
    'tutor salary data Bangladesh',
  ],
  openGraph: {
    title: 'TuitionMeter — Know Your Tuition Market Value',
    description:
      'Anonymous salary data for private tutors in Bangladesh. Powered by community submissions.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8FAFC] text-gray-900 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
