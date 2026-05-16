"use client";

/**
 * CardScanner — drop-in scanner widget for the /cards/design editor.
 *
 *   • Tap "Scan a card" → opens iOS / Android native camera or file picker
 *   • Pick a photo of a paper business card, conference badge, or
 *     LinkedIn QR-share screenshot
 *   • Posts the image to /api/cards/scan
 *   • Returns extracted fields with a confidence indicator
 *   • Calls onExtracted(fields) so the parent editor can autofill
 *
 * The server endpoint requires sign-in and rate-limits to 10 scans
 * per hour per uid; this component shows the remaining count after
 * each scan so the user knows where they stand.
 *
 * When AI_GATEWAY_API_KEY isn't configured in production, the
 * endpoint returns 503 and the UI surfaces a "scanner unavailable"
 * fallback with a clear path to the manual entry form. The button
 * itself stays visible — clicking it produces the friendly message,
 * not silent failure.
 */

import { useEffect, useRef, useState } from "react";
import { useAuth } from "components/auth/auth-provider";

export type ExtractedCardFields = {
  name?: string;
  role?: string;
  studio?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  website?: string;
  handles?: Array<{ platform: string; handle: string; url?: string }>;
  confidence?: "high" | "medium" | "low";
  notes?: string;
};

type Props = {
  onExtracted: (fields: ExtractedCardFields) => void;
  /** Optional accent colour for the button (defaults to studio pink) */
  accent?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; preview: string }
  | { kind: "ok"; preview: string; fields: ExtractedCardFields; remaining: number }
  | { kind: "error"; message: string };

export default function CardScanner({ onExtracted, accent = "#ff6fb5" }: Props) {
  const auth = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Clean up object-URL previews to avoid leaking blob handles.
  useEffect(() => {
    return () => {
      if (status.kind === "uploading" || status.kind === "ok") {
        try {
          URL.revokeObjectURL(status.preview);
        } catch {
          // already revoked
        }
      }
    };
    // We don't want to revoke on every status change; only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trigger = () => {
    if (!auth.user) {
      setStatus({
        kind: "error",
        message: "Sign in to use the scanner.",
      });
      return;
    }
    fileRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (!auth.user) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatus({
        kind: "error",
        message: "Image is over 5 MB — try a smaller photo.",
      });
      return;
    }
    const preview = URL.createObjectURL(file);
    setStatus({ kind: "uploading", preview });

    try {
      const token = await auth.user.getIdToken();
      const form = new FormData();
      form.append("image", file);

      const res = await fetch("/api/cards/scan", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = (await res.json()) as {
        ok?: boolean;
        extracted?: ExtractedCardFields;
        remaining?: number;
        error?: string;
        message?: string;
      };

      if (!res.ok || !body.extracted) {
        const msg =
          body.message ??
          (body.error === "scanner_not_configured"
            ? "The AI scanner isn't enabled in this environment yet. Fill the card out manually below."
            : body.error === "rate_limited"
              ? "You've hit 10 scans this hour. Try again later or fill the card out manually."
              : body.error === "image_too_large"
                ? "Image is too large — keep it under 5 MB."
                : "Couldn't read the card. Try a clearer photo, or fill it out manually below.");
        setStatus({ kind: "error", message: msg });
        return;
      }

      setStatus({
        kind: "ok",
        preview,
        fields: body.extracted,
        remaining: body.remaining ?? 0,
      });
      // Push extracted fields up to the editor immediately.
      onExtracted(body.extracted);
    } catch (e) {
      setStatus({
        kind: "error",
        message: (e as Error).message ?? "Network error.",
      });
    }
  };

  const reset = () => setStatus({ kind: "idle" });

  return (
    <div className="cs-root">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="cs-file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      {status.kind === "idle" && (
        <button
          type="button"
          onClick={trigger}
          className="cs-btn"
          style={{ background: accent }}
        >
          <span aria-hidden>📷</span> Scan a paper card
          <span className="cs-sub">photo or screenshot · AI extracts the fields</span>
        </button>
      )}

      {status.kind === "uploading" && (
        <div className="cs-state">
          <img src={status.preview} alt="" className="cs-preview" />
          <div className="cs-msg">
            <strong>Reading the card…</strong>
            <p>Claude is parsing the fields — usually 3-6 seconds.</p>
          </div>
        </div>
      )}

      {status.kind === "ok" && (
        <div className="cs-state">
          <img src={status.preview} alt="" className="cs-preview" />
          <div className="cs-msg">
            <strong>
              {confidenceLabel(status.fields.confidence)}
            </strong>
            <ul className="cs-list">
              {status.fields.name && <li><b>Name:</b> {status.fields.name}</li>}
              {status.fields.role && <li><b>Role:</b> {status.fields.role}</li>}
              {status.fields.studio && <li><b>Studio:</b> {status.fields.studio}</li>}
              {status.fields.email && <li><b>Email:</b> {status.fields.email}</li>}
              {status.fields.phone && <li><b>Phone:</b> {status.fields.phone}</li>}
              {status.fields.website && <li><b>Web:</b> {status.fields.website}</li>}
              {status.fields.handles?.map((h, i) => (
                <li key={i}><b>{h.platform}:</b> {h.handle}</li>
              ))}
            </ul>
            {status.fields.notes && (
              <p className="cs-note">⚠ {status.fields.notes}</p>
            )}
            <p className="cs-remaining">
              Fields autofilled into the form below. {status.remaining} scan
              {status.remaining === 1 ? "" : "s"} remaining this hour.
            </p>
            <button type="button" onClick={reset} className="cs-btn-secondary">
              Scan another card
            </button>
          </div>
        </div>
      )}

      {status.kind === "error" && (
        <div className="cs-error">
          <strong>Scanner didn't read the card.</strong>
          <p>{status.message}</p>
          <button type="button" onClick={reset} className="cs-btn-secondary">
            Try again
          </button>
        </div>
      )}

      <style jsx>{`
        .cs-root {
          margin-bottom: 1.5rem;
        }
        .cs-file {
          display: none;
        }
        .cs-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          padding: 1rem 1.5rem;
          border-radius: 1rem;
          border: 0;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          box-shadow: 0 4px 20px rgba(255, 111, 181, 0.3);
          transition: transform 0.1s ease;
        }
        .cs-btn:active {
          transform: scale(0.98);
        }
        .cs-sub {
          font-weight: 400;
          font-size: 0.8rem;
          opacity: 0.85;
        }
        .cs-btn-secondary {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .cs-state {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .cs-preview {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 0.5rem;
          flex-shrink: 0;
        }
        .cs-msg {
          flex: 1;
          font-size: 0.9rem;
        }
        .cs-msg p {
          margin: 0.25rem 0;
          opacity: 0.85;
        }
        .cs-list {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0;
          font-size: 0.85rem;
        }
        .cs-list li {
          padding: 0.2rem 0;
          opacity: 0.95;
        }
        .cs-list b {
          opacity: 0.7;
          margin-right: 0.4rem;
        }
        .cs-note {
          background: rgba(255, 193, 7, 0.1);
          padding: 0.5rem;
          border-radius: 0.4rem;
          font-size: 0.8rem;
          margin: 0.5rem 0 !important;
        }
        .cs-remaining {
          font-size: 0.8rem;
          opacity: 0.65;
        }
        .cs-error {
          padding: 1rem;
          border-radius: 0.75rem;
          background: rgba(255, 82, 82, 0.08);
          border: 1px solid rgba(255, 82, 82, 0.3);
          font-size: 0.9rem;
        }
        .cs-error p {
          margin: 0.25rem 0;
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}

function confidenceLabel(c?: "high" | "medium" | "low"): string {
  if (c === "high") return "✓ Read confidently";
  if (c === "medium") return "✓ Read partially — check fields below";
  if (c === "low") return "⚠ Read with low confidence — verify everything";
  return "✓ Done";
}
