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
