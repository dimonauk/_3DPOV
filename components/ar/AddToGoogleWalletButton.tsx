"use client";

/**
 * AddToGoogleWalletButton — "Save to Google Wallet" button.
 *
 * Renders on Android and desktop browsers (iOS/macOS Safari get the
 * Apple Wallet button instead). On click the button hits the
 * /api/cards/[slug]/wallet/google endpoint to fetch the signed
 * save URL, then opens it. Android deep-links directly to the Wallet
 * app; desktop opens a "save to phone" Wallet landing.
 *
 * The endpoint returns 503 if Google env vars aren't configured. In
 * that case the button itself doesn't render — we HEAD-probe the
 * endpoint on mount and hide the button on 503. 200 means the
 * endpoint is wired up and the button is safe to show.
 *
 * Renders next to AddToAppleWalletButton on the card landing —
 * together they cover every wallet platform.
 */

import { useEffect, useState } from "react";

type Props = {
  slug: string;
  primary?: string;
};

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function isIosOrMacSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const isMacSafari =
    ua.includes("Macintosh") &&
    ua.includes("Safari") &&
    !ua.includes("Chrome");
  return isIos || isMacSafari;
}

export default function AddToGoogleWalletButton({ slug, primary }: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Apple Wallet covers iOS/Safari; show Google Wallet everywhere else.
    if (isIosOrMacSafari() && !isAndroid()) {
      // Still allow if Android-on-iOS-like UA (rare but possible) —
      // we only skip if iOS/Safari and definitely NOT Android.
      setAvailable(false);
      return;
    }
    fetch(`/api/cards/${encodeURIComponent(slug)}/wallet/google`, {
      method: "HEAD",
    })
      .then((res) => {
        if (res.status === 503) {
          setAvailable(false);
        } else {
          // HEAD might return 405 — that still confirms the route exists.
          setAvailable(true);
        }
      })
      .catch(() => setAvailable(false));
  }, [slug]);

  const handle = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cards/${encodeURIComponent(slug)}/wallet/google`,
      );
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const body = (await res.json()) as { saveUrl?: string };
      if (body.saveUrl) {
        window.location.href = body.saveUrl;
      }
    } catch {
      setLoading(false);
    }
  };

  if (available !== true) return null;

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="gw-btn"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill="currentColor"
      >
        {/* Google Wallet glyph — simplified geometric badge */}
        <path d="M19.5 6h-15A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h15A1.5 1.5 0 0 0 21 16.5v-9A1.5 1.5 0 0 0 19.5 6Zm0 3.5H4.5V7.5h15v2Zm-15 2h15v5h-15v-5Zm9 1.5h3v1.5h-3V13Z" />
      </svg>
      <span>{loading ? "Opening Wallet…" : "Add to Google Wallet"}</span>
      <style jsx>{`
        .gw-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #1a73e8;
          color: white;
          padding: 0.65rem 1.2rem;
          border: 0;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          font-family: inherit;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(26, 115, 232, 0.3);
          transition: transform 0.1s ease, opacity 0.15s ease;
        }
        .gw-btn:active {
          transform: scale(0.97);
        }
        .gw-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }
      `}</style>
    </button>
  );
}
