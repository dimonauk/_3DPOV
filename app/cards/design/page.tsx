"use client";

// Opt out of static prerendering: useSearchParams() / useAuth() /
// signInWithGoogle() all require runtime so static generation is
// pointless here.
export const dynamic = "force-dynamic";
// PPR (experimental.ppr) generates a static shell for every page,
// which collides with useSearchParams() / location.hash readers.
export const experimental_ppr = false;

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
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "lib/ar/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "components/auth/auth-provider";
import {
  saveCardClient,
  getCardClient,
  CardError,
  type CardErrorCode,
} from "lib/cards/firestore-client";
import { signInWithGoogle } from "lib/firebase/client";
import CardScanner, { type ExtractedCardFields } from "components/cards/CardScanner";
import TemplatePicker, { type CardTemplate } from "components/cards/TemplatePicker";

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
  return (
    <Suspense fallback={<DesignerLoading />}>
      <CardDesignerInner />
    </Suspense>
  );
}

function DesignerLoading() {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-20 text-chrome-400">
      <p className="mx-auto max-w-3xl text-sm">Loading designer…</p>
    </main>
  );
}

function CardDesignerInner() {
  const [card, setCard] = useState<Card>(STARTER);
  const [slugDirty, setSlugDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{
    code: CardErrorCode;
    message: string;
  } | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingExisting, setEditingExisting] = useState(false);

  // If ?slug=existing-card is set, fetch that card from Firestore and
  // pre-populate the form. Slug becomes read-only when editing existing.
  useEffect(() => {
    const slugParam = searchParams.get("slug");
    if (!slugParam) return;
    let cancelled = false;
    (async () => {
      try {
        const doc = await getCardClient(slugParam);
        if (cancelled) return;
        if (doc) {
          setCard(doc.card);
          setSlugDirty(true); // prevent slug auto-derivation from clobbering
          setEditingExisting(true);
        }
      } catch (err) {
        console.warn("Failed to load card for editing:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Save handler: signs in via Google if not authed, then writes to Firestore.
  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      // Auto-prompt Google sign-in when not authed. The popup blocks
      // until the user picks an account or cancels; on cancel, throw.
      if (!auth.user) {
        const cred = await signInWithGoogle();
        if (!cred) {
          throw new CardError(
            "firebase-not-configured",
            "Auth isn't configured on this deployment. Use the share URL instead.",
          );
        }
      }
      const saved = await saveCardClient(card);
      setSavedSlug(saved.slug);
      // Push to the public landing in a fresh window so the designer
      // stays open for further edits.
      window.open("/c/" + saved.slug, "_blank", "noopener");
    } catch (err) {
      if (err instanceof CardError) {
        setSaveError({ code: err.code, message: err.message });
      } else {
        const message =
          err instanceof Error ? err.message : "Couldn't save.";
        setSaveError({ code: "unknown", message });
      }
    } finally {
      setSaving(false);
    }
  };

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

  /**
   * AI scanner result handler — merges extracted fields into the card.
   * Skips empty values so manual entries already in the form are not
   * blown away.
   */
  const applyExtracted = (fields: ExtractedCardFields) => {
    setCard((c) => {
      const next: Card = {
        ...c,
        name: fields.name?.trim() || c.name,
        role: fields.role?.trim() || c.role,
        studio: fields.studio?.trim() || c.studio,
        tagline: fields.tagline?.trim() || c.tagline,
        contact: {
          ...c.contact,
          email: fields.email?.trim() || c.contact.email,
          phone: fields.phone?.trim() || c.contact.phone,
          website: fields.website?.trim() || c.contact.website,
          handles:
            fields.handles && fields.handles.length > 0
              ? fields.handles.map((h) => ({
                  platform: h.platform,
                  handle: h.handle,
                  url: h.url,
                }))
              : c.contact.handles,
        },
      };
      if (next.name && (c.slug === "you" || c.slug === slugify(c.name) || !c.slug)) {
        next.slug = slugify(next.name) || c.slug;
      }
      return next;
    });
  };

  /**
   * Apply a template: sets brand palette + starter role / tagline.
   * Does NOT touch the user-typed identity (name, contact) so picking
   * a template mid-edit only restyles, never erases.
   */
  const applyTemplate = (t: CardTemplate) => {
    setCard((c) => ({
      ...c,
      role: c.role && c.role !== "What you do" ? c.role : t.starter.role,
      tagline: c.tagline || t.starter.tagline,
      brand: {
        ...c.brand,
        primary: t.palette.primary,
        secondary: t.palette.secondary,
        accent: t.palette.accent,
        textOnBrand: t.palette.textOnBrand,
        font: t.palette.font,
      },
    }));
  };

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
            <TemplatePicker onPick={applyTemplate} />
            <CardScanner
              onExtracted={applyExtracted}
              accent={card.brand.primary || "#ff6fb5"}
            />
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
                    disabled={editingExisting}
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

            <Fieldset legend="AR model (.glb)">
              <ModelUploadField
                currentUrl={card.ar.model}
                currentUsdzUrl={card.ar.modelUSDZ ?? ""}
                isPlaceholder={card.ar.model === "/cards/dimona/model.glb"}
                authReady={auth.configured}
                user={auth.user}
                onUploaded={(url) =>
                  setCard((c) => ({
                    ...c,
                    ar: { ...c.ar, model: url, modelUSDZ: "" },
                  }))
                }
                onUsdzUploaded={(url) =>
                  setCard((c) => ({
                    ...c,
                    ar: { ...c.ar, modelUSDZ: url },
                  }))
                }
                onReset={() =>
                  setCard((c) => ({
                    ...c,
                    ar: {
                      ...c.ar,
                      model: "/cards/dimona/model.glb",
                      modelUSDZ: "/cards/dimona/model.usdz",
                    },
                  }))
                }
              />
            </Fieldset>

            {/* ─── Save (permanent, requires Google sign-in) ──────── */}
            <div className="rounded-sm border border-pink-200/30 bg-warm-black-900/40 p-5">
              <div className="flex items-center justify-between">
                <div className="chrome-label text-pink-200">
                  Save permanently
                </div>
                {auth.user ? (
                  <span className="text-xs text-chrome-400">
                    Signed in as {auth.user.displayName ?? auth.user.email}
                  </span>
                ) : (
                  <span className="text-xs text-chrome-500">
                    Google sign-in required
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-chrome-300">
                Claim a permanent vanity URL at{" "}
                <code className="text-pink-200">
                  holoflow.co.uk/c/{card.slug || "you"}
                </code>
                . Saved cards live in your account; you can edit or delete
                them any time. Image-tracking AR (with a printed card) is
                still studio-hosted only.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !auth.configured}
                  className="rounded-full border border-pink-200/60 bg-pink-200/30 px-5 py-2 chrome-label text-pink-50 transition-colors hover:border-pink-200 hover:bg-pink-200/40 disabled:opacity-50"
                >
                  {saving
                    ? "Saving…"
                    : auth.user
                      ? "Save my card"
                      : "Sign in with Google + save"}
                </button>
                {auth.user && (
                  <Link
                    href="/cards/mine"
                    className="rounded-full border border-chrome-400/30 px-5 py-2 chrome-label text-chrome-200 transition-colors hover:border-chrome-300 hover:text-chrome-100"
                  >
                    My cards &rarr;
                  </Link>
                )}
              </div>
              {savedSlug && !saveError && (
                <p className="mt-3 rounded-sm border border-pink-200/40 bg-pink-200/10 px-3 py-2 text-xs text-pink-100">
                  Saved. Live at{" "}
                  <Link
                    href={`/c/${savedSlug}`}
                    target="_blank"
                    className="underline underline-offset-4"
                  >
                    /c/{savedSlug}
                  </Link>
                  .
                </p>
              )}
              {saveError && (
                <p className="mt-3 rounded-sm border border-red-300/40 bg-red-300/10 px-3 py-2 text-xs text-red-100">
                  {saveError.message}
                </p>
              )}
              {!auth.configured && (
                <p className="mt-3 text-xs text-chrome-500">
                  Auth isn&rsquo;t configured on this deployment. The share-URL
                  flow above still works without an account.
                </p>
              )}
            </div>

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

/* ─── ModelUploadField ───────────────────────────────────────────────── */

function ModelUploadField({
  currentUrl,
  currentUsdzUrl,
  isPlaceholder,
  authReady,
  user,
  onUploaded,
  onUsdzUploaded,
  onReset,
}: {
  currentUrl: string;
  currentUsdzUrl: string;
  isPlaceholder: boolean;
  authReady: boolean;
  user: ReturnType<typeof useAuth>["user"];
  onUploaded: (url: string) => void;
  onUsdzUploaded: (url: string) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const handlePick = () => fileInputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so picking the same file again re-fires onChange

    setUploadError(null);
    setUploading(true);

    try {
      // Need auth — if not signed in, prompt for Google sign-in inline.
      let signedIn = user;
      if (!signedIn) {
        const cred = await signInWithGoogle();
        if (!cred) {
          throw new Error(
            "Sign-in was cancelled. You need a Google account to upload GLB files.",
          );
        }
        signedIn = cred.user;
      }

      // Get a fresh ID token (don't cache; they expire after 1 hour).
      const idToken = await signedIn.getIdToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", file.name);

      const res = await fetch("/api/cards/upload-glb", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? `Upload failed (${res.status})`);
      }
      onUploaded(data.url);
      // Clear any stale USDZ URL - the new GLB invalidates it.
      onUsdzUploaded("");
      // Release the upload spinner so the user sees the GLB result
      // immediately; USDZ conversion runs in the background as a
      // best-effort second step.
      setUploading(false);
      void convertAndUploadUsdz(data.url, signedIn, file.name);
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const convertAndUploadUsdz = async (
    glbUrl: string,
    signedInUser: NonNullable<ReturnType<typeof useAuth>["user"]>,
    originalFilename: string,
  ) => {
    setConvertError(null);
    setConverting(true);
    try {
      // Lazy-load three.js + USDZExporter — they're heavy and we only
      // want them in the bundle when the user actually uploads.
      const { convertGlbUrlToUsdz } = await import("lib/cards/glb-to-usdz");
      const usdzBlob = await convertGlbUrlToUsdz(glbUrl);

      const idToken = await signedInUser.getIdToken();
      const usdzName = originalFilename.replace(/\.(glb|gltf)$/i, "") + ".usdz";

      const fd = new FormData();
      fd.append("file", usdzBlob, usdzName);
      fd.append("filename", usdzName);

      const res = await fetch("/api/cards/upload-usdz", {
        method: "POST",
        headers: { Authorization: "Bearer " + idToken },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "USDZ upload failed (" + res.status + ")");
      }
      onUsdzUploaded(data.url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't generate iOS USDZ.";
      setConvertError(message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.12em] text-chrome-400">
        Your 3D model
      </span>

      {isPlaceholder ? (
        <p className="text-xs text-chrome-500">
          Using the studio placeholder (a small pink octahedron). Upload a{" "}
          <code className="text-pink-200">.glb</code> below to swap it in.
        </p>
      ) : (
        <div className="flex flex-col gap-1 rounded-sm border border-pink-200/30 bg-pink-200/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-pink-100">✓ Custom model uploaded</span>
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-chrome-400 underline-offset-4 hover:text-pink-200 hover:underline"
            >
              Reset to placeholder
            </button>
          </div>
          <code className="break-all text-[0.65rem] text-chrome-400">
            {currentUrl}
          </code>
          {converting ? (
            <p className="text-xs text-pink-100/80">
              Converting to USDZ for iOS Quick Look…
            </p>
          ) : convertError ? (
            <p className="text-xs text-amber-200/90">
              {convertError} (iOS will fall back to the brand colour fallback)
            </p>
          ) : currentUsdzUrl ? (
            <p className="text-xs text-pink-100">
              ✓ iOS USDZ ready
            </p>
          ) : null}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,model/gltf-binary"
        onChange={handleChange}
        disabled={!authReady || uploading}
        className="hidden"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePick}
          disabled={!authReady || uploading}
          className="rounded-full border border-pink-200/60 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:opacity-50"
        >
          {uploading
            ? "Uploading…"
            : isPlaceholder
              ? user
                ? "Upload .glb"
                : "Sign in + upload .glb"
              : "Replace .glb"}
        </button>
        <span className="self-center text-xs text-chrome-500">
          Max 10 MB &middot; glTF 2.0 binary only &middot; iOS Quick Look needs{" "}
          <code className="text-pink-200">.usdz</code> (studio tier)
        </span>
      </div>

      {!authReady && (
        <p className="text-xs text-chrome-500">
          Auth isn&rsquo;t configured on this deployment, so uploads are
          unavailable. The share-URL flow below still works without uploads.
        </p>
      )}

      {uploadError && (
        <p className="rounded-sm border border-red-300/40 bg-red-300/10 px-3 py-2 text-xs text-red-100">
          {uploadError}
        </p>
      )}
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
