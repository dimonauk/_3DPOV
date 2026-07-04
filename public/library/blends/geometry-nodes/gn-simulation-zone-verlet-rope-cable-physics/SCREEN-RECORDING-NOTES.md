# Screen Recording Notes — GN Verlet Rope

**Target file**: `public/library/videos/geometry-nodes/gn-simulation-zone-verlet-rope-cable-physics/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 / NVENC H.264 |
| Output | MKV during capture → remux to MP4 |
| Audio | **Off** (mic + system muted) |

## What to Record

**Total target**: 8–12 minutes screen time.

### Part 1 — Open the blend (1 min)
- Open `verlet_rope.blend`
- Switch to the **Geometry Nodes** workspace
- Show the modifier on `rope_cable_host` in the Properties panel
- Briefly orient the viewer: anchor empty visible in viewport, rope tube hanging

### Part 2 — Tour the Simulation Zone (3 min)
- Click the Simulation Zone pair (In/Out) — explain the temporal feedback loop
- Show the `Store Named Attribute` node (prev_pos) and explain the ordering:
  *prev_pos stored BEFORE new positions are committed*
- Trace the Verlet math nodes: `SUBTRACT` → velocity; `ADD + ADD` → new_pos
- Show the gravity `Value` node (dt²) and the `CombineXYZ` that funnels only Z

### Part 3 — Constraint Repeat Zone (3 min)
- Open the Repeat Zone interior (click the zone strip to enter)
- Show `OffsetPointInCurve` (+1) and `SampleIndex` — explain: we read the
  NEXT point's position using the current iteration's geometry
- Trace the `SUBTRACT → LENGTH → SUBTRACT → ×0.5 → DIVIDE → SCALE` chain
  that computes the projection scalar
- Show the `Switch` node zeroing the correction at the last curve point
  (is_valid=False)
- Show `SetPosition` using Offset (not Position) — this accumulates across iters

### Part 4 — Pin and live playback (2 min)
- Point out the `FunctionNodeCompare (INT, EQUAL)` selecting index 0
- Show `SetPosition` with Selection mask — only point 0 gets overridden
- Press **Space** from frame 1 and let the rope swing in real time
- Scrub the timeline — rope should swing and settle
- Optionally: change `Iterations` input from 6 → 2 to show springier rope,
  then back to 6 for stiff cable

### Part 5 — Inspect the Spreadsheet (1 min)
- Open the **Spreadsheet** editor
- Select `rope_cable_host`, switch domain to **Point**
- Show the `prev_pos` attribute column alongside `position`
- Scrub one frame forward — both columns update

## Post-production
- Trim start/end handles
- Speed ramp: 1.5× speed on node-tour sections (> 4 min of touring)
- No music, no voiceover (silent tutorial format)
- Export H.264 MP4, 1920 × 1080, CRF 20
