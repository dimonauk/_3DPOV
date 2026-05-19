/**
 * <BlendAsset id="..." /> — registry-backed download card for a
 * .blend (or any archive/large download) asset.
 *
 * Drive-hosted .blend files don't render in the browser, so this
 * surfaces as a card with name, size, format and a download link.
 * Works for any non-render-in-browser asset, not just .blend —
 * archives, source bundles, full-quality video.
 */

import { getAsset, formatAssetSize, isRemoteHost } from "lib/assets/resolve";

export type BlendAssetProps = {
  id: string;
  /** Override the heading. Falls back to the registry name. */
  label?: string;
  /** Override the description. Falls back to a generated one. */
  hint?: string;
};

export default function BlendAsset({ id, label, hint }: BlendAssetProps) {
  const asset = getAsset(id);

  if (!asset) {
    return (
      <div className="blend-asset-missing">
        Asset not found: <code>{id}</code>
        <style>{`
          .blend-asset-missing {
            padding: 0.85rem 1rem;
            border: 1px dashed #888;
            border-radius: 0.5rem;
            color: #888;
            font-family: system-ui, sans-serif;
            font-size: 0.85rem;
          }
        `}</style>
      </div>
    );
  }

  const href = asset.host === "google-drive"
    ? `/api/assets/proxy/${encodeURIComponent(asset.id)}`
    : asset.url;

  const sizeLabel = asset.bytes > 0 ? formatAssetSize(asset.bytes) : null;
  const hostLabel = labelForHost(asset.host);

  return (
    <div className="blend-asset-card">
      <div className="blend-asset-icon">{glyphFor(asset.format)}</div>
      <div className="blend-asset-body">
        <div className="blend-asset-name">{label ?? asset.name}</div>
        <div className="blend-asset-meta">
          .{asset.format.toUpperCase()}
          {sizeLabel ? <> · {sizeLabel}</> : null}
          {" · "}
          {hostLabel}
        </div>
        {hint ? (
          <div className="blend-asset-hint">{hint}</div>
        ) : null}
        <a
          className="blend-asset-cta"
          href={href}
          target={isRemoteHost(asset.host) ? "_blank" : undefined}
          rel="noopener noreferrer"
          download={asset.host === "vercel-blob" ? `${asset.id}.${asset.format}` : undefined}
        >
          Download
        </a>
      </div>
      <style>{`
        .blend-asset-card {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding: 1rem 1.2rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.25);
          border-radius: 0.75rem;
          font-family: system-ui, -apple-system, sans-serif;
          color: rgba(255, 255, 255, 0.9);
          margin: 1rem 0;
        }
        .blend-asset-icon {
          font-size: 2rem;
          line-height: 1;
        }
        .blend-asset-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .blend-asset-name {
          font-weight: 600;
          font-size: 0.98rem;
        }
        .blend-asset-meta {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.04em;
        }
        .blend-asset-hint {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
        .blend-asset-cta {
          align-self: flex-start;
          background: rgba(120, 200, 255, 0.18);
          border: 1px solid rgba(120, 200, 255, 0.45);
          color: #cfe9ff;
          padding: 0.4rem 0.9rem;
          border-radius: 0.4rem;
          font-size: 0.82rem;
          text-decoration: none;
          margin-top: 0.2rem;
        }
        .blend-asset-cta:hover {
          background: rgba(120, 200, 255, 0.28);
        }
      `}</style>
    </div>
  );
}

function glyphFor(format: string): string {
  switch (format.toLowerCase()) {
    case "blend":
      return "🎨";
    case "zip":
    case "tar":
    case "gz":
      return "📦";
    case "mp4":
    case "webm":
    case "mov":
      return "🎞";
    case "ply":
      return "✨";
    case "obj":
      return "📐";
    default:
      return "📁";
  }
}

function labelForHost(host: string): string {
  switch (host) {
    case "vercel-blob":
      return "Vercel Blob";
    case "google-drive":
      return "Google Drive";
    case "google-photos":
      return "Google Photos";
    case "public-static":
      return "studio static";
    case "external":
      return "external";
    default:
      return host;
  }
}

export { BlendAsset };
