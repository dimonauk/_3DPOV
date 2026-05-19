"use client";

/**
 * /admin/people-finder — Batch-add rolodex people by username sweep.
 *
 * Operator pastes a list of names / handles, hits Run; the page
 * calls `/api/admin/people-finder` which spawns Maigret server-side
 * and returns the verified hits per platform.
 *
 * Each hit becomes a copy-paste-able snippet for either:
 *   - data/people.json (public profile, the public-safe fields)
 *   - lib/social-feeds/sources.ts (a FeedSource entry, when the
 *     platform has an RSS / Atom URL)
 *   - holoflow-private/rolodex/rolodex.json (private rolodex)
 *
 * Admin-only. Layout gate is enforced at app/admin/layout.tsx.
 */

import { useMemo, useState } from "react";

import { useAuth } from "components/auth/auth-provider";

import { ADMIN_PEOPLE_FINDER_STYLES } from "./styles";

type Hit = { site: string; url: string; claimed: boolean };
type Run = { username: string; hits: Hit[]; errors: string[] };

type RunState =
  | { kind: "idle" }
  | { kind: "running"; current: number; total: number }
  | { kind: "done"; runs: Run[] }
  | { kind: "error"; message: string };

export default function PeopleFinderPage() {
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [state, setState] = useState<RunState>({ kind: "idle" });

  const usernames = useMemo(
    () =>
      input
        .split(/[\n,]+/)
        .map((s) => s.trim().replace(/^@/, ""))
        .filter((s) => s.length > 0),
    [input],
  );

  const onRun = async () => {
    if (!user || usernames.length === 0) return;
    setState({ kind: "running", current: 0, total: usernames.length });
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch("/api/admin/people-finder", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ usernames }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as {
          error?: string;
        };
        setState({
          kind: "error",
          message: body.error ?? `http ${resp.status}`,
        });
        return;
      }
      const data = (await resp.json()) as { runs: Run[] };
      setState({ kind: "done", runs: data.runs });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="pf-root">
      <header className="pf-header">
        <h1>People finder</h1>
        <p>
          Batch-verify usernames across 2,500+ sites. Paste names /
          handles, one per line. The page spawns Maigret server-side
          and returns the claimed-platform hits.
        </p>
        <p className="pf-hint">
          Use the hits to populate <code>data/people.json</code>{" "}
          (public profiles), <code>lib/social-feeds/sources.ts</code>{" "}
          (feed sources), and the private rolodex.
        </p>
      </header>

      <section className="pf-form">
        <label className="pf-row">
          <span className="pf-label">Usernames (one per line)</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            placeholder={"jonthephotographer\npenelope-barritt\nseanrodrigo\n..."}
            disabled={state.kind === "running"}
          />
          <span className="pf-hint">
            {usernames.length} username{usernames.length === 1 ? "" : "s"} queued
          </span>
        </label>

        <button
          type="button"
          onClick={onRun}
          disabled={
            !user || usernames.length === 0 || state.kind === "running"
          }
          className="pf-run-btn"
        >
          {state.kind === "running"
            ? `Sweeping… ${state.current}/${state.total}`
            : "Run sweep"}
        </button>
        {!user && <p className="pf-warn">Sign in as admin to run.</p>}
        {state.kind === "error" && (
          <p className="pf-warn">Error: {state.message}</p>
        )}
      </section>

      {state.kind === "done" && (
        <section className="pf-results">
          <div className="pf-results-title">
            ✓ Sweep complete · {state.runs.length} username
            {state.runs.length === 1 ? "" : "s"}
          </div>
          {state.runs.map((run) => (
            <div key={run.username} className="pf-run">
              <h2>{run.username}</h2>
              {run.hits.length === 0 ? (
                <p className="pf-empty">
                  No claimed hits found.{" "}
                  {run.errors.length > 0 ? `(${run.errors[0]})` : ""}
                </p>
              ) : (
                <ul className="pf-hits">
                  {run.hits.map((hit) => (
                    <li key={`${run.username}-${hit.site}`}>
                      <strong>{hit.site}</strong>
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {hit.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{ADMIN_PEOPLE_FINDER_STYLES}</style>
    </div>
  );
}
