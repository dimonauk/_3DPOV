# gen-purpose-stubs

Generates blank `.PURPOSE.md` stubs for every load-bearing source file
that doesn't have one yet. Implements the convention defined in
[`docs/AGENT-FILE-DOCS.md`](../docs/AGENT-FILE-DOCS.md).

## What it does

1. Walks `app/`, `lib/`, and `components/` under the repo root.
2. Filters to `.ts`/`.tsx` source files only.
3. Drops the exempt set (types files, barrels, test files,
   `.server.ts` halves of capabilities, generated routes,
   loading/error/not-found stubs, etc. — see the
   `EXEMPT_BASENAMES` / `EXEMPT_SUFFIXES` lists in the script).
4. For each remaining file, checks whether a sibling
   `<name>.PURPOSE.md` exists. If not, writes one with YAML
   frontmatter pre-populated with `file:`, `role:` (inferred from
   path), and `last_audited: <today>`.
5. Reports a tally.

The stub body is intentionally a `## TODO` block, not a fake
description. The frontmatter is the part the script can fill in
accurately; the prose is the part an agent has to write while
actually looking at the code.

## Usage

```sh
# Report what would be created — no files written
node scripts/gen-purpose-stubs.mjs --dry-run

# Write stubs for every missing file
node scripts/gen-purpose-stubs.mjs

# Scope the scan to a subtree (e.g. only the app/atelier surface)
node scripts/gen-purpose-stubs.mjs --root . --dry-run
node scripts/gen-purpose-stubs.mjs --root .

# Verbose — print every file checked, not just the missing ones
node scripts/gen-purpose-stubs.mjs --dry-run --verbose

# Disable ANSI colour (e.g. piping to a file)
node scripts/gen-purpose-stubs.mjs --dry-run --no-colour > missing-purpose.log
```

## Flags

| Flag | What it does |
|---|---|
| `--dry-run` | Report only. No files written. Exit 0 regardless of how many stubs would be created. |
| `--root <path>` | Override the scan root. Default is `process.cwd()`. The script always walks `app/`, `lib/`, and `components/` *inside* this root. |
| `--verbose`, `-v` | Log every eligible file, including ones that already have a doc. |
| `--no-colour` (US: `--no-color`) | Strip ANSI escapes from output. |
| `--help`, `-h` | Print usage and exit 0. |

## Idempotency

Running the script twice in a row writes zero new files. The check
is `existsSync(siblingPath)` — no content sniffing. If you want to
regenerate a stub, delete the existing `.PURPOSE.md` first.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success — wrote any stubs needed, or had none to write |
| 1 | Bad argument or fatal filesystem error |

## When to run it

- **After a large feature lands** — sweep up new files that got
  added without their docs.
- **Before a refactor** — get a baseline of which files have docs
  so you know what's load-bearing in the area you're touching.
- **Quarterly hygiene** — once the codebase has rolled, run it to
  see how many new gaps have opened.

## When NOT to run it

The script is a **floor**, not a ceiling. Running it gives you
blank stubs. The point of the convention is to write the doc when
you're already in the file. Running this script and walking away
leaves you with 200 `## TODO` placeholders. That's worse than
having no doc, because it looks documented when it isn't.

The right rhythm: an agent runs `--dry-run` to find unrelated
files near their current work, writes the docs for those at the
same time as their changes, and commits them together.

## Sibling convention this implements

See `docs/AGENT-FILE-DOCS.md` for the full convention.
Short version:

| Source file | Twin |
|---|---|
| `app/**/page.tsx` | `page.PURPOSE.md` |
| `app/**/route.ts` | `route.PURPOSE.md` |
| `app/**/<name>-client.tsx` | `<name>-client.PURPOSE.md` |
| `lib/<area>/<name>.ts` | `<name>.PURPOSE.md` |
| `components/**/<name>.tsx` | `<name>.PURPOSE.md` |

Exempt (skipped by the script): `types.ts`, `index.ts`,
`constants.ts`, `styles.ts`, `*.test.*`, `*.spec.*`, `*.d.ts`,
`*.server.ts` (covered by sibling), and Next-generated route
artefacts like `loading.tsx`, `error.tsx`, `not-found.tsx`,
`opengraph-image.tsx`, etc.

## Related

- `docs/AGENT-FILE-DOCS.md` — the convention this script implements.
- `AGENTS.md` (top level) — orientation; should cross-link to the
  convention doc (proposed line in `AGENT-FILE-DOCS.md`).
- `scripts/AGENTS.md` — script-folder conventions this script
  follows (`--dry-run` flag, `--help` flag, sibling `.md`, etc.).
- `holoflow-modularise-300` skill — the 300-line file rule. Writing
  the `.PURPOSE.md` first makes hitting the cap easier because the
  non-goals are named before the implementation calcifies.
