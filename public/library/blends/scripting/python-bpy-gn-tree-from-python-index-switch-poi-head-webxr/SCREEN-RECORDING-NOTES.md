# Screen Recording Notes
## python-bpy-gn-tree-from-python-index-switch-poi-head-webxr

Target file: `public/library/videos/scripting/python-bpy-gn-tree-from-python-index-switch-poi-head-webxr/screen.mp4`

---

### OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Source | Window capture — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration needed) |
| Output format | MP4 / H.264 CRF 18 |

---

### Recording flow (approx. 8 min)

1. **Open Blender 5.1.** Dismiss the splash screen.
2. **Switch to the Scripting workspace** (tab at the top).
3. **Open blueprint.py** — File → Open Text Block, navigate to the library path.
4. **Start OBS recording.**
5. **Run blueprint.py** (▶ Run Script). Pause 2 s for the viewer to see the output.
6. **Switch to the 3D Viewport workspace** (Numpad 0 for camera view). The sphere poi head should be visible. Briefly orbit with Middle Mouse to show it in 3D.
7. **Open the Properties panel → Object Properties → Modifiers → PoiHeadGN.** Expand the modifier. Show the Variant field (currently 0 = sphere).
8. **Change Variant to 1** (drum). The geometry switches live. Pause 2 s.
9. **Change Variant to 2** (spike). Pause 2 s.
10. **Change back to 0.** Return to the Scripting workspace.
11. **Open the Geometry Node Editor** (split the bottom panel → Editor Type → Geometry Node Editor). Select the HF_PoiHead object. The `HF_PoiHead_v1` node group should display: three primitive nodes feeding into the Index Switch, which feeds the Group Output.
12. **Zoom into the Index Switch node** to show the three item inputs. Pause 2 s.
13. **Open record.py** in the Text Editor. Run it (▶). Switch to the Timeline. Press Space to play — the camera should orbit and the modifier switches variants at frames 151 and 301.
14. **Stop recording.**
15. **Export viewport.mp4** via Ctrl+F12 (Render Animation) — this outputs to `public/library/videos/…/viewport.mp4`.

---

### After recording

- Trim to < 10 min in DaVinci Resolve or ffmpeg.
- Rename to `screen.mp4` and place in the `videos/scripting/…/` directory.
- Use the `viewport.mp4` from the render for the embedded preview on the tutorial page.
