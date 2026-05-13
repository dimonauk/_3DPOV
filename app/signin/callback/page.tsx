"use client";

import {
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
} from "lib/firebase/client";

const STORAGE_KEY = "holoflow:signin-email";

type Status =
  | { kind: "verifying" }
  | { kind: "success"; email: string }
  | { kind: "needs-email" }
  | { kind: "error"; message: string };

export default function SignInCallbackPage() {
  const [status, setStatus] = useState<Status>({ kind: "verifying" });
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setStatus({
        kind: "error",
        message: "Auth isn't configured.",
      });
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setStatus({ kind: "error", message: "Auth unavailable." });
      return;
    }
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStatus({
        kind: "error",
        message:
          "This link isn't a sign-in link, or it's expired. Request a new one from /signin.",
      });
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setStatus({ kind: "needs-email" });
      return;
    }
    completeSignIn(stored);
  }, []);

  const completeSignIn = async (emailToUse: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setStatus({ kind: "verifying" });
    try {
      const result = await signInWithEmailLink(
        auth,
        emailToUse,
        window.location.href,
      );
      window.localStorage.removeItem(STORAGE_KEY);
      setStatus({
        kind: "success",
        email: result.user.email ?? emailToUse,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed.";
      console.error("[SignInCallback] signInWithEmailLink failed:", err);
      setStatus({ kind: "error", message });
    }
  };

  return (
    <main className="fixed inset-0 z-[150] flex min-h-screen flex-col items-center justify-center bg-warm-black-950 px-6 text-warm-black-50">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-chrome-400">
          Holo-Flow Studio &middot; Sign in
        </span>

        {status.kind === "verifying" && (
          <p className="font-display text-2xl text-chrome-200">
            Verifying…
          </p>
        )}

        {status.kind === "needs-email" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              completeSignIn(email.trim().toLowerCase());
            }}
            className="flex w-full flex-col gap-3"
          >
            <p className="text-sm leading-relaxed text-chrome-300">
              We need to confirm the email this link was sent to.
            </p>
            <input
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              placeholder="you@somewhere.co.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-4 py-3 font-mono text-sm text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20"
            >
              Continue
            </button>
          </form>
        )}

        {status.kind === "success" && (
          <div className="flex w-full flex-col items-center gap-3 rounded-md border border-mint-300/40 bg-warm-black-900/60 px-5 py-5">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-mint-300">
              Signed in
            </span>
            <p className="text-sm leading-relaxed text-chrome-200">
              Welcome, {status.email}.
            </p>
            <Link
              href="/rookery"
              className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-pink-200 hover:underline"
            >
              Continue to the Rookery →
            </Link>
          </div>
        )}

        {status.kind === "error" && (
          <div className="flex w-full flex-col items-center gap-3 rounded-md border border-pink-300/30 bg-warm-black-900/60 px-5 py-5">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-pink-300">
              Sign-in failed
            </span>
            <p className="text-sm leading-relaxed text-chrome-200">
              {status.message}
            </p>
            <Link
              href="/signin"
              className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-pink-200 hover:underline"
            >
              Try again →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
