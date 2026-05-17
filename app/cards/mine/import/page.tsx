"use client";

/**
 * /cards/mine/import — bulk CSV card import UI.
 *
 * Drag-and-drop a CSV file (or paste raw CSV text), validate columns,
 * preview a few rows, then POST to /api/cards/bulk-import. Per-row
 * status report rendered inline (created / updated / skipped + reason).
 *
 * Designed for studio owners shipping physical cards in batches —
 * one CR-30 print run, one CSV, N digital twins in two clicks.
 */

export const dynamic = "force-dynamic";
export const experimental_ppr = false;

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "components/auth/auth-provider";

type RowResult =
  | { rowNumber: number; status: "created"; slug: string }
  | { rowNumber: number; status: "updated"; slug: string }
  | { rowNumber: number; status: "skipped"; reason: string; slug?: string };

const TEMPLATE_CSV = `slug,name,role,studio,tagline,email,phone,website,primary,secondary,accent,textOnBrand,font,linkedin,instagram,twitter,github
ada,Ada Lovelace,Mathematician & Pioneer,Analytical Engine Co,The first programmer,ada@example.com,,https://example.com,#7B61FF,#FF4F8B,#FFD166,#FFFFFF,serif,ada-lovelace,,,
grace,Grace Hopper,Computer Scientist & Rear Admiral,USN,Always be willing to do the impossible,grace@example.com,,https://example.com,#0B1E3A,#1E3A6E,#D4A24C,#FFFFFF,serif,,,,`;

export default function BulkImportPage() {
  const auth = useAuth();
  const router = useRouter();

  const [csvText, setCsvText] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [counts, setCounts] = useState<{
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragHover, setDragHover] = useState(false);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) router.replace("/signin");
  }, [auth.loading, auth.user, router]);

  const handleFile = async (file: File) => {
    if (file.size > 1024 * 1024) {
      setError("CSV is over 1 MB — split it into smaller batches.");
      return;
    }
    const text = await file.text();
    setCsvText(text);
    setError(null);
  };

  const submit = async () => {
    if (!auth.user) return;
    if (!csvText.trim()) {
      setError("Paste or upload a CSV first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResults(null);
    setCounts(null);
    try {
      const token = await auth.user.getIdToken();
      const res = await fetch("/api/cards/bulk-import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv: csvText }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        results?: RowResult[];
        counts?: { created: number; updated: number; skipped: number };
        error?: string;
        message?: string;
        maxRows?: number;
        gotRows?: number;
      };
      if (!res.ok || !body.results) {
        if (body.error === "too_many_rows") {
          setError(
            `Too many rows (${body.gotRows ?? "?"}). Max is ${body.maxRows ?? 100} per import — split into batches.`,
          );
        } else if (body.error === "no_rows") {
          setError("CSV had no data rows. Make sure you have a header row plus at least one row of card data.");
        } else if (body.error === "csv_too_large") {
          setError("CSV file too large. Max 1 MB.");
        } else {
          setError(body.message ?? body.error ?? "Import failed.");
        }
        return;
      }
      setResults(body.results);
      setCounts(body.counts ?? null);
    } catch (e) {
      setError((e as Error).message ?? "Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (auth.loading) return <main className="bi-root">Loading…</main>;

  return (
    <main className="bi-root">
      <header className="bi-head">
        <div>
          <div className="bi-crumb">
            <Link href="/cards/mine">← Your cards</Link>
          </div>
          <h1>Bulk import</h1>
          <p className="bi-sub">
            Upload a CSV to create or update many cards in one go.
            Up to 100 rows per import. Existing cards you own are
            updated, new slugs get created, taken slugs are skipped.
          </p>
        </div>
      </header>

      <section className="bi-section">
        <h2>1. Upload or paste CSV</h2>
        <label
          className={`bi-drop ${dragHover ? "bi-drop-hover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragHover(true);
          }}
          onDragLeave={() => setDragHover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragHover(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            className="bi-file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
          <span>📁 Drop a CSV here or click to select</span>
          <span className="bi-drop-hint">
            .csv · max 1 MB · UTF-8 · first row must be header
          </span>
        </label>
        <details className="bi-template">
          <summary>Show example CSV / column reference</summary>
          <p>Required columns: <code>name</code>, <code>role</code></p>
          <p>
            Optional:{" "}
            <code>slug</code>, <code>studio</code>, <code>tagline</code>,{" "}
            <code>email</code>, <code>phone</code>, <code>website</code>,{" "}
            <code>primary</code>, <code>secondary</code>, <code>accent</code>,{" "}
            <code>textOnBrand</code>, <code>font</code>,{" "}
            <code>linkedin</code>, <code>instagram</code>, <code>twitter</code>,{" "}
            <code>github</code>
          </p>
          <pre>{TEMPLATE_CSV}</pre>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "holoflow-cards-template.csv";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 5_000);
            }}
            className="bi-btn"
          >
            ⬇ Download template
          </button>
        </details>

        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Or paste your CSV here..."
          className="bi-text"
          rows={10}
        />
      </section>

      <section className="bi-section">
        <h2>2. Run import</h2>
        <div className="bi-actions">
          <button onClick={submit} disabled={busy || !csvText.trim()} className="bi-btn-primary">
            {busy ? "Importing…" : "🚀 Import cards"}
          </button>
          <button
            onClick={() => {
              setCsvText("");
              setResults(null);
              setCounts(null);
              setError(null);
            }}
            disabled={busy}
            className="bi-btn"
          >
            Clear
          </button>
        </div>
        {error && <p className="bi-error">{error}</p>}
      </section>

      {results && (
        <section className="bi-section">
          <h2>3. Results</h2>
          {counts && (
            <p className="bi-counts">
              ✅ {counts.created} created · ✏️ {counts.updated} updated ·{" "}
              ⏭ {counts.skipped} skipped
            </p>
          )}
          <table className="bi-results">
            <thead>
              <tr>
                <th>Row</th>
                <th>Status</th>
                <th>Slug</th>
                <th>Reason / link</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.rowNumber}
                  className={`bi-r bi-r-${r.status}`}
                >
                  <td>{r.rowNumber}</td>
                  <td>
                    {r.status === "created"
                      ? "✅ Created"
                      : r.status === "updated"
                        ? "✏️ Updated"
                        : "⏭ Skipped"}
                  </td>
                  <td>
                    {r.slug ? (
                      <code>{r.slug}</code>
                    ) : (
                      <span className="bi-faint">—</span>
                    )}
                  </td>
                  <td>
                    {r.status === "skipped" ? (
                      r.reason
                    ) : r.slug ? (
                      <>
                        <Link href={`/c/${r.slug}`}>View →</Link>
                        {" · "}
                        <Link href={`/cards/mine/${r.slug}/analytics`}>Analytics</Link>
                      </>
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <style jsx>{`
        .bi-root {
          max-width: 1000px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }
        .bi-head {
          margin-bottom: 2rem;
        }
        .bi-head h1 {
          margin: 0.25rem 0;
          font-size: 2rem;
        }
        .bi-crumb a {
          color: inherit;
          opacity: 0.7;
          text-decoration: none;
          font-size: 0.9rem;
        }
        .bi-sub {
          opacity: 0.7;
          margin: 0.5rem 0 0;
          font-size: 0.9rem;
          max-width: 38rem;
          line-height: 1.5;
        }
        .bi-section {
          margin-bottom: 2.5rem;
        }
        .bi-section h2 {
          font-size: 1.1rem;
          margin: 0 0 0.85rem;
        }
        .bi-drop {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 2rem;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.15s ease;
          font-size: 0.95rem;
        }
        .bi-drop:hover,
        .bi-drop-hover {
          border-color: #ff6fb5;
          background: rgba(255, 111, 181, 0.05);
        }
        .bi-drop-hint {
          font-size: 0.8rem;
          opacity: 0.5;
        }
        .bi-file {
          display: none;
        }
        .bi-template {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 0.5rem;
          font-size: 0.85rem;
        }
        .bi-template summary {
          cursor: pointer;
          opacity: 0.85;
          font-weight: 600;
        }
        .bi-template p {
          margin: 0.5rem 0;
        }
        .bi-template pre {
          background: rgba(0, 0, 0, 0.4);
          padding: 0.75rem;
          border-radius: 0.4rem;
          overflow-x: auto;
          font-size: 0.75rem;
          line-height: 1.4;
        }
        .bi-template code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
          font-size: 0.85em;
        }
        .bi-text {
          width: 100%;
          margin-top: 1rem;
          padding: 0.85rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: inherit;
          font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
          font-size: 0.8rem;
          line-height: 1.4;
          resize: vertical;
        }
        .bi-actions {
          display: flex;
          gap: 0.5rem;
        }
        .bi-btn,
        .bi-btn-primary {
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          border: 1px solid currentColor;
          background: transparent;
          color: inherit;
          font-size: 0.9rem;
          cursor: pointer;
          font-weight: 600;
        }
        .bi-btn-primary {
          background: #ff6fb5;
          color: white;
          border-color: #ff6fb5;
        }
        .bi-btn:disabled,
        .bi-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .bi-error {
          margin-top: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 82, 82, 0.1);
          border: 1px solid rgba(255, 82, 82, 0.3);
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }
        .bi-counts {
          font-size: 1rem;
          margin: 0 0 1rem;
        }
        .bi-results {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .bi-results th,
        .bi-results td {
          padding: 0.6rem 0.85rem;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .bi-results th {
          background: rgba(255, 255, 255, 0.03);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.7;
        }
        .bi-results code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
        }
        .bi-r-created {
          background: rgba(0, 200, 130, 0.04);
        }
        .bi-r-updated {
          background: rgba(255, 193, 7, 0.04);
        }
        .bi-r-skipped {
          background: rgba(255, 82, 82, 0.04);
        }
        .bi-results a {
          color: inherit;
          opacity: 0.85;
        }
        .bi-faint {
          opacity: 0.5;
        }
      `}</style>
    </main>
  );
}
