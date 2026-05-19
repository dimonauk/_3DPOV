# scripts/ — signpost

One-off CLI tools the operator runs from PowerShell on Sovereign-PC,
or from a terminal in the repo on any machine. All are Node ESM
(`.mjs`) or TypeScript (`.ts`) with shebangs.

## What's here

| File | Purpose | Run via |
|---|---|---|
| `ar-build-all.mjs` | Build every AR card asset bundle (.glb + .mind + QR + card-front) | `node scripts/ar-build-all.mjs <slug>` |
| `ar-build-card.mjs` | Build assets for a single card | `node scripts/ar-build-card.mjs <slug>` |
| `ar-compile-mind.mjs` | Compile a single .mind image-target binary | `node scripts/ar-compile-mind.mjs <slug>` |
| `ar-compile-mind-from-bytes.mjs` | Stdin-PNG → stdout-.mind subprocess variant | called by `lib/capabilities/ar/compile-target.server.ts` |
| `ar-generate-batch-qr.mjs` | Batch QR PNG generation across cards | `node scripts/ar-generate-batch-qr.mjs` |
| `ar-generate-card-front.mjs` | Render the card-front PNG via @napi-rs/canvas | called from build pipeline |
| `ar-generate-glb.mjs` | Wrap a model into the AR card .glb format | called from build pipeline |
| `ar-generate-qr.mjs` | Single QR PNG | utility |
| `cards-bulk-upload.mjs` | Push card metadata to Firestore in batch | `node scripts/cards-bulk-upload.mjs <json-file>` |
| `cctv-download-matched.ts` | Pull CCTV frames matched by SHARP for splat reconstruction | tsx scripts/cctv-download-matched.ts |
| `patch-mind-ar.mjs` | Postinstall — patch mind-ar bundle for Node 25 + sRGBColorSpace fix | runs automatically via postinstall hook |
| `sort-equirectangulars.mjs` | Sort a folder of photos into equirect/regular by aspect ratio | `node scripts/sort-equirectangulars.mjs <input-dir>` |

Each `*.md` sibling explains the script in more depth — read those
before running anything destructive.

## Conventions

1. **`#!/usr/bin/env node` shebang** + executable bit (`chmod +x`).
2. **`--help` / `-h` flag** prints usage + exits 0.
3. **`--dry-run`** for any script that writes files or makes
   external API calls. Default to dry-run if the user passes no
   args at all (or print usage).
4. **Exit codes:** 0 success, 1 fatal error (bad args, missing deps),
   2 expected-but-empty (no files matched, no work to do).
5. **`console.log` is OK here** (these are CLI tools, not server
   code; no namespacing needed).
6. **Sibling `.md` doc** explaining what the script does + examples.

## When to add a new script

The script is the right shape when:
- Operator runs it on a directory of files
- It's a one-shot batch operation (not a server-resident background task)
- It needs Node-only deps (sharp, mind-ar, ffmpeg) that don't belong in
  the Next.js bundle

When NOT to make it a script:
- If a route handler can do the same job on-demand from the operator
  console, prefer that (better UI, no shell access needed)
- If it's a recurring task, write a Vercel cron route under
  `app/api/cron/` instead

## Related

- `python-services/` — long-running bench-side services (FastAPI),
  not one-shot scripts
- `lib/capabilities/` — capabilities that run on the Vercel server
  side, not the operator's machine
