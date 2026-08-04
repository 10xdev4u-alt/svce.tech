import { describe, expect, it } from 'vitest';
import {
  isValidDate,
  validateEvents,
  validateCommunities,
  validateOpportunities,
  validateResources,
  createChecker
} from './validate-data.mjs';

const validEvent = {
  eventName: 'Hack Night',
  eventDescription: 'Build something cool',
  eventDate: '2026-08-20',
  eventTime: '18:00',
  eventVenue: 'Lab 3',
  eventLink: 'https://example.com/hacknight',
  location: 'SVCE',
  communityName: 'Dev Club'
};

const validCommunity = { name: 'Dev Club', website: 'https://devclub.example' };
const validOpportunity = {
  title: 'Summer Internship',
  type: 'internship',
  organization: 'Acme',
  description: 'A 12-week internship',
  link: 'https://example.com/internship',
  postedDate: '2026-07-01'
};
const validResource = {
  title: 'DSA Sheet',
  category: 'dsa',
  description: 'Curated problem list',
  link: 'https://example.com/dsa'
};

describe('isValidDate', () => {
  it('accepts valid calendar dates', () => {
    expect(isValidDate('2026-08-20')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true); // leap year
  });

  it('rejects malformed and impossible dates', () => {
    expect(isValidDate('2026-13-01')).toBe(false); // month 13
    expect(isValidDate('2026-02-30')).toBe(false); // Feb 30
    expect(isValidDate('2023-02-29')).toBe(false); // not a leap year
    expect(isValidDate('20-08-2026')).toBe(false); // wrong format
    expect(isValidDate('2026/08/20')).toBe(false);
  });
});

describe('validateEvents', () => {
  it('passes a valid event', () => {
    const checker = validateEvents([validEvent]);
    expect(checker.passed).toBe(true);
  });

  it('rejects a missing required field', () => {
    const { eventName: _omit, ...missingName } = validEvent;
    const checker = validateEvents([missingName]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('eventName required'))).toBe(true);
  });

  it('rejects an invalid date format', () => {
    const checker = validateEvents([{ ...validEvent, eventDate: '20-08-2026' }]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('eventDate must be YYYY-MM-DD'))).toBe(true);
  });

  it('rejects a bad time', () => {
    const checker = validateEvents([{ ...validEvent, eventTime: '25:99' }]);
    expect(checker.passed).toBe(false);
  });

  it('rejects a non-http link', () => {
    const checker = validateEvents([{ ...validEvent, eventLink: 'www.example.com' }]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('eventLink must be a valid URL'))).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    const checker = validateEvents([
      { ...validEvent, eventEndDate: '2026-08-10' } // before 2026-08-20
    ]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('eventEndDate must be >= eventDate'))).toBe(
      true
    );
  });

  it('rejects duplicate event names on the same date', () => {
    const checker = validateEvents([validEvent, validEvent]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('duplicate event'))).toBe(true);
  });

  it('rejects an unknown alert type', () => {
    const checker = validateEvents([{ ...validEvent, alert: { message: 'Moved', type: 'flood' } }]);
    expect(checker.passed).toBe(false);
  });

  it('accepts a valid alert', () => {
    const checker = validateEvents([
      { ...validEvent, alert: { message: 'Moved to Hall 2', type: 'venue-change' } }
    ]);
    expect(checker.passed).toBe(true);
  });
});

describe('validateCommunities', () => {
  it('passes a valid community', () => {
    expect(validateCommunities([validCommunity]).passed).toBe(true);
  });

  it('rejects a missing name', () => {
    const checker = validateCommunities([{ website: 'https://x.example' }]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('name required'))).toBe(true);
  });

  it('rejects a bad website URL', () => {
    const checker = validateCommunities([{ name: 'C', website: 'not a url' }]);
    expect(checker.passed).toBe(false);
  });
});

describe('validateOpportunities', () => {
  it('passes a valid opportunity', () => {
    expect(validateOpportunities([validOpportunity]).passed).toBe(true);
  });

  it('rejects an unknown type', () => {
    const checker = validateOpportunities([{ ...validOpportunity, type: 'gig' }]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('type must be one of'))).toBe(true);
  });

  it('rejects a missing postedDate', () => {
    const { postedDate: _omit, ...missingDate } = validOpportunity;
    expect(validateOpportunities([missingDate]).passed).toBe(false);
  });

  it('rejects a bad deadline', () => {
    const checker = validateOpportunities([{ ...validOpportunity, deadline: 'tomorrow' }]);
    expect(checker.passed).toBe(false);
  });
});

describe('validateResources', () => {
  it('passes a valid resource', () => {
    expect(validateResources([validResource]).passed).toBe(true);
  });

  it('rejects an unknown category', () => {
    const checker = validateResources([{ ...validResource, category: 'memes' }]);
    expect(checker.passed).toBe(false);
  });

  it('rejects a non-string tag', () => {
    const checker = validateResources([{ ...validResource, tags: ['dsa', 42] }]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('tags must all be non-empty strings'))).toBe(
      true
    );
  });

  it('rejects duplicate titles', () => {
    const checker = validateResources([validResource, validResource]);
    expect(checker.passed).toBe(false);
    expect(checker.failures.some((f) => f.includes('duplicate resource'))).toBe(true);
  });
});

describe('createChecker', () => {
  it('counts checks and aggregates failures', () => {
    const checker = createChecker();
    checker.check(true, 'ok');
    checker.check(false, 'boom');
    expect(checker.checks).toBe(2);
    expect(checker.failures).toEqual(['boom']);
    expect(checker.passed).toBe(false);
  });
});
