"""
GN Simulation Zone — Spring-Pendulum Poi Tether: Elastic Orbit with Air Drag
=============================================================================
Blender 5.1  ·  CC0  ·  Holoflow Studio

A poi head hangs from an elastic tether whose upper end (the "hand") moves in
a prescribed circular orbit.  The poi head is evolved frame-by-frame inside a
GN Simulation Zone using semi-implicit Euler (kick-drift), accumulating its
trail as a growing point cloud that is converted to a coloured ribbon GLB.

Physics (2-D in the XY plane; Z is vertical display axis):

  d  = r_poi - r_hand           (displacement from hand to poi head)
  s  = |d| - L0                 (stretch beyond natural length)
  F_spring = -k · s · d̂         (restoring force along tether axis)
  F_drag   = -c · v             (linear air resistance)

  Semi-implicit Euler (kick-drift):
    v_{n+1} = v_n + (F_spring + F_drag) / m · dt   ← kick
    r_{n+1} = r_n + v_{n+1} · dt                    ← drift using NEW v

  Hand orbit:
    r_hand(t) = R_h · (cos(ω_h · t), sin(ω_h · t), 0)

  When ω_h ≈ ω_0 / 2  (ω_0 = √(k/m)):  two-beat lissajous (butterfly)
  When ω_h ≈ ω_0    :  one-to-one (elongated circle — isolation family)
  When ω_h ≈ 2·ω_0  :  inspin (poi and hand same-direction, tight inner loop)

State stored as FLOAT_VECTOR named attribute 'vel' on the POINT domain.
Each strand-ID is a separate point on the source mesh.

Outside sources:
  Blender Manual — Simulation Zone  CC-BY-SA-4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html
    related: https://projects.blender.org/blender/blender
  OpenStax University Physics Vol.1 Ch. 15 — Oscillations  CC BY 4.0
    https://openstax.org/books/university-physics-volume-1/pages/15-introduction
    related: https://github.com/openstax
  glTF 2.0 Specification  MIT  Khronos Group
    https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/README.md
    related: https://github.com/KhronosGroup
"""

import bpy, bmesh
from mathutils import Vector
import math

# ---------------------------------------------------------------------------
# Parameters
# ---------------------------------------------------------------------------
N_STRANDS   = 6          # poi heads — each gets a different initial phase
L0          = 0.60       # tether natural length (m)
K           = 90.0       # spring constant  (N/m)   → ω_0 = √(90/0.05) ≈ 42 rad/s
M           = 0.05       # poi head mass (kg)
C           = 0.8        # drag coefficient (N·s/m)
R_HAND      = 0.25       # radius of hand orbit (m)
OMEGA_HAND  = 7.0        # hand angular velocity (rad/s) — ≈ ω_0/6 → butterfly family
N_FRAMES    = 180        # simulation length (frames at 24 fps = 7.5 s)
FPS         = 24
DT          = 1.0 / FPS

TUBE_RADIUS = 0.012      # ribbon/tube profile radius (m)
TUBE_SIDES  = 6          # hexagonal cross-section for faceted look

OUT_PATH    = "//hf_poi_lissajous.glb"

# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = N_FRAMES

# ---------------------------------------------------------------------------
# Simulate spring-pendulum in Python (matches the GN Simulation Zone logic)
# This is the reference implementation; the blueprint also documents the
# equivalent node graph below.
# ---------------------------------------------------------------------------
OMEGA_0 = math.sqrt(K / M)   # natural tether frequency

# Initial conditions: poi head at rest at natural length below hand
def initial_pos(strand_idx: int) -> Vector:
    phase = 2 * math.pi * strand_idx / N_STRANDS
    # hand starts at phase-offset position; poi head directly below at natural length
    hx = R_HAND * math.cos(phase)
    hy = R_HAND * math.sin(phase)
    return Vector((hx, hy - L0, 0.0))   # below hand (Y is "down" in XY plane)

def hand_pos(t: float, phase: float) -> Vector:
    return Vector((
        R_HAND * math.cos(OMEGA_HAND * t + phase),
        R_HAND * math.sin(OMEGA_HAND * t + phase),
        0.0,
    ))

# Integrate for all strands across all frames
strand_traces: list[list[Vector]] = []

for si in range(N_STRANDS):
    phase = 2 * math.pi * si / N_STRANDS
    pos   = initial_pos(si)
    vel   = Vector((0.0, 0.0, 0.0))
    trace: list[Vector] = [pos.copy()]

    for fi in range(1, N_FRAMES + 1):
        t = fi * DT
        h = hand_pos(t, phase)
        d = pos - h
        dist = d.length or 1e-9          # guard div-zero at exact coincidence
        stretch = dist - L0
        d_hat = d / dist
        # Forces
        f_spring = d_hat * (-K * stretch)
        f_drag   = vel   * (-C)
        # Kick (semi-implicit: update velocity first)
        vel = vel + (f_spring + f_drag) * (DT / M)
        # Drift (use new velocity)
        pos = pos + vel * DT
        trace.append(pos.copy())

    strand_traces.append(trace)

# ---------------------------------------------------------------------------
# Build ribbon geometry: one Bezier/POLY curve per strand
# ---------------------------------------------------------------------------
all_curve_objects: list[bpy.types.Object] = []

COLOURS = [
    (1.00, 0.30, 0.60, 1.0),
    (0.30, 0.80, 1.00, 1.0),
    (1.00, 0.80, 0.10, 1.0),
    (0.50, 1.00, 0.30, 1.0),
    (0.80, 0.30, 1.00, 1.0),
    (1.00, 0.55, 0.10, 1.0),
]

for si, trace in enumerate(strand_traces):
    cu = bpy.data.curves.new(f"poi_trail_{si}", type="CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth  = TUBE_RADIUS
    cu.bevel_resolution = TUBE_SIDES - 2   # approx hex sides
    cu.use_fill_caps = True

    spline = cu.splines.new("POLY")
    spline.points.add(len(trace) - 1)
    for i, p in enumerate(trace):
        spline.points[i].co = (p.x, p.y, p.z, 1.0)

    obj = bpy.data.objects.new(f"poi_trail_{si}", cu)
    bpy.context.collection.objects.link(obj)
    obj["holoflow:facet"] = True

    mat = bpy.data.materials.new(f"strand_mat_{si}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = COLOURS[si % len(COLOURS)]
        bsdf.inputs["Emission Color"].default_value = COLOURS[si % len(COLOURS)]
        bsdf.inputs["Emission Strength"].default_value = 1.5
        bsdf.inputs["Roughness"].default_value = 0.1
    cu.materials.append(mat)
    all_curve_objects.append(obj)

# ---------------------------------------------------------------------------
# Export GLB — select all ribbon objects, apply all transforms
# ---------------------------------------------------------------------------
bpy.ops.object.select_all(action="DESELECT")
for obj in all_curve_objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = all_curve_objects[0]

bpy.ops.export_scene.gltf(
    filepath        = bpy.path.abspath(OUT_PATH),
    use_selection   = True,
    export_format   = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
    export_apply    = True,
)
print(f"Exported → {OUT_PATH}")

# ---------------------------------------------------------------------------
# GN Simulation Zone — equivalent node graph description
# ---------------------------------------------------------------------------
"""
NODE GRAPH (read top → bottom within the Sim Zone):

  ┌──────────────────────────────────────────────────────────────┐
  │  Group Input ──► [Geometry]                                  │
  │                      │                                       │
  │              Simulation Input                                │
  │              ├── [Geometry out] ──► Position ──► r_prev      │
  │              └── [Geometry out] ──► Named Attribute 'vel'    │
  │                                         └──► v_prev          │
  │                                                              │
  │  Scene Time ──► Math(Multiply, OMEGA_HAND) ──► φ            │
  │  Scene Time ──► Math(Multiply, DT) ──► t                     │
  │                                                              │
  │  r_hand = CombineXYZ(                                        │
  │      x = Math(Multiply, R_HAND, Math(Cosine, φ + phase))    │
  │      y = Math(Multiply, R_HAND, Math(Sine,   φ + phase))    │
  │      z = 0 )                                                 │
  │                                                              │
  │  d      = VectorMath(Subtract, r_prev, r_hand)               │
  │  dist   = VectorMath(Length,   d)                            │
  │  stretch = Math(Subtract, dist, L0)                          │
  │  d_hat  = VectorMath(Normalize, d)                           │
  │  f_spr  = VectorMath(Scale, d_hat, Math(Multiply,-K,stretch))│
  │  f_drag = VectorMath(Scale, v_prev, -C)                      │
  │  F      = VectorMath(Add, f_spr, f_drag)                     │
  │  v_new  = VectorMath(Add, v_prev, VectorMath(Scale,F,DT/M)) │
  │  r_new  = VectorMath(Add, r_prev, VectorMath(Scale,v_new,DT))│
  │                                                              │
  │  Set Position(Position=r_new)                                │
  │  Store Named Attribute(Name='vel', Value=v_new)              │
  │              │                                               │
  │          Simulation Output                                   │
  └──────────────────────────────────────────────────────────────┘

  [per-strand phase offset injected via a 'phase' FLOAT attribute
   set to 2π·i/N before the sim zone runs]
"""
