# Screen-Recording Notes — Geometry Nodes: Low-Poly Faceted Rock

**Output path:** `public/library/videos/geometry/low-poly-faceted-rock/screen.mp4`

---

## OBS / Game Bar settings

| Setting            | Value                                   |
|--------------------|-----------------------------------------|
| Source             | Window Capture → Blender 5.1            |
| Capture resolution | 1920 × 1080                             |
| Output FPS         | 30                                      |
| Audio              | **Off** — narrate in a separate pass    |
| Format             | MP4 (H.264, CRF ~22)                   |
| Bitrate cap        | 8 000 Kbps                              |

---

## Procedure

### Before you hit Record

1. Open Blender 5.1. File → New → General (delete the default cube when prompted).
2. Open the **Text Editor** panel (drag the panel header → change type to Text Editor).
3. Text → Open → navigate to `blueprint.py` in this folder.
4. Set the viewport to **Solid** mode (press `Z`, choose Solid).  
   Solid with the flat-colour rock reads far better on a recording than EEVEE.
5. Hide the timeline and properties shelf so the viewport is as large as possible.
6. Start OBS / Game Bar. Confirm Blender's window is captured.

### The recording (3–5 minutes)

**Part 1 — run the script (30 s)**
- Click **Run Script** (▷ button) or press **Alt+P** in the Text Editor.
- The rock appears at world origin. Let the viewer see it for a beat.

**Part 2 — inspect the result (60 s)**
- Middle-mouse rotate around the rock. Show the faceted surface from several angles.
- Numpad 5 to toggle orthographic; 1, 3, 7 for front/side/top. 
  Orthographic views make the facets pop as distinct planes.

**Part 3 — the Geometry Nodes panel (90 s)**
- Select the rock. Open Properties → Modifier Properties (wrench icon).
- Show the RockGen modifier entry. Click the node-group name to open a Geometry Node Editor.
- Walk through the node chain: Subdivide → Noise → Map Range → Vector Scale → Set Position → Set Shade Smooth.
- Mouse over the Noise Scale and Detail inputs; type a new value to show live displacement update (modifier is still live before applying).

**Part 4 — material and export (60 s)**
- Properties → Material (sphere icon). Show the flat Principled BSDF.
- File → Export → glTF 2.0 (.glb/.gltf). Confirm the export settings (Draco on, +Y up).
- Show the exported file in the file manager if convenient.

**Stop recording.**

---

## Post-processing hint

Trim the file so it starts the moment the script runs and ends when the
rock is rotating in the viewport. Cut at a natural pause — do not fade to
black; the library player loops the clip.

Rename the final file: `screen.mp4`  
Move it to: `public/library/videos/geometry/low-poly-faceted-rock/`
