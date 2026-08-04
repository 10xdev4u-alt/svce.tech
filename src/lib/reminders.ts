import type { Event } from '@/types/event';

export type ReminderOffset = 'start' | 'hour' | 'day';

export const REMINDER_OFFSETS: { id: ReminderOffset; label: string; seconds: number }[] = [
  { id: 'start', label: 'At event start', seconds: 0 },
  { id: 'hour', label: '1 hour before', seconds: 3600 },
  { id: 'day', label: '1 day before', seconds: 86400 }
];

export const REMINDERS_STORAGE_KEY = 'svce-reminders';

export interface StoredReminder {
  eventKey: string;
  offset: ReminderOffset;
  remindAt: number;
  eventName: string;
}

/** Stable key identifying an event across sessions (same as feed UIDs). */
export function eventKeyFor(event: Pick<Event, 'eventName' | 'eventDate'>): string {
  return `${event.eventName}|${event.eventDate}`;
}

/** Epoch ms at which the reminder should fire for a given event + offset. */
export function computeRemindAt(
  event: Pick<Event, 'eventDate' | 'eventTime'>,
  offset: ReminderOffset
): number {
  const offsetSeconds = REMINDER_OFFSETS.find((o) => o.id === offset)?.seconds ?? 0;
  const start = new Date(`${event.eventDate}T${event.eventTime}:00`).getTime();
  return start - offsetSeconds * 1000;
}

/** Stable, URL-safe reminder ID derived from subscription + event. */
export function reminderId(
  subscriptionId: string,
  event: Pick<Event, 'eventName' | 'eventDate'>
): string {
  const key = eventKeyFor(event);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return `${subscriptionId}-${Math.abs(hash).toString(16)}`;
}

/** Human summary used in the reminder notification body. */
export function remindLabel(
  event: Pick<Event, 'eventDate' | 'eventTime'>,
  offset: ReminderOffset
): string {
  if (offset === 'start') return `${event.eventDate} at ${event.eventTime}`;
  const minutes = REMINDER_OFFSETS.find((o) => o.id === offset)?.seconds ?? 0;
  if (minutes >= 86400) return `starts ${event.eventDate} (1 day from reminder)`;
  return `starts ${event.eventDate} at ${event.eventTime}`;
}
