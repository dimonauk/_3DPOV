---
name: holoflow-codex-entry
description: >
  How to add a new entry to the Holoflow Studio Codex
  (holoflow.co.uk/codex). The codex is a glossary of practice,
  apparatus, capture techniques, drone work, production tooling,
  print, commerce, and community terms — each entry has a metadata
  registry record (in lib/codex.tsx) and a hand-written body
  component (in components/codex/entries/<slug>.tsx). Load when:
  "add a codex entry", "new codex term", "/codex/<thing>", "codex
  draft", "what does X mean in the codex", "lib/codex.tsx",
  "components/codex/entries", or any task that adds, edits, or
  cross-links a codex term.
---

# Holoflow Studio — Adding a Codex Entry

The codex is the studio's glossary. Every entry is a term defined in
**Aura's catalogue voice** (dispassionate Princess register; see the
`holoflow-voice` skill for what that means).

## Architecture in one paragraph

`app/codex/page.tsx` renders the index. `app/codex/[slug]/page.tsx`
renders one entry. The list of entries lives as a typed registry in
`lib/codex.tsx`: each entry has metadata (slug, title, category, date,
summary, seeAlso, sources) plus a `Body` reference to a React component
in `components/codex/entries/<slug>.tsx`. Adding an entry is two files:
the body component, and a new record in the registry that points to it.

## The two files

### 1. The body component

Path: `components/codex/entries/<slug>.tsx` (kebab-case slug).

```tsx
export default function ExampleEntry() {
  return (
    <>
      <p>
        First paragraph: what the thing is in one or two sentences,
        with the proper noun or technical term in plain prose.
        <sup>1</sup>
      </p>
      <p>
        Subsequent paragraphs: history, lineage, mechanism, materials,
        constraints, where the term sits in the studio's practice.
        Catalogue mode means: third-person, archival, no winks.
      </p>
      <p>
        The studio's relationship to the term, late in the entry — one
        sentence at most. The entry is about the term, not about the
        studio.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Footnote one — qualifier, etymology, edge case.
        </li>
        <li>
          Footnote two — the studio aside. Often signature material.
        </li>
      </ol>
    </>
  );
}
```

Conventions:

- Default export is the body component named in PascalCase.
- No `"use client"` — codex entries are static.
- No props.
- Use `<sup>N</sup>` inline anchors and a manual `<ol>` of footnotes
  at the bottom, joined by a horizontal rule. The hr uses
  `my-12 border-warm-black-800`.
- Use HTML entities (`&#257;`, `&mdash;`, `&middot;`) rather than raw
  unicode where the term needs careful rendering (macrons, em-dashes,
  middle-dots).
- British spelling throughout.

### 2. The registry record

Append to `ENTRIES` in `lib/codex.tsx`. Also add the import at the top.

```tsx
import ExampleEntry from "components/codex/entries/example-entry";

// ...inside ENTRIES, in alphabetical-ish order grouped by category:
{
  slug: "example-entry",
  title: "Example entry",
  category: "Capture",  // see CodexCategory union below
  date: "2026-05-14",   // ISO YYYY-MM-DD
  summary:
    "One- or two-sentence plain-text summary. This is the line that " +
    "appears in the index. Same catalogue voice as the body.",
  // Optional: short status note for the byline
  status: "Updated from author's 2017 tutorial",
  // Optional: slugs of related entries. Orphan refs render as 'pending'.
  seeAlso: ["other-slug", "another-slug"],
  // Optional: external citations
  sources: [
    { label: "Wikipedia: Example", url: "https://en.wikipedia.org/..." },
    { label: "Original 2017 tutorial by the author", url: "..." },
  ],
  Body: ExampleEntry,
},
```

The categories union (from `lib/codex.tsx`):

```ts
type CodexCategory =
  | "Practice"
  | "Apparatus"
  | "Capture"
  | "Capture (Immersive)"
  | "Drone"
  | "Production"
  | "Print"
  | "Commerce"
  | "Community";
```

Pick one; don't invent new categories without coordinating.

## Voice register

Codex entries are **catalogue mode** — Princess voice, dispassionate.
See the `holoflow-voice` skill for the full spec. Highlights:

- Third-person archival. The reader is not addressed directly. No "you".
- Confident, precise, gently sardonic when appropriate. No buzzwords.
- A single sentence of studio aside, late, often as a footnote.
- Concrete numbers, named tools, manufacturer names. Specific years.
- British spelling.
- Sources cite the studio's own published work proudly. "The author's
  own published tutorial" is a fine label.

The reference exemplars for voice calibration:
- `components/codex/entries/poi.tsx` — practice term, Māori origin.
- `components/codex/entries/persistence-of-vision.tsx` — capture
  technique, dry historical mode.
- `components/codex/entries/teensy.tsx` — apparatus, manufacturer-name
  in plain prose.
- `components/codex/entries/long-exposure-photography.tsx` — capture
  technique with the studio's relationship to it stated late.

## seeAlso — the cross-link graph

Use `seeAlso` to wire related terms. Render-time: a slug that doesn't
match an existing entry shows as `pending` rather than breaking the
build. That's intentional — you can stub forward-references when
drafting a cluster.

Don't crank up the count. Three to five `seeAlso` per entry is the
sweet spot.

## Footnotes

Manual `<sup>N</sup>` + matching `<ol>` at the bottom. There's no
auto-numbering. Match the sup number to the list-item position.

Footnotes are signature material — the studio writes funny footnotes,
not funny prose. The body stays archival; the footnotes carry the wit.

## Sources

`sources` is rendered separately from footnotes. Sources are external
citations the reader can verify; footnotes are internal asides. Don't
mix them.

Order sources roughly by primacy: the studio's own writings first
(when they exist), then Wikipedia, then manufacturer/spec docs, then
community.

## Date conventions

`date` is the ISO date the entry was added or substantively last
updated. Don't bump it for typos. Don't backdate. The codex index
sorts and groups by category, but a date is a date.

## Slug conventions

- All lowercase, kebab-case.
- No punctuation, no apostrophes (use word-form: "artists-proof",
  not "artist's-proof").
- For numbers: spelled out ("three-sixty-photography" not "360-photography").
- For initialisms: keep them lowercase ("uk-caa-drone-regulations-2026").
- For year-bound entries: include the year only if the entry is
  jurisdiction-specific and the law changes ("uk-caa-drone-regulations-2026").

## Cluster suggestion when drafting a new entry

When the user wants to add ONE term, propose a small cluster (2-4
related terms) and ask. The codex's value is in cross-linkage; isolated
single entries usually want a sibling. Example: "augmented reality" is
naturally bracketed with "virtual reality" + "spatial audio" + "360°
photography." Drafting them together produces better seeAlso webs.

## Verification

After adding:

```pwsh
pnpm tsc --noEmit  # registry typing
pnpm dev           # visit /codex and /codex/<slug>
```

Index check: the new entry appears in the right category section,
with the date byline and summary line.

Entry-page check: the body renders, footnotes are reachable from the
`<sup>` anchors, `seeAlso` chips link out, sources render at the
bottom of the page.

## Commit message

Plain. Mechanical.

```
codex: add <title> (<category>)

Body in components/codex/entries/<slug>.tsx; registered in lib/codex.tsx
with seeAlso[other-slug, ...] and N sources.
```

The codex grows ~1-3 entries per session. Don't pad the commit body;
the diff carries the prose.

## Anti-patterns

- **Don't write codex entries in workshop register.** That's Dimona's
  voice; codex is Aura's catalogue voice. If you find yourself writing
  "I", you're in the wrong register.
- **Don't open with the studio's relationship to the term.** Open with
  what the term IS. The studio's relationship belongs late, often as a
  single sentence or a footnote.
- **Don't link out where a codex entry exists.** If "Teensy" has a
  codex entry, internal cross-references should go to `/codex/teensy`,
  not to the manufacturer site (that's what `sources` is for).
- **Don't invent technical claims to fill paragraphs.** If the term
  doesn't have four solid paragraphs in it, ship two. Length is not a
  virtue here.
