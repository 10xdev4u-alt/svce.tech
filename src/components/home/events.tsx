'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDots, MapPin, Warning } from '@phosphor-icons/react';
import type { Event } from '@/types/event';
import eventsJson from '@/data/events.json';
import EmptyEventCard from './empty-event-card';

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>(eventsJson as Event[]);

  // In production, fetch live data from the repo so no redeploy is needed for new events
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      fetch(
        'https://raw.githubusercontent.com/10xdev4u-alt/svce.tech/main/src/data/events.json'
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (Array.isArray(json)) setEvents(json);
        })
        .catch(() => {
          /* fall back to bundled data */
        });
    }
  }, []);

  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      ),
    [events]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { monthly, upcoming } = useMemo(() => {
    const monthly = sorted.filter((event) => {
      const start = new Date(event.eventDate);
      const end = new Date(event.eventEndDate ?? event.eventDate);
      end.setHours(23, 59, 59, 999);
      return (
        start.getMonth() === today.getMonth() &&
        start.getFullYear() === today.getFullYear() &&
        end >= today
      );
    });
    const upcoming = sorted.filter((event) => {
      const start = new Date(event.eventDate);
      return (
        start > today &&
        (start.getMonth() !== today.getMonth() || start.getFullYear() !== today.getFullYear())
      );
    });
    return { monthly, upcoming };
  }, [sorted, today]);

  return (
    <div className='container-page py-16'>
      <section className='mb-14'>
        <div className='mb-8 flex items-end justify-between'>
          <div>
            <h2 className='font-display text-3xl font-bold tracking-tight text-ink md:text-4xl'>
              this month
            </h2>
            <p className='mt-2 text-ink/50'>What&apos;s happening on and around campus</p>
          </div>
          <span className='chip bg-aurora-100 text-aurora-800'>{monthly.length} events</span>
        </div>
        {monthly.length > 0 ? (
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {monthly.map((event, i) => (
              <EventCard key={`${event.eventName}-${i}`} event={event} />
            ))}
          </div>
        ) : (
          <EmptyEventCard
            message='No events scheduled this month'
            hint='Be the first to add one — it takes 2 minutes.'
          />
        )}
      </section>

      <section>
        <div className='mb-8 flex items-end justify-between'>
          <div>
            <h2 className='font-display text-3xl font-bold tracking-tight text-ink md:text-4xl'>
              upcoming
            </h2>
            <p className='mt-2 text-ink/50'>Plan ahead — the good stuff is coming</p>
          </div>
          <span className='chip bg-sunrise-100 text-sunrise-800'>{upcoming.length} events</span>
        </div>
        {upcoming.length > 0 ? (
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {upcoming.map((event, i) => (
              <EventCard key={`${event.eventName}-${i}`} event={event} />
            ))}
          </div>
        ) : (
          <EmptyEventCard
            message='No upcoming events scheduled'
            hint='Know a tech event around SVCE? Add it to the list!'
          />
        )}
      </section>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const alertTitle = useMemo(() => {
    const t = event.alert?.type;
    if (t === 'postponed') return 'Event Postponed';
    if (t === 'venue-change') return 'Venue Changed';
    if (t === 'cancelled') return 'Event Cancelled';
    return 'Important Notice';
  }, [event.alert]);

  const venue = useMemo(() => {
    return event.eventVenue
      .trim()
      .split(' ')
      .map((w) => (w.length <= 3 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(' ');
  }, [event.eventVenue]);

  return (
    <div
      className='group relative rounded-2xl p-[1.5px] transition-transform duration-300 hover:-translate-y-1'
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setMouse(null)}
    >
      <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-sunrise-300/60 via-transparent to-aurora-400/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
      <div className='relative h-full rounded-2xl border border-black/5 bg-white p-5 shadow-card transition-shadow group-hover:shadow-card-hover'>
        {mouse && (
          <div
            className='pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100'
            style={{
              background: `radial-gradient(220px circle at ${mouse.x}px ${mouse.y}px, rgba(74, 222, 128, 0.12), transparent 60%)`
            }}
          />
        )}

        <div className='relative'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='chip border border-black/10 bg-white text-ink/70'>
              {event.communityName}
            </span>
            {event.alert && (
              <div className='relative'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAlert(!showAlert);
                  }}
                  onMouseEnter={() => setShowAlert(true)}
                  onMouseLeave={() => setShowAlert(false)}
                  className='rounded-full bg-sunrise-200 p-1.5 text-sunrise-900 shadow-sm transition-colors hover:bg-sunrise-300'
                  aria-label='Event alert'
                >
                  <Warning size={14} weight='fill' />
                </button>
                {showAlert && (
                  <div className='absolute left-0 top-8 z-50 w-60 rounded-xl border border-sunrise-200 bg-white p-3 shadow-xl'>
                    <p className='text-sm font-semibold text-sunrise-900'>{alertTitle}</p>
                    <p className='mt-1 text-xs text-ink/60'>{event.alert?.message}</p>
                    <div className='absolute -top-1 left-3 h-2 w-2 rotate-45 border-l border-t border-sunrise-200 bg-white' />
                  </div>
                )}
              </div>
            )}
          </div>

          <a
            href={event.eventLink}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-4 block'
            aria-label={`View details for ${event.eventName}`}
          >
            <h3 className='font-display line-clamp-2 text-xl font-semibold text-ink transition-colors group-hover:text-aurora-700'>
              {event.eventName}
            </h3>
          </a>

          <div className='mt-4 flex flex-wrap items-center gap-2 text-xs'>
            <span className='chip bg-aurora-100 text-aurora-800'>{event.location}</span>
            <span className='chip bg-blue-50 text-blue-800'>
              <CalendarDots size={12} className='mr-1' />
              {formatDate(event.eventDate)}
            </span>
            <span className='chip bg-sunrise-100 text-sunrise-800'>{formatTime(event.eventTime)}</span>
          </div>

          <p className='mt-3 flex items-start gap-1 text-xs text-ink/50'>
            <MapPin size={14} className='mt-0.5 min-w-[14px]' />
            <span className='line-clamp-2'>{venue}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
