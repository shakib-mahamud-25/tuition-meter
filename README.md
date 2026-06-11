# TuitionMeter V2

**Community-driven anonymous salary benchmarking for private tutors in Bangladesh.**

> Know the market rate before accepting a tuition.

Live demo: _your-deployment.vercel.app_

---

## What is TuitionMeter?

Private tutoring is a massive informal economy in Bangladesh — but there's no shared salary data. Tutors don't know if they're being underpaid. Parents don't know what's fair. Every negotiation starts blind.

TuitionMeter fixes this. Tutors submit their salary anonymously. Reports are moderated and aggregated. Anyone can query the resulting benchmarks filtered by area, student level, curriculum, subjects, or tutor background.

---

## Features

- **Salary benchmark tool** — filter by area, student level, curriculum, subjects, university, department, days per week
- **Salary range bar** — P25–P75 IQR visualization with median tick
- **Confidence badge** — Low / Moderate / High based on sample size
- **Freshness-weighted average** — recent reports count more than old ones
- **Anonymous submission form** — no name, email, or personal data collected
- **Custom option requests** — users can suggest new areas, subjects, universities, departments (queued for admin approval)
- **Suspicious submission detection** — extreme salaries and rapid resubmissions are flagged
- **Admin moderation panel** — approve/reject salary reports and custom option requests
- **Fully responsive** — works on mobile and desktop
- **Bengali-friendly** — ৳ currency formatting throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Analytics | Firebase Analytics |
| Styling | Tailwind CSS 3 |
| Language | TypeScript |
| Deployment | Vercel |

---

## Project Structure

```
tuition-meter/
├── app/
│   ├── layout.tsx              # Root layout — Navbar, Footer, SEO
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Tailwind base + custom styles
│   ├── benchmark/page.tsx      # Benchmark tool
│   ├── submit/page.tsx         # Salary submission form
│   ├── about/page.tsx          # About + methodology
│   ├── privacy/page.tsx        # Privacy policy
│   └── admin/
│       ├── layout.tsx          # Admin layout (noindex)
│       └── page.tsx            # Login + dashboard + queues
├── components/
│   ├── ui/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchableSelect.tsx
│   │   ├── MultiSelect.tsx
│   │   └── ConfidenceBadge.tsx
│   └── benchmark/
│       ├── SalaryRangeBar.tsx
│       ├── BenchmarkResult.tsx
│       └── FilterSidebar.tsx
├── hooks/
│   ├── useBenchmark.ts
│   ├── useSubmitForm.ts
│   └── useAdminQueue.ts
├── lib/
│   ├── types.ts
│   ├── data.ts
│   ├── benchmark.ts            # Firestore queries + stats logic
│   ├── analytics.ts
│   ├── errors.ts
│   └── firebase/config.ts      # Lazy async Firebase init
├── firestore.rules
├── firestore.indexes.json
├── .env.local.template
└── SETUP.md                    # Full deployment guide
```

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/tuition-meter.git
cd tuition-meter
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.template .env.local
```

Fill in `.env.local` with your Firebase project config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

### 3. Run locally

```bash
npm run dev
# http://localhost:3000
```

For full Firebase setup and Vercel deployment instructions, see **[SETUP.md](./SETUP.md)**.

---

## How the Benchmark Works

1. **Fetch** — all `status == 'approved'` records from the last 18 months
2. **Filter** — client-side filtering by area, level, curriculum, subjects, university, etc.
3. **Compute** — median, P25, P75, min, max via percentile calculation; freshness-weighted average
4. **Confidence** — Low (<10 reports), Moderate (10–49), High (50+)

No composite Firestore indexes are used. All filtering happens in memory after a single `where('status', '==', 'approved')` query.

---

## Firestore Collections

| Collection | Description |
|---|---|
| `tuition_records` | All salary submissions (status: pending / approved / rejected) |
| `pending_areas` | User-suggested custom areas awaiting moderation |
| `pending_subjects` | User-suggested custom subjects awaiting moderation |
| `pending_universities` | User-suggested custom universities awaiting moderation |
| `pending_departments` | User-suggested custom departments awaiting moderation |

---

## Admin Panel

URL: `/admin`

- Not linked in the main navigation
- `noindex` meta tag — won't appear in search results
- Login with Firebase Email/Password credentials
- Approve or reject salary reports and custom option requests
- View aggregate stats: total, approved, pending, rejected, median salary

---

## Privacy

- No names, emails, or personal identifiers are collected
- Submissions are anonymous by design
- Individual records are never displayed publicly — only aggregated statistics
- Data is not sold or shared with third parties

See [Privacy Policy](/privacy) for full details.

---

## Contributing

This is a civic-tech project for the Bangladeshi tutoring community. If you find a bug or want to suggest a feature, open an issue or submit a PR.

---

## License

MIT — free to use, modify, and deploy.

---

Built by [Shakib Mahamud](https://shakib-mahamud.vercel.app)
