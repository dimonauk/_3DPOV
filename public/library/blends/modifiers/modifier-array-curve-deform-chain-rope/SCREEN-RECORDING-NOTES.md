# Screen-Recording Notes
## Array + Curve Deform — Chain / Rope Along Curve

**Target file:** `public/library/videos/modifiers/modifier-array-curve-deform-chain-rope/screen.mp4`

---

### Software

| Tool | Setting |
|------|---------|
| OBS Studio (≥ 30) or Windows Game Bar (Win + G) | — |
| Window source | Blender 5.1 (the full application window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (silent tutorial clip) |
| Encoder | H.264 / CRF 23 or equivalent quality preset |

---

### What to record (in order)

1. **Open blend file** — `chain_rope.blend` (saved after `blueprint.py` ran)  
2. **Properties panel walkthrough** (camera: orbit to face the chain)
   - Show Modifier Properties → Array modifier: note *Fit Curve* mode, the curve
     object pointer, and the live *Count* field (read-only, driven by arc-length).
   - Show Modifier Properties → Curve modifier: note *Deform Axis = +X*.
3. **Viewport demonstration**
   - Tab into Edit Mode on the *guide_path* curve.
   - Grab a middle handle (G → Z) and drag it up ~0.5 m.
   - Return to Object Mode — pause so viewer can see the chain count increment.
4. **Switch PRESET to ROPE** (edit `blueprint.py`, change PRESET, re-run via
   Blender Scripting workspace) — show a short rope coil variant.
5. **GLB export preview**
   - File ▸ Export ▸ glTF 2.0 — highlight *Apply Modifiers* checkbox (must be ON).
6. **Drag clip into timeline** — no voiceover needed; captions overlaid in edit.

---

### After recording

Place the final file at:
```
public/library/videos/modifiers/modifier-array-curve-deform-chain-rope/screen.mp4
```

Commit with:
```
git add public/library/videos/modifiers/modifier-array-curve-deform-chain-rope/screen.mp4
git commit -m "media: screen recording — Array Curve Deform chain rope"
```
