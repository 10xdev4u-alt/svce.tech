/**
 * Data validation for svce.tech
 * Checks events.json, communities.json, opportunities.json and resources.json
 * against their schemas.
 *
 * Importable: the validator functions are exported for unit tests.
 * CLI: run with `node scripts/validate-data.mjs` (guarded main below).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const URL_RE = /^https?:\/\/.+/;
export const ALERT_TYPES = new Set(['postponed', 'venue-change', 'cancelled', 'general']);
export const OPPORTUNITY_TYPES = new Set([
  'internship',
  'hackathon',
  'job',
  'research',
  'scholarship'
]);
export const RESOURCE_CATEGORIES = new Set([
  'offcampus',
  'dsa',
  'interview',
  'aptitude',
  'resume',
  'opensource',
  'courses'
]);

/** Collector that records every failed check. */
export function createChecker() {
  const failures = [];
  let checks = 0;
  return {
    check(condition, message) {
      checks++;
      if (!condition) failures.push(message);
    },
    get failures() {
      return failures;
    },
    get checks() {
      return checks;
    },
    get passed() {
      return failures.length === 0;
    }
  };
}

export function isValidDate(dateStr) {
  // Strict calendar-date check that is timezone-safe (no toISOString round-trip,
  // which would shift the day in positive UTC offsets).
  if (!DATE_RE.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function validateEvents(events, checker = createChecker()) {
  const { check } = checker;
  check(Array.isArray(events), 'events.json must be an array');
  if (!Array.isArray(events)) return checker;

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
      checker.failures.push(`${where}: duplicate event "${event.eventName}" on ${event.eventDate}`);
    names.add(key);
  });
  return checker;
}

export function validateCommunities(communities, checker = createChecker()) {
  const { check } = checker;
  check(Array.isArray(communities), 'communities.json must be an array');
  if (!Array.isArray(communities)) return checker;

  communities.forEach((community, i) => {
    const where = `community[${i}]`;
    check(typeof community === 'object' && community !== null, `${where} must be an object`);
    check(typeof community.name === 'string' && community.name.trim(), `${where}.name required`);
    if (community.website)
      check(URL_RE.test(community.website), `${where}.website must be a valid URL`);
    if (community.logo) check(URL_RE.test(community.logo), `${where}.logo must be a valid URL`);
  });
  return checker;
}

export function validateOpportunities(opportunities, checker = createChecker()) {
  const { check } = checker;
  check(Array.isArray(opportunities), 'opportunities.json must be an array');
  if (!Array.isArray(opportunities)) return checker;

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
  return checker;
}

export function validateResources(resources, checker = createChecker()) {
  const { check } = checker;
  check(Array.isArray(resources), 'resources.json must be an array');
  if (!Array.isArray(resources)) return checker;

  const titles = new Set();
  resources.forEach((resource, i) => {
    const where = `resource[${i}]`;
    check(typeof resource === 'object' && resource !== null, `${where} must be an object`);
    check(typeof resource.title === 'string' && resource.title.trim(), `${where}.title required`);
    check(
      RESOURCE_CATEGORIES.has(resource.category),
      `${where}.category must be one of ${[...RESOURCE_CATEGORIES].join(', ')}`
    );
    check(
      typeof resource.description === 'string' && resource.description.trim(),
      `${where}.description required`
    );
    check(
      typeof resource.link === 'string' && URL_RE.test(resource.link),
      `${where}.link must be a valid URL`
    );
    if (resource.tags) {
      check(Array.isArray(resource.tags), `${where}.tags must be an array`);
      check(
        resource.tags.every((tag) => typeof tag === 'string' && tag.trim()),
        `${where}.tags must all be non-empty strings`
      );
    }
    if (titles.has(resource.title))
      checker.failures.push(`${where}: duplicate resource "${resource.title}"`);
    titles.add(resource.title);
  });
  return checker;
}

/** Validate all data files on disk. Returns a checker. */
export function validateAllData() {
  const checker = createChecker();
  const files = [
    { file: 'events.json', validate: validateEvents },
    { file: 'communities.json', validate: validateCommunities },
    { file: 'opportunities.json', validate: validateOpportunities },
    { file: 'resources.json', validate: validateResources }
  ];

  for (const { file, validate } of files) {
    try {
      const raw = readFileSync(join(dataDir, file), 'utf8');
      validate(JSON.parse(raw), checker);
      console.log(`✅ ${file} parsed and checked`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        checker.failures.push(`${file} is not valid JSON: ${error.message}`);
      } else {
        checker.failures.push(`${file} could not be read: ${error.message}`);
      }
    }
  }
  return checker;
}

// Guard: only run the CLI when executed directly (not when imported by tests).
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]));

if (isMain) {
  const checker = validateAllData();
  if (!checker.passed) {
    console.error(
      `\n❌ ${checker.failures.length} validation failure(s) out of ${checker.checks} checks:\n`
    );
    checker.failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
  }
  console.log(`\n🎉 All data valid — ${checker.checks} checks passed.`);
}
