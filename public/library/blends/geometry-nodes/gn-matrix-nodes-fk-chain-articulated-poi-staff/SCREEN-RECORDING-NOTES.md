# Screen Recording Notes
## GN Matrix Nodes — FK Chain: Articulated Poi Staff (Blender 5.1)

**Target file**: `public/library/videos/geometry-nodes/gn-matrix-nodes-fk-chain-articulated-poi-staff/screen.mp4`

---

### OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

### Recording script (5–7 minutes)

1. **Open Blender 5.1** → Scripting workspace.
2. **Load and run `blueprint.py`** — pause on the console output confirming
   `[gn-matrix-nodes-fk-chain-articulated-poi-staff] Blueprint built — 8 FK segments.`
3. **Switch to the Geometry Nodes editor** (split view: 3D Viewport left, GN editor right).
4. **Select `hf_poi_staff`** and expand the `HF_FK_Chain` modifier.
5. **Zoom into the Repeat Zone** — show the `accum_M` Matrix socket on the
   RepeatInput node. Hover over it to show the tooltip confirming it is type
   `Matrix` (a Blender 5.x socket type).
6. **Pan through the node tree** to show the chain:
   - `White Noise Texture` feeding joint angle
   - `Combine Matrix` building `local_M` (highlight Translation and Rotation inputs)
   - `Multiply Matrices` accumulating `new_accum_M = accum_M × local_M`
   - `Transform Point` extracting world joint position
   - `Decompose Matrix` extracting rotation for knuckle instancing
7. **In the 3D Viewport**, switch to Material Preview or Rendered view.
   Show the full 8-segment staff with the indigo→amber colour gradient.
8. **Open modifier properties** for `HF_FK_Chain`. Drag the `Joint Angle` input
   from 0.30 to 1.10 rad — the chain fans outward in real-time. Drag back to 0.
9. **Open the Outliner** — show that `hf_poi_staff` is a single object with one
   GN modifier (not N separate objects). This is the power of the FK matrix chain.
10. **Add keyframes**: Frame 1 → Joint Angle 0.30; Frame 120 → Joint Angle 1.10.
    Press Space. Show the chain expanding over the 4-second animation.
11. **Run `record.py`** from the Scripting workspace to render `viewport.mp4`.

---

### Key moments to emphasise on-screen

- **The `Matrix` socket type** on the Repeat Zone items — new in Blender 5.x.
  The old approach would need 16 floats or separate R/T sockets. One Matrix socket
  carries the full affine transform.
- **`Multiply Matrices` node output** — mention that the left-to-right order
  matters: `parent × local` applies local rotation in the parent's frame.
- **Real-time update** when dragging `Joint Angle` — the entire 8-joint chain
  updates without re-running the script or invalidating cache.
- **Single object** — the whole articulated staff is one Blender object, one
  draw call, directly exportable as a single GLB node for WebXR.
