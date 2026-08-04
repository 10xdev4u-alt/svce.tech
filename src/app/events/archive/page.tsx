import type { Metadata } from 'next';
import Link from 'next/link';
import type { Event } from '@/types/event';
import eventsJson from '@/data/events.json';
import { getEndedLabel, getEventMonthLabel, partitionPastEvents } from '@/lib/events';
import PastEventCard from '@/components/home/past-event-card';
import EmptyEventCard from '@/components/home/empty-event-card';

export const metadata: Metadata = {
  title: 'Past Events Archive | SVCE Tech Hub',
  description:
    'Every tech event around SVCE that already happened — meetups, symposiums, workshops and hackathons, grouped by month.'
};

export default function ArchivePage() {
  const events = eventsJson as Event[];
  const now = new Date();
  const past = partitionPastEvents(events, now);

  // Group newest-first events under "August 2026" style month headers.
  const grouped = past.reduce<{ label: string; events: Event[] }[]>((acc, event) => {
    const label = getEventMonthLabel(event);
    const last = acc[acc.length - 1];
    if (last && last.label === label) last.events.push(event);
    else acc.push({ label, events: [event] });
    return acc;
  }, []);

  return (
    <div className="container-page py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            past events
          </h1>
          <p className="mt-2 text-ink/50">
            What SVCE has already been through — talks, meets and workshops that happened
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-line/20 bg-surface-2 px-4 py-2 text-sm font-medium text-ink/70 shadow-sm transition-colors hover:bg-aurora-100 hover:text-aurora-800"
        >
          ← Back to upcoming events
        </Link>
      </div>

      {grouped.length === 0 ? (
        <EmptyEventCard
          message="No past events yet"
          hint="The archive fills itself — every event that ends lands here automatically."
        />
      ) : (
        grouped.map((group) => (
          <section key={group.label} className="mb-12">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                {group.label}
              </h2>
              <span className="chip bg-aurora-100 text-aurora-800">
                {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.events.map((event, i) => (
                <PastEventCard
                  key={`${event.eventName}-${i}`}
                  event={event}
                  endedLabel={getEndedLabel(event, now)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
