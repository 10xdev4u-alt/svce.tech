'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { List, X } from '@phosphor-icons/react';
import PushSubscribe from '../PushSubscribe';
import SearchPalette from '../search/search-palette';
import ThemeToggle from './theme-toggle';

const navLinks = [
  { href: '/', label: 'Events' },
  { href: '/clubs', label: 'Clubs' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/resources', label: 'Resources' }
];

const CONTRIBUTE_URL = 'https://github.com/10xdev4u-alt/svce.tech';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile sheet whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes the mobile sheet
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-line/10 bg-surface/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Main">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3" aria-label="SVCE Tech Hub home">
          <div className="transition-transform duration-300 group-hover:scale-105">
            <Image src="/logo.svg" alt="SVCE Tech Hub logo" width={36} height={36} priority />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            svce<span className="text-aurora-600">.tech</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 sm:gap-2 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-aurora-100 hover:text-aurora-800 dark:hover:bg-aurora-900/40 dark:hover:text-aurora-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <SearchPalette />
          <ThemeToggle />
          {/* Single PushSubscribe instance — never render it twice */}
          <PushSubscribe />
          <a
            href={CONTRIBUTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hidden rounded-lg bg-ink px-4 py-2 text-sm font-medium text-on-accent shadow-sm transition-all hover:-translate-y-px hover:shadow-md lg:inline-flex"
          >
            Contribute
          </a>
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-ink/70 transition-colors hover:bg-ink/5 lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-line/10 bg-surface shadow-lg lg:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-aurora-100 text-aurora-800 dark:bg-aurora-900/40 dark:text-aurora-300'
                      : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={CONTRIBUTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 rounded-xl bg-ink px-4 py-3 text-center text-base font-medium text-on-accent shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
              >
                Contribute on GitHub
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
