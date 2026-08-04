import eventsJson from '@/data/events.json';
import { buildRss } from '@/lib/rss';

export const dynamic = 'force-static';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://svce-tech.vercel.app';

export function GET() {
  const events = eventsJson as Parameters<typeof buildRss>[0];
  const body = buildRss(events, {
    title: 'SVCE Tech Hub — Events',
    description:
      'Tech events around SVCE, Sriperumbudur: meetups, symposiums, workshops and hackathons.',
    siteUrl: BASE_URL,
    feedUrl: `${BASE_URL}/feed.xml`
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
