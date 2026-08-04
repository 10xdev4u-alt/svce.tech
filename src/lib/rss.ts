import type { Event } from '@/types/event';
import { formatEventSchedule } from './events';

export interface RssOptions {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
}

/**
 * Build an RSS 2.0 XML document from a list of events.
 * Events are sorted by date ascending; each becomes an <item>.
 */
export function buildRss(events: Event[], options: RssOptions): string {
  const { title, description, siteUrl, feedUrl } = options;
  const sorted = [...events].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const items = sorted
    .map((event) => {
      // Parse the date as UTC so the pubDate never shifts on local-time machines.
      const pubDate = new Date(event.eventDate + 'T00:00:00Z').toUTCString();
      const schedule = formatEventSchedule(event);
      return [
        '    <item>',
        `      <title>${xmlEscape(event.eventName)}</title>`,
        `      <link>${xmlEscape(event.eventLink)}</link>`,
        `      <guid isPermaLink="false">${xmlEscape(`${event.eventName}|${event.eventDate}`)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${xmlEscape(`${schedule} · ${event.eventVenue}`)}</description>`,
        '    </item>'
      ].join('\n');
    })
    .join('\n');

  const channel = [
    '  <title>' + xmlEscape(title) + '</title>',
    '  <link>' + xmlEscape(siteUrl) + '</link>',
    '  <description>' + xmlEscape(description) + '</description>',
    `  <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    '  <language>en-in</language>',
    items
  ].join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    channel,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
}

/** Escape XML special characters. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
