import { describe, expect, it } from 'vitest';
import { computeRemindAt, eventKeyFor, reminderId, REMINDER_OFFSETS } from './reminders';

describe('REMINDER_OFFSETS', () => {
  it('offers start, 1 hour before and 1 day before', () => {
    const ids = REMINDER_OFFSETS.map((o) => o.id);
    expect(ids).toEqual(['start', 'hour', 'day']);
    expect(REMINDER_OFFSETS.find((o) => o.id === 'hour')?.seconds).toBe(3600);
    expect(REMINDER_OFFSETS.find((o) => o.id === 'day')?.seconds).toBe(86400);
  });
});

describe('computeRemindAt', () => {
  const event = { eventDate: '2026-08-20', eventTime: '18:00' };

  it('fires at event start for the start offset', () => {
    expect(computeRemindAt(event, 'start')).toBe(new Date('2026-08-20T18:00:00').getTime());
  });

  it('fires 1 hour before for the hour offset', () => {
    expect(computeRemindAt(event, 'hour')).toBe(new Date('2026-08-20T17:00:00').getTime());
  });

  it('fires 1 day before for the day offset', () => {
    expect(computeRemindAt(event, 'day')).toBe(new Date('2026-08-19T18:00:00').getTime());
  });
});

describe('eventKeyFor', () => {
  it('combines name and date', () => {
    expect(eventKeyFor({ eventName: 'Hack Night', eventDate: '2026-08-20' })).toBe(
      'Hack Night|2026-08-20'
    );
  });
});

describe('reminderId', () => {
  it('is deterministic for the same subscription + event', () => {
    const event = { eventName: 'Hack Night', eventDate: '2026-08-20' };
    expect(reminderId('sub-1', event)).toBe(reminderId('sub-1', event));
  });

  it('differs across events and subscriptions', () => {
    const event = { eventName: 'Hack Night', eventDate: '2026-08-20' };
    expect(reminderId('sub-1', event)).not.toBe(reminderId('sub-2', event));
    expect(reminderId('sub-1', { eventName: 'Other', eventDate: '2026-09-01' })).not.toBe(
      reminderId('sub-1', event)
    );
  });
});
