/**
 * components/news/NewsCard.tsx — One card in the Polymaths Feed grid.
 *
 * Each card carries a source chip (Holoflow / Hangar / Dolly / Release
 * / Paper / Model / News), the upstream title, an optional summary
 * excerpt, the author handle if known, and a time-ago stamp. Clicking
 * the card opens the upstream URL in a new tab.
 *
 * The card never embellishes — title + summary come straight from the
 * source. Workshop register, no marketing.
 */
import type { FeedEntry } from "lib/watchers/types";

type Props = { entry: FeedEntry };

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(days / 365)}y`;
}

const KIND_LABEL: Record<FeedEntry["kind"], string> = {
  commit: "commit",
  release: "release",
  paper: "paper",
  model: "model",
  news: "news",
};

const SOURCE_LABEL: Record<FeedEntry["source"], string> = {
  holoflow: "Holoflow",
  hangar: "Hangar",
  dollyos: "Dolly OS",
  github: "GitHub",
  huggingface: "Hugging Face",
  arxiv: "arXiv",
  org: "Org",
};

const SOURCE_TINT: Record<FeedEntry["source"], string> = {
  holoflow: "border-pink-200/40 text-pink-200",
  hangar: "border-emerald-300/40 text-emerald-200",
  dollyos: "border-violet-300/40 text-violet-200",
  github: "border-chrome-400/40 text-chrome-200",
  huggingface: "border-amber-300/40 text-amber-200",
  arxiv: "border-sky-300/40 text-sky-200",
  org: "border-chrome-500/40 text-chrome-300",
};

export function NewsCard({ entry }: Props) {
  const isExternal = entry.url.startsWith("http");
  return (
    <li
      className={[
        "group flex flex-col gap-3 rounded-sm border border-warm-black-700",
        "bg-warm-black-900/40 px-4 py-4 transition-colors hover:border-pink-200",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={[
            "chrome-label rounded-sm border px-2 py-0.5 text-[10px]",
            SOURCE_TINT[entry.source],
          ].join(" ")}
        >
          {SOURCE_LABEL[entry.source]} · {KIND_LABEL[entry.kind]}
        </span>
        <span className="chrome-label text-chrome-500">
          {timeAgo(entry.publishedAt)}
        </span>
      </div>

      <a
        href={entry.url}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="block text-sm font-medium leading-snug text-chrome-100 group-hover:text-pink-100"
      >
        {entry.title}
      </a>

      {entry.summary ? (
        <p className="line-clamp-3 text-xs leading-relaxed text-chrome-300">
          {entry.summary}
        </p>
      ) : null}

      <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
        <span className="chrome-label truncate text-chrome-500">
          {entry.author ?? entry.tags?.[0] ?? entry.source}
        </span>
        <a
          href={entry.url}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="chrome-label text-pink-200 hover:underline"
        >
          Open &rarr;
        </a>
      </div>
    </li>
  );
}
