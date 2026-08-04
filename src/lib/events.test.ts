import { describe, expect, it } from 'vitest';
import type { Event } from '@/types/event';
import {
  formatDate,
  formatTime,
  formatEventSchedule,
  getAlertTitle,
  formatVenue,
  getGoogleCalendarUrl,
  partitionEvents
} from './events';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    eventName: 'Test Event',
    eventDescription: 'A test event',
    eventDate: '2026-08-20',
    eventTime: '10:00',
    eventVenue: 'Main Auditorium',
    eventLink: 'https://example.com/event',
    location: 'SVCE',
    communityName: 'Test Club',
    ...overrides
  };
}

describe('formatDate', () => {
  it('formats a YYYY-MM-DD string into day-month-year', () => {
    expect(formatDate('2026-08-08')).toBe('8 Aug 2026');
  });

  it('returns the input unchanged when the date is invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('pads nothing but keeps correct month names', () => {
    expect(formatDate('2026-01-01')).toContain('Jan');
    expect(formatDate('2026-12-31')).toContain('Dec');
  });
});

describe('formatTime', () => {
  it('formats 24h HH:MM into 12h with AM/PM', () => {
    // AM/PM letter-case is locale-dependent; assert the time structure only.
    expect(formatTime('13:00').toLowerCase()).toBe('1:00 pm');
    expect(formatTime('09:30').toLowerCase()).toBe('9:30 am');
  });

  it('handles midnight and noon', () => {
    expect(formatTime('00:00')).toMatch(/12:00/);
    expect(formatTime('12:00')).toMatch(/12:00/);
  });

  it('returns the input unchanged when malformed', () => {
    expect(formatTime('oops')).toBe('oops');
  });
});

describe('formatEventSchedule', () => {
  it('renders single-day with time', () => {
    expect(formatEventSchedule(makeEvent({ eventDate: '2026-08-08', eventTime: '10:00' }))).toBe(
      '8 Aug 2026 · 10:00 am'
    );
  });

  it('renders multi-day with both times', () => {
    const schedule = formatEventSchedule(
      makeEvent({
        eventDate: '2026-08-08',
        eventTime: '09:00',
        eventEndDate: '2026-08-09',
        eventEndTime: '17:00'
      })
    );
    expect(schedule).toBe('8 Aug 2026 – 9 Aug 2026 · 9:00 am – 5:00 pm');
  });

  it('renders multi-day without end time', () => {
    const schedule = formatEventSchedule(
      makeEvent({ eventDate: '2026-08-08', eventTime: '10:00', eventEndDate: '2026-08-10' })
    );
    expect(schedule).toBe('8 Aug 2026 – 10 Aug 2026 · 10:00 am');
  });

  it('renders end time on the same day', () => {
    const schedule = formatEventSchedule(
      makeEvent({ eventDate: '2026-08-08', eventTime: '10:00', eventEndTime: '12:00' })
    );
    expect(schedule).toBe('8 Aug 2026 · 10:00 am – 12:00 pm');
  });
});

describe('getAlertTitle', () => {
  it('maps alert types to titles', () => {
    expect(getAlertTitle('postponed')).toBe('Event Postponed');
    expect(getAlertTitle('venue-change')).toBe('Venue Changed');
    expect(getAlertTitle('cancelled')).toBe('Event Cancelled');
  });

  it('falls back to a generic notice', () => {
    expect(getAlertTitle('general')).toBe('Important Notice');
    expect(getAlertTitle(undefined)).toBe('Important Notice');
  });
});

describe('formatVenue', () => {
  it('title-cases words longer than 3 chars and preserves acronyms', () => {
    expect(formatVenue('main auditorium')).toBe('Main Auditorium');
    // Short words (<= 3 chars) are kept as-is — preserved acronyms by design.
    expect(formatVenue('AI ML workshop')).toBe('AI ML Workshop');
    // 4+ char words get title-cased even if they look like acronyms.
    expect(formatVenue('IEEE cs chapter')).toBe('Ieee cs Chapter');
  });

  it('trims surrounding whitespace but keeps inner spacing', () => {
    expect(formatVenue('  Main Auditorium ')).toBe('Main Auditorium');
    expect(formatVenue('hall  1')).toBe('Hall  1');
  });
});

describe('getGoogleCalendarUrl', () => {
  it('builds a calendar render URL with encoded params', () => {
    const url = getGoogleCalendarUrl(
      makeEvent({ eventName: 'Hack Night', eventVenue: 'Lab 3, SVCE' })
    );
    expect(url).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render\?/);
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Hack+Night');
    expect(url).toContain('dates=20260820%2F20260820');
    // URLSearchParams decodes '+' back to space; decodeURIComponent does not.
    const params = new URLSearchParams(new URL(url).search);
    expect(params.get('location')).toBe('Lab 3, SVCE');
    expect(params.get('text')).toBe('Hack Night');
    expect(params.get('details')).toContain('More info: https://example.com/event');
  });

  it('uses the end date for multi-day events', () => {
    const url = getGoogleCalendarUrl(
      makeEvent({ eventDate: '2026-08-20', eventEndDate: '2026-08-22' })
    );
    expect(url).toContain('dates=20260820%2F20260822');
  });
});

describe('partitionEvents', () => {
  const today = new Date(2026, 7, 15); // 15 Aug 2026

  it('puts same-month non-past events into monthly', () => {
    const event = makeEvent({ eventDate: '2026-08-20' });
    const { monthly } = partitionEvents([event], today);
    expect(monthly).toHaveLength(1);
    expect(monthly[0].eventName).toBe('Test Event');
  });

  it('excludes past events in the same month', () => {
    const past = makeEvent({ eventDate: '2026-08-01' });
    const { monthly } = partitionEvents([past], today);
    expect(monthly).toHaveLength(0);
  });

  it('keeps an event ending today in monthly (multi-day)', () => {
    const endingToday = makeEvent({ eventDate: '2026-08-10', eventEndDate: '2026-08-15' });
    const { monthly } = partitionEvents([endingToday], today);
    expect(monthly).toHaveLength(1);
  });

  it('puts future-month events into upcoming', () => {
    const later = makeEvent({ eventDate: '2026-09-05' });
    const { upcoming } = partitionEvents([later], today);
    expect(upcoming).toHaveLength(1);
  });

  it('excludes same-month events from upcoming', () => {
    const sameMonth = makeEvent({ eventDate: '2026-08-20' });
    const { upcoming } = partitionEvents([sameMonth], today);
    expect(upcoming).toHaveLength(0);
  });
});
