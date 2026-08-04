import type { Event } from '@/types/event';
import { getEventEndDate } from './events';

/**
 * Keep events that haven't ended yet plus a grace window after they finish,
 * so subscribed calendars stop broadcasting events once they're old news.
 * Defaults to 48 hours past the end of the event.
 */
export function filterFeedEvents(events: Event[], now: Date, graceHours = 48): Event[] {
  const cutoff = new Date(now.getTime() - graceHours * 3_600_000);
  return events.filter((event) => getEventEndDate(event).getTime() >= cutoff.getTime());
}

/**
 * Build a complete iCalendar (.ics) document from a list of events.
 * Times are emitted as local floating times (RFC 5545 "floating" — no timezone),
 * which calendar apps interpret in the viewer's local zone. Simple and safe for
 * a site whose events are all in one country.
 */
export function buildIcs(events: Event[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//svce.tech//SVCE Tech Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SVCE Tech Events',
    'X-WR-CALDESC:Tech events around SVCE, Sriperumbudur'
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uidFor(event)}`);
    lines.push(`DTSTAMP:${dateTime(new Date())}`);
    lines.push(`DTSTART:${dateTimeString(event.eventDate, event.eventTime)}`);
    if (event.eventEndDate) {
      // All-day end for multi-day events; DTEND is exclusive in iCal.
      if (event.eventEndTime) {
        lines.push(`DTEND:${dateTimeString(event.eventEndDate, event.eventEndTime)}`);
      } else {
        lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(event.eventEndDate, 1))}`);
      }
    } else if (event.eventEndTime) {
      lines.push(`DTEND:${dateTimeString(event.eventDate, event.eventEndTime)}`);
    }
    lines.push(`SUMMARY:${escapeText(event.eventName)}`);
    lines.push(`DESCRIPTION:${escapeText(event.eventDescription)}`);
    lines.push(`LOCATION:${escapeText(event.eventVenue)}`);
    if (event.eventLink) {
      lines.push(`URL:${event.eventLink}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/** Stable UID per event so re-subscribing never duplicates entries. */
function uidFor(event: Event): string {
  const base = `${event.eventName}|${event.eventDate}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  return `${Math.abs(hash).toString(16)}@svce.tech`;
}

/** Compact YYYYMMDDTHHMMSS from a JS Date (no timezone info). */
function dateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

/** Compact YYYYMMDDTHHMMSS from a "YYYY-MM-DD" + "HH:MM" pair. */
function dateTimeString(dateStr: string, timeStr: string): string {
  return compactDate(dateStr) + 'T' + timeStr.replace(':', '') + '00';
}

/** YYYY-MM-DD -> YYYYMMDD. */
function compactDate(dateStr: string): string {
  return dateStr.replaceAll('-', '');
}

/** Add N days to a YYYY-MM-DD date (returns YYYY-MM-DD). */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Escape commas, semicolons and newlines per RFC 5545 text rules. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}
