'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlass, XSquare } from '@phosphor-icons/react';
import communities from '@/data/communities.json';
import type { Community } from '@/types/event';

export default function Clubs() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = communities as Community[];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="container-page py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
          Tech clubs at SVCE
        </h1>
        <p className="mt-3 text-lg text-ink/60">
          Every student chapter and community on campus — where they are, what they do, and how to
          get involved.
        </p>
      </header>

      <div className="relative mb-10 max-w-md">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clubs by name or keyword..."
          aria-label="Search clubs"
          className="w-full rounded-xl border border-line/20 bg-surface-2 py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-aurora-500 focus:ring-4 focus:ring-aurora-500/10"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((club, i) => (
            <ClubCard key={`${club.name}-${i}`} club={club} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line/20 bg-surface-2/60 py-20 text-center">
          <XSquare size={56} weight="light" className="mb-4 text-ink/30" />
          <p className="text-lg font-medium text-ink">No clubs found matching “{query}”</p>
          <p className="mt-1 text-sm text-ink/50">Try a different keyword, or check back soon.</p>
        </div>
      )}
    </div>
  );
}

function ClubCard({ club }: { club: Community }) {
  const firstLetters = club.name
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <article className="group flex h-full gap-4 rounded-2xl border border-line/10 bg-surface-2 p-6 shadow-card transition-all hover:-translate-y-1 hover:border-aurora-400/40 hover:shadow-card-hover">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sunrise-100 to-aurora-100 font-display text-lg font-bold text-aurora-800 transition-transform duration-300 group-hover:scale-105 dark:from-amber-950/60 dark:to-emerald-950/60 dark:text-aurora-300">
        {firstLetters || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-semibold text-ink">{club.name}</h3>
        {club.location && (
          <span className="chip mt-1 bg-aurora-100 text-aurora-800">{club.location}</span>
        )}
        {club.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/60">
            {club.description}
          </p>
        )}
      </div>
    </article>
  );
}
