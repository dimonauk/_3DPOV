"""
Steiner Roman Surface — Jakob Steiner's 1844 RP² Immersion in ℝ³
Six Whitney Umbrella Singularities, Three Double-Line Segments,
Veronese-Type Sphere Map & Faceted Poi Head for WebXR
Blender 5.1 · Holoflow Studio · CC0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Topology
────────
The real projective plane RP² is S²/(x~-x).  Two classical smooth
immersions of RP² in ℝ³ exist:

  Boy (1901)   — everywhere smooth; one triple point; 1 self-intersection loop.
  Roman (1844) — six Whitney umbrella pinch points; 3 self-intersection segments.

The Roman surface is NOT smooth: each Whitney umbrella is a singularity of
type z² = xy² — a fold catastrophe with a self-tangency line.  Despite this,
the Roman surface is the historically first example and has a stunning degree-4
algebraic equation in RP³:

        X²Y² + Y²Z² + Z²X² − XYZW = 0

In affine ℝ³ (W=1): x²y² + y²z² + z²x² = xyz.

Parametrisation via Veronese Map
──────────────────────────────────
Take a point p = (sin φ cos θ, sin φ sin θ, cos φ) on S².
Map:   f(p) = SCALE · (pₓpᵧ, pᵧp_z, p_z pₓ)

Key identity:  f(p) = f(-p)  since (−a)(−b) = ab.
→ The map is 2-to-1 on antipodal pairs: it realises RP² = S²/antipodal.

Domain for half-covering: φ ∈ (ε, π−ε), θ ∈ (ε, π−ε).
(Poles and great-circle boundary collapse to the three coordinate-axis
 double segments — excluded by ε to avoid degenerate quads.)

Six Whitney Umbrella Tips
─────────────────────────
At φ=π/2, θ=π/4:   pₓ=pᵧ=1/√2, p_z=0  →  X=SCALE/2, Y=Z=0.
Permutations give 6 tips at (±SCALE/2, 0, 0), (0, ±SCALE/2, 0), (0, 0, ±SCALE/2).
These are the endpoints of the three double-line segments on the coordinate axes.

Shape Keys
──────────
  Basis       — standard Roman surface
  SK_Oblate   — flattened poi disc (Z×0.30, XY×1.45)
  SK_Elongate — stretched wand (Y×2.60, XZ×0.80)
  SK_Compact  — uniform 0.70×
"""

import bpy
import bmesh
import numpy as np
from pathlib import Path

# ── CONSTANTS ────────────────────────────────────────────────────────────
SLUG       = "python-numpy-roman-surface-steiner-rp2-whitney-umbrella-poi-head-webxr"
OBJ_NAME   = "hf_roman_surface"
MESH_NAME  = "HF_RomanSurface"
HERE       = Path(__file__).parent
GLB_PATH   = str(HERE / "hf_roman_surface.glb")
BLEND_PATH = str(HERE / "hf_roman_surface.blend")

N_PHI   = 80   # rows in φ ∈ (ε, π−ε)
N_THETA = 80   # cols in θ ∈ (ε, π−ε)

# WHY 80×80?  The double lines on the axes are a subtle feature that only
# resolves well at ≥60 samples per side; 80 gives 6241 verts without being
# too heavy for real-time WebXR (target ≤20k tris).

POI_RADIUS = 0.060        # metres — poi head semi-diameter
SCALE      = 2 * POI_RADIUS   # max |X| = SCALE * max|pₓpᵧ| = SCALE/2 = POI_RADIUS

EPS = 0.04   # domain inset: avoids pole/boundary collapse to origin

METALLIC  = 0.55
ROUGHNESS = 0.22
EMIT_STR  = 2.50
EMIT_MIX  = 0.15


# ── PARAMETRISATION ──────────────────────────────────────────────────────
def roman_surface(n_phi: int, n_theta: int):
    """
    Return (X, Y, Z) arrays of shape (n_phi, n_theta).

    WHY Veronese map?  Because (pₓpᵧ, pᵧp_z, p_z pₓ) is the simplest
    bilinear map S²→RP² that factors through the antipodal quotient.
    It lives in the linear system of degree-2 monomials on S², which
    connects the Roman surface to the full Veronese embedding S²↪RP⁵.
    """
    phi   = np.linspace(EPS, np.pi - EPS, n_phi)
    theta = np.linspace(EPS, np.pi - EPS, n_theta)
    PHI, THETA = np.meshgrid(phi, theta, indexing="ij")

    SX = np.sin(PHI) * np.cos(THETA)
    SY = np.sin(PHI) * np.sin(THETA)
    SZ = np.cos(PHI)

    X = SCALE * SX * SY   # = SCALE·sin²φ·sin(2θ)/2
    Y = SCALE * SY * SZ   # = SCALE·sin(2φ)/2·sin θ
    Z = SCALE * SZ * SX   # = SCALE·sin(2φ)/2·cos θ
    return X, Y, Z


# ── BUILD MESH ───────────────────────────────────────────────────────────
def build_mesh(X, Y, Z):
    """
    Assemble a BMesh from the (N_PHI, N_THETA) vertex grid.
    Faces are (N_PHI−1)×(N_THETA−1) quads — no periodicity wrap needed
    because the domain boundary is open (not closed).
    """
    n_phi, n_theta = X.shape
    verts_xyz = np.stack([X, Y, Z], axis=-1).reshape(-1, 3)

    bm = bmesh.new()
    bm_verts = [bm.verts.new(v.tolist()) for v in verts_xyz]
    bm.verts.ensure_lookup_table()

    for i in range(n_phi - 1):
        for j in range(n_theta - 1):
            v00 = bm_verts[i * n_theta + j]
            v10 = bm_verts[(i + 1) * n_theta + j]
            v11 = bm_verts[(i + 1) * n_theta + (j + 1)]
            v01 = bm_verts[i * n_theta + (j + 1)]
            bm.faces.new([v00, v10, v11, v01])

    bm.faces.ensure_lookup_table()
    return bm, verts_xyz


# ── SHAPE KEYS ───────────────────────────────────────────────────────────
def add_shape_keys(obj, X, Y, Z):
    """
    Add three shape-key deformations.  WHY these three?
      SK_Oblate   maps to a flattened disc — matches the 'poi disc' silhouette
                  visible in performance when the poi orbits in-plane.
      SK_Elongate maps to a cylindrical wand — pai style, elongated centroid.
      SK_Compact  is a uniform scale-down for stacked poi heads.
    """
    obj.shape_key_add(name="Basis", from_mix=False)
    mesh = obj.data

    def _add_sk(name, xs, ys, zs):
        sk = obj.shape_key_add(name=name, from_mix=False)
        flat = np.stack([xs, ys, zs], axis=-1).reshape(-1, 3)
        sk.data.foreach_set("co", flat.ravel())

    # SK_Oblate: flatten Z, expand XY
    _add_sk("SK_Oblate",   X * 1.45, Y * 1.45, Z * 0.30)
    # SK_Elongate: stretch Y, compress XZ
    _add_sk("SK_Elongate", X * 0.80, Y * 2.60, Z * 0.80)
    # SK_Compact: uniform 70 %
    _add_sk("SK_Compact",  X * 0.70, Y * 0.70, Z * 0.70)


# ── VERTEX COLOUR ────────────────────────────────────────────────────────
def paint_vertex_colour(obj, X, Y, Z):
    """
    Colour encodes azimuthal angle + proximity to Whitney umbrella tips.

    WHY azimuth?  The Roman surface's three double lines define three
    'sectors'; the azimuthal hue rotates once per π, placing opposite
    sectors in complementary hues — revealing the 2-fold identification.

    WHY tip proximity?  The six Whitney umbrella tips at (±SCALE/2, 0, 0)
    etc. are where the surface first fails to be an immersion.  High
    saturation there draws the eye to the singular structure.
    """
    import colorsys
    mesh = obj.data
    vcol = mesh.color_attributes.new(
        name="WUColour", type="FLOAT_COLOR", domain="POINT"
    )

    flat_X = X.ravel()
    flat_Y = Y.ravel()
    flat_Z = Z.ravel()

    # Proximity to any of the 6 Whitney umbrella tips
    tips = np.array([
        [ SCALE / 2, 0, 0], [-SCALE / 2, 0, 0],
        [0,  SCALE / 2, 0], [0, -SCALE / 2, 0],
        [0, 0,  SCALE / 2], [0, 0, -SCALE / 2],
    ])
    coords = np.stack([flat_X, flat_Y, flat_Z], axis=-1)  # (N,3)
    dists  = np.min(np.linalg.norm(coords[:, None, :] - tips[None, :, :], axis=-1), axis=-1)
    prox   = 1.0 - np.clip(dists / (SCALE / 2), 0.0, 1.0)  # 1=at tip, 0=far

    azimuth = (np.arctan2(flat_Y, flat_X) / np.pi) % 1.0   # [0, 1)
    hue = azimuth
    sat = 0.60 + 0.40 * prox
    val = 0.55 + 0.45 * prox

    colours = np.zeros((len(flat_X), 4), dtype=np.float32)
    for k in range(len(flat_X)):
        r, g, b = colorsys.hsv_to_rgb(hue[k], sat[k], val[k])
        colours[k] = [r, g, b, 1.0]
    vcol.data.foreach_set("color", colours.ravel())


# ── MATERIAL ─────────────────────────────────────────────────────────────
def build_material(obj):
    mat = bpy.data.materials.new(name="M_RomanSurface")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    pbr  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    vcol = nt.nodes.new("ShaderNodeVertexColor")
    mix  = nt.nodes.new("ShaderNodeMixShader")
    emit = nt.nodes.new("ShaderNodeEmission")

    vcol.layer_name = "WUColour"
    pbr.inputs["Metallic"].default_value  = METALLIC
    pbr.inputs["Roughness"].default_value = ROUGHNESS
    emit.inputs["Strength"].default_value  = EMIT_STR
    mix.inputs["Fac"].default_value        = EMIT_MIX

    nt.links.new(vcol.outputs["Color"], pbr.inputs["Base Color"])
    nt.links.new(vcol.outputs["Color"], emit.inputs["Color"])
    nt.links.new(pbr.outputs["BSDF"],   mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"],    out.inputs["Surface"])

    obj.data.materials.append(mat)
    mat.use_backface_culling = False   # self-intersecting — both sides visible


# ── EXPORT ───────────────────────────────────────────────────────────────
def export(obj):
    """
    WHY Y-up rotation?  Holoflow WebXR convention: +Y is up in the browser.
    Blender's default is +Z up, so a 90° X-rotation is applied and baked
    before GLB export — snapshot meshes in browser-space coordinates.
    """
    obj.rotation_euler = (1.5707963, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_morph=True,
        export_colors=True,
        export_apply=False,
    )
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[Roman] GLB → {GLB_PATH}")
    print(f"[Roman] .blend → {BLEND_PATH}")


# ── MAIN ─────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0

    X, Y, Z = roman_surface(N_PHI, N_THETA)
    bm, _   = build_mesh(X, Y, Z)

    mesh = bpy.data.meshes.new(MESH_NAME)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    add_shape_keys(obj, X, Y, Z)
    paint_vertex_colour(obj, X, Y, Z)
    build_material(obj)

    bpy.ops.object.shade_flat()
    export(obj)


if __name__ == "__main__":
    main()
