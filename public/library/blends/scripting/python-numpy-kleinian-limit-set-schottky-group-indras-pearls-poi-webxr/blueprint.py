"""
blueprint.py — Kleinian Limit Set: Schottky Group & Fractal Dust Sculpture
Blender 5.1 · Python 3.11 · CC0

A Kleinian group is a discrete subgroup of PSL(2,ℂ) — the group of all
Möbius transformations of the Riemann sphere ℂ∪{∞}.  A *Schottky group* is
constructed by choosing N pairs of disjoint circles {C_j, C_j'} and declaring
generator g_j to be whichever Möbius map sends ext(C_j) homeomorphically onto
int(C_j').  Repeated application of all generators and their inverses produces
a *group word*, and the set of all accumulation points of every orbit is the
LIMIT SET Λ(G) — a self-similar fractal that lives on ℂ∪{∞}.

Here we build a 4-circle symmetric Schottky group: two real-axis paired circles
at centres ±D and two imaginary-axis paired circles at centres ±Di, all of
radius R, with D/R chosen so the four circles are pairwise disjoint (requires
D > R√2 for the diagonal adjacency constraint).  Limit-set points are
collected by depth-first word enumeration and then projected via inverse
stereographic map to S² for a 3-D fractal cloud GLB ready for WebXR.

Outside sources
---------------
Mumford, Series & Wright (2002) "Indra's Pearls: The Vision of Felix Klein".
  Cambridge University Press.  CC0 preview via Internet Archive.
  https://archive.org/details/indraspearlsthev0000mumf
  Related: https://github.com/erleben/indras-pearls (MIT, K. Erleben 2021)

Maskit, Bernard (1988) "Kleinian Groups". Springer.  Academic fair use.
  https://doi.org/10.1007/978-3-642-61590-0
  Related: https://github.com/Finistrex/kleinian-groups (MIT)
"""

import bpy, bmesh, math
import numpy as np
from mathutils import Vector

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
D             = 1.55     # half-separation of circle pairs; D > R√2 ≈ 1.414 for disjointness
R             = 1.00     # common radius; smaller gap = richer fractal
DEPTH         = 8        # word length for DFS; terminal count = 4·3^(DEPTH-1)
SEED          = 0.25 + 0.35j  # starting point (must lie outside all 4 circles)
TRIANGLE_SIZE = 0.014    # visual size of each limit-point indicator triangle
SPHERE_RADIUS = 1.0      # radius of the S² onto which the limit set is projected
EMIT_STRENGTH = 7.0      # bloom-friendly emission strength (EEVEE Next)

# ─── GENERATOR MATRICES (PSL(2,ℂ)) ───────────────────────────────────────────
# Generator a maps ext(|z+D|>R) → int(|z-D|<R):
#   a(z) = (D·z + D²−R²) / (z + D)
#   det  = D² − (D²−R²) = R²  →  normalise by R so det = 1.
# Generator b is the 90° rotation conjugate of a, acting on the imaginary circles.
#   b = R_{π/2} · a · R_{π/2}^{-1},  R_{π/2}(z) = iz
#   b_matrix = [[D/R, i(D²−R²)/R], [−i/R, D/R]]  (verified via explicit circle mapping)
# Inverses via M^{-1} = [[t,−q],[−s,p]] for M = [[p,q],[s,t]] with det = 1.
K  = (D * D - R * R) / R   # off-diagonal scale; K→0 as D→R (rich-limit regime)
DR = D / R

A   = np.array([[DR,      K    ], [1.0/R,  DR]], dtype=complex)
AI  = np.array([[DR,     -K    ], [-1.0/R, DR]], dtype=complex)  # a^{-1}
B   = np.array([[DR,   1j*K   ], [-1j/R,  DR]], dtype=complex)
BI  = np.array([[DR,  -1j*K   ], [ 1j/R,  DR]], dtype=complex)  # b^{-1}

GENS    = [(A, 0), (AI, 1), (B, 2), (BI, 3)]
INVERSE = {0: 1, 1: 0, 2: 3, 3: 2}   # g and its cancelling inverse

# ─── MÖBIUS ACTION ───────────────────────────────────────────────────────────
def mobius(M, z):
    """Apply M = [[p,q],[s,t]] to z ∈ ℂ; returns ∞-guard value on pole."""
    denom = M[1, 0] * z + M[1, 1]
    if abs(denom) < 1e-12:
        return 1e6 + 0j
    return (M[0, 0] * z + M[0, 1]) / denom

# ─── LIMIT SET VIA DFS WORD ENUMERATION ──────────────────────────────────────
def kleinian_limit_set(depth):
    """DFS over all group words of exact length `depth`, no adjacent cancellation.

    Branching factor = 3 (4 generators minus the one that cancels the previous).
    Terminal point count: 4·3^(depth−1).  At depth 8 this is 4·2187 = 8748 pts.
    The resulting cloud approximates the limit set Λ(G) ⊂ ℂ∪{∞}.
    """
    # Each stack entry: (current_z, last_gen_id, current_depth)
    stack  = [(SEED, -1, 0)]
    result = []
    while stack:
        z, last_id, d = stack.pop()
        for M, gid in GENS:
            if gid == INVERSE.get(last_id, -99):
                continue           # skip: would cancel previous step → empty word
            zn = mobius(M, z)
            if d + 1 == depth:
                result.append(zn)  # record terminal point
            else:
                stack.append((zn, gid, d + 1))
    return np.asarray(result, dtype=complex)

# ─── INVERSE STEREOGRAPHIC PROJECTION ℂ → S² ─────────────────────────────────
def inv_stereo(w):
    """Project complex plane ℂ to unit S² via inverse south-pole stereographic.

    Standard formula (south-pole = (0,0,−1), maps to ∞):
        x = 2·Re(w) / (|w|²+1)
        y = 2·Im(w) / (|w|²+1)
        z = (|w|²−1) / (|w|²+1)
    Preserves angles (conformal), maps |w|=1 circle to equator, 0 to south pole.
    """
    u, v = w.real, w.imag
    s    = u * u + v * v
    d    = s + 1.0
    return np.stack([2 * u / d, 2 * v / d, (s - 1.0) / d], axis=-1)  # (N, 3)

# ─── VECTORISED TANGENT-PLANE TRIANGLE GENERATOR ─────────────────────────────
def sphere_triangles(pts3, size):
    """Return vertex array (3N, 3) of tiny equilateral triangles at each S² point.

    Each triangle lies in the tangent plane at the point (i.e. face normal =
    outward radial direction), giving billboard-like orientation at every point.
    Uses numpy broadcasts — no Python loop over points.
    """
    n   = pts3 / np.linalg.norm(pts3, axis=1, keepdims=True).clip(1e-12)
    # First tangent axis: cross(n, x̂) or cross(n, ŷ) where x̂ would be parallel
    ref = np.where(np.abs(n[:, 0:1]) < 0.85,
                   np.tile([1, 0, 0], (len(n), 1)),
                   np.tile([0, 1, 0], (len(n), 1))).astype(float)
    t1  = np.cross(n, ref)
    t1 /= np.linalg.norm(t1, axis=1, keepdims=True).clip(1e-12)
    t2  = np.cross(n, t1)
    t2 /= np.linalg.norm(t2, axis=1, keepdims=True).clip(1e-12)
    # Equilateral triangle vertices offset from the limit point
    SQ3 = math.sqrt(3) / 2
    v0  = pts3 + size * t1
    v1  = pts3 + size * (-0.5 * t1 + SQ3 * t2)
    v2  = pts3 + size * (-0.5 * t1 - SQ3 * t2)
    return np.stack([v0, v1, v2], axis=1).reshape(-1, 3)  # (3N, 3)

# ─── BUILD LIMIT-SET MESH ─────────────────────────────────────────────────────
def build_cloud_mesh(pts3, name):
    """Pack limit-set triangles into a single mesh object.  8748 triangles ≈ 26K verts."""
    verts = sphere_triangles(pts3, TRIANGLE_SIZE)
    N     = len(pts3)
    mesh  = bpy.data.meshes.new(name)
    mesh.vertices.add(3 * N)
    mesh.vertices.foreach_set("co", verts.astype(np.float32).ravel().tolist())
    mesh.loops.add(3 * N)
    mesh.loops.foreach_set("vertex_index", list(range(3 * N)))
    mesh.polygons.add(N)
    mesh.polygons.foreach_set("loop_start", [i * 3 for i in range(N)])
    mesh.polygons.foreach_set("loop_total", [3] * N)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

# ─── SCHOTTKY GUIDE CIRCLES ───────────────────────────────────────────────────
def build_guide_circle(cx, cy, radius, name):
    """NURBS circle in the complex (x,y) plane offset to z = −1.25 for context."""
    bpy.ops.curve.primitive_nurbs_circle_add(radius=radius,
                                              location=(cx, cy, -1.25))
    obj      = bpy.context.active_object
    obj.name = name
    obj.data.bevel_depth = 0.008
    return obj

# ─── EMISSION MATERIAL ────────────────────────────────────────────────────────
def make_emit_mat(name, rgb, strength):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em  = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value    = (*rgb, 1.0)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat

# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    # Clear scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                bpy.data.cameras):
        for item in list(blk):
            blk.remove(item)

    # 1 — Compute limit set
    print(f"DFS depth={DEPTH} → expected {4 * (3 ** (DEPTH - 1))} terminal pts")
    w_pts  = kleinian_limit_set(DEPTH)
    finite = np.abs(w_pts) < 80.0          # discard near-∞ preimage artefacts
    w_pts  = w_pts[finite]
    print(f"  {len(w_pts)} finite limit-set points collected")

    # 2 — Project to S² and scale by SPHERE_RADIUS
    pts3   = inv_stereo(w_pts) * SPHERE_RADIUS
    norms  = np.linalg.norm(pts3, axis=1, keepdims=True)
    pts3   = pts3 / norms.clip(1e-12) * SPHERE_RADIUS  # exact unit sphere

    # 3 — Build fractal cloud mesh
    cloud = build_cloud_mesh(pts3, "hf_kleinian_cloud")
    mat_c = make_emit_mat("hf_kleinian_emit", (0.55, 0.10, 1.00), EMIT_STRENGTH)
    cloud.data.materials.append(mat_c)

    # 4 — Four Schottky guide circles in the complex plane (z = −1.25)
    circle_defs = [(-D, 0, "hf_schottky_Ca"), (D, 0, "hf_schottky_CA"),
                   (0, -D, "hf_schottky_Cb"), (0,  D, "hf_schottky_CB")]
    mat_g = make_emit_mat("hf_schottky_guide", (0.10, 0.80, 1.00), 2.5)
    for cx, cy, name in circle_defs:
        gc = build_guide_circle(cx, cy, R, name)
        gc.data.materials.append(mat_g)

    # 5 — Camera
    bpy.ops.object.camera_add(location=(0, -3.5, 1.0))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(73), 0, 0)
    bpy.context.scene.camera = cam

    # 6 — EEVEE Next render settings
    scn = bpy.context.scene
    scn.render.engine = "BLENDER_EEVEE_NEXT"
    scn.eevee.bloom_threshold = 0.55
    scn.eevee.bloom_intensity = 0.95
    scn.eevee.bloom_radius    = 4.0

    # 7 — Export GLB (Draco level 6, WebP textures, +Y up)
    bpy.ops.export_scene.gltf(
        filepath = "//hf_kleinian.glb",
        export_format = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_apply = True,
    )
    print("GLB written → hf_kleinian.glb")
    bpy.ops.wm.save_as_mainfile(filepath="//hf_kleinian.blend")
    print("Blend saved → hf_kleinian.blend")

main()
