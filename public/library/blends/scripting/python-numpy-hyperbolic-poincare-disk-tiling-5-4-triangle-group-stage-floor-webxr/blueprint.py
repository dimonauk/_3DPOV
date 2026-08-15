"""
Hyperbolic {5,4} Tiling — Poincaré Disk Model
Triangle Group, Möbius Reflections, Geodesic Arcs & Stage Floor for WebXR
Blender 5.1 · Holoflow Studio · CC0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Geometry Background
───────────────────
The Poincaré disk D = {z ∈ ℂ : |z| < 1} is a conformal model of the
hyperbolic plane H² when given the metric ds² = 4|dz|²/(1-|z|²)².
Geodesics (shortest paths) are arcs of Euclidean circles orthogonal to
the unit circle, and diameters.

A Schläfli {p,q} tiling places regular p-gons so that q meet at every
vertex.  The hyperbolic condition is (p-2)(q-2) > 4.  For {5,4}:
  (5-2)(4-2) = 6 > 4  ✓  — pentagons, four at every vertex.

Interior angle at each vertex = 2π/q = π/2 (right angles!).  The
four pentagons fitting flush at every corner are a hallmark of M.C.
Escher's "Circle Limit" woodcuts, which use the {6,4} variant.

Circumradius Formula
────────────────────
For a regular {p,q} polygon in H², the hyperbolic circumradius R and
Euclidean disk radius ρ satisfy (derived from Napier's rules on the
right triangle formed by centre, vertex, edge midpoint):

  cosh(R) = cos(π/q) / sin(π/p)

  ρ = tanh(R/2)    [Euclidean radius of vertex circle in Poincaré disk]

For {5,4}: cosh(R) = cos(π/4)/sin(π/5) ≈ 1.2031 → R ≈ 0.6348
           ρ = tanh(0.3174) ≈ 0.3073

Isometry Group & Reflections
─────────────────────────────
The orientation-reversing symmetries of the tiling are reflections across
geodesic sides.  In the disk, reflecting z across the geodesic through
p₁ and p₂ is equivalent to:

  1. Map p₁ → 0 via the Möbius isometry T(w) = (w − p₁)/(1 − p̄₁w)
  2. Rotate so T(p₂) lies on the positive real axis
  3. Reflect across the real axis (complex conjugate)
  4. Undo the rotation and T

This composition is itself a Möbius transformation z → (az+b)/(b̄z+ā)
with |a|²−|b|²=1 — an element of SU(1,1) / {±1} ≅ PSU(1,1) ≅ PSL(2,ℝ),
the full orientation-preserving isometry group of H².

BFS Tiling Strategy
───────────────────
Starting from the central pentagon, reflect across each of its 5 sides
to find 5 adjacent pentagons.  Repeat for every new pentagon not yet
visited.  Stop when the tile centre exceeds DISK_CUTOFF (tiles near |z|=1
become infinitesimally thin in the Euclidean sense — no mesh benefit).

Each tile is canonically identified by its rounded centroid (4 d.p.),
avoiding duplicate reflections.

Shape Keys
──────────
  Basis      — flat stage floor (z = 0)
  SK_Dome    — gentle dome: z = tanh(hyp_dist / 3) × DOME_HEIGHT
  SK_Bowl    — inverted dome (bowl): z = −tanh(hyp_dist / 3) × DOME_HEIGHT
  SK_Ripple  — sinusoidal ripple: z = sin(3π × r_euc) × RIPPLE_AMP
               where r_euc = Euclidean radius of vertex in disk

References:
  • Thurston WP (1997) "Three-Dimensional Geometry and Topology" §2.3
  • Poincaré H (1882) Acta Math 1:1-62 — disk model definition (PD)
  • Escher MC — Circle Limit IV (1960) — artistic motivation (copyright expired)
"""

import bpy
import bmesh
import math
import numpy as np
from pathlib import Path

# ── CONSTANTS ────────────────────────────────────────────────────────────────
SLUG      = "python-numpy-hyperbolic-poincare-disk-tiling-5-4-triangle-group-stage-floor-webxr"
OBJ_NAME  = "hf_hyp_tiling_5_4"
MESH_NAME = "HF_HypTiling54"
HERE      = Path(__file__).parent
GLB_PATH  = str(HERE / "hf_hyp_tiling_5_4.glb")
BLEND_PATH = str(HERE / "hf_hyp_tiling_5_4.blend")

P, Q       = 5, 4          # Schläfli {p,q} — pentagons, 4 at each vertex
MAX_TILES  = 450           # BFS tile limit (≈ 3 rings of depth)
DISK_CUTOFF = 0.92         # discard tiles with |centre| > this
SCALE      = 1.2           # stage floor radius in metres

DOME_HEIGHT  = 0.12        # metres: max z for dome shape key
RIPPLE_AMP   = 0.06        # metres: amplitude of ripple shape key

METALLIC   = 0.35
ROUGHNESS  = 0.55
EMIT_STR   = 1.8
EMIT_MIX   = 0.12


# ── HYPERBOLIC GEOMETRY ───────────────────────────────────────────────────────
# Circumradius of central pentagon (Euclidean units in Poincaré disk)
_R_HYP = math.acosh(math.cos(math.pi / Q) / math.sin(math.pi / P))
RHO    = math.tanh(_R_HYP / 2)   # ≈ 0.3073 for {5,4}


def _poincare_reflect(z_arr, p1, p2):
    """
    Reflect numpy array of complex points z_arr across the geodesic p₁→p₂.

    WHY Möbius composition: geodesics in the Poincaré disk are arcs of
    circles orthogonal to the unit circle — not straight lines. Reflecting
    across them requires the three-step Möbius conjugation below.
    """
    T     = lambda w: (w - p1) / (1.0 - p1.conjugate() * w)
    T_inv = lambda w: (w + p1) / (1.0 + p1 * w)
    t2    = T(p2)
    theta = np.angle(t2)
    # Map z, rotate, conjugate (reflect real axis), un-rotate, un-Möbius
    w = T(np.asarray(z_arr, dtype=complex)) * np.exp(-1j * theta)
    return T_inv(np.conj(w) * np.exp(1j * theta))


def _reflect_tile(verts, side):
    """Reflect the p-gon (list of complex vertices) across edge `side`."""
    p1 = verts[side]
    p2 = verts[(side + 1) % P]
    v_arr = np.array(verts, dtype=complex)
    return list(_poincare_reflect(v_arr, p1, p2))


def _tile_key(verts):
    cx = sum(v.real for v in verts) / P
    cy = sum(v.imag for v in verts) / P
    return (round(cx, 4), round(cy, 4))


def _hyp_dist(z):
    """Hyperbolic distance from origin to point z in the Poincaré disk."""
    # d(0, z) = 2 arctanh(|z|)
    r = min(abs(z), 0.9999)
    return 2.0 * math.atanh(r)


# ── BFS TILING ────────────────────────────────────────────────────────────────
def generate_tiles():
    """
    BFS from the central pentagon.

    WHY BFS and not word-enumeration of the group?  BFS gives a natural
    'depth' for each tile (number of reflections from centre), which drives
    the vertex colour gradient.  Word enumeration would produce the same
    tiles but without a clean depth ordering.

    Returns: list of (verts, depth) where verts is a list of P complex numbers.
    """
    # Central pentagon: vertices at radius RHO, angles 2πk/5
    base_verts = [complex(RHO * math.cos(2 * math.pi * k / P),
                          RHO * math.sin(2 * math.pi * k / P))
                  for k in range(P)]

    tiles  = [(base_verts, 0)]
    seen   = {_tile_key(base_verts)}
    queue  = [(base_verts, 0)]

    while queue and len(tiles) < MAX_TILES:
        current, depth = queue.pop(0)
        cx = sum(v.real for v in current) / P
        cy = sum(v.imag for v in current) / P
        for side in range(P):
            new_verts = _reflect_tile(current, side)
            # Centre of new tile
            ncx = sum(v.real for v in new_verts) / P
            ncy = sum(v.imag for v in new_verts) / P
            if math.hypot(ncx, ncy) > DISK_CUTOFF:
                continue                          # too close to boundary
            key = _tile_key(new_verts)
            if key not in seen:
                seen.add(key)
                entry = (new_verts, depth + 1)
                tiles.append(entry)
                queue.append(entry)

    return tiles


# ── COLOUR HELPERS ────────────────────────────────────────────────────────────
def _hsv_to_rgb_scalar(h, s, v):
    h6 = (h * 6.0) % 6.0
    i  = int(h6)
    f  = h6 - i
    p  = v * (1 - s)
    q  = v * (1 - s * f)
    t  = v * (1 - s * (1 - f))
    return [(v,t,p),(q,v,p),(p,v,t),(p,q,v),(t,p,v),(v,p,q)][i]


# ── BUILD ─────────────────────────────────────────────────────────────────────
def build():
    # ── 0. Clean scene ────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for blk in list(bpy.data.meshes) + list(bpy.data.materials):
        try: bpy.data.meshes.remove(blk)
        except Exception: pass
        try: bpy.data.materials.remove(blk)
        except Exception: pass

    # ── 1. Generate tiling ────────────────────────────────────────────────────
    tiles = generate_tiles()
    max_depth = max(d for _, d in tiles) or 1

    # ── 2. Build mesh ─────────────────────────────────────────────────────────
    bm = bmesh.new()

    # Per-vertex data lists for shape keys
    vco_basis   = []      # (x, y, z=0) for basis (flat)
    vco_dome    = []      # (x, y, z_dome)
    vco_bowl    = []      # (x, y, z_bowl)
    vco_ripple  = []      # (x, y, z_ripple)
    vcol_data   = []      # (r, g, b) per vertex

    face_indices = []

    for (verts, depth) in tiles:
        hue = depth / (max_depth + 1)            # 0=purple(centre) →1=red
        rgb = _hsv_to_rgb_scalar(0.75 - 0.7 * hue, 0.80, 0.90)
        face_vi = []
        for v in verts:
            x = v.real * SCALE
            y = v.imag * SCALE
            bm_v = bm.verts.new((x, y, 0.0))
            vi = len(vco_basis)
            face_vi.append(vi)
            vco_basis.append((x, y, 0.0))

            # Hyperbolic distance from origin → drives dome/bowl
            hd = _hyp_dist(v)
            z_dome  =  math.tanh(hd / 3.0) * DOME_HEIGHT
            z_bowl  = -math.tanh(hd / 3.0) * DOME_HEIGHT
            z_ripple = math.sin(3.0 * math.pi * abs(v)) * RIPPLE_AMP
            vco_dome.append((x, y, z_dome))
            vco_bowl.append((x, y, z_bowl))
            vco_ripple.append((x, y, z_ripple))
            vcol_data.append(rgb)

        bm.faces.new([bm.verts[-P + i] for i in range(P)])
        face_indices.append(face_vi)

    # Merge vertices shared between adjacent tiles
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    bm.verts.ensure_lookup_table()

    me = bpy.data.meshes.new(MESH_NAME)
    bm.to_mesh(me)
    bm.free()
    me.validate()

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # ── 3. Flat shading (faceted aesthetic) ───────────────────────────────────
    bpy.ops.object.shade_flat()

    # ── 4. Vertex colours by depth ────────────────────────────────────────────
    vc_attr = me.attributes.new("HypDepth", "FLOAT_COLOR", "POINT")
    # Re-build colour per merged vertex using position as proxy
    for vi, mv in enumerate(me.vertices):
        r_euc = math.hypot(mv.co.x, mv.co.y) / SCALE
        hue   = 0.75 - 0.70 * (r_euc / DISK_CUTOFF)
        rgb   = _hsv_to_rgb_scalar(hue % 1.0, 0.80, 0.90)
        vc_attr.data[vi].color = (*rgb, 1.0)

    # ── 5. Shape keys ─────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    def _add_sk(name, z_func):
        sk = obj.shape_key_add(name=name, from_mix=False)
        for vi, mv in enumerate(me.vertices):
            x, y = mv.co.x, mv.co.y
            r_euc = math.hypot(x, y) / SCALE   # Euclidean disk radius
            v_complex = complex(x / SCALE, y / SCALE)
            sk.data[vi].co.x = x
            sk.data[vi].co.y = y
            sk.data[vi].co.z = z_func(r_euc, v_complex)

    _add_sk("SK_Dome",   lambda r, v: math.tanh(_hyp_dist(v) / 3.0) * DOME_HEIGHT)
    _add_sk("SK_Bowl",   lambda r, v: -math.tanh(_hyp_dist(v) / 3.0) * DOME_HEIGHT)
    _add_sk("SK_Ripple", lambda r, v: math.sin(3.0 * math.pi * r) * RIPPLE_AMP)

    # ── 6. Material: vertex colour + PBR ─────────────────────────────────────
    mat = bpy.data.materials.new(f"{OBJ_NAME}_mat")
    mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    mix   = nt.nodes.new("ShaderNodeMixShader")
    pbsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit  = nt.nodes.new("ShaderNodeEmission")
    vcol  = nt.nodes.new("ShaderNodeAttribute")
    vcol.attribute_name = "HypDepth"
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

    # ── 7. Holoflow metadata + +Y-up ──────────────────────────────────────────
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "stage-floor"
    obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(rotation=True)

    # ── 8. GLB export ─────────────────────────────────────────────────────────
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH, export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True, export_morph=True, export_yup=True,
    )

    # ── 9. Save .blend ────────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

    n_verts = len(me.vertices)
    n_faces = len(me.polygons)
    print(f"[holoflow] {len(tiles)} tiles, {n_verts} verts, {n_faces} faces")
    print(f"[holoflow] GLB → {GLB_PATH}")


if __name__ == "__main__":
    build()
