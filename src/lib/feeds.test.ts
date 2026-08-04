import { describe, expect, it } from 'vitest';
import type { Event } from '@/types/event';
import { buildIcs, filterFeedEvents } from './ical';
import { buildRss } from './rss';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    eventName: 'Hack Night',
    eventDescription: 'Build something cool, win prizes.',
    eventDate: '2026-08-20',
    eventTime: '18:00',
    eventVenue: 'Lab 3, SVCE',
    eventLink: 'https://example.com/hacknight',
    location: 'SVCE',
    communityName: 'Dev Club',
    ...overrides
  };
}

describe('buildIcs', () => {
  it('produces a valid VCALENDAR envelope', () => {
    const ics = buildIcs([makeEvent()]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//svce.tech//SVCE Tech Hub//EN');
  });

  it('emits one VEVENT with start time', () => {
    const ics = buildIcs([makeEvent()]);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20260820T180000');
    expect(ics).toContain('SUMMARY:Hack Night');
  });

  it('emits an exclusive DTEND when an end time exists on the same day', () => {
    const ics = buildIcs([makeEvent({ eventEndTime: '20:00' })]);
    expect(ics).toContain('DTEND:20260820T200000');
  });

  it('emits an all-day end for multi-day events without an end time', () => {
    const ics = buildIcs([makeEvent({ eventEndDate: '2026-08-22' })]);
    // iCal DTEND is exclusive -> end date + 1 day.
    expect(ics).toContain('DTEND;VALUE=DATE:20260823');
  });

  it('escapes commas, semicolons and newlines in text fields', () => {
    const ics = buildIcs([makeEvent({ eventVenue: 'Lab 3, SVCE; Main Block' })]);
    expect(ics).toContain('LOCATION:Lab 3\\, SVCE\\; Main Block');
  });

  it('generates a stable UID for the same event', () => {
    const a = buildIcs([makeEvent()]);
    const b = buildIcs([makeEvent()]);
    const uidA = a.match(/UID:(.*)@svce\.tech/)?.[0];
    const uidB = b.match(/UID:(.*)@svce\.tech/)?.[0];
    expect(uidA).toBe(uidB);
  });
});

describe('filterFeedEvents', () => {
  const now = new Date(2026, 7, 20, 12, 0, 0); // 20 Aug 2026 12:00 local

  it('keeps events that have not happened yet', () => {
    const upcoming = makeEvent({ eventDate: '2026-08-25' });
    expect(filterFeedEvents([upcoming], now)).toHaveLength(1);
  });

  it('keeps events that ended within the 48h grace window', () => {
    const justEnded = makeEvent({
      eventDate: '2026-08-19',
      eventTime: '10:00',
      eventEndTime: '12:00'
    });
    expect(filterFeedEvents([justEnded], now)).toHaveLength(1);
  });

  it('drops events that ended longer ago than the grace window', () => {
    const old = makeEvent({ eventDate: '2026-08-01' });
    expect(filterFeedEvents([old], now)).toHaveLength(0);
  });

  it('honours a custom grace window', () => {
    const endedYesterday = makeEvent({
      eventDate: '2026-08-19',
      eventTime: '10:00',
      eventEndTime: '12:00'
    });
    expect(filterFeedEvents([endedYesterday], now, 6)).toHaveLength(0);
  });
});

describe('buildRss', () => {
  const options = {
    title: 'SVCE Tech Hub — Events',
    description: 'Tech events around SVCE.',
    siteUrl: 'https://svce-tech.vercel.app',
    feedUrl: 'https://svce-tech.vercel.app/feed.xml'
  };

  it('produces an RSS 2.0 document with channel metadata', () => {
    const xml = buildRss([makeEvent()], options);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>SVCE Tech Hub — Events</title>');
    expect(xml).toContain('<atom:link href="https://svce-tech.vercel.app/feed.xml"');
  });

  it('emits an item per event with pubDate and escaped content', () => {
    const xml = buildRss([makeEvent()], options);
    expect(xml).toContain('<item>');
    expect(xml).toContain('<title>Hack Night</title>');
    expect(xml).toContain('<pubDate>Thu, 20 Aug 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('</item>');
  });

  it('sorts events by date ascending', () => {
    const later = makeEvent({ eventName: 'Later', eventDate: '2026-09-01' });
    const earlier = makeEvent({ eventName: 'Earlier', eventDate: '2026-08-01' });
    const xml = buildRss([later, earlier], options);
    expect(xml.indexOf('<title>Earlier</title>')).toBeLessThan(xml.indexOf('<title>Later</title>'));
  });

  it('escapes XML special characters', () => {
    const xml = buildRss([makeEvent({ eventName: 'C++ & JS <x>' })], options);
    expect(xml).toContain('<title>C++ &amp; JS &lt;x&gt;</title>');
  });
});
