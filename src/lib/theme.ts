export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'svce-theme';

/**
 * Minimal FOUC-safe script — inlined in <head> by layout.tsx so the correct
 * theme is applied before first paint (no flash of the wrong scheme).
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var d=s==='dark'||((s==='system'||!s)&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function getStoredPreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : null;
  } catch {
    // Storage blocked (private mode etc.) — fall back to system default
    return null;
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Resolve a stored preference (or system default) into a concrete theme. */
export function resolveTheme(pref: ThemePreference | null): 'light' | 'dark' {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  return systemPrefersDark() ? 'dark' : 'light';
}

/** Persist + apply a preference immediately. */
export function applyTheme(pref: ThemePreference): void {
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}
