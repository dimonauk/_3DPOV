# Screen Recording Notes — Metaball Blob Creature

**For:** `screen.mp4` alongside the viewport-rendered `viewport.mp4`  
**Target path:** `public/library/videos/procedural/metaball-organic-blob-creature-glb/screen.mp4`

---

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no microphone needed) |
| Output format | MP4 (H.264) |
| CRF / quality | 18–22 |

---

## What to Record

### 0:00 – 0:20 — Scene overview
1. Open `blob_creature.blend` from the Scripting workspace, then switch to **Layout**.
2. Pan back so the full creature fits the viewport.
3. Slowly orbit (middle-mouse drag) around the creature: front → right side → back → front.
4. Pause on the front view; press **Numpad 1**.

### 0:20 – 0:45 — Properties inspector
1. Select the creature object.
2. Open **Object Properties → MetaBall** rollout in the Properties panel.
3. Hover over `Threshold` and highlight it (don't change yet).
4. Hover over `Resolution` — explain the grid size relationship.
5. Click on the `Elements` section to show the element list.

### 0:45 – 1:15 — Live threshold edit
1. Click the `Threshold` value and drag it from **0.60 down to 0.30**.
   - Watch the arms and head begin to separate from the body.
2. Drag back up to **0.85** — the surface shrinks to near-nothing.
3. Return to **0.60**.
4. Pause 3 seconds on the restored creature.

### 1:15 – 1:40 — Negative element demonstration
1. In the MetaBall Elements list, select one of the eye socket elements
   (they are the two BALL elements with `use_negative` ticked).
2. Tick `use_negative` OFF — the eye socket becomes a bulge.
3. Tick it back ON — the depression returns.

### 1:40 – 2:00 — Convert to mesh
1. Tab into **Object Mode** (if not already).
2. Press **F3**, search **Convert**, select **Convert to Mesh**.
3. Scrub through the mesh in **Edit Mode** (`Tab`) to show the triangle topology.
4. Switch back to **Object Mode**.

---

## Tips

- Keep the Blender window maximised; hide the Python console.
- Use `Alt + A` to deselect all before switching context.
- If the viewport update stalls on threshold drag, switch `Update` to `Never`
  in MetaBall properties, drag, then set back to `Half Resolution` to refresh.
- Zoom in on the eye sockets during the negative-element section so viewers can
  clearly see the concavity.
