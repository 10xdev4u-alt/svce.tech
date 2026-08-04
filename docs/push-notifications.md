# Push Notifications Setup

svce.tech sends web push notifications to subscribers whenever new events or opportunities are
added. This documents how the pipeline works and how it was configured.

## How it works

```
[User clicks bell]
  → /api/save-subscription (production only)
  → SHA-256 hash of endpoint = subscriptionId
  → repository_dispatch to GitHub Actions
  → workflow stores one JSON file per subscriber
     in the private `svce-subscriptions` repo

[Sending]
  → push to events.json / opportunities.json OR manual workflow dispatch
  → send-notifications.yml reads all subscription files
  → web-push CLI sends to each endpoint (VAPID auth)
  → dead subscriptions (410) are pruned
```

## Architecture (why no database)

Subscriptions are stored as JSON files in a **private GitHub repo** (`svce-subscriptions`),
managed entirely by GitHub Actions. This means:

- Zero infrastructure cost
- No database to maintain
- Subscriptions stay private (repo is private)
- Every action is auditable in the Actions log

## Env vars needed

| Var                                      | Where                   | Purpose                           |
| ---------------------------------------- | ----------------------- | --------------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`           | Vercel                  | Browser-side subscribe key        |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Vercel + GitHub secrets | Send notifications                |
| `GITHUB_TOKEN`                           | Vercel                  | Dispatch events to Actions        |
| `GH_DB_PAT`                              | GitHub secrets          | Actions clones subscriptions repo |
| `SUBSCRIPTION_REPO`                      | GitHub secrets          | `owner/svce-subscriptions`        |

## Generate fresh VAPID keys

```bash
npx web-push generate-vapid-keys
```

Then update Vercel env vars and GitHub secrets.

## Sending a test notification

1. Go to **Actions → Send Push Notifications → Run workflow**
2. Enter title/body/url
3. Leave **test mode** on (sends to first 3 subscribers only)

## Per-event "remind me" push (Phase 10)

Users can set a reminder on any event card/modal (**at start / 1 hour before / 1 day before**).
Reminders are scheduled server-side — the Notification Triggers API was removed from Chrome and
client-side SW timers are unreliable, so a **GitHub Actions cron workflow** does the sending.

```
[User clicks Remind me on a card]
  → localStorage (UI state, always)
  → /api/save-reminder (production only)
  → repository_dispatch save_reminder
  → manage-reminders.yml writes reminders/<id>.json
     (id = <subscriptionId>-<hash(eventName|eventDate)>)

[Every 10 minutes]
  → send-reminders.yml (cron */10)
  → scans reminders/*.json for remindAt <= now
  → sends web-push to that subscription, deletes the handled file
```

- Cancel via `/api/cancel-reminder` → dispatch `remove_reminder` → file deleted.
- Reminders are pruned by the same workflow (a failed/expired reminder file stays until due).
- Cron min granularity is 5 min; GitHub pauses cron after 60 days of repo inactivity.

## Discord mirror (Phase 10)

Every upcoming event (next 14 days) is posted to the community Discord channel as an embed.
Because Discord webhooks support **editing** their own messages, updates to an event's details
patch the same message in place — no duplicate announcements. State (uid → messageId + content
hash) lives in the private subscriptions repo as `discord-state.json`.

```
[Every 6h + on push to events.json]
  → mirror-discord.yml
  → checkout repo + private subs repo (state)
  → node scripts/mirror-discord.mjs
     → upcoming events → embeds (≤10 per message, 500ms between calls)
     → new: POST embed · changed: PATCH in place · over: prune state
  → commit discord-state.json back to subs repo
```

- Needs `DISCORD_WEBHOOK_URL` (GitHub secret) — create the webhook in your Discord channel first.
- Run `node scripts/mirror-discord.mjs --events src/data/events.json --state <file> --dry-run`
  to preview what would be posted without sending anything.
- Slash commands (/events, /upcoming) are a planned follow-up via a Discord interactions endpoint.

## Files

- `src/components/PushSubscribe.tsx` — bell button + prompt (single instance)
- `src/components/home/remind-me-button.tsx` — per-event reminder button + offset menu (portaled to body)
- `src/lib/reminders.ts` — offsets, remind-at computation, reminder IDs
- `public/sw.js` — service worker (push + notificationclick)
- `src/app/api/save-subscription/route.ts` — register a subscription
- `src/app/api/remove-subscription/route.ts` — unregister a subscription
- `src/app/api/save-reminder/route.ts` — save a per-event reminder
- `src/app/api/cancel-reminder/route.ts` — cancel a per-event reminder
- `src/lib/webpush.ts` — VAPID config + send helpers
- `.github/workflows/manage-subscriptions.yml` — save/remove files in subs repo
- `.github/workflows/manage-reminders.yml` — save/remove reminder files in subs repo
- `.github/workflows/send-notifications.yml` — send to all subscribers + prune 410s
- `.github/workflows/send-reminders.yml` — cron sender for due reminders
- `.github/workflows/mirror-discord.yml` — cron + push mirror of events to the Discord webhook
- `scripts/mirror-discord.mjs` — pure embed/plan logic + CLI (dry-run supported)

## Notes

- Push only works over HTTPS (Vercel handles this)
- The bell hides itself in unsupported browsers
- The prompt appears once, 6 seconds after load, only in production
