# Judge.run

Realtime multi-room judging operations app built with Next.js App Router, TypeScript, Tailwind CSS (dark-only), Supabase Postgres, and Supabase Realtime.

## Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS (`darkMode: 'class'`)
- Supabase (`@supabase/supabase-js`)
- `@dnd-kit` for queue reorder
- `papaparse` for CSV upload parsing
- `lucide-react` icons

## Setup

1. Clone the repo.
2. Install dependencies:
   - `npm install`
3. Copy env template and fill values:
   - `cp .env.local.example .env.local`
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase SQL editor, run `supabase/schema.sql`.
5. In Supabase dashboard, **manually enable Realtime** for:
   - `teams`
   - `room_timers`
6. Run locally:
   - `npm run dev`

## Deploy to Vercel

1. Push this project to a Git provider.
2. Import the repo in Vercel.
3. Add env vars in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Important Notes

- This tool is for internal ops and assumes anon-key access with RLS disabled.
- Realtime updates depend on enabling Realtime on `teams` and `room_timers`.
- CSV parser handles the special `PROJECTS TABLE` meta-header row and duplicate header artifacts.
