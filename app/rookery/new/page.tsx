"use client";

import Footer from "components/layout/footer";
import { useAuth } from "components/auth/auth-provider";
import {
  createThread,
} from "lib/rookery/client";
import {
  THREAD_BODY_MAX,
  THREAD_TITLE_MAX,
} from "lib/rookery/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function NewThreadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    try {
      const id = await createThread({ title, body }, user);
      router.push(`/rookery/${id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Couldn't post.";
      setStatus({ kind: "error", message });
    }
  };

  return (
    <>
      <article className="mx-auto max-w-2xl px-6 py-20 md:py-28">
        <Link
          href="/rookery"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; The Rookery
        </Link>
        <h1 className="mt-8 text-4xl md:text-5xl leading-[1.05]">
          A new thread.
        </h1>
        <p className="mt-4 max-w-md text-chrome-300">
          One title, one body. Keep it specific. The Rookery is not a
          press release surface.
        </p>

        {loading ? (
          <p className="mt-10 chrome-label text-chrome-500">
            Checking your perch&hellip;
          </p>
        ) : !user ? (
          <div className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/60 p-6">
            <div className="chrome-label">Signed-out</div>
            <h2 className="mt-2 text-xl text-chrome-100">
              The perch needs a name on it.
            </h2>
            <p className="mt-3 text-sm text-chrome-300">
              Sign in to post. Magic link or Google, your call &mdash;
              no passwords on this site.
            </p>
            <div className="mt-5">
              <Link
                href="/signin"
                className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 chrome-label text-pink-200 transition-colors hover:bg-pink-200/20"
              >
                Sign in &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
            <div>
              <label
                htmlFor="thread-title"
                className="chrome-label mb-2 block"
              >
                Title
              </label>
              <input
                id="thread-title"
                type="text"
                required
                maxLength={THREAD_TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is this about?"
                className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="thread-body"
                className="chrome-label mb-2 block"
              >
                Body
              </label>
              <textarea
                id="thread-body"
                required
                rows={10}
                maxLength={THREAD_BODY_MAX}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Say what you mean."
                className="w-full rounded-sm border border-warm-black-700 bg-warm-black-900 px-3 py-2.5 text-sm leading-relaxed text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
              />
              <p className="mt-1 text-right text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
                {body.length} / {THREAD_BODY_MAX}
              </p>
            </div>

            {status.kind === "error" && (
              <p className="text-xs text-pink-300">{status.message}</p>
            )}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status.kind === "submitting"}
                className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 chrome-label text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-60"
              >
                {status.kind === "submitting" ? "Posting…" : "Post thread"}
              </button>
              <Link
                href="/rookery"
                className="chrome-label text-chrome-400 hover:text-pink-200"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </article>
      <Footer />
    </>
  );
}
