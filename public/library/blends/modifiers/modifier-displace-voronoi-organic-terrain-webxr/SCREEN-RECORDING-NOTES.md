# Screen Recording Notes — Modifier Displace: Voronoi Organic Terrain
**OBS / Xbox Game Bar · `screen.mp4` capture instructions**

## Capture settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF |
| Output | `public/library/videos/modifiers/modifier-displace-voronoi-organic-terrain-webxr/screen.mp4` |

## Recording sequence (target: 90–120 seconds)

**Part 1 — Modifier stack setup (40 s)**

1. Open Blender. New file. Delete the default cube.
2. Add → Mesh → UV Sphere (segments 32, rings 16).
3. Open Properties → Modifier tab (blue spanner icon).
4. Add Modifier → Deform → **Subdivision Surface** (levels 3, Catmull-Clark).
5. Add Modifier → Deform → **Displace** — confirm it appears ABOVE SubDiv in the stack.
6. In the Displace modifier, click the texture selector → New.
7. Switch to **Properties → Texture tab** (chequered pattern icon) while Displace is active.
8. Set Type → **Voronoi**. Set Color → **Cell Noise**. Set Scale to 0.40.

**Part 2 — Live parameter tuning (30 s)**

9. Back in the Modifier tab: **scrub Displace → Strength** from 0.00 to 0.28.
   Show the viewport responding in real time.
10. **Scrub Texture → noise_scale** from 0.80 (coarse boulders) to 0.15 (fine pores).
    Show the ridge density changing.

**Part 3 — Stack order demonstration (20 s)**

11. In the modifier stack, **drag Displace BELOW SubDiv** (so SubDiv is on top).
    Note how the viewport shows faceted spikes — displacement with no tessellation.
12. **Drag Displace back ABOVE SubDiv**. The smooth bumps return.
    Verbally or via text overlay: "SubDiv at bottom, Displace at top — that's the key."

**Part 4 — Export (20 s)**

13. File → Export → glTF 2.0 → confirm **Apply Modifiers** is ticked.
14. Click Export glTF 2.0. Show the file dialog.
