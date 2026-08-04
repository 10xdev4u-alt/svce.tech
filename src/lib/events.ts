import type { AlertType, Event } from '@/types/event';

/** Format a YYYY-MM-DD date into "8 Aug 2026" style (local, no TZ surprises). */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/** Format "13:00" into "1:00 PM". */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/** Human label for the date range of an event ("8 Aug · 10:00 AM" or multi-day). */
export function formatEventSchedule(event: Event): string {
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

/** Title for an event alert based on its type. */
export function getAlertTitle(type?: AlertType): string {
  if (type === 'postponed') return 'Event Postponed';
  if (type === 'venue-change') return 'Venue Changed';
  if (type === 'cancelled') return 'Event Cancelled';
  return 'Important Notice';
}

/** Trim + proper-case a venue while preserving acronyms (<= 3 chars). */
export function formatVenue(venue: string): string {
  return venue
    .trim()
    .split(' ')
    .map((word) =>
      word.length <= 3 ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
}

/** Google Calendar "add event" URL. */
export function getGoogleCalendarUrl(event: Event): string {
  const dateToYYYYMMDD = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  };

  const startDate = dateToYYYYMMDD(event.eventDate);
  const end =
    event.eventEndDate && event.eventEndDate !== event.eventDate
      ? event.eventEndDate
      : event.eventDate;
  const endDate = dateToYYYYMMDD(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.eventName,
    dates: `${startDate}/${endDate}`,
    details: `${event.eventDescription}\n\nMore info: ${event.eventLink}`,
    location: event.eventVenue
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Determine which month group (this month / upcoming) an event belongs to. */
export function partitionEvents(
  events: Event[],
  today: Date
): { monthly: Event[]; upcoming: Event[] } {
  const monthly = events.filter((event) => {
    const start = new Date(event.eventDate);
    const end = new Date(event.eventEndDate ?? event.eventDate);
    end.setHours(23, 59, 59, 999);
    return (
      start.getMonth() === today.getMonth() &&
      start.getFullYear() === today.getFullYear() &&
      end >= today
    );
  });
  const upcoming = events.filter((event) => {
    const start = new Date(event.eventDate);
    return (
      start > today &&
      (start.getMonth() !== today.getMonth() || start.getFullYear() !== today.getFullYear())
    );
  });
  return { monthly, upcoming };
}

/** End-of-event as a local Date (end time when given, else end of the event's last day). */
export function getEventEndDate(event: Event): Date {
  const end = new Date((event.eventEndDate ?? event.eventDate) + 'T00:00:00');
  if (event.eventEndTime) {
    const [h, m] = event.eventEndTime.split(':').map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) end.setHours(h, m, 0, 0);
  } else {
    end.setHours(23, 59, 59, 999);
  }
  return end;
}

/** True once an event has fully finished (end time passed). */
export function isPastEvent(event: Event, now: Date): boolean {
  return getEventEndDate(event).getTime() < now.getTime();
}

/** Past events, newest-first — the source for the archive page. */
export function partitionPastEvents(events: Event[], now: Date): Event[] {
  return events
    .filter((event) => isPastEvent(event, now))
    .sort((a, b) => getEventEndDate(b).getTime() - getEventEndDate(a).getTime());
}

/** Human label for how long ago an event ended ("Ended today" / "Ended 3 days ago"). */
export function getEndedLabel(event: Event, now: Date): string {
  const end = getEventEndDate(event);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((today - endDay) / 86_400_000);
  if (days <= 0) return 'Ended today';
  if (days === 1) return 'Ended yesterday';
  return `Ended ${days} days ago`;
}

/** Month + year label for grouping an archive ("August 2026"). */
export function getEventMonthLabel(event: Event): string {
  return getEventEndDate(event).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
}
