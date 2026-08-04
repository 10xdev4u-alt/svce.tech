# svce.tech — SVCE Tech Hub

> A community hub for discovering tech events, clubs, opportunities and resources around
> **Sri Venkateswara College of Engineering (SVCE), Sriperumbudur**.

[![Live site](https://img.shields.io/badge/website-live-brightgreen)](https://svce-tech.vercel.app)
[![CI](https://github.com/10xdev4u-alt/svce.tech/actions/workflows/ci.yml/badge.svg)](https://github.com/10xdev4u-alt/svce.tech/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/unit%20tests-102-blue)](<>)
[![E2E](https://img.shields.io/badge/e2e%20tests-17-blue)](<>)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

Built on a simple, durable idea: **content lives in JSON files, anyone can contribute, and the
site survives every graduating batch.** No database, no CMS lock-in — just Git.

---

## ✨ Features

**Discover**

- 📅 **Events** — this month & upcoming, campus and nearby tech events, with community/location filters and a calendar view
- 🏛️ **Clubs** — searchable directory of SVCE student chapters
- 💼 **Opportunities** — internships, hackathons, jobs and research, community-shared
- 📚 **Resources** — off-campus portals, DSA/interview prep, courses, community-shared
- 🔎 **Global search** — ⌘K/`Ctrl+K` palette across everything, with SEO sitemap + robots

**Never miss anything**

- 🔔 **Web push notifications** — one-click subscribe (bell) for new events & opportunities
- ⏰ **Per-event "remind me"** — at start / 1 hour before / 1 day before, delivered by real push
- 📡 **Subscription feeds** — iCal (`/events.ics`, Google Calendar friendly) and RSS (`/feed.xml`), with a 48h post-event trim on the calendar feed
- 🗄️ **Past-events archive** — `/events/archive`, month-grouped with "ended X days ago" labels
- 🐦 **Discord mirror** — upcoming events posted to the community Discord as embeds (with in-place edits)

**Delightful**

- 🌗 **Dark mode** — light by default (no theme flash), manual toggle, OS-aware
- 📱 **Fully responsive** — hamburger mobile nav, touch-friendly cards
- ⚡ **Fast by design** — statically generated pages, edge-cached feeds

---

## 🛠️ Tech Stack

| Layer     | Choice                                                                             |
| --------- | ---------------------------------------------------------------------------------- |
| Framework | [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/)    |
| Language  | [TypeScript](https://www.typescriptlang.org/)                                      |
| Styling   | [Tailwind CSS](https://tailwindcss.com/) + Framer Motion                           |
| Icons     | [Phosphor Icons](https://phosphoricons.com/)                                       |
| Data      | Plain JSON in `src/data/` — validated by scripts                                   |
| Push      | [web-push](https://github.com/web-push-libs/web-push) (VAPID) + GitHub Actions     |
| Testing   | [Vitest](https://vitest.dev/) (unit) + [Playwright](https://playwright.dev/) (E2E) |
| Infra     | [Vercel](https://vercel.com/) + GitHub Actions (zero-cost, no database)            |

---

## 🚀 Getting Started

**Prerequisites:** Node.js ≥ 22 and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000`.

### Scripts

| Command                                   | What it does                                                    |
| ----------------------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                                | Start the dev server (Turbopack)                                |
| `pnpm build`                              | Production build                                                |
| `pnpm start`                              | Serve the built app                                             |
| `pnpm lint`                               | ESLint (Next + flat config, zero warnings allowed)              |
| `pnpm test`                               | Run all unit tests (Vitest)                                     |
| `pnpm test:watch`                         | Unit tests in watch mode                                        |
| `pnpm test:e2e`                           | Run the Playwright E2E smoke suite (auto-starts the dev server) |
| `pnpm validate:data`                      | Validate all JSON data files (289 checks)                       |
| `pnpm format:check` / `pnpm format:write` | Prettier check / fix                                            |

---

## 🏗️ Architecture

```
JSON data files  ──►  statically generated pages  ──►  Vercel edge
      │
      └── validated in CI (289 checks) + pre-commit
```

- **The "CMS" is Git.** Add an event by editing `src/data/events.json` and opening a PR — production
  even fetches the live JSON so new events go out **without a redeploy**.
- **Push, reminders and the Discord mirror are zero-infra**: API routes dispatch GitHub Actions
  workflows, which keep JSON state in a private repo and send via VAPID/webhooks. Details in
  [`docs/push-notifications.md`](./docs/push-notifications.md).

### Project structure

```
src/
  app/            # App Router pages + API routes (events.ics, feed.xml, archive…)
  components/     # home / clubs / opportunities / resources / shared / search
  data/           # events.json · communities.json · opportunities.json · resources.json
  lib/            # events, ical, rss, reminders, webpush, constants
  types/          # shared TypeScript types
scripts/          # validate-data.mjs · mirror-discord.mjs (+ test suites)
tests/e2e/        # Playwright smoke suite (17 tests)
.github/workflows/  # CI + push/reminder/Discord automation
docs/             # state-of-the-project · agent-playbook · push-notifications
```

---

## ✅ Quality Gates

Every PR to `main` must pass, enforced by branch protection:

1. **Lint, validate data & build** — ESLint (0 warnings), 102 unit tests, 289 data checks, production build
2. **E2E smoke (Playwright)** — 17 browser tests across pages, theme, nav, search and feeds
3. **Validate PR title** — conventional commits required
4. **Vercel** — production deploy preview

CodeRabbit reviews every PR (advisory). The workflow is documented in
[`docs/agent-playbook.md`](./docs/agent-playbook.md).

---

## 🤝 Contributing

Check out [CONTRIBUTING.md](./CONTRIBUTING.md). The most common contribution is **adding an event —
it takes 2 minutes**: edit `src/data/events.json`, run `pnpm validate:data`, open a PR.

---

## 📚 Docs

- [`docs/state-of-the-project.md`](./docs/state-of-the-project.md) — project state & handoff
- [`docs/agent-playbook.md`](./docs/agent-playbook.md) — dev flow, gotchas, secrets, ops
- [`docs/push-notifications.md`](./docs/push-notifications.md) — push / reminders / Discord pipeline

---

## 📄 License

[MIT](./LICENSE) © 2026 [princetheprogrammerbtw](https://github.com/princetheprogrammerbtw)
