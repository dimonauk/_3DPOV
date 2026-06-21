# OSL Script Node — Custom Procedural Lava-Crack Turbulence in Cycles
**Blender 5.1 | Cycles CPU | CC0**

Open Shading Language (OSL) is a C-like shader language developed by Sony
Pictures Imageworks and maintained under BSD-3-Clause. Blender's Cycles
renderer executes OSL shaders on the CPU, and the Script node exposes any
OSL shader's parameters as live node sockets — no compile step, no add-on
required.

## What this entry does

`blueprint.py` builds a subdivided plane material using `hs_lava_crack.osl`:
a turbulence FBM shader that uses `abs(noise("perlin", …))` across four
octaves to produce sharp ridgelines between rock and glowing lava seams.
The cracked texture is a fundamentally different technique from Blender's
built-in Voronoi Texture node — the OSL script exposes every arithmetic
constant as a named socket, giving you exact control over the noise topology.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates scene, OSL text, material, renders frame |
| `hs_lava_crack.osl` | Auto-written by blueprint.py; edit freely |
| `record.py` | Keyframes Scale 2→12 over 60 frames, Cycles render |
| `SCREEN-RECORDING-NOTES.md` | OBS capture sequence |
| `.expected-artefacts.json` | CI artefact manifest |
| `output/osl_lava_0001.png` | Rendered still (after running blueprint.py) |

## Running

1. Open Blender 5.1 → Scripting workspace.
2. Open `blueprint.py` → click **Run Script**.
3. Confirm `output/osl_lava_0001.png` appears.
4. Run `record.py` in the same session for the animation.

## Requirements

- Blender 5.1 (Cycles CPU mode)
- **GPU is not supported** — OSL requires CPU device in Blender 5.1.

## Outside sources

- **Open Shading Language** — AcademySoftwareFoundation/OpenShadingLanguage — BSD-3-Clause
  https://github.com/AcademySoftwareFoundation/OpenShadingLanguage
- **Blender Manual: Cycles Script Node** — Blender Foundation — CC-BY 4.0
  https://docs.blender.org/manual/en/latest/render/cycles/nodes/types/shaders/script.html
