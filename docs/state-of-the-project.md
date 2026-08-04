# svce.tech — Project State & Handoff

> **Purpose of this doc:** pick up work after a gap with zero context. Everything important about
> what was built, how it works, what's broken, and what's next. Owner: 10xdev4u (git 10xdev4u-alt).
> Last updated: 2026-08-05.

---

## 1. At a glance

|                     |                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product**         | Community hub for tech events, clubs, opportunities & resources around **SVCE, Sriperumbudur** (campus **+** nearby Chennai meetups — _not_ campus-only) |
| **Stack**           | Next.js 15 (App Router, `--turbopack` dev) · React 19 · TypeScript · Tailwind + Framer Motion · Phosphor Icons                                           |
| **Package manager** | pnpm                                                                                                                                                     |
| **Deployed at**     | https://svce-tech.vercel.app (Vercel, prod)                                                                                                              |
| **GitHub**          | `10xdev4u-alt/svce.tech` (public) + `10xdev4u-alt/svce-subscriptions` (private, push-sub DB)                                                             |
| **Data model**      | Everything is **static JSON** in `src/data/` — anyone contributes via PR (2-minute flow, see `CONTRIBUTING.md`)                                          |
| **Validation**      | `pnpm validate:data` (289 checks) runs in CI + lint-staged pre-commit                                                                                    |
| **Commits**         | Conventional commits only (commitlint enforces), 6-word style                                                                                            |

---

## 2. Quick commands

```bash
pnpm dev            # local dev (turbopack)
pnpm build          # production build (must pass)
pnpm lint           # next lint + eslint --max-warnings 0 (zero warnings allowed)
pnpm validate:data  # validates all JSON data files (events, communities, opportunities, resources)
vercel --prod --yes # deploy to production
```

Deploy flow used every phase: **validate → lint → build → conventional commits → push → vercel --prod → curl-verify live**.

---

## 3. What's shipped (Phases 1–8)

| Phase | What |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 · Core hub** | Home (hero w/ live-computed stats, "this month" + "upcoming" events), Clubs directory (`/clubs`), design system "Campus Aurora", header/footer, not-found, error page |
| **2 · Contribution engine** | Data validation script (`scripts/validate-data.mjs`, timezone-safe date checks), wired into lint-staged + CI, CONTRIBUTING.md |
| **3 · Push notifications** | Bell (single instance) + 6s prompt, service worker, hashed API routes, private subscriptions repo, 2 workflows, VAPID/GH secrets. **See §6 — was broken, now proven fixed** |
| **4 · Event UX** | Clickable cards → detail modal (register, add-to-calendar, share, copy, WhatsApp), calendar view (multi-day aware), community/location filters, cards↔calendar toggle, a11y pass |
| **5 · Resources & placement** | `/resources` — 21 real resources (off-campus/job-fairs, DSA, interview, aptitude, resume, open-source, courses), category filter chips, contribute callout. **No SVCE placement stuff** |
| **6 · Search & SEO** | Global **⌘K** search palette (events/clubs/opportunities/resources, keyboard nav, event results open the detail modal), `robots.ts` + `sitemap.ts` | | **7 · Mobile & dark mode** | **Shipped 2026-08-04.** Semantic design tokens (`--surface`/`--surface-2`/`--ink`/`--line`/`--overlay`/`--on-accent`) + class-based `.dark`, FOUC-safe inline theme script + sun/moon toggle (**light by default**, pinned override), hamburger mobile nav (sheet below `lg`), global `:focus-visible` ring, mobile select-width fix. _2026-08-05: default changed from OS-following to **light** — dark only when the visitor pins it._ |
| **8 · Community & flow locks** | **Shipped 2026-08-05.** PR-driven workflow enforced end-to-end: branch protection on `main` (strict, enforce-admins, requires CI + title check + Vercel), semantic-PR-title CI gate, PR template, Dependabot (weekly npm + actions), CodeRabbit review bot + config, issue templates (add-event/bug/feature), CONTRIBUTING flow section, dependabot ignore rules for coupled majors (eslint-config-next ≥16, typescript ≥6) |

**Also fixed along the way:** sunrise palette shades 600–900 were missing (white text on light-orange chips in dark mode — root cause of a visible bug), notification popup was rendering against the header (`backdrop-filter` containing block) → fixed via portal to `document.body`.

---

## 4. Architecture & file map

```
src/
  app/
    page.tsx                  # Home: Hero + Events (filters/calendar/modal)
    clubs/page.tsx            # Clubs directory
    opportunities/page.tsx    # Opportunities board
    resources/page.tsx        # Resources hub
    robots.ts  sitemap.ts     # SEO routes (static)
    layout.tsx  not-found.tsx  error.tsx  globals.css  icon.svg
    api/
      save-subscription/route.ts    # POST → GH dispatch (prod-only)
      remove-subscription/route.ts  # POST → GH dispatch (prod-only)
  components/
    home/       hero · events (orchestrator) · event-card · event-modal · calendar-view · empty-event-card · call-to-action
    clubs/      clubs.tsx
    opportunities/  opportunities.tsx
    resources/      resources.tsx
    search/     search-palette.tsx   # ⌘K palette (portal to body)
    shared/     header.tsx (nav + SearchPalette + PushSubscribe) · footer.tsx
    PushSubscribe.tsx           # bell + prompt + error toast (portal to body!)
  data/         events.json · communities.json · opportunities.json · resources.json  ← THE CONTENT
  lib/          events.ts (date/time/calendar helpers) · webpush.ts (lazy VAPID) · constants.ts
  types/        event.ts
public/         logo.svg · sw.js (service worker)
scripts/        validate-data.mjs
.github/workflows/  ci.yml · manage-subscriptions.yml · send-notifications.yml
docs/           push-notifications.md · state-of-the-project.md (this file)
```

**Key patterns to keep:**

- **JSON → PR → auto-live.** Never fabricate data. Events/opportunities came from verified sources only (owner rule: **NO AI data**).
- Client components import JSON directly (`@/data/*.json`) — same as server components. Fine for this size.
- **Portal anything `fixed` that renders inside the header** (`backdrop-blur` on header creates a containing block → `position: fixed` breaks).
- Palette: `aurora` (green), `sunrise` (amber, 50–900 all defined now), `ink` (#0f172a). Chips use light bg + dark text (`text-sunrise-800 bg-sunrise-100` style).
- Lint is **zero-warning strict** (`--max-warnings 0`). Data validation must pass before commit (lint-staged).
- Browser tests done with throwaway Playwright scripts (`python3` + playwright sync API) against `pnpm dev` — pattern reusable for any new phase.

---

## 5. Contribution model (what "anyone can contribute" means)

1. Suggest it: open an issue via the **Add an Event / Bug Report / Feature Request** forms (`.github/ISSUE_TEMPLATE/`) — or skip ahead if you're ready.
2. Fork → edit a JSON file in `src/data/` → PR.
3. CI runs `validate:data` + lint + build + **PR-title check** (conventional titles enforced at the PR level); lint-staged runs on commit locally.
4. Data schemas enforced by `scripts/validate-data.mjs` (duplicate names/dates rejected, URL checks, date/time format, category whitelists).
5. `CONTRIBUTING.md` has the flow + templates. README features list **includes Resources** (added in Phase 7).
6. `main` is **branch-protected**: only PRs with green CI + title check + Vercel deploy merge (CodeRabbit reviews advisory).

---

## 6. Push notification pipeline (Phase 3 — read this!)

**Flow:** Bell/`PushSubscribe.tsx` → browser subscribes → POST to `/api/save-subscription` (prod-only) → dispatches GitHub `repository_dispatch` → workflow saves `{sha256(endpoint)}.json` to the private `svce-subscriptions` repo. `send-notifications.yml` fires on events/opportunities data pushes or manual dispatch. Dead subscriptions (410/404) get pruned.

**Infra that must exist (all set up, verify if things break):**

- GitHub secrets: `SUBSCRIPTION_REPO=10xdev4u-alt/svce-subscriptions`, `GH_DB_PAT` (repo-scoped PAT), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Vercel env (production): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `GITHUB_TOKEN` (dispatch token)

**History / gotchas (do not regress):**

- The subs repo was created **empty** (no `main` branch) → checkout/clone failed. It now has a README on `main`.
- Workflow action matching: routes dispatch `save_push_subscription` / `remove_push_subscription`; the workflow's `if:` conditions must compare against **those exact strings** (was `== 'save'` — silently never saved).
- `send-notifications.yml` must `npm install -g web-push` before sending (added), and its Summary step reads `steps.send.outputs.sent`.
- `webpush.ts` configures VAPID **lazily** (module-load config crashed prod builds with real env vars).
- Full loop proven: dispatched save → file landed → dispatched remove → file gone.

**Manual test:** GitHub → Actions → **Send Push Notifications** → Run workflow (keep `test_mode` on first). Or dispatch a `save_push_subscription` via `gh api .../dispatches --input file.json`.

---

## 7. Known loose ends (small, not yet tackled)

1. ~~Stale TODO comments in `error.tsx`/`not-found.tsx`~~ — resolved: `error.tsx` doesn't exist on disk and `not-found.tsx` is fully customized.
2. **README Features list missing Resources** — fixed in Phase 7 (added).
3. ~~Half-baked dark mode~~ — **DONE in Phase 7**: tokens + `.dark` + toggle (default = light).
4. ~~Header nav crowded on mobile~~ — **DONE in Phase 7**: hamburger sheet below `lg`.
5. Search matches are substring-only ("hackathon" returns 3 instead of 2 — broad but acceptable).
6. ~~No unit tests yet~~ — **DONE in Phase 9**: vitest (44 unit tests) + Playwright E2E (9 tests) in CI.

---

## 8. Roadmap — remaining phases

| Phase | Scope |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- || **7 · Mobile & dark mode** | ✅ **Shipped 2026-08-04** — tokens, toggle, hamburger nav (default = light since 2026-08-05) |
| **8 · Community & flow locks** | ✅ **Shipped 2026-08-05** — PR template, branch protection, title gate, Dependabot, CodeRabbit, issue templates, CONTRIBUTING flow || **9 · Testing & reliability** | ✅ **Shipped 2026-08-05** — vitest unit tests (44) for `lib/events.ts` + `validate-data.mjs`, Playwright E2E smoke (9) wired into CI as a required job || **10 · Growth** | ✅ **Shipped 2026-08-05** — iCal feed (`/events.ics`, 48h post-event trim) + RSS (`/feed.xml`), per-event "remind me" push (cron-scheduled, server-side), past-events archive page (`/events/archive`, grouped by month with "ended X ago" labels). Remaining: Telegram/Discord bot mirror |

---

## 9. 🗂️ PHASE 7 — Detailed todos (do these when we come back)

**Goal:** kill the whole class of "contrast / overflow on mobile + dark mode" issues properly.

### A. Dark mode ✅ (shipped 2026-08-04)

- [x] **Decision:** chose **(a) proper dark theme** + sun/moon toggle. _2026-08-05: light-by-default — no system-following (owner decision)._
- [x] Introduce CSS tokens (`--surface`, `--surface-2`, `--ink`, `--line`, `--overlay`, `--on-accent`) as RGB triplets in `globals.css`; mapped every hardcoded `bg-white`, `text-ink`, `border-black/5`, `bg-[#fbfbf7]`, `bg-white/xx` across components to tokens.
- [x] Converted in order: header/footer → hero (`dark:bg-aurora-hero-dark`) → event cards + modal + calendar → search palette → opportunities → resources → clubs → chips (kept light chips w/ dark text — they pass contrast on dark surfaces).
- [x] `color-scheme` set via CSS (`:root` light / `.dark` dark) so form controls/scrollbars match; FOUC-safe inline script sets `.dark` before paint.
- [x] Verified every page in dark mode (Playwright computed-style probe, no console errors, no horizontal scroll at 320/375/768).

### B. Mobile nav ✅ (shipped 2026-08-04)

- [x] Header overflow fixed: nav links + Contribute hide below `lg`; hamburger toggles an animated sheet holding links + Contribute; Search/bell/toggle stay in the bar.
- [x] Hamburger ships (interim icon-only fallback not needed).
- [x] Tested at 320 / 375 / 768 / 1280 px (Playwright): no horizontal scroll, all header controls reachable, sheet closes on nav/Escape.

### C. Cross-cutting ✅

- [x] Global `:focus-visible` outline added (touch/keyboard).
- [x] Final gate: `pnpm validate:data` (289 ✓) + `pnpm lint` (0 warnings ✓) + `pnpm build` ✓ + Playwright smoke (30/30) — conventional commits → PR → merge → `vercel --prod --yes` → live verify.

---

## 10. PHASE 8 — What was locked (shipped 2026-08-05)

**Goal:** turn the "good practice" PR flow into an **enforced pipeline** so the repo can't be bypassed.

- [x] **Branch protection on `main`** — strict (`required_status_checks.strict: true`), enforce-admins, requires `Lint, validate data & build` + `Validate PR title` + `Vercel`. Verified live: direct `git push origin main` → `GH006 Protected branch update failed`.
- [x] **Semantic PR title gate** — `amannn/action-semantic-pull-request` (runs via `pull_request_target` from `main`, so untrusted forks can't tamper with it). Non-conventional titles are blocked.
- [x] **PR template** — `.github/PULL_REQUEST_TEMPLATE.md` (what / test plan / conventional-title reminder).
- [x] **Dependabot** — weekly `npm` + `github-actions` updates, conventional `chore(deps)` messages, `dependencies` label, `open-pull-requests-limit: 5`. **Ignore rules added for coupled majors:** `eslint-config-next >=16` (needs Next 16) and `typescript >=6` (rejects CSS side-effect imports) — both broke CI when auto-bumped.
- [x] **CodeRabbit** — configured (`.coderabbit.yaml`), reviews every PR; **advisory** (not a required check — it rate-limits on the free plan and would block Dependabot merges). `auto_pause_after_reviewed_commits: 3` keeps free-plan quota alive on busy branches.
- [x] **Issue templates** — `.github/ISSUE_TEMPLATE/`: `add-event.yml` (JSON-fields form, this repo's whole contribution model), `bug-report.yml`, `feature-request.yml`, `config.yml` (good-first-issue, help-wanted links).
- [x] **CONTRIBUTING.md flow section** — "The contribution flow" + note that PR titles are enforced, 6-word style.
- [x] **Auto-merge + delete-branch-on-merge** repo settings enabled.
- [x] **Dependabot sweep 2026-08-05:** 8/10 PRs merged (lint-staged 17, commitlint 21, @types/node 26, actions v7/v5, prettier 3.9.6, prettier-plugin-tailwindcss 0.8.1, amannn v6); #9 (eslint-config-next 16) and #10 (typescript 6) closed as genuine breaks + ignore rules added.

**Gotcha:** with `strict: true`, Dependabot PRs go `BEHIND` after each merge → always `gh pr update-branch` before merging, then wait for re-checks. Lockfile conflicts on rebase: regenerate with `pnpm install --lockfile-only` (never `git checkout --theirs` + `git add -A` blind — it can commit conflict markers; verify with `grep -c '<<<<<<<' package.json`).

---

## 11. House rules (the owner's non-negotiables)

- **NO AI-generated/fabricated data.** Every event/opportunity/resource is real & verified (real links). SVCE-specific _placement_ links are banned ("SVCE sucks at placements" — keep resources general: off-campus, job fairs, prep).
- Conventional commits only, keep them tight (6-word style), push straight to `main`.
- The site is **campus + nearby meetups** — community events outside SVCE are welcome.
- Bug-before-feature: if validation finds something broken (like the push pipeline), fix it first, then continue.
