# TuitionMeter V2 — Setup Guide

This guide walks you from a fresh GitHub repo to a live Vercel deployment.
Estimated time: **30–45 minutes**.

---

## Prerequisites

Make sure you have:

- [Node.js 18+](https://nodejs.org) installed
- A [Firebase account](https://console.firebase.google.com)
- A [Vercel account](https://vercel.com) connected to your GitHub

---

## Step 1 — Create the GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `tuition-meter` (or whatever you like)
3. Set it to **Private** (recommended while in development)
4. Do **not** initialize with README, .gitignore, or license — the project already includes all of these
5. Copy the repo URL (you'll need it in Step 3)

---

## Step 2 — Drag-and-drop the project files

1. Download the `tuition-meter-v2.zip` file you received
2. Unzip it — you'll see the project folder
3. Go to your new empty GitHub repo in the browser
4. Drag the **contents** of the unzipped folder (not the folder itself) directly onto the GitHub file upload area
5. Click **Commit changes** at the bottom

> **Tip:** GitHub's drag-and-drop uploader may struggle with deeply nested folders. If you see errors, use the GitHub Desktop app or push via terminal instead (see alternative at the bottom of this guide).

---

## Step 3 — Set up Firebase

### 3a. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → Name it `tuition-meter` → Continue
3. Enable Google Analytics if you want usage tracking (recommended) → Create project

### 3b. Enable Firestore

1. In the left sidebar → **Firestore Database** → **Create database**
2. Choose **Start in production mode** (security rules are already configured in `firestore.rules`)
3. Select region: **asia-south1** (Mumbai — closest to Bangladesh)
4. Click **Enable**

### 3c. Enable Authentication

1. In the left sidebar → **Authentication** → **Get started**
2. Under **Sign-in method** → Enable **Email/Password**
3. Click **Save**

### 3d. Create an admin account

1. Still in Authentication → **Users** tab → **Add user**
2. Enter your admin email and a strong password
3. Click **Add user**
4. ⚠️ **Save these credentials** — you'll use them to log into `/admin`

### 3e. Get your Firebase config

1. Go to **Project Settings** (gear icon, top-left) → **Your apps** tab
2. Click the **</>** (Web) icon to add a web app
3. Name it `tuition-meter-web` → Register app
4. Copy the `firebaseConfig` object — you'll need these values in Step 5

It looks like this:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXX"   // only if you enabled Analytics
};
```

### 3f. Deploy Firestore rules

Two ways to do this:

**Option A — Via Firebase Console (simplest)**
1. In Firestore → **Rules** tab
2. Copy the entire contents of `firestore.rules` from the repo
3. Paste it into the editor → **Publish**

**Option B — Via Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules
```

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select your `tuition-meter` repo
3. Vercel will auto-detect it as a Next.js project
4. **Do not touch** the build settings — `vercel.json` already handles everything
5. Click **Deploy** (it will fail on the first build — that's expected before you add env vars)

---

## Step 5 — Add environment variables to Vercel

1. In your Vercel project → **Settings** → **Environment Variables**
2. Add each of the following variables, using the values from your Firebase config in Step 3e:

| Variable Name | Where to find the value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `measurementId` (skip if no Analytics) |

3. Set each variable for **Production**, **Preview**, and **Development** environments
4. Click **Save**

---

## Step 6 — Redeploy

1. Go to **Deployments** tab in Vercel
2. Click the three dots (⋯) on the latest deployment → **Redeploy**
3. Wait ~60 seconds for the build to complete
4. Click the deployment URL — your site is live ✅

---

## Step 7 — Verify everything works

Open the live URL and check each of the following:

- [ ] **Homepage** loads with the hero section and stats
- [ ] **`/benchmark`** loads the filter sidebar
- [ ] **`/submit`** shows the submission form with area/university dropdowns populated
- [ ] Submit a test salary entry → you should see the success screen
- [ ] **`/admin`** shows the login screen
- [ ] Log in with your admin credentials from Step 3d
- [ ] The test salary submission appears in the **Salary Reports** queue
- [ ] Click **Approve** → the record disappears from the queue
- [ ] Go back to **`/benchmark`**, apply filters, and click **Apply Filters** → result should show the test record

---

## Step 8 — (Optional) Set up local development

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/tuition-meter.git
cd tuition-meter

# Install dependencies
npm install

# Create local env file from the template
cp .env.local.template .env.local
# Open .env.local and paste your Firebase values

# Start the dev server
npm run dev
# Visit http://localhost:3000
```

---

## Firestore collections — what gets created automatically

The app creates these collections on first use. No manual setup needed:

| Collection | Contents | Created by |
|---|---|---|
| `tuition_records` | All salary submissions | Submission form |
| `pending_areas` | User-submitted custom areas | Submission form |
| `pending_subjects` | User-submitted custom subjects | Submission form |
| `pending_universities` | User-submitted custom universities | Submission form |
| `pending_departments` | User-submitted custom departments | Submission form |

---

## Admin panel reference

URL: `yourdomain.vercel.app/admin`

The admin panel is not linked in the main nav — it's only accessible if you know the URL.
Robots meta tag is set to `noindex` so it won't appear in search results.

**What you can do from the admin panel:**
- View pending salary reports and approve or reject each one
- View and moderate pending custom areas, subjects, universities, and departments
- See aggregate stats: total/approved/pending/rejected counts, areas covered, median salary

**How moderation works:**
- Submissions marked as **suspicious** (salary extremes, rapid re-submission) are highlighted in amber
- Approving a record makes it visible in benchmark queries
- Rejecting a record removes it from the queue permanently (soft delete — it stays in Firestore with `status: "rejected"`)

---

## Troubleshooting

**Build fails with "Module not found" error**
→ Run `npm install` locally, then push the `package-lock.json` to GitHub. Vercel needs it.

**`/benchmark` shows no data after approving a record**
→ The benchmark query filters by `status == 'approved'` AND within the last 18 months. Wait a few seconds and refresh — Firestore writes are near-instant but not always instant.

**Admin login shows "Invalid email or password"**
→ Double-check you created the user in Firebase Authentication (Step 3d), not just in Firestore.

**Dropdown menus are empty on `/submit`**
→ Check your `NEXT_PUBLIC_FIREBASE_PROJECT_ID` environment variable in Vercel. If it's missing or wrong, Firestore queries will fail silently and fall back to empty arrays.

**Custom area/subject submissions not appearing in admin queue**
→ Check Firestore rules. The `pending_areas` collection requires `status == 'pending'` on create. Make sure you're running the latest `firestore.rules`.

**`@secret` env var error on Vercel**
→ This project does not use `@secret` references in `vercel.json`. All env vars are set directly in the Vercel dashboard (Step 5). If you see this error, check that `vercel.json` matches the file in this repo.

---

## Alternative: Push via terminal (if drag-and-drop fails)

```bash
git clone https://github.com/YOUR_USERNAME/tuition-meter.git
cd tuition-meter

# Copy all unzipped files into this directory, then:
git add .
git commit -m "Initial commit — TuitionMeter V2"
git push origin main
```

---

## File structure reference

```
tuition-meter/
├── app/
│   ├── layout.tsx              # Root layout, Navbar, Footer, SEO metadata
│   ├── page.tsx                # Homepage — hero, how it works, CTA
│   ├── globals.css             # Tailwind base + custom styles
│   ├── benchmark/page.tsx      # Benchmark tool with filter sidebar
│   ├── submit/page.tsx         # Salary submission form
│   ├── about/page.tsx          # About + methodology
│   ├── privacy/page.tsx        # Privacy policy
│   └── admin/
│       ├── layout.tsx          # Admin layout (noindex, dark bg)
│       └── page.tsx            # Login + dashboard + moderation queues
├── components/
│   ├── ui/
│   │   ├── Navbar.tsx          # Sticky nav with mobile menu
│   │   ├── Footer.tsx          # Footer with developer popup
│   │   ├── SearchableSelect.tsx# Searchable dropdown with Add New
│   │   ├── MultiSelect.tsx     # Tag-based multi-select
│   │   └── ConfidenceBadge.tsx # Low/Medium/High confidence pill
│   └── benchmark/
│       ├── SalaryRangeBar.tsx  # P25–P75 bar with median tick
│       ├── BenchmarkResult.tsx # Full result card with all states
│       └── FilterSidebar.tsx   # Collapsible filter panel
├── hooks/
│   ├── useBenchmark.ts         # Benchmark state + query logic
│   ├── useSubmitForm.ts        # Submission form state + validation
│   └── useAdminQueue.ts        # Admin queue state + approve/reject
├── lib/
│   ├── types.ts                # All TypeScript interfaces
│   ├── data.ts                 # Static option lists
│   ├── benchmark.ts            # All Firestore service functions + stats
│   ├── analytics.ts            # Firebase Analytics event tracking
│   ├── errors.ts               # Firestore/Auth error messages
│   └── firebase/
│       └── config.ts           # Lazy Firebase init (no SSR crash)
├── .env.local.template         # Copy to .env.local and fill in values
├── .gitignore
├── firestore.rules             # Security rules — deploy via Console or CLI
├── firestore.indexes.json      # Empty (no composite indexes needed)
├── vercel.json                 # Build config
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

Built with Next.js 14, Firebase 10, Tailwind CSS 3, TypeScript.
