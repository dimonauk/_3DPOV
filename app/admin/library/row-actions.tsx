"use client";

/**
 * app/admin/library/row-actions.tsx — per-row controls.
 *
 * Pulls the Firebase ID token for the signed-in operator and posts to
 * the admin API routes. Falls back to a polite "auth missing" pill if
 * the user somehow rendered this without being signed in (shouldn't
 * happen — the layout gates it).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "components/auth/auth-provider";

export function RowActions({
  mediaId,
  retired,
}: {
  mediaId: string;
  retired: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  };

  const toggleRetire = async () => {
    setError(null);
    const token = await auth();
    if (!token) {
      setError("Not signed in");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ retired: !retired }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? `HTTP ${res.status}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setError(null);
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Delete this media record and the underlying blob? This cannot be undone.",
      )
    ) {
      return;
    }
    const token = await auth();
    if (!token) {
      setError("Not signed in");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? `HTTP ${res.status}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggleRetire}
        disabled={busy}
        className="chrome-label text-chrome-400 hover:text-pink-200 disabled:opacity-50"
      >
        {retired ? "Un-retire" : "Retire"}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="chrome-label text-pink-300 hover:text-pink-200 disabled:opacity-50"
      >
        Delete
      </button>
      {error ? (
        <span className="text-[0.6rem] text-pink-300">{error}</span>
      ) : null}
    </div>
  );
}
