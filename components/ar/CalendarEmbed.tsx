"use client";

/**
 * CalendarEmbed — drops a Cal.com / Calendly / SavvyCal / TidyCal
 * booking iframe onto the card landing.
 *
 * Some providers (notably Calendly) block iframes from arbitrary
 * domains via X-Frame-Options/CSP. If the card.calendar.embed flag is
 * set to false, we render a button-style link instead of an iframe.
 *
 * Visual: brand-coloured frame around the iframe with a title bar
 * so the booking widget visually belongs to the card rather than
 * floating in.
 */

import { useState } from "react";
import type { CardCalendar, CardBrand } from "lib/ar/types";

type Props = {
  slug: string;
  calendar: CardCalendar;
  brand: CardBrand;
};

const BOOKING_PROVIDERS: Array<{ host: string; label: string }> = [
  { host: "cal.com", label: "Cal.com" },
  { host: "calendly.com", label: "Calendly" },
  { host: "savvycal.com", label: "SavvyCal" },
  { host: "tidycal.com", label: "TidyCal" },
  { host: "youcanbookme.com", label: "YouCanBookMe" },
  { host: "fantastical.app", label: "Fantastical" },
];

function detectProvider(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    for (const p of BOOKING_PROVIDERS) {
      if (host === p.host || host.endsWith(`.${p.host}`)) return p.label;
    }
    return host;
  } catch {
    return "your booking page";
  }
}

export default function CalendarEmbed({ slug, calendar, brand }: Props) {
  const [opened, setOpened] = useState(false);

  // Validate URL — must be https.
  let safeUrl = "";
  try {
    const u = new URL(calendar.url);
    if (u.protocol === "https:") safeUrl = u.toString();
  } catch {
    safeUrl = "";
  }
  if (!safeUrl) return null;

  const provider = detectProvider(safeUrl);
  const label = calendar.label ?? "Book a meeting";
  const embed = calendar.embed !== false; // default true

  const fire = () => {
    try {
      (
        window as { __holoflow_track?: (s: string, t: string) => void }
      ).__holoflow_track?.(slug, "ar_launch"); // closest existing type
    } catch {
      // ignore
    }
  };

  return (
    <section className="cal-root">
      <div className="cal-title">
        <span aria-hidden>📅</span> {label}{" "}
        <span className="cal-provider">via {provider}</span>
      </div>
      {embed ? (
        opened ? (
          <iframe
            src={safeUrl}
            title="Booking calendar"
            className="cal-frame"
            allow="payment; microphone; camera"
            loading="lazy"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <button
            type="button"
            className="cal-load"
            onClick={() => {
              setOpened(true);
              fire();
            }}
          >
            Load booking calendar →
          </button>
        )
      ) : (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cal-load"
          onClick={fire}
        >
          Open booking calendar ↗
        </a>
      )}
      <style jsx>{`
        .cal-root {
          margin-top: 2rem;
          padding: 1.25rem;
          border-radius: 1rem;
          border: 1px solid ${brand.primary}55;
          background: linear-gradient(
            135deg,
            ${brand.primary}11,
            ${brand.secondary}11
          );
        }
        .cal-title {
          font-weight: 700;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }
        .cal-provider {
          opacity: 0.55;
          font-weight: 400;
          font-size: 0.85rem;
          margin-left: 0.4rem;
        }
        .cal-frame {
          width: 100%;
          height: 720px;
          border: 0;
          border-radius: 0.75rem;
          background: white;
        }
        .cal-load {
          display: inline-block;
          padding: 0.75rem 1.4rem;
          border-radius: 999px;
          background: ${brand.primary};
          color: ${brand.textOnBrand};
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          cursor: pointer;
          border: none;
        }
        @media (max-width: 600px) {
          .cal-frame {
            height: 580px;
          }
        }
      `}</style>
    </section>
  );
}
