"use client";

/**
 * app/admin/assets/assets-form/mode-drive.tsx
 *
 * Google Drive mode. Operator pastes a share URL; the orchestrator
 * has already parsed the file id via `parseDriveId`. Bytes is
 * entered manually (Drive's API needs OAuth; this is a one-step
 * shortcut).
 */

export type ModeDriveProps = {
  driveInput: string;
  setDriveInput: (v: string) => void;
  driveBytes: string;
  setDriveBytes: (v: string) => void;
  driveId: string | null;
};

export function ModeDrive(p: ModeDriveProps) {
  return (
    <section className="aa-form">
      <h2>Drive share link</h2>
      <label className="aa-row">
        <span className="aa-label">Drive URL</span>
        <input
          type="text"
          value={p.driveInput}
          onChange={(e) => p.setDriveInput(e.target.value)}
          placeholder="https://drive.google.com/file/d/<ID>/view?usp=sharing"
        />
        {p.driveInput && !p.driveId && (
          <span className="aa-hint aa-error-hint">
            Couldn&rsquo;t parse a file id — make sure the link is of the form{" "}
            <code>/file/d/&lt;ID&gt;/view</code> or<code> ?id=&lt;ID&gt;</code>.
          </span>
        )}
        {p.driveId && (
          <span className="aa-hint">
            Parsed id: <code>{p.driveId}</code>
          </span>
        )}
      </label>
      <label className="aa-row">
        <span className="aa-label">Size (bytes)</span>
        <input
          type="number"
          value={p.driveBytes}
          onChange={(e) => p.setDriveBytes(e.target.value)}
          placeholder="412503040"
          min="1"
        />
        <span className="aa-hint">
          Right-click the file in Drive → Details → size in bytes.
        </span>
      </label>
    </section>
  );
}
