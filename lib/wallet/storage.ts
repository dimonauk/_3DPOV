"use client";

/**
 * Wallet shared state — small client-side store backed by
 * localStorage that holds the cards a visitor has saved. Pure
 * client; the studio never sees the contents. This is the
 * Holo-Flow analogue of "saved business cards in your phone".
 *
 * Storage shape (key `holoflow.wallet.v1`):
 *   {
 *     version: 1,
 *     cards: Array<{
 *       slug: string,
 *       name: string,
 *       role?: string,
 *       primary?: string,
 *       secondary?: string,
 *       savedAt: number,
 *     }>
 *   }
 *
 * Keep this isomorphic-safe: every read goes through a try/catch so
 * SSR + private-browsing modes can't blow up.
 */

const STORAGE_KEY = "holoflow.wallet.v1";

export type WalletCard = {
  slug: string;
  name: string;
  role?: string;
  primary?: string;
  secondary?: string;
  savedAt: number;
};

type WalletStore = {
  version: 1;
  cards: WalletCard[];
};

function readStore(): WalletStore {
  if (typeof window === "undefined") return { version: 1, cards: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, cards: [] };
    const parsed = JSON.parse(raw) as Partial<WalletStore>;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.cards)) {
      return { version: 1, cards: [] };
    }
    return parsed as WalletStore;
  } catch {
    return { version: 1, cards: [] };
  }
}

function writeStore(store: WalletStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("holoflow:wallet:changed"));
  } catch {
    // Quota or disabled storage — silent.
  }
}

export function listWallet(): WalletCard[] {
  return readStore().cards.sort((a, b) => b.savedAt - a.savedAt);
}

export function isInWallet(slug: string): boolean {
  return readStore().cards.some((c) => c.slug === slug);
}

export function addToWallet(card: Omit<WalletCard, "savedAt">): WalletCard {
  const store = readStore();
  const existing = store.cards.find((c) => c.slug === card.slug);
  if (existing) {
    return existing;
  }
  const next: WalletCard = { ...card, savedAt: Date.now() };
  store.cards.unshift(next);
  // Cap wallet size at 100 to bound localStorage growth.
  if (store.cards.length > 100) {
    store.cards = store.cards.slice(0, 100);
  }
  writeStore(store);
  return next;
}

export function removeFromWallet(slug: string): void {
  const store = readStore();
  store.cards = store.cards.filter((c) => c.slug !== slug);
  writeStore(store);
}

export function exportWalletAsJson(): string {
  return JSON.stringify(readStore(), null, 2);
}

export function importWalletFromJson(json: string): {
  ok: boolean;
  added: number;
} {
  try {
    const parsed = JSON.parse(json) as Partial<WalletStore>;
    if (!parsed || !Array.isArray(parsed.cards)) {
      return { ok: false, added: 0 };
    }
    const store = readStore();
    let added = 0;
    for (const c of parsed.cards as WalletCard[]) {
      if (!c || typeof c.slug !== "string") continue;
      if (!store.cards.some((x) => x.slug === c.slug)) {
        store.cards.unshift(c);
        added++;
      }
    }
    writeStore(store);
    return { ok: true, added };
  } catch {
    return { ok: false, added: 0 };
  }
}
