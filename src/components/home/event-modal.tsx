'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowSquareOut,
  CalendarCheck,
  CalendarDots,
  Check,
  Copy,
  MapPin,
  ShareNetwork,
  Warning,
  X
} from '@phosphor-icons/react';
import type { Event } from '@/types/event';
import { formatEventSchedule, getAlertTitle, getGoogleCalendarUrl } from '@/lib/events';
import RemindMeButton from './remind-me-button';

interface EventModalProps {
  event: Event;
  onClose: () => void;
}

export default function EventModal({ event, onClose }: EventModalProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape + lock body scroll + focus management
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const closeButton = dialogRef.current?.querySelector<HTMLButtonElement>('button');
    closeButton?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const alertTitle = getAlertTitle(event.alert?.type);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(event.eventLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.eventName,
          text: event.eventDescription,
          url: event.eventLink
        });
        setShared(true);
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink();
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${event.eventName} — ${event.eventDescription.slice(0, 80)}... ${event.eventLink}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-overlay/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={event.eventName}
    >
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-surface-2 shadow-2xl outline-none sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-line/10 bg-gradient-to-br from-sunrise-50 via-white to-aurora-50 p-6 dark:from-amber-950/40 dark:via-surface-2 dark:to-emerald-950/40 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-surface-2/80 p-2 text-ink/60 shadow-sm transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close details"
          >
            <X size={18} />
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border border-line/20 bg-surface-2 text-ink/70">
              {event.communityName}
            </span>
            <span className="chip bg-aurora-100 text-aurora-800">{event.location}</span>
            {event.alert && (
              <span className="chip bg-sunrise-200 text-sunrise-900">
                <Warning size={12} weight="fill" className="mr-1" />
                {alertTitle}
              </span>
            )}
          </div>

          <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
            {event.eventName}
          </h2>

          <p className="mt-3 flex items-center gap-2 text-sm text-ink/60">
            <CalendarDots size={16} weight="bold" className="text-aurora-600" />
            {formatEventSchedule(event)}
          </p>
          <p className="mt-1.5 flex items-start gap-2 text-sm text-ink/60">
            <MapPin size={16} weight="bold" className="mt-0.5 shrink-0 text-aurora-600" />
            <span>{event.eventVenue}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {event.alert && (
            <div className="mb-6 rounded-xl border border-sunrise-200 bg-sunrise-50 p-4">
              <p className="text-sm font-semibold text-sunrise-900">{alertTitle}</p>
              <p className="mt-1 text-sm text-sunrise-800">{event.alert.message}</p>
            </div>
          )}

          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink/40">
            About this event
          </h3>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink/75">
            {event.eventDescription}
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={event.eventLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-on-accent shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:flex-none"
            >
              Register / RSVP
              <ArrowSquareOut size={16} weight="bold" />
            </a>
            <a
              href={getGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-aurora-600/20 bg-aurora-50 px-5 py-3 text-sm font-semibold text-aurora-800 transition-all hover:-translate-y-0.5 hover:bg-aurora-100"
            >
              <CalendarCheck size={16} weight="bold" />
              Add to calendar
            </a>
            <RemindMeButton event={event} />
          </div>

          {/* Share */}
          <div className="mt-6 border-t border-line/10 pt-5">
            <p className="text-sm font-semibold text-ink/60">Share this event</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-2 rounded-lg bg-ink/5 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/10"
              >
                <ShareNetwork size={16} />
                {shared ? 'Shared!' : 'Share'}
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-lg bg-ink/5 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/10"
              >
                {copied ? <Check size={16} className="text-aurora-600" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-ink/5 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/10"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
