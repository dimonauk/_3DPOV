/**
 * lib/auth/admin-emails.test.ts — Unit tests for the operator
 * allow-list helper.
 *
 * Covers the parsing contract that gates every /admin/* route + the
 * client-side admin layout:
 *
 *   - Hardcoded default when both env vars are unset
 *   - ADMIN_EMAILS (server) wins when set
 *   - NEXT_PUBLIC_ADMIN_EMAILS (client) used as fallback
 *   - Empty / whitespace-only ADMIN_EMAILS falls back to default
 *     (rather than locking everyone out)
 *   - Case-insensitive comparison
 *   - Whitespace trimming around each entry
 *
 * The cache is cleared between tests via resetAdminEmailsCache().
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getAdminEmails,
  isAdminEmail,
  resetAdminEmailsCache,
} from "./admin-emails";

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) {
    process.env[k] = v;
  }
}

beforeEach(() => {
  // Start each test from a clean env + cache.
  delete process.env.ADMIN_EMAILS;
  delete process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  resetAdminEmailsCache();
});

afterEach(() => {
  restoreEnv();
  resetAdminEmailsCache();
});

describe("getAdminEmails", () => {
  it("falls back to the hardcoded default when env is unset", () => {
    const set = getAdminEmails();
    expect(set.has("dimonauk@gmail.com")).toBe(true);
  });

  it("returns the parsed ADMIN_EMAILS list when set", () => {
    process.env.ADMIN_EMAILS = "alice@example.com,bob@example.com";
    const set = getAdminEmails();
    expect(set.has("alice@example.com")).toBe(true);
    expect(set.has("bob@example.com")).toBe(true);
    // The default is NOT included once an env var is provided.
    expect(set.has("dimonauk@gmail.com")).toBe(false);
  });

  it("falls back to NEXT_PUBLIC_ADMIN_EMAILS when ADMIN_EMAILS is unset", () => {
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "alice@example.com";
    const set = getAdminEmails();
    expect(set.has("alice@example.com")).toBe(true);
    expect(set.has("dimonauk@gmail.com")).toBe(false);
  });

  it("prefers ADMIN_EMAILS over NEXT_PUBLIC_ADMIN_EMAILS when both set", () => {
    process.env.ADMIN_EMAILS = "server@example.com";
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "client@example.com";
    const set = getAdminEmails();
    expect(set.has("server@example.com")).toBe(true);
    expect(set.has("client@example.com")).toBe(false);
  });

  it("falls back to the default when ADMIN_EMAILS is empty / whitespace-only", () => {
    process.env.ADMIN_EMAILS = "   ";
    const set = getAdminEmails();
    expect(set.has("dimonauk@gmail.com")).toBe(true);
  });

  it("falls back to the default when ADMIN_EMAILS parses to zero entries", () => {
    // Only commas + whitespace → no valid emails → default
    process.env.ADMIN_EMAILS = " , , , ";
    const set = getAdminEmails();
    expect(set.has("dimonauk@gmail.com")).toBe(true);
  });

  it("trims whitespace and lowercases each entry", () => {
    process.env.ADMIN_EMAILS = " Alice@Example.COM , bob@example.com ";
    const set = getAdminEmails();
    expect(set.has("alice@example.com")).toBe(true);
    expect(set.has("bob@example.com")).toBe(true);
  });

  it("caches the parsed result per process (resetAdminEmailsCache clears it)", () => {
    process.env.ADMIN_EMAILS = "first@example.com";
    const a = getAdminEmails();
    expect(a.has("first@example.com")).toBe(true);

    // Change env without resetting — cached result wins.
    process.env.ADMIN_EMAILS = "second@example.com";
    const b = getAdminEmails();
    expect(b.has("first@example.com")).toBe(true);
    expect(b.has("second@example.com")).toBe(false);

    // After reset, the new env is observed.
    resetAdminEmailsCache();
    const c = getAdminEmails();
    expect(c.has("second@example.com")).toBe(true);
    expect(c.has("first@example.com")).toBe(false);
  });
});

describe("isAdminEmail", () => {
  it("returns false for null / undefined", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("returns true for an email on the default allow-list", () => {
    expect(isAdminEmail("dimonauk@gmail.com")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(isAdminEmail("DIMONAUK@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("Dimonauk@Gmail.com")).toBe(true);
  });

  it("returns false for an email not on the list", () => {
    expect(isAdminEmail("intruder@example.com")).toBe(false);
  });

  it("honours ADMIN_EMAILS overrides", () => {
    process.env.ADMIN_EMAILS = "alice@example.com";
    resetAdminEmailsCache();
    expect(isAdminEmail("alice@example.com")).toBe(true);
    expect(isAdminEmail("dimonauk@gmail.com")).toBe(false);
  });
});
