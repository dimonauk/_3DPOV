"use client";

import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { useState } from "react";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
} from "lib/firebase/client";

const STORAGE_KEY = "holoflow:signin-email";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setStatus({ kind: "error", message: "Please enter a valid email." });
      return;
    }

    if (!isFirebaseConfigured()) {
      setStatus({
        kind: "error",
        message: "Auth isn't configured. Email contact@holoflow.co.uk.",
      });
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus({ kind: "error", message: "Auth unavailable." });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const url = `${window.location.origin}/signin/callback`;
      await sendSignInLinkToEmail(auth, trimmed, {
        url,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(STORAGE_KEY, trimmed);
      setStatus({ kind: "sent" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed.";
      console.error("[SignIn] sendSignInLinkToEmail failed:", err);
      setStatus({ kind: "error", message });
    }
  };

  // Visiting this page from a magic-link email → bounce to /signin/callback
  if (
    typeof window !== "undefined" &&
    isFirebaseConfigured() &&
    isSignInWithEmailLink(getFirebaseAuth()!, window.location.href)
  ) {
    window.location.replace(`/signin/callback${window.location.search}`);
  }

  return (
    <main className="fixed inset-0 z-[150] flex min-h-screen flex-col items-center justify-center bg-warm-black-950 px-6 text-warm-black-50">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-chrome-400">
          Holo-Flow Studio &middot; Sign in
        </span>
        <h1
          className="font-display text-4xl leading-[1.05] md:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Magic link.
        </h1>
        <p className="text-sm leading-relaxed text-chrome-300">
          Enter your email and we&rsquo;ll send a one-tap sign-in link. No
          password to remember.
        </p>

        {status.kind === "sent" ? (
          <div className="flex w-full flex-col items-center gap-2 rounded-md border border-mint-300/40 bg-warm-black-900/60 px-5 py-5 text-center">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-mint-300">
              Link sent
            </span>
            <p className="text-xs leading-relaxed text-chrome-200">
              Check your inbox. Open the link from this same browser to
              complete sign-in. Spam folder if you don&rsquo;t see it in a
              minute.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="flex w-full flex-col gap-3"
          >
            <input
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              placeholder="you@somewhere.co.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status.kind === "submitting"}
              className="rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-4 py-3 font-mono text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status.kind === "submitting"}
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-60"
            >
              {status.kind === "submitting" ? "Sending…" : "Send magic link"}
            </button>
            {status.kind === "error" && (
              <p className="text-xs text-pink-300">{status.message}</p>
            )}
          </form>
        )}

        <a
          href="/coming-soon"
          className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-chrome-500 hover:text-pink-200"
        >
          ← Back to the studio
        </a>
      </div>
    </main>
  );
}
