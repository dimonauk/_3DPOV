# Screen Recording Notes — Tensegrity T3 Poi Head

**Target file**: `public/library/videos/scripting/`
`python-numpy-tensegrity-simplex-3prism-force-density-snelson-self-stress-poi-webxr/screen.mp4`

---

## OBS / Game Bar Setup

| Setting | Value |
|---|---|
| Capture source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 |
| Bitrate | 8000 kbps |

---

## What to record

**Session 1 — Script execution** (~3 min)

1. Open Blender → New File → General
2. Switch to **Scripting** workspace
3. Load `blueprint.py` via Text Editor → Open
4. Hit **Run Script** (▶ or Alt+P)
5. Pause on the **Info** bar output — show the printed eigenvalue table and
   `"Max equilibrium residual: … < 1e-12"` line
6. Switch to **Layout** workspace — the tensegrity poi head is visible
7. Orbit slowly (middle-mouse drag) to show 3D structure from multiple angles
8. In the **Properties** panel → Object Data → Shape Keys:
   - Scrub `SK_Compressed` from 0 → 1 to show the structure flattening
   - Scrub back to 0, then scrub `SK_Inverted` to show the chirality flip

**Session 2 — Eigenvalue console** (~1 min)

1. Open **Python Console** (editor type dropdown)
2. Paste and run:
   ```python
   import numpy as np
   from mathutils import Vector
   # Nodes
   R, H, TW = 0.11, 0.28, 30.0
   tw = np.radians(TW)
   top_a = np.radians([0, 120, 240])
   bot_a = top_a + tw
   nodes = np.vstack([
       np.column_stack([R*np.cos(top_a), R*np.sin(top_a), [H/2]*3]),
       np.column_stack([R*np.cos(bot_a), R*np.sin(bot_a), [-H/2]*3])
   ])
   # Incidence + force densities
   E = [(0,4),(1,5),(2,3),(0,3),(1,4),(2,5),(0,1),(1,2),(0,2),(3,4),(4,5),(3,5)]
   q = [-1,-1,-1, 1,1,1, 1/np.sqrt(3)]*2 + [1/np.sqrt(3)]*(-1)
   q = [-1,-1,-1]+[1]*3+[1/np.sqrt(3)]*6
   C = np.zeros((12,6)); 
   for k,(i,j) in enumerate(E): C[k,i]=1; C[k,j]=-1
   D = C.T@np.diag(q)@C
   print("eigvalsh:", np.round(np.linalg.eigvalsh(D), 8))
   print("residual:", np.max(np.abs(D@nodes)))
   ```
3. Show output: four eigenvalues ≈ 0, two positive, residual < 1e-12

**Session 3 — record.py render** (~1 min setup, render offline)

1. Load `record.py` via Text Editor
2. Run Script — check animation in Timeline
3. Start render via Render → Render Animation (or Ctrl+F12)
4. Show the first few frames of the render preview

---

## Post-processing

- Trim to 60–90 seconds
- Export as H.264 MP4 at 1920×1080
- Save as `screen.mp4` in the target folder above

---

*These notes are for Dimona's local Blender session or a connected MCP Blender instance.*
