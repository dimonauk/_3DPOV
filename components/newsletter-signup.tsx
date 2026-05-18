"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  getFirebaseDb,
  isFirebaseConfigured,
} from "lib/firebase/client";
import { createLogger, errToObject } from "lib/log";

const log = createLogger("NewsletterSignup");

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setStatus({ kind: "error", message: "Please enter a valid email." });
      return;
    }

    if (!isFirebaseConfigured()) {
      setStatus({
        kind: "error",
        message:
          "Newsletter signup isn't wired up yet — email contact@holoflow.co.uk and we'll add you manually.",
      });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error("Firestore not available");
      await addDoc(collection(db, "subscribers"), {
        email: trimmed,
        source: "holding-page",
        createdAt: serverTimestamp(),
      });
      setStatus({ kind: "success" });
      setEmail("");
    } catch (err) {
      log.error("submit failed", { err: errToObject(err) });
      setStatus({
        kind: "error",
        message:
          "Couldn't save just then. Try again, or email contact@holoflow.co.uk directly.",
      });
    }
  };

  if (status.kind === "success") {
    return (
      <div className="flex w-full flex-col items-center gap-2 rounded-md border border-mint-300/40 bg-warm-black-900/60 px-5 py-4 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-mint-300">
          Subscribed
        </span>
        <p className="text-xs leading-relaxed text-chrome-200 md:text-sm">
          You&rsquo;ll get studio dispatch notes when there&rsquo;s something
          worth saying. Roughly monthly. Never advertising.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col items-center gap-3"
    >
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
        Studio dispatch &mdash; new releases &amp; field records
      </span>
      <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@somewhere.co.uk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status.kind === "submitting"}
          className="flex-1 rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-4 py-2.5 font-mono text-xs text-chrome-100 placeholder:text-chrome-500 focus:border-pink-200 focus:outline-none disabled:opacity-60 md:text-sm"
        />
        <button
          type="submit"
          disabled={status.kind === "submitting"}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-60 md:text-sm"
        >
          {status.kind === "submitting" ? "Sending…" : "Subscribe"}
        </button>
      </div>
      {status.kind === "error" && (
        <p className="text-xs text-pink-300">{status.message}</p>
      )}
    </form>
  );
}
