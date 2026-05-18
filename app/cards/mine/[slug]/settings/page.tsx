"use client";

/**
 * /cards/mine/[slug]/settings — owner-facing webhook configuration.
 *
 * Lets the card owner:
 *   - Set / clear a webhook URL (HTTPS only, no internal hosts)
 *   - View the generated HMAC secret (one-time reveal on change /
 *     rotation; otherwise just shows "configured")
 *   - Rotate the secret
 *   - Choose which event types to forward (default: lead_capture)
 *   - Fire a test event so they can see it land in Zapier / Make / etc.
 *   - See recent delivery log entries (success/failure/HTTP code)
 *
 * Auth via Firebase ID token, same pattern as analytics/leads pages.
 *
 * Orchestrator only. State + IO in settings/use-webhook.ts; payload
 * docs in payload-reference.tsx; styles in styles.ts; types +
 * ALL_EVENTS registry in types.ts. Per ARCHITECTURE.md Rule 1.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { use } from "react";

import { PayloadReference } from "./settings/payload-reference";
import { SETTINGS_STYLES } from "./settings/styles";
import { ALL_EVENTS } from "./settings/types";
import { useWebhook } from "./settings/use-webhook";

export default function CardSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // See cards/mine/[slug]/analytics/page.tsx for the React.use() rationale.
  const { slug } = use(params);

  const {
    auth,
    webhook,
    log,
    error,
    saving,
    testing,
    url,
    setUrl,
    events,
    revealedSecret,
    flash,
    save,
    fireTest,
    toggleEvent,
    copySecret,
  } = useWebhook(slug);

  if (auth.loading || (!webhook && !error)) {
    return <main className="st-root">Loading…</main>;
  }
  if (error) {
    return (
      <main className="st-root">
        <p>{error}</p>
        <Link href="/cards/mine">← Back to your cards</Link>
      </main>
    );
  }

  return (
    <main className="st-root">
      <header className="st-head">
        <div>
          <div className="st-crumb">
            <Link href="/cards/mine">← Your cards</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/analytics`}>Analytics</Link>
            <span> · </span>
            <Link href={`/cards/mine/${slug}/leads`}>Leads</Link>
          </div>
          <h1>{slug} — settings</h1>
          <p className="st-sub">
            Webhook fan-out, secret management, and delivery log.
          </p>
        </div>
        <Link href={`/c/${slug}`} className="st-action">
          View card →
        </Link>
      </header>

      <section className="st-section">
        <h2>Webhook delivery</h2>
        <p className="st-help">
          Send selected events to any HTTPS URL — Zapier, Make, n8n, IFTTT,
          HubSpot, your own server. Each delivery is signed with
          HMAC-SHA256 so you can verify it really came from Holo-Flow.
        </p>

        <label className="st-label">
          Webhook URL
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.zapier.com/hooks/catch/.../..."
            className="st-input"
            disabled={saving}
          />
        </label>

        <div className="st-label">
          Events to forward
          <div className="st-checks">
            {ALL_EVENTS.map((e) => (
              <label key={e.key} className="st-check">
                <input
                  type="checkbox"
                  checked={events.includes(e.key)}
                  onChange={() => toggleEvent(e.key)}
                  disabled={saving}
                />
                {e.label}
              </label>
            ))}
          </div>
        </div>

        <div className="st-actions">
          <button
            onClick={() => save()}
            className="st-btn-primary"
            disabled={saving || !url.trim()}
          >
            {saving ? "Saving…" : "Save webhook"}
          </button>
          {webhook?.secretSet && (
            <>
              <button
                onClick={() => save({ rotate: true })}
                className="st-btn"
                disabled={saving}
              >
                Rotate secret
              </button>
              <button
                onClick={fireTest}
                className="st-btn"
                disabled={testing}
              >
                {testing ? "Sending…" : "Send test event"}
              </button>
              <button
                onClick={() => save({ clear: true })}
                className="st-btn-danger"
                disabled={saving}
              >
                Clear
              </button>
            </>
          )}
        </div>

        {revealedSecret && (
          <div className="st-secret">
            <strong>Save this secret somewhere safe</strong> — it won't be
            shown again. Use it in your receiver to verify the signature on
            incoming requests.
            <code>{revealedSecret}</code>
            <button onClick={copySecret} className="st-btn-small">
              Copy
            </button>
          </div>
        )}

        {webhook?.secretSet && !revealedSecret && (
          <p className="st-help">
            A signing secret is already configured. Use{" "}
            <strong>Rotate secret</strong> if it's been compromised or
            you've lost it.
          </p>
        )}
      </section>

      <section className="st-section">
        <h2>Recent deliveries</h2>
        {log.length === 0 ? (
          <p className="st-help">No deliveries yet.</p>
        ) : (
          <ul className="st-log">
            {log.map((l) => (
              <li
                key={l.id}
                className={`st-log-item ${l.ok ? "ok" : "fail"}`}
              >
                <span className="st-log-status">{l.ok ? "✓" : "✕"}</span>
                <span className="st-log-event">{l.event}</span>
                <span className="st-log-meta">
                  HTTP {l.status ?? "—"} · {l.attempts} attempt
                  {l.attempts === 1 ? "" : "s"}
                </span>
                <span className="st-log-time">
                  {new Date(l.at).toLocaleString()}
                </span>
                {l.error && <span className="st-log-error">{l.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <PayloadReference slug={slug} />

      {flash && <div className="st-toast">{flash}</div>}

      {/* Global because styled-jsx's babel plugin needs static CSS in
          source to compute a scoped class hash; the st-* class prefix
          is unique to this route so global injection won't collide. */}
      <style jsx global>{`${SETTINGS_STYLES}`}</style>
    </main>
  );
}
