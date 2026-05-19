# Install scan — Unreal Engine (Sovereign-PC)

Descriptive snapshot of the Unreal install on the studio's Sovereign-PC
bench as of 2026-05-19. Source of truth is the Epic Games Launcher's
own manifest at
`C:\ProgramData\Epic\UnrealEngineLauncher\LauncherInstalled.dat`.

Read-only scan. Nothing in the install was modified. Saved Config
directories under `C:\Users\dimon\AppData\Local\UnrealEngine\` retain
profiles from older engine versions (4.17, 4.27, 5.3, 5.4, 5.5) that
were either upgraded out or are referenced by old projects — they are
not active engine installs.

## Engine installs (active)

Two Unreal Engine versions are live on disk per the Epic launcher
manifest:

| Engine | Install path | Manifest version |
| --- | --- | --- |
| Unreal Engine 5.8 | `C:\UE_5.8` | `5.8.0-53629095+++UE5+Release-5.8-Windows` |
| Unreal Engine 5.7 | `C:\UE_5.7` | `5.7.4-51494982+++UE5+Release-5.7-Windows` |

5.8 is the current bench engine. 5.7 is kept for project compatibility
with the marketplace plugins that have not yet shipped a 5.8 build
(see plugin list below).

## Engine companions installed alongside 5.8

The Epic launcher manifest records three companion artefacts at
`C:\UE_5.8`:

- **FabPlugin 5.8** — `5.8.0-53629095+++UE5+Release-5.8-0.0.13-…` —
  the Fab marketplace browser integration (the successor to Quixel
  Bridge and the UE Marketplace, post-FAB launch). Lives at
  `C:\UE_5.8\Engine\Plugins\Fab\Fab.uplugin`.
- **QuixelBridge 5.8** — `5.8.0-…-2025.0.1-…` — the legacy Megascans
  Bridge plugin, retained for compatibility with older asset packs.

## Engine companions installed alongside 5.7

5.7 has no Fab / QuixelBridge companions on the manifest — instead it
hosts 24 individually-installed marketplace plugins under
`C:\UE_5.7\Engine\Plugins\Marketplace\`. The marketplace folder naming
is Epic's opaque hash-suffix scheme; the human-readable plugin name
comes from the `.uplugin` file inside.

## Marketplace plugins — UE 5.7

Twenty-four plugins installed for 5.7. The studio bench is clearly the
"prototype-on-5.7, ship-on-5.8" pattern; 5.7 is where the studio's
existing UE workflow lives.

| Folder hash | `.uplugin` name |
| --- | --- |
| `ActionsE9be46a21d755V5` | ActionsExtension |
| `Attribut6275970506b1V8` | AttributesExtension |
| `AutoSize109b491ea28aV18` | AutoSizeComments |
| `Blueprin0062bebdf039V8` | KibibyteLabs (AI chat-in-editor) |
| `Blueprinfb09bcd72ca9V5` | BlueprintExporter |
| `Chestory6caf407d7e4fV11` | Chestory |
| `Factions2272c1957458V9` | FactionsExtension |
| `FileToolb9ea77d94287V6` | FileToolkitX |
| `GraphFordb08a965c7d3V15` | GraphFormatter |
| `Healthan12a456f121d1V9` | Progress_Bar_Simplifier |
| `LGUI3DUI740fa10bd9f6V7` | LGUI (3D UI library) |
| `LogVieweeec702fe73ebV15` | LogViewer |
| `MagicNod90a5feb629feV16` | MagicNode |
| `NexxNotebec53003fdabV3` | NexxNote (graph notes) |
| `ObjectDe326c1e22ff4bV16` | ObjectDeliverer |
| `Propertyc95cab9a226eV18` | PTMTool |
| `Realtimee81af4739f42V19` | RealtimeMeshComponent |
| `RuntimeIa61b61f13ffaV9` | RuntimeImageLoader |
| `SaveExte3db1918bf5fdV6` | SaveExtension |
| `SymbolRec4d11ab9ad22V8` | SymbolRecognizerVR |
| `TargetSy0860b1795735V15` | TargetSystem |
| `VaRestRe6959ebc28060V9` | VaRest (REST/JSON for UE) |
| `VideoRec77a0df8484c9V12` | RuntimeVideoRecorder |
| `WindowCa719c030cb9b2V15` | WindowCapture2D |

### Plugins worth flagging for the WebXR + spatial workflows

- **SymbolRecognizerVR** — gesture / symbol recognition; relevant to
  the studio's hand-input experiments.
- **LGUI** — Unity-UGUI-style 3D UI; useful for any in-headset menu
  work without leaning on UMG.
- **VaRest** — REST/JSON in editor; the bridge to Hangar services
  over Tailscale.
- **RuntimeMeshComponent + RuntimeImageLoader** — load meshes /
  images at runtime, which is how the photogrammetry → UE inspection
  loop is wired.
- **RuntimeVideoRecorder + WindowCapture2D** — capture pipeline for
  documenting captures from inside UE itself.
- **NexxNote** — graph-node sketch / annotation, helpful when the
  blueprint graph gets large.
- **KibibyteLabs (Blueprin0062…)** — AI chat-in-editor; ships with
  Noto fonts and translation strings, third-party LLM helper.

## Feature packs (5.8)

The standard UE 5.8 install includes the bundled feature packs:

- `TP_FirstPerson` / `TP_FirstPersonBP`
- `TP_ThirdPerson` / `TP_ThirdPersonBP`
- `TP_TopDown` / `TP_TopDownBP`
- `TP_HandheldARBP` — the AR template
- `TP_VirtualRealityBP` — the VR template (relevant to studio work)
- `TP_VehicleAdvBP`

## Projects found

Standard discovery paths checked. **No `.uproject` files were found
in the conventional project locations** at the time of scan:

- `C:\Users\dimon\Documents\Unreal Projects\` — folder not present.
- `C:\Users\dimon\Documents\` (top-level) — no `.uproject`.
- `D:\Epic Games\` / `D:\UnrealEngine\` — not present.
- `D:\The_Hangar\` — full-tree scan timed out; if a `.uproject`
  exists under the Hangar it is in an uncrawled deep subdirectory.
- A glob over `D:\` timed out as well — there may be a `.uproject`
  on `D:` somewhere the tooling could not reach in the time budget.

If a project exists, the user knows where; the launcher manifest does
not record per-project state, only engine installs.

## Trace + DDC + crash artefacts

`C:\Users\dimon\AppData\Local\UnrealEngine\` shows historical engine
usage:

- `4.17`, `4.27`, `5.3`, `5.4`, `5.5` saved-config + saved-log
  subdirectories — the engine versions touched by previous
  installs. Not currently mapped to live engine installs per the
  launcher manifest.
- `Common\UnrealTrace\Bin\…\UnrealTraceServer.exe` — shared Unreal
  Insights trace server binaries.
- `Common\DerivedDataCache\` — shared DDC.
- `Common\Zen\Data\` — Zen DDC; populated with stored assets, blocks,
  and the `ns_ue.ddc` namespace caches.
- `5.5\Saved\Swarm\SwarmCache\` — Lightmass Swarm cache from a 5.5
  bake (timestamp 2025-11-05).
- `5.3\Saved\Crashes\` — a single 5.3 crash dump.

Conclusion: 5.3 / 5.4 / 5.5 were active engine installs in the past;
the launcher has since migrated to 5.7 + 5.8.

## Epic Games Launcher

- `C:\Users\dimon\AppData\Local\EpicGamesLauncher\` is populated;
  the launcher is installed and has been used recently
  (webcache + service-worker storage from current Epic store sessions).
- Recent launcher logs at
  `…\Saved\Logs\EpicGamesLauncher_2-backup-2026.05.14-15.08.34.log`
  confirm activity on 2026-05-14.

## Hangar Unreal writeups index

The Hangar's main tree has no top-level Unreal documentation; the only
Unreal-mentioning files live inside worktrees of older Claude
sessions, plus one pivot-painter readme inside the Modular Tree
extension. References:

- `C:\Users\dimon\AppData\Roaming\Blender Foundation\Blender\5.1\extensions\blender_org\modular_tree\python_classes\pivot_painter\UE5_MATERIAL_SETUP.md`
  — UE5 material setup guide that ships with the Modular Tree Blender
  extension (third-party doc, useful when wiring tree assets into UE).
- `D:\The_Hangar\.claude\worktrees\…\docs\guides\unreal-migration.md`
  — earlier worktree's UE migration notes (appears in three worktrees:
  `condescending-boyd-d46c30`, `nervous-johnson-16297f`, `nice-chebyshev-2906d5`).
- `D:\The_Hangar\.claude\worktrees\…\apps\vr-sculpting-demo\README.md`
  — VR sculpting demo readme (touches UE adjacency).

**No production Hangar UE docs exist outside of `.claude/worktrees/`.**
That gap is what this scan flags. The studio runs Unreal but has no
canonical Hangar-side Unreal documentation.

A first Unreal tutorial has been added at
`components/tutorials/entries/unreal-pixel-streaming-browser-delivery.tsx`
to start the studio-side coverage; that tutorial uses the **Pixel
Streaming** plugin (built into 5.8) since it's the most direct fit
with the studio's WebXR / browser-delivery posture.
