import Link from "next/link";

import Footer from "components/layout/footer";
import { getProfile } from "lib/people/registry";
import { activeSources } from "lib/social-feeds/sources";
import { getLastRefresh, getRecentPosts } from "lib/social-feeds/store";
import type { AggregatedPost } from "lib/social-feeds/types";

export const metadata = {
  title: "Feed",
  description:
    "The studio's aggregated feed of the UK creative scene — pulled from each rolodex person's public feeds (RSS, Atom, Bluesky, Mastodon). One chronological view of what they're making.",
};

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
  const years = Math.floor(days / 365);
  return `${years}y`;
}

function PostCard({ post }: { post: AggregatedPost }) {
  const profile = getProfile(post.personId);
  const profileHref = profile ? `/people/${post.personId}` : null;
  const hasImage = post.imageUrls && post.imageUrls.length > 0;
  const firstImage = post.imageUrls?.[0];

  return (
    <li className="overflow-hidden rounded-sm border border-warm-black-700 bg-warm-black-900/30 transition-colors hover:border-pink-200">
      {hasImage && firstImage ? (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square overflow-hidden bg-warm-black-950"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImage}
            alt={post.text.slice(0, 80)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </a>
      ) : null}
      <div className="px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          {profileHref ? (
            <Link
              href={profileHref}
              className="text-sm text-chrome-100 hover:text-pink-200"
            >
              {post.personName}
            </Link>
          ) : (
            <span className="text-sm text-chrome-100">{post.personName}</span>
          )}
          <span className="chrome-label text-chrome-500">
            {post.platform} · {timeAgo(post.postedAt)}
          </span>
        </div>
        {post.text ? (
          <p className="mt-2 line-clamp-4 text-sm text-chrome-300">
            {post.text}
          </p>
        ) : null}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="chrome-label mt-3 inline-block text-pink-200 hover:underline"
        >
          View on {post.platform} &rarr;
        </a>
      </div>
    </li>
  );
}

export default function FeedPage() {
  const posts = getRecentPosts(60);
  const lastRefresh = getLastRefresh();
  const sourceCount = activeSources().length;
  const refreshedAgo =
    lastRefresh === "1970-01-01T00:00:00Z"
      ? null
      : timeAgo(lastRefresh);

  return (
    <>
      <article className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="chrome-label">Magazine · Feed</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Feed.
        </h1>
        <p className="mt-8 max-w-2xl text-chrome-200">
          One chronological view of the UK creative scene the studio
          follows. Pulled from each rolodex person&rsquo;s public
          feeds &mdash; RSS, Atom, Bluesky, Mastodon &mdash; and
          merged here. Nobody posts on holoflow.co.uk; their public
          posts elsewhere come to you.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-chrome-300">
          {sourceCount === 0 ? (
            <>
              No feed sources yet. The cron job that fills this page
              starts the moment the first source is registered in{" "}
              <code className="text-pink-200">
                lib/social-feeds/sources.ts
              </code>
              .
            </>
          ) : (
            <>
              Watching {sourceCount} source
              {sourceCount === 1 ? "" : "s"}. Refreshes hourly via the
              cron at <code>/api/cron/refresh-feeds</code>.
              {refreshedAgo
                ? ` Last refresh ${refreshedAgo} ago.`
                : ""}
            </>
          )}
        </p>

        {posts.length === 0 ? (
          <section className="mt-12 rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-6 py-12 text-center">
            <p className="text-sm text-chrome-400">
              The feed is empty. As sources are added to the registry
              and the cron runs, posts appear here.
            </p>
            <p className="mt-3 text-xs text-chrome-500">
              See{" "}
              <Link
                href="/whoswho"
                className="text-pink-200 hover:underline"
              >
                who&rsquo;s-who
              </Link>{" "}
              for the people whose feeds will land here, and{" "}
              <code className="text-pink-200">docs/ROADMAP.md</code>{" "}
              for the architecture.
            </p>
          </section>
        ) : (
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </ul>
        )}

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label">How it works</div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-chrome-300">
            <li>
              Each rolodex entry has zero-or-more known public feeds
              (an RSS URL, a Mastodon handle, a Bluesky DID, a Flickr
              album feed).
            </li>
            <li>
              A scheduled job fetches each feed, parses it via the{" "}
              <a
                href="https://github.com/macieklamberski/feedsmith"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-200 hover:underline"
              >
                feedsmith
              </a>{" "}
              library, normalises items, and writes the merged
              chronology to{" "}
              <code className="text-pink-200">
                data/aggregated-feed.json
              </code>
              .
            </li>
            <li>
              This page reads that file. No upload happens; the feed
              is read-only on the public side.
            </li>
            <li>
              The studio doesn&rsquo;t scrape closed networks
              (Instagram, X). Where a person publishes only to those
              walled gardens, the link from{" "}
              <Link
                href="/people"
                className="text-pink-200 hover:underline"
              >
                /people
              </Link>{" "}
              is the route.
            </li>
          </ul>
        </section>

        <section className="mt-12 border-t border-warm-black-800 pt-8">
          <div className="chrome-label">Read first</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/people"
                className="text-pink-200 hover:underline"
              >
                All profiles &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/whoswho"
                className="text-pink-200 hover:underline"
              >
                Who&rsquo;s-who articles &rarr;
              </Link>
            </li>
            <li>
              <Link
                href="/articles/osint-for-finding-your-people"
                className="text-pink-200 hover:underline"
              >
                OSINT for finding your people &rarr;
              </Link>
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
