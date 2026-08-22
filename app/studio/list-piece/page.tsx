"use client";

/**
 * app/studio/list-piece/page.tsx — Marketplace listing form.
 *
 * Authenticated creators submit a piece here.
 * POSTs to /api/studio/list-piece with their Firebase ID token.
 *
 * Royalty split: creator chooses 20–70%, platform takes the rest.
 * Every piece carries the Aura watermark (applied server-side).
 * Submitted pieces land as Shopify DRAFT — reviewed before publish.
 */

import { useState } from "react";
import { useAuth } from "components/auth/auth-provider";
import Link from "next/link";

const CATEGORIES = [
  { value: "jewellery", label: "Jewellery" },
  { value: "sculpture", label: "Sculpture" },
  { value: "desktop", label: "Desktop Art" },
  { value: "wall", label: "Wall Art" },
] as const;

type State = "idle" | "sending" | "sent" | "error";

export default function ListPiecePage() {
  const { user, loading } = useAuth();
  const [royalty, setRoyalty] = useState(50);
  const [waveguide, setWaveguide] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [productId, setProductId] = useState("");

  if (loading) return <div className="p-8 text-center text-sm text-[#64748b]">Loading…</div>;

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-[#64748b]">Sign in to list a piece.</p>
        <Link
          href="/signin"
          className="rounded border border-[#7ff0d4] px-5 py-2 text-sm text-[#7ff0d4] hover:bg-[rgba(127,240,212,0.08)]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const idToken = await user!.getIdToken();

    const payload = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      priceGbp: parseFloat(fd.get("priceGbp") as string),
      royaltyPercent: royalty,
      category: fd.get("category") as string,
      waveguideEmbedded: waveguide,
    };

    try {
      const res = await fetch("/api/studio/list-piece", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { ok?: boolean; productId?: string; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `${res.status}`);
      setProductId(data.productId ?? "");
      setState("sent");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  if (state === "sent") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-medium text-[#7ff0d4]">Piece submitted.</p>
        <p className="mt-2 text-sm text-[#64748b]">
          It's in the review queue. Once approved it appears in the marketplace.
          Product ID: <code className="text-[#7ff0d4]">{productId}</code>
        </p>
        <button
          onClick={() => setState("idle")}
          className="mt-6 text-sm underline text-[#64748b]"
        >
          List another piece
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <header className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-widest text-[#64748b]">Studio</p>
        <h1 className="text-3xl font-semibold tracking-tight">List a piece</h1>
        <p className="mt-3 text-sm text-[#64748b]">
          Your piece lands as a draft and is reviewed before going live. Every piece
          carries the Aura watermark. Royalty transfers monthly.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-[#64748b]">Title</span>
          <input
            name="title"
            required
            minLength={3}
            className="w-full rounded border border-[rgba(6,182,212,0.35)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#7ff0d4]"
          />
        </label>

        {/* Description */}
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-[#64748b]">Description</span>
          <textarea
            name="description"
            required
            minLength={10}
            rows={4}
            placeholder="Material, dimensions, print process, inspiration."
            className="w-full rounded border border-[rgba(6,182,212,0.35)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#7ff0d4]"
          />
        </label>

        {/* Category + Price */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-[#64748b]">Category</span>
            <select
              name="category"
              required
              className="w-full rounded border border-[rgba(6,182,212,0.35)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#7ff0d4]"
            >
              <option value="">— select —</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-[#64748b]">Price (£)</span>
            <input
              name="priceGbp"
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="85.00"
              className="w-full rounded border border-[rgba(6,182,212,0.35)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#7ff0d4]"
            />
          </label>
        </div>

        {/* Waveguide toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={waveguide}
            onChange={(e) => setWaveguide(e.target.checked)}
            className="h-4 w-4 accent-[#7ff0d4]"
          />
          <span className="text-sm">
            Waveguide embedded{" "}
            <span className="text-xs text-[#64748b]">(ambient-light tech — premium tier)</span>
          </span>
        </label>

        {/* Royalty slider */}
        <div>
          <span className="mb-1 block text-xs uppercase tracking-widest text-[#64748b]">
            Your royalty — {royalty}% / Platform takes {100 - royalty}%
          </span>
          <input
            type="range"
            min={20}
            max={70}
            step={5}
            value={royalty}
            onChange={(e) => setRoyalty(Number(e.target.value))}
            className="w-full accent-[#7ff0d4]"
          />
          <div className="mt-1 flex justify-between text-xs text-[#64748b]">
            <span>20% (you)</span>
            <span>70% max (you)</span>
          </div>
        </div>

        {state === "error" && (
          <p className="text-xs text-red-400">
            Failed: {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded border border-[#7ff0d4] px-6 py-2.5 text-sm font-medium text-[#7ff0d4] hover:bg-[rgba(127,240,212,0.08)] disabled:opacity-40"
        >
          {state === "sending" ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </main>
  );
}
