'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarBlank, SquaresFour } from '@phosphor-icons/react';
import type { Event } from '@/types/event';
import eventsJson from '@/data/events.json';
import { partitionEvents } from '@/lib/events';
import EventCard from './event-card';
import EventModal from './event-modal';
import CalendarView from './calendar-view';
import EmptyEventCard from './empty-event-card';

type ViewMode = 'cards' | 'calendar';

export default function Events() {
  const [events, setEvents] = useState<Event[]>(eventsJson as Event[]);
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [view, setView] = useState<ViewMode>('cards');
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  // In production, fetch live data from the repo so no redeploy is needed for new events
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      fetch('https://raw.githubusercontent.com/10xdev4u-alt/svce.tech/main/src/data/events.json')
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (Array.isArray(json)) setEvents(json);
        })
        .catch(() => {
          /* fall back to bundled data */
        });
    }
  }, []);

  // Unique filter options derived from live data
  const communities = useMemo(
    () => [...new Set(events.map((e) => e.communityName))].sort(),
    [events]
  );
  const locations = useMemo(() => [...new Set(events.map((e) => e.location))].sort(), [events]);

  const filtered = useMemo(() => {
    return [...events]
      .filter((e) => selectedCommunity === 'all' || e.communityName === selectedCommunity)
      .filter((e) => selectedLocation === 'all' || e.location === selectedLocation)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events, selectedCommunity, selectedLocation]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { monthly, upcoming } = useMemo(() => partitionEvents(filtered, today), [filtered, today]);

  const closeModal = useCallback(() => setActiveEvent(null), []);

  const isFiltering = selectedCommunity !== 'all' || selectedLocation !== 'all';

  return (
    <div className="container-page py-16">
      {/* Section header + controls */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            events
          </h1>
          <p className="mt-2 text-ink/50">
            Meetups, symposiums and workshops around SVCE — community posted, always fresh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Community filter */}
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full rounded-xl border border-line/20 bg-surface-2 px-3 py-2 text-sm text-ink/70 shadow-sm outline-none transition-all focus:border-aurora-500 focus:ring-4 focus:ring-aurora-500/10 sm:w-auto"
            aria-label="Filter by community"
          >
            <option value="all">All communities</option>
            {communities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Location filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full rounded-xl border border-line/20 bg-surface-2 px-3 py-2 text-sm text-ink/70 shadow-sm outline-none transition-all focus:border-aurora-500 focus:ring-4 focus:ring-aurora-500/10 sm:w-auto"
            aria-label="Filter by location"
          >
            <option value="all">All locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-xl border border-line/20 bg-surface-2 shadow-sm">
            <button
              type="button"
              onClick={() => setView('cards')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === 'cards' ? 'bg-aurora-600 text-white' : 'text-ink/60 hover:bg-ink/5'
              }`}
              aria-pressed={view === 'cards'}
            >
              <SquaresFour size={15} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 border-l border-ink/10 px-3 py-2 text-sm font-medium transition-colors ${
                view === 'calendar' ? 'bg-aurora-600 text-white' : 'text-ink/60 hover:bg-ink/5'
              }`}
              aria-pressed={view === 'calendar'}
            >
              <CalendarBlank size={15} />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      {view === 'calendar' ? (
        <CalendarView events={filtered} onOpen={setActiveEvent} />
      ) : (
        <>
          {/* this month */}
          <section className="mb-14">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                  this month
                </h2>
                <p className="mt-1 text-sm text-ink/50">
                  {isFiltering
                    ? 'Filtered to your selection'
                    : 'What’s happening on and around campus'}
                </p>
              </div>
              <span className="chip bg-aurora-100 text-aurora-800">{monthly.length} events</span>
            </div>
            {monthly.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {monthly.map((event, i) => (
                  <EventCard
                    key={`${event.eventName}-${i}`}
                    event={event}
                    onOpen={setActiveEvent}
                  />
                ))}
              </div>
            ) : (
              <EmptyEventCard
                message="No events scheduled this month"
                hint="Be the first to add one — it takes 2 minutes."
              />
            )}
          </section>

          {/* upcoming */}
          <section>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                  upcoming
                </h2>
                <p className="mt-1 text-sm text-ink/50">
                  {isFiltering
                    ? 'Filtered to your selection'
                    : 'Plan ahead — the good stuff is coming'}
                </p>
              </div>
              <span className="chip bg-sunrise-100 text-sunrise-800">{upcoming.length} events</span>
            </div>
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event, i) => (
                  <EventCard
                    key={`${event.eventName}-${i}`}
                    event={event}
                    onOpen={setActiveEvent}
                  />
                ))}
              </div>
            ) : (
              <EmptyEventCard
                message="No upcoming events scheduled"
                hint="Know a tech event around SVCE? Add it to the list!"
              />
            )}
          </section>
        </>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {activeEvent && <EventModal event={activeEvent} onClose={closeModal} />}
      </AnimatePresence>
    </div>
  );
}
