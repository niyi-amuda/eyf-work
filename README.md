# EYF 2026 Experience

Separate Next.js application for the Excellent Youth Fellowship 2026 National Youth Convention. It uses the **existing production Supabase project** and does not replace or modify the existing convention registration frontend.

## Production Supabase

- Project reference: `yorlnzlfnyfqbxrctnyf`
- Project URL: `https://yorlnzlfnyfqbxrctnyf.supabase.co`
- Client variable: `NEXT_PUBLIC_SUPABASE_URL`
- Client key variable: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never place a service-role key in `NEXT_PUBLIC_*` variables or browser code.

## What was fixed

### Bible Quick Quiz

The quiz is no longer hardcoded. It loads active questions from the production `convention_quiz_questions` table through the session-aware RPC `eyf_get_quiz_questions_for_session`.

The loader returns only:

- question
- options A-D
- difficulty
- category
- points
- Bible reference

It never returns `correct_answer` to the browser.

Questions are randomized and limited to 10 per round. The loader skips questions already answered by the current EYF session. Adding more active rows to Supabase automatically makes them available without a frontend code change.

### Secure quiz scoring

The browser sends only the question ID and selected option to `/api/game/quiz`. The server calls `eyf_submit_quiz_answer`.

The database function:

1. validates the EYF session;
2. validates the question and active status;
3. checks the stored answer in Supabase;
4. reads the stored question points;
5. prevents duplicate attempts for the same question/session;
6. records the answer in `convention_quiz_answers`;
7. atomically updates `convention_game_profiles`;
8. records a separate `convention_game_events` row; and
9. returns the authoritative total points and games played.

The client cannot submit an arbitrary score.

### Tap Star

Tap Star now has a real game round. The user starts the round, taps the star target once, and the app calls `/api/game/tap-star`.

The database-side `eyf_record_tap_star` function awards exactly 10 points, updates `convention_game_profiles`, inserts a `convention_game_events` row, and returns the authoritative totals. The UI disables the target while saving and the database also enforces a short anti-spam window.

The frontend no longer trusts a client-supplied score.

### Points and leaderboard

Authoritative points and games played remain in `convention_game_profiles`.

The leaderboard reads from the database through `eyf_experience_leaderboard`, sorts by points descending, and does not use localStorage.

Reward wins are not included in game points.

### Rewards

The existing admin-controlled reward system remains in place:

- admins use the existing Supabase Auth accounts;
- access is checked against `convention_reward_admins`;
- each draw is selected server/database side from registered participants;
- previous winners remain eligible;
- a participant may have multiple reward records;
- payment verification is separate from game points; and
- reward claiming remains an admin operation.

### Attendance

The dashboard reads the existing `convention_checkins` table through the Experience RPC. No second check-in system was created.

### Branding

The supplied EYF/LTC logo was cropped from the supplied registration-card screenshot and added as `public/eyf-logo.png`. The interface uses the official palette:

- `#003B63`
- `#004F82`
- `#00B8E5`
- `#FFCC34`
- `#FFFFFF`

The visual direction follows the supplied EYF Experience mockup: premium cards, deep navy/blue surfaces, cyan interactions, yellow calls to action, large mobile-friendly controls, and clean spacing.

### PWA

The application includes:

- `public/manifest.webmanifest`
- `public/sw.js`
- mobile viewport metadata
- EYF logo app icon
- an offline shell
- no API caching in the service worker

Sensitive dashboard/game API responses are deliberately not cached by the service worker.

## Database migrations added/applied

### `20260919003000_eyf_experience_hardening.sql`

- removes public direct-read access to quiz questions, game profiles, reward eligibility and reward wins;
- keeps protected RPCs as the read/write path;
- limits the legacy `eyf_record_game(text,text)` RPC to authenticated callers;
- grants the session-bound game/quiz functions to the Experience roles.

### `20260919004500_eyf_quiz_session_loader.sql`

Adds `eyf_get_quiz_questions_for_session(text, integer)`, a secure question loader that excludes already answered questions and omits `correct_answer`.

### `eyf_admin_overview_attendance`

The production `eyf_admin_overview_v2` function was updated to include attendance overview and recent game activity while preserving the existing admin allowlist and reward controls.

## Important existing database security finding

The production inspection shows `public.convention_registrations` currently has RLS disabled. This is an existing project-wide security issue. It was **not** changed by this work because enabling RLS without policies could break the existing registration frontend.

Secure that table separately after reviewing the exact registration frontend read/insert/update requirements and adding appropriate policies. Do not blindly enable RLS without those policies.

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and provide the existing production publishable key.

## Build

```bash
npm run lint
npm run build
```

## Vercel

Deploy this folder as a **new Vercel project**. Do not replace the existing convention registration Vercel project.

Set:

```text
NEXT_PUBLIC_SUPABASE_URL=https://yorlnzlfnyfqbxrctnyf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Routes

- `/` — EYF Code entry / landing page
- `/dashboard` — participant Experience dashboard
- `/admin` — existing Supabase Auth + EYF admin allowlist dashboard

API routes are server-side and use the HttpOnly `eyf_session` cookie for participant operations.

## Deployment fix (September 19, 2026)

The previous FINAL ZIP contained a JSX structure error in `app/admin/page.tsx` that caused Vercel/Turbopack to fail with `JSX element 'div' has no corresponding closing tag`.

This release closes the missing dashboard wrapper. No application behavior, Supabase integration, landing-page design, admin menu behavior, reward logic, games, or database migrations were changed as part of this deployment fix.

The source was checked with TypeScript parsing after the correction. A complete `npm run build` could not be executed in this environment because dependency installation timed out; run `npm install` followed by `npm run build` in the deployment environment.
