"use client";

import Footer from "components/layout/footer";
import { useAuth } from "components/auth/auth-provider";
import {
  createReply,
  formatRelative,
  getThreadById,
  listReplies,
} from "lib/rookery/client";
import type { Reply, Thread } from "lib/rookery/types";
import { REPLY_BODY_MAX } from "lib/rookery/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const threadId = params?.id ?? "";
  const { user, loading: authLoading } = useAuth();

  const [thread, setThread] = useState<Thread | null | "loading">(
    "loading",
  );
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) return;
    let active = true;
    Promise.all([getThreadById(threadId), listReplies(threadId)])
      .then(([t, r]) => {
        if (!active) return;
        setThread(t);
        setReplies(r);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Couldn't load thread.";
        if (active) {
          setError(message);
          setThread(null);
        }
      });
    return () => {
      active = false;
    };
  }, [threadId]);

  const onReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || posting || !replyBody.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await createReply(threadId, replyBody, user);
      setReplyBody("");
      const fresh = await listReplies(threadId);
      setReplies(fresh);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Couldn't reply.";
      setError(message);
    } finally {
      setPosting(false);
    }
  };

  if (thread === "loading") {
    return (
      <>
        <article className="mx-auto max-w-2xl px-6 py-20 md:py-28">
          <Link
            href="/rookery"
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            &larr; The Rookery
          </Link>
          <div className="mt-12 h-3 w-32 animate-pulse rounded-sm bg-warm-black-800" />
          <div className="mt-4 h-8 w-3/4 animate-pulse rounded-sm bg-warm-black-800" />
          <div className="mt-6 h-3 w-full animate-pulse rounded-sm bg-warm-black-800" />
        </article>
        <Footer />
      </>
    );
  }

  if (!thread) {
    return (
      <>
        <article className="mx-auto max-w-2xl px-6 py-20 md:py-28">
          <Link
            href="/rookery"
            className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            &larr; The Rookery
          </Link>
          <h1 className="mt-12 text-4xl text-chrome-100">
            Nothing on this perch.
          </h1>
          <p className="mt-4 text-chrome-300">
            The thread you&rsquo;re looking for has either flown or was
            never written.
          </p>
        </article>
        <Footer />
      </>
    );
  }

  return (
    <>
      <article className="mx-auto max-w-2xl px-6 py-20 md:py-28">
        <Link
          href="/rookery"
          className="chrome-label text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
        >
          &larr; The Rookery
        </Link>

        <div className="mt-10 chrome-label flex flex-wrap items-center gap-3 text-chrome-500">
          <span className="text-pink-200">
            {thread.authorName || "anon"}
          </span>
          <span>&middot;</span>
          <span>{formatRelative(thread.createdAt)}</span>
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl leading-[1.1] text-chrome-100">
          {thread.title}
        </h1>
        <div className="mt-6 prose-gallery whitespace-pre-wrap text-chrome-200">
          {thread.body}
        </div>

        <section className="mt-16 border-t border-warm-black-800 pt-10">
          <div className="chrome-label mb-5 text-pink-200">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </div>
          {replies.length === 0 ? (
            <p className="text-sm text-chrome-400">
              Nobody has answered yet.
            </p>
          ) : (
            <ul className="space-y-8">
              {replies.map((r) => (
                <li
                  key={r.id}
                  className="border-l-2 border-warm-black-800 pl-5"
                >
                  <div className="chrome-label flex flex-wrap items-center gap-3 text-chrome-500">
                    <span className="text-pink-200">
                      {r.authorName || "anon"}
                    </span>
                    <span>&middot;</span>
                    <span>{formatRelative(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-chrome-200">
                    {r.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-6">
          {authLoading ? (
            <p className="chrome-label text-chrome-500">
              Checking your perch&hellip;
            </p>
          ) : user ? (
            <form onSubmit={onReply} className="flex flex-col gap-4">
              <label htmlFor="reply-body" className="chrome-label">
                Add to the thread
              </label>
              <textarea
                id="reply-body"
                rows={4}
                maxLength={REPLY_BODY_MAX}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Say what you mean."
                className="w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2.5 text-sm leading-relaxed text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
              />
              {error && (
                <p className="text-xs text-pink-300">{error}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] uppercase tracking-[0.18em] text-chrome-500">
                  {replyBody.length} / {REPLY_BODY_MAX}
                </span>
                <button
                  type="submit"
                  disabled={posting || !replyBody.trim()}
                  className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-2 chrome-label text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-60"
                >
                  {posting ? "Posting…" : "Reply"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm text-chrome-300">
                Sign in to add to this thread.
              </p>
              <div className="mt-4">
                <Link
                  href="/signin"
                  className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 chrome-label text-pink-200 transition-colors hover:bg-pink-200/20"
                >
                  Sign in &rarr;
                </Link>
              </div>
            </div>
          )}
        </section>
      </article>
      <Footer />
    </>
  );
}
