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
 *
 * Orchestrator only. State + Firestore IO live in
 * card-designer/use-card-state.ts; form primitives in
 * ui-primitives.tsx; model uploader in model-upload.tsx; preview
 * tile in preview.tsx; constants + encoder in constants.ts +
 * encode.ts. Per ARCHITECTURE.md Rule 1.
 */

import Link from "next/link";
import { Suspense } from "react";

import CardScanner from "components/cards/CardScanner";
import TemplatePicker from "components/cards/TemplatePicker";

import { FONT_OPTIONS } from "./card-designer/constants";
import { ModelUploadField } from "./card-designer/model-upload";
import { CardPreview } from "./card-designer/preview";
import { Field, Fieldset, ColorPair, HandlesField } from "./card-designer/ui-primitives";
import { useCardDesignerState } from "./card-designer/use-card-state";

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
  const {
    card,
    setCard,
    auth,
    editingExisting,
    previewUrl,
    copied,
    saving,
    saveError,
    savedSlug,
    update,
    updateBrand,
    updateContact,
    markSlugDirty,
    applyExtracted,
    applyTemplate,
    handleSave,
    handleCopy,
    downloadJSON,
  } = useCardDesignerState();

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
                  onChange={(e) => markSlugDirty(e.target.value)}
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
                    updateBrand(
                      "font",
                      e.target.value as typeof card.brand.font,
                    )
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
