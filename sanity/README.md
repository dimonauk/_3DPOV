# Sanity Studio — Holoflow

Optional CMS scaffold. Runs in parallel to the Vercel Blob + Firestore
media stack. Each path is operator's choice; the site reads from
whichever has been configured.

## What this directory holds

- `sanity.config.ts` — Studio configuration consumed by the embedded
  Studio at `/studio`.
- `schemas/` — document types: `photo`, `video`, `pano360`,
  `articleImage`, `codexImage`. Each is structurally compatible with
  the canonical `Media` shape at
  `lib/capabilities/media/library-types.ts`.
- `sanity-shim.d.ts` — minimal ambient types so the project type-checks
  before the `sanity` package is installed. Superseded by the real
  package on install.

## Console setup

1. Create a project at <https://sanity.io/manage>. Note the project ID
   and dataset name (default: `production`).
2. Add an API token. Project settings → API → Tokens → "Add API
   token". Permissions: Viewer. Copy the secret.
3. Add a webhook. Project settings → API → Webhooks → "Create
   webhook":
   - URL: `https://holoflow.co.uk/api/sanity/revalidate?secret=<your-shared-secret>`
   - Filter: `_type in ["photo","video","pano360","articleImage","codexImage"]`
   - Projection: `{"_type": _type, "_id": _id, "slug": slug.current}`
   - Trigger: Create, Update, Delete.
4. Add `https://holoflow.co.uk` and `http://localhost:3000` to the
   project's CORS origins (Studio embed + API reads).

## Local environment

Set in `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_READ_TOKEN="your-viewer-token"
SANITY_REVALIDATE_SECRET="your-shared-webhook-secret"
```

## Running the embedded Studio

```
pnpm add sanity styled-components
pnpm dev
```

Then visit `http://localhost:3000/studio`. The Studio prompts for a
Sanity sign-in (Google or GitHub) on first use; subsequent sessions are
authenticated by the Sanity project's own auth, separate from the site's
Firebase auth.

## Posture

- Scaffold-only. Lifting existing static registries (photographs,
  articles, codex entries) into Sanity is not included here; do that on
  a per-surface basis if and when the operator decides Sanity is the
  authoring path for that surface.
- Lazy + tolerant. Without the env vars, the Studio renders a "not
  configured" panel and the reader functions return empty arrays. The
  rest of the site keeps working.
