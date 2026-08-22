# Screen Recording Notes — 3D Hilbert Space-Filling Curve Poi Head

**Target file:** `public/library/videos/scripting/python-numpy-3d-hilbert-space-filling-curve-moore-1900-bishop-tube-poi-webxr/screen.mp4`

---

## OBS Studio setup

| Setting | Value |
|---------|-------|
| **Source** | Window Capture → Blender |
| **Resolution** | 1920 × 1080 |
| **Frame rate** | 30 fps |
| **Audio** | Off (no mic, no system audio) |
| **Output format** | MP4 / H.264 |
| **Bitrate** | 8 000 kbps (CBR) |

---

## What to record

### Step 1 — Scripting workspace (≈ 30 s)
1. Open Blender 5.1.
2. Switch to the **Scripting** workspace (top tab bar).
3. In the text editor, open `blueprint.py`.
4. Scroll slowly through the file so the `hilbert3d_points`, `bishop_frame`,
   and `build_tube` functions are each readable for 3–4 seconds.

### Step 2 — Run the script (≈ 20 s)
1. Hover over the text editor and press **Alt + P** (or click ▶ Run Script).
2. Let the terminal output scroll — `[Hilbert] Computing…` and
   `[Hilbert] Tube: … verts …` should appear.
3. After the script completes, the poi head appears in the viewport.

### Step 3 — Inspect the result (≈ 40 s)
1. Press **Numpad 5** to toggle orthographic view, then **Numpad 1** for
   front view.  The serpentine tube should fill the bounding box evenly.
2. Rotate to **Numpad 7** (top view).  The grid pattern of the Hilbert curve
   is most obvious here — 8 × 8 columns.
3. Hold **Middle Mouse** and slowly tumble to a perspective quarter-view.
4. Press **Z → Material Preview** to see the cobalt→amber gradient.

### Step 4 — Close-up of the vertex colour gradient (≈ 20 s)
1. Zoom in on one corner of the poi head where the tube transitions from
   cobalt to amber.
2. Hover and press **Z → Solid** to show the flat colour without lighting.

### Step 5 — GLB check in the outliner (≈ 10 s)
1. In the **Outliner** (top-right), expand `hf_hilbert_poi`.
2. Switch **Display Mode** to **Data** to confirm the `Hilbert_T` vertex
   attribute is listed.

---

## Post-processing (optional)
- Trim the recording to ≈ 2 min.
- No titles or commentary needed; the code speaks for itself.
- Do **not** re-encode at a lower resolution — WebXR playback benefits from
  the native 1080 p source.
