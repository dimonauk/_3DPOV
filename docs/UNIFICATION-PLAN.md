# Unification plan — Phase 2

**Date started:** 2026-05-19.
**Phase 2 status:** 2B / 2C / 2D / 2E complete. 2A reframed after an architectural finding (see below).

Phase 1 (skills consolidation + DollyOS Zustand deprecation marker) was logged at `docs/SKILLS-CONSOLIDATION.md`.

Phase 2 was executed in the same 2026-05-19 session in this order: **2D → 2C → 2B → 2E → 2A**. The 2A attempt surfaced a real blocker that reframes the move from "easy hoist" to "needs dep-stack reconciliation first."

---

## Move 2A — promote the website out of `.merge-staging/`

**Status:** RESOLVED — workspace integration deferred indefinitely. Physical move still queued.

### The React decision (2026-05-19)

The 2026-05-19 unification attempt added `_3DPOV` as a workspace member and immediately discovered the hangar root's `pnpm.overrides` forces `@types/react: 18.3.23`. The website uses React 19. Workspace membership would have downgraded React types and broken the build.

A full audit of React versions across the hangar followed:

| React version | Package count |
|---|---|
| React 18 explicit pin | 80 packages |
| React 19 explicit pin | 18 packages |
| **Total with explicit pin** | 98 packages |

The React 19 packages are exactly the **active Holoflow surfaces**:
`apps/aura-vrm`, `apps/charming-academy`, `apps/hangar-dashboard`,
`apps/holoflow-mesh-studio`, `apps/Light_Weiver`,
`apps/lightpainting-forge`, `apps/pixel-academy`,
`apps/pixel-agents-local/webview-ui`, `apps/sculpture-gallery`,
`apps/sprite-designer`, `apps/waveguide-forge`,
`apps/production/snap-fit-lab`, `apps/prototypes/screenshot-studio`,
`apps/prototypes/agent-starter-react`, `apps/prototypes/wiggle-ui`,
`apps/prototypes/apps-new/claw-empire`, `packages/pixel-engine`, plus
the website itself.

The React 18 packages are mostly:
- 40+ stale prototypes under `apps/prototypes/`
- Older production apps (`apps/production/dolly-os` — already deprecated)
- Shared UI packages (`@hanger/ui-components`, `ui-components`, `vr-protocol/webxr-vr`)
- Generic infrastructure (lego/duplo, habit-system, mylibs)

### What this means for the workspace question

**Three options were considered:**

1. **Migrate everything to React 19** — was estimated at "half a day audit + half a day fixes" pre-data. The actual cost is multi-day per-app for 80 packages, many of which are unmaintained prototypes. Cost is too high for the ROI.
2. **Per-package override scoping** — possible via pnpm's selector syntax (`"react@18-only-pkg>react": "18"`). Adds complexity to root `package.json`, requires per-package selectors that need updating whenever a new React-18 package appears.
3. **Defer indefinitely** — keep `--ignore-workspace` as the canonical install workflow for `_3DPOV`. The hangar root override stays at React 18 (protecting the 80 packages); the website operates outside the workspace. Zero risk, zero work.

### The decision: Option 3 — DEFER

`pnpm install --ignore-workspace` from `_3DPOV/` is the canonical install workflow. The hangar root keeps its React 18 override. The website operates outside the workspace. This is the documented intentional state, not a workaround.

**Reasoning:**

- The build is green (verified 891-page Next.js build 2026-05-19)
- The Vercel deploy works correctly
- The DX cost (one extra CLI flag on install) is negligible
- The risk cost of touching 80 packages' React deps is high — many prototypes that nobody is maintaining or testing
- The hangar root override protects those 80 packages from accidental React 19 upgrade via transitive deps — removing it is itself a hazard

### What this unblocks

The **physical move** of `_3DPOV/` → `apps/holoflow/` is now decoupled from the React decision. It can happen any time. It still requires Vercel dashboard access (the project's "Root Directory" setting needs updating in the same change) and a sweep through any skill / config that hard-codes `.merge-staging/_3DPOV`. Half a day of work; gated on Vercel access from operator.

### Permanent reminders

- `pnpm-workspace.yaml` includes an inline comment explaining why `_3DPOV` is excluded
- `AGENTS.md` documents `pnpm install --ignore-workspace` as the canonical install workflow
- Future sessions that try to re-add the website to the workspace should read this section first

### If this decision ever needs revisiting

Triggers for re-opening the question:

- The 40+ React-18 prototypes get archived or migrated for unrelated reasons
- A specific cross-app shared package (likely `@hanger/ui-components`) becomes critical for the website AND requires React 19
- Vercel deploy infrastructure changes in a way that makes workspace membership beneficial

Until then: **the website stays out of the workspace by design.**

---

## Move 2B — Aura-surface consolidation ✓ DONE

**Status:** DONE on 2026-05-19.

### What landed

Three Aura-named apps existed in parallel to the website. After audit:

- **`apps/aura-pwa/`** — Archived. No `package.json`, newest file 219 days old. Pre-Holoflow-website prototype. Functionality subsumed by website's `/aura/wardrobe`, `/aura/web-llm`, plus the broader VRM + voice capability layer.
- **`apps/local-chat-vrm/`** — Archived. Fork of upstream `chat-vrm` v0.1.0, last activity 42 days ago. Superseded by `apps/aura-vrm/`.
- **`apps/aura-vrm/`** — KEPT. Also a `chat-vrm` fork (v0.1.0) but the active one. Has `ARCHITECTURE_AURA.md`, newest src file 30 days ago. Will eventually merge into the website's VRM capability stack but is the current cluster-side surface for VRM work.

Both archived apps moved to `apps/_archive/2026-05-19-unification/` with a README explaining the decisions.

---

## Move 2C — packages/ cleanup ✓ DONE

**Status:** DONE on 2026-05-19.

### What landed

Seven legacy packages were verified as having **zero imports** anywhere in the hangar (grep'd across all js/ts/tsx/json files), then moved to `packages/_archive/2026-05-19-unification/`:

- `_legacy_ai-gateway/` — superseded by `_3DPOV/lib/llm/gateway.ts`
- `lego-root-sweep/` — scratch, no `package.json`
- `tetsngthebridge/` — typo'd bridge experiment, no imports
- `thirdbridge/` — bridge experiment N+1, no imports
- `secondbridgetest/` — bridge experiment N, no imports
- `dist/` — 484-file build artefact accidentally committed; no `package.json`
- `agent-capabilities/` — see 2D below

`packages/_archive/2026-05-19-unification/README.md` documents the reasoning per package and the restore command.

---

## Move 2D — `packages/agent-capabilities/` decision ✓ DONE

**Status:** DONE on 2026-05-19. **Decision: RETIRE.**

### What landed

`packages/agent-capabilities/` (which held `anthropic-official-skills/`, `antigravity-zai-extension/`, `awesome-agent-skills/`, `ChatDev/`, `OpenAgents/`, `pixel-agents-local/`, `pixel-agents-upstream/`) was archived. Zero imports anywhere; nothing wired in.

`pnpm-workspace.yaml` previously had a glob `packages/agent-capabilities/*` — replaced by a note explaining the archive.

The single canonical home for skills is now `D:\The_Hangar\.agent\skills\` (1,495 skills). If the studio ever decides to publish skills as npm packages, the archive can be revived from `packages/_archive/2026-05-19-unification/agent-capabilities/`.

---

## Move 2E — `Dolly_OS/` (dev branch) vs `apps/production/dolly-os/` ✓ DOCUMENTED

**Status:** AUDIT COMPLETE. **Decision: keep both. Document the relationship.**

### What the audit revealed

`D:\The_Hangar\Dolly_OS\` is **not** a stale duplicate — it's the active dev environment. Evidence:

- 8 GB total (vs 403 MB for `apps/production/dolly-os/`)
- Newest src file 6 days old (`KalidokitMirrorPanel.tsx`)
- Unique content not present in production: `convex/` (backend), `projects/` (user-project storage), `python-services/`, `services/agents/` (the home of the `crew_schema.json` we ported to the website), `_archive/`, `tmp/`

The "promote when ready" pattern is intentional: dev work happens at the root; production-ready code gets folded into `apps/production/dolly-os/`. Merging would either pollute production with dev scratch or strip dev of essential state.

### What landed

`D:\The_Hangar\Dolly_OS\DOLLY-VS-PROD.md` written, explaining the dev/prod relationship for any future session that lands there assuming duplication.

---

## What's left after Phase 2

| Move | Status | Notes |
|---|---|---|
| 2A — website workspace integration | BLOCKED | Hangar pins React 18, website uses React 19. Needs a React-version reconciliation OR per-package override scoping first. |
| 2A — website physical move | DEFERRED | Independent of workspace. Half a day. Gated on Vercel dashboard access. |
| 2B — Aura surfaces | DONE | aura-pwa + local-chat-vrm archived; aura-vrm kept |
| 2C — legacy packages | DONE | 7 archived |
| 2D — agent-capabilities | DONE | Retired |
| 2E — Dolly_OS dev vs prod | DOCUMENTED | Both kept, relationship documented |

**Outstanding work:**

1. **Decide on the React version strategy.** Migrate the hangar to React 19 (clean, half-day audit, gives the website workspace membership) OR scope the React 18 override per-package (fiddlier, leaves the website outside the workspace). Without this decision, the website permanently uses `--ignore-workspace`.
2. **Optionally: physical move of the website.** Coordinated with Vercel dashboard. Half a day.

Both are independent and either can be done first.

---

**This document gets updated as items land.** Sections marked ✓ DONE / DOCUMENTED are historical. The single outstanding architectural decision is the React version strategy.
