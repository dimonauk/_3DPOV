# Asset hosting — meshes, blends, larger media

Holoflow Studio's hosting strategy for the catalogue of 3D meshes,
Blender project files, scans, and any media too heavy to ship in a
git commit. Goal: keep Vercel + Namecheap lean (avoid blowing
bandwidth + build-size + Vercel Blob storage caps) while still being
able to surface every asset via a stable URL on the site.

## The split

The studio uses four hosts, picked by file size + access pattern + the
kind of thing being stored:

| Host | When | Why |
| --- | --- | --- |
| **Repo static** (`/public/<path>`) | < 1 MB, near-every-page-load | Edge-cached forever, zero infra. Tied to deploys. |
| **Vercel Blob** | 1 MB – 50 MB, viewer-facing | Low-latency edge, cheap until you hit the per-month bandwidth quota. Lives outside the git tree so it doesn't bloat the build. |
| **Google Drive (public link)** | > 50 MB downloads + 3D / Blender / archives | Free hosting + bandwidth, no Vercel impact. Direct-download URL pattern works for downloads + most browser renders. Some streaming use-cases need a CORS proxy. |
| **Google Photos (shared album)** | Photo + video galleries | Where the studio already keeps its photo archive. Best as **album links** — single-photo direct URLs are unstable + auto-resized. For an article that needs to embed a specific image inline, mirror that image to Vercel Blob (small) or Drive (large). |

The **50 MB** cut is the soft boundary. The hard boundary is the
**4.5 MB Vercel function-body limit** for browser-direct-blob uploads
— anything bigger than that needs the upload-token pattern we already
use for the wardrobe + card-scan flows.

## Per-extension defaults

| Extension | Typical size | Default host |
| --- | --- | --- |
| `.glb` mesh (printable) | 1–20 MB | Vercel Blob |
| `.glb` mesh (full quality) | 20–100 MB | Vercel Blob OR Drive |
| `.obj` + `.mtl` + textures | varies (often archive) | Drive |
| `.stl` (printable) | 0.5–10 MB | Vercel Blob |
| `.ply` Gaussian splat | 50–500 MB | Drive |
| `.usdz` (iOS AR) | 1–15 MB | Vercel Blob |
| `.vrm` (avatar) | 30–60 MB | Vercel Blob (existing pattern — `data/wardrobe.json`) |
| `.blend` (project) | 50 MB–2 GB | Drive |
| `.mp4` (preview clip) | 5–50 MB | Vercel Blob |
| `.mp4` (full quality) | 50 MB+ | Drive (or external CDN) |
| `.zip` / `.tar.gz` source bundle | 10 MB+ | Drive |
| `.png` / `.jpg` hero | < 5 MB | Repo static (`/public/`) |

## Registry shape

Every asset has an entry in `data/assets.json` (canonical source of
truth):

```json
{
  "id": "poi-rig-mk7",
  "name": "POI Rig Mk7 — printable",
  "kind": "mesh",
  "format": "glb",
  "bytes": 8438216,
  "host": "vercel-blob",
  "url": "https://lglvkyusmzhrkrbk.public.blob.vercel-storage.com/meshes/poi-rig-mk7.glb",
  "licence": "studio-proprietary",
  "tags": ["poi", "rig", "printable"]
}
```

For Google Drive entries, use `driveId` + a synthesised `url`:

```json
{
  "id": "studio-bench-blend",
  "name": "The Bench — full Blender project",
  "kind": "blend",
  "format": "blend",
  "bytes": 412503040,
  "host": "google-drive",
  "driveId": "1aBcDeFgHiJkLmNoPqRsTuVwXyZ_example",
  "url": "https://drive.google.com/uc?export=download&id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ_example",
  "licence": "studio-proprietary",
  "tags": ["bench", "scene", "blender"]
}
```

The `url` field is the **canonical embed/download link** — the
helper in `lib/assets/resolve.ts` normalises Drive IDs to the
direct-download URL form, but having both lets you swap a Drive
file's id without touching consumers.

## Resolving an asset in code

```tsx
import { getAsset, assetUrl } from "lib/assets/resolve";

const rig = getAsset("poi-rig-mk7");
//        ^? Asset | null

const url = assetUrl("poi-rig-mk7");
//          ^? string | null
```

For embedding a mesh in a page:

```tsx
import { MeshAsset } from "components/three/MeshAsset";

<MeshAsset id="poi-rig-mk7" alt="POI Rig Mk7 printable" />
```

`<MeshAsset>` wraps `<model-viewer>` and lazy-loads from the resolved
URL. For larger meshes hosted on Drive, the component fetches via a
proxy route (`/api/assets/proxy/[id]`) that follows the Drive
redirect server-side so the browser doesn't fight Drive's
Content-Disposition headers. The proxy is fire-and-forget — it
streams the bytes, doesn't transform them, doesn't cache (Drive
caches better than we do).

## Adding a new asset

### Small (< 50 MB) — Vercel Blob

1. Upload via the existing pattern (Wardrobe upload page at
   `/admin/wardrobe` is the cleanest example; the same flow would
   work for any kind of binary).
2. Copy the resulting Blob URL.
3. Append an entry to `data/assets.json`:

   ```json
   { "id": "<slug>", "name": "...", "kind": "mesh", "format": "glb",
     "bytes": <bytes>, "host": "vercel-blob", "url": "<blob-url>",
     "licence": "..." }
   ```

4. Commit + push.

### Large (> 50 MB) — Google Drive

1. Upload to a Drive folder named **Holoflow / Assets**.
2. Right-click the file → **Share** → set link permission to
   **Anyone with the link can view**.
3. Copy the file id from the share URL
   (`https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing` —
   `FILE_ID` is the path segment between `/d/` and `/view`).
4. Append an entry to `data/assets.json`:

   ```json
   { "id": "<slug>", "name": "...", "kind": "blend", "format": "blend",
     "bytes": <bytes>, "host": "google-drive",
     "driveId": "<FILE_ID>",
     "url": "https://drive.google.com/uc?export=download&id=<FILE_ID>",
     "licence": "..." }
   ```

5. Commit + push.

## Why this doesn't wreck Vercel + Namecheap

- **Namecheap** only does DNS for `holoflow.co.uk`. It's not a
  hosting boundary. Assets never live on Namecheap.
- **Vercel** hosts the Next.js build output. Big assets in `/public/`
  bloat every deploy (Vercel re-uploads them on every push). Big
  assets on Vercel Blob avoid the deploy bloat but still count
  toward the Blob storage cap + the egress bandwidth meter.
- **Google Drive** is outside both. A `.blend` file on Drive linked
  from `data/assets.json` adds ~200 bytes to the deploy and zero
  bandwidth to Vercel. The visitor's browser fetches direct from
  Drive's CDN.

This keeps the deploy lean (faster builds, smaller bandwidth bill)
and means a single 2 GB Blender file doesn't ever transit Vercel
infrastructure. The registry is the contract; the host is an
implementation detail.

## What this is not

- **Not a CMS.** No editor UI on the site for adding assets. Operator
  edits `data/assets.json` by hand or via a future `/admin/assets`
  surface. Wardrobe's `/admin/wardrobe` is the precedent.
- **Not authenticated.** All asset URLs in the registry are
  publicly-shareable. Things that need to be private don't go in this
  registry.
- **Not a substitute for Vercel Blob's existing wardrobe + scan
  flows.** Those use their own collections (`wardrobe/`, `scan-temp/`)
  with specific upload tokens + lifecycle. The asset registry is the
  generic catch-all for everything else.
- **Not streaming-optimised.** For 4K video that needs DASH/HLS
  streaming, use Mux or Cloudflare Stream instead. The Drive proxy is
  for downloads + browser-render of GLBs, not for video streaming.

## Future work

- `<MeshAsset>` and `<BlendAsset>` components.
- `/api/assets/proxy/[id]` route for Drive-hosted assets that need
  CORS.
- `/admin/assets` surface to add + edit registry entries without
  touching JSON by hand.
- Per-asset licence enforcement (right-click → "this asset is
  CC-BY-NC; click for attribution string").
- Mirror-to-Drive job: a cron that backs up the Vercel Blob
  collection to a Drive folder weekly, so we never depend on a
  single host.
