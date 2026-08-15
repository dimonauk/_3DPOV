"""
Boy Surface — Werner Boy's 1901 Immersion of RP² in ℝ³
Apéry–Nordstrand Parametrisation, Triple Self-Intersection Point,
3-Fold Rotational Symmetry & Faceted Poi Head for WebXR
Blender 5.1 · Holoflow Studio · CC0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Topology
────────
The real projective plane RP² is the quotient S²/(x~-x): the sphere
with antipodal points identified. Hilbert's 1901 problem asked whether
RP² can be smoothly immersed in ℝ³ (immersed = locally an embedding,
but globally self-intersecting). Werner Boy, his student, proved YES in
his 1901 Göttingen thesis — producing a smooth immersion with:
  • exactly one triple point (where the surface crosses itself three times)
  • a self-intersection curve (one closed loop meeting the triple point)
  • 3-fold rotational symmetry

This is qualitatively different from the Roman surface (Steiner 1844),
which has six Whitney umbrella pinch points — topological singularities.
Boy's immersion is everywhere smooth.

Parametrisation
───────────────
We use the Nordstrand/Apéry formula on the domain u ∈ [0,π/2], v ∈ [0,2π]:

  D(u,v) = 2 − √2·sin(3u)·sin(2v)          [always ≥ 2−√2 ≈ 0.586]

  x(u,v) = (√2·cos²u·cos(2v) + cos(u)·sin(u)·cos(v)) / D
  y(u,v) = (√2·cos²u·sin(2v) − cos(u)·sin(u)·sin(v)) / D
  z(u,v) =  3·cos²u / D

Key loci:
  u = 0      → equatorial circle: z = 3/2, r = √2/2
               This is the self-intersection circle of the immersion.
               Points (0,v) and (0,v+π) map to the same 3D position,
               realising the antipodal identification of RP².
  u = π/2   → triple point: x=y=z=0  (all 2π of v-values converge)
  u ∈ (0,π/2) → the immersed interior, injective away from self-crossings.

The denominator D never vanishes (min = 2−√2 > 0), so the map is
everywhere smooth — this is what Boy's theorem guarantees.

3-Fold Symmetry
───────────────
The substitution v → v + 2π/3 in the formula is NOT a symmetry of D
(sin(2(v+2π/3)) ≠ sin(2v) in general), but the surface AS A SET has
3-fold symmetry: a rotation by 2π/3 about the z-axis maps the surface
to itself. This is because sin(3u)·sin(2v) repeats with period π in v,
and the full formula satisfies B₃ symmetry under the coordinate rotation
(x,y,z) → (x·cos(2π/3)−y·sin(2π/3), x·sin(2π/3)+y·cos(2π/3), z).

Shape Keys
──────────
  Basis      — standard Boy surface at poi scale (d=100mm)
  SK_Oblate  — squash in z (z×0.35, xy×1.40): flattened poi disc aspect
  SK_Prolate — elongate in z (z×2.60, xy×0.65): stretched wand aspect
  SK_Tight   — uniform scale 0.72× (compact inner head for poi stacks)
"""

import bpy
import bmesh
import numpy as np
from pathlib import Path

# ── CONSTANTS ──────────────────────────────────────────────────────────────
SLUG       = "python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr"
OBJ_NAME   = "hf_boy_surface"
MESH_NAME  = "HF_BoySurface"
HERE       = Path(__file__).parent
GLB_PATH   = str(HERE / "hf_boy_surface.glb")
BLEND_PATH = str(HERE / "hf_boy_surface.blend")

# Mesh resolution  (Nu × Nv quads, v wraps periodically)
NU         = 72    # rows in u ∈ [ε, π/2−ε]
NV         = 144   # columns in v ∈ [0, 2π), periodic

# Physical size: poi head diameter = 100mm → radius = 50mm
POI_RADIUS = 0.050  # metres

# Material
METALLIC   = 0.42
ROUGHNESS  = 0.28
EMIT_STR   = 2.80   # subtle glow (EEVEE Bloom)
EMIT_MIX   = 0.18   # fraction of emission in final material


# ── NORDSTRAND / APÉRY PARAMETRISATION ────────────────────────────────────
def boy_surface(Nu: int, Nv: int):
    """
    Return (X, Y, Z) arrays of shape (Nu, Nv) for the Boy surface.

    Domain: u ∈ [ε, π/2-ε]  (avoid exact boundary singularities)
             v ∈ [0, 2π)     (periodic)

    WHY avoid exact boundaries?
      At u = π/2 every v maps to (0,0,0) — the triple point.
      At u = 0 the formula is regular (D=2) but antipodal pairs
      (v, v+π) coincide, causing mesh overlaps that confuse remove_doubles.
      We exclude them slightly and accept the open boundary: the surface
      renders correctly double-sided in Blender and WebXR.
    """
    # One full grid step inset from each boundary
    u_eps = (np.pi / 2) / (Nu + 1)
    u_arr = np.linspace(u_eps, np.pi / 2 - u_eps, Nu)
    v_arr = np.linspace(0.0, 2.0 * np.pi, Nv, endpoint=False)

    U, V = np.meshgrid(u_arr, v_arr, indexing="ij")   # shape (Nu, Nv)

    SQ2 = np.sqrt(2.0)
    CU  = np.cos(U);  SU  = np.sin(U)
    CV  = np.cos(V);  SV  = np.sin(V)
    C2V = np.cos(2 * V)
    S2V = np.sin(2 * V)
    S3U = np.sin(3 * U)

    # Denominator: always ≥ 2 − √2 ≈ 0.586
    D = 2.0 - SQ2 * S3U * S2V

    X = (SQ2 * CU**2 * C2V + CU * SU * CV) / D
    Y = (SQ2 * CU**2 * S2V - CU * SU * SV) / D
    Z = 3.0 * CU**2 / D

    return X, Y, Z


# ── SCALE TO POI RADIUS ────────────────────────────────────────────────────
def _scale(X, Y, Z, radius):
    """Scale so that the furthest vertex lies at the target radius."""
    r_max = np.max(np.sqrt(X**2 + Y**2 + Z**2))
    s = radius / r_max
    return X * s, Y * s, Z * s


# ── VERTEX COLOUR: AZIMUTHAL HSV ───────────────────────────────────────────
def _az_hue(X, Y):
    """
    Hue from azimuthal angle φ = atan2(y,x), mapped [−π,π] → [0,1].
    The 3-fold symmetry creates three repeating colour sectors of 120° each.
    We use 3× the angle (mod 1) to emphasise the triplet structure.
    """
    phi = np.arctan2(Y, X)                  # −π to π
    hue = (3.0 * phi / (2.0 * np.pi)) % 1.0   # 0..1, 3-fold repetition
    return hue


def _hsv_to_rgb(h, s, v):
    """Vectorised HSV→RGB (all arrays)."""
    h6 = h * 6.0
    i  = np.floor(h6).astype(int) % 6
    f  = h6 - np.floor(h6)
    p  = v * (1 - s)
    q  = v * (1 - s * f)
    t  = v * (1 - s * (1 - f))
    r = np.select([i==0,i==1,i==2,i==3,i==4,i==5], [v,q,p,p,t,v])
    g = np.select([i==0,i==1,i==2,i==3,i==4,i==5], [t,v,v,q,p,p])
    b = np.select([i==0,i==1,i==2,i==3,i==4,i==5], [p,p,t,v,v,q])
    return r, g, b


# ── MAIN BUILD ─────────────────────────────────────────────────────────────
def build():
    # ── 0. Clean scene ─────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes) + list(bpy.data.materials):
        try:
            bpy.data.meshes.remove(blk)
        except Exception:
            pass
        try:
            bpy.data.materials.remove(blk)
        except Exception:
            pass

    # ── 1. Parametric surface ──────────────────────────────────────────────
    X, Y, Z = boy_surface(NU, NV)
    X, Y, Z = _scale(X, Y, Z, POI_RADIUS)

    # Flatten to vertex list (row-major: index = i*NV + j)
    Xf, Yf, Zf = X.ravel(), Y.ravel(), Z.ravel()
    verts = list(zip(Xf.tolist(), Yf.tolist(), Zf.tolist()))

    # Quads: (i,j) → (i,j+1), (i+1,j+1), (i+1,j) with v wrapping
    # WHY quads and not tris? Quads give smoother subdivision if needed
    # and cleaner normal interpolation across the surface.
    faces = []
    for i in range(NU - 1):
        for j in range(NV):
            v0 = i * NV + j
            v1 = i * NV + (j + 1) % NV
            v2 = (i + 1) * NV + (j + 1) % NV
            v3 = (i + 1) * NV + j
            faces.append((v0, v1, v2, v3))

    # ── 2. Mesh from pydata ────────────────────────────────────────────────
    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts, [], faces)
    me.validate()

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── 3. Vertex colours: 3-fold azimuthal HSV ───────────────────────────
    hue = _az_hue(X, Y).ravel()
    # Add slight brightness variation by z-height (triple-point dim, equator bright)
    z_norm = (Zf - Zf.min()) / (Zf.max() - Zf.min() + 1e-12)
    sat = 0.85
    val = 0.40 + 0.55 * z_norm

    R, G, B = _hsv_to_rgb(hue, sat, val)

    vc = me.attributes.new("BoyCol", "FLOAT_COLOR", "POINT")
    for vi in range(len(verts)):
        vc.data[vi].color = (R[vi], G[vi], B[vi], 1.0)

    # ── 4. Shape keys ──────────────────────────────────────────────────────
    # WHY shape keys? They let the WebXR viewer morph between poses without
    # re-uploading geometry. Each SK stores per-vertex deltas from Basis.
    obj.shape_key_add(name="Basis", from_mix=False)

    def _add_sk(name, x_scale, y_scale, z_scale, uniform=1.0):
        sk = obj.shape_key_add(name=name, from_mix=False)
        for vi, v in enumerate(me.vertices):
            bx, by, bz = Xf[vi], Yf[vi], Zf[vi]
            sk.data[vi].co.x = bx * x_scale * uniform
            sk.data[vi].co.y = by * y_scale * uniform
            sk.data[vi].co.z = bz * z_scale * uniform
        return sk

    # Oblate: flatten toward the equatorial disc plane
    # x,y expand to compensate volume (conserve bounding box ~)
    _add_sk("SK_Oblate",  x_scale=1.40, y_scale=1.40, z_scale=0.35)

    # Prolate: elongate toward the triple-point axis
    _add_sk("SK_Prolate", x_scale=0.65, y_scale=0.65, z_scale=2.60)

    # Tight: uniform shrink for stacking multiple poi heads
    _add_sk("SK_Tight",   x_scale=1.0,  y_scale=1.0,  z_scale=1.0, uniform=0.72)

    # ── 5. Material: vertex colour + Principled BSDF + Emission ───────────
    mat = bpy.data.materials.new(f"{OBJ_NAME}_mat")
    mat.use_nodes = True
    mat.use_backface_culling = False   # double-sided: surface is non-orientable!
    nt = mat.node_tree
    nt.nodes.clear()

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    mix   = nt.nodes.new("ShaderNodeMixShader")
    pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit  = nt.nodes.new("ShaderNodeEmission")
    vcol  = nt.nodes.new("ShaderNodeAttribute")
    vcol.attribute_name = "BoyCol"

    pbsdf.inputs["Metallic"].default_value  = METALLIC
    pbsdf.inputs["Roughness"].default_value = ROUGHNESS
    emit.inputs["Strength"].default_value   = EMIT_STR
    mix.inputs["Fac"].default_value         = EMIT_MIX

    nt.links.new(vcol.outputs["Color"], pbsdf.inputs["Base Color"])
    nt.links.new(vcol.outputs["Color"], emit.inputs["Color"])
    nt.links.new(pbsdf.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    obj.data.materials.append(mat)

    # ── 6. Flat shading + Holoflow metadata ────────────────────────────────
    bpy.ops.object.shade_flat()
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"

    # ── 7. WebXR +Y-up rotation (Holoflow convention) ─────────────────────
    import math
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(rotation=True)

    # ── 8. GLB export ──────────────────────────────────────────────────────
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,
        export_morph=True,
        export_yup=True,
    )

    # ── 9. Save .blend ─────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

    print(f"[holoflow] Boy surface built: {len(verts)} verts, {len(faces)} faces")
    print(f"[holoflow] GLB → {GLB_PATH}")
    print(f"[holoflow] .blend → {BLEND_PATH}")


if __name__ == "__main__":
    build()
