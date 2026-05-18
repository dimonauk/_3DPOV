"use client";

/**
 * app/admin/import/google-drive/page.tsx — Google Drive folder browser
 * for the operator import flow.
 *
 * Walks the Drive tree starting at "root". Lets the operator drill into
 * folders, tick files (image/video only by default), and import the
 * selection into the catalogue.
 *
 * "Watch this folder" is a stub: posts to /api/admin/import/google-
 * drive/watch which only records the folder id in
 * operatorIntegrations/{uid}.watchedDriveFolders[]. The cron polling
 * job is deferred.
 *
 * Orchestrator only. Types in google-drive/types.ts; state machine +
 * handlers in use-drive-browser.ts; file list (filter + rows) in
 * file-list.tsx; bottom import-controls bar in import-controls.tsx.
 * Per ARCHITECTURE.md Rule 1.
 */

import { FileList } from "./google-drive/file-list";
import { ImportControls } from "./google-drive/import-controls";
import type { PrintFilter } from "./google-drive/types";
import { useDriveBrowser } from "./google-drive/use-drive-browser";

export default function GoogleDriveImportPage() {
  const d = useDriveBrowser();

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-2 border-b border-warm-black-700 pb-6">
          <span className="chrome-label text-chrome-400">
            Operator console / Import / Google Drive
          </span>
          <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
            Browse Google Drive
          </h1>
          <p className="text-xs leading-relaxed text-chrome-400">
            Walk a folder. Tick images / videos. Import. The drive.readonly
            scope means nothing in the studio writes back to Drive.
          </p>
        </header>

        <nav className="flex flex-wrap items-center gap-2 text-xs text-chrome-300">
          {d.crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-2">
              {i > 0 ? <span className="text-chrome-500">/</span> : null}
              <button
                type="button"
                onClick={() => d.onCrumbClick(i)}
                className="text-chrome-200 hover:text-pink-200"
              >
                {c.name}
              </button>
            </span>
          ))}
          <label className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
            <input
              type="checkbox"
              checked={d.mediaOnly}
              onChange={(e) => d.setMediaOnly(e.target.checked)}
            />
            media only
          </label>
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-chrome-400">
            print
            <select
              value={d.printFilter}
              onChange={(e) => d.setPrintFilter(e.target.value as PrintFilter)}
              className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-[10px] text-chrome-100"
              title="Filter visible files by print-check verdict. Drive's imageMediaMetadata gives width+height without downloading."
            >
              <option value="all">all</option>
              <option value="printable-only">≥ A4 printable</option>
              <option value="hide-downscales">hide web downscales</option>
              <option value="corpus-only">360 training corpus</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void d.onWatchFolder()}
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ☆ Watch this folder
          </button>
        </nav>

        {d.error ? (
          <div className="rounded-sm border border-pink-400/40 bg-pink-900/10 px-4 py-3 text-xs text-pink-200">
            {d.error}
          </div>
        ) : null}

        <section className="rounded-sm border border-warm-black-700 bg-warm-black-900/40">
          <FileList
            files={d.files}
            busy={d.busy}
            mediaOnly={d.mediaOnly}
            printFilter={d.printFilter}
            selected={d.selected}
            outcomes={d.outcomes}
            onEnterFolder={d.onEnterFolder}
            onToggle={d.onToggle}
          />
        </section>

        <ImportControls
          subject={d.subject}
          setSubject={d.setSubject}
          mode={d.mode}
          setMode={d.setMode}
          preset={d.preset}
          setPreset={d.setPreset}
          splatTarget={d.splatTarget}
          setSplatTarget={d.setSplatTarget}
          tags={d.tags}
          setTags={d.setTags}
          selectedCount={d.selected.size}
          busy={d.busy}
          onImportSelected={() => void d.onImportSelected()}
          onSplatify={() => void d.onSplatify()}
        />

        <section className="flex flex-col gap-2 rounded-sm border border-dashed border-warm-black-700 bg-warm-black-900/40 px-4 py-3">
          <span className="chrome-label text-chrome-400">
            Import by URL or file id
          </span>
          <p className="text-[10px] leading-relaxed text-chrome-500">
            Paste one or more Drive share URLs (or bare file ids), one per
            line. Uses the Storage mode + Preset chosen above.
          </p>
          <textarea
            value={d.pasteUrls}
            onChange={(e) => d.setPasteUrls(e.target.value)}
            rows={3}
            placeholder="https://drive.google.com/file/d/.../view"
            className="rounded-sm border border-warm-black-700 bg-warm-black-950 px-2 py-1 font-mono text-xs text-chrome-100"
          />
          <button
            type="button"
            onClick={() => void d.onImportPasted()}
            disabled={d.busy || d.pasteUrls.trim().length === 0}
            className="self-end rounded-sm border border-pink-200/40 bg-pink-900/20 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-pink-100 transition-colors hover:border-pink-200 disabled:opacity-60"
          >
            Import pasted
          </button>
        </section>

        <footer className="flex justify-between border-t border-warm-black-700 pt-4">
          <a
            href="/admin/import/google/connect"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            ← Connection
          </a>
          <a
            href="/admin"
            className="chrome-label text-chrome-500 hover:text-pink-200"
          >
            Operator console →
          </a>
        </footer>
      </div>
    </main>
  );
}
