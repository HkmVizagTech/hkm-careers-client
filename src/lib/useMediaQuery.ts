'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query. Returns `false` during SSR and on the first client
 * render so markup stays consistent through hydration, then updates on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True below Tailwind's `lg` breakpoint. */
export function useIsMobile() {
  return useMediaQuery('(max-width: 1023px)');
}
