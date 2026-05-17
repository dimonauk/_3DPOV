/**
 * components/aura/aura-launcher/history-store.ts — Two-tiered chat
 * history I/O for the Aura launcher.
 *
 * Anonymous visitors persist in localStorage (single device).
 * Logged-in visitors persist server-side via /api/aura/history
 * (cross-device). Helpers are no-throw / no-await-blocking — chat
 * progress should never fail because persistence flaked.
 *
 * Extracted from aura-launcher.tsx per ARCHITECTURE.md Rule 1.
 */

import { MAX_HISTORY, STORAGE_KEY, type Turn } from "./types";

export function loadLocalHistory(): Turn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Turn =>
        typeof t === "object" &&
        t !== null &&
        ((t as Turn).role === "user" || (t as Turn).role === "model") &&
        typeof (t as Turn).text === "string",
    );
  } catch {
    return [];
  }
}

export function saveLocalHistory(history: Turn[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-MAX_HISTORY)),
    );
  } catch {
    // quota / private mode — fall through
  }
}

export async function loadServerHistory(idToken: string): Promise<Turn[]> {
  try {
    const res = await fetch("/api/aura/history", {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { turns?: unknown };
    if (!Array.isArray(json.turns)) return [];
    return json.turns.filter(
      (t): t is Turn =>
        typeof t === "object" &&
        t !== null &&
        ((t as Turn).role === "user" || (t as Turn).role === "model") &&
        typeof (t as Turn).text === "string",
    );
  } catch {
    return [];
  }
}

export async function saveServerTurns(
  idToken: string,
  turns: Turn[],
): Promise<void> {
  try {
    await fetch("/api/aura/history", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ turns }),
    });
  } catch {
    // best effort
  }
}

export async function clearServerHistory(idToken: string): Promise<void> {
  try {
    await fetch("/api/aura/history", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    // best effort
  }
}
