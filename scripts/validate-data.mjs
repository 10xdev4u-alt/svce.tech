/**
 * Data validation for svce.tech
 * Checks events.json, communities.json and opportunities.json against their schemas.
 * Run with: node scripts/validate-data.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const URL_RE = /^https?:\/\/.+/;
const ALERT_TYPES = new Set(['postponed', 'venue-change', 'cancelled', 'general']);
const OPPORTUNITY_TYPES = new Set(['internship', 'hackathon', 'job', 'research', 'scholarship']);

const failures = [];
let checks = 0;

function check(condition, message) {
  checks++;
  if (!condition) failures.push(message);
}

function isValidDate(dateStr) {
  if (!DATE_RE.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateStr;
}

function validateEvents(events) {
  check(Array.isArray(events), 'events.json must be an array');
  if (!Array.isArray(events)) return;

  const names = new Set();
  events.forEach((event, i) => {
    const where = `event[${i}]`;
    check(typeof event === 'object' && event !== null, `${where} must be an object`);

    check(
      typeof event.eventName === 'string' && event.eventName.trim(),
      `${where}.eventName required`
    );
    check(
      typeof event.eventDescription === 'string' && event.eventDescription.trim(),
      `${where}.eventDescription required`
    );
    check(isValidDate(event.eventDate), `${where}.eventDate must be YYYY-MM-DD and valid`);
    check(TIME_RE.test(event.eventTime ?? ''), `${where}.eventTime must be HH:MM (24h)`);
    check(
      typeof event.eventVenue === 'string' && event.eventVenue.trim(),
      `${where}.eventVenue required`
    );
    check(
      typeof event.eventLink === 'string' && URL_RE.test(event.eventLink),
      `${where}.eventLink must be a valid URL`
    );
    check(
      typeof event.location === 'string' && event.location.trim(),
      `${where}.location required`
    );
    check(
      typeof event.communityName === 'string' && event.communityName.trim(),
      `${where}.communityName required`
    );

    if (event.eventEndDate) check(isValidDate(event.eventEndDate), `${where}.eventEndDate invalid`);
    if (event.eventEndTime)
      check(TIME_RE.test(event.eventEndTime), `${where}.eventEndTime must be HH:MM`);

    if (event.eventEndDate && event.eventDate) {
      check(
        new Date(event.eventEndDate) >= new Date(event.eventDate),
        `${where}: eventEndDate must be >= eventDate`
      );
    }

    if (event.alert) {
      check(
        typeof event.alert.message === 'string' && event.alert.message.trim(),
        `${where}.alert.message required`
      );
      if (event.alert.type) {
        check(
          ALERT_TYPES.has(event.alert.type),
          `${where}.alert.type must be one of ${[...ALERT_TYPES].join(', ')}`
        );
      }
    }

    if (event.communityLogo)
      check(URL_RE.test(event.communityLogo), `${where}.communityLogo must be a valid URL`);

    const key = `${event.eventName}|${event.eventDate}`;
    if (names.has(key))
      failures.push(`${where}: duplicate event "${event.eventName}" on ${event.eventDate}`);
    names.add(key);
  });
}

function validateCommunities(communities) {
  check(Array.isArray(communities), 'communities.json must be an array');
  if (!Array.isArray(communities)) return;

  communities.forEach((community, i) => {
    const where = `community[${i}]`;
    check(typeof community === 'object' && community !== null, `${where} must be an object`);
    check(typeof community.name === 'string' && community.name.trim(), `${where}.name required`);
    if (community.website)
      check(URL_RE.test(community.website), `${where}.website must be a valid URL`);
    if (community.logo) check(URL_RE.test(community.logo), `${where}.logo must be a valid URL`);
  });
}

function validateOpportunities(opportunities) {
  check(Array.isArray(opportunities), 'opportunities.json must be an array');
  if (!Array.isArray(opportunities)) return;

  opportunities.forEach((opp, i) => {
    const where = `opportunity[${i}]`;
    check(typeof opp === 'object' && opp !== null, `${where} must be an object`);
    check(typeof opp.title === 'string' && opp.title.trim(), `${where}.title required`);
    check(
      OPPORTUNITY_TYPES.has(opp.type),
      `${where}.type must be one of ${[...OPPORTUNITY_TYPES].join(', ')}`
    );
    check(
      typeof opp.organization === 'string' && opp.organization.trim(),
      `${where}.organization required`
    );
    check(
      typeof opp.description === 'string' && opp.description.trim(),
      `${where}.description required`
    );
    check(
      typeof opp.link === 'string' && URL_RE.test(opp.link),
      `${where}.link must be a valid URL`
    );
    if (opp.deadline) check(isValidDate(opp.deadline), `${where}.deadline must be YYYY-MM-DD`);
    check(isValidDate(opp.postedDate), `${where}.postedDate must be YYYY-MM-DD`);
  });
}

const files = [
  { file: 'events.json', validate: validateEvents },
  { file: 'communities.json', validate: validateCommunities },
  { file: 'opportunities.json', validate: validateOpportunities }
];

for (const { file, validate } of files) {
  try {
    const raw = readFileSync(join(dataDir, file), 'utf8');
    validate(JSON.parse(raw));
    console.log(`✅ ${file} parsed and checked`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      failures.push(`${file} is not valid JSON: ${error.message}`);
    } else {
      failures.push(`${file} could not be read: ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`\n❌ ${failures.length} validation failure(s) out of ${checks} checks:\n`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`\n🎉 All data valid — ${checks} checks passed.`);
