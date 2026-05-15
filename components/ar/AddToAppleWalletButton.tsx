"use client";

/**
 * AddToAppleWalletButton — iOS-only "Add to Apple Wallet" button.
 *
 * Only renders on iOS / macOS Safari where the .pkpass mime type
 * actually triggers Wallet (Android/desktop-Chrome treat it as a
 * generic download which isn't useful).
 *
 * On click, the browser is sent to /api/cards/[slug]/wallet/apple
 * with `Accept: application/vnd.apple.pkpass`. The server returns
 * the signed pass binary, which iOS picks up and offers to add to
 * Wallet.
 *
 * The endpoint returns 503 if Apple env vars aren't configured. In
 * that case the button itself doesn't render — we probe the endpoint
 * with a HEAD request on mount and only show the button if it's 200
 * or 405 (HEAD not allowed). 503 hides the button gracefully.
 */

import { useEffect, useState } from "react";

type Props = {
  slug: string;
  primary?: string;
};

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

export default function AddToAppleWalletButton({
  slug,
  primary = "#000000",
}: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Only check on iOS/macOS Safari. Other platforms can't add the
    // pass to Wallet anyway, so no point probing the endpoint.
    if (!isIosOrMacSafari()) {
      setAvailable(false);
      return;
    }
    // Quick HEAD probe. The pass endpoint returns 503 when the
    // Apple certs aren't configured; in that case, hide the button.
    fetch(`/api/cards/${encodeURIComponent(slug)}/wallet/apple`, {
      method: "HEAD",
    })
      .then((res) => {
        if (res.status === 503) {
          setAvailable(false);
        } else {
          // Anything else (200, 405 Method Not Allowed for HEAD, etc.)
          // we treat as "endpoint exists, button is safe to show".
          setAvailable(true);
        }
      })
      .catch(() => {
        setAvailable(false);
      });
  }, [slug]);

  if (available !== true) return null;

  return (
    <a
      href={`/api/cards/${encodeURIComponent(slug)}/wallet/apple`}
      className="atw-btn"
      // Don't fight Safari — let the native pass picker take over.
    >
      <svg
        viewBox="0 0 32 32"
        width="18"
        height="18"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M22.4 16.7c0-3.1 2.6-4.6 2.7-4.7-1.5-2.2-3.8-2.5-4.6-2.5-2-.2-3.8 1.1-4.8 1.1-1 0-2.5-1.1-4.1-1.1-2.1 0-4 1.2-5.1 3.1-2.2 3.8-.6 9.3 1.6 12.4 1.1 1.5 2.3 3.1 4 3 1.6-.1 2.2-1 4.1-1s2.5 1 4.1.9c1.7 0 2.8-1.5 3.9-3 .8-1 1.6-2.4 2.2-3.9-2.2-.9-4-3.1-4-6.3zm-3.2-11.6c.9-1 1.4-2.4 1.3-3.8-1.2.1-2.7.8-3.6 1.8-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.7-.7 3.6-1.7z" />
      </svg>
      <span>Add to Apple Wallet</span>
      <style jsx>{`
        .atw-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: black;
          color: white;
          padding: 0.65rem 1.2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease;
        }
        .atw-btn:active {
          transform: scale(0.97);
        }
      `}</style>
    </a>
  );
}
