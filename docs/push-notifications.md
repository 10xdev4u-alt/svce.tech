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

## Files

- `src/components/PushSubscribe.tsx` — bell button + prompt (single instance)
- `public/sw.js` — service worker (push + notificationclick)
- `src/app/api/save-subscription/route.ts` — register a subscription
- `src/app/api/remove-subscription/route.ts` — unregister a subscription
- `src/lib/webpush.ts` — VAPID config + send helpers
- `.github/workflows/manage-subscriptions.yml` — save/remove files in subs repo
- `.github/workflows/send-notifications.yml` — send to all subscribers + prune 410s

## Notes

- Push only works over HTTPS (Vercel handles this)
- The bell hides itself in unsupported browsers
- The prompt appears once, 6 seconds after load, only in production
