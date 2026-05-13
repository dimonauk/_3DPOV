"use client";

import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { useState } from "react";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithGoogle,
} from "lib/firebase/client";

const STORAGE_KEY = "holoflow:signin-email";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "google" }
  | { kind: "error"; message: string };

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onGoogle = async () => {
    if (!isFirebaseConfigured()) {
      setStatus({
        kind: "error",
        message: "Auth isn't configured. Email contact@holoflow.co.uk.",
      });
      return;
    }
    setStatus({ kind: "google" });
    try {
      const result = await signInWithGoogle();
      if (!result) {
        setStatus({ kind: "error", message: "Auth unavailable." });
        return;
      }
      // onAuthStateChanged in AuthProvider will fire; redirect to the
      // Rookery (the signed-in landing route; whitelisted past the
      // /coming-soon launch gate so the navbar's auth slot is visible).
      window.location.replace("/rookery");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed.";
      console.error("[SignIn] signInWithGoogle failed:", err);
      setStatus({ kind: "error", message });
    }
  };

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
          Two doors.
        </h1>
        <p className="text-sm leading-relaxed text-chrome-300">
          Use Google if you have it. Use a magic link if you don&rsquo;t,
          or if you don&rsquo;t feel like handing Google another tab.
          Either gets you in. No passwords on this site &mdash; never
          have been, never will be.
        </p>

        <button
          type="button"
          onClick={onGoogle}
          disabled={
            status.kind === "submitting" || status.kind === "google"
          }
          className="flex w-full items-center justify-center gap-3 rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-chrome-100 transition-colors hover:border-pink-200 hover:bg-warm-black-900 disabled:opacity-60"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          {status.kind === "google" ? "Talking to Google…" : "Continue with Google"}
        </button>

        <div className="flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-warm-black-800" />
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-chrome-500">
            or
          </span>
          <div className="h-px flex-1 bg-warm-black-800" />
        </div>

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
              disabled={
                status.kind === "submitting" || status.kind === "google"
              }
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
