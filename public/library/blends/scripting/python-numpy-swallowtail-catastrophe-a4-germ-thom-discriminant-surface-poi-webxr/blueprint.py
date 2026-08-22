"""
Swallowtail Catastrophe — Holoflow Blueprint (Blender 5.1)
===========================================================
TECHNIQUE  René Thom's 1972 classification of elementary catastrophes
identifies the A₄ (swallowtail) germ V(x;a,b,c) = x⁵ + ax³ + bx² + cx as
the codimension-3 singularity.  Its discriminant locus S₄ ⊂ ℝ³(a,b,c) is the
2D surface where V' and V'' simultaneously vanish — i.e. the locus of degenerate
critical points, where a smooth fold of critical values becomes a cusp, and the
cusp itself folds again into the swallowtail tip.

PARAMETRISATION  From the simultaneous conditions V'(x)=0 and V''(x)=0:
  V'  = 5x⁴ + 3ax² + 2bx + c = 0
  V'' = 20x³ + 6ax  + 2b      = 0

Solving b from the second equation and substituting into the first:
  b(x,a) = −10x³ − 3ax
  c(x,a) =  15x⁴ + 3ax²

The map (x, a) ↦ (a, b(x,a), c(x,a)) ∈ ℝ³ parametrises the discriminant
surface S₄ globally.  Self-intersections (two distinct x-values giving the
same (b,c) at the same a) form the tail edge — the namesake swallowtail.

TOPOLOGY  The complement of S₄ in ℝ³ has two components:
  • INSIDE (between the two wings): V' has four distinct real roots — two
    stable minima separated by two unstable maxima.
  • OUTSIDE: V' has exactly two real roots — one stable minimum.
  The boundary S₄ marks the bifurcation where a minimum and maximum annihilate.

POI DISC  The swallowtail is an open 2D surface — naturally a disc poi.
Coordinates (a, b, c) are centred and rescaled to POI_DIAM.  Three shape
keys parametrize different regions of the three-parameter family.
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── Parameters ───────────────────────────────────────────────────────────────
SLUG        = "hf_swallowtail"
NX          = 88             # samples along state variable x (inner axis)
NA          = 66             # samples along control parameter a (outer axis)
X_RANGE     = (-2.3, 2.3)   # x domain — self-intersection is at |x|<2
A_RANGE     = (-5.4, 1.2)   # a domain — all three topological strata present
POI_DIAM    = 0.18           # 18 cm disc poi diameter (metres)
EMIT_STR    = 3.5
COL_LAYER   = "SCat"
MAT_NAME    = "HoloSwallowtail"
DRACO       = 6

# Shape-key variants: (label, x_scale, c_scale)
# x_scale  — rescale state variable; compresses/expands self-intersection locus
# c_scale  — rescale c-coordinate; flattens ridges to expose fold-crossing
SK_PARAMS = [
    ("Basis",             1.00, 1.00),
    ("Swallowtail_Tight", 0.65, 1.00),   # smaller x → cusp throat pinches
    ("Swallowtail_Flat",  1.00, 0.28),   # flatten c → caustic cross-section view
]


# ── Core geometry ─────────────────────────────────────────────────────────────
def compute_surface(x_scale: float, c_scale: float) -> np.ndarray:
    """
    Return (NX*NA, 3) float64 array in WORLD coordinates.

    WHY (x,a) as free parameters:
      The two conditions V'=V''=0 reduce the three control parameters (a,b,c)
      to a 2D surface.  Choosing (x,a) as free variables yields b and c in
      closed form with no numerical root-finding.

    WHY X_RANGE=(-2.3, 2.3):
      The self-intersection tail appears where |x|≈1.8 at a=0, growing inward
      as a decreases.  Extending to ±2.3 ensures the tail is fully captured
      while the surface remains numerically bounded (|b| < 250, |c| < 330).
    """
    xs  = np.linspace(X_RANGE[0] * x_scale, X_RANGE[1] * x_scale, NX)
    as_ = np.linspace(A_RANGE[0], A_RANGE[1], NA)
    x, a = np.meshgrid(xs, as_, indexing='ij')   # (NX, NA) each

    A_c = a                          # control parameter a → world X-axis
    B_c = -10.0 * x**3 - 3.0 * a * x  # from V''=0 solved for b
    C_c = (15.0 * x**4 + 3.0 * a * x**2) * c_scale  # from V'=0 after b-sub

    # Stack to (NX*NA, 3)
    pts = np.stack([A_c.ravel(), B_c.ravel(), C_c.ravel()], axis=1)
    return pts


def rescale_to_poi(pts_basis: np.ndarray, pts_var: np.ndarray,
                   scale: float, centroid: np.ndarray) -> np.ndarray:
    """Apply the basis-derived centroid and scale to a shape-key variant."""
    return (pts_var - centroid) * scale


def build_faces() -> list:
    """(NX-1)*(NA-1) quads, CCW winding (bl→br→tr→tl)."""
    faces = []
    for i in range(NX - 1):
        for j in range(NA - 1):
            bl = i * NA + j
            br = i * NA + (j + 1)
            tr = (i + 1) * NA + (j + 1)
            tl = (i + 1) * NA + j
            faces.append((bl, br, tr, tl))
    return faces


def vertex_colours(x_scale: float) -> np.ndarray:
    """
    RGBA per vertex: |x| → 0=gold (near equilibrium), 1=violet (fold edge).
    WHY x-based colouring:  the state variable x directly encodes distance
    from the nearest critical point; |x|≈0 is the cusp throat, |x|≈2.3 are
    the wide wings far from any bifurcation.
    """
    xs   = np.linspace(X_RANGE[0] * x_scale, X_RANGE[1] * x_scale, NX)
    x_abs = np.abs(np.repeat(xs, NA)) / (abs(X_RANGE[1]) * x_scale + 1e-9)
    t    = np.clip(x_abs, 0.0, 1.0)
    r    = 1.0 - 0.55 * t
    g    = 0.72 - 0.62 * t
    b    = 0.08 + 0.90 * t
    a_ch = np.ones_like(t)
    return np.stack([r, g, b, a_ch], axis=1).astype(np.float32)


# ── Blender scene construction ────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for bl in bpy.data.collections:
        bpy.data.collections.remove(bl)


def make_mesh(pts_basis: np.ndarray, faces: list,
              scale: float, centroid: np.ndarray) -> bpy.types.Object:
    """Build the swallowtail mesh and apply the basis shape."""
    me = bpy.data.meshes.new(SLUG)
    verts_w = rescale_to_poi(pts_basis, pts_basis, scale, centroid).tolist()
    me.from_pydata(verts_w, [], faces)
    me.update()

    ob = bpy.data.objects.new(SLUG, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    return ob


def add_shape_keys(ob: bpy.types.Object,
                   scale: float, centroid: np.ndarray) -> None:
    """
    Add SK_PARAMS shape keys.  WHY foreach_set: direct attribute assignment
    per-vertex is ~40× slower than the C-level buffer copy; at NX*NA≈5808
    vertices this is barely noticeable, but the pattern should be consistent
    across all blueprints for maintainability.
    """
    ob.shape_key_add(name="Basis", from_mix=False)
    for label, x_sc, c_sc in SK_PARAMS[1:]:
        pts_var = compute_surface(x_sc, c_sc)
        coords  = rescale_to_poi(None, pts_var, scale, centroid).ravel().tolist()
        sk      = ob.shape_key_add(name=label, from_mix=False)
        sk.data.foreach_set("co", coords)


def add_vertex_colours(ob: bpy.types.Object, x_scale: float = 1.0) -> None:
    me   = ob.data
    cols = vertex_colours(x_scale)
    attr = me.color_attributes.new(COL_LAYER, 'FLOAT_COLOR', 'POINT')
    flat = cols.ravel().tolist()
    attr.data.foreach_set("color", flat)


def make_material(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = COL_LAYER
    attr.location = (-400, 0)

    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = EMIT_STR
    emit.location = (-160, 0)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (80, 0)

    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    mat.blend_method    = 'OPAQUE'
    ob.data.materials.append(mat)
    ob["holoflow:facet"] = True


def set_flat_shading(ob: bpy.types.Object) -> None:
    for poly in ob.data.polygons:
        poly.use_smooth = False


def export_glb(ob: bpy.types.Object) -> None:
    import os
    out_dir = os.path.join(
        bpy.path.abspath("//"),
        "..", "..", "..", "glbs", "scripting",
        "python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr",
    )
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out_dir, SLUG + ".glb"),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_colors=True,
        export_morph=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO,
        export_image_format='WEBP',
    )


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()

    # Compute basis geometry and derive global scale
    pts_basis = compute_surface(1.0, 1.0)
    centroid  = pts_basis.mean(axis=0)
    pts_c     = pts_basis - centroid
    max_ext   = float(np.max(np.linalg.norm(pts_c, axis=1)))
    scale     = (POI_DIAM / 2.0) / max_ext   # longest radius → POI_DIAM/2

    faces = build_faces()
    ob    = make_mesh(pts_basis, faces, scale, centroid)
    add_shape_keys(ob, scale, centroid)
    add_vertex_colours(ob)
    make_material(ob)
    set_flat_shading(ob)

    # Camera and world
    bpy.ops.object.camera_add(location=(0, -0.28, 0.05))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(88), 0, 0)
    bpy.context.scene.camera = cam

    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.02,)*3+(1,)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.0

    # EEVEE Next
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    eevee = bpy.context.scene.eevee
    eevee.bloom_threshold = 0.35
    eevee.bloom_radius    = 4.0
    eevee.bloom_intensity = 0.55

    bpy.context.scene.frame_end = 120

    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath or "/tmp/hf_swallowtail.blend")
    export_glb(ob)
    print(f"[Holoflow] Swallowtail done — {NX*NA} verts, {(NX-1)*(NA-1)} quads")


if __name__ == "__main__":
    main()
