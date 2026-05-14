# upload-media.ts — Purpose

## What it does

A Node CLI that stages a folder of files into `public/<subject>/<slug>/` and writes a `Media`-shaped JSON sidecar next to each file (`<filename>.meta.json`), plus a `_INDEX.md` summary. Files are sanitised to kebab-case-lowercase-ASCII, hashed (sha256), and tagged with kind/mimeType inferred from extension unless overridden.

Output is committable, ships with the static build, and is intentionally **not** wired into Firestore or Vercel Blob. The sidecar shape matches `Media` from `lib/capabilities/media/library-types.ts`, so a future migration script can promote these records into Firestore via the `mediaUpload` capability without re-deriving anything.

## When to use this vs the admin UI

Use this CLI when:

- You have a folder of files already on disk (shoot dumps, archive pulls, draft assets).
- You want the files to live under `public/` and ship with git — i.e. the studio is reviewing them before they go public.
- The forthcoming admin UI isn't deployed yet, or you want to bypass it for a bulk import.

Use the admin UI (forthcoming) when:

- You want files in Vercel Blob with Firestore metadata (so they can be queried, paginated, retired, tagged at runtime).
- The operator uploading is not the repo owner.
- You need server-side variant generation (thumbnails, etc.).

## Sidecar JSON shape

Each file gets `<sanitised-filename>.meta.json` next to it, containing:

```json
{
  "id": "<uuid-v4>",
  "kind": "photo",
  "subject": "holo-walk",
  "source": "public-static",
  "url": "/holo-walk/camden-lock/img-001.jpg",
  "uploadedAt": "2026-05-14T12:00:00.000Z",
  "uploadedBy": "cli:dimonauk@gmail.com",
  "mimeType": "image/jpeg",
  "sizeBytes": 1234567,
  "sha256": "deadbeef…",
  "capturedAt": "2026-05-01"
}
```

Fields match the `Media` type in `lib/capabilities/media/library-types.ts`. Optional fields not yet known (title, description, tags, location, width/height, durationSeconds, variants) are omitted; the migration script or admin edit can backfill them later.

## Invocation

```
pnpm exec tsx scripts/upload-media.ts <source-folder> \
  --subject <subject> --slug <slug> \
  [--kind <kind>] [--captured <iso-date>] [--dry-run]
```

`--subject` must be one of the `MediaSubject` literals; `--slug` must be kebab-case; `--kind` defaults to extension inference. `--dry-run` prints the plan without writing.
