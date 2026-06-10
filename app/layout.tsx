import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'TuitionMeter — Salary Intelligence for Private Tutors in Bangladesh',
  description:
    'Anonymous tuition salary benchmarking platform. Know fair market rates for private tutoring across Bangladesh.',
  keywords: 'tuition salary, Bangladesh tutor salary, private tuition rates, tuition meter, BUET tutor salary, Dhaka tuition',
  openGraph: {
    title: 'TuitionMeter',
    description: 'Anonymous salary intelligence for private tutors across Bangladesh.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
