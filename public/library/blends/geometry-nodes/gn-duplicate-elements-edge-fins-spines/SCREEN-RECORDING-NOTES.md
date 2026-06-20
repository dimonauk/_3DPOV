# Screen Recording Notes — GN Duplicate Elements: Edge Fin Spike Sphere

Target file: `public/library/videos/geometry-nodes/gn-duplicate-elements-edge-fins-spines/screen.mp4`

## Software

- **OBS Studio 30+** (Windows / macOS / Linux) — free, open-source
- Alternatively: Windows Game Bar (`Win + G`) or macOS Screenshot (`Cmd + Shift + 5`)

## OBS Setup

1. Open OBS → **Sources** panel → click **+** → **Window Capture**
2. Select the Blender 5.1 window from the dropdown
3. **Settings → Video**:
   - Base Resolution: `1920 × 1080`
   - Output Resolution: `1920 × 1080`
   - FPS: `30`
4. **Settings → Output → Recording**:
   - Format: `MP4`
   - Encoder: `x264` (or NVENC/AMF if GPU available)
   - CRF: `18` (high quality)
   - Preset: `veryfast`
5. Audio: set all tracks to **disabled** (tutorials are silent)

## What to record

Run `blueprint.py` first in Blender's scripting workspace to create the scene.
Then record these steps for the screen.mp4:

### Part A — Node graph walkthrough (≈ 90 s)
- Open the **Geometry Nodes editor**
- Pan through the node graph showing the full chain:
  `Normal → FieldOnDomain → StoreNamedAttribute → DuplicateElements → NamedAttribute → NoiseTexture → VectorMath → ExtrudeMesh → JoinGeometry`
- Hover over **FieldOnDomain** → show the tooltip: *"Evaluate on Domain: converts a field from its natural domain to the specified domain"*
- Hover over **DuplicateElements** → note the `Domain = Edge` property in the sidebar

### Part B — Live parameter adjustment (≈ 60 s)
- Select the `spike_sphere` in the viewport
- Open **Properties → Modifier** panel
- Slowly drag **Fin Height** from `0.10` → `0.50` → back to `0.30`; show fins growing
- Drag **Noise Scale** from `0.5` → `6.0`; show height variation pattern changing

### Part C — Wireframe comparison (≈ 30 s)
- In the 3D viewport, press `Z` → **Wireframe** — show the disconnected fin quads
- Press `Z` → **Solid** — back to solid view with materials

### Part D — GLB export (≈ 30 s)
- **File → Export → glTF 2.0** — show the settings (Apply Modifiers on, Draco on, level 6)
- Click **Export glTF 2.0**

## Edit notes (Blender VSE or DaVinci Resolve)

- Cut Parts A → B → C → D into a single 3-minute tutorial clip
- Add title card at start: "Duplicate Elements — Edge Fins | Blender 5.1 | Holoflow Studio"
- Optionally overlay node names as text strips (VSE: Add → Text strip, position top-right corner)
- Export final as H.264 MP4, 1920×1080, 30fps
