"use client";

import { useState } from "react";

import { useAuth } from "components/auth/auth-provider";

type Tier = "reader-plus" | "member" | "patron" | "atelier" | "";

export function TierOverrideClient() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "busy" }
    | { kind: "ok"; tier: Tier; uid: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setStatus({
        kind: "error",
        message: "Sign in first (operator account required).",
      });
      return;
    }
    if (!email.trim()) {
      setStatus({ kind: "error", message: "Email is required." });
      return;
    }
    setStatus({ kind: "busy" });
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/tiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          tier: tier === "" ? null : tier,
          reason: reason.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        targetUid?: string;
        tier?: Tier | null;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setStatus({
        kind: "ok",
        tier: (body.tier ?? "") as Tier,
        uid: body.targetUid ?? "",
      });
      setReason("");
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <label className="flex flex-col gap-1">
        <span className="chrome-label text-chrome-400">User email</span>
        <input
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          placeholder="alice@example.com"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="chrome-label text-chrome-400">Tier</span>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as Tier)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
        >
          <option value="">— Clear (no tier)</option>
          <option value="reader-plus">Reader+</option>
          <option value="member">Member</option>
          <option value="patron">Patron</option>
          <option value="atelier">Atelier</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="chrome-label text-chrome-400">
          Reason (audit trail; max 200 chars)
        </span>
        <input
          type="text"
          maxLength={200}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-sm border border-warm-black-700 bg-warm-black-900/40 px-3 py-2 text-sm text-chrome-100 focus:border-pink-200 focus:outline-none"
          placeholder="press comp / collab / refund / drift fix"
        />
      </label>

      <button
        type="submit"
        disabled={status.kind === "busy"}
        className="self-start rounded-sm border border-pink-200 px-5 py-2 text-sm uppercase tracking-[0.18em] text-pink-100 transition-colors hover:bg-pink-200 hover:text-warm-black-950 disabled:opacity-50"
      >
        {status.kind === "busy" ? "Applying…" : "Apply override"}
      </button>

      {status.kind === "ok" && (
        <p className="rounded border border-emerald-300/40 bg-emerald-300/5 px-3 py-2 text-sm text-emerald-100">
          Done. Set <code>{status.tier || "null"}</code> on uid{" "}
          <code className="text-xs">{status.uid}</code>. Discord
          propagation fired if configured.
        </p>
      )}
      {status.kind === "error" && (
        <p className="rounded border border-pink-300/40 bg-pink-300/5 px-3 py-2 text-sm text-pink-100">
          {status.message}
        </p>
      )}
    </form>
  );
}
