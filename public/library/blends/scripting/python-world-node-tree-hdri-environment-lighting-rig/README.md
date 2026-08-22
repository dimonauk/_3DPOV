# Python World Node Tree — HDRI + Nishita Sky Lighting Rig

**Blender 5.1 · Python · CC0**

Build and configure Blender's World node tree entirely via `bpy`: switch between
an HDRI environment map and a procedural Nishita sky, control azimuth rotation,
synchronise a Sun lamp, configure mist distance-fog, and export a JSON sidecar
so the Holoflow Three.js scene can load a matching IBL independently.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Python world rig — run in Blender 5.1 Text Editor |
| `record.py` | Viewport render: animates sun elevation 5° → 28° over 150 frames |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 |

---

## Quick Start

1. Open Blender 5.1. In the **Text Editor**, open `blueprint.py`.
2. (Optional) Set `HDRI_PATH` to a CC0 `.hdr` file from [Poly Haven](https://polyhaven.com/hdris).
   Leave it empty to use Nishita sky.
3. Press **Run Script**.
4. Switch the **Shader Editor** type to **World** — the node tree appears.
5. Check the **World Properties** panel (globe icon) for mist settings.
6. Open `world_rig_export.json` (written alongside the `.blend`) for the Three.js sidecar.

---

## Key Blender 5.1 API Points

- `world.use_nodes = True` must be called **before** accessing `world.node_tree`.
- `ShaderNodeTexCoord.Generated` is the correct socket for world-space HDRI mapping —
  not `.Object` or `.Normal`.
- `ShaderNodeTexEnvironment` requires `node.image = bpy.data.images.load(path)`;
  passing a raw filepath string does nothing.
- `sky_node.sun_direction` is a **unit vector** (`+Z` up, `+Y` north) and is keyframeable
  via `sky_node.keyframe_insert("sun_direction", frame=N)`.
- Mist lives on `scene.world.mist_settings`, not on the node tree.

---

## Tutorial

[/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig](https://holoflow.co.uk/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig)

---

## Licence

`blueprint.py` and `record.py` — CC0 (public domain).  
Outside reference: Blender Foundation World API (CC BY-SA 4.0); Poly Haven HDRIs (CC0).
