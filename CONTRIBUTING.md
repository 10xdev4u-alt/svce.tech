# Contributing to SVCE Tech Hub

Thanks for helping grow the SVCE tech community! Adding events, clubs, or opportunities is designed
to take **2 minutes** — no complex setup, just a JSON edit and a pull request.

## 🗺️ The contribution flow

1. **Suggest it** — open an issue using the [**Add an Event**](.github/ISSUE_TEMPLATE/add-event.yml) form
   (or go straight to step 2 if you're ready).
2. Fork → edit a JSON file in `src/data/` → open a pull request.
3. GitHub checks it automatically: **CI** (validate + lint + build), **PR title** (must be conventional),
   **Vercel preview** — and **CodeRabbit** reviews the code.
4. Checks pass → merge → it's live on the site. No maintainer babysitting needed.

## 🚀 Quick Start (Add an Event)

1. Fork this repo
2. Open `src/data/events.json`
3. Append your event using the template below
4. Open a pull request — done!

### Event Template

```json
{
  "eventName": "PULSE '26 — National Symposium",
  "eventDescription": "A national-level technical symposium organized by the EEE department with workshops, paper presentations and project expo.",
  "eventDate": "2026-09-18",
  "eventTime": "09:30",
  "eventEndDate": "2026-09-19",
  "eventEndTime": "17:00",
  "eventVenue": "Sri Venkateswara College of Engineering, Sriperumbudur",
  "eventLink": "https://example.com/register",
  "location": "Sriperumbudur",
  "communityName": "IEEE SVCE Student Branch",
  "communityLogo": "https://example.com/logo.png",
  "alert": {
    "message": "Registration closes 2 days before the event",
    "type": "general"
  }
}
```

**Field requirements:**

- `eventDate`: `YYYY-MM-DD` · `eventTime`: 24-hour `HH:MM`
- `eventEndDate` / `eventEndTime`: optional, for multi-day events
- `eventLink`: a valid registration/event URL
- `communityLogo`: optional. Host on imgbb or add the hostname to `next.config.ts`
- `alert`: optional. Types: `postponed`, `venue-change`, `cancelled`, `general`

## 🏛️ Add a Club

Append to `src/data/communities.json`:

```json
{
  "name": "Your Club Name",
  "description": "What the club does in 1-2 sentences",
  "location": "SVCE, Sriperumbudur",
  "website": "https://example.com"
}
```

## 💼 Add an Opportunity

Append to `src/data/opportunities.json`:

```json
{
  "title": "Summer Internship — Frontend",
  "type": "internship",
  "organization": "Acme Corp",
  "description": "3-month paid internship for 2nd/3rd year students.",
  "link": "https://example.com/apply",
  "deadline": "2026-10-01",
  "postedDate": "2026-08-04"
}
```

`type` is one of: `internship` | `hackathon` | `job` | `research` | `scholarship`

## ✅ Before You Submit

- [ ] Dates are in the future and valid
- [ ] Links are real and accessible
- [ ] No fake or placeholder data — only real events/opportunities
- [ ] Run `pnpm validate:data` — this checks dates, links, and field schemas

> CI runs `pnpm validate:data`, `pnpm lint` and `pnpm build` on every pull request, so a bad
> entry can never break the site. A non-conventional PR title is rejected automatically.

## 💬 Commit & PR Title Style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PULSE symposium event
fix: correct workshop date
docs: update contribution guide
```

Both **commit messages** and **PR titles** follow this format (a CI check enforces the PR title).
Keep them tight — 6-word style.

## 📝 License

By contributing, you agree your contributions are licensed under the MIT License.
