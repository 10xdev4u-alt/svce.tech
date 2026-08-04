'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { applyTheme, getStoredPreference, resolveTheme } from '@/lib/theme';

/**
 * Header sun/moon toggle. Clicking flips the resolved theme and pins an
 * explicit light/dark preference (lifting the user out of "system").
 */
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const pref = getStoredPreference();
    setIsDark(resolveTheme(pref) === 'dark');
    setMounted(true);

    // Follow OS changes while the user hasn't pinned a preference
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = getStoredPreference();
      if (!current || current === 'system') {
        setIsDark(media.matches);
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function toggle() {
    const next: 'light' | 'dark' = isDark ? 'light' : 'dark';
    applyTheme(next);
    setIsDark(next === 'dark');
  }

  // Reserve space pre-hydration to avoid header layout shift
  if (!mounted) {
    return <span className="inline-flex h-9 w-9 items-center justify-center" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink/70 transition-all hover:bg-ink/5 hover:text-ink active:scale-95"
    >
      <Sun
        size={18}
        weight={isDark ? 'fill' : 'regular'}
        className={`absolute transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-75 opacity-0'
        }`}
      />
      <Moon
        size={18}
        weight={isDark ? 'regular' : 'fill'}
        className={`absolute transition-all duration-300 ${
          isDark ? 'rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
    </button>
  );
}
