"use client";

/**
 * ShareCardButtons — opt-in viral loop for a card landing.
 *
 *   • Native share         Web Share API on supported devices
 *   • Save contact         Triggers existing vCard download
 *   • LinkedIn             Opens the owner's LinkedIn profile (if listed)
 *   • WhatsApp             Pre-fills a message with the card URL
 *   • Email                Pre-fills a mail with subject + body
 *   • Copy link            Clipboard fallback
 *
 * Designed to sit below the lead capture form — by then the visitor
 * has seen the card, decided they're interested, and is ready to
 * either pass it along or save the contact.
 */

import { useEffect, useState } from "react";
import type { Card } from "lib/ar/types";

type Props = { card: Card; slug: string };

function findHandle(card: Card, platform: string): string | undefined {
  return card.contact.handles?.find(
    (h) => h.platform.toLowerCase() === platform,
  )?.url;
}

export default function ShareCardButtons({ card, slug }: Props) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    // Web Share API requires a secure context (https, or localhost
    // which the platform treats as secure). Without the protocol
    // check the button rendered on http dev origins and the tap
    // silently no-op'd — confusing during QA. `127.0.0.1` is also
    // a secure context per the spec.
    const secure =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    setCanNativeShare(
      secure && typeof navigator !== "undefined" && !!navigator.share,
    );
  }, []);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${slug}`
      : `https://holoflow.co.uk/c/${slug}`;

  const subject = `${card.name} — ${card.role}`;
  const shareText = `${card.name} — ${card.role}${
    card.tagline ? `. ${card.tagline}` : ""
  } ${url}`;

  const fire = (type: string) => {
    try {
      (
        window as { __holoflow_track?: (s: string, t: string) => void }
      ).__holoflow_track?.(slug, type as never);
    } catch {
      // ignore
    }
  };

  const flashToast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1800);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: subject, text: shareText, url });
      fire("ar_launch"); // closest existing event type; "share" not in schema yet
    } catch {
      // user cancelled, swallow
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(url).then(() => flashToast("Link copied"));
  };

  const linkedinHandle = findHandle(card, "linkedin");

  const primary = card.brand.primary;
  const textOnBrand = card.brand.textOnBrand;

  return (
    <div className="scb-root">
      <div className="scb-grid">
        {canNativeShare && (
          <button onClick={nativeShare} className="scb-btn scb-btn-primary">
            <span aria-hidden>📤</span> Share
          </button>
        )}
        <a
          href={`/api/cards/${slug}/vcard`}
          className="scb-btn"
          onClick={() => fire("vcard_download")}
          download
        >
          <span aria-hidden>📇</span> Save contact
        </a>
        {linkedinHandle && (
          <a
            href={linkedinHandle}
            target="_blank"
            rel="noopener noreferrer"
            className="scb-btn"
          >
            <span aria-hidden>💼</span> LinkedIn
          </a>
        )}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="scb-btn"
        >
          <span aria-hidden>💬</span> WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent(
            subject,
          )}&body=${encodeURIComponent(shareText)}`}
          className="scb-btn"
        >
          <span aria-hidden>✉️</span> Email
        </a>
        <button onClick={copyLink} className="scb-btn">
          <span aria-hidden>🔗</span> Copy link
        </button>
      </div>
      {flash && <div className="scb-toast">{flash}</div>}
      <style jsx>{`
        .scb-root {
          margin-top: 1rem;
        }
        .scb-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }
        .scb-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
          opacity: 0.85;
        }
        .scb-btn:hover {
          opacity: 1;
        }
        .scb-btn-primary {
          background: ${primary};
          color: ${textOnBrand};
          border-color: ${primary};
          opacity: 1;
        }
        .scb-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.8rem;
          z-index: 99;
        }
      `}</style>
    </div>
  );
}
