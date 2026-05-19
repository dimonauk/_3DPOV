# Merge-staging fold-in — `.merge-staging/_3DPOV/` (2026-05-19)

Workshop note from the 360 fold-in pass triggered by the scan agent's
write-up at `docs/RESOURCES-360-SPHERICAL.md`.

## TL;DR

The fold-in is already done. Every 360-shaped file the scan promised
under `D:\The_Hangar\.merge-staging\_3DPOV\` is byte-identical to the
copy already on the live site. The only material gap was that
`viz.splat-generate-360` had landed as a source file but was missing
from the capability registry. This pass registers it. No other moves
were needed.

## What the scan promised

From `docs/RESOURCES-360-SPHERICAL.md` (lines 181–189):

- `sanity/schemas/pano-360.ts`
- `lib/capabilities/viz/splat-generate-360.ts` + `.PURPOSE.md`
- `lib/capabilities/viz/heatmap-equirect.ts` + `.PURPOSE.md`
- `etc/comfyui-workflows/sdxl-360-panorama.json` + `.NOTES.md`
- `etc/comfyui-workflows/flux-equirect-lora-v3.json` + `.NOTES.md`
- `components/articles/entries/london-360-walking.tsx`
- Mirrored codex entries (equirectangular-projection,
  kolor-autopano-historical, pano2vr-tour-building,
  ptgui-hugin-lightroom-stitching) and the `from-360-to-splat`
  tutorial, plus `components/studio/EquirectViewer.tsx`.

## What's actually on disk

Every file above is on the live site at the matching path, with
`diff -q` returning silent (byte-identical). Verified files:

| File | Live path | Staging vs live |
| --- | --- | --- |
| `pano360` schema | `sanity/schemas/pano-360.ts` | identical |
| Splat 360 capability | `lib/capabilities/viz/splat-generate-360.ts` | identical |
| Splat 360 PURPOSE | `lib/capabilities/viz/splat-generate-360.PURPOSE.md` | identical |
| Heatmap equirect capability | `lib/capabilities/viz/heatmap-equirect.ts` | identical |
| Heatmap equirect PURPOSE | `lib/capabilities/viz/heatmap-equirect.PURPOSE.md` | identical |
| Spherical math | `lib/math/spherical.ts` | identical |
| SDXL 360 workflow | `etc/comfyui-workflows/sdxl-360-panorama.json` | identical |
| SDXL 360 notes | `etc/comfyui-workflows/sdxl-360-panorama.NOTES.md` | identical |
| Flux equirect workflow | `etc/comfyui-workflows/flux-equirect-lora-v3.json` | identical |
| Flux equirect notes | `etc/comfyui-workflows/flux-equirect-lora-v3.NOTES.md` | identical |
| Flux1-dev workflow | `etc/comfyui-workflows/flux1-dev-fp8.json` | identical |
| Flux1-dev notes | `etc/comfyui-workflows/flux1-dev-fp8.NOTES.md` | identical |
| London 360 article | `components/articles/entries/london-360-walking.tsx` | identical |
| Codex: equirect projection | `components/codex/entries/equirectangular-projection.tsx` | identical |
| Codex: Kolor Autopano | `components/codex/entries/kolor-autopano-historical.tsx` | identical |
| Codex: Pano2VR tour | `components/codex/entries/pano2vr-tour-building.tsx` | identical |
| Tutorial: 360 → splat | `components/tutorials/entries/from-360-to-splat.tsx` | identical |
| Equirect viewer | `components/studio/EquirectViewer.tsx` | identical |
| 360 model plan | `docs/360-MODEL-PLAN.md` | identical |

The live site has even *more* in this area than staging:

- `components/articles/entries/whos-who-uk-splat-360-people.tsx` — second
  360 article (May 19), staging doesn't have it.
- `etc/comfyui-workflows/hunyuan3d-2mv-turbo.{json,NOTES.md}` and
  `wan-t2v-1_3b.{json,NOTES.md}` — two extra workflows beyond the staging set.
- `lib/capabilities/viz/generate-comfyui-http.ts` +
  `generate-comfyui-workflow.ts` — newer HTTP / workflow split that
  staging predates.

Reading suggests `.merge-staging/_3DPOV/` is a parallel snapshot from
2026-05-14 / 2026-05-18, fully absorbed (and overtaken) by the live
site between 2026-05-18 and 2026-05-19. Treat it as historical.

## What was actually missing

One thing: `viz.splat-generate-360` capability had its `.ts` and
`.PURPOSE.md` on disk but no entry in `lib/capabilities/index.ts`. The
`/capabilities` page therefore didn't list it, and `register({...})`
hadn't been called, so the load gate had nothing to gate.

Registered this pass between `viz.splat-generate` and `viz.splat-render`:

```ts
{
  id: "viz.splat-generate-360",
  kind: "viz",
  name: "Splat generate (360 source)",
  summary: "Sibling to viz.splat-generate scoped to spherical-camera capture …",
  status: "registered",
  source: "Studio sibling to viz.splat-generate. Backed by D:/The_Hangar/engines/splat360/ …",
  load: () => import("./viz/splat-generate-360"),
}
```

`pnpm typecheck` is clean on the touched files. The only typecheck
error in the project right now is `Cannot find module
'components/tutorials/entries/wiring-the-webxr-retroarch-room'` —
that belongs to the WebXR RetroArch agent (a70dcee2), not this pass.

## Files only in staging

A second look for everything in `.merge-staging/_3DPOV/` that's NOT
on the live site (excluding `.git`, `node_modules`, `.next`,
`.claude`, `.vercel`, lockfile, tsbuildinfo, scratch tmp files):

```
docs/AURA-CANON.md
docs/CAPABILITIES.md
docs/CAST-CANON.md
docs/DIMONA-CANON.md
docs/EXISTING-INFRASTRUCTURE.md
docs/REHAB-CANON.md
docs/SYSTEM.md
lib/agents/convergence-crew.example.json
lib/agents/crew-schema.json
lib/agents/PURPOSE.md
lib/capabilities/agent/cast-roster.PURPOSE.md
lib/capabilities/agent/cast-roster.ts
lib/cast/canon-hierarchy.{PURPOSE.md,ts}
lib/cast/dance-tutor.{PURPOSE.md,ts}
lib/cast/dottie.{PURPOSE.md,ts}
lib/cast/logistician.{PURPOSE.md,ts}
lib/cast/lottie.{PURPOSE.md,ts}
lib/cast/physicist.{PURPOSE.md,ts}
lib/cast/shelly.{PURPOSE.md,ts}
```

None of these are 360-shaped. They're Charming Academy / cast /
agent-coordination material — out of scope for this fold-in. The
in-flight Academy work is happening in its own track (`apps/agents/`
and `app/admin/agents/` on the live site already exist with more
recent shape), so a direct paste-in would conflict.

Left for a later pass with the cast-architecture eye on, not this 360
sweep.

## On the pre-drafted London 360 article + the SDXL/Flux workflows

The London 360 walking article (`components/articles/entries/london-360-walking.tsx`,
21 KB) — Workshop voice throughout. South Bank, trekking pole +
selfie-stick rig, the "invisible selfie stick" trick. Already on the
live site, already wired into `lib/articles.tsx` (line 142,
`london360WalkingEntry`).

The two ComfyUI workflows:

- `sdxl-360-panorama.json` — SDXL text-to-image at 4096×2048 for
  HoloWalk backdrops + AR cards. Workflow JSON + `.NOTES.md` already
  on disk under `etc/comfyui-workflows/`.
- `flux-equirect-lora-v3.json` — Flux1-dev FP8 + Equirectangular v3
  LoRA at 2048×1024, the best-quality 360 path per the
  `dollyos-comfyui-3d` skill. Both `.json` and `.NOTES.md` on disk.

These live as static reference artefacts under `etc/`, not wired to
any in-site capability yet — there's no "render a 360 from ComfyUI"
route in the studio at the moment. They're catalogued for future use
(planned wire-in via the `viz.generate-comfyui` capability that
already exists). No `python-services/` move needed; the workflows
ship as ComfyUI graph JSON, not Python.

## Coordination

In-flight agents and the directories they own (skipped this pass):

- `a3f5ed61` — `docs/INSTALL-SCAN-BLENDER.md`, `docs/INSTALL-SCAN-UNREAL.md`
- `a8f1e8b8` — `app/atelier/devices/`, `components/devices/`,
  `lib/devices/`, `public/models/devices/`,
  `docs/OSS-DEVICE-MODELS.md`
- `a70dcee2` — `app/atelier/webxr-retroarch/`,
  `components/webxr-retroarch/`, `lib/webxr-retroarch/`,
  `docs/WEBXR-RETROARCH.md`,
  `components/tutorials/entries/wiring-the-webxr-retroarch-room.tsx`
  (in progress — typecheck shows it's not yet wired)
- `a39a2a22` — `components/codex/entries/eden-emulator.tsx`,
  `cemu.tsx`, `citra-and-3ds-emulator-forks.tsx`, `melonds.tsx`,
  `ppsspp.tsx`, `rpcs3.tsx`, `vita3k.tsx`,
  `lib/emulator/native-systems.ts`, `docs/EMULATION-NATIVE.md`
- `a7b0c50c` — `components/tutorials/entries/blender-mcp-*.tsx`,
  `components/tutorials/entries/blender-addon-*.tsx`

None of those overlap the 360 fold-in surface.

## Git status

The shared checkout at `D:\.github\_3DPOV` is currently shuttling
between `main`, `holoflow-commerce`, and `claude/skeleton-build` as
multiple agents run in parallel. This pass did not switch branches —
the edits sit in the working tree and want to land on
`claude/skeleton-build` (as the user instructed) once the other
agents stop flipping HEAD around.

Files this pass touched, ready to commit:

- `lib/capabilities/index.ts` — added the `viz.splat-generate-360`
  registry entry.
- `docs/MERGE-STAGING-FOLD-IN.md` — this file.

No new npm dependencies introduced. No `docs/OPEN-SOURCE-STACK.md`
row needed.
