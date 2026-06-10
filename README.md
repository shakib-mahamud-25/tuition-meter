# TuitionMeter

**Anonymous salary intelligence for private tutors across Bangladesh.**

TuitionMeter is a community-driven salary benchmarking platform — like Glassdoor, but for private tutoring. Tutors submit anonymous salary data; everyone can query aggregated benchmarks filtered by area, level, curriculum, university, and more.

**Live demo:** _(add your Vercel URL here after deployment)_

---

## What this is

- A salary **benchmarking** platform — not a tutor directory, not a marketplace
- All submissions are **fully anonymous** — no name, phone, email, or ID collected
- Data is aggregated into statistical benchmarks: median, average, P25, P75, IQR
- Benchmarks use only the last **18 months** of data to stay current
- A confidence rating (Low / Medium / High) signals how much data backs each result

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Firebase Firestore |
| Auth (admin only) | Firebase Authentication |
| Deployment | Vercel |

---

## Project structure

```
tuition-meter/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout (Navbar + Footer)
│   ├── globals.css           # Design tokens + global styles
│   ├── benchmark/page.tsx    # Benchmark page (core feature)
│   ├── submit/page.tsx       # Anonymous submission form
│   ├── about/page.tsx        # Mission, methodology, privacy
│   ├── privacy/page.tsx      # Privacy policy
│   └── admin/
│       ├── layout.tsx        # Dark admin layout
│       └── page.tsx          # Login + moderation queues
│
├── components/
│   ├── ui/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchableSelect.tsx   # Autocomplete with "Add New" support
│   │   ├── MultiSelect.tsx        # Tag-style multi-select
│   │   └── ConfidenceBadge.tsx
│   └── benchmark/
│       ├── FilterSidebar.tsx      # 8-filter panel
│       ├── BenchmarkResult.tsx    # Stats grid + insight box + skeleton states
│       └── SalaryRangeBar.tsx     # IQR range bar with median tick
│
├── lib/
│   ├── types.ts              # All TypeScript types
│   ├── data.ts               # Preloaded areas, universities, subjects, departments
│   ├── benchmark.ts          # Calculation logic + Firestore queries
│   └── firebase/
│       └── config.ts         # Lazy Firebase initialization (SSR-safe)
│
├── firestore.rules           # Security rules
├── firestore.indexes.json    # Composite indexes for filter queries
├── firebase.json             # Firebase CLI config
├── vercel.json               # Vercel deploy config
└── .env.example              # Environment variable template
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage with hero, how-it-works, stats |
| `/benchmark` | Filter sidebar + live salary benchmarks |
| `/submit` | Anonymous salary submission form |
| `/about` | Mission, methodology, privacy explainer |
| `/privacy` | Full privacy policy |
| `/admin` | **Hidden** — admin login + moderation queues |

> The `/admin` route is never linked anywhere in the public UI. Access it directly by URL.

---

## Firestore collections

| Collection | Purpose |
|---|---|
| `tuition_records` | All salary submissions (status: `approved` \| `pending` \| `rejected`) |
| `pending_areas` | User-submitted areas awaiting admin review |
| `pending_subjects` | User-submitted subjects awaiting admin review |
| `pending_universities` | User-submitted universities awaiting admin review |
| `pending_departments` | User-submitted departments awaiting admin review |

---

## Deployment guide

See **DEPLOY.md** for the complete step-by-step guide.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

All variables are prefixed `NEXT_PUBLIC_` because they are used in the browser (client-side Firestore queries). They do not expose any secret — Firebase security is enforced by Firestore security rules, not by keeping the API key hidden.

---

## Security model

- **Public users** can create `tuition_records` and add to pending queues
- **Public users** cannot edit, delete, or read pending queues
- **Admin users** (authenticated via Firebase Auth) have full access
- All submitted data is validated server-side in Firestore rules before being stored
- A honeypot field on the submission form catches basic bots
- Rate limiting is handled by Firebase's built-in per-IP quotas

---

## Local development

```bash
npm install
cp .env.example .env.local
# fill in .env.local with your Firebase values
npm run dev
```

Then open http://localhost:3000

---

## License

MIT — free to use, modify, and deploy.
