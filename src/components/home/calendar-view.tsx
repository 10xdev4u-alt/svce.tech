'use client';

import { useMemo, useState } from 'react';
import { CaretLeft, CaretRight, CalendarBlank } from '@phosphor-icons/react';
import type { Event } from '@/types/event';
import { formatTime } from '@/lib/events';

interface CalendarViewProps {
  events: Event[];
  onOpen: (event: Event) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export default function CalendarView({ events, onOpen }: CalendarViewProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Map of "YYYY-MM-DD" → events (multi-day events appear on every day they span)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    const addToDate = (dateKey: string, event: Event) => {
      const list = map.get(dateKey) ?? [];
      list.push(event);
      map.set(dateKey, list);
    };

    for (const event of events) {
      const start = new Date(event.eventDate + 'T00:00:00');
      const end = new Date((event.eventEndDate ?? event.eventDate) + 'T00:00:00');
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
        addToDate(key, event);
      }
    }
    return map;
  }, [events]);

  const grid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startOffset = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array.from({ length: startOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
    return cells;
  }, [viewYear, viewMonth]);

  function goMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`;
  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="rounded-2xl border border-line/10 bg-surface-2 p-5 shadow-card sm:p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-ink">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="rounded-lg bg-ink/5 p-2 text-ink/60 transition-colors hover:bg-ink/10"
            aria-label="Previous month"
          >
            <CaretLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setViewYear(today.getFullYear());
              setViewMonth(today.getMonth());
            }}
            disabled={isCurrentMonth}
            className="rounded-lg bg-ink/5 px-3 py-2 text-sm font-medium text-ink/60 transition-colors hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="rounded-lg bg-ink/5 p-2 text-ink/60 transition-colors hover:bg-ink/10"
            aria-label="Next month"
          >
            <CaretRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-ink/40"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="min-h-16 sm:min-h-20" />;

          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div
              key={dateKey}
              className={`min-h-16 rounded-xl border p-1 sm:min-h-20 sm:p-1.5 ${
                isToday
                  ? 'border-aurora-500 bg-aurora-50'
                  : dayEvents.length > 0
                    ? 'border-aurora-200/70 bg-surface-2'
                    : 'border-line/10 bg-ink/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? 'bg-aurora-600 text-white'
                      : dayEvents.length > 0
                        ? 'bg-aurora-100 text-aurora-800'
                        : 'text-ink/40'
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-semibold text-aurora-700">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {dayEvents.length > 0 && (
                <div className="mt-1 hidden flex-col gap-1 sm:flex">
                  {dayEvents.slice(0, 2).map((event) => (
                    <button
                      key={event.eventName}
                      type="button"
                      onClick={() => onOpen(event)}
                      className="truncate rounded-md bg-aurora-100/70 px-1.5 py-1 text-left text-[10px] font-medium text-aurora-900 transition-colors hover:bg-aurora-200"
                      title={`${event.eventName} — ${formatTime(event.eventTime)}`}
                    >
                      {formatTime(event.eventTime)} {event.eventName}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="px-1 text-[10px] font-semibold text-ink/40">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line/10 pt-4 text-xs text-ink/50">
        <span className="flex items-center gap-2">
          <CalendarBlank size={14} className="text-aurora-600" />
          {events.length} events on this list
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-aurora-100 ring-1 ring-aurora-300" />
          day with events
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-aurora-600" />
          today
        </span>
      </div>
    </div>
  );
}
