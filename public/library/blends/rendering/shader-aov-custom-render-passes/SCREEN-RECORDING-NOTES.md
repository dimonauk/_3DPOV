# Screen-Recording Notes — Shader AOV: Custom Render Passes

Target file: `public/library/videos/rendering/shader-aov-custom-render-passes/screen.mp4`

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---|---|
| Capture source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | MP4 / H.264 |

---

## What to record — in order

1. **Open Blender**, load `aov_amulet.blend` (or run `blueprint.py` from
   the Scripting workspace first).

2. **Shader Editor** — show the material node tree:
   - Pan to show the three `AOV Output` nodes at the right.
   - Hover each one; let the Properties panel on the right show
     the Name field: `GlowMask`, `RimMask`, `FlatNormal`.
   - Trace the wire from the Fresnel / Power Math node to the
     `GlowMask` Value socket.
   - Trace the wire from the Rim multiply into the `RimMask`
     Color socket.
   - Trace the wire from the Normal remap into the `FlatNormal`
     Color socket.

3. **Render Properties** — scroll to the **Shader AOV** panel:
   - Show the three entries: GlowMask (Value), RimMask (Color),
     FlatNormal (Color).
   - Hover over one to show the tooltip.

4. **Compositor** (toggle via header dropdown):
   - Show the Render Layers node.
   - After a quick render (F12, then close), click Refresh on the
     Render Layers node to expose the AOV output sockets.
   - Show the wires: GlowMask → Glare → Mix Add, RimMask →
     RGB Curves → Mix Add, FlatNormal → Viewer.

5. **Render a still** (F12):
   - Let it render to ~30 samples so the AOV passes populate.
   - Switch to **Image Editor**, change the dropdown from
     `Render Result` to `Viewer Node` to see the FlatNormal pass
     (face-coloured normals as RGB).

6. **Split Image Editor** — show two views side by side:
   - Left: Combined (beauty)
   - Right: FlatNormal (coloured facets)

7. **Compositor 3D viewport overlay** — hold at final composited
   frame with GlowMask glow visible around the gem edges.

---

## Timing guide (target ≤ 3 minutes)

| Segment | Duration |
|---|---|
| Shader Editor — AOV nodes | 45 s |
| Render Properties — AOV panel | 20 s |
| Compositor — node setup | 35 s |
| Render still + Image Editor | 40 s |
| Side-by-side passes + final | 20 s |

---

## Common issues

- **AOV sockets missing on Render Layers** — render at least one
  frame first (F12), then click Refresh on the node.
- **FlatNormal appears grey/uniform** — gem may be smooth-shaded.
  Select gem → Object Data Properties → enable Auto Smooth = 0°,
  or run `bpy.ops.object.shade_flat()` first.
- **GlowMask is black** — check Render Properties → Shader AOV
  panel; the entry name must match node.name exactly.
