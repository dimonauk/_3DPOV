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
