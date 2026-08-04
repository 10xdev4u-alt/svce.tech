import eventsJson from '@/data/events.json';
import { buildIcs, filterFeedEvents } from '@/lib/ical';
import type { Event } from '@/types/event';

// Rendered per-request (not force-static) so the grace-window trim uses a live clock;
// the Cache-Control headers keep it edge-cached with stale-while-revalidate.
export const dynamic = 'force-dynamic';

export function GET() {
  const events = eventsJson as Event[];
  // 48h post-event grace window: past events fall off the calendar feed.
  const body = buildIcs(filterFeedEvents(events, new Date()));

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="svce-tech-events.ics"',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
