/**
 * app/gallery/gallery/styles.ts — Scoped CSS for the photo-gallery
 * index + detail surfaces. CSS string registry, exempt from the
 * 300-line cap per ARCHITECTURE.md Rule 1.
 *
 * The `gal-*` prefix is unique to /gallery, so injecting via
 * `<style>` is safe.
 */

export const GALLERY_STYLES = `
  .gal-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin-top: 3rem;
  }
  @media (min-width: 720px) {
    .gal-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1080px) {
    .gal-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5rem;
    }
  }
  .gal-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.4rem 1.4rem 1.25rem;
    border: 1px solid rgba(255, 180, 220, 0.18);
    background: rgba(0, 0, 0, 0.28);
    border-radius: 0.85rem;
    color: rgba(255, 255, 255, 0.92);
    text-decoration: none;
    transition: border-color 0.18s ease, transform 0.18s ease,
      background 0.18s ease;
  }
  .gal-card:hover {
    border-color: rgba(255, 180, 220, 0.55);
    background: rgba(255, 180, 220, 0.05);
    transform: translateY(-2px);
  }
  .gal-card:focus-visible {
    outline: 2px solid #ffb4dc;
    outline-offset: 3px;
  }
  .gal-card-eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
  }
  .gal-card-name {
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.3;
    color: rgba(255, 255, 255, 0.95);
  }
  .gal-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.15rem;
  }
  .gal-tag {
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: rgba(255, 180, 220, 0.1);
    color: rgba(255, 200, 230, 0.92);
    border: 1px solid rgba(255, 180, 220, 0.2);
  }
  .gal-card-cta {
    margin-top: auto;
    padding-top: 0.5rem;
    color: #ffb4dc;
    font-size: 0.82rem;
    font-weight: 600;
  }
  .gal-empty {
    margin-top: 3rem;
    padding: 2rem 1.5rem;
    border: 1px dashed rgba(255, 180, 220, 0.3);
    border-radius: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.92rem;
    text-align: center;
  }
  .gal-detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.5rem;
    font-size: 0.78rem;
  }
  .gal-licence {
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: rgba(255, 180, 220, 0.12);
    color: rgba(255, 210, 235, 0.95);
    border: 1px solid rgba(255, 180, 220, 0.3);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.7rem;
  }
  .gal-attribution {
    margin-top: 1.5rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.65);
    font-style: italic;
  }
  .gal-related {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .gal-related-label {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.65rem;
  }
  .gal-related-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .gal-related-tag {
    font-size: 0.78rem;
    padding: 0.25rem 0.7rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.35);
    color: rgba(255, 200, 230, 0.92);
    border: 1px solid rgba(255, 180, 220, 0.25);
    text-decoration: none;
  }
  .gal-related-tag:hover {
    border-color: rgba(255, 180, 220, 0.55);
    background: rgba(255, 180, 220, 0.08);
  }
`;
