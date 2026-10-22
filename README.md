# Hand-in

A minimal project submission and review workspace built with Next.js 16, React 19, TypeScript, Tailwind CSS and ShadCN UI.

The workspace uses a charcoal sidebar, white/slate surfaces and small `#f10e90` brand accents, with the requested background:

```css
background-image: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
```

Roboto handles the interface; Bebas Neue is used for display headings and the wordmark. Both are loaded from `public/fonts` using `next/font/local`. Builds do not depend on Google Fonts. Icons come from Lucide. Animation stays subtle and respects reduced-motion preferences.

The desktop sidebar collapses into a compact icon rail using the top-left toggle. Navigation, the project guide, account details and sign out remain available while collapsed. On mobile it opens as a drawer, with a close button and Escape-key support.

## Start locally

1. Start the Express backend on port 5000. Apply its migrations and run its admin seed.
2. Run `pnpm install` in this directory.
3. Copy `.env.example` to `.env` for a new checkout. Keep your current environment file if already configured.
4. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1`.
5. Set the backend's `FRONTEND_URL=http://localhost:3000`.
6. Run `pnpm dev` and open [localhost:3000](http://localhost:3000).

For production, run `pnpm build`, then `pnpm start`. Configure the public API URL before building. Both frontend and API should use HTTPS when deployed.

## Pages

| Page | What it does |
| --- | --- |
| /login | Student, mentor and admin login |
| /register | Student signup |
| /dashboard | Role-aware overview, totals, project table and status filters |
| /dashboard/projects | Student's own projects or the mentor's review table |
| /dashboard/new | Student project submission |

The sidebar also includes a project guide, account details and sign out. Old dashboard routes redirect to the shared dashboard. Older OTP/profile-edit routes redirect to the supported workspace flow.

Students see only their own projects. Mentors/admins can review all submissions, approve or reject pending projects, and leave an optional note. The frontend always requests status filters and pagination from Express.

## How the code is organized

```text
src/app/
  (authRouteGroup)/         Login and registration pages
  dashboard/               Protected workspace pages
  api/session/             Verified HttpOnly session cookie
  api/workspace/[...path]/  Allowlisted requests to the Express project API
  globals.css              Theme, component styling and responsive layouts
  dashboard.css            Neutral workspace palette and collapsible sidebar

src/components/
  Auth/                    Shared auth screen and form
  dashboard/               Shell, project table, detail/review dialog and submission form
  ui/                      Existing ShadCN primitives

src/services/project.services.ts  Typed project requests and API errors
src/lib/server-api.ts             Server-side session verification
src/lib/dashboard-utils.ts        Formatting and role helpers
src/types/project.types.ts        Shared API types
tests/                           Real-API browser tests and isolated test runner
```

সহজভাবে: page ঠিক করে কোন screen দেখাবে। Component UI ও interaction সামলায়। Service API call করে। Express-ই permission, validation ও database-এর মূল সিদ্ধান্ত নেয়।

## Authentication flow

1. The browser sends login/signup directly to Express. This preserves the API's per-IP authentication rate limit.
2. After success, the browser passes the returned access token to the same-origin session endpoint.
3. That endpoint checks the token with Express and stores it in an HttpOnly, SameSite=Lax cookie, expiring with the JWT.
4. Protected server layouts ask Express for the current profile. Project requests use an allowlisted Next.js route that attaches the Bearer token on the server.
5. Mutating Next.js routes check the request origin. Express checks role and ownership again.
6. Signing out clears the cookie and React Query cache. Expired sessions return to login.

Tokens are never saved to localStorage. The session endpoint never returns the token to the browser. Backend permission checks remain authoritative.

## Form and data states

Forms include client validation, inline field errors, server validation messages, disabled submit buttons while pending, password visibility controls, and rate-limit feedback. Submission values stay in place after a duplicate or network error.

Tables include loading, empty, error/retry and refresh states. Page size and pagination are backed by server counts. Review success refreshes both lists and statistics. Final decisions cannot be overwritten.

## Verify

```sh
pnpm lint
pnpm build
pnpm test:e2e
```

Before the first browser test run:

```sh
pnpm exec playwright install chromium
```

The E2E runner uses the adjacent backend directory by default. Set `BACKEND_DIR` if it lives elsewhere. Set `TEST_DATABASE_URL` to use a separate PostgreSQL database; otherwise it reads the backend's database connection.

Every run creates a new `frontend_e2e_*` schema, applies migrations, creates fictional fixture accounts/projects, starts the API on port 5010 and Next.js on port 3010, then drops only its generated schema. The connection needs schema creation permissions. Ports 3010 and 5010 must be free. Production/public application data is not edited.

A separate `.next-e2e` build directory lets normal development continue. Migration advisory locking is bypassed only for the newly generated test schema, avoiding a shared database lock during isolated tests.

Tests exercise login errors, signup, HttpOnly session cookies, student submission, duplicate handling, role checks, pagination, status filters, mentor approval/rejection, mobile navigation, and expired sessions. Screenshots go to `artifacts/`; the HTML report goes to `playwright-report/`.
