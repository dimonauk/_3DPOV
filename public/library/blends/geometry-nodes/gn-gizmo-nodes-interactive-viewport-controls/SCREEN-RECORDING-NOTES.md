# Screen Recording Notes — GN Gizmo Nodes: Parametric Roman Arch

Target file: `public/library/videos/geometry-nodes/gn-gizmo-nodes-interactive-viewport-controls/screen.mp4`

## Setup

1. Open `roman_arch_gizmos.blend` in Blender 5.1.
2. Select the **RomanArch** object.
3. Press `N` to open the Sidebar — confirm "GN_RomanArch" modifier is visible
   with Width / Height / Thickness / Depth / PillarH inputs.
4. In the 3D Viewport, switch shading to **Material Preview** (Z → Material Preview,
   or the sphere icon in the viewport header).
5. Make sure **Overlays** are ON (the overlays button in the header) — gizmo arrows
   render as viewport overlays.

## OBS / Game Bar settings

| Setting         | Value                                 |
|----------------|---------------------------------------|
| Window source  | Blender 5.1 (3D Viewport)            |
| Resolution     | 1920 × 1080                           |
| Frame rate     | 30 fps                                |
| Encoder        | H264 (software) or NVENC if available |
| Audio          | OFF — no mic, no system audio         |
| Output format  | MP4                                   |

## Shot list (target ≈ 60–90 seconds)

1. **Wide shot** (5 s): arch at default proportions, rotate the viewport slowly
   to show the 3D ring and pillars.

2. **Show the handles** (5 s): click the RomanArch object to select it.  The
   two Linear Gizmo arrows should appear: a horizontal arrow at the arch's right
   shoulder (Width) and a vertical arrow above the crown (Height).  Zoom in
   so both are visible.

3. **Drag Width gizmo** (15 s): hover over the horizontal arrow — cursor changes
   to a move icon.  Click-drag right to widen the arch to ~7 m, pause, then
   drag back to ~4 m.  The arrow position tracks the arch edge in real time.

4. **Drag Height gizmo** (15 s): hover over the vertical arrow above the crown.
   Drag upward to ~4.5 m (observe the arch rise), then return to ~2.5 m.

5. **Sidebar comparison** (10 s): press N to show the Sidebar, drag the Width
   slider while pointing out that the gizmo handle moves in sync.  This
   demonstrates the bidirectional binding — handle and sidebar are the same
   modifier property.

6. **Final orbit** (10 s): deselect the object (click empty space), orbit to
   show the finished arch from a 3/4 angle.

## Post-processing

None required.  Trim the clip to ≤ 90 s in DaVinci Resolve or Kdenlive.
Export as MP4 / H264 / 30 fps, save to the target path above.
