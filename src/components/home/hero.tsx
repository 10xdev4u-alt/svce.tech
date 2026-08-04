'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import eventsJson from '@/data/events.json';

function getStats() {
  const today = new Date();
  const events = eventsJson as { eventDate: string; eventEndDate?: string }[];
  const thisMonth = events.filter((e) => {
    const start = new Date(e.eventDate);
    const end = new Date(e.eventEndDate ?? e.eventDate);
    end.setHours(23, 59, 59, 999);
    return (
      start.getMonth() === today.getMonth() &&
      start.getFullYear() === today.getFullYear() &&
      end >= new Date(new Date().setHours(0, 0, 0, 0))
    );
  }).length;

  return [
    { value: '10+', label: 'tech clubs' },
    { value: String(thisMonth), label: thisMonth === 1 ? 'event this month' : 'events this month' },
    { value: '100%', label: 'community driven' }
  ];
}

export default function Hero() {
  const stats = getStats();
  return (
    <section className="relative overflow-hidden bg-aurora-hero">
      {/* Ambient aurora glows */}
      <div className="pointer-events-none absolute inset-0 bg-aurora-glow" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-aurora-drift rounded-full bg-sunrise-300/40 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 animate-aurora-drift rounded-full bg-aurora-300/50 blur-[140px] [animation-delay:3s]" />

      <div className="container-page relative z-10 flex flex-col items-center py-24 text-center md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-aurora-600/20 bg-white/70 px-4 py-1.5 text-xs font-medium text-aurora-800 shadow-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-aurora-500" />
            Sri Venkateswara College of Engineering · Sriperumbudur
          </span>
        </motion.div>

        <motion.h1
          className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        >
          Don&apos;t miss your
          <br />
          next campus{' '}
          <span className="relative whitespace-nowrap">
            <span className="bg-gradient-to-r from-sunrise-500 via-aurora-500 to-aurora-700 bg-clip-text text-transparent">
              tech moment
            </span>
          </span>
        </motion.h1>

        <motion.p
          className="mt-6 max-w-xl text-lg text-ink/60 md:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        >
          Events, clubs, symposiums and opportunities — everything happening around SVCE, in one
          place. Built by the community, for the community.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        >
          <Link
            href="/opportunities"
            className="rounded-xl bg-ink px-6 py-3 text-base font-medium text-white shadow-lg shadow-ink/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
          >
            Explore opportunities
          </Link>
          <Link
            href="/clubs"
            className="rounded-xl border border-ink/10 bg-white/80 px-6 py-3 text-base font-medium text-ink backdrop-blur transition-all hover:-translate-y-0.5 hover:border-aurora-500/40 hover:bg-white"
          >
            Browse clubs
          </Link>
        </motion.div>

        <motion.dl
          className="mt-16 flex items-center gap-10 md:gap-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-3xl font-bold text-ink md:text-4xl">{stat.value}</dd>
              <dd className="mt-1 text-sm text-ink/50">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
