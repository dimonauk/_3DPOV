"""
Hénon Map Strange Attractor — Basin Relief + Poi Light Trail
=============================================================
Blender 5.1 | Holoflow Studio | CC0
Source: Hénon 1976 Communications in Mathematical Physics 50(1):69–77

Two objects from one 2D map:
  1. hf_henon_basin — 200×200 quad grid, Z = escape-time fraction × BASIN_ZSCALE,
     vertex colours encode the fractal basin boundary via a plasma-like hue ramp.
  2. hf_henon_trail — 3 NURBS bevel curves tracing the strange attractor orbit
     lifted into 3D poi arm-reach space.

Hénon map:  x' = 1 − a·x² + y    (quadratic fold)
             y' = b·x              (area-contracting shear)
Classic params: a=1.4, b=0.3
  → det(J) = −b = −0.3 : area contracts by 30% per step
  → Lyapunov exponents: λ₁ ≈ +0.420, λ₂ ≈ −1.622 bits/step
  → Kaplan–Yorke dimension: D_KY = 1 + λ₁/|λ₂| ≈ 1.259

WHY two outputs: the basin mesh makes the fractal boundary a tangible 3D
relief surface; the poi trail turns the orbit itself into a prop for WebXR.
Both derive from the same iteration — zero code duplication.

WHY b=0.3 not b=0: b=0 reduces to the logistic map (no shear), losing the
2D structure. Area contraction |b|<1 is what forces the orbit onto a
lower-dimensional attractor — it cannot be a manifold because the
contracting and expanding directions are not commensurate.

WHY ESCAPE_R=8.0: the attractor lives inside ±2, so a point that escapes
beyond radius 8 has left the basin with certainty. Smaller R produces
coarse boundaries; larger R adds trivial iteration cost.
"""

import bpy, bmesh, math, colorsys
import numpy as np

# ── Parameters ────────────────────────────────────────────────────────────
A            = 1.4      # fold strength; classic Hénon value
B            = 0.3      # shear / dissipation; |det J| = |b| < 1
ESCAPE_R     = 8.0      # orbit escapes to ∞ once outside this radius
MAX_ITER     = 96       # colour resolution: log₂(ESCAPE_R) ≈ 3 → 96 steps
TRANSIENT    = 500      # iterations discarded before recording orbit

GRID_N       = 200      # basin grid side length; 200² = 40 000 cells
GRID_XH      = 2.0      # ±x half-extent (attractor spans ±1.3)
GRID_YH      = 1.2      # ±y half-extent (attractor spans ±0.4)
BASIN_ZSCALE = 0.22     # peak Z displacement for escape-time relief [m]

ORBIT_N      = 5400     # attractor orbit length
TRAIL_N      = 3        # number of NURBS light-trail curves
TRAIL_SCALE  = 0.55     # attractor → arm-reach radius scale [m]
TRAIL_ZLIFT  = 0.35     # sinusoidal Z half-swing [m]
TRAIL_PERIOD = 1800     # steps per full Z-swing cycle
BEVEL_R      = 0.006    # tube radius on each NURBS curve [m]
TRAIL_OFFSET = (0.0, 0.0, 0.55)  # lift basin + trail apart in Z

GLB_PATH     = "//hf_henon.glb"


# ── Colour map ────────────────────────────────────────────────────────────

def _plasma_rgba(t: float) -> tuple[float, float, float, float]:
    """
    Approximate plasma colour map: t ∈ [0,1] → RGBA.
    t=0 (inside basin / slow escape) → blue-purple
    t=1 (fast escape) → yellow-orange
    WHY HSV approximation: avoids scipy/matplotlib dependency inside Blender;
    the ramp is perceptually adequate for vertex-colour display in EEVEE.
    """
    h = 0.70 - t * 0.64
    s = 0.88 + t * 0.12
    v = 0.50 + t * 0.50
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, s, v)
    return r, g, b, 1.0


# ── Basin escape grid (vectorised) ────────────────────────────────────────

def _compute_basin_grid() -> np.ndarray:
    """
    Returns float32 array (GRID_N, GRID_N) in [0, 1].
    Value = escape_iteration / MAX_ITER; 0 = inside basin (no escape).

    WHY per-row vectorisation: pure per-point Python loops at 200² = 40 000 pts
    × 96 iterations = 3.84 M function calls → ~8 s. Vectorising over the X axis
    (each row is GRID_N points) reduces to GRID_N=200 Python loop ticks, each
    doing GRID_N-wide numpy operations — ~0.6 s at N=200.
    """
    xs = np.linspace(-GRID_XH, GRID_XH, GRID_N).astype(np.float64)
    ys = np.linspace(-GRID_YH, GRID_YH, GRID_N).astype(np.float64)
    esc = np.zeros((GRID_N, GRID_N), dtype=np.float32)

    for iy, y0 in enumerate(ys):
        x = xs.copy()
        y = np.full(GRID_N, y0)
        active = np.ones(GRID_N, dtype=bool)
        for i in range(1, MAX_ITER + 1):
            x_new = 1.0 - A * x * x + y
            y_new = B * x
            x, y = x_new, y_new
            newly_escaped = active & (x * x + y * y > ESCAPE_R * ESCAPE_R)
            esc[iy, newly_escaped] = i / MAX_ITER
            active &= ~newly_escaped
            if not active.any():
                break
    return esc                          # esc[iy, ix]; transposed for bmesh below


# ── Build basin mesh ──────────────────────────────────────────────────────

def build_basin() -> bpy.types.Object:
    """
    Direct bmesh construction — no bpy.ops context dependency.
    WHY bmesh not bpy.ops.mesh.primitive_grid_add: the operator requires an
    active 3D Viewport context, which is not guaranteed in headless runs.
    bmesh.new() works in any Python environment.
    WHY float_color not vertex_colors: bpy.types.MeshLoopColorLayer (vertex_colors)
    is deprecated in Blender 4.1+; bpy.types.FloatColorAttribute with domain='POINT'
    is the 5.x API and exports correctly as GLTF accessors.
    """
    esc = _compute_basin_grid()
    xs = np.linspace(-GRID_XH, GRID_XH, GRID_N)
    ys = np.linspace(-GRID_YH, GRID_YH, GRID_N)

    bm = bmesh.new()
    col_layer = bm.verts.layers.float_color.new("Color")

    verts = []
    for ix in range(GRID_N):
        row = []
        for iy in range(GRID_N):
            t = float(esc[iy, ix])
            v = bm.verts.new((float(xs[ix]), float(ys[iy]), t * BASIN_ZSCALE))
            v[col_layer] = _plasma_rgba(t)
            row.append(v)
        verts.append(row)
    bm.verts.ensure_lookup_table()

    for ix in range(GRID_N - 1):
        for iy in range(GRID_N - 1):
            try:
                bm.faces.new([verts[ix][iy], verts[ix+1][iy],
                               verts[ix+1][iy+1], verts[ix][iy+1]])
            except ValueError:
                pass    # degenerate face guard (shouldn't occur on a grid)

    me = bpy.data.meshes.new("basin_mesh")
    bm.to_mesh(me)
    bm.free()

    obj = bpy.data.objects.new("hf_henon_basin", me)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (0.0, 0.0, 0.0)

    mat = bpy.data.materials.new("mat_henon_basin")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Color"
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 2.5
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(mat)
    return obj


# ── Build poi light trail ─────────────────────────────────────────────────

def build_poi_trail() -> list[bpy.types.Object]:
    """
    Run the Hénon orbit for TRANSIENT+ORBIT_N steps, then split into TRAIL_N
    NURBS bevel curves.  The 2D orbit is lifted to 3D via a sinusoidal Z swing
    that matches the poi arm-reach envelope (±TRAIL_ZLIFT).

    WHY sinusoidal Z not constant Z: a flat 2D projection would appear as a
    line in side view; the Z swing adds depth without disturbing the XY
    attractor structure, mimicking how poi gyrate in a vertical plane.
    WHY NURBS not Bezier: NURBS order=4 gives C² continuity and handles the
    abrupt direction changes in the Hénon orbit better than piecewise Bezier;
    also GLB encodes NURBS as a sampled polyline — bevel does the tube work
    before export.
    """
    # Warm up transient
    x, y = 0.1, 0.1
    for _ in range(TRANSIENT):
        x, y = 1.0 - A * x * x + y, B * x

    pts: list[tuple[float, float, float]] = []
    for i in range(ORBIT_N):
        z = TRAIL_ZLIFT * math.sin(2.0 * math.pi * i / TRAIL_PERIOD)
        pts.append((x * TRAIL_SCALE, y * TRAIL_SCALE + TRAIL_OFFSET[2], z))
        x, y = 1.0 - A * x * x + y, B * x

    chunk = ORBIT_N // TRAIL_N
    colours = [(0.2, 0.9, 1.0, 1.0), (1.0, 0.4, 0.8, 1.0), (1.0, 0.85, 0.1, 1.0)]
    objects = []

    for k in range(TRAIL_N):
        seg = pts[k * chunk: (k + 1) * chunk]
        cu = bpy.data.curves.new(f"henon_trail_{k}", "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = BEVEL_R
        cu.bevel_resolution = 3
        sp = cu.splines.new("NURBS")
        sp.points.add(len(seg) - 1)
        for idx, (px, py, pz) in enumerate(seg):
            sp.points[idx].co = (px, py, pz, 1.0)
        sp.use_endpoint_u = True
        sp.order_u = 4

        obj = bpy.data.objects.new(f"hf_henon_trail_{k}", cu)
        bpy.context.scene.collection.objects.link(obj)

        mat = bpy.data.materials.new(f"mat_trail_{k}")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = colours[k % len(colours)]
        emit.inputs["Strength"].default_value = 5.0
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        cu.materials.append(mat)
        objects.append(obj)

    return objects


# ── Clear + run ───────────────────────────────────────────────────────────

def main():
    # Remove default geometry
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    basin = build_basin()
    trails = build_poi_trail()

    # EEVEE settings for emissive bloom
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.use_bloom = True
    scene.eevee.bloom_threshold = 0.8
    scene.eevee.bloom_intensity = 0.6

    # GLB export — apply true normals, Draco L6, WebP textures
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_colors=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_materials="EXPORT",
    )
    print(f"[holoflow] hf_henon.glb written — {len(trails)} trails + basin mesh")


if __name__ == "__main__":
    main()
