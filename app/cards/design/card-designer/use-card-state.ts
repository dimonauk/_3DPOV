"use client";

/**
 * app/cards/design/card-designer/use-card-state.ts — Owns the full
 * card-designer state machine: card draft + slug derivation +
 * save-to-Firestore + share-URL fragment + scanner/template merges
 * + JSON download.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1. The page
 * component reads `card` and binds every input to one of the
 * `update*` helpers; the buttons fire the action handlers.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { ExtractedCardFields } from "components/cards/CardScanner";
import type { CardTemplate } from "components/cards/TemplatePicker";
import { useAuth } from "components/auth/auth-provider";
import type { Card } from "lib/ar/types";
import {
  CardError,
  type CardErrorCode,
  getCardClient,
  saveCardClient,
} from "lib/cards/firestore-client";
import { signInWithGoogle } from "lib/firebase/client";

import { STARTER } from "./constants";
import { encodeFragment, slugify } from "./encode";

export type SaveError = { code: CardErrorCode; message: string };

export function useCardDesignerState() {
  const [card, setCard] = useState<Card>(STARTER);
  const [slugDirty, setSlugDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);

  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // If ?slug=existing-card is set, fetch that card from Firestore and
  // pre-populate the form. Slug becomes read-only as soon as we
  // detect the param — NOT after the fetch succeeds. If we waited
  // for the fetch (Firestore timeout, transient error), the visitor
  // could change the slug and save → a NEW card would be created at
  // the new slug, orphaning the original. Locking on param presence
  // makes the edit operation an atomic update against the URL's slug
  // regardless of fetch outcome.
  useEffect(() => {
    const slugParam = searchParams.get("slug");
    if (!slugParam) return;
    setEditingExisting(true);
    setSlugDirty(true); // prevent slug auto-derivation from clobbering
    // Pin the slug in the form state immediately so a save dispatched
    // before the fetch returns writes to the correct doc.
    setCard((c) => ({ ...c, slug: slugParam }));
    let cancelled = false;
    (async () => {
      try {
        const doc = await getCardClient(slugParam);
        if (cancelled) return;
        if (doc) {
          setCard(doc.card);
        }
      } catch (err) {
        console.warn("Failed to load card for editing:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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

  const markSlugDirty = (raw: string) => {
    setSlugDirty(true);
    update("slug", slugify(raw) || "you");
  };

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
      if (
        next.name &&
        (c.slug === "you" || c.slug === slugify(c.name) || !c.slug)
      ) {
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
        const message = err instanceof Error ? err.message : "Couldn't save.";
        setSaveError({ code: "unknown", message });
      }
    } finally {
      setSaving(false);
    }
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

  return {
    // state
    card,
    setCard,
    auth,
    router,
    editingExisting,
    previewUrl,
    copied,
    saving,
    saveError,
    savedSlug,
    // setters
    update,
    updateBrand,
    updateContact,
    markSlugDirty,
    // actions
    applyExtracted,
    applyTemplate,
    handleSave,
    handleCopy,
    downloadJSON,
  };
}
