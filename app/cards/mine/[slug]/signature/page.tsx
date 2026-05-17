"use client";

/**
 * /cards/mine/[slug]/signature — email signature generator.
 *
 * Outputs three formats:
 *   1. HTML signature with inline styles (works in Gmail, Outlook,
 *      Apple Mail, Spark, Superhuman, etc.)
 *   2. Plain text signature (for clients that strip HTML)
 *   3. Live HTML preview rendered inline
 *
 * Includes:
 *   - Name + role + studio
 *   - Email + phone + website
 *   - Brand-coloured horizontal rule
 *   - Link to the AR card with a small "Open in AR" call-to-action
 *   - Optional QR code image (base64 from the existing branded SVG)
 *
 * Email clients strip <style> tags, so every CSS rule is inline.
 * Tables for layout because Outlook treats flex/grid as decoration.
 *
 * Auth: owner-only, via Firebase ID token (same pattern as other
 * /cards/mine pages).
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "components/auth/auth-provider";
import type { Card } from "lib/ar/types";

export default function CardSignaturePage() {
  const auth = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [origin, setOrigin] = useState("https://holoflow.co.uk");
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeQr, setIncludeQr] = useState(true);
  const [variant, setVariant] = useState<"compact" | "full">("compact");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace("/signin");
      return;
    }
    (async () => {
      // We piggyback on the public card endpoint — the signature renders
      // exactly what's already shown on the public landing, so no
      // auth-restricted data is involved.
      try {
        const res = await fetch(`/api/cards/${slug}`, { cache: "no-store" });
        if (!res.ok) {
          // fall back to fetching the JSON file directly
          const fallback = await fetch(`/data/cards/${slug}.json`, {
            cache: "no-store",
          });
          if (fallback.ok) {
            setCard(((await fallback.json()) as Card) ?? null);
          } else {
            setError("Couldn't load the card.");
          }
          return;
        }
        const body = (await res.json()) as { card: Card };
        setCard(body.card);
      } catch {
        setError("Couldn't load the card.");
      }
    })();
  }, [auth.loading, auth.user, slug, router]);

  const flashToast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1800);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => flashToast(`${label} copied`));
  };

  // Some email clients prefer the user "copy" the rendered HTML rather
  // than a code snippet — they want the visual block on their clipboard.
  const copyRenderedHtml = () => {
    const node = document.getElementById("sig-preview");
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("copy");
      sel.removeAllRanges();
      flashToast("Rendered signature copied — paste into your mail client");
    }
  };

  if (auth.loading || (!card && !error)) {
    return <main className="sig-root">Loading…</main>;
  }
  if (error || !card) {
    return (
      <main className="sig-root">
        <p>{error ?? "Card not found."}</p>
        <Link href="/cards/mine">← Back to your cards</Link>
      </main>
    );
  }

  const url = `${origin}/c/${slug}`;
  const qrUrl = `${origin}/cards/${slug}/qr.svg`;
  const primary = card.brand.primary;
  const secondary = card.brand.secondary;
  const textOnBrand = card.brand.textOnBrand;

  const html =
    variant === "compact"
      ? buildCompactHtml(card, url, qrUrl, includeQr)
      : buildFullHtml(card, url, qrUrl, includeQr);

  const plainText = buildPlainText(card, url);

  return (
    <main className="sig-root">
      <header className="sig-head">
        <div>
          <div className="sig-crumb">
            <Link href="/cards/mine">← Your cards</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/analytics`}>Analytics</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/leads`}>Leads</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/settings`}>Settings</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/embed`}>Embed</Link>
          </div>
          <h1>{slug} — email signature</h1>
          <p className="sig-sub">
            Inline-styled signature for Gmail, Outlook, Apple Mail, Spark,
            Superhuman, and everywhere else.
          </p>
        </div>
      </header>

      <section className="sig-section">
        <h2>Options</h2>
        <div className="sig-controls">
          <label className="sig-field">
            Variant
            <select
              value={variant}
              onChange={(e) =>
                setVariant(e.target.value as "compact" | "full")
              }
              className="sig-input"
            >
              <option value="compact">Compact (3 lines + QR)</option>
              <option value="full">Full (logo, contact, tagline)</option>
            </select>
          </label>
          <label className="sig-field sig-check">
            <input
              type="checkbox"
              checked={includeQr}
              onChange={(e) => setIncludeQr(e.target.checked)}
            />
            Include branded QR
          </label>
        </div>
      </section>

      <section className="sig-section">
        <h2>Live preview</h2>
        <div
          id="sig-preview"
          className="sig-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <button onClick={copyRenderedHtml} className="sig-btn-primary">
          📋 Copy rendered signature
        </button>
        <p className="sig-help">
          For Gmail: Settings → See all settings → Signature → paste here.
          For Outlook: File → Options → Mail → Signatures.
          For Apple Mail: Preferences → Signatures.
        </p>
      </section>

      <section className="sig-section">
        <h2>HTML source</h2>
        <pre className="sig-code">{html}</pre>
        <button onClick={() => copy(html, "HTML")} className="sig-btn">
          Copy HTML source
        </button>
      </section>

      <section className="sig-section">
        <h2>Plain text fallback</h2>
        <pre className="sig-code">{plainText}</pre>
        <button onClick={() => copy(plainText, "Plain text")} className="sig-btn">
          Copy plain text
        </button>
      </section>

      {flash && <div className="sig-toast">{flash}</div>}

      <style jsx>{`
        .sig-root {
          max-width: 1100px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }
        .sig-head {
          margin-bottom: 2rem;
        }
        .sig-head h1 {
          margin: 0.25rem 0;
          font-size: 2rem;
        }
        .sig-crumb a {
          color: inherit;
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .sig-crumb a:hover {
          opacity: 1;
        }
        .sig-sub {
          opacity: 0.7;
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          max-width: 36rem;
        }
        .sig-section {
          margin-bottom: 2.5rem;
        }
        .sig-section h2 {
          font-size: 1.1rem;
          margin: 0 0 0.75rem;
        }
        .sig-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .sig-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          opacity: 0.85;
        }
        .sig-input {
          padding: 0.5rem 0.7rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0.4rem;
          color: inherit;
          font-size: 0.9rem;
        }
        .sig-check {
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
        }
        .sig-preview {
          background: #ffffff;
          color: #111;
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }
        .sig-code {
          background: rgba(0, 0, 0, 0.5);
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
          font-size: 0.8rem;
          overflow-x: auto;
          white-space: pre-wrap;
          line-height: 1.45;
          max-height: 320px;
          color: #e0e0f0;
        }
        .sig-btn,
        .sig-btn-primary {
          margin-top: 0.75rem;
          padding: 0.6rem 1.1rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          opacity: 0.85;
        }
        .sig-btn:hover,
        .sig-btn-primary:hover {
          opacity: 1;
        }
        .sig-btn-primary {
          background: ${primary};
          color: ${textOnBrand};
          border-color: ${primary};
          opacity: 1;
        }
        .sig-help {
          margin-top: 0.75rem;
          opacity: 0.65;
          font-size: 0.85rem;
        }
        .sig-toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 0.7rem 1.3rem;
          border-radius: 999px;
          font-size: 0.85rem;
          z-index: 99;
        }
      `}</style>
    </main>
  );
}

// ---------------------------------------------------------------------
// HTML generators
//
// Every CSS property is inline because email clients strip <style> tags.
// Tables for layout because Outlook is the lowest-common-denominator and
// only respects table-based layout reliably.
// ---------------------------------------------------------------------

function buildCompactHtml(
  card: Card,
  url: string,
  qrUrl: string,
  includeQr: boolean,
): string {
  const primary = card.brand.primary;
  const secondary = card.brand.secondary;
  const contact = card.contact;
  const contactRow = [
    contact.email
      ? `<a href="mailto:${escapeHtml(contact.email)}" style="color:${primary};text-decoration:none">${escapeHtml(contact.email)}</a>`
      : "",
    contact.phone
      ? `<a href="tel:${escapeHtml(contact.phone.replace(/\s/g, ""))}" style="color:${primary};text-decoration:none">${escapeHtml(contact.phone)}</a>`
      : "",
    contact.website
      ? `<a href="${escapeHtml(ensureHttps(contact.website))}" style="color:${primary};text-decoration:none">${escapeHtml(stripProto(contact.website))}</a>`
      : "",
  ]
    .filter(Boolean)
    .join(' &nbsp;·&nbsp; ');

  const qrCell = includeQr
    ? `<td style="vertical-align:top;padding-left:16px;width:80px"><a href="${escapeHtml(url)}" style="text-decoration:none"><img src="${escapeHtml(qrUrl)}" alt="Scan to open AR card" width="80" height="80" style="display:block;border-radius:8px"></a></td>`
    : "";

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.45;color:#222"><tr><td style="vertical-align:top"><div style="font-weight:700;font-size:15px;color:#111">${escapeHtml(card.name)}</div><div style="color:#555;font-size:13px;margin-bottom:8px">${escapeHtml(card.role)}${card.studio ? ` · ${escapeHtml(card.studio)}` : ""}</div><div style="height:2px;width:60px;background:linear-gradient(90deg,${primary},${secondary});border-radius:1px;margin-bottom:8px"></div><div style="font-size:13px;color:#444">${contactRow}</div><div style="margin-top:8px"><a href="${escapeHtml(url)}" style="display:inline-block;color:${primary};font-weight:600;text-decoration:none;font-size:13px">📱 Open in AR →</a></div></td>${qrCell}</tr></table>`;
}

function buildFullHtml(
  card: Card,
  url: string,
  qrUrl: string,
  includeQr: boolean,
): string {
  const primary = card.brand.primary;
  const secondary = card.brand.secondary;
  const c = card.contact;
  const items: string[] = [];
  if (c.email)
    items.push(
      `<tr><td style="padding:1px 0;color:#666;font-size:12px;width:30px">✉</td><td style="padding:1px 0;font-size:13px;color:#444"><a href="mailto:${escapeHtml(c.email)}" style="color:${primary};text-decoration:none">${escapeHtml(c.email)}</a></td></tr>`,
    );
  if (c.phone)
    items.push(
      `<tr><td style="padding:1px 0;color:#666;font-size:12px">☎</td><td style="padding:1px 0;font-size:13px;color:#444"><a href="tel:${escapeHtml(c.phone.replace(/\s/g, ""))}" style="color:${primary};text-decoration:none">${escapeHtml(c.phone)}</a></td></tr>`,
    );
  if (c.website)
    items.push(
      `<tr><td style="padding:1px 0;color:#666;font-size:12px">🌐</td><td style="padding:1px 0;font-size:13px;color:#444"><a href="${escapeHtml(ensureHttps(c.website))}" style="color:${primary};text-decoration:none">${escapeHtml(stripProto(c.website))}</a></td></tr>`,
    );
  if (c.handles) {
    for (const h of c.handles) {
      const url = h.url ?? "";
      const text = h.handle;
      const platform = h.platform[0]?.toUpperCase() ?? "•";
      items.push(
        `<tr><td style="padding:1px 0;color:#666;font-size:12px">${escapeHtml(platform)}</td><td style="padding:1px 0;font-size:13px;color:#444">${url ? `<a href="${escapeHtml(url)}" style="color:${primary};text-decoration:none">${escapeHtml(text)}</a>` : escapeHtml(text)}</td></tr>`,
      );
    }
  }

  const qrCell = includeQr
    ? `<td style="vertical-align:top;padding-left:20px"><a href="${escapeHtml(url)}" style="text-decoration:none"><img src="${escapeHtml(qrUrl)}" alt="Scan to open AR card" width="100" height="100" style="display:block;border-radius:10px"></a><div style="text-align:center;font-size:10px;color:#888;margin-top:4px">Scan or tap →</div></td>`
    : "";

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><tr><td style="vertical-align:top"><div style="font-weight:700;font-size:18px;color:#111">${escapeHtml(card.name)}</div><div style="color:#555;font-size:13px;margin-top:2px;margin-bottom:10px">${escapeHtml(card.role)}${card.studio ? ` · ${escapeHtml(card.studio)}` : ""}</div><div style="height:2px;width:80px;background:linear-gradient(90deg,${primary},${secondary});border-radius:1px;margin-bottom:10px"></div>${card.tagline ? `<div style="font-style:italic;font-size:13px;color:#666;margin-bottom:10px;max-width:340px">${escapeHtml(card.tagline)}</div>` : ""}<table cellpadding="0" cellspacing="0" border="0">${items.join("")}</table><div style="margin-top:12px"><a href="${escapeHtml(url)}" style="display:inline-block;background:${primary};color:#fff;font-weight:600;padding:6px 14px;border-radius:999px;text-decoration:none;font-size:13px">📱 Open my AR card</a></div></td>${qrCell}</tr></table>`;
}

function buildPlainText(card: Card, url: string): string {
  const c = card.contact;
  const lines: string[] = [];
  lines.push(card.name);
  lines.push(card.role + (card.studio ? ` · ${card.studio}` : ""));
  if (card.tagline) lines.push(card.tagline);
  lines.push("");
  if (c.email) lines.push(`E: ${c.email}`);
  if (c.phone) lines.push(`T: ${c.phone}`);
  if (c.website) lines.push(`W: ${c.website}`);
  if (c.handles) {
    for (const h of c.handles) lines.push(`${h.platform}: ${h.handle}`);
  }
  lines.push("");
  lines.push(`AR card: ${url}`);
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureHttps(s: string): string {
  if (!s) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return "https://" + s;
}

function stripProto(s: string): string {
  return s.replace(/^https?:\/\//i, "");
}
