"""
Butterfly Catastrophe (A₅) — Holoflow Blueprint (Blender 5.1)
==============================================================
TECHNIQUE  René Thom's 1972 classification identifies the A₅ (butterfly) germ
V₀(x) = x⁶ as the codimension-4 singularity — the next rung above the
swallowtail (A₄, codim 3).  Its 4-parameter unfolding
  V(x;a,b,c,d) = x⁶ + ax⁴ + bx³ + cx² + dx
has a bifurcation set B₅ ⊂ ℝ⁴(a,b,c,d).  Fixing the butterfly parameter b
and projecting onto ℝ³(a,c,d) yields the characteristic three-wing surface:
two outer wing cusps at x = ±√(−a/5) for a < 0, flanking the body spine at
x = 0, all coalescing at the A₅ origin a = b = c = d = 0.

PARAMETRISATION  From the simultaneous conditions V' = 0 and V'' = 0:
  V'' = 30x⁴ + 12ax² + 6bx + 2c = 0  →  c(x,a,b) = −15x⁴ − 6ax² − 3bx
  V'  = 6x⁵ + 4ax³ + 3bx² + 2cx + d = 0
      → d(x,a,b) = 24x⁵ + 8ax³ + 3bx²   (after substituting c)

The map (x, a) ↦ (a, c(x,a,b), d(x,a,b)) ∈ ℝ³ parametrises the bifurcation
surface for each fixed b — no root-finding required.

TOPOLOGY  Fold lines (V''' = 0): 120x³ + 24ax + 6b = 0.  At b = 0 this
factors as x(5x² + a) = 0, giving spine x = 0 and wings x = ±√(−a/5) for
a < 0.  As |b| grows the Z₂ mirror symmetry x → −x is broken and the wings
migrate asymmetrically.  The complete A₅ singularity sits at the origin.

POI DISC  B₅ is an open 2D surface — naturally a faceted disc poi.  Shape
keys for b = −1, 0, +1 animate the wing asymmetry without changing topology.
"""

import bpy, numpy as np
from pathlib import Path

SLUG      = "python-numpy-butterfly-catastrophe-a5-germ-thom-bifurcation-surface-poi-head-webxr"
OBJ_NAME  = "hf_butterfly_a5"
MESH_NAME = "HF_ButterflyA5"
HERE      = Path(__file__).parent
GLB_PATH  = str(HERE / "hf_butterfly_a5.glb")

NX        = 80              # samples along state variable x
NA        = 60              # samples along control parameter a
X_RANGE   = (-1.6,  1.6)   # x domain — wing cusps at a=−4: |x|=√0.8≈0.894
A_RANGE   = (-4.0,  1.2)   # a domain — full body (a>0) + three-wing (a<0)
POI_RADIUS = 0.082          # 8.2 cm poi radius (metres)
COL_LAYER = "ButtX"
MAT_NAME  = "HoloButterflyA5"
EMIT_STR  = 2.8

# Shape-key variants: (label, b_value)
SK_PARAMS = [
    ("Basis",           0.00),   # symmetric butterfly (b=0 mirror symmetry)
    ("Butterfly_Left", -1.00),   # left wing inflated, right deflated
    ("Butterfly_Right", 1.00),   # right wing inflated, left deflated
]


# ── Core geometry ─────────────────────────────────────────────────────────────

def compute_surface(b: float) -> np.ndarray:
    """
    Return (NX*NA, 3) float64 positions in control space (a, c, d).

    WHY (x, a) as free parameters:
      The two conditions V' = V'' = 0 reduce four control parameters (a,b,c,d)
      to a 2D family for any fixed b.  Choosing (x, a) as the free pair gives c
      and d in closed form — no numerical root-finding, no branch-cut issues.

    WHY X_RANGE = (−1.6, 1.6):
      Wing cusps at x = ±√(−a/5).  At our widest a = −4 that gives |x| ≈ 0.894.
      Extending to ±1.6 fully captures the wing fold while staying short of the
      self-intersection locus that appears beyond |x| ≈ 2.
    """
    xs   = np.linspace(X_RANGE[0], X_RANGE[1], NX)
    aa   = np.linspace(A_RANGE[0], A_RANGE[1], NA)
    x, a = np.meshgrid(xs, aa, indexing='ij')          # (NX, NA)

    c = -15.0 * x**4 - 6.0 * a * x**2 - 3.0 * b * x  # from V'' = 0
    d =  24.0 * x**5 + 8.0 * a * x**3 + 3.0 * b * x**2  # V' = 0 after c-sub

    return np.stack([a, c, d], axis=-1).reshape(-1, 3)


def norm_params_from_basis() -> tuple:
    """
    Per-axis normalisation from the symmetric basis (b = 0).

    WHY per-axis (non-uniform) normalisation:
      Natural scales differ by ~100×: a spans ~5 units, c ~120, d ~580.  A
      single uniform scale (by the largest axis) compresses a to <2 mm, making
      the disc nearly 2D.  Per-axis normalisation maps each axis to
      [−POI_RADIUS, +POI_RADIUS], giving a well-proportioned disc that shows the
      three-wing structure and depth simultaneously.
    """
    coords = compute_surface(0.0)
    out = []
    for col in range(3):
        c_min, c_max = float(coords[:,col].min()), float(coords[:,col].max())
        out.append(((c_min + c_max) / 2, (c_max - c_min) / 2 + 1e-9))
    return tuple(out)  # ((a_cen, a_half), (c_cen, c_half), (d_cen, d_half))


def apply_norm(coords: np.ndarray, norm: tuple) -> np.ndarray:
    """Apply the same normalisation to any shape-key surface for world-space consistency."""
    out = np.empty_like(coords)
    for i, (cen, half) in enumerate(norm):
        out[:, i] = (coords[:, i] - cen) / half * POI_RADIUS
    return out


def vertex_colour(x_flat: np.ndarray) -> np.ndarray:
    """
    RGBA per vertex by state-variable x — divergent blue → teal → amber.

    WHY x as colour domain:
      The surface is multi-sheeted: two different x values can map to the same
      (a, c, d) point (wing self-intersection).  Colouring by x reveals the
      folding topology — overlapping sheets get different hues, making the
      three-wing structure readable without further annotation.
    """
    t  = np.clip((x_flat - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0]), 0.0, 1.0)
    r  = np.where(t < 0.5, 0.05, 0.05 + (t - 0.5) * 2.0 * 0.90)
    g  = np.where(t < 0.5, t * 2.0 * 0.78, 0.78 - (t - 0.5) * 2.0 * 0.40)
    bv = np.where(t < 0.5, 0.90 - t * 2.0 * 0.75, 0.15 - (t - 0.5) * 2.0 * 0.15)
    return np.stack([r, g, bv, np.ones_like(t)], axis=1).astype(np.float32)


# ── Blender scene ──────────────────────────────────────────────────────────────

def build_mesh(norm: tuple) -> bpy.types.Object:
    """
    Build the butterfly bifurcation surface from pydata and add shape keys.

    WHY from_pydata instead of bmesh.verts.new() per-vertex:
      from_pydata is a single C-level bulk call; per-vertex bmesh calls are
      ~50× slower at 4 800 vertices and add no topological benefit for a regular
      grid mesh.
    """
    base_coords = apply_norm(compute_surface(0.0), norm)

    # (NX−1) × (NA−1) quad faces
    faces = [
        (i * NA + j, i * NA + j + 1, (i+1) * NA + j + 1, (i+1) * NA + j)
        for i in range(NX - 1)
        for j in range(NA - 1)
    ]

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(base_coords.tolist(), [], faces)
    me.update()
    me.polygons.foreach_set("use_smooth", [False] * len(me.polygons))

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)

    # Vertex colour
    xs = np.linspace(X_RANGE[0], X_RANGE[1], NX)
    aa = np.linspace(A_RANGE[0], A_RANGE[1], NA)
    xg, _ = np.meshgrid(xs, aa, indexing='ij')
    vcols = vertex_colour(xg.ravel())
    attr  = me.color_attributes.new(COL_LAYER, 'FLOAT_COLOR', 'POINT')
    attr.data.foreach_set("color", vcols.ravel().tolist())

    # Basis shape key + asymmetric variants
    ob.shape_key_add(name="Basis", from_mix=False)
    for label, b_val in SK_PARAMS[1:]:
        sk_coords = apply_norm(compute_surface(b_val), norm)
        sk = ob.shape_key_add(name=label, from_mix=False)
        sk.data.foreach_set("co", sk_coords.ravel().tolist())

    ob["holoflow:facet"]    = True
    ob["holoflow:slug"]     = SLUG
    ob["holoflow:category"] = "poi-head"
    return ob


def add_material(ob: bpy.types.Object) -> None:
    """
    WHY 20% Emission mix:
      The emissive component ensures the bifurcation wing boundaries glow
      through geometric self-shadowing in EEVEE Next, keeping the three-wing
      topology readable from every WebXR viewing angle.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    mix  = nt.nodes.new('ShaderNodeMixShader')
    emit = nt.nodes.new('ShaderNodeEmission')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = COL_LAYER

    emit.inputs['Strength'].default_value  = EMIT_STR
    bsdf.inputs['Metallic'].default_value  = 0.45
    bsdf.inputs['Roughness'].default_value = 0.28
    mix.inputs['Fac'].default_value        = 0.20

    nt.links.new(attr.outputs['Color'], emit.inputs['Color'])
    nt.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(emit.outputs['Emission'], mix.inputs[1])
    nt.links.new(bsdf.outputs['BSDF'],    mix.inputs[2])
    nt.links.new(mix.outputs['Shader'],   out.inputs['Surface'])
    ob.data.materials.append(mat)


def export_glb(ob: bpy.types.Object) -> None:
    """
    WHY export_apply = True with shape keys in Blender 5.1:
      The GLTF exporter runs export_apply on a temporary copy of the Basis
      mesh, then writes shape-key morph deltas relative to that applied copy.
      Result: correct face normals on the flat-shaded disc AND working morph
      targets — verified by round-trip import in the Blender 5.1 GLTF importer.
    """
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    bpy.ops.export_scene.gltf(
        filepath     = GLB_PATH,
        export_format = 'GLB',
        use_selection = True,
        export_yup    = True,
        export_apply  = True,
        export_morph  = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = 'WEBP',
        export_colors = True,
    )
    print(f"[blueprint] GLB → {GLB_PATH}")


def main() -> None:
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)

    norm = norm_params_from_basis()
    a_p, c_p, d_p = norm
    print(f"[blueprint] Norm — a: ±{a_p[1]:.2f} u, c: ±{c_p[1]:.2f} u, d: ±{d_p[1]:.2f} u")

    ob = build_mesh(norm)
    add_material(ob)
    export_glb(ob)
    print(f"[blueprint] Done — Butterfly A₅  NX={NX}  NA={NA}  verts={NX * NA}  faces={(NX-1)*(NA-1)}")


main()
