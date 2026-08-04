# Agent Playbook — svce.tech

The remembrance file. Read this first. It encodes the dev flow, every gotcha we've
hit, the architecture, and what's still pending — so the next session starts warm
instead of cold.

## TL;DR — current state

- **Branch:** `main` is the only branch that matters. All work lands via PRs.
- **Roadmap: DONE** (Phases 1–10). Last merged: `38bf51b feat: add discord events mirror (#25)`.
- **Gates enforced by branch protection:** `Lint, validate data & build` · `Validate PR title` · `E2E smoke (Playwright)` · `Vercel`. CodeRabbit is **advisory** (its pending state shows `UNSTABLE` — still mergeable).
- **Tests:** 102 vitest unit + 17 Playwright E2E.
- **Open items:** Discord webhook secret not yet set (manual step, needs the user). Next 16 + Tailwind 4 upgrades quarantined behind dependabot ignore rules.

## The locked dev flow (follow this every time)

1. `git checkout main && git fetch origin main && git reset --hard origin/main` — **never** `git pull --ff-only` after squash merges (it fails; see gotchas).
2. `git checkout -b <type>/<slug>` — branches are `phase/N-*`, `docs/*`, `feat/*`, `fix/*`, `ci/*`, `test/*`.
3. Build in small pieces. Pure logic goes in `src/lib/*.ts` or `scripts/*.mjs` with unit tests alongside.
4. **Local gate before pushing:**
   ```bash
   pnpm test              # vitest: src/**/*.test.ts + scripts/**/*.test.mjs
   pnpm validate:data     # 289 data checks
   pnpm lint              # next lint + eslint --max-warnings 0
   pnpm build             # next build (catches TS errors + wrong icon names)
   pnpm exec prettier --write <files>
   pnpm test:e2e          # 17 Playwright tests (auto-starts its own dev server)
   ```
5. Commit conventionally (**6-word subjects**, commitlint enforces): `feat:` `fix:` `docs:` `ci:` `test:` `refactor:`. Husky runs lint-staged + validate-data on every commit.
6. Push, open PR to `main` with a body in the repo's style (What / Changes / Tests / manual steps).
7. Wait for the 4 required checks (≈2 min + E2E ≈1.5 min), then `gh pr merge N --squash --delete-branch`.
8. Sync main again, verify live with `curl`.

## Gotchas — things that actually bit us

### Commit chains + lint-staged "mass staging" 🐛

Sequential `git add X && git commit` chains in one command can let lint-staged's stash dance swallow **all** pending changes into the first commit (11 files in a "feat" commit) and make later commits fail with "no changes added to commit".
**Fix:** after the fact, `git reset --soft <base> && git reset -q`, re-stage in clean chunks, and **verify each commit** with `git show --stat HEAD --format='' | wc -l` (expect: files + 1 line). Works reliably.

### `git pull --ff-only` fails after squash merges

Local `main` can point at a pre-squash commit while origin/main has the squashed one → `Not possible to fast-forward, aborting.`
**Fix:** `git fetch origin main && git reset --hard origin/main`. Always.

### Ghost branches 🫥

`git branch -r` can show branches that GitHub already deleted (the `--delete-branch` on merges works; local refs just went stale). We "pruned 19 branches" that were already gone.
**Fix:** `git fetch --prune origin` first, then verify reality via `gh api repos/<owner>/<repo>/branches --jq '.[].name'` before deleting anything.

### Timezone & date rules 🕐

- `new Date('YYYY-MM-DD')` parses as **local midnight** — no `toISOString()` round-trips (shifts days in positive UTC offsets).
- Events are "past" only when their end time has **strictly** passed (`end < now`, not `<=`) — boundary tests use `08:59` vs `09:00`, never equal times.
- RSS `pubDate` must be UTC-safe: parse `eventDate` as UTC (`new Date(dateStr + 'T00:00:00Z')`) or the day shifts on non-UTC machines.
- In tests, build "now" with `new Date(2026, 7, 15, 9, 0, 0)` (local ctor), never `new Date('2026-08-15T...')` strings.

### E2E quirks

- Playwright **auto-starts** `pnpm dev` (`webServer` block in `playwright.config.ts`, `reuseExistingServer: !CI`). If the suite times out, the previous dev server may be wedged on :3000 — `pnpm test:e2e` again (or kill stale `next dev`) and it self-heals.
- `test-results/` + `playwright-report/` are gitignored — delete freely.
- Home page has **two `<h1>`s** (hero + events section) → strict-mode locators need `.first()`.
- Icon-only buttons need `aria-label` or role queries fail.

### UI / component traps

- The remind-me dropdown **must be portaled** (`createPortal` → `document.body` with fixed positioning) or it renders under the card's stacking context and clicks open the modal instead. Same pattern as the mobile-nav sheet.
- Phosphor icons: it's **`Archive`**, not `ArchiveBox` (build fails with a type error — `pnpm build` catches it, `pnpm lint` won't). Server components import from `@phosphor-icons/react/dist/ssr`.

### Feed routes

- `/events.ics` is **`force-dynamic`** (needs a request-time clock for the 48h post-event trim) — edge-cached via `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`. Do **not** flip it back to force-static.
- `/feed.xml` is force-static.
- Events are also fetched **live from `raw.githubusercontent.com`** in production by the events section — editing `events.json` goes live without a redeploy.

## Architecture map (why there's no database)

```
[site] → API routes → repository_dispatch → GH Actions
        → JSON state files in the PRIVATE repo (SUBSCRIPTION_REPO secret)
```

- **Private subs repo** (`svce-subscriptions`, via `GH_DB_PAT`): one JSON per push subscription, `reminders/<id>.json` per reminder, `discord-state.json` for the Discord mirror.
- **Workflows:** `manage-subscriptions.yml` / `manage-reminders.yml` (dispatch → write files), `send-notifications.yml` (push + prune 410s), `send-reminders.yml` (cron `*/10`), `mirror-discord.yml` (cron `17 */6` + push on events.json).
- **Rules:** state commits happen only after the operation fully succeeds (a failed POST throws before state is written → next run retries cleanly).

## Secrets inventory

| Secret                                   | Used by                                    | Set?                                 |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`           | Vercel env (browser subscribe)             | ✅                                   |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Vercel + GitHub (send pushes)              | ✅                                   |
| `GITHUB_TOKEN`                           | Vercel (dispatch events)                   | ✅                                   |
| `GH_DB_PAT`                              | GitHub (checkout subs repo)                | ✅                                   |
| `SUBSCRIPTION_REPO`                      | GitHub (`10xdev4u-alt/svce-subscriptions`) | ✅                                   |
| `DISCORD_WEBHOOK_URL`                    | GitHub (mirror workflow)                   | ⏳ **NOT SET — pending manual step** |

**Pending manual step (user):** create a Discord webhook in the server (Server Settings → Integrations → Webhooks), add it as `DISCORD_WEBHOOK_URL`, then run **Actions → Mirror Events to Discord → Run workflow**. Offer to do this when the user provides the URL.

## Deferred upgrades (quarantined on purpose)

| Upgrade        | Why quarantined                                                                                                                                                                           | Unblock path                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Tailwind 4** | CSS-first config (no `tailwind.config.ts`), PostCSS plugin moved to `@tailwindcss/postcss`. Build fails cleanly → deliberate rewrite, own PR. Dependabot ignore rule: `tailwindcss >= 4`. | Rewrite config + tokens, then remove ignore rule. |
| **Next 16**    | Removes `next lint` (the `lint` script depends on it) → migrate to ESLint CLI in the same PR. Dependabot ignore rule in place.                                                            | One PR: migrate lint + upgrade.                   |

Do NOT merge dependabot bumps for either until the deliberate PR exists.

## Quick reference

- Repo: `10xdev4u-alt/svce.tech` · Prod: `https://svce-tech.vercel.app` · Feeds: `/events.ics`, `/feed.xml` · Archive: `/events/archive`
- Data lives in `src/data/*.json` (validated by `scripts/validate-data.mjs`, 289 checks, runs in pre-commit + CI).
- Key libs: `src/lib/events.ts` (dates/partition/past helpers), `src/lib/ical.ts` (+ `filterFeedEvents`), `src/lib/rss.ts`, `src/lib/reminders.ts`, `scripts/mirror-discord.mjs`.
- Full project history & status: `docs/state-of-the-project.md` · Push pipeline detail: `docs/push-notifications.md`.
