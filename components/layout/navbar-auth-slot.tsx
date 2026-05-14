"use client";

/**
 * components/layout/navbar-auth-slot.tsx — Auth slot for the navbar.
 *
 * Shows "Sign in" when signed out (or when Firebase is unconfigured in
 * dev), the user's display name (or email fragment) when signed in. The
 * signed-in pill links to /rookery.
 */

import Link from "next/link";

import { useAuth } from "components/auth/auth-provider";

export function AuthSlot() {
  const { user, loading, configured } = useAuth();

  if (!configured) {
    return (
      <Link
        href="/signin"
        className="chrome-label text-[0.7rem] text-chrome-300 transition-colors hover:text-pink-200"
      >
        Sign in
      </Link>
    );
  }

  if (loading) {
    return (
      <span className="chrome-label text-[0.7rem] text-chrome-500">…</span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className="chrome-label text-[0.7rem] text-chrome-300 transition-colors hover:text-pink-200"
      >
        Sign in
      </Link>
    );
  }

  const display =
    user.displayName ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Member";

  return (
    <Link
      href="/rookery"
      aria-label="Your Rookery account"
      className="chrome-label max-w-[10rem] truncate text-[0.7rem] text-pink-200 transition-colors hover:text-pink-100"
    >
      {display}
    </Link>
  );
}
