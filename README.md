# FC GOAT Tracker

A full-stack web app to settle the eternal debate in a group of friends: **who is the GOAT at EA Sports FC?**
Players log their matches, and the app derives rankings, stats and head-to-head records from the match history — no manually edited counters, the history is the single source of truth.

## Features

- **Match logging** with score, game mode (standard squads, Ultimate Team, 95-rated squads), session and notes.
- **GOAT ranking** computed from results: win = 3 pts, draw = 1, loss = 0, plus a **K.O. bonus** (+2) when the winner leads by 5+ goals. Ties broken by win rate. Rankings are available **per game mode and per season**.
- **Seasons by date**: matches and sessions are assigned to a season automatically by database triggers; new seasons can be scheduled ahead of time.
- **Player profiles, head-to-head comparisons, history and statistics** pages.
- **Sessions** to group the matches played on the same night.
- **Authentication** with email/password, password recovery via email link, and onboarding where each new account creates its own player.
- Responsive layout for desktop and mobile.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide-react |
| Backend | Next.js Server Actions · Zod validation |
| Database & auth | Supabase (PostgreSQL, Auth, Row Level Security) |
| Infra | Vercel · Vercel Analytics |

## Architecture highlights

- **Security in the database, not the UI.** Every table has Row Level Security: reads are public, and writes are only allowed to signed-in members (e.g. a match can only be edited or deleted by its author or the players involved). The UI never decides permissions.
- **Server Actions with typed results.** All mutations go through `lib/services/fc-actions.ts`, validated with Zod and returning a discriminated `ActionResult<T>` (`{ ok: true, data } | { ok: false, error }`) instead of throwing.
- **Pure domain logic.** Scoring rules, K.O. detection and ranking aggregation live as pure functions in `types/index.ts`, independent of persistence — easy to test and to change the rules.
- **Persistence boundary.** The UI talks to `lib/services/fc-service.ts`; the app started on `localStorage` and was migrated to Supabase without changing the UI's contract.
- **Session refresh at the edge.** `proxy.ts` refreshes the Supabase Auth session on every request and forwards cache headers so a CDN never serves one user's session to another.
- **Versioned schema.** The database is defined by SQL migrations in `supabase/migrations/` (tables, RLS policies, triggers and helper functions) plus a seed file.

## Project structure

```
app/(app)/            # Routes: ranking, players, matches, sessions, head-to-head, statistics, settings, auth
components/           # UI components (shadcn/ui in components/ui)
hooks/                # Client hooks (current player, store)
lib/services/         # Server Actions + data service
lib/supabase/         # Browser, server and admin Supabase clients, row mappers
types/index.ts        # Domain types and scoring rules
supabase/migrations/  # PostgreSQL schema, RLS policies, triggers
proxy.ts              # Auth session refresh
```

## Getting started

Requirements: Node.js, pnpm and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
pnpm install
supabase init           # first time only: creates supabase/config.toml
supabase start          # local Postgres + Auth
supabase db reset       # apply migrations and seed
```

Create `.env.local` with the values printed by `supabase start`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, used to create confirmed accounts
```

```bash
pnpm dev                # http://localhost:3000
pnpm lint
pnpm build
```
