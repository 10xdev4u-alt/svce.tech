import { describe, expect, it } from 'vitest';
import {
  applySync,
  buildEmbed,
  contentHash,
  eventUid,
  parseWebhook,
  planSync,
  scheduleLabel,
  splitMessages,
  truncate,
  upcomingEvents
} from './mirror-discord.mjs';

const makeEvent = (overrides = {}) => ({
  eventName: 'Hack Night',
  eventDescription: 'Build something cool, win prizes.',
  eventDate: '2026-08-20',
  eventTime: '18:00',
  eventVenue: 'Lab 3, SVCE',
  eventLink: 'https://example.com/hacknight',
  location: 'SVCE',
  communityName: 'Dev Club',
  ...overrides
});

const NOW = new Date(2026, 7, 15, 9, 0, 0); // 15 Aug 2026 09:00 local

describe('eventUid', () => {
  it('is stable across calls for the same event', () => {
    expect(eventUid(makeEvent())).toBe(eventUid(makeEvent()));
  });

  it('differs when the name or date changes', () => {
    expect(eventUid(makeEvent())).not.toBe(eventUid(makeEvent({ eventDate: '2026-08-21' })));
    expect(eventUid(makeEvent())).not.toBe(eventUid(makeEvent({ eventName: 'Other' })));
  });
});

describe('contentHash', () => {
  it('changes when displayed details change', () => {
    expect(contentHash(makeEvent())).not.toBe(contentHash(makeEvent({ eventVenue: 'Hall 2' })));
    expect(contentHash(makeEvent())).not.toBe(
      contentHash(makeEvent({ alert: { message: 'Moved', type: 'venue-change' } }))
    );
  });

  it('is stable for identical events', () => {
    expect(contentHash(makeEvent())).toBe(contentHash(makeEvent()));
  });
});

describe('upcomingEvents', () => {
  it('includes events within the window and excludes past ones', () => {
    const soon = makeEvent({ eventDate: '2026-08-25' });
    const past = makeEvent({ eventName: 'Gone', eventDate: '2026-08-01' });
    const result = upcomingEvents([past, soon], NOW);
    expect(result.map((e) => e.eventName)).toEqual(['Hack Night']);
  });

  it('excludes events beyond the window', () => {
    const far = makeEvent({ eventDate: '2026-10-01' });
    expect(upcomingEvents([far], NOW)).toHaveLength(0);
  });

  it('includes an event still ending today', () => {
    const endingToday = makeEvent({
      eventDate: '2026-08-14',
      eventEndDate: '2026-08-15',
      eventEndTime: '18:00'
    });
    expect(upcomingEvents([endingToday], NOW)).toHaveLength(1);
  });

  it('honours a custom window', () => {
    const soon = makeEvent({ eventDate: '2026-08-16' }); // tomorrow: inside a 1-day window
    expect(upcomingEvents([soon], NOW, 1)).toHaveLength(1);
    expect(upcomingEvents([soon], NOW, 0)).toHaveLength(0);
  });
});

describe('truncate', () => {
  it('keeps short strings intact', () => {
    expect(truncate('hi', 10)).toBe('hi');
  });

  it('truncates long strings with an ellipsis', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
  });
});

describe('scheduleLabel', () => {
  it('renders single-day with time', () => {
    expect(scheduleLabel(makeEvent())).toBe('20 Aug 2026 · 6:00 pm');
  });

  it('renders multi-day ranges', () => {
    const multi = makeEvent({
      eventDate: '2026-08-20',
      eventTime: '09:00',
      eventEndDate: '2026-08-21',
      eventEndTime: '17:00'
    });
    expect(scheduleLabel(multi)).toBe('20 Aug 2026 – 21 Aug 2026 · 9:00 am – 5:00 pm');
  });
});

describe('buildEmbed', () => {
  it('produces a well-formed embed with fields', () => {
    const embed = buildEmbed(makeEvent());
    expect(embed.title).toBe('Hack Night');
    expect(embed.url).toBe('https://example.com/hacknight');
    expect(embed.color).toBe(0x22c55e);
    expect(embed.fields).toHaveLength(3);
    expect(embed.fields[0].name).toBe('📅 When');
    expect(embed.fields[1].name).toBe('📍 Where');
    expect(embed.footer.text).toBe('svce.tech · SVCE Tech Hub');
  });

  it('adds an alert field when the event has one', () => {
    const embed = buildEmbed(
      makeEvent({ alert: { message: 'Moved to Hall 2', type: 'venue-change' } })
    );
    expect(embed.fields).toHaveLength(4);
    expect(embed.fields[3].name).toBe('⚠️ Notice');
    expect(embed.fields[3].value).toBe('Moved to Hall 2');
  });

  it('respects title and description limits', () => {
    const embed = buildEmbed(
      makeEvent({ eventName: 'x'.repeat(300), eventDescription: 'y'.repeat(5000) })
    );
    expect(embed.title.length).toBeLessThanOrEqual(256);
    expect(embed.description.length).toBeLessThanOrEqual(4096);
  });
});

describe('splitMessages', () => {
  it('chunks items into messages of at most 10', () => {
    const items = Array.from({ length: 23 }, (_, i) => ({ i }));
    const messages = splitMessages(items);
    expect(messages.map((m) => m.length)).toEqual([10, 10, 3]);
  });

  it('returns a single message for small sets', () => {
    expect(splitMessages([1, 2])).toEqual([[1, 2]]);
  });
});

describe('planSync', () => {
  it('posts new events, patches changed ones, prunes stale state', () => {
    const event = makeEvent();
    const uid = eventUid(event);
    const stale = makeEvent({ eventName: 'Old', eventDate: '2026-08-01' });
    const staleUid = eventUid(stale);

    const state = {
      [uid]: { messageId: '111', hash: contentHash(makeEvent({ eventVenue: 'Old Hall' })) },
      [staleUid]: { messageId: '222', hash: contentHash(stale) }
    };

    const plan = planSync([event, stale], state, NOW);
    expect(plan.toPatch.map((p) => p.uid)).toEqual([uid]);
    expect(plan.toPost).toHaveLength(0);
    expect(plan.toPrune).toEqual([staleUid]);
  });

  it('posts an event that is not in state yet', () => {
    const plan = planSync([makeEvent()], {}, NOW);
    expect(plan.toPost).toHaveLength(1);
    expect(plan.messages).toHaveLength(1);
    expect(plan.messages[0][0].embed.title).toBe('Hack Night');
  });

  it('does nothing for unchanged upcoming events', () => {
    const event = makeEvent();
    const uid = eventUid(event);
    const state = { [uid]: { messageId: '111', hash: contentHash(event) } };
    const plan = planSync([event], state, NOW);
    expect(plan.toPost).toHaveLength(0);
    expect(plan.toPatch).toHaveLength(0);
    expect(plan.toPrune).toHaveLength(0);
  });
});

describe('parseWebhook', () => {
  it('extracts id and token', () => {
    expect(parseWebhook('https://discord.com/api/webhooks/12345/abc-def')).toEqual({
      id: '12345',
      token: 'abc-def'
    });
  });

  it('returns null for malformed URLs', () => {
    expect(parseWebhook('https://example.com')).toBeNull();
    expect(parseWebhook('')).toBeNull();
  });
});

describe('applySync', () => {
  const webhookUrl = 'https://discord.com/api/webhooks/12345/token';

  function fakeFetch(handler) {
    return async (url, options) => handler(url, options);
  }

  it('posts messages, records message ids, patches and prunes', async () => {
    const calls = [];
    const fetchImpl = fakeFetch(async (url, options) => {
      calls.push({ url, method: options.method, body: JSON.parse(options.body) });
      if (options.method === 'POST')
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ id: `msg-${calls.length}` })
        };
      return { ok: true, status: 200, statusText: 'OK', json: async () => ({}) };
    });

    const event = makeEvent();
    const uid = eventUid(event);
    const changed = makeEvent({ eventName: 'Changed', eventVenue: 'Hall 2' });
    const changedUid = eventUid(changed);
    const staleUid = 'dead@svce.tech';

    const plan = planSync(
      [event, changed, makeEvent({ eventDate: '2026-08-01' })],
      {
        [changedUid]: { messageId: 'old-msg', hash: 'oldhash' },
        [staleUid]: { messageId: 'x', hash: 'y' }
      },
      NOW
    );

    const result = await applySync(
      plan,
      webhookUrl,
      {},
      { fetchImpl, sleep: () => Promise.resolve() }
    );

    expect(result.posted).toBe(1);
    expect(result.patched).toBe(1);
    expect(result.pruned).toBe(1);
    expect(result.state[uid]).toEqual({ messageId: 'msg-1', hash: contentHash(event) });
    expect(result.state[changedUid]).toEqual({ messageId: 'old-msg', hash: contentHash(changed) });
    expect(result.state[staleUid]).toBeUndefined();
    // POST went to the base webhook URL, PATCH to the messages endpoint.
    expect(calls.some((c) => c.method === 'POST' && c.url === `${webhookUrl}?wait=true`)).toBe(
      true
    );
    expect(
      calls.some((c) => c.method === 'PATCH' && c.url === `${webhookUrl}/messages/old-msg`)
    ).toBe(true);
  });

  it('throws and leaves state untouched when a request fails', async () => {
    const fetchImpl = fakeFetch(async () => ({
      ok: false,
      status: 500,
      statusText: 'Boom',
      json: async () => ({})
    }));
    const plan = planSync([makeEvent()], {}, NOW);
    await expect(
      applySync(plan, webhookUrl, {}, { fetchImpl, sleep: () => Promise.resolve() })
    ).rejects.toThrow(/Discord POST failed: 500/);
  });

  it('rejects a malformed webhook URL', async () => {
    const plan = planSync([makeEvent()], {}, NOW);
    await expect(
      applySync(
        plan,
        'https://example.com',
        {},
        {
          fetchImpl: () => Promise.reject(new Error('never called')),
          sleep: () => Promise.resolve()
        }
      )
    ).rejects.toThrow(/Invalid Discord webhook URL/);
  });
});
