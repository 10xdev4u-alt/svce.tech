'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BookOpenText,
  Briefcase,
  CalendarDots,
  MagnifyingGlass,
  UsersThree,
  X
} from '@phosphor-icons/react';
import type { Event } from '@/types/event';
import { formatEventSchedule } from '@/lib/events';
import EventModal from '@/components/home/event-modal';
import eventsJson from '@/data/events.json';
import communitiesJson from '@/data/communities.json';
import opportunitiesJson from '@/data/opportunities.json';
import resourcesJson from '@/data/resources.json';

type ResultType = 'event' | 'club' | 'opportunity' | 'resource';

interface SearchResult {
  type: ResultType;
  title: string;
  subtitle: string;
  keywords: string;
  href?: string;
  event?: Event;
}

const TYPE_LABEL: Record<ResultType, string> = {
  event: 'Events',
  club: 'Clubs',
  opportunity: 'Opportunities',
  resource: 'Resources'
};

const RESOURCE_LABELS: Record<string, string> = {
  offcampus: 'Off-campus & job fairs',
  dsa: 'DSA prep',
  interview: 'Interview prep',
  aptitude: 'Aptitude',
  resume: 'Resume',
  opensource: 'Open source',
  courses: 'Courses'
};

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  (eventsJson as Event[]).forEach((event) => {
    results.push({
      type: 'event',
      title: event.eventName,
      subtitle: `${formatEventSchedule(event)} · ${event.location}`,
      keywords: [
        event.eventName,
        event.eventDescription,
        event.communityName,
        event.location,
        event.eventVenue
      ].join(' '),
      event
    });
  });

  (communitiesJson as { name: string; description?: string; location?: string }[]).forEach(
    (community) => {
      results.push({
        type: 'club',
        title: community.name,
        subtitle: community.description ?? community.location ?? '',
        keywords: [community.name, community.description ?? '', community.location ?? ''].join(' ')
      });
    }
  );

  (
    opportunitiesJson as {
      title: string;
      type: string;
      organization: string;
      description: string;
      link: string;
    }[]
  ).forEach((opp) => {
    results.push({
      type: 'opportunity',
      title: opp.title,
      subtitle: `${opp.type} · ${opp.organization}`,
      keywords: [opp.title, opp.description, opp.organization, opp.type].join(' '),
      href: opp.link
    });
  });

  (
    resourcesJson as {
      title: string;
      category: string;
      description: string;
      link: string;
      tags?: string[];
    }[]
  ).forEach((resource) => {
    results.push({
      type: 'resource',
      title: resource.title,
      subtitle: `${RESOURCE_LABELS[resource.category] ?? resource.category} · ${
        resource.tags?.join(', ') ?? ''
      }`,
      keywords: [
        resource.title,
        resource.description,
        RESOURCE_LABELS[resource.category] ?? resource.category,
        ...(resource.tags ?? [])
      ].join(' '),
      href: resource.link
    });
  });

  return results;
}

const TYPE_ICON: Record<ResultType, React.ElementType> = {
  event: CalendarDots,
  club: UsersThree,
  opportunity: Briefcase,
  resource: BookOpenText
};

export default function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);
  const modalOpenRef = useRef(false);

  const index = useMemo(buildIndex, []);

  type Item =
    | { kind: 'header'; label: string }
    | { kind: 'item'; pos: number; result: SearchResult };

  // Grouped, filtered results (flat list with headers); pos = index within results only
  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const flat: Item[] = [];
    let pos = -1;
    (['event', 'club', 'opportunity', 'resource'] as ResultType[]).forEach((type) => {
      const matches = index.filter(
        (r) => r.type === type && (!q || r.keywords.toLowerCase().includes(q))
      );
      if (matches.length > 0) {
        flat.push({ kind: 'header', label: TYPE_LABEL[type] });
        matches.forEach((result) => {
          pos += 1;
          flat.push({ kind: 'item', pos, result });
        });
      }
    });
    return flat;
  }, [query, index]);

  const resultItems = useMemo(
    () => items.filter((i): i is Extract<Item, { kind: 'item' }> => i.kind === 'item'),
    [items]
  );
  const headerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (item.kind === 'header') counts[item.label] = 0;
      else counts[TYPE_LABEL[item.result.type]] += 1;
    });
    return counts;
  }, [items]);

  // Keep refs in sync for the global keydown handler
  useEffect(() => {
    modalOpenRef.current = selectedEvent !== null;
  }, [selectedEvent]);

  // Global keyboard: ⌘K / Ctrl+K to toggle, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!modalOpenRef.current) setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open; restore focus to trigger only after a real open/close cycle
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      setQuery('');
      setActiveIdx(0);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (hasOpenedRef.current) {
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(resultItems.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = resultItems[activeIdx];
      if (target) select(target.result);
    } else if (e.key === 'Tab') {
      // Simple focus trap so Tab cycles within the aria-modal dialog
      const dialog = e.currentTarget.closest('[role="dialog"]');
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, input, [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function select(result: SearchResult) {
    setOpen(false);
    if (result.type === 'event' && result.event) {
      setSelectedEvent(result.event);
    } else if (result.type === 'club') {
      router.push('/clubs');
    } else if (result.href) {
      window.open(result.href, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-line/20 bg-surface-2/70 px-3 py-2 text-sm text-ink/50 transition-all hover:border-aurora-500/40 hover:text-ink"
        aria-label="Search events, clubs, opportunities and resources"
      >
        <MagnifyingGlass size={16} />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden rounded border border-line/20 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink/40 md:inline">
          ⌘K
        </kbd>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-start justify-center bg-overlay/40 p-4 pt-[12vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-line/10 bg-surface-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Search"
            >
              {/* Input */}
              <div className="flex items-center gap-3 border-b border-line/10 px-4">
                <MagnifyingGlass size={20} className="shrink-0 text-ink/40" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIdx(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search events, clubs, opportunities, resources…"
                  className="h-14 w-full bg-transparent text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="search-results"
                  aria-activedescendant={
                    resultItems[activeIdx] ? `search-item-${activeIdx}` : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-ink/5 p-1.5 text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
                  aria-label="Close search"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Results */}
              <div id="search-results" className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
                {resultItems.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-12 text-center">
                    <MagnifyingGlass size={32} weight="light" className="mb-3 text-ink/20" />
                    <p className="text-sm font-medium text-ink">No results for “{query}”</p>
                    <p className="mt-1 text-xs text-ink/40">
                      Try a community name, tech topic or tool.
                    </p>
                  </div>
                ) : (
                  items.map((item) => {
                    if (item.kind === 'header') {
                      const count = headerCounts[item.label] ?? 0;
                      return (
                        <div
                          key={`h-${item.label}`}
                          className="flex items-center justify-between px-3 pb-1 pt-3"
                        >
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                            {item.label}
                          </span>
                          <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[10px] font-medium text-ink/40">
                            {count}
                          </span>
                        </div>
                      );
                    }
                    const { pos, result } = item;
                    const Icon = TYPE_ICON[result.type];
                    const isActive = pos === activeIdx;
                    return (
                      <button
                        key={`${result.type}-${result.title}-${pos}`}
                        id={`search-item-${pos}`}
                        type="button"
                        onClick={() => select(result)}
                        onMouseMove={() => setActiveIdx(pos)}
                        role="option"
                        aria-selected={isActive}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          isActive ? 'bg-aurora-50' : ''
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isActive ? 'bg-aurora-100 text-aurora-700' : 'bg-ink/5 text-ink/50'
                          }`}
                        >
                          <Icon size={16} weight="bold" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {result.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-ink/50">
                            {result.subtitle}
                          </span>
                        </span>
                        {result.href && (
                          <ArrowUpRight size={14} className="mt-1 shrink-0 text-ink/30" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-4 border-t border-line/10 px-4 py-2.5 text-[11px] text-ink/40">
                <span>
                  <kbd className="rounded border border-line/20 bg-surface-2 px-1">↑</kbd>{' '}
                  <kbd className="rounded border border-line/20 bg-surface-2 px-1">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="rounded border border-line/20 bg-surface-2 px-1">↵</kbd> open
                </span>
                <span>
                  <kbd className="rounded border border-line/20 bg-surface-2 px-1">esc</kbd> close
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </>
  );
}
