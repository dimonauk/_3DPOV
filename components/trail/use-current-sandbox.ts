"use client";

/**
 * components/trail/use-current-sandbox.ts
 *
 * Scroll-tracking hook for the long-form `/trail` page. Observes
 * every `.trail-sandbox` element on mount, returns the numeric id of
 * the one currently in view. The result drives the nav's progress
 * counter ("sandbox 17 / 40").
 *
 * Threshold 0.4 — sandbox is considered "current" when 40 % of its
 * box is in the viewport. Lower numbers feel premature; higher feel
 * laggy at the top edge of long sections.
 *
 * Owned state, narrow interface: returns a single number. Replaceable
 * by another scroll-strategy (URL hash, IntersectionObserver-by-anchor)
 * without touching the call site.
 */

import { useEffect, useState } from "react";

export function useCurrentSandbox(): number {
  const [currentSandbox, setCurrentSandbox] = useState(0);

  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const num = parseInt(id.replace("sb-", ""));
          if (!isNaN(num)) setCurrentSandbox(num);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.4,
    });
    const sandboxes = document.querySelectorAll(".trail-sandbox");
    sandboxes.forEach((sandbox) => observer.observe(sandbox));
    return () => observer.disconnect();
  }, []);

  return currentSandbox;
}
