import type { Event } from '@/types/event';
import { formatEventSchedule, formatVenue } from '@/lib/events';
import { ArrowUpRight, CalendarDots, MapPin } from '@phosphor-icons/react/dist/ssr';

interface PastEventCardProps {
  event: Event;
  endedLabel: string;
}

/** Archive card for a finished event — no countdowns, CTA leads to the event itself. */
export default function PastEventCard({ event, endedLabel }: PastEventCardProps) {
  return (
    <article className="group relative rounded-2xl border border-line/10 bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border border-line/20 bg-surface-2 text-ink/70">
          {event.communityName}
        </span>
        <span className="chip bg-ink/5 text-ink/50">{endedLabel}</span>
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink">
        <a
          href={event.eventLink}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors group-hover:text-aurora-700"
        >
          {event.eventName}
        </a>
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="chip bg-aurora-100 text-aurora-800">{event.location}</span>
        <span className="chip bg-blue-50 text-blue-800">
          <CalendarDots size={12} className="mr-1" />
          {formatEventSchedule(event)}
        </span>
      </div>

      <p className="mt-3 flex items-start gap-1 text-xs text-ink/50">
        <MapPin size={14} className="mt-0.5 min-w-[14px]" />
        <span className="line-clamp-2">{formatVenue(event.eventVenue)}</span>
      </p>

      <div className="mt-4 border-t border-line/10 pt-3">
        <a
          href={event.eventLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-aurora-700 transition-colors hover:text-aurora-800"
        >
          View event
          <ArrowUpRight size={14} />
        </a>
      </div>
    </article>
  );
}
