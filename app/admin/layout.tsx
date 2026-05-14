"use client";

/**
 * app/admin/layout.tsx — Operator-only gate for `/admin/*`.
 *
 * Renders children only when Firebase is configured, a user is signed
 * in, AND the user's email matches the hardcoded allow-list. Anyone
 * else gets a polite "not authorised" notice and a sign-out link. No
 * marketing chrome — this is the operator console, not the shop.
 *
 * Future cleanup: move the allow-list to `ADMIN_EMAILS` env (comma-
 * separated) once a second operator joins. Hardcoded for now because
 * the studio is one person.
 */

import { signOut } from "firebase/auth";
import { useState, type ReactNode } from "react";
import { useAuth } from "components/auth/auth-provider";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  signInWithGoogle,
} from "lib/firebase/client";

/** Operator allow-list. Compare lowercased. */
const ADMIN_EMAILS = new Set<string>(["dimonauk@gmail.com"]);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        {children}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <Frame>
      <span className="chrome-label text-chrome-400">Operator console</span>
      <p className="text-xs leading-relaxed text-chrome-300">Resolving auth state…</p>
      <div
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border border-chrome-500 border-t-pink-200"
      />
    </Frame>
  );
}

function NotConfiguredState() {
  return (
    <Frame>
      <span className="chrome-label text-chrome-400">Operator console</span>
      <h1 className="text-lg uppercase tracking-[0.18em] text-chrome-100">
        Firebase not configured
      </h1>
      <p className="text-xs leading-relaxed text-chrome-300">
        Set the <code className="text-pink-200">NEXT_PUBLIC_FIREBASE_*</code> env
        vars in <code className="text-pink-200">.env.local</code> (or in Vercel
        Project Settings) before opening this route.
      </p>
      <a
        href="/"
        className="chrome-label text-chrome-500 hover:text-pink-200"
      >
        ← Back to the studio
      </a>
    </Frame>
  );
}

function SignInState({
  onSignIn,
  status,
  errorMessage,
}: {
  onSignIn: () => void;
  status: "idle" | "signing-in" | "error";
  errorMessage?: string;
}) {
  return (
    <Frame>
      <span className="chrome-label text-chrome-400">Operator console</span>
      <h1 className="text-lg uppercase tracking-[0.18em] text-chrome-100">
        Operator only — sign in to continue
      </h1>
      <p className="text-xs leading-relaxed text-chrome-300">
        This is the back-of-house route. Public visitors don&rsquo;t need to be
        here.
      </p>
      <button
        type="button"
        onClick={onSignIn}
        disabled={status === "signing-in"}
        className="flex w-full items-center justify-center gap-3 rounded-sm border border-chrome-400/40 bg-warm-black-900/80 px-5 py-3 text-xs uppercase tracking-[0.2em] text-chrome-100 transition-colors hover:border-pink-200 hover:bg-warm-black-900 disabled:opacity-60"
      >
        {status === "signing-in" ? "Talking to Google…" : "Sign in with Google"}
      </button>
      {status === "error" && errorMessage ? (
        <p className="text-xs text-pink-300">{errorMessage}</p>
      ) : null}
      <a
        href="/"
        className="chrome-label text-chrome-500 hover:text-pink-200"
      >
        ← Back to the studio
      </a>
    </Frame>
  );
}

function NotAuthorisedState({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  return (
    <Frame>
      <span className="chrome-label text-chrome-400">Operator console</span>
      <h1 className="text-lg uppercase tracking-[0.18em] text-chrome-100">
        Not authorised
      </h1>
      <p className="text-xs leading-relaxed text-chrome-300">
        Signed in as <span className="text-pink-200">{email}</span>. This account
        is not on the operator allow-list.
      </p>
      <button
        type="button"
        onClick={onSignOut}
        className="chrome-label text-chrome-500 hover:text-pink-200"
      >
        Sign out
      </button>
      <a
        href="/"
        className="chrome-label text-chrome-500 hover:text-pink-200"
      >
        ← Back to the studio
      </a>
    </Frame>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const [signInStatus, setSignInStatus] = useState<"idle" | "signing-in" | "error">("idle");
  const [signInError, setSignInError] = useState<string | undefined>(undefined);

  if (!configured || !isFirebaseConfigured()) {
    return <NotConfiguredState />;
  }
  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    const onSignIn = async () => {
      setSignInStatus("signing-in");
      setSignInError(undefined);
      try {
        const result = await signInWithGoogle();
        if (!result) {
          setSignInStatus("error");
          setSignInError("Auth unavailable.");
          return;
        }
        // onAuthStateChanged in AuthProvider will fire and re-render.
        setSignInStatus("idle");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Google sign-in failed.";
        setSignInStatus("error");
        setSignInError(message);
      }
    };
    return (
      <SignInState
        onSignIn={onSignIn}
        status={signInStatus}
        errorMessage={signInError}
      />
    );
  }

  if (!isAdminEmail(user.email)) {
    const onSignOut = async () => {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    };
    return (
      <NotAuthorisedState
        email={user.email ?? "(no email)"}
        onSignOut={onSignOut}
      />
    );
  }

  return <>{children}</>;
}
