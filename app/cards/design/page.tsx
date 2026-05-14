"use client";

/**
 * app/cards/design/page.tsx — In-browser AR card designer.
 *
 * Self-contained: fill the form, watch the live preview, hit Share to
 * encode the card into a URL fragment that anyone can open. No backend
 * storage, no account, no studio involvement required.
 *
 * The studio-hosted route at /c/<slug> is the upsell: it adds image
 * tracking, a custom 3D model, and a permanent vanity URL.
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "lib/ar/types";

// Sensible defaults so the page is never empty.
const STARTER: Card = {
  slug: "you",
  name: "Your Name",
  role: "What you do",
  studio: "",
  tagline: "",
  contact: {
    email: "",
    website: "",
    handles: [],
  },
  brand: {
    primary: "#FF6FB5",
    secondary: "#B488E0",
    accent: "#FFC1E3",
    font: "display",
    textOnBrand: "#FFFFFF",
  },
  ar: {
    targetImage: "/cards/dimona/card-front.png",
    targetMind: "/cards/dimona/target.mind",
    model: "/cards/dimona/model.glb",
    modelUSDZ: "/cards/dimona/model.usdz",
    modelScale: 0.6,
    modelRotation: [0, 0, 0],
    modelPosition: [0, 0.05, 0],
    description:
      "A placeholder 3D model. Commission the studio-hosted tier to swap in a model that's actually you.",
    autoRotate: true,
    lighting: {
      ambientIntensity: 1.0,
      directionalIntensity: 1.5,
      directionalAngle: 30,
    },
  },
  print: { width_mm: 85, height_mm: 55, bleed_mm: 3, safe_mm: 4 },
  issuedAt: new Date().toISOString(),
  public: false,
};

const FONT_OPTIONS: Array<{ value: Card["brand"]["font"]; label: string }> = [
  { value: "display", label: "Display (serif, Cormorant)" },
  { value: "serif", label: "Serif (system)" },
  { value: "mono", label: "Mono (JetBrains)" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

// URL-safe base64 (no +, /, =) so the fragment looks tidy.
function encodeFragment(card: Card): string {
  const json = JSON.stringify(card);
  const utf8 = new TextEncoder().encode(json);
  let bin = "";
  for (const b of utf8) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function CardDesignerPage() {
  const [card, setCard] = useState<Card>(STARTER);
  const [slugDirty, setSlugDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Auto-derive slug from name unless the user has typed in the slug field.
  useEffect(() => {
    if (!slugDirty) {
      setCard((c) => ({ ...c, slug: slugify(c.name) || "you" }));
    }
  }, [card.name, slugDirty]);

  // Build the share URL whenever the card changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const frag = encodeFragment(card);
    const origin = window.location.origin;
    setPreviewUrl(`${origin}/c/preview#data=${frag}`);
  }, [card]);

  // Convenience helpers for nested updates.
  const update = <K extends keyof Card>(key: K, val: Card[K]) =>
    setCard((c) => ({ ...c, [key]: val }));

  const updateBrand = <K extends keyof Card["brand"]>(
    key: K,
    val: Card["brand"][K],
  ) => setCard((c) => ({ ...c, brand: { ...c.brand, [key]: val } }));

  const updateContact = <K extends keyof Card["contact"]>(
    key: K,
    val: Card["contact"][K],
  ) => setCard((c) => ({ ...c, contact: { ...c.contact, [key]: val } }));

  const handleCopy = async () => {
    if (!previewUrl) return;
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = previewUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(card, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.slug || "card"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-warm-black-950 text-chrome-200">
      <section className="border-b border-warm-black-800">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-12 md:px-8 md:py-16">
          <div className="chrome-label">AR cards &middot; Designer</div>
          <h1 className="mt-3 max-w-3xl text-3xl md:text-5xl">
            Design your AR card.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-chrome-300">
            Fill in the form, watch the live preview to the right. When
            you&rsquo;re happy, copy the share URL &mdash; it works in any
            browser. Or commission the studio-hosted version for a permanent
            vanity URL, image tracking, and a real 3D model.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-(--breakpoint-2xl) px-4 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(380px,420px)]">
          {/* ─── Form ─────────────────────────────────────────────────── */}
          <form
            className="flex flex-col gap-10"
            onSubmit={(e) => e.preventDefault()}
          >
            <Fieldset legend="Identity">
              <Field label="Name" hint="As it appears on the card.">
                <input
                  type="text"
                  value={card.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Dimona Dougherty"
                  className="design-input"
                />
              </Field>
              <Field label="Role / title" hint="One line.">
                <input
                  type="text"
                  value={card.role}
                  onChange={(e) => update("role", e.target.value)}
                  placeholder="Flow artist, heritage documentor"
                  className="design-input"
                />
              </Field>
              <Field label="Studio / company" hint="Optional.">
                <input
                  type="text"
                  value={card.studio ?? ""}
                  onChange={(e) =>
                    update("studio", e.target.value || undefined)
                  }
                  placeholder="Holo-Flow Studio"
                  className="design-input"
                />
              </Field>
              <Field label="Tagline" hint="Optional. ~10 words.">
                <input
                  type="text"
                  value={card.tagline ?? ""}
                  onChange={(e) =>
                    update("tagline", e.target.value || undefined)
                  }
                  placeholder="Poi, light painting, waveguide sculpture"
                  className="design-input"
                />
              </Field>
              <Field
                label="URL slug"
                hint="Used in the share URL. Lowercase, hyphens only."
              >
                <input
                  type="text"
                  value={card.slug}
                  onChange={(e) => {
                    setSlugDirty(true);
                    update("slug", slugify(e.target.value) || "you");
                  }}
                  placeholder="you"
                  className="design-input font-mono"
                />
              </Field>
            </Fieldset>

            <Fieldset legend="Contact">
              <Field label="Email">
                <input
                  type="email"
                  value={card.contact.email ?? ""}
                  onChange={(e) => updateContact("email", e.target.value)}
                  placeholder="hello@example.com"
                  className="design-input"
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={card.contact.phone ?? ""}
                  onChange={(e) => updateContact("phone", e.target.value)}
                  placeholder="+44 7700 900123"
                  className="design-input"
                />
              </Field>
              <Field label="Website">
                <input
                  type="url"
                  value={card.contact.website ?? ""}
                  onChange={(e) => updateContact("website", e.target.value)}
                  placeholder="https://example.com"
                  className="design-input"
                />
              </Field>
              <HandlesField
                handles={card.contact.handles ?? []}
                onChange={(h) => updateContact("handles", h)}
              />
            </Fieldset>

            <Fieldset legend="Brand">
              <Field label="Primary colour">
                <ColorPair
                  value={card.brand.primary}
                  onChange={(v) => updateBrand("primary", v)}
                />
              </Field>
              <Field label="Secondary colour">
                <ColorPair
                  value={card.brand.secondary}
                  onChange={(v) => updateBrand("secondary", v)}
                />
              </Field>
              <Field label="Accent colour">
                <ColorPair
                  value={card.brand.accent}
                  onChange={(v) => updateBrand("accent", v)}
                />
              </Field>
              <Field label="Text on brand">
                <ColorPair
                  value={card.brand.textOnBrand}
                  onChange={(v) => updateBrand("textOnBrand", v)}
                />
              </Field>
              <Field label="Font">
                <select
                  value={card.brand.font}
                  onChange={(e) =>
                    updateBrand("font", e.target.value as Card["brand"]["font"])
                  }
                  className="design-input"
                >
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </Fieldset>

            {/* ─── Actions ──────────────────────────────────────────── */}
            <div className="rounded-sm border border-pink-200/30 bg-pink-200/[0.04] p-5">
              <div className="chrome-label text-pink-200">Share</div>
              <p className="mt-2 text-sm text-chrome-300">
                Your card lives in this URL. Copy it; paste it anywhere. The
                URL contains everything &mdash; no server lookup required.
              </p>
              <div className="mt-4 break-all rounded-sm border border-warm-black-700 bg-warm-black-950/80 p-3 font-mono text-[0.7rem] text-chrome-400">
                {previewUrl || "Generating…"}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!previewUrl}
                  className="rounded-full border border-pink-200/50 bg-pink-200/20 px-5 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/30 disabled:opacity-50"
                >
                  {copied ? "Copied!" : "Copy share URL"}
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-chrome-400/30 px-5 py-2 chrome-label text-chrome-200 transition-colors hover:border-chrome-300 hover:text-chrome-100"
                >
                  Open in new tab &rarr;
                </a>
                <button
                  type="button"
                  onClick={downloadJSON}
                  className="rounded-full border border-chrome-400/30 px-5 py-2 chrome-label text-chrome-200 transition-colors hover:border-chrome-300 hover:text-chrome-100"
                >
                  Download JSON
                </button>
              </div>
              <p className="mt-4 text-xs text-chrome-500">
                Want a permanent URL like{" "}
                <code className="text-pink-200">
                  holoflow.co.uk/c/{card.slug || "you"}
                </code>{" "}
                plus a real 3D model and image-tracked AR?{" "}
                <Link
                  href="/contact?intent=ar-card"
                  className="text-pink-200 underline underline-offset-4 hover:text-pink-100"
                >
                  Commission the studio-hosted tier &rarr;
                </Link>
              </p>
            </div>
          </form>

          {/* ─── Preview ─────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="chrome-label mb-3 text-chrome-400">
              Live preview
            </div>
            <CardPreview card={card} />
            <div className="mt-3 text-[0.7rem] text-chrome-500">
              The printed card front is currently a brand-coloured plate.
              Studio-hosted cards get a printed photograph or pattern of your
              choosing.
            </div>
          </aside>
        </div>
      </section>

      <style>{`
        .design-input {
          width: 100%;
          background: rgb(20 18 26);
          border: 1px solid rgb(45 42 55);
          color: rgb(220 218 230);
          padding: 0.6rem 0.8rem;
          font-size: 0.9rem;
          border-radius: 4px;
          transition: border-color 0.15s ease;
        }
        .design-input:focus {
          outline: none;
          border-color: rgb(255 111 181);
        }
      `}</style>
    </main>
  );
}

/* ─── Small UI primitives ───────────────────────────────────────────── */

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5 border-l-2 border-pink-200/30 pl-5">
      <legend className="chrome-label text-pink-200">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-[0.12em] text-chrome-400">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-chrome-500">{hint}</span>}
    </label>
  );
}

function ColorPair({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded border border-warm-black-700 bg-warm-black-900"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="design-input font-mono"
        placeholder="#FF6FB5"
      />
    </div>
  );
}

function HandlesField({
  handles,
  onChange,
}: {
  handles: Array<{ platform: string; handle: string; url?: string }>;
  onChange: (h: Array<{ platform: string; handle: string; url?: string }>) => void;
}) {
  const add = () =>
    onChange([...handles, { platform: "instagram", handle: "" }]);
  const remove = (i: number) =>
    onChange(handles.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<(typeof handles)[number]>) =>
    onChange(handles.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.12em] text-chrome-400">
        Social handles
      </span>
      {handles.length === 0 && (
        <p className="text-xs text-chrome-500">None added yet.</p>
      )}
      {handles.map((h, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={h.platform}
            onChange={(e) => update(i, { platform: e.target.value })}
            placeholder="instagram"
            className="design-input"
            style={{ flex: "0 0 6rem" }}
          />
          <input
            type="text"
            value={h.handle}
            onChange={(e) => update(i, { handle: e.target.value })}
            placeholder="@yourhandle"
            className="design-input"
            style={{ flex: "1 1 8rem" }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs text-chrome-500 underline-offset-4 hover:text-pink-200 hover:underline"
          >
            remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start text-xs text-pink-200 underline underline-offset-4 hover:text-pink-100"
      >
        + Add a handle
      </button>
    </div>
  );
}

/* ─── Live card preview ─────────────────────────────────────────────── */

function CardPreview({ card }: { card: Card }) {
  const { primary, secondary, accent, textOnBrand } = card.brand;
  return (
    <div
      className="overflow-hidden rounded-lg border border-warm-black-800 shadow-2xl"
      style={{ background: "#0a0a0a" }}
    >
      {/* Hero */}
      <div
        className="px-6 py-10 text-center"
        style={{
          background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          color: textOnBrand,
        }}
      >
        <div className="font-display text-2xl font-bold leading-tight">
          {card.name || "Your Name"}
        </div>
        <div
          className="mt-1 text-sm"
          style={{ color: textOnBrand, opacity: 0.92 }}
        >
          {card.role || "What you do"}
        </div>
        {card.studio && (
          <div
            className="mt-3 text-xs uppercase"
            style={{
              color: textOnBrand,
              letterSpacing: "0.25em",
              opacity: 0.9,
            }}
          >
            {card.studio}
          </div>
        )}
        {card.tagline && (
          <p
            className="mx-auto mt-3 max-w-xs text-xs leading-relaxed"
            style={{ color: textOnBrand, opacity: 0.92 }}
          >
            {card.tagline}
          </p>
        )}
      </div>

      {/* AR placeholder pane */}
      <div
        className="flex items-center justify-center"
        style={{
          aspectRatio: "16 / 11",
          background: `linear-gradient(135deg, ${primary}22, ${secondary}22)`,
          color: textOnBrand,
        }}
      >
        <div className="text-center">
          <div className="text-3xl">◆</div>
          <div
            className="mt-2 text-[0.65rem] uppercase"
            style={{ letterSpacing: "0.15em", opacity: 0.75 }}
          >
            3D preview slot
          </div>
        </div>
      </div>

      {/* Contact strip */}
      <div className="border-t border-warm-black-800 px-6 py-5">
        <div className="text-[0.65rem] uppercase tracking-[0.12em] text-chrome-500">
          Contact
        </div>
        <ul className="mt-2 space-y-1.5 text-xs">
          {card.contact.email && (
            <li>
              <span style={{ color: accent }}>{card.contact.email}</span>
            </li>
          )}
          {card.contact.phone && (
            <li>
              <span style={{ color: accent }}>{card.contact.phone}</span>
            </li>
          )}
          {card.contact.website && (
            <li>
              <span style={{ color: accent }}>{card.contact.website}</span>
            </li>
          )}
          {(card.contact.handles ?? [])
            .filter((h) => h.handle)
            .map((h, i) => (
              <li key={i}>
                <span style={{ color: accent }}>
                  {h.platform} {h.handle}
                </span>
              </li>
            ))}
          {!card.contact.email &&
            !card.contact.phone &&
            !card.contact.website &&
            !(card.contact.handles ?? []).some((h) => h.handle) && (
              <li className="text-chrome-500">No contact details yet.</li>
            )}
        </ul>
      </div>
    </div>
  );
}
