# Screen Recording Notes
## CurveModifier + ArrayModifier (FIT_CURVE) Ribbon — Blender 5.1

Target file: `public/library/videos/modifiers/python-bpy-curve-modifier-ribbon-array-fit-path-vrm-webxr/screen.mp4`

---

### OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Capture source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute all tracks) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps (CRF 23 acceptable) |

---

### Recording sequence (~8 minutes)

1. **Open Blender 5.1** — new General file. Show Info header confirms version.

2. **Paste / run `blueprint.py`** via Scripting workspace → Text editor → Run Script.
   Show the ribbon object appearing in the 3D Viewport.

3. **Properties panel tour**
   - Select `hf_ribbon_accessory` → Properties → Modifier tab.
   - Expand each modifier in order: Weld, Array, Curve.
   - On Array: show `Fit Type = Fit Curve`, `Curve = ribbon_path`.
   - On Curve: show `Object = ribbon_path`, `Deform Axis = +X`.

4. **Live edit demonstration**
   - Enter Edit Mode on `ribbon_path` (the curve object).
   - G, Z, drag the 3rd control point up and down.
   - Return to Object Mode — show the ribbon re-conforming in real time.

5. **twist_mode demonstration**
   - Select `ribbon_path` → Properties → Data tab.
   - Toggle Twist Method between Minimum and Tangent — show ribbon roll.
   - Set back to Minimum.

6. **Scale footgun demonstration** (optional but instructive)
   - S, 2, Enter on `ribbon_path` without applying.
   - Show Array tile count doubling.
   - Ctrl+Z to undo, then Object → Apply → Scale to correct.

7. **Viewport render check** — run `record.py`. Show progress in Info header.

8. **GLB inspection** — open a terminal next to Blender, run:
   ```
   npx --yes @gltf-transform/cli inspect hf_ribbon_accessory.glb
   ```
   Show mesh stats (vertex count, primitive count, Draco flag).

---

### Post-production (optional)

- Trim first 5 s (file open) and any extended pauses.
- Add a lower-third title card: `CurveModifier + ArrayModifier · Blender 5.1 · holoflow.studio`.
- Export at 1920 × 1080, H.264, ~8 Mbps.
- Place finished file at the target path above and commit.
