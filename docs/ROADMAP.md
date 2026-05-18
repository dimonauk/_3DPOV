# Holoflow Studio — Long-running roadmap

Where the magazine + creative-tools + people-network ambition is going.
Captured here so any agent picking up a future session can see the
polaris and pick the next gap to fill.

## North star

> "Adobe + Meta — for the studio's working scenes. A knowledge base
> with a simulation layer and a social layer on top."

Three layers, deeply intertwined, all on one site, one voice:

### 1. Knowledge base — read

Real, verified, structured information about every scene, person,
tool, and method the studio touches. The magazine half.

- Articles, journal, tutorials, codex, gallery, guide.
- Who's-who series — one per UK scene.
- Private rolodex (Dimona + subscribers) with deep profiles.
- Method + stack pairs (OSINT, emulation, splat capture, etc.).
- Cross-referenced, cited, linked out. Public sources only.

### 2. Simulation layer — interact

Every "thing" the knowledge base names has an *executable* / *runnable*
form on the site. The Adobe half plus the agentic half.

- **People → agentic representations** at `/agents/<slug>`. Each
  rolodex entry has an AI agent built from their public output (and
  fuller representation when opt-in). Visitors and subscribers can
  ask their agent a question, see their digest, find connection
  moments. The agent is the public-facing twin; the person remains
  the person.
- **Objects → AR cards + 3D meshes + USDZ models** via the asset
  registry and the AR card flow.
- **Crafts → atelier tools** (sculpture gallery, isosurface, silk
  brush, image-to-mesh, ComfyUI bridges, sharp-onnx, splat360).
- **Performers → VRM avatars + wardrobe**. The studio's own
  performer-twins.
- **Scenes → VR walkthroughs + splat captures of venues**. The OXO
  foreshore as a splat. The Hive as a splat. Leake Street as a
  splat.
- **The studio's cognitive system → DollyOS Aura** — the platform's
  resident character, present across the simulation layer.

### 3. Social — connect

The thing that turns the first two layers into a network.

- `/people/<slug>` profiles (subset of the rolodex, by consent).
- `/posts` microblog feed (the studio's own).
- `/groups/<slug>` community spaces around scenes.
- `/events/<slug>` meets + festivals calendar.
- `/messages` DMs.
- ActivityPub federation — `/users/<handle>` AS2 endpoint.
- RSS / Atom feeds for syndication.
- Subscriber tier — auth-gated deeper access (rolodex, agent chat,
  group spaces).

Built in skeleton form first, gaps filled session by session.

## The slow continuous build

Every session a future agent or Dimona picks up is meant to either:

1. **Fill an existing skeleton** — add a who's-who scene, a tool
   tutorial, a rolodex profile, a deeper bio.
2. **Add a new skeleton** — sketch the next surface (social feed,
   per-person agent, RSS, federation) at minimum-viable structure.
3. **Refine an existing piece** — refresh a who's-who into a fresher
   editorial format, deepen citations, fix the never-list scrub.

The constraint: **best-practice + modular**. Each addition stands on
its own, uses the existing patterns (Entry registry, capabilities
registry, the `lib/` shapes), doesn't bake hard couplings.

## Skeleton state — May 2026

What exists in some form:

- `/articles` — long-form, registered in `lib/articles.tsx`. Houses
  the who's-who series.
- `/journal` — first-person, intimate register.
- `/tutorials` — teaching.
- `/codex` — definitions.
- `/guide` — page-based Hitchhiker's-flavoured reader.
- `/gallery` — Photos albums via the asset registry.
- `/whoswho` — index of the who's-who series (rolodex root).
- `/bureau` — print bureau (Stripe-gated, credentials slot).
- `/atelier/*` — generative tools (sculpture gallery, isosurface,
  silk-brush, etc.).
- `/admin/*` — operator surfaces (wardrobe, assets, library,
  upload, bureau, printfiles).
- The capabilities registry in `lib/capabilities/*` mapping the
  studio's avenues to runnable capabilities.

What's documented but not built:

- A magazine front-page that ties /articles, /journal, /whoswho,
  /gallery into one editorial cover.
- An RSS / Atom feed at `/feed.xml`.
- A `/scenes/<scene>` route that pulls everything (articles, journal
  entries, gallery albums, who's-who) tagged with the scene into one
  view.
- Per-person profile pages (`/people/<slug>`) that surface from the
  private rolodex's *publishable* fields. Subscriber-gated for
  fuller fields.
- An "agent per person" surface (`/agents/<slug>`) — every rolodex
  entry gets a persistent agent that watches their public output and
  surfaces a digest. Stub it; build later.
- A creator-side social feed (`/feed` or `/posts`) — the studio's
  microblog, with ActivityPub federation as a later milestone.
- Auth-gated subscriber tier surfaces (rolodex emails, deeper bios,
  outreach state). Auth exists; the gate doesn't.

## The who's-who queue

Tracked in `docs/CONTENT-MILL.md` under the runtime registry table.
Already written: fire-art photographers, light painters, motion
capture, VR people, AR people. Each in a different format on
purpose.

Queued (one per session, distinct format from the registry):

| Scene | Slug | Format |
| --- | --- | --- |
| POV / spinning LED | `whos-who-uk-pov-led` | `by-axis-of-rotation` |
| LED programming | `whos-who-uk-led-programming` | `by-tool` |
| Pixel artists | `whos-who-uk-pixel-artists` | `by-venue` |
| VRM avatar makers | `whos-who-uk-vrm-makers` | `taxonomy-of-bodies` |
| Projection / VJ | `whos-who-uk-projection` | `by-venue` |
| Holography | `whos-who-uk-holography` | `glossary-as-essay` |
| Generative jewellery | `whos-who-uk-jewellery` | `signature-move` |
| Drone art | `whos-who-uk-drones` | `chapter-marks` |
| Generative AI / ComfyUI | `whos-who-uk-generative-ai` | `time-of-day` |
| Splat / 360 / photogrammetry | `whos-who-uk-splat-360` | `walking-tour` |
| 3D printing | `whos-who-uk-3d-printing` | `index-cards` |
| Live performance / circus | `whos-who-uk-performance` | `field-notes` |
| Writers covering the scene | `whos-who-uk-writers` | `letter-from` |

Spawning an agent for any of these: pull its slug + format from the
table, fill the meta-brief template in `docs/CONTENT-MILL.md`, run.

## The tutorial stacks

Each tutorial stack pairs **methods article** + **stack article** +
**install walkthrough**. Pattern:

| Stack | Methods article | Stack article | Install walkthrough |
| --- | --- | --- | --- |
| OSINT | `osint-for-finding-your-people` | `the-osint-stack-for-creative-research` | (todo) |
| Emulation | `emulation-as-a-creative-tool` | `the-emulation-stack-for-creative-research` | (todo, agent running) |
| 3D printing | (todo) | (todo) | (todo) |
| Light painting | (todo) | (todo) | (todo) |
| Splat capture | (todo) | (todo) | (todo) |
| VRM / wardrobe | (todo) | (todo) | (todo) |
| Generative ComfyUI | (todo) | (todo) | (todo) |
| AR cards | (todo) | (todo) | (todo) |

Pattern is portable: every stack is a 3-piece set.

## The private side (`holoflow-private` repo, sibling to `_3DPOV`)

What goes there (none of this gets pushed to the public site):

- `rolodex/rolodex.json` — structured index of every person.
- `rolodex/people/<slug>.md` — deep per-person profile (public-info
  only).
- `osint/` — research scripts + working notes + snapshots of
  important pages.
- `outreach/` — sent-email log + reply tracker (paired with
  `docs/OUTREACH-EMAILS.md` templates).

Pattern: private repo holds Dimona's working notes; public site
holds the magazine. Subscriber gate lets a future tier see selected
fields from the private rolodex without leaking the whole thing.

## The social / network half (sketch)

Skeleton for the Adobe+Meta ambition:

- `/people/<slug>` — public profile page per person in the rolodex
  (subset of the private profile, by their consent).
- `/posts` — chronological microblog feed, the studio's own
  Instagram/Twitter alternative.
- `/groups/<slug>` — community spaces around scenes (fire-art,
  light-painting, VR, etc.).
- `/events/<slug>` — calendar of meets + festivals (LFS OXO, the
  Hive, Leake Street, etc.).
- `/messages` — DMs.
- ActivityPub support — `/users/<handle>` AS2 endpoint so the studio
  federates outwards to Mastodon / Pixelfed / etc.

Per-person agent (`/agents/<slug>`):

- A persistent agent assigned to each rolodex entry.
- Watches their public output (RSS, social).
- Surfaces a digest for Dimona ("X posted a new piece on Monday").
- Available to the person themselves (subscriber-gated): an AI
  sidekick that knows their public archive + can help them post,
  draft, organise.
- Adobe-style creator assistant, Meta-style social agent.

## The luxury-magazine design pass

Pending. Applies to `/articles/<slug>` first, then `/whoswho`, then
`/journal`. Editorial typography (kickers, deks, dropcaps, pull
quotes, hairline rules), generous whitespace, slow rhythm.
References: The Gentlewoman, Cereal, Wallpaper*, 032c. Studio
palette stays (`warm-black-*`, `chrome-*`, `pink-200`).

## RSS + Atom

Site-wide and per-section feeds. Standard Next.js route handlers
emitting XML. Trivial to add; high leverage for federation +
syndication.

## Agent-resumability conventions

For an agent picking up this repo cold:

1. Read `AGENTS.md` (root + per-directory) for the signpost.
2. Read `docs/CONTENT-MILL.md` for the voice + format registry.
3. Read this file for the long-running roadmap.
4. Read the `holoflow-voice` skill for voice depth.
5. Pick a queued item from the tables above.
6. Use the meta-brief template; spawn the work.
7. Register output in `lib/articles.tsx` / `lib/journal.tsx` /
   `lib/tutorials.tsx` as appropriate.
8. Commit + push to `claude/skeleton-build`.
9. Update this roadmap.

## Open-source leverage

The platform is mostly an integration of existing open-source upstreams,
not a from-scratch build. Every studio avenue maps to 1-3 OSS projects
that, when plugged in, become a `/something` route on the site. The
pattern: pick the next slot from this table, wire the upstream behind
a thin component, ship.

### Already wired

| Project | Licence | Where it lives | What it gives |
| --- | --- | --- | --- |
| Next.js 15 | MIT | core framework | App Router, PPR, useCache |
| EmulatorJS + libretro WASM cores | GPL | `/emulator/[system]` | 23-system BYO-ROM browser emulator |
| Maigret | MIT | `D:/Tools/osint/.venv` | username sweep across 2,500+ platforms |
| ExifTool | Perl/Artistic | local install path | image metadata extraction |
| model-viewer | Apache 2 | `components/three/MeshAsset.tsx` | AR cards + 3D embed |
| mind-ar-js | MIT | `lib/capabilities/ar/` | image-target AR compilation |
| Three.js + R3F | MIT | atelier scenes, splat viewer | 3D rendering |
| Sharp + @napi-rs/canvas | MIT | server-side image | thumbnail / OG / print pipelines |
| Firebase Admin SDK | Apache 2 | `lib/firebase/admin.ts` | auth + Firestore |
| @vercel/blob | Apache 2 | asset registry, wardrobe | binary storage |
| Stripe (REST) | proprietary | `lib/stripe/server.ts` | bureau payments |
| Resend | proprietary | transactional email | receipts + outreach |
| `dollyos-comfyui-3d` bridge | n/a | bench bridge | ComfyUI workflows |
| Blender MCP | GPL | bench bridge | fabrication renders |

### Lined up but not yet site-integrated

| Project | Slot it fills | Status |
| --- | --- | --- |
| Hekate + Atmosphère + Lockpick_RCM + NXDumpTool | Switch personal-dump workflow | documented privately in `holoflow-private/docs/switch-personal-dumping.md`, never on the public site |
| Sherlock + Spiderfoot + Bellingcat toolkit | extended OSINT | covered in `/articles/the-osint-stack-for-creative-research`; not installed |
| Pixelorama (Godot pixel-art editor) | pixel art atelier | already installed at `%APPDATA%/Pixelorama/extensions/`; no `/atelier/pixel-studio` route yet |
| FreeMoCap + EasyMocap + Mediapipe | motion capture | covered in motion-capture who's-who; no in-site capability |
| OctoPrint + Mainsail + Klipper | 3D printer monitoring | not yet a site-side surface |

### Big open slots (one-route-per-session plays)

| Domain | Project | What it would give us | Route it'd land at |
| --- | --- | --- | --- |
| ActivityPub federation | **Fedify v2 + `@fedify/next`** (fedify-dev/fedify, MIT) — official Next.js integration; `fedify init -w next` scaffolds; debug dashboard + relay support | federated profile + posts to Mastodon / Pixelfed | `/users/<handle>` AS2 endpoint + inbox/outbox |
| Local LLM | **Ollama** (already on bench) + **`ai-sdk-ollama`** (jagreehal, Vercel AI SDK v6 provider — type-safe, cross-provider through the gateway) | per-person agent chat behind `/agents/<slug>` | `/api/agents/[slug]/chat` (streamText) |
| Social aggregation | **feedsmith** (macieklamberski, MIT, TS-native RSS/Atom/JSON/OPML parser with full TS types) + Bluesky AT-proto API + Mastodon API | parse + normalise per-person social output into one feed | `/feed` aggregator + `/api/cron/refresh-feeds` |
| AI provider abstraction | **Vercel AI SDK + AI Gateway** | one gateway, multi-provider, observability | `lib/ai/` |
| 3D splat web view | **Spark.js** (`@sparkjsdev/spark`, MIT) — WIRED at `/splats` | in-browser splat rendering | `/splats/[id]` |
| Splat editor | **SuperSplat** (PlayCanvas, MIT) | trim, recolour, optimise a `.ply` capture | `/atelier/splat-editor` |
| Pixel art on site | **Pixilart-clone projects** / Aseprite-like WASM | tile + sprite editing in browser | `/atelier/pixel-studio` |
| Tilemap editor | **LDtk** (free) | tile-grid arrangement, level editing | `/atelier/tilemap` |
| LED programming sandbox | **WLED** firmware + browser controller | live LED programming preview | `/atelier/led-sandbox` |
| Vector store | **pgvector** (Postgres) or **Qdrant** | knowledge-base retrieval for rolodex + magazine | `/api/search/semantic` |
| Indieweb federation | **microformats2** + **WebSub** | magazine federates outwards, gets followed back | `<head>` markup + `/api/websub` |
| Static fediverse bridge | **Bridgy Fed** | bridge holoflow.co.uk's static articles to ActivityPub | external service, configure once |
| Server sandbox | **Vercel Sandbox** (GA 2026) | run user-uploaded scripts (ComfyUI workflows, etc.) safely | `/api/sandbox/run` |

### Pattern for slotting a new open-source upstream

1. Pick a slot from the "big open" table.
2. Read the upstream's quickstart + licence; verify the licence is
   compatible (MIT / Apache 2 / GPL with attribution).
3. Add the package (`pnpm add <name>`) or pull the source where
   relevant.
4. Build a thin component wrapping it, mirroring the
   `components/emulator/EmulatorJsEmbed.tsx` pattern (client
   component + a typed registry + a per-instance route).
5. Add a tutorial article in `components/tutorials/entries/` that
   walks a reader through what it does + how to use it.
6. Register the article + the capability if it goes through
   `lib/capabilities/`.
7. Update the "Already wired" table in this file.

## Why this is structured for slow burn

Dimona has named the cadence: "skeleton it, start filling gaps. step
by step. im just envisioning the end point in a perfect world, i
know its a long project." The patterns here are designed so:

- Every session ships a real, complete piece (an article, a profile,
  a route, a tutorial) — not partial WIP.
- Each piece compounds — adding a who's-who entry strengthens the
  rolodex, which strengthens the magazine, which strengthens the
  outreach loop.
- The skeleton-first principle means new ambition can be stubbed at
  minimum-viable structure today and built out later.
- Voice + design discipline holds across additions — one voice,
  many shapes; one site, many rooms.
