"use client";

/**
 * app/admin/assets/assets-form/mode-photos.tsx
 *
 * Google Photos album mode. Operator pastes a single album URL;
 * the page records it verbatim. Photos auto-resizes single images
 * but preserves albums, so this is the mode for galleries.
 */

export type ModePhotosProps = {
  photosUrl: string;
  setPhotosUrl: (v: string) => void;
};

export function ModePhotos(p: ModePhotosProps) {
  return (
    <section className="aa-form">
      <h2>Photos album link</h2>
      <label className="aa-row">
        <span className="aa-label">Album URL</span>
        <input
          type="text"
          value={p.photosUrl}
          onChange={(e) => p.setPhotosUrl(e.target.value)}
          placeholder="https://photos.app.goo.gl/..."
        />
        <span className="aa-hint">
          Album links survive Photos&rsquo; auto-resizing. Single-image direct
          links don&rsquo;t — mirror those to Blob instead.
        </span>
      </label>
    </section>
  );
}
