# Screen Recording Notes — Barth Sextic Poi Head

## Goal
Capture `screen.mp4` showing the full workflow: Script Editor → run `blueprint.py`
→ rotate & inspect the 65-spike surface in the 3D Viewport → File ▸ Export GLB.
Target: **90–120 seconds**, 1920 × 1080, 30 fps.

---

## OBS Setup

| Setting | Value |
|---|---|
| **Window source** | Blender 5.1 (title bar match) |
| **Resolution** | 1920 × 1080 |
| **FPS** | 30 |
| **Audio** | Disabled (no mic needed) |
| **Output format** | MP4 / H.264, CRF 17 |
| **Output filename** | `screen.mp4` |

---

## Shot list

### 1. Script Editor (0–20 s)
- Switch to **Scripting** workspace.
- Open `blueprint.py` via Text ▸ Open.
- Pause on the equation block: scroll slowly through the `FA`, `FB`, `FC`, `F =` lines so viewers can read the Barth sextic formula.

### 2. Run script (20–45 s)
- Press **Run Script** (▶ button or Alt+P).
- The Info bar will show operator calls; let the progress messages print in the console.
- Expected: ~8–12 seconds for N=100 on a modern CPU.

### 3. Viewport inspection (45–90 s)
- Switch to **3D Viewport**, Solid mode.
- Press Numpad 5 (orthographic), then 1/3/7 to show front/side/top — each
  confirms the Ih symmetry (5-fold, 3-fold, 2-fold rotational axes).
- Press `Z` → Wireframe: the ~200k facet edges are visible; node spike-tips
  stand out clearly.
- Switch to **Material Preview** (`Z` → Material Preview) to see the gold
  metallic shading.
- Tumble slowly with Middle Mouse to show the spiky topology from multiple angles.

### 4. Export (90–110 s)
- File ▸ Export ▸ glTF 2.0 (.glb/.gltf).
- Show the Draco checkbox ticked (level 6) and the +Y-up option enabled.
- Click **Export**.

---

## Tips
- Maximise the Blender window before recording (remove taskbar from frame).
- Use Blender's **Dark** theme — higher contrast for video compression.
- If the surface appears as a smooth ball with no spikes, N was too low; increase
  to 120 in the script before recording.
