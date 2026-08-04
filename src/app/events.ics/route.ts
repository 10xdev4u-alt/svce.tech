import eventsJson from '@/data/events.json';
import { buildIcs } from '@/lib/ical';

export const dynamic = 'force-static';

export function GET() {
  const events = eventsJson as Parameters<typeof buildIcs>[0];
  const body = buildIcs(events);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="svce-tech-events.ics"',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
