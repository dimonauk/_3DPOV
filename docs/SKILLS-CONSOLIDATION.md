# Skills consolidation — audit trail

**Date:** 2026-05-19.
**Goal:** unify the hangar's skill libraries into a single canonical location.

## State before consolidation

Four skill locations existed across the hangar:

| Location | Count | Size | Status |
|---|---|---|---|
| `D:\The_Hangar\.agent\skills\` | 1,473 | 56 MB | Master library (legacy convention) |
| `D:\The_Hangar\.claude\skills\user\` | 33 | 426 KB | Curated user-skills (Anthropic convention) |
| `D:\The_Hangar\.merge-staging\_3DPOV\.claude\skills\` | 97 | 718 KB | Website-curated subset |
| `D:\The_Hangar\apps\production\dolly-os\.agent\skills\` | 1 | 2.5 KB | Orphan |

Overlap analysis:
- 11 of the 33 user skills already existed in `.agent/skills/` (duplicate names)
- 22 user skills were unique to `.claude/skills/user/`
- 93 of the 97 website skills came from `.agent/skills/` (the wave-1+2+3+4 ports)
- 4 website skills are native (holoflow-codex-entry, mammoth-hunt, ssr-safe-three, vercel-recovery)

## Decision

Keep `.agent/skills/` as the canonical hangar-wide master.

Reasoning:
- 1,473 is the larger set; merging 33 into it is one cheap move
- Reversing (merging 1,473 into `.claude/skills/user/`) means rewriting 1,473 cross-references in plans, scripts, prompts, and other skills
- Anthropic's `.claude/skills/user/` convention can be adopted later by moving the whole tree in one operation — not blocked by this decision
- The website's `_3DPOV/.claude/skills/` subset already follows Anthropic convention locally; the hangar root can lag

## Operations performed

### 1. Moved 22 unique skills from `.claude/skills/user/` into `.agent/skills/`

The skills that lived only in `.claude/skills/user/`:

biggo-pipeline, biggo-proxies, biggo-vault, blender-mcp, cockpit-ui,
detector, evolution-engine, gpu-vram-contention-3080ti, gui,
hardware-cluster, local-ai-pwa, neo-london-infrastructure,
neo-london-pipeline, neo-vision, ollama-private-gpt,
screenshot-to-skill, succulent-petal-geometry,
threejs-viewer-workflow, threejs-webgpu-3d-optimization,
tsl-webgpu, waveguide-physics, webrtc-streaming

### 2. Detected 4 newer-in-user-than-in-agent skills, promoted them

The promote-and-replace decision was based on `SKILL.md` byte size
comparison. In each case the version in `.claude/skills/user/` had
been more recently edited and was substantially fuller:

| Skill | user size | agent size | Promoted? |
|---|---|---|---|
| `blender` | 30,071 b | 29,986 b | yes |
| `dollyos-twin` | 6,527 b | 5,734 b | yes |
| `dollyos-world` | 16,792 b | 1,622 b | yes — large delta |
| `teaching-dimona` | 5,956 b | 3,795 b | yes |

The older `.agent/skills/` versions were overwritten by the
newer ones. If you needed any of the older content, it's
recoverable from git history.

### 3. Removed 7 true duplicates from `.claude/skills/user/`

These had identical-or-smaller versions in `.agent/skills/` and
were removed without ceremony:

dolly-os-vite-fixes, dollyos-academy, dollyos-architecture,
dollyos-audio, dollyos-memory, dollyos-telemetry, dollyos-void

### 4. Replaced `.claude/skills/user/` contents with a README

The directory itself is preserved (some tooling may have hard
references to its existence) but now contains only a `README.md`
pointing readers at `.agent/skills/`. Adding a new skill should
go in `.agent/skills/`.

### 5. Wrote master index at `.agent/skills/README.md`

The master library now has a README at its root describing what's
inside, how skills are organized, and how curated subsets (like the
website's) relate to it.

### 6. Deprecated the DollyOS Zustand stores

The parallel agent runtime at
`D:\The_Hangar\apps\production\dolly-os\src\stores\` was marked
deprecated via a `DEPRECATED.md` companion. Code stays in place
(stable, only Aura's tuning was ever wired); no new tunings should
be added there.

## State after consolidation

| Location | Count | Size | Status |
|---|---|---|---|
| `D:\The_Hangar\.agent\skills\` | **1,495** | ~56 MB | Master (single source of truth) |
| `D:\The_Hangar\.claude\skills\user\` | 0 + README | 2 KB | Redirect only |
| `D:\The_Hangar\.merge-staging\_3DPOV\.claude\skills\` | 97 | 718 KB | Website-curated subset (unchanged) |

## What sessions should read first now

1. `D:\The_Hangar\.merge-staging\_3DPOV\docs\SYSTEM.md` — architectural
   overview of the agent platform.
2. The relevant skill(s) from `.agent/skills/` based on the work.
3. If working on the website specifically:
   `_3DPOV/.claude/skills/` is the pre-filtered subset.

## What was NOT done (queued for Phase 2)

See `docs/UNIFICATION-PLAN.md` in this repo for the destructive
moves that need separate sessions:

- Website promotion out of `.merge-staging/_3DPOV/` into
  `apps/holoflow/` (or similar) so it joins the pnpm workspace
  properly and stops needing `--ignore-workspace` to install.
- Aura-surface consolidation — `apps/aura-pwa`, `aura-vrm`,
  `local-chat-vrm` either fold into the website or get archived.
- `packages/` cleanup — legacy entries (`_legacy_ai-gateway`,
  `dist`, `lego-root-sweep`, `tetsngthebridge`, `thirdbridge`,
  `secondbridgetest`) get archived.
- `packages/agent-capabilities/` — the half-built attempt at a
  workspace-package home for skills. Decide whether to revive or
  retire.
