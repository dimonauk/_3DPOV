# Blender-via-MCP tutorials

A small, growing set of Blender tutorials that the studio runs **through the bench's MCP socket** rather than by hand in the viewport. The point of this folder isn't "here's how to model a thing in Blender"; it's "here's a Python script you can fire at a running Blender 5.1 over the MCP lattice and get a real `.glb` out the other side, repeatably."

Each tutorial is paired with a tutorial page under `/tutorials/blender-mcp-<slug>` so the script reads in context — what it builds, how the studio uses it, what to swap when adapting it for the sculpture gallery.

## Honest status — first pass

**The MCP bridge was not reachable from the agent that authored this pass.** Blender's socket on `127.0.0.1:9876` was listening — confirmed via `netstat` — but the harness running this agent denies arbitrary outbound TCP from its Bash tool, so the scripts in this pass have **not** been round-tripped end-to-end from inside the agent. Every tutorial entry carries a header banner saying so.

What that means concretely:

- The `.py` scripts in each tutorial entry are real — pulled verbatim from the cited OSS source, then adapted to the studio's export conventions (Y-up, applied transforms, Draco 6, WebP textures, flat-shaded normals).
- The expected output GLBs (`public/models/blender-tutorials/<slug>/<mesh>.glb`) and the render thumbnails (`thumb.png`) **have not been generated** in this pass. The `public/models/blender-tutorials/` tree is intentionally empty — better an empty directory than a fabricated artefact.
- The follow-up pass — run from a harness that can speak to `127.0.0.1:9876` — is supposed to execute each script, write the GLBs and thumbs, and flip the "not yet executed" banners off.

If you're reading this from such a harness, the run-order is at the foot of this doc.

## The MCP setup

Two skills carry the full setup:

- `blender-mcp` — the socket protocol, the FastMCP SSE server (`D:\The_Hangar\mcp\blender_mcp_sse.py`), the meshgen Blender add-on (Hyper3D path B), thread-safety constraints.
- `blender-pipelines` — the four production-grade studio pipelines on Sovereign-PC (fabrication chain, aura trails, Hunyuan, Looking Glass quilt). Carries the `bld_remote_mcp` quirks, the canonical addon inventory, the timer-pattern for blocking render ops.

Short version: open Blender 5.1, run `D:\The_Hangar\mcp\blender_mcp_sse.py` from the Scripting tab, confirm port `9876` is listening, send newline-delimited JSON of the form `{"type": "execute_code", "params": {"code": "<script>"}}` over a TCP socket.

Bench requirements:

- Blender 5.1.0 (`D:\The_Hangar\engines\blender5\blender.exe`)
- `bld_remote_mcp` add-on registered, server started
- For tutorials touching glTF export: nothing extra — the built-in exporter handles Draco + WebP
- For Tutorial 02 (parametric torus): `scipy` is **not** required; the script is pure `math`
- The render thumbnail step uses `BLENDER_EEVEE` (not `BLENDER_EEVEE_NEXT` — that name was 4.x only, see `blender-pipelines` gotcha 1)

## The catalogue

Four tutorials in this pass, all from MIT-licensed OSS sources, all adapted to the studio's conventions.

| Slug | Source URL | Licence | What it builds | Target GLB size |
| --- | --- | --- | --- | --- |
| `blender-mcp-faceted-sphere` | [njanakiev/blender-scripting/simple_sphere.py](https://github.com/njanakiev/blender-scripting/blob/master/scripts/simple_sphere.py) | MIT | A flat-shaded icosphere with the studio's facet conventions baked in — the canonical "hello world" for the WebXR exporter | < 50 KB |
| `blender-mcp-parametric-torus` | [njanakiev/blender-scripting/parametric_torus.py](https://github.com/njanakiev/blender-scripting/blob/master/scripts/parametric_torus.py) | MIT | A torus mesh built from a `(u, v)` surface parameterisation rather than the primitive operator — useful when you want exact control over segment counts | < 200 KB |
| `blender-mcp-tetra-fractal` | [njanakiev/blender-scripting/tetrahedron_fractal.py](https://github.com/njanakiev/blender-scripting/blob/master/scripts/tetrahedron_fractal.py) | MIT | A recursive Sierpinski-style tetrahedron fractal; depth-4 produces a richly-faceted mesh that decimates well | < 2 MB at level 4 |
| `blender-mcp-cube-walker` | [aaronjolson/Blender-Python-Procedural-Level-Generation/random_walk_via_cube_placement.py](https://github.com/aaronjolson/Blender-Python-Procedural-Level-Generation/blob/master/Blender_2_8/random_walk_via_cube_placement.py) | MIT | A random-walk maze of joined-and-hollowed cubes — the simplest possible procedural environment generator, useful for splat-walker placeholder geometry | < 1 MB at 1000 iterations |

GLB size budgets are targets, not measurements — see the "honest status" note above.

## Execution methodology (how to reproduce)

For each tutorial:

1. Open Blender 5.1, switch to the Scripting workspace, open and run `D:\The_Hangar\mcp\blender_mcp_sse.py`. Confirm `Server running on 127.0.0.1:9876` in the system console.
2. From a terminal that can reach `127.0.0.1:9876`, send the tutorial's `.py` payload as the `code` field of `{"type": "execute_code", "params": {"code": "..."}}` — newline-delimited JSON over a raw TCP socket, **not** HTTP. (See `blender-pipelines` for why HTTP is wrong here.)
3. Each script ends by calling `bpy.ops.export_scene.gltf(...)` with the canonical Holoflow flags and writing to `public/models/blender-tutorials/<slug>/<mesh>.glb`.
4. Each script then optionally calls `bpy.ops.render.render(write_still=True)` with the output set to `public/models/blender-tutorials/<slug>/thumb.png` at 512×512.
5. Heavy scripts (Tetra Fractal at depth ≥ 5, Cube Walker at ≥ 5000 iterations) take more than 4 seconds and **will** drop the MCP response — the script writes to a sidecar `.done` marker file the caller polls for, per the `blender-pipelines` timer pattern.

The 4-second timeout rule from `blender-pipelines` is the single most important thing to understand here. Anything that won't return inside that window needs the marker-file pattern, not the response payload.

## What failed in this pass — for the next agent

- **Outbound TCP from this agent's harness was denied.** Every attempt to run `python /tmp/blender_probe.py` or `python -c "import socket; ..."` was refused by the sandbox even though the MCP socket was confirmed listening. This is a harness-policy issue, not a Blender or MCP problem.
- **`git push` to `claude/skeleton-build` was not attempted.** The agent's checkout is on `holoflow-commerce`; the instructions called for a push to `claude/skeleton-build`. The local checkout state is preserved; the next pass — or a human operator — should review the diff, switch to the correct branch (or cherry-pick), and push.
- **`pnpm typecheck` was not attempted from this agent** for the same reason — the harness denied long-running builds. The tutorial entries follow the patterns of the existing `blender-addon-*` entries verbatim, so the type surface is the same; nothing in this pass introduces a new shape.

## Future passes

- Run each script end-to-end via the MCP, attach real GLBs + thumbs, flip the banners off.
- Add a fifth tutorial: **VRM avatar export end-to-end** — load a VRM via the saturday06 add-on, retarget to a Mixamo rig, export as a Holoflow-conventions GLB. (Cross-references `blender-addon-vrm-format` and `blender-addon-mixamo-rig`.)
- Add a sixth tutorial: **glTF animation bake** — author a short turntable in Blender, bake at 30 fps, export with the studio's animation conventions, render preview frames for the tutorial page.
- Wire the GLBs into the sculpture gallery's catalogue so each tutorial's outcome appears as a walkable piece at `/atelier/sculpture-gallery/blender-mcp-<slug>`.
- Replace the screenshot-thumb step with a real render: enable `BLENDER_EEVEE`, set a three-point sun rig, set the output to `public/models/blender-tutorials/<slug>/thumb.png` at 512×512 with `render.resolution_percentage = 100`.

## Voice + register

The doc you're reading is workshop-Dimona; the tutorial entries are Princess (Aura Test Chamber) for the chrome and workshop-Dimona for the bench steps. Voice-mode authority is `holoflow-voice` skill → `docs/AURA-TEST-CHAMBER-VOICE.md` → individual tutorial body. The Princess narrates the procedure; the bench narrates the failures.

---

## 2026-05-19 — library series (public/library/ pipeline)

The `public/library/` directory introduces a parallel authoring pipeline to the
MCP-socket tutorials above. Where the MCP series fires scripts over the bench's
TCP socket, the library series ships headless-runnable blueprints alongside the
source `.blend` and export artefacts. Every library entry carries its own
`record.py` for viewport animation and `SCREEN-RECORDING-NOTES.md` for the OBS
screen-capture session.

### faceted-gemstone-geonodes

| Field | Value |
|-------|-------|
| **Tutorial slug** | `blender-tutorial-faceted-gemstone-geonodes` |
| **Tutorial URL** | `/tutorials/blender-tutorial-faceted-gemstone-geonodes` |
| **Library path** | `public/library/blends/procedural/faceted-gemstone-geonodes/` |
| **Blender** | 5.1 |
| **Technique** | UV sphere (8 seg × 6 rings) → bmesh crown/girdle/pavilion zones → flat shading → Principled BSDF IOR 2.42 → GN parametric sliders via `nt.interface.new_socket()` → Draco GLB |
| **Artefacts** | `gemstone.blend`, `gemstone.glb`, `viewport.mp4`, `screen.mp4` |
| **Source 1** | Blender Manual — GN Convex Hull (Blender Foundation, CC-BY-4.0) |
| **Source 2** | geometry-script by Carson Katri (MIT) |
| **Date** | 2026-05-19 |

**Notes:**
- First entry in `public/library/` — establishes the full directory shape
  (`blueprint.py`, `record.py`, `README.md`, `SCREEN-RECORDING-NOTES.md`,
  `.expected-artefacts.json`) and the `MANIFEST.md` row format.
- Demonstrates Blender 5.x GN interface API (`nt.interface.new_socket`)
  replacing the removed 3.x `nt.inputs.new()` / `nt.outputs.new()`.
- UV sphere ring topology (8×6) maps cleanly to gem zones — each ring index
  is one latitude band, making bmesh zone selection deterministic.
- Headless run: `blender --background --python blueprint.py`
---

## Content-mill log (hourly autopilot)

| Date | Slug | Topic | Library path | Notes |
|---|---|---|---|---|
| 2026-05-19 | blender-tutorial-geometry-nodes-low-poly-terrain | GN — procedural terrain | blends/geometry-nodes/low-poly-terrain/ | bpy.data GN tree; Blender 5.1 interface.new_socket API; noise displacement + flat shade |
| 2026-05-19 | blender-tutorial-low-poly-faceted-hard-surface | Smooth by Angle + Sharp edge marks | blends/low-poly/faceted-hard-surface/ | Blender 5.1 Auto-Smooth replacement; bmesh box-model + inset; flat studio-palette mat; Draco GLB |
| 2026-05-19 | blender-tutorial-faceted-gem-webxr | bmesh data API gem + EEVEE Next cel-refraction | blends/low-poly-stylised/faceted-gem-webxr/ | Pure bmesh (no bpy.ops); brilliant-cut topology; Principled BSDF Transmission Weight (5.x); surface_render_method FORWARD; CONSTANT ColorRamp cel bands |
| 2026-05-19 | blender-tutorial-flat-shaded-faceted-normals | Custom split normals + silhouette-blend + Shader-to-RGB cel material | blends/shading/flat-shaded-faceted-normals/ | normals_split_custom_set() direct API; silhouette-blend heuristic; Blender 5.1 use_auto_smooth removal; Diffuse→ShaderToRGB→CONSTANT ColorRamp→Emission; LoopTools Apache-2.0 reference |
