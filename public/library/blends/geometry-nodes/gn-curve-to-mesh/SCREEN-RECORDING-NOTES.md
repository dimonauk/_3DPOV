# Screen Recording Notes — GN Curve to Mesh

**Target file**: `public/library/videos/geometry-nodes/gn-curve-to-mesh/screen.mp4`

---

## OBS / Xbox Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary needed for the library video) |
| Output format | MP4 (H.264) |
| Bitrate | 8000 kbps |

---

## Shot list

### Shot 1 — The problem (30 s)

Open a new Blender scene. Show the Curve Object with Bevel Depth set in
the Properties panel (the old approach). Add a bezier curve, set Bevel
Depth to 0.05. Rotate the viewport to show the end caps — note the
inverted normals and the non-quad topology in Edit Mode. This is the
visual justification for the GN approach.

### Shot 2 — Build the GN tree (2 min)

1. Open `cable_pipe.blend` (produced by `blueprint.py`).
2. Switch to the **Geometry Node** workspace.
3. With `cable_pipe` selected, show the full node graph in the GN editor.
4. Click each node and point out:
   - **Resample Curve**: mode=COUNT, Count=32 — zoom into the viewport to
     show the even ring spacing.
   - **Curve Circle**: Resolution=8, Radius=0.025 — show the cross-section
     circle in the preview.
   - **Curve to Mesh**: highlight the Fill Caps checkbox in the node
     sidebar.
   - **Set Shade Smooth**: domain=FACE, Shade Smooth=True.
5. In the modifier panel, drag the **Radius** slider from 0.025 to 0.15
   and back. Audience sees the cable grow in real-time.
6. Drag **Ring Verts** from 8 down to 3 — the cable becomes a triangular
   prism. Back up to 16 — smooth cylinder. This demonstrates parametric
   control.

### Shot 3 — Edit Mode topology check (30 s)

Tab into Edit Mode with the cable selected. The mesh should show clean
quad loops running along the length, with tri-fan caps at the ends. Press
**N** to open the sidebar, check vertex count (should be ≈288 for
COUNT=32, RING_VERTS=8 plus cap verts).

### Shot 4 — Export to GLB (30 s)

File → Export → glTF 2.0. In the export dialogue:
- Format: GLB
- Include: Apply Modifiers ✓ (this is the `export_apply=True` flag)
- Geometry: Draco compression ✓

Point out the **Apply Modifiers** tick — explain that without it the
exporter sees the raw curve data, not the cylindrical mesh.

### Shot 5 — Viewport render (30 s)

Play back `record.py`'s animation in the viewport (press Space). The
cable radius pulses thin → thick → thin while the camera orbits. This
completes the session.

---

## After recording

Move the file to:

```
public/library/videos/geometry-nodes/gn-curve-to-mesh/screen.mp4
```

Update `.expected-artefacts.json` to remove the `status: pending` flag.
