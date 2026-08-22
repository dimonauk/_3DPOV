# Screen Recording Notes
## shader-cycles-displacement-adaptive-subdivision

**Software**: OBS Studio or Windows Game Bar  
**Source**: Window Capture → Blender (not Display Capture)  
**Resolution**: 1920 × 1080  
**Frame rate**: 30 fps  
**Audio**: off

---

## What to record (target ~4 minutes)

### 1. Feature Set toggle (0:00 – 0:30)
- Open `stone_displaced.blend`
- Go to **Properties › Render › Feature Set** dropdown
- Record yourself switching between **Supported** and **Experimental**
- In Supported mode: the Subdivision Surface modifier shows no "Adaptive" tick
- In Experimental: tick appears; dicing rate field becomes active
- Narrate: *"Adaptive Subdivision only exists behind the Experimental flag — it's
  stable but Blender keeps it here to signal that render times can be
  unpredictable on complex scenes."*

### 2. Displacement mode comparison (0:30 – 1:30)
- Open **Properties › Material › Settings › Displacement** dropdown
- Record switching between **Bump Only**, **Displacement Only**, **Displacement and Bump**
- Switch the viewport to **Rendered** (EEVEE preview)
- Point camera at the silhouette edge of the sphere:
  - In Bump mode: silhouette is perfectly smooth
  - In Displacement mode (EEVEE shows it as bump approximation): similar
  - Note: "To see TRUE geometry displacement you must render with Cycles"
- Switch engine to **Cycles** and show the Rendered viewport with the displaced
  silhouette after a few seconds of progressive rendering

### 3. Dicing rate effect (1:30 – 2:30)
- With Cycles + Experimental active, open **Properties › Render › Subdivision**
- Record changing **Dicing Rate** from 8.0 to 1.0 in steps (8, 4, 2, 1)
- With each step, wait for the rendered viewport to settle and compare:
  - At 8.0: blocky faceted displacement (cheap)
  - At 1.0: smooth micropolygon surface, correct silhouette (expensive)
- Show the **Statistics** overlay (Viewport Overlays › Statistics) to see
  the triangle count jump as dicing rate decreases

### 4. Node graph walkthrough (2:30 – 3:15)
- Open Shader Editor
- Walk the chain: Noise Texture → ColorRamp → Displacement → Material Output
- Drag the ColorRamp's left stop from 0.35 to 0.0 and back:
  - At 0.35: peaks-only displacement (deep valleys stay flat = erosion look)
  - At 0.0: full ±displacement (lumpy foam look)
- Change `Scale` on the Displacement node from 0.12 to 0.30 live (Cycles viewport)

### 5. Bake preview (3:15 – 4:00)
- Select `stone_sphere_bake_target` (the duplicate without subdivision modifier)
- Shift-select `stone_sphere` (the displaced original)
- Make `stone_sphere_bake_target` active (brighter orange outline)
- Open **Properties › Render › Bake** panel
- Set **Bake Type = Normal**, tick **Selected to Active**
- Set **Cage Extrusion = 0.25** (must exceed max displacement height of 0.12)
- Hit **Bake** — watch the 2 K normal map fill in on the `normal_bake_2k` image
- Show the baked target sphere with the normal map applied: identical shading to
  the displaced version but zero subdivision

---

## Output file
Save to: `public/library/videos/shading/shader-cycles-displacement-adaptive-subdivision/screen.mp4`
