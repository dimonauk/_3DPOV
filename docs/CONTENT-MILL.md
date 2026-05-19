# The Content Mill — automated who's-who + scene article generation

A spec for spinning up scene articles at speed while keeping **one
voice, many shapes**. Captures the studio's voice rules + a registry
of editorial formats + a meta-brief template that any research-and-
write agent can be invoked with.

## The principle

Every who's-who / scene article shares the studio's voice. None of them
share the same skeleton. A reader who lands on three of them in a row
should feel they're in the same magazine; they should not feel they're
reading the same template.

## Voice (always)

The voice is **Princess teaching register** — the studio narrator
addressing the reader, slightly arch, Pratchett-meets-Adams sensibility
without naming them. Anchors:

- Tight, two-clause sentences.
- British spelling throughout.
- Honest scale: never overclaim, never bullshit.
- Real people only, verified by public URL. Never invent.
- Never claim someone taught or mentored Dimona unless verified.
- No public email addresses (private rolodex only).

### Never-list (do not appear in the prose, ever)

> modern era, incorporating, immersive (without specs), leveraging,
> synergy, innovative solutions, cutting-edge, next-generation,
> state-of-the-art, embark on a journey, unlock the power of,
> revolutionary, groundbreaking, game-changing, passionate about,
> empower / empowering, reach out, welcome to, discover,
> delight / delightful, seamless / seamlessly, elevate / elevated
> experience.

If any of these slip in, the agent has dropped voice — rewrite.

### Closing convention

Every who's-who closes with:

1. A gracious one-paragraph tie-off in Princess voice.
2. A cross-link list to **sibling who's-who articles** — `/articles/whos-who-uk-<other-scene>`.
3. A cross-link list to **studio articles** the scene overlaps with.
4. A **Sources / Further Reading** section listing every external URL
   used as a source, grouped by domain. No call-to-action.

### Citation + cross-reference discipline (mandatory on every article)

- **Every claim about a real person** that isn't generic-public-knowledge
  needs a citation — inline link to a public URL (their own site, an
  interview, a press piece, a verified social post).
- **Every external reference** (a tool, a venue, a methodology, a
  named technique) gets linked out the first time it appears.
- **Every studio-article cross-link** uses `/articles/<slug>` absolute
  paths so a Next.js Link can resolve them without a base URL.
- **Sources block at the end** — a structured list of every external
  URL touched, grouped by `domain.tld`. This is the closest thing the
  studio has to a footnote convention and it makes audit fast.
- For research-derived claims, **prefer two independent public sources**
  per claim. If only one source exists, hedge the prose ("according
  to X" rather than asserting).

### Image policy (mandatory)

- **No portraits of named real people** in who's-who articles. The
  point is celebration of their *work*, not their face. Each person's
  own site has their portrait — link to their site, don't mirror it.
- **Example-of-their-work images** are fine when:
  - Embedded via the platform's **official embed code** (Instagram /
    X / YouTube / Flickr oEmbed), which means the image lives on the
    platform and they retain control.
  - Or the practitioner has **explicitly released the image under a
    permissive licence** (Creative Commons, public domain, or a clear
    "free to share with credit" notice on their site).
- **Studio's own photographs** of public scenes (the OXO foreshore at
  long exposure, the Hive's room at low light, etc.) are fine — they
  belong to Holoflow.
- **CC-licensed images from Wikimedia / Unsplash / Flickr CC** are
  fine — credit the photographer + licence + source URL in the
  caption.
- **Every image carries**: caption, photographer credit, licence,
  source URL. No exceptions. If an image can't carry those four, it
  doesn't ship.

## Format registry (the shapes)

Pick a different format for each new article. Don't reuse a format
inside a 3-article window. When the queue grows, reuse is fine as long
as the variety stays visible to the reader.

Each format is a structural conceit. The voice stays constant; the
skeleton changes.

| Slug | Conceit | Best for |
| --- | --- | --- |
| `night-chronicle` | Narrate one night / one shoot from arrival to dawn; name each person as you encounter them. | Scenes that gather in physical space (fire performance, drum circles, projection nights). |
| `six-rooms` | Walk through 5-7 named "rooms" of practice; each room is a sub-discipline with its inhabitants. | Practices with clear sub-disciplines (motion capture, photogrammetry, splat capture). |
| `by-tool` | Taxonomy by the instrument they use. | Crafts where the tool defines the lineage (light painting, LED programming, pixel art). |
| `by-axis-of-rotation` | Taxonomy by the geometry of the work (literal axes). | POV / spinning / kinetic / drone art. |
| `tool-history` | Chronological technology arc; each section is a tool-era + the practitioners working in it. | Tech-led practices (AR, VR, splat, generative AI). |
| `lineages` | 5-7 named "lineages" of thinking; each is a school of approach. | Conceptual practices (VR-as-cognitive-system, generative thinking). |
| `alphabet` | A through Z conceit, with playful gaps where letters don't fit. | Long lists that benefit from playful pacing. |
| `walking-tour` | A geographical route through one city, person-by-person at each stop. | Single-city deep dives. |
| `field-notes` | Diary-style entries from one day visiting / observing the scene. | Performance scenes, street art, festivals. |
| `letter-from` | Addressed to one person but mentions many. | When there's a hero figure who anchors the scene. |
| `signature-move` | Each entry is the one thing they're best known for, named first. | Visual artists with distinctive signatures. |
| `interview-snippets` | One verifiable quote per person + their URL, almost no biography. | When the people are quotable. |
| `index-cards` | Each entry styled as a recipe-card / library-card. | Tactile feel; works well for craft-led scenes. |
| `chapter-marks` | Numbered chapters (1-12) that progress through the scene's history. | Mature scenes with a real history. |
| `by-venue` | Each section a venue/programme; people listed under where they show. | When the venues are the anchors (galleries, festivals). |
| `kindred-pairs` | Pairs of practitioners whose work rhymes; each pair gets a paragraph. | When the scene is dense with cousins. |
| `glossary-as-essay` | Definitions of scene-specific terms, with practitioners exemplifying each. | Crafts with their own vocabulary. |
| `single-image` | Per entry: one image they made (or the photo of their setup) + one paragraph. | Image-rich scenes (need real image URLs from their own sites). |
| `time-of-day` | Organise by when the work happens (3am poi, golden hour, dawn). | Scenes with strong temporal character. |
| `taxonomy-of-bodies` | When the subject is bodies / avatars / performers, group by body-form. | VRM, costume, performance, motion capture. |

## The meta-brief template

Use this verbatim when spawning a content-mill agent. Fill the
`[BRACKETED]` slots before sending. The structure stays the same; the
slots make it specific.

```
You're a content-mill agent for Holoflow Studio, branch
claude/skeleton-build. Read docs/CONTENT-MILL.md before starting. DO
NOT switch branches, commit, push, or touch lib/articles.tsx.

# Task

Research + write a who's-who of **[SCENE NAME]** in the UK — real
people only, verified by public URL.

# Format

Use the **[FORMAT SLUG FROM REGISTRY]** format from the content-mill
registry. The conceit: [ONE-SENTENCE RESTATEMENT OF THE CONCEIT, so
the agent doesn't need to re-derive it].

Suggested section structure: [LIST OF SECTIONS, derived from the
format].

# Research depth

Cast wide. UK-wide. Real, verified. Anchors to build outward from:
[5-10 KNOWN STARTING POINTS — names + URLs].

Search [3-5 SPECIFIC SEARCH PATTERNS to try].

Cover the regions in prose, not in headings: London, Manchester /
Greater Manchester, Bristol, Brighton, Edinburgh, Glasgow, Sheffield,
Leeds.

# Cross-references

Studio articles to link inline where overlap exists. Use absolute
path /articles/<slug>:

[5-10 RELEVANT STUDIO ARTICLE SLUGS]

Sibling who's-who articles to close with:

[LIST OF EXISTING who's-who SLUGS]

# Voice + constraints

Princess teaching register. British spelling. Tight two-clause
sentences. No invented people. No email addresses (URLs only). No
claimed Dimona mentorships unless verified.

NO never-list words (see docs/CONTENT-MILL.md for the list).

Articles are exempt from the 300-line cap. Slug: `whos-who-uk-[SCENE-SLUG]`.
Date: 2026-05-18.

# File

Write to:
D:\.github\_3DPOV\components\articles\entries\whos-who-uk-[SCENE-SLUG].tsx

Match the Entry export shape used by
components/articles/entries/jon-the-photographer.tsx.

# Reporting

Under 300 words: counts per region / per section, gaps, judgment calls.
Do not commit, push, or touch lib/articles.tsx.
```

## The runtime registry

`lib/whoswho.tsx` (next pass) will export a typed list of which scenes
have published who's-who articles, which format they used, and which
sibling articles they're meant to cross-link to. The `/whoswho` index
page renders from this registry.

For now, the canonical list lives here:

| Scene | Slug | Format used | Status |
| --- | --- | --- | --- |
| Fire-art photographers | `whos-who-uk-fire-art-photographers` | (regional, will refresh to `night-chronicle`) | written, registered |
| VR people | `whos-who-uk-vr-people` | (regional, will refresh to `lineages`) | written, unregistered |
| AR people | `whos-who-uk-ar-people` | (regional, will refresh to `tool-history`) | written, unregistered |
| Light painters | `whos-who-uk-light-painters` | `by-tool` | in flight |
| Motion capture | `whos-who-uk-motion-capture` | `six-rooms` | in flight |
| POV / spinning LED | `whos-who-uk-pov-led` | `by-axis-of-rotation` | queued |
| LED programming | `whos-who-uk-led-programming` | `by-tool` (different tools to light painting) | queued |
| Pixel artists | `whos-who-uk-pixel-artists` | `by-venue` (the screens they target) | queued |
| VRM avatar makers | `whos-who-uk-vrm-makers` | `taxonomy-of-bodies` | queued |
| Projection / VJ | `whos-who-uk-projection` | `by-venue` (the surfaces) | queued |
| Holography | `whos-who-uk-holography` | `glossary-as-essay` | queued |
| Generative jewellery | `whos-who-uk-jewellery` | `signature-move` | queued |
| Drone art | `whos-who-uk-drones` | `chapter-marks` (timeline) | queued |
| Generative AI / ComfyUI | `whos-who-uk-generative-ai` | `time-of-day` (3am ComfyUI hour) | queued |
| Splat / 360 / photogrammetry | `whos-who-uk-splat-360` | `walking-tour` (one London + one Manchester tour) | queued |
| 3D printing | `whos-who-uk-3d-printing` | `index-cards` | queued |
| Live performance / circus | `whos-who-uk-performance` | `field-notes` | queued |
| Writers covering the scene | `whos-who-uk-writers` | `letter-from` | queued |

## How a session of the mill runs

1. Pick one or more queued slugs.
2. Pull their format slug from the table.
3. For each one: fill the meta-brief template, spawn a research-and-
   write agent in the background.
4. When agents land: register their files in `lib/articles.tsx` in
   one commit, push, verify deploy.
5. Update the runtime registry (`lib/whoswho.tsx` when it exists, or
   this table meanwhile).

## Refresh pass (existing articles)

The first three articles (`fire-art-photographers`, `vr-people`,
`ar-people`) were written before the format registry existed, so they
all share the regional-headings shape. A refresh pass should rewrite
each one in its target format from the table above, preserving every
verified person + URL but restructuring the prose:

- `fire-art-photographers` → `night-chronicle`
- `vr-people` → `lineages`
- `ar-people` → `tool-history`

Refresh is mechanical for the verified-people data; editorial for the
prose. One agent per article.

## What the mill doesn't do

- **Doesn't auto-commit or auto-push.** Operator (Dimona) reviews each
  draft before it ships.
- **Doesn't touch the private rolodex.** Public who's-who articles
  contain real names + public URLs only. The private rolodex is
  separately maintained.
- **Doesn't invent.** If verification thins, the article gets shorter,
  not padded with names that don't resolve.
- **Doesn't classify identity.** No outing, no inference. The studio
  celebrates by name without labelling. (See
  `private/rolodex/README.md` for the parallel rule on the private
  side.)

## What's next for automation

Possible future build (not yet, just noted):

- A `scripts/content-mill/run.ts` CLI that reads this doc + a chosen
  scene slug + format slug, prints a ready-to-paste meta-brief.
- A Claude Agent SDK script that fully automates research + draft
  generation, gated by a human review step before commit.
- A `/whoswho` route that surfaces the registry table to the public
  site as the rolodex root.

For now: this doc is the spec, I spawn agents by hand using the
template, and the runtime registry is the table above.
