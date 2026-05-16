/**
 * tests/setup.ts — Global test bootstrap.
 *
 * Loaded by vitest before every test file (any environment). Keep
 * the imports cheap; this runs once per worker.
 *
 *   - jest-dom adds DOM-aware matchers (toBeInTheDocument, etc).
 *     They no-op safely in non-DOM environments.
 *   - We force LOG_LEVEL=error during tests so capability tests
 *     don't spew info-level logs into the test output.
 */

import "@testing-library/jest-dom/vitest";

import { afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

import { setLogLevel } from "lib/log";

// happy-dom 19.x ships a `window.localStorage` whose `getItem`/`setItem`
// are undefined. Zustand's `persist` middleware tries to call those on
// every state mutation, so any test of a persisted slice in the
// happy-dom env crashes mid-setState. Polyfill with a Map-backed
// Storage shim. Only applies in DOM tests; node tests don't define
// `window`.
if (
  typeof window !== "undefined" &&
  (!window.localStorage || typeof window.localStorage.setItem !== "function")
) {
  const mem = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, String(v));
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => {
        mem.clear();
      },
      key: (i: number) => Array.from(mem.keys())[i] ?? null,
      get length() {
        return mem.size;
      },
    },
    writable: true,
    configurable: true,
  });
}

beforeAll(() => {
  // Tests assert on returned values, not on log output. Silence
  // everything below `error`. Individual tests can opt back in via
  // setLogLevel("debug") if they want to assert on log content.
  setLogLevel("error");
});

afterEach(() => {
  // RTL leaves DOM nodes mounted between tests; clean up so each
  // test sees a fresh document.
  cleanup();
});
