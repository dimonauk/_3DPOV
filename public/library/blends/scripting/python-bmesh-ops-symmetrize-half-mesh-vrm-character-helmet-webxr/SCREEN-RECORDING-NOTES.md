# Screen Recording Notes — bmesh.ops.symmetrize Helmet

**Target file:** `public/library/videos/scripting/python-bmesh-ops-symmetrize-half-mesh-vrm-character-helmet-webxr/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic capture needed) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Blender workspace before you hit Record

1. **Layout workspace** — Viewport in Solid mode, Material Preview off.
2. Open the **Scripting workspace** in a second tab so you can show the code.
3. Load `blueprint.py` into the Text Editor (or paste the key section).
4. Set viewport shading to **Solid → Cavity ON** for visible facets.
5. Camera: `Numpad 1` (front) or `Numpad 5` (ortho) for the half-mesh reveal;
   switch to `Numpad 4` / orbit after symmetrize for the hero shot.
6. Arrange a **vertical split**: Text Editor left | 3D Viewport right.

## Recording sequence (aim for 90–120 s total)

| Time | Action |
|------|--------|
| 0:00 – 0:10 | Show the right half-mesh in viewport — orbit to show the open left side |
| 0:10 – 0:25 | Switch to Text Editor, highlight `bmesh.ops.symmetrize(...)` call and `dist` parameter |
| 0:25 – 0:40 | Run the script (`Alt + P` in the Text Editor) — watch the left half materialise |
| 0:40 – 0:55 | Orbit the full helmet; toggle wireframe (`Alt + Z`) to show merged seam verts |
| 0:55 – 1:10 | Switch to Material Preview — helmet shell + visor materials visible |
| 1:10 – 1:30 | Open Python Console, type `len(bpy.data.objects["HF_HelmetFull"].data.vertices)` — show vert count |
| 1:30 – end  | Export GLB from File menu; confirm file written in the system file manager |

## Key talking points to narrate (optional voice-over)

- "The half-mesh has nothing on the left side — X < 0 was deleted."
- "direction='-X' means positive-X is the source; the op copies it to negative-X."
- "dist=0.001 — verts within 1 mm of X=0 snap together. Too small and you get a seam gap."
- "After symmetrize, recalc_face_normals is mandatory — the mirror copy has inverted winding."
- "The mirror modifier does the same thing live; symmetrize bakes it — essential for clean VRM export."

## Post-processing

- Trim to remove dead time at start/end (`ffmpeg -ss 0.5 -to 115 -i raw.mp4 screen.mp4`).
- No colour grade needed — the workbench viewport renders clearly.
- Drop into `public/library/videos/scripting/python-bmesh-ops-symmetrize-half-mesh-vrm-character-helmet-webxr/screen.mp4`.
