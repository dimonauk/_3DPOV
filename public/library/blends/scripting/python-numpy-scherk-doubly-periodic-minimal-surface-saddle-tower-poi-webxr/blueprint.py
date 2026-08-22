"""
Scherk Doubly-Periodic Minimal Surface — Holoflow Blueprint (Blender 5.1)
=========================================================================
TECHNIQUE  Scherk's 1835 surface is the third classical minimal surface,
after the plane and catenoid/helicoid.  It satisfies H = 0 (zero mean
curvature) everywhere, realised by the level-set equation:

    F(x,y,z) = exp(k·z) · cos(k·x) − cos(k·y) = 0

where k = 2π / PERIOD controls the spatial frequency.  Inside each
diamond-shaped cell where cos(kx)·cos(ky) > 0 this is equivalent to
the explicit saddle z = (1/k)·ln[cos(ky)/cos(kx)].  The whole surface is
an infinite tiling of such saddles in a checkerboard arrangement.

We sphere-project a subdivided icosphere: for each vertex in direction n̂,
binary-search the level-set along the radial ray, placing the vertex at the
nearest F = 0 crossing.  Four shape keys sample a sequence of Scherk variants
(single period, double period, 45° rotation, vertically compressed saddles)
for real-time morph in WebXR.
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── Parameters (edit these freely) ─────────────────────────────────────────
SLUG            = "hf_scherk_poi"
SPHERE_SUBDIVS  = 4          # icosphere subdivisions → 1280 faces (~2562 verts)
POI_RADIUS      = 0.080      # metres — standard 8 cm poi head

# Four shape-key variants.  period_mul scales PERIOD_BASE; z_scale compresses
# the saddle vertically; rot_deg rotates the (x,y) sampling plane around Z.
PERIOD_BASE     = 0.160      # metres — baseline period (one saddle across Ø16 cm)
KEY_PARAMS = [
    dict(name="Basis",           period_mul=1.00, z_scale=1.00, rot_deg=0.0),
    dict(name="Scherk_Dense",    period_mul=0.50, z_scale=1.00, rot_deg=0.0),
    dict(name="Scherk_Rotated",  period_mul=1.00, z_scale=1.00, rot_deg=45.0),
    dict(name="Scherk_Shallow",  period_mul=1.00, z_scale=0.40, rot_deg=0.0),
]

MARCH_SAMPLES   = 96         # coarse sample count along each ray
BINARY_ITERS    = 32         # bisection iterations after bracket found
CLIP_FALLBACK   = 0.88       # fraction of POI_RADIUS used when no crossing found
COL_LAYER       = "ScherkNormal"
MAT_NAME        = "HoloflowScherkMat"

# ── Scherk level-set (vectorised) ────────────────────────────────────────────
def scherk_F(pts: np.ndarray, k: float, z_scale: float,
             Rz_2x2: np.ndarray | None) -> np.ndarray:
    """
    Evaluate F(p) = exp(k·z_scale·z)·cos(k·x) − cos(k·y).

    WHY IMPLICIT: The explicit form z = (1/k)ln[cos(ky)/cos(kx)] is only
    valid where both cosines share the same sign; the implicit form is
    globally well-defined, so binary search works on any radial ray without
    needing domain checks.

    z_scale < 1 compresses the saddle height, creating shallow bowl-shapes.
    Rz_2x2 (2×2) rotates the (x,y) plane before evaluation; the surface is
    otherwise symmetric under 90° rotations of x and y.
    """
    p = pts.copy()
    if Rz_2x2 is not None:
        p[:, :2] = p[:, :2] @ Rz_2x2.T   # row-vector right-multiply
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    # Clamp exponent to [-80, 80] to avoid float64 overflow on distant verts
    exp_arg = np.clip(k * z_scale * z, -80.0, 80.0)
    return np.exp(exp_arg) * np.cos(k * x) - np.cos(k * y)


def ray_root(n_hat: np.ndarray, k: float, z_scale: float,
             Rz_2x2: np.ndarray | None) -> float:
    """
    Find the smallest t > 0 where F(t·n̂) = 0.

    BINARY SEARCH RATIONALE: The Scherk surface is smooth and the level-set
    gradient ∇F is bounded away from zero on any compact region excluding the
    asymptotic ends (x = ±π/2k, y = ±π/2k).  A linear sample grid of
    MARCH_SAMPLES points detects the sign-change bracket; 32 bisection steps
    then give 2^{-32} ≈ 2×10⁻¹⁰ relative precision — sub-nanometre accuracy
    on an 8 cm poi head.

    Returns t* ∈ (0, POI_RADIUS], or CLIP_FALLBACK*POI_RADIUS if no root.
    """
    ts = np.linspace(0.015 * POI_RADIUS, POI_RADIUS, MARCH_SAMPLES)
    pts = ts[:, None] * n_hat[None, :]          # shape (MARCH_SAMPLES, 3)
    Fv = scherk_F(pts, k, z_scale, Rz_2x2)
    idx = np.where(np.diff(np.sign(Fv)) != 0)[0]
    if idx.size == 0:
        return CLIP_FALLBACK * POI_RADIUS
    lo, hi = ts[idx[0]], ts[idx[0] + 1]
    Flo = Fv[idx[0]]
    for _ in range(BINARY_ITERS):
        mid = 0.5 * (lo + hi)
        Fm = scherk_F((mid * n_hat)[None], k, z_scale, Rz_2x2)[0]
        if Flo * Fm <= 0.0:
            hi = mid
        else:
            lo, Flo = mid, Fm
    return 0.5 * (lo + hi)


# ── Mesh builder ─────────────────────────────────────────────────────────────
def project_sphere_to_scherk(k: float, z_scale: float,
                              rot_deg: float) -> bmesh.types.BMesh:
    """
    Build a BMesh icosphere then project each vertex onto the Scherk surface.

    PROJECTION PRINCIPLE: every original icosphere vertex lies at radius
    POI_RADIUS in direction n̂.  After projection it sits at t*·n̂ where t* is
    the first root of F along that ray.  Because we only scale t (not rotate
    n̂), the mesh topology is preserved exactly — no T-junctions, no
    degenerate edges.
    """
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=SPHERE_SUBDIVS, radius=POI_RADIUS)
    theta = math.radians(rot_deg)
    Rz = (np.array([[math.cos(theta), -math.sin(theta)],
                    [math.sin(theta),  math.cos(theta)]], dtype=np.float64)
          if rot_deg != 0.0 else None)
    for v in bm.verts:
        pos = np.array(v.co, dtype=np.float64)
        r = np.linalg.norm(pos)
        if r < 1e-9:
            continue
        t = ray_root(pos / r, k, z_scale, Rz)
        v.co = Vector(t / r * pos)          # rescale along same direction
    bm.normal_update()
    return bm


def apply_vertex_colour(bm: bmesh.types.BMesh) -> None:
    """
    Encode the face normal's z-component as a violet→gold colour gradient.

    WHY: Horizontal faces (z-normal ≈ 0) in the Scherk saddle lattice are the
    flat "table" regions; near-vertical faces lie on the asymptotic flanks.
    Colouring them differently makes the saddle geometry immediately legible.
    """
    col = bm.loops.layers.color.new(COL_LAYER)
    for f in bm.faces:
        f.smooth = False
        nz = abs(f.normal.z)            # 0 at horizontal, 1 at vertical
        for lp in f.loops:
            # gold=(1.0,0.72,0.10) → deep-violet=(0.10,0.04,0.80)
            lp[col] = (0.10 + 0.90 * nz,
                       0.04 + 0.68 * nz,
                       0.80 - 0.70 * nz, 1.0)


def build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = COL_LAYER
    emit.inputs["Strength"].default_value = 3.0
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── Shape-key helper ─────────────────────────────────────────────────────────
def add_shape_key(obj: bpy.types.Object, name: str,
                  k: float, z_scale: float, rot_deg: float) -> None:
    """
    Reproject mesh vertices with new Scherk parameters into a shape key.

    Uses foreach_set for bulk coordinate assignment — approximately 40× faster
    than iterating over bpy.types.ShapeKeyPoint objects in Python.
    """
    theta = math.radians(rot_deg)
    Rz = (np.array([[math.cos(theta), -math.sin(theta)],
                    [math.sin(theta),  math.cos(theta)]], dtype=np.float64)
          if rot_deg != 0.0 else None)
    sk = obj.shape_key_add(name=name, from_mix=False)
    coords = []
    for v in obj.data.vertices:
        pos = np.array(v.co, dtype=np.float64)
        r = np.linalg.norm(pos)
        if r < 1e-9:
            coords += [0.0, 0.0, 0.0]
            continue
        t = ray_root(pos / r, k, z_scale, Rz)
        coords += list(t / r * pos)
    sk.data.foreach_set("co", coords)


# ── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # Basis parameters
    p0 = KEY_PARAMS[0]
    k0 = 2 * math.pi / (PERIOD_BASE * p0["period_mul"])

    # Build and project the base mesh
    bm = project_sphere_to_scherk(k0, p0["z_scale"], p0["rot_deg"])
    apply_vertex_colour(bm)
    mesh = bpy.data.meshes.new(SLUG)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(SLUG, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj["holoflow:facet"] = True

    # Basis shape key
    obj.shape_key_add(name=p0["name"], from_mix=False)

    # Additional shape keys
    for p in KEY_PARAMS[1:]:
        k = 2 * math.pi / (PERIOD_BASE * p["period_mul"])
        add_shape_key(obj, p["name"], k, p["z_scale"], p["rot_deg"])

    obj.data.materials.append(build_material())

    # +Y-up orient for WebXR (Holoflow convention)
    obj.rotation_euler = (-math.pi / 2, 0, 0)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.transform_apply(rotation=True)

    # GLB export — Draco level 6, WebP textures, morph targets
    import os
    here = os.path.dirname(bpy.data.filepath) or "/tmp"
    glb_dir = os.path.normpath(os.path.join(
        here, "..", "..", "..", "glbs", "scripting",
        "python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr"))
    os.makedirs(glb_dir, exist_ok=True)
    glb_path = os.path.join(glb_dir, "hf_scherk_poi.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path, export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_colors=True, export_morph=True,
        export_apply=True, export_yup=True)
    print(f"✓ GLB exported → {glb_path}")


main()
