import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — TuitionMeter',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      {children}
    </div>
  )
}
