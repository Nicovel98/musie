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
    m.addEventListener ? m.addEventListener('change', handler) : m.addListener(handler);
    // sync
    setMatches(m.matches);
    return () => {
      m.removeEventListener ? m.removeEventListener('change', handler) : m.removeListener(handler);
    };
  }, [query]);

  return matches;
};
