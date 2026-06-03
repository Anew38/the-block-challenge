import { useEffect, useState } from 'react';

/**
 * Returns the current epoch ms, re-rendering on a fixed interval so consumers
 * (countdowns, status derivation) stay live without each owning a timer. The
 * tick is shared per component instance; pass a coarser `intervalMs` where
 * second-level precision isn't needed.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
