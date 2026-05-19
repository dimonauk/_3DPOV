/**
 * lib/watchers/install-queue.ts — Operator-only queue of "pnpm add"
 * suggestions surfaced by the watcher.
 *
 * Vercel's runtime filesystem is read-only, so we don't actually run
 * `pnpm add` from a route. Instead, when the watcher spots a new
 * release for a "lined up" candidate from OPEN-SOURCE-STACK.md, the
 * admin surface lists it and the operator runs `pnpm add` locally.
 *
 * The queue is persisted to file (and Upstash if configured) so the
 * suggestion survives across deploys. Backed by the same dual-store
 * pattern as `store.ts` but keyed separately.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type InstallSuggestion = {
  id: string;
  owner: string;
  repo: string;
  /** Display name from the doc, e.g. "Pixelorama". */
  name: string;
  /** Release tag that triggered the suggestion. */
  tag: string;
  /** Section the dep belongs to (e.g. "Lined up — researched, not yet wired"). */
  section: string;
  /** ISO timestamp the queue learned of it. */
  queuedAt: string;
  /** Operator-acked? Ack hides it from the active queue. */
  acked: boolean;
};

const FILE_PATH = path.join(
  process.cwd(),
  "data",
  "polymaths-install-queue.json",
);

type QueueFile = {
  last_updated: string;
  items: InstallSuggestion[];
};

async function readQueueFile(): Promise<QueueFile> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as QueueFile;
  } catch {
    return { last_updated: "1970-01-01T00:00:00Z", items: [] };
  }
}

async function writeQueueFile(file: QueueFile): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(file, null, 2), "utf8");
}

export async function listSuggestions(): Promise<InstallSuggestion[]> {
  const { items } = await readQueueFile();
  return items;
}

export async function addSuggestion(
  s: Omit<InstallSuggestion, "queuedAt" | "acked">,
): Promise<void> {
  const file = await readQueueFile();
  if (file.items.some((i) => i.id === s.id)) return;
  file.items.unshift({
    ...s,
    queuedAt: new Date().toISOString(),
    acked: false,
  });
  file.last_updated = new Date().toISOString();
  await writeQueueFile(file);
}

export async function ackSuggestion(id: string): Promise<void> {
  const file = await readQueueFile();
  const item = file.items.find((i) => i.id === id);
  if (!item) return;
  item.acked = true;
  file.last_updated = new Date().toISOString();
  await writeQueueFile(file);
}

export async function clearAcked(): Promise<number> {
  const file = await readQueueFile();
  const before = file.items.length;
  file.items = file.items.filter((i) => !i.acked);
  file.last_updated = new Date().toISOString();
  await writeQueueFile(file);
  return before - file.items.length;
}
