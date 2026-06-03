import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);

    type LegacyMediaQueryList = MediaQueryList & {
      addListener?: (listener: (e: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (e: MediaQueryListEvent) => void) => void;
    };

    const legacy = m as LegacyMediaQueryList;
    if (m.addEventListener) {
      m.addEventListener('change', handler);
    } else if (legacy.addListener) {
      legacy.addListener(handler);
    }

    return () => {
      if (m.removeEventListener) {
        m.removeEventListener('change', handler);
      } else if (legacy.removeListener) {
        legacy.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
};
