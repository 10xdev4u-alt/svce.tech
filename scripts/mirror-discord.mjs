/**
 * Discord webhook mirror for svce.tech
 *
 * Posts upcoming events to a Discord channel as embeds, edits the same
 * messages in place when event details change, and prunes state once events
 * are over. State (posted UID -> messageId + content hash) is stored as a
 * JSON file in the private subscriptions repo so runs are idempotent.
 *
 * Importable: all logic is exported for unit tests.
 * CLI: node scripts/mirror-discord.mjs --events src/data/events.json --state <file>
 *      (requires DISCORD_WEBHOOK_URL; pass --dry-run to preview without posting)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EMBED_COLOR = 0x22c55e; // green — matches the site's aurora accent
const MAX_EMBEDS_PER_MESSAGE = 10;
const MAX_TITLE = 256;
const MAX_DESCRIPTION = 4096;
const MAX_FIELD_VALUE = 1024;
const REQUEST_INTERVAL_MS = 500; // Discord webhooks: ~5 req / 2s

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/** Stable UID per event (same algorithm as the iCal feed). */
export function eventUid(event) {
  const base = `${event.eventName}|${event.eventDate}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  return `${Math.abs(hash).toString(16)}@svce.tech`;
}

/** Content hash — changes when any displayed detail changes. */
export function contentHash(event) {
  const parts = [
    event.eventName,
    event.eventDescription,
    event.eventDate,
    event.eventTime,
    event.eventEndDate ?? '',
    event.eventEndTime ?? '',
    event.eventVenue,
    event.eventLink,
    event.location,
    event.communityName,
    event.alert?.type ?? '',
    event.alert?.message ?? ''
  ].join('|');
  let hash = 5381;
  for (let i = 0; i < parts.length; i++) {
    hash = ((hash << 5) + hash + parts.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
}

/** True once an event has fully ended (end time passed). */
export function isPastEvent(event, now) {
  return getEventEndDate(event).getTime() < now.getTime();
}

/** End-of-event as a local Date (end time when given, else end of last day). */
export function getEventEndDate(event) {
  const end = new Date(`${event.eventEndDate ?? event.eventDate}T00:00:00`);
  if (event.eventEndTime) {
    const [h, m] = event.eventEndTime.split(':').map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) end.setHours(h, m, 0, 0);
  } else {
    end.setHours(23, 59, 59, 999);
  }
  return end;
}

/** Events that haven't ended and start within `windowDays` of today. */
export function upcomingEvents(events, now, windowDays = 14) {
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + windowDays);
  horizon.setHours(23, 59, 59, 999);
  return events.filter((event) => {
    const start = new Date(`${event.eventDate}T00:00:00`);
    return start <= horizon && !isPastEvent(event, now);
  });
}

/** Truncate long strings to Discord embed limits with an ellipsis. */
export function truncate(text, max) {
  const value = String(text ?? '');
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

/** "8 Aug 2026" (en-IN style, matching the site). */
function formatDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "13:00" -> "1:00 pm" (case normalized for tests). */
function formatTime(time) {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    .replace(/\s?am/i, ' am')
    .replace(/\s?pm/i, ' pm');
}

/** Human schedule label, e.g. "8 Aug 2026 · 10:00 am – 5:30 pm". */
export function scheduleLabel(event) {
  const date = formatDate(event.eventDate);
  const end =
    event.eventEndDate && event.eventEndDate !== event.eventDate
      ? formatDate(event.eventEndDate)
      : null;
  const time = formatTime(event.eventTime);
  const endTime =
    event.eventEndTime && event.eventEndTime !== event.eventTime
      ? formatTime(event.eventEndTime)
      : null;
  if (end && endTime) return `${date} – ${end} · ${time} – ${endTime}`;
  if (end) return `${date} – ${end} · ${time}`;
  if (endTime) return `${date} · ${time} – ${endTime}`;
  return `${date} · ${time}`;
}

/** Build a Discord embed for one event, respecting all embed limits. */
export function buildEmbed(event) {
  const fields = [
    { name: '📅 When', value: truncate(scheduleLabel(event), MAX_FIELD_VALUE), inline: true },
    { name: '📍 Where', value: truncate(event.eventVenue, MAX_FIELD_VALUE), inline: true },
    { name: '🏷 Community', value: truncate(event.communityName, MAX_TITLE), inline: true }
  ];
  if (event.alert) {
    fields.push({
      name: '⚠️ Notice',
      value: truncate(event.alert.message, MAX_FIELD_VALUE),
      inline: false
    });
  }
  return {
    title: truncate(event.eventName, MAX_TITLE),
    description: truncate(event.eventDescription, MAX_DESCRIPTION),
    url: event.eventLink,
    color: EMBED_COLOR,
    fields,
    footer: { text: 'svce.tech · SVCE Tech Hub' }
  };
}

/** Chunk embed-bearing items into messages of at most 10 embeds. */
export function splitMessages(items, maxPerMessage = MAX_EMBEDS_PER_MESSAGE) {
  const messages = [];
  for (let i = 0; i < items.length; i += maxPerMessage) {
    messages.push(items.slice(i, i + maxPerMessage));
  }
  return messages;
}

/**
 * Figure out what this run should do given the events and stored state.
 * Returns { toPost, toPatch, toPrune, messages, upcomingUids }.
 */
export function planSync(events, state, now, windowDays = 14) {
  const upcoming = upcomingEvents(events, now, windowDays);
  const toPost = [];
  const toPatch = [];
  for (const event of upcoming) {
    const uid = eventUid(event);
    const hash = contentHash(event);
    const embed = buildEmbed(event);
    const existing = state[uid];
    if (!existing) {
      toPost.push({ uid, hash, embed });
    } else if (existing.hash !== hash) {
      toPatch.push({ uid, hash, embed, messageId: existing.messageId });
    }
  }
  const upcomingUids = new Set(upcoming.map(eventUid));
  const toPrune = Object.keys(state).filter((uid) => !upcomingUids.has(uid));
  return { toPost, toPatch, toPrune, messages: splitMessages(toPost), upcomingUids };
}

/** Parse a webhook URL into { id, token }. Returns null for malformed URLs. */
export function parseWebhook(url) {
  const match = /\/api\/webhooks\/(\d+)\/([^/]+)/.exec(url ?? '');
  if (!match) return null;
  return { id: match[1], token: match[2] };
}

/**
 * Execute the plan against Discord: POST new events, PATCH changed ones,
 * drop pruned state. Throws on the first failed request so state is only
 * committed when every change succeeded (next run retries cleanly).
 */
export async function applySync(
  plan,
  webhookUrl,
  state,
  { fetchImpl = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}
) {
  const next = { ...state };
  const parsed = parseWebhook(webhookUrl);
  if (!parsed) throw new Error(`Invalid Discord webhook URL: ${webhookUrl}`);

  for (const batch of plan.messages) {
    const res = await fetchImpl(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: batch.map((item) => item.embed) })
    });
    if (!res.ok) throw new Error(`Discord POST failed: ${res.status} ${res.statusText}`);
    const message = await res.json();
    for (const item of batch) {
      next[item.uid] = { messageId: message.id, hash: item.hash };
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  for (const patch of plan.toPatch) {
    const res = await fetchImpl(`${webhookUrl}/messages/${patch.messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [patch.embed] })
    });
    if (!res.ok)
      throw new Error(`Discord PATCH failed (${patch.uid}): ${res.status} ${res.statusText}`);
    next[patch.uid] = { messageId: patch.messageId, hash: patch.hash };
    await sleep(REQUEST_INTERVAL_MS);
  }

  for (const uid of plan.toPrune) delete next[uid];

  return {
    state: next,
    posted: plan.messages.flat().length,
    patched: plan.toPatch.length,
    pruned: plan.toPrune.length
  };
}

/* ------------------------------------------------------------------ */
/* CLI main (guarded so tests can import the module)                  */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { events: null, state: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--events') args.events = argv[++i];
    else if (arg === '--state') args.state = argv[++i];
    else if (arg === '--dry-run') args.dryRun = true;
  }
  return args;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]));

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!args.events || !args.state) {
    console.error(
      'Usage: node scripts/mirror-discord.mjs --events <events.json> --state <state.json> [--dry-run]'
    );
    console.error('Set DISCORD_WEBHOOK_URL for live posting.');
    process.exit(1);
  }

  const events = readJson(args.events);
  if (!Array.isArray(events)) {
    console.error(`❌ Could not read events from ${args.events}`);
    process.exit(1);
  }

  const state = readJson(args.state) ?? {};
  const plan = planSync(events, state, new Date());

  console.log(
    `📋 Plan: ${plan.toPost.length} new, ${plan.toPatch.length} updated, ${plan.toPrune.length} pruned`
  );

  if (args.dryRun) {
    plan.messages.forEach((batch, i) => {
      console.log(`  [message ${i + 1}] ${batch.length} embed(s)`);
      batch.forEach((item) => console.log(`    - ${item.embed.title}`));
    });
    plan.toPatch.forEach((patch) => console.log(`  [patch] ${patch.embed.title}`));
    process.exit(0);
  }

  if (!webhookUrl) {
    console.error('❌ DISCORD_WEBHOOK_URL is not set — refusing to run without a target channel.');
    process.exit(1);
  }

  try {
    const result = await applySync(plan, webhookUrl, state);
    mkdirSync(dirname(args.state), { recursive: true });
    writeFileSync(args.state, `${JSON.stringify(result.state, null, 2)}\n`);
    console.log(
      `✅ Mirrored ${result.posted} new, updated ${result.patched}, pruned ${result.pruned} → ${args.state}`
    );
  } catch (error) {
    console.error(`❌ Mirror failed: ${error.message}`);
    process.exit(1);
  }
}
