"use client";

/**
 * app/cards/mine/[slug]/settings/settings/use-webhook.ts — Owner-side
 * state machine for the webhook config + delivery log. Owns the
 * load / save (incl. clear + rotate) / fire-test handlers, the
 * checkbox toggle, the transient flash banner, and the one-time
 * revealed-secret state.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

import type { LogEntry, WebhookState } from "./types";

export function useWebhook(slug: string) {
  const auth = useAuth();
  const router = useRouter();

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

  const flashToast = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

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

  const copySecret = () => {
    if (!revealedSecret) return;
    navigator.clipboard?.writeText(revealedSecret);
    flashToast("Secret copied.");
  };

  return {
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
  };
}
