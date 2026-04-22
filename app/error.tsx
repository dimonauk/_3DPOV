"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-6 py-28">
      <div className="protocol-label">Field error</div>
      <h1 className="display text-5xl mt-4 leading-[1]">The record could not be read.</h1>
      <p className="mt-6 text-ink/70">
        An unexpected condition stopped the page from rendering. The
        archive has been notified. You can try again, or return to the
        index.
      </p>
      {error.digest && (
        <p className="mt-3 text-xs text-ink/50 font-mono">digest: {error.digest}</p>
      )}
      <div className="mt-10 flex gap-5 text-sm">
        <button
          onClick={reset}
          className="border border-ink px-5 py-3 tracking-protocol text-xs hover:bg-ink hover:text-bone transition-colors"
        >
          TRY AGAIN
        </button>
        <Link href="/" className="underline underline-offset-4 self-center">
          Back to the entrance
        </Link>
      </div>
    </section>
  );
}
