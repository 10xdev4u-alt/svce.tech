'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  BookOpenText,
  Briefcase,
  Calculator,
  Code,
  FileText,
  GitFork,
  Microphone
} from '@phosphor-icons/react';
import resources from '@/data/resources.json';

type Resource = {
  title: string;
  category: string;
  description: string;
  link: string;
  tags?: string[];
};

type CategoryKey =
  | 'offcampus'
  | 'dsa'
  | 'interview'
  | 'aptitude'
  | 'resume'
  | 'opensource'
  | 'courses';

const CATEGORIES: Record<CategoryKey, { label: string; icon: typeof Briefcase; chip: string }> = {
  offcampus: {
    label: 'Off-campus & job fairs',
    icon: Briefcase,
    chip: 'bg-blue-50 text-blue-800'
  },
  dsa: { label: 'DSA prep', icon: Code, chip: 'bg-purple-50 text-purple-800' },
  interview: {
    label: 'Interview prep',
    icon: Microphone,
    chip: 'bg-aurora-100 text-aurora-800'
  },
  aptitude: {
    label: 'Aptitude',
    icon: Calculator,
    chip: 'bg-sunrise-100 text-sunrise-800'
  },
  resume: { label: 'Resume', icon: FileText, chip: 'bg-pink-50 text-pink-800' },
  opensource: { label: 'Open source', icon: GitFork, chip: 'bg-teal-50 text-teal-800' },
  courses: {
    label: 'Courses',
    icon: BookOpenText,
    chip: 'bg-indigo-50 text-indigo-800'
  }
};

const FILTERS = [
  { key: 'all', label: 'All' },
  ...Object.entries(CATEGORIES).map(([key, { label }]) => ({ key, label }))
];

export default function Resources() {
  const list = resources as Resource[];
  const [active, setActive] = useState<string>('all');

  const filtered = active === 'all' ? list : list.filter((r) => r.category === active);

  return (
    <div className="container-page py-16">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
          Resources
        </h1>
        <p className="mt-3 text-lg text-ink/60">
          Job fairs, off-campus portals and interview prep — hand-picked links to level up. Every
          resource is verified and community-maintained.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            aria-pressed={active === filter.key}
            onClick={() => setActive(filter.key)}
            className={
              active === filter.key
                ? 'rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-on-accent shadow-sm transition-all hover:-translate-y-px'
                : 'rounded-full border border-line/20 bg-surface-2 px-4 py-1.5 text-sm font-medium text-ink/60 transition-all hover:border-aurora-500/40 hover:text-ink'
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource, i) => {
            const meta = CATEGORIES[resource.category as CategoryKey];
            const Icon = meta?.icon ?? Briefcase;
            return (
              <a
                key={`${resource.title}-${i}`}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-line/10 bg-surface-2 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-aurora-400/40 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className={`chip ${meta?.chip ?? 'bg-ink/5 text-ink/70'}`}>
                    <Icon size={12} weight="fill" className="mr-1" />
                    {meta?.label ?? resource.category}
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-ink/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-aurora-600"
                  />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold text-ink transition-colors group-hover:text-aurora-700">
                  {resource.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-ink/60">{resource.description}</p>
                {resource.tags && resource.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/10 bg-surface-2/60 px-8 py-20 text-center">
          <BookOpenText size={48} weight="light" className="mb-4 text-aurora-400" />
          <p className="text-lg font-medium text-ink">No resources in this category yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink/50">
            Found something worth sharing? Add it in 2 minutes via a pull request.
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl border border-sunrise-200 bg-gradient-to-br from-sunrise-50 to-aurora-50 p-6 dark:from-amber-950/40 dark:to-emerald-950/40 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            Know a better resource, fair or portal?
          </p>
          <p className="mt-1 text-sm text-ink/60">
            This page is community-driven — add it to{' '}
            <code className="rounded bg-surface-2/80 px-1.5 py-0.5 text-xs text-sunrise-800">
              src/data/resources.json
            </code>{' '}
            and open a PR. It goes live after review.
          </p>
        </div>
        <a
          href="https://github.com/10xdev4u-alt/svce.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-on-accent shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          Contribute on GitHub
        </a>
      </div>
    </div>
  );
}
