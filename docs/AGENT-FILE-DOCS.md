# AGENT-FILE-DOCS.md — the `.PURPOSE.md` convention

Every load-bearing source file in this repo has a sibling
`.PURPOSE.md` that explains, in plain English, **what the file is**
and **why it exists in the system**. New agents (Claude sessions,
parallel workers, future humans) read these before editing. The
catalogue voice keeps them dry and specific; see the `holoflow-voice`
skill.

This document defines the convention. The scaffolder script at
`scripts/gen-purpose-stubs.mjs` (see
[`scripts/gen-purpose-stubs.md`](../scripts/gen-purpose-stubs.md))
walks the tree and fills the gaps with blank stubs ready for an
agent to write.

## Why per-file docs

The repo already has the right per-directory shape — `AGENTS.md`
siblings at `app/`, `app/api/`, `components/`, `docs/`, `lib/`,
`scripts/`, and the top level. Those answer "where am I?" The
`.PURPOSE.md` siblings answer the next question: **"what does this
file do, and what would I break if I changed it?"**

The signal we want in every doc:

- **Role** in one sentence — what the file is, in the system.
- **Public surface** — exports + their contracts.
- **Internal** — non-public helpers worth knowing about.
- **Depends on** — the import graph in plain English.
- **Does not** — explicit non-goals. The most useful section.
- **Bordering files** — where to look next if you're touching this
  one.

## Where a `.PURPOSE.md` is required

| Source file | Twin |
|---|---|
| `app/**/page.tsx` | `page.PURPOSE.md` |
| `app/**/route.ts` | `route.PURPOSE.md` |
| `app/**/<name>-client.tsx` | `<name>-client.PURPOSE.md` |
| `app/**/layout.tsx` (substantive) | `layout.PURPOSE.md` |
| `app/**/_helpers.ts`, `_parts.tsx` (route-private modules) | `_helpers.PURPOSE.md`, etc. |
| `lib/<area>/<name>.ts` (meaningful module) | `<name>.PURPOSE.md` |
| `lib/capabilities/<kind>/<verb>.ts` | `<verb>.PURPOSE.md` |
| `lib/capabilities/<kind>/<verb>.server.ts` | covered by the sibling `<verb>.PURPOSE.md` (one doc per capability, not per file) |
| `components/<area>/<name>.tsx` (substantive component) | `<name>.PURPOSE.md` |
| `scripts/<name>.{mjs,ts}` | `<name>.md` (sibling — predates this convention; existing pattern) |

## When NOT to write a `.PURPOSE.md`

The doc is overhead, not protection. Skip it for:

- **`types.ts`** — pure type files. The types are the doc.
- **`index.ts` re-export barrels** — if it does nothing but
  `export * from "..."`, the doc would just restate the imports.
  (Exception: `lib/capabilities/index.ts` populates the registry
  via side-effect — that's load-bearing and **does** have one.)
- **`constants.ts`** — name-value lists. Self-documenting.
- **`styles.ts`** — Tailwind-string or CSS-in-TS modules.
- **Test files** — `*.test.ts`, `*.spec.ts`, anything under `tests/`.
- **Generated files** — anything produced by a build step.
- **JSON / data files** — registries that already carry their own
  shape via their TypeScript types live in a sibling `.ts` whose
  PURPOSE doc covers them.
- **Single-line wrappers** — a `<DialogPrimitive>` re-export with
  one className addition does not need a paragraph.
- **`/c/[slug]/embed/page.tsx`-style thin routes** that just import
  and render a client — covered by the client's PURPOSE.

When in doubt: if you'd write the same doc as the file next to it,
write the doc on the bigger of the two and reference both.

## The schema

A `.PURPOSE.md` is markdown. The body is free-form (the existing
139 files are pure headings; both styles are valid). We are
**adding** an optional YAML frontmatter block on top so agents can
parse a file's role + dependencies without reading prose. New
stubs ship with the frontmatter pre-filled. Existing heading-only
docs are valid and do not need migration unless you're editing the
file anyway.

### YAML frontmatter (preferred for new docs)

```yaml
---
file: app/drops/[slug]/page.tsx
role: server-component
what: One-line what this file is.
why: |
  Short paragraph or bullets — why it exists, what problem it
  solves, what would break without it.
deps:
  - lib/drops/read
  - components/auth/auth-provider
callers:
  - "/drops/[slug] (routed)"
exports:
  - DropDetailPage (default)
gotchas:
  - dynamic = "force-dynamic" required (reads live Firestore)
last_audited: 2026-05-19
---
```

### `role` values

Pick the most specific that fits:

| Value | Means |
|---|---|
| `server-component` | RSC page or layout — runs on the server, no `"use client"` |
| `client-component` | `"use client"` page/island or `*-client.tsx` |
| `route-handler` | `app/**/route.ts` — `GET`/`POST`/etc. exports |
| `capability` | `lib/capabilities/<kind>/<verb>.ts` registered atom |
| `capability-server` | `lib/capabilities/<kind>/<verb>.server.ts` server-only half |
| `lib-module` | Generic `lib/<area>/<name>.ts` |
| `state-slice` | `lib/state/<name>.ts` zustand slice |
| `component` | `components/**/*.tsx` — reusable UI |
| `hook` | `components/hooks/use<Name>.ts(x)` |
| `helper` | Route-local `_helpers.ts`, `_parts.tsx`, etc. |
| `algorithm` | `lib/algorithms/<name>.ts` — pure math/geometry module |
| `script` | `scripts/<name>.{mjs,ts}` — operator CLI |

### Body — what to put under the frontmatter

The body is markdown. Use whichever sections apply. The
established de-facto sections (used by the 139 existing files):

- `## Role` — the one-sentence what + the next paragraph of why.
- `## Public surface` — exports + their contracts.
- `## Internal` — private helpers worth a sentence each.
- `## Depends on` — the modules this file imports, with a phrase
  each on what it gets from them.
- `## Does not` — explicit non-goals. **The most valuable section.**
  Stops future-you from re-litigating boundaries.
- `## Bordering files` — siblings and downstream consumers.
- `## Plug surface` (capability-specific) — state slices read /
  written, dependency capabilities, input/output type shape.
- `## How <character> flows through this file` (Aura/cast-specific) —
  where character / voice / tone shows up in the code.
- `## Signalling pattern (mock vs real)` — if the file has a
  fallback / stub path, name how the viewer knows which path
  fired.

## Worked example

The capability discovery page —
[`app/capabilities/page.PURPOSE.md`](../app/capabilities/page.PURPOSE.md):

```markdown
# `page.tsx` — purpose twin (route `/capabilities`)

## Role

The discovery surface for the entire capability registry. A
visitor arriving at `/capabilities` sees every brick the studio
knows about — registered or stub — grouped by kind, with its
plugs (state slices + dependencies) and source attribution.

## Public surface

- Route `/capabilities`.
- Default export `CapabilitiesIndexPage` (RSC).
- `metadata` export for SEO.

## Internal

- `KIND_ORDER` — explicit kind display order...
- `CapabilityCard` — the per-brick card. Inline component
  (under 50 lines); splits to its own file if it grows.

## Depends on

- `lib/capabilities` — re-exports `listCapabilities` and types
  from `_base`. Importing this module *populates* the registry
  via the side-effect `.forEach(register)`...

## Does not

- **Does not invoke capabilities.** It only *lists* them...
- **Does not edit the registry.** No write path...
- **Does not render the brick meshes.** ...

## Bordering files

- `lib/capabilities/index.ts` — data source.
- `lib/capabilities/_base.ts` — types.
- `docs/CAPABILITY_REGISTRY_PLAN.md` — work-order doc the
  introductory paragraph cross-links to.
```

The doc reads like a catalogue card. Dry, specific, no
marketing copy. It tells you what the file does **and** what
it deliberately doesn't do. Both are signal.

## Agent rules

If you're an agent (Claude session, parallel worker, etc.)
opening this repo, here's how you treat `.PURPOSE.md` files.

### When you find one

Read it before you read the source. The doc is the contract; the
code is the implementation. If they disagree, **the code wins** —
but you should fix the doc in the same commit. Stale docs are
worse than missing ones.

### When you don't find one

If you're editing a file that should have one (see the table
above) and doesn't:

1. Write the doc as part of the same commit. Use the frontmatter
   schema; fill in what you know; leave a `## TODO` for anything
   you're not sure about.
2. **Don't write a stub and walk away** — the scaffolder already
   does that. Your job, when you're already in the file, is to
   write the real doc.

### When you create a new file

Write the `.PURPOSE.md` first, then the code. The doc forces you
to articulate the role + the non-goals before the implementation
calcifies. (This mirrors the `holoflow-modularise-300` discipline:
the doc-first habit makes the 300-line cap easier because you've
already named what doesn't belong in the file.)

### When you delete a file

Delete its `.PURPOSE.md` in the same commit. Orphan docs rot.

## Cross-references

This convention should be linked from the top-level `AGENTS.md`.
Add this line under the "Rules you should know before you touch
code" list (insert as item 9 or wherever fits):

```markdown
9. **Every load-bearing file has a `.PURPOSE.md` twin.** Read it
   before editing; update it when you change the file. See
   `docs/AGENT-FILE-DOCS.md` for the convention and
   `scripts/gen-purpose-stubs.mjs` for the scaffolder.
```

## The scaffolder

To find every file that should have a `.PURPOSE.md` but doesn't:

```sh
node scripts/gen-purpose-stubs.mjs --dry-run
```

To generate blank stubs for every missing one:

```sh
node scripts/gen-purpose-stubs.mjs
```

Idempotent — running twice generates zero new files. Skips files
covered by the **NOT required** list above. See
[`scripts/gen-purpose-stubs.md`](../scripts/gen-purpose-stubs.md)
for full flag reference.

## Voice

Same as the rest of the docs surface: catalogue voice. Dry,
specific, factual. No marketing. No emoji. No hedging. State the
thing, name the thing it isn't, point at the bordering thing.
The `holoflow-voice` skill has the calibrated examples.
