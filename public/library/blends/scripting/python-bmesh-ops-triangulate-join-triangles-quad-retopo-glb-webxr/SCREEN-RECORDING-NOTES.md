# Screen Recording Notes
## bmesh.ops.triangulate + join_triangles — Buckler Shield

**Target file:** `public/library/videos/scripting/python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr/screen.mp4`

---

### OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| CRF | 18 |

---

### Steps to record

1. Open Blender 5.1. Load or create a new file.
2. Open the **Scripting** workspace.
3. Load `blueprint.py` into the text editor (Text › Open).
4. Enable **Overlay › Wireframe** in the 3D Viewport (top-right overlay dropdown, tick **Wireframe**).
5. Set viewport shading to **Solid** (Z → Solid, or press the sphere icon).
6. **Start recording in OBS.**

#### Pass 1 — Raw topology

7. Select all text in the text editor (`Ctrl+A`).
8. Hover over the 3D Viewport and zoom in on the empty origin.
9. **Run Script** (`Alt+P` or click the ▶ button).
10. The shield appears with **6 quads and 1 central n-gon boss** visible in wireframe.
    - Hover and briefly narrate: *"Six quads on the outer band. One 6-sided n-gon closing the central boss — this is what the .blend holds before any triangulation."*
11. Orbit slowly around the object for 5 seconds.

#### Pass 2 — Triangulate only

12. In `blueprint.py`, **comment out** the `join_triangles` block (lines around STEP C).
    - Mark the `horiz_tris = ...` and `bmesh.ops.join_triangles(...)` call.
13. Clear the viewport (delete the object manually: `X`, Confirm).
14. Run script again (`Alt+P`).
15. The shield now shows a **dense triangle wireframe** on every face, including the former n-gon boss.
    - Narrate: *"After `bmesh.ops.triangulate(quad_method='BEAUTY')` every face is a triangle. The n-gon boss has been ear-clipped into clean tris."*

#### Pass 3 — Full pipeline (triangulate + join_triangles)

16. Re-enable the `join_triangles` block (un-comment).
17. Delete the object again and run script (`Alt+P`).
18. The top and bottom slab faces show **quads** again; the vertical side band retains triangles.
    - Narrate: *"After `bmesh.ops.join_triangles` on horizontal faces the flat top and base are clean quads again. Sides stay as tris because they failed the angle_face_threshold test."*
19. Orbit slowly. Hold for 5 seconds.

20. **Stop OBS recording.**

---

### Post-processing (optional)

- Cut clips to ~15 s total with DaVinci Resolve or ffmpeg:
  ```
  ffmpeg -i screen_raw.mp4 -ss 00:00:02 -t 15 -c copy screen.mp4
  ```
- Place the final `screen.mp4` at the path above.
