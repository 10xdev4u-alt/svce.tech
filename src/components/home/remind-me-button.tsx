'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellRinging, Check, Clock, X } from '@phosphor-icons/react';
import type { Event } from '@/types/event';
import {
  REMINDERS_STORAGE_KEY,
  REMINDER_OFFSETS,
  computeRemindAt,
  eventKeyFor,
  type ReminderOffset,
  type StoredReminder
} from '@/lib/reminders';

interface RemindMeButtonProps {
  event: Event;
  compact?: boolean;
}

function readStoredReminders(): Record<string, StoredReminder> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(REMINDERS_STORAGE_KEY) ?? '{}') as Record<
      string,
      StoredReminder
    >;
  } catch {
    return {};
  }
}

function writeStoredReminders(reminders: Record<string, StoredReminder>) {
  try {
    window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    /* storage unavailable */
  }
}

export default function RemindMeButton({ event, compact }: RemindMeButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ReminderOffset | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Record<string, StoredReminder>>({});
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number; below: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const key = eventKeyFor(event);
  const active = reminders[key];

  // Load persisted reminders + check subscription state on mount
  useEffect(() => {
    setReminders(readStoredReminders());
  }, []);

  // Close on outside click / Escape. The menu is portaled, so clicks inside it
  // are stopped at the menu; anything else (including the card) closes it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function ensureSubscribed(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      return Boolean(subscription);
    } catch {
      return false;
    }
  }

  function openMenu() {
    setMessage(null);
    ensureSubscribed().then((subscribed) => {
      setNeedsSubscription(!subscribed);
      const rect = triggerRef.current?.getBoundingClientRect();
      const below = (rect?.top ?? 0) < window.innerHeight * 0.55;
      setAnchor({
        top: below ? (rect?.bottom ?? 0) + 8 : (rect?.top ?? 0) - 8,
        left: rect?.left ?? 16,
        below
      });
      setOpen(true);
    });
  }

  async function setReminder(offset: ReminderOffset) {
    setBusy(offset);
    setMessage(null);
    try {
      const remindAt = computeRemindAt(event, offset);
      const next = {
        ...reminders,
        [key]: {
          eventKey: key,
          offset,
          remindAt,
          eventName: event.eventName
        } satisfies StoredReminder
      };
      writeStoredReminders(next);
      setReminders(next);
      setOpen(false);

      // Server-side record (production only — the cron workflow sends it).
      if (process.env.NODE_ENV === 'production') {
        const subscriptionId = window.localStorage.getItem('svce-subscription-id');
        if (subscriptionId) {
          const res = await fetch('/api/save-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId,
              eventName: event.eventName,
              eventDate: event.eventDate,
              eventTime: event.eventTime,
              eventLink: event.eventLink,
              offset
            })
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to save reminder');
          }
        }
      }
      setMessage('Reminder set ✓');
    } catch (err) {
      console.error('Reminder error:', err);
      setMessage(err instanceof Error ? err.message : 'Failed to set reminder');
    } finally {
      setBusy(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function cancelReminder() {
    setBusy('start');
    try {
      const next = { ...reminders };
      delete next[key];
      writeStoredReminders(next);
      setReminders(next);
      setOpen(false);

      if (process.env.NODE_ENV === 'production') {
        const subscriptionId = window.localStorage.getItem('svce-subscription-id');
        if (subscriptionId) {
          await fetch('/api/cancel-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId,
              eventName: event.eventName,
              eventDate: event.eventDate
            })
          }).catch(() => {});
        }
      }
      setMessage('Reminder cancelled');
    } finally {
      setBusy(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={active ? cancelReminder : openMenu}
        disabled={Boolean(busy)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          active
            ? `Reminder set for ${event.eventName} — click to cancel`
            : `Remind me about ${event.eventName}`
        }
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
          active
            ? 'bg-aurora-600 text-white hover:bg-aurora-700'
            : 'border border-line/20 bg-surface-2 text-ink/70 hover:border-aurora-500/40 hover:text-aurora-700'
        }`}
        title={active ? 'Reminder set — click to cancel' : 'Get a reminder before this event'}
      >
        {active ? <BellRinging size={16} weight="fill" /> : <Clock size={16} />}
        {!compact && <span>{active ? 'Reminder set' : 'Remind me'}</span>}
      </button>

      {message && (
        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-aurora-700">
          <Check size={13} weight="bold" />
          {message}
        </span>
      )}

      {open &&
        // Portal to <body> so the menu always sits above card/header stacking
        // contexts (the card's hover-transform creates one). Anchored to the
        // trigger button's viewport position, flipping above when near bottom.
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[70] w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-line/10 bg-surface-2 p-2 shadow-xl"
            style={{
              top: anchor?.top,
              left: Math.min(anchor?.left ?? 16, window.innerWidth - 280)
            }}
          >
            {needsSubscription ? (
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-ink">Enable notifications first</p>
                <p className="mt-1 text-xs text-ink/60">
                  Tap the bell icon in the header to allow notifications, then set your reminder.
                </p>
              </div>
            ) : (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                  Remind me
                </p>
                {REMINDER_OFFSETS.map((offset) => (
                  <button
                    key={offset.id}
                    type="button"
                    role="menuitem"
                    disabled={busy === offset.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReminder(offset.id);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-ink/75 transition-colors hover:bg-aurora-50 hover:text-aurora-800 disabled:opacity-50"
                  >
                    {offset.label}
                    {active?.offset === offset.id && (
                      <Check size={14} className="text-aurora-600" />
                    )}
                  </button>
                ))}
              </>
            )}
            <div className="mt-1 border-t border-line/10 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X size={12} />
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
