# Screen Recording Notes — GN Shortest Edge Path: Circuit Trace Network

## Setup

1. Run `blueprint.py` headlessly to generate `circuit_trace_sphere.blend`.
2. Open that file in Blender 5.1.

## Viewport configuration

- Shading → **Rendered** (Z key → Rendered, or top-right sphere icon in 3D Viewport).
- In **Properties → Render → Bloom**, enable bloom so the emissive cyan traces glow.
- Numpad `5` → perspective view; orbit to a 3/4 angle showing the full sphere.
- Collapse the N-panel (N key) and Properties sidebar for clean screen estate.
- If the sphere looks flat or traces are invisible, check the modifier panel:
  confirm **Input_2 (Start Density)** is set to 0.60.

## OBS settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 — maximised 3D Viewport |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4, H.264, CRF 18 |

Save to:
`public/library/videos/geometry-nodes/gn-shortest-edge-path-circuit-trace/screen.mp4`

## Shot list (~8 min total)

### 1 — Overview orbit (60 s)
Orbit slowly around the sphere. Show the equatorial origin of traces and their
convergence at the poles. Pause at the north-pole view — all traces converge
to a single point, proving the Dijkstra destination.

### 2 — Node editor walkthrough (3 min)
Open the GN modifier node editor (Properties → Object Properties → modifier icon
→ Edit in Node Editor). Walk left to right:
- `IcoSphere` node → the source mesh.
- `Position → SeparateXYZ → Math(ABS) → Compare(GT 0.70)` → polar-cap end vertices.
- `Compare(LT 0.35) + RandomValue(BOOLEAN) + BooleanMath(AND)` → equatorial starts.
- `InputIndex → RandomValue(FLOAT)` → random per-edge cost.
- `ShortestEdgePaths` → the next-hop tree.
- `EdgePathsToCurves` → one curve per start vertex.
- `SetCurveRadius → CurveToMesh → SetMaterial` → tube geometry.
- `JoinGeometry` → sphere + traces merged for output.

### 3 — Live edit: cost max (90 s)
Select the `RandomValue(FLOAT)` node for edge cost. Change **Max** from `3.0` to:
- `1.1` — near-geodesic meridians (symmetric, boring).
- `3.0` — default circuit traces (organic detours).
- `6.0` — aggressive zigzag (very busy).
Orbit the sphere after each change. This is the central teaching moment.

### 4 — Live edit: start density (60 s)
Open the modifier panel. Drag **Input_2 (Start Density)** from 0.0 → 0.60 → 1.0.
Show the trace count growing. At 1.0 the equatorial band is saturated.

### 5 — Polar convergence close-up (30 s)
Position camera directly over the north pole (Numpad 8 to tilt up). All traces
converge at the pole cap — the Dijkstra endpoint geometry is visible clearly.

### 6 — GLB export (60 s)
File → Export → glTF 2.0. Enable **Apply Modifiers** and **Draco Mesh Compression
(Level 6)**. Export. Show the file size (~200–400 KB after compression).
