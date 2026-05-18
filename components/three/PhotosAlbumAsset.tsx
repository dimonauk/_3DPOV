/**
 * <PhotosAlbumAsset id="..." /> — registry-backed Google Photos
 * album link card.
 *
 * Google Photos shared albums are the studio's photo archive. Single
 * image URLs are unstable + auto-resized; album links survive. This
 * component surfaces the album as a link card. For inline embedding
 * of a specific image, mirror that image to Vercel Blob and use a
 * plain <img> or <Image> instead.
 */

import { getAsset } from "lib/assets/resolve";

export type PhotosAlbumAssetProps = {
  id: string;
  /** Override the label. Falls back to the registry name. */
  label?: string;
  /** Optional copy explaining what's in the album. */
  hint?: string;
};

export default function PhotosAlbumAsset({
  id,
  label,
  hint,
}: PhotosAlbumAssetProps) {
  const asset = getAsset(id);

  if (!asset) {
    return (
      <div className="photos-album-missing">
        Asset not found: <code>{id}</code>
        <style>{`
          .photos-album-missing {
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

  if (asset.host !== "google-photos") {
    return (
      <div className="photos-album-wronghost">
        <code>{id}</code> is hosted on {asset.host}, not Google Photos —
        use a different component.
        <style>{`
          .photos-album-wronghost {
            padding: 0.85rem 1rem;
            border: 1px dashed #c80;
            border-radius: 0.5rem;
            color: #c80;
            font-family: system-ui, sans-serif;
            font-size: 0.85rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <a
      href={asset.url}
      target="_blank"
      rel="noopener noreferrer"
      className="photos-album-card"
    >
      <div className="photos-album-icon">🖼</div>
      <div className="photos-album-body">
        <div className="photos-album-name">{label ?? asset.name}</div>
        <div className="photos-album-meta">
          Google Photos album {asset.tags && asset.tags.length > 0
            ? `· ${asset.tags.join(", ")}`
            : ""}
        </div>
        {hint ? <div className="photos-album-hint">{hint}</div> : null}
        <div className="photos-album-cta">Open album →</div>
      </div>

      <style>{`
        .photos-album-card {
          display: flex;
          gap: 1rem;
          align-items: center;
          padding: 1rem 1.2rem;
          border: 1px solid rgba(255, 180, 220, 0.25);
          background: rgba(0, 0, 0, 0.25);
          border-radius: 0.75rem;
          font-family: system-ui, -apple-system, sans-serif;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          margin: 1rem 0;
          transition: border-color 0.15s;
        }
        .photos-album-card:hover {
          border-color: rgba(255, 180, 220, 0.55);
        }
        .photos-album-icon {
          font-size: 2rem;
          line-height: 1;
        }
        .photos-album-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .photos-album-name {
          font-weight: 600;
          font-size: 0.98rem;
        }
        .photos-album-meta {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.04em;
        }
        .photos-album-hint {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
        .photos-album-cta {
          align-self: flex-start;
          color: #ffb4dc;
          font-size: 0.82rem;
          margin-top: 0.2rem;
          font-weight: 600;
        }
      `}</style>
    </a>
  );
}

export { PhotosAlbumAsset };
