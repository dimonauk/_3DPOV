"use client";

// `Footer` is rendered by `app/rookery/layout.tsx` (a Server
// Component), not imported here — async Server Components cannot be
// imported by `"use client"` modules in Next.js 15.6 canary.
import { useAuth } from "components/auth/auth-provider";
import {
  formatRelative,
  listRecentThreads,
} from "lib/rookery/client";
import type { Thread } from "lib/rookery/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RookeryPage() {
  const { user, loading: authLoading } = useAuth();
  // TODO: when Stripe checkout succeeds, hit /api/rookery/onboarding
  // with slug "welcome" + the user's email. The day-3 and day-7
  // sends need a queue; lib/rookery/emails.ts defines delayDays.
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listRecentThreads()
      .then((list) => {
        if (active) setThreads(list);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Couldn't load threads.";
        if (active) {
          setError(message);
          setThreads([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">A loft above the studio</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The Rookery.
        </h1>
        <div className="mt-6 max-w-xl space-y-5 text-chrome-200">
          <p>
            A rookery is a colony of rooks. Eggs come in, get sat on,
            hatch, fledge, and eventually fly off somewhere with the
            shape of where they came from in their feathers.
            That&rsquo;s the metaphor and I&rsquo;ve stuck to it.
          </p>
          <p>
            The Rookery is the part of holoflow where people who like
            what the studio makes can sit and talk to each other.
            Light-painters comparing camera bodies. Makers arguing
            about belt-printer settings. Flow-arts people who already
            know what the kata feels like, looking for more of each
            other. Photographers curious about the rig but not yet
            curious enough to build one. People who just want to be
            near other people who give a shit about this kind of work.
            Anyone, in other words, who&rsquo;d find the journal
            interesting and would like to talk back.
          </p>
          <p>
            I run this. I&rsquo;m Dimona &mdash; light-painter,
            twelve-year poi practitioner, trans woman, Salford.
            There&rsquo;s a small monthly subscription at the door. It
            does two jobs at once: it pays the hosting, and it acts as
            the bouncer. Anyone willing to send a trans woman a few
            pound a month has, by paying, demonstrated they don&rsquo;t
            hate her for being trans. That&rsquo;s the filter.
            No vibes-check, no pledge to sign, no allyship to perform
            &mdash; the cheque does the sorting the moderators in free
            communities do by hand. Bigots won&rsquo;t work with me. Anyone
            the door lets in is welcome on the perch.
          </p>
          <p className="text-chrome-300">
            The longer version of <em>why</em> lives on the{" "}
            <Link
              href="/rookery/about"
              className="text-pink-200 underline underline-offset-4"
            >
              About page
            </Link>
            . If you&rsquo;ve read this far, you&rsquo;ve already
            worked out whether the Rookery is for you.
          </p>
        </div>

        <div className="mt-10 flex items-center gap-4">
          {authLoading ? (
            <span className="chrome-label text-chrome-500">
              Checking your perch&hellip;
            </span>
          ) : user ? (
            <Link
              href="/rookery/new"
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 chrome-label text-pink-200 transition-colors hover:bg-pink-200/20"
            >
              + Start a thread
            </Link>
          ) : (
            <Link
              href="/signin"
              className="rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-5 py-3 chrome-label text-chrome-100 transition-colors hover:border-pink-200"
            >
              Sign in to post
            </Link>
          )}
          <Link
            href="/rookery/about"
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            About the Rookery &rarr;
          </Link>
          <Link
            href="/rookery/tiers"
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            Tiers &rarr;
          </Link>
          <Link
            href="/journal"
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            From the studio &rarr;
          </Link>
        </div>

        <section className="mt-14">
          {error && (
            <p className="mb-4 text-sm text-pink-300">{error}</p>
          )}
          {threads === null ? (
            <ThreadListSkeleton />
          ) : threads.length === 0 ? (
            <EmptyRookery />
          ) : (
            <ul className="divide-y divide-warm-black-800 border-t border-warm-black-800">
              {threads.map((t) => (
                <ThreadRow key={t.id} thread={t} />
              ))}
            </ul>
          )}
        </section>
      </article>
    </>
  );
}

function ThreadRow({ thread }: { thread: Thread }) {
  const preview =
    thread.body.length > 200
      ? thread.body.slice(0, 200).trimEnd() + "…"
      : thread.body;
  return (
    <li className="py-7">
      <div className="chrome-label mb-2 flex flex-wrap items-center gap-3 text-chrome-500">
        <span className="text-pink-200">
          {thread.authorName || "anon"}
        </span>
        <span>&middot;</span>
        <span>{formatRelative(thread.createdAt)}</span>
      </div>
      <Link
        href={`/rookery/${thread.id}`}
        className="group block"
        prefetch={true}
      >
        <h2 className="text-2xl text-chrome-100 group-hover:text-pink-200">
          {thread.title}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-chrome-300">
          {preview}
        </p>
      </Link>
    </li>
  );
}

function ThreadListSkeleton() {
  return (
    <ul className="divide-y divide-warm-black-800 border-t border-warm-black-800">
      {[0, 1, 2].map((i) => (
        <li key={i} className="py-7">
          <div className="h-3 w-32 animate-pulse rounded-sm bg-warm-black-800" />
          <div className="mt-3 h-6 w-3/4 animate-pulse rounded-sm bg-warm-black-800" />
          <div className="mt-2 h-3 w-full animate-pulse rounded-sm bg-warm-black-800" />
        </li>
      ))}
    </ul>
  );
}

function EmptyRookery() {
  return (
    <div className="rounded-sm border border-dashed border-warm-black-700 bg-warm-black-900/40 p-12 text-center">
      <div className="chrome-label">No threads yet</div>
      <h2 className="mt-3 text-2xl text-chrome-100">
        Nobody is on the perch.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm text-chrome-300">
        The Rookery is empty. The first thread is yours if you want
        it &mdash; sign in, name it, say something true.
      </p>
    </div>
  );
}
