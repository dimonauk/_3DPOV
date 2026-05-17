"use client";

/**
 * app/error.tsx — Next.js global error boundary.
 *
 * Catches any uncaught error in the React tree and posts a structured
 * report to /api/log. Shows the user a friendly recovery screen with
 * a "Try again" button + the request id they can quote when emailing
 * support.
 *
 * Next.js auto-mounts this at the app root. See:
 * https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

import { useEffect } from "react";
import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Fire-and-forget report to the server. We don't await this so the
    // error UI renders immediately.
    const report = async () => {
      try {
        const recentLogs =
          typeof window !== "undefined" &&
          (window as { __holoflow_log_ring?: unknown[] }).__holoflow_log_ring
            ? (window as { __holoflow_log_ring?: unknown[] }).__holoflow_log_ring!.slice(-20)
            : [];

        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            level: "error",
            scope: "client.error-boundary",
            message: error.message || "Unknown client error",
            meta: {
              name: error.name,
              stack: error.stack,
              digest: error.digest,
            },
            recentLogs,
            pathname: window.location.pathname + window.location.search,
            ua: navigator.userAgent,
          }),
        });
      } catch {
        // No-op: if the error reporter itself errors, swallow it —
        // don't recurse.
      }
    };
    void report();
  }, [error]);

  return (
    <main className="ge-root">
      <div className="ge-card">
        <h1>Something went wrong</h1>
        <p>
          The page hit an unexpected error. Our logs have been notified
          and we&rsquo;ll look at it.
        </p>
        {error.digest && (
          <p className="ge-ref">
            Reference: <code>{error.digest}</code>
          </p>
        )}
        <div className="ge-actions">
          <button onClick={() => reset()} className="ge-btn-primary">
            Try again
          </button>
          <Link href="/" className="ge-btn">
            Go home
          </Link>
        </div>
      </div>

      <style jsx>{`
        .ge-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(
            135deg,
            #1a0a1a,
            #0a0a1a
          );
        }
        .ge-card {
          max-width: 500px;
          padding: 2.5rem 2rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 111, 181, 0.2);
          border-radius: 1rem;
          text-align: center;
        }
        .ge-card h1 {
          margin: 0 0 0.5rem;
          font-size: 1.5rem;
        }
        .ge-card p {
          opacity: 0.8;
          line-height: 1.5;
          margin: 0.5rem 0;
        }
        .ge-ref code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.15rem 0.5rem;
          border-radius: 3px;
          font-size: 0.85em;
        }
        .ge-actions {
          margin-top: 2rem;
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }
        .ge-btn-primary,
        .ge-btn {
          padding: 0.65rem 1.5rem;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          cursor: pointer;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font-family: inherit;
        }
        .ge-btn-primary {
          background: #ff6fb5;
          color: white;
          border-color: #ff6fb5;
        }
      `}</style>
    </main>
  );
}
