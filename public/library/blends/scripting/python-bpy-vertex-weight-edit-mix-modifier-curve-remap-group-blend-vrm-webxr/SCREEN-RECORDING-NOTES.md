# Screen Recording Notes
## python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr

**Target file**: `public/library/videos/scripting/python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr/screen.mp4`

---

### 1. OBS Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no mic needed) |
| Format | MP4 → H.264 |
| Output path | `…/screen.mp4` |

---

### 2. Blender Layout

1. Open a **new default scene** (File → New → General).
2. Delete the default cube.
3. Set viewport to **Vertex Paint** display: `Viewport Shading → Colour → Vertex` — this lets you see the weight gradient updating live as modifiers evaluate.
4. Open the **Scripting** workspace alongside the 3D Viewport.
5. In the Script Editor, open `blueprint.py` from this directory.

---

### 3. Recording Sequence

**Section A — Raw height gradient (≈ 30 s)**

1. **Start OBS recording.**
2. Run `blueprint.py` in the Script Editor (Alt+P or press ▶).
3. The pauldron appears with the `debug_result` vertex-colour layer.
4. In the modifier stack (Properties → Wrench icon):
   - **Disable** both `VWEdit` and `VWMix` (eye icon).
5. Switch to **Weight Paint** mode (Ctrl+Tab → Weight Paint).
   Select vertex group `shoulder_prox`.
   Show the raw linear gradient — blue at base, red at top.
6. Narrate: *"This is the raw height-based proximity weight — fully linear, no falloff control."*

**Section B — S-Curve remap (≈ 45 s)**

1. Back in **Object Mode**, re-enable `VWEdit` in the stack.
2. Open the modifier panel. Click the **falloff curve** graph.
   Show the S-curve shape (steep lower and upper sections, narrow mid-transition).
3. Switch to **Weight Paint**, `shoulder_prox` selected.
   The gradient should now show snap-to-zero at base and snap-to-one at top.
4. Narrate: *"VertexWeightEditModifier remaps through the custom curve. Low weights collapse toward zero, high weights clamp to one. The transition band is now narrow and precise."*

**Section C — VertexWeightMix result (≈ 45 s)**

1. Re-enable `VWMix` in the stack.
2. In **Weight Paint**, select vertex group `cloth_result`.
3. The MULTIPLY result shows the pinned stripe — only the cap/rim vertices remain at 1.0; everything else is zero.
4. Rotate to show the stripe from multiple angles.
5. Narrate: *"VertexWeightMixModifier MULTIPLY-blends the S-curve group with the hand-painted rim stripe. Only vertices that are both high-proximity AND inside the painted stripe get full pin weight — exactly the shoulder contact band."*

**Section D — Cloth modifier wiring (≈ 30 s)**

1. Add a **Cloth modifier** (Properties → Wrench → Add → Cloth).
2. In Cloth → Shape, set **Pin Group** to `cloth_result`.
3. Briefly run the simulation (Space) to show the plate draping correctly.
4. Narrate: *"The cloth modifier reads cloth_result as the pin group. The pinned cap holds; the lower plate swings free."*
5. **Stop OBS recording.**

---

### 4. Edit Notes

- Trim to remove any load pauses.
- Optional: split-screen A/B of Weight Paint before vs after the S-curve.
- Target runtime: **2–3 minutes** for a polished tutorial short.
