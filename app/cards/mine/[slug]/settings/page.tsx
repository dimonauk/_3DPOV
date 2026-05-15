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
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "components/auth/auth-provider";

type LogEntry = {
  id: string;
  event: string;
  ok: boolean;
  status: number | null;
  attempts: number;
  error: string | null;
  at: number;
};

type WebhookState = {
  webhookUrl: string;
  secretSet: boolean;
  webhookEvents: string[];
};

const ALL_EVENTS: Array<{ key: string; label: string }> = [
  { key: "lead_capture", label: "Lead capture" },
  { key: "view", label: "Card view" },
  { key: "ar_launch", label: "AR launch" },
  { key: "hand_lock", label: "Hand lock" },
  { key: "webxr", label: "WebXR session" },
  { key: "vcard_download", label: "vCard download" },
  { key: "recording", label: "AR recording" },
];

export default function CardSettingsPage() {
  const auth = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [webhook, setWebhook] = useState<WebhookState | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Local form state
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["lead_capture"]);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    if (!auth.user) return;
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch(`/api/cards/${slug}/webhook`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 403) setError("This isn't your card.");
        else if (res.status === 404) setError("Card not found.");
        else setError("Couldn't load webhook config.");
        return;
      }
      const body = (await res.json()) as {
        webhook: WebhookState;
        log: LogEntry[];
      };
      setWebhook(body.webhook);
      setLog(body.log);
      setUrl(body.webhook.webhookUrl);
      setEvents(body.webhook.webhookEvents);
    } catch {
      setError("Couldn't load webhook config.");
    }
  };

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace("/signin");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.user, slug]);

  const flashToast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const save = async (opts?: { rotate?: boolean; clear?: boolean }) => {
    if (!auth.user) return;
    setSaving(true);
    setError(null);
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch(`/api/cards/${slug}/webhook`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          opts?.clear
            ? { clear: true }
            : {
                webhookUrl: url,
                webhookEvents: events,
                rotateSecret: opts?.rotate ?? false,
              },
        ),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Save failed.");
        return;
      }
      const body = (await res.json()) as {
        webhook?: WebhookState & { webhookSecret?: string };
      };
      if (opts?.clear) {
        setRevealedSecret(null);
        flashToast("Webhook cleared.");
      } else if (body.webhook?.webhookSecret) {
        setRevealedSecret(body.webhook.webhookSecret);
        flashToast(opts?.rotate ? "Secret rotated." : "Webhook saved.");
      } else {
        flashToast("Webhook saved.");
      }
      await load();
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const fireTest = async () => {
    if (!auth.user) return;
    setTesting(true);
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch(`/api/cards/${slug}/webhook`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        result?: { ok: boolean; status?: number; error?: string };
        error?: string;
      };
      if (body.error === "webhook_not_configured") {
        flashToast("Save a webhook URL first.");
      } else if (body.ok && body.result?.ok) {
        flashToast(`Test delivered (HTTP ${body.result.status}).`);
      } else {
        flashToast(
          `Test failed: ${
            body.result?.error ?? body.result?.status ?? "unknown"
          }`,
        );
      }
      await load();
    } finally {
      setTesting(false);
    }
  };

  const toggleEvent = (key: string) => {
    setEvents((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key],
    );
  };

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
          Send selected events to any HTTPS URL — Zapier, Make, n8n,
          IFTTT, HubSpot, your own server. Each delivery is signed with
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
            <strong>Save this secret somewhere safe</strong> — it
            won't be shown again. Use it in your receiver to verify
            the signature on incoming requests.
            <code>{revealedSecret}</code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(revealedSecret);
                flashToast("Secret copied.");
              }}
              className="st-btn-small"
            >
              Copy
            </button>
          </div>
        )}

        {webhook?.secretSet && !revealedSecret && (
          <p className="st-help">
            A signing secret is already configured. Use{" "}
            <strong>Rotate secret</strong> if it's been compromised
            or you've lost it.
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

      <section className="st-section">
        <h2>Payload reference</h2>
        <p className="st-help">
          Each delivery is an HTTPS POST with these headers:
        </p>
        <pre className="st-code">
{`Content-Type: application/json
x-holoflow-signature: sha256=<hex hmac>
x-holoflow-timestamp: <unix-ms>
x-holoflow-event: lead_capture
x-holoflow-card: ${slug}`}
        </pre>
        <p className="st-help">And this JSON body:</p>
        <pre className="st-code">
{`{
  "event": "lead_capture",
  "card": { "slug": "${slug}", "name": "..." },
  "occurredAt": "ISO-8601",
  "data": {
    "name": "Visitor's name (optional)",
    "email": "them@example.com",
    "message": "Optional message",
    "src": "batch-1" // their ?src= tag
  }
}`}
        </pre>
        <p className="st-help">
          To verify: <code>signature == "sha256=" + hmacSHA256(secret, timestamp + "." + body)</code>.
          Compare with constant-time. Reject if the timestamp is more
          than ~5 minutes old to prevent replay.
        </p>
      </section>

      {flash && <div className="st-toast">{flash}</div>}

      <style jsx>{`
        .st-root {
          max-width: 1000px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }
        .st-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .st-head h1 {
          margin: 0.25rem 0;
          font-size: 2rem;
        }
        .st-crumb a {
          color: inherit;
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .st-crumb a:hover { opacity: 1; }
        .st-sub { opacity: 0.65; margin: 0.25rem 0 0; font-size: 0.9rem; }
        .st-action {
          color: inherit;
          text-decoration: none;
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 0.9rem;
        }
        .st-section {
          margin-bottom: 3rem;
        }
        .st-section h2 {
          font-size: 1.2rem;
          margin: 0 0 0.5rem;
        }
        .st-help {
          opacity: 0.7;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0 0 1rem;
        }
        .st-help code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          font-size: 0.85em;
        }
        .st-label {
          display: block;
          font-size: 0.85rem;
          opacity: 0.85;
          margin-bottom: 1rem;
        }
        .st-input {
          display: block;
          width: 100%;
          margin-top: 0.4rem;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 0.5rem;
          color: inherit;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
          font-size: 0.9rem;
        }
        .st-checks {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .st-check {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.85rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .st-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .st-btn-primary,
        .st-btn,
        .st-btn-danger {
          padding: 0.6rem 1.1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
        }
        .st-btn-primary {
          background: #ff6fb5;
          color: white;
          border-color: #ff6fb5;
        }
        .st-btn-danger {
          color: #ff8585;
        }
        .st-btn-small {
          padding: 0.3rem 0.7rem;
          margin-left: 0.5rem;
          border-radius: 999px;
          font-size: 0.75rem;
          background: transparent;
          color: inherit;
          border: 1px solid currentColor;
          cursor: pointer;
        }
        .st-secret {
          margin-top: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 193, 7, 0.08);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }
        .st-secret strong {
          display: block;
          margin-bottom: 0.5rem;
        }
        .st-secret code {
          display: block;
          margin: 0.5rem 0;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
          font-size: 0.85em;
          word-break: break-all;
        }
        .st-log {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .st-log-item {
          display: grid;
          grid-template-columns: 20px minmax(120px, 160px) 1fr auto;
          gap: 0.5rem;
          align-items: center;
          padding: 0.6rem 0.85rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 0.5rem;
          font-size: 0.85rem;
        }
        .st-log-item.ok { border-left: 3px solid #4caf50; }
        .st-log-item.fail { border-left: 3px solid #ff5252; }
        .st-log-status { font-weight: 700; }
        .st-log-meta,
        .st-log-time { opacity: 0.6; font-size: 0.8rem; }
        .st-log-error {
          grid-column: 1 / -1;
          opacity: 0.75;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
          font-size: 0.75rem;
          padding-left: 28px;
        }
        .st-code {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.5rem;
          padding: 1rem;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
          font-size: 0.8rem;
          overflow-x: auto;
          line-height: 1.45;
        }
        .st-toast {
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
