'use client';

import { useState } from 'react';
import { CalendarDots, MapPin, Warning } from '@phosphor-icons/react';
import type { Event } from '@/types/event';
import { formatDate, formatTime, formatVenue, getAlertTitle } from '@/lib/events';

interface EventCardProps {
  event: Event;
  onOpen: (event: Event) => void;
}

export default function EventCard({ event, onOpen }: EventCardProps) {
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const alertTitle = getAlertTitle(event.alert?.type);
  const venue = formatVenue(event.eventVenue);

  return (
    <article
      className="group relative cursor-pointer rounded-2xl p-[1.5px] transition-transform duration-300 hover:-translate-y-1"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setMouse(null)}
      onClick={() => onOpen(event)}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-sunrise-300/60 via-transparent to-aurora-400/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative h-full rounded-2xl border border-line/10 bg-surface-2 p-5 shadow-card transition-shadow group-hover:shadow-card-hover">
        {mouse && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(220px circle at ${mouse.x}px ${mouse.y}px, rgba(74, 222, 128, 0.12), transparent 60%)`
            }}
          />
        )}

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border border-line/20 bg-surface-2 text-ink/70">
              {event.communityName}
            </span>
            {event.alert && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAlert(!showAlert);
                  }}
                  onMouseEnter={() => setShowAlert(true)}
                  onMouseLeave={() => setShowAlert(false)}
                  className="rounded-full bg-sunrise-200 p-1.5 text-sunrise-900 shadow-sm transition-colors hover:bg-sunrise-300"
                  aria-label="Event alert"
                >
                  <Warning size={14} weight="fill" />
                </button>
                {showAlert && (
                  <div className="absolute left-0 top-8 z-50 w-60 rounded-xl border border-sunrise-200 bg-surface-2 p-3 shadow-xl">
                    <p className="text-sm font-semibold text-sunrise-900">{alertTitle}</p>
                    <p className="mt-1 text-xs text-ink/60">{event.alert?.message}</p>
                    <div className="absolute -top-1 left-3 h-2 w-2 rotate-45 border-l border-t border-sunrise-200 bg-surface-2" />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(event);
            }}
            className="mt-4 block w-full text-left"
            aria-label={`View details for ${event.eventName}`}
          >
            <h3 className="line-clamp-2 font-display text-xl font-semibold text-ink transition-colors group-hover:text-aurora-700">
              {event.eventName}
            </h3>
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="chip bg-aurora-100 text-aurora-800">{event.location}</span>
            <span className="chip bg-blue-50 text-blue-800">
              <CalendarDots size={12} className="mr-1" />
              {formatDate(event.eventDate)}
            </span>
            <span className="chip bg-sunrise-100 text-sunrise-800">
              {formatTime(event.eventTime)}
            </span>
          </div>

          <p className="mt-3 flex items-start gap-1 text-xs text-ink/50">
            <MapPin size={14} className="mt-0.5 min-w-[14px]" />
            <span className="line-clamp-2">{venue}</span>
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-line/10 pt-3">
            <span className="text-xs font-medium text-aurora-700 transition-colors group-hover:text-aurora-800">
              View details →
            </span>
            <span className="text-xs text-ink/40">tap to open</span>
          </div>
        </div>
      </div>
    </article>
  );
}
