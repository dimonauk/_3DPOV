# SDF fonts for `MeshProseLayer`

troika-three-text consumes TTF/WOFF/WOFF2 directly — not the
`typeface.json` blobs the display-text `MeshText3D` path uses. The
SDF body-text system in `lib/type3d/sdf-text.ts` expects three
files here:

  - `inter.woff` — body sans (default)
  - `jetbrains-mono.woff` — monospace blocks
  - `cormorant-garamond.woff` — display fallback

If a file is missing at runtime, troika falls back to its bundled
Roboto so the page never goes blank. The first `MeshProseLayer`
mount logs a console warning that names the missing file so the
operator can drop it in.

Licences for whichever font files end up here belong in
`public/fonts/LICENSE`.
