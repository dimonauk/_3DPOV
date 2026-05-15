"use client";

/**
 * LeadCaptureForm — small inline form on the card landing letting
 * visitors send their details back to the card owner.
 *
 * Behaviour:
 *   - Collapsed by default (single "Leave your details" button).
 *   - Expanded: name (optional), email (required), message (optional).
 *   - On submit: POST to /api/cards/[slug]/leads. Reads `?src=` from
 *     the URL so the lead is tagged with its print-run / campaign.
 *   - On 200: thanks-message + collapse. On error: inline error.
 *   - Also fires a 'lead_capture' analytics event via the global
 *     window.__holoflow_track exposed by CardEventTracker.
 *
 * Visual:
 *   Styled to match the card's brand palette via CSS-vars passed in
 *   from the parent landing page. Sits low on the card detail panel,
 *   below the social links — the visitor reads the page, sees value,
 *   THEN gets asked for their details.
 */

import { useState } from "react";

type LeadCaptureFormProps = {
  slug: string;
  ownerName?: string;
  primary?: string;
  textOnBrand?: string;
};

type FormState = "collapsed" | "open" | "submitting" | "done" | "error";

export default function LeadCaptureForm({
  slug,
  ownerName,
  primary = "#FF6FB5",
  textOnBrand = "#FFFFFF",
}: LeadCaptureFormProps) {
  const [state, setState] = useState<FormState>("collapsed");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    setError(null);
    setState("submitting");
    try {
      const params = new URLSearchParams(window.location.search);
      const src =
        params.get("src") || params.get("utm_source") || undefined;

      const res = await fetch(`/api/cards/${encodeURIComponent(slug)}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          message: message.trim() || undefined,
          src,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        const msg =
          body.error === "invalid_email"
            ? "That email doesn't look right — give it another go?"
            : body.error === "missing_email"
              ? "Email is required."
              : body.error === "rate_limited"
                ? "Too many submissions from this connection — try again in a minute."
                : "Couldn't send right now. Try again shortly.";
        setError(msg);
        setState("error");
        return;
      }

      window.__holoflow_track?.(slug, "lead_capture");
      setState("done");
    } catch {
      setError("Network problem. Try again shortly.");
      setState("error");
    }
  };

  if (state === "collapsed") {
    return (
      <div className="lc-root">
        <button
          className="lc-cta"
          onClick={() => setState("open")}
          aria-label="Leave your details"
        >
          📬 Leave your details for {ownerName ?? "the owner"}
        </button>
        <style jsx>{`
          .lc-root {
            margin-top: 1rem;
            display: flex;
            justify-content: center;
          }
          .lc-cta {
            background: ${primary};
            color: ${textOnBrand};
            border: none;
            padding: 0.85rem 1.5rem;
            border-radius: 999px;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            box-shadow: 0 4px 18px ${primary}55;
            transition: transform 0.1s ease;
          }
          .lc-cta:active {
            transform: scale(0.97);
          }
        `}</style>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="lc-root">
        <div className="lc-done">
          Thanks — your details are on their way to{" "}
          {ownerName ?? "the card owner"}.
        </div>
        <style jsx>{`
          .lc-root {
            margin-top: 1rem;
            text-align: center;
          }
          .lc-done {
            padding: 1rem 1.25rem;
            border-radius: 0.75rem;
            background: ${primary}22;
            color: inherit;
            font-size: 0.95rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="lc-root">
      <div className="lc-card">
        <div className="lc-title">
          Leave your details for {ownerName ?? "the owner"}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="lc-input"
          autoComplete="name"
          disabled={state === "submitting"}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="lc-input"
          autoComplete="email"
          required
          disabled={state === "submitting"}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything you'd like to say? (optional)"
          rows={3}
          className="lc-input lc-textarea"
          disabled={state === "submitting"}
        />
        {error && <div className="lc-error">{error}</div>}
        <div className="lc-actions">
          <button
            className="lc-cancel"
            onClick={() => setState("collapsed")}
            disabled={state === "submitting"}
            type="button"
          >
            Cancel
          </button>
          <button
            className="lc-submit"
            onClick={submit}
            disabled={state === "submitting" || !email.trim()}
            type="button"
          >
            {state === "submitting" ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
      <style jsx>{`
        .lc-root {
          margin-top: 1rem;
        }
        .lc-card {
          padding: 1.25rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .lc-title {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 0.4rem;
        }
        .lc-input {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border-radius: 0.5rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: inherit;
          font-size: 0.95rem;
        }
        .lc-input:focus {
          outline: 2px solid ${primary};
          outline-offset: 1px;
        }
        .lc-textarea {
          resize: vertical;
          min-height: 4rem;
          font-family: inherit;
        }
        .lc-error {
          color: #ff8585;
          font-size: 0.85rem;
        }
        .lc-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          margin-top: 0.3rem;
        }
        .lc-cancel {
          background: transparent;
          color: inherit;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.55rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          cursor: pointer;
          opacity: 0.7;
        }
        .lc-submit {
          background: ${primary};
          color: ${textOnBrand};
          border: none;
          padding: 0.55rem 1.2rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .lc-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
