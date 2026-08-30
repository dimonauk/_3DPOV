"""
Torus Knot T(p,q) — Seifert Genus, Alexander Polynomial, Milnor Fibre,
Bishop Parallel-Transport Tube Poi Head  |  Blender 5.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A torus knot T(p,q) (p,q coprime) winds p times longitudinally and q times
meridionally around a standard torus before closing.  Embedding on T(R,r):

    γ(t) = ((R + r·cos(qt))·cos(pt),
             (R + r·cos(qt))·sin(pt),
             r·sin(qt))          t ∈ [0, 2π)

Key topological invariants (all require gcd(p,q) = 1):

  Seifert genus:    g = (p−1)(q−1)/2
    ↳ minimum genus of any spanning surface; equals algebraic genus = fibered genus
  Crossing number:  c = min(p(q−1), q(p−1))
  Bridge number:    b = min(p, q)
  Alexander poly:   Δ_{p,q}(t) = [(t^{pq}−1)(t−1)] / [(t^p−1)(t^q−1)]
    ↳ coefficients are topological invariants; degree = 2g (Seifert genus from polynomial!)
  Milnor fibre:     T(p,q) is fibered; complement of knot fibres over S¹;
                    fibre = smooth Milnor fibre of f(z,w)=z^p+w^q at origin of ℂ²;
                    monodromy = product of right-hand Dehn twists on genus-g surface.

Shape keys — four T(p,q) variants:
  Basis   T(2,3) trefoil:    g=1, c=3,  Δ = t² − t + 1
  SK_Cinq T(2,5) cinquefoil: g=2, c=5,  Δ = t⁴ − t³ + t² − t + 1
  SK_T34  T(3,4) 8₁₉:        g=3, c=8
  SK_T35  T(3,5) 10₁₂₄:      g=4, c=10

Vertex colour TorKnot_Z: z/r_minor mapped [0,1] → cobalt (equatorial bottom) / amber (top).

Sources (equations public domain):
  Rolfsen D (1976) Knots and Links. Publish or Perish. Knot table PD.
  Milnor J (1968) Singular Points of Complex Hypersurfaces. Ann.Math.Stud.61 PD.
  Seifert H (1934) Über das Geschlecht von Knoten. Math.Ann.110:571–592 PD.
"""

import bpy
import bmesh  # noqa: F401 — available in Blender's Python; used indirectly by bpy.ops
import numpy as np

# ── PARAMETERS ────────────────────────────────────────────────────────────────
R_MAJOR    = 2.0      # torus major radius; R/r=2 gives a clear, compact knot silhouette
R_MINOR    = 1.0      # torus minor radius; also equals z-amplitude of the knot
N_STEPS    = 1500     # waypoints per knot; MUST be identical for every shape key
TUBE_R     = 0.012    # tube cross-section radius (metres, applied after POI_R normalisation)
TUBE_SIDES = 12       # 12-gon cross-section: divisible by 4 → edge-loop mirror compatible
POI_R      = 0.082    # bounding-sphere radius for GLB poi-head WebXR export
OBJ_NAME   = "TorusKnot"

COBALT = (0.03, 0.15, 0.58, 1.0)   # z < 0 — below equatorial plane of the torus
AMBER  = (1.00, 0.65, 0.00, 1.0)   # z > 0 — above equatorial plane of the torus

# (p, q) pairs — gcd(p,q)=1 required; otherwise T(p,q) is a link, not a knot
SHAPES = {
    "Basis":   (2, 3),   # trefoil: minimal nontrivial knot, Seifert genus 1
    "SK_Cinq": (2, 5),   # cinquefoil (5₁): Seifert genus 2
    "SK_T34":  (3, 4),   # torus knot 8₁₉: g=3, crossing number 8
    "SK_T35":  (3, 5),   # torus knot 10₁₂₄: g=4, crossing number 10
}


# ── PARAMETRIC CURVE ──────────────────────────────────────────────────────────
def torus_knot_pts(p: int, q: int, n: int) -> np.ndarray:
    """
    Sample n equally-spaced points on T(p,q) embedded in the torus T(R_MAJOR, R_MINOR).
    Returns shape (n, 3).  Endpoint NOT repeated — the knot closes via index wrap.

    Analytical tangent (used to seed the Bishop frame):
        γ'(t) = (−(R+r cosqt)·p sinpt − rq sinqt cospt,
                  (R+r cosqt)·p cospt − rq sinqt sinpt,
                  rq cosqt)
    """
    t   = np.linspace(0.0, 2.0 * np.pi, n, endpoint=False)
    rho = R_MAJOR + R_MINOR * np.cos(q * t)   # distance from z-axis at each sample
    pts = np.column_stack([
        rho * np.cos(p * t),
        rho * np.sin(p * t),
        R_MINOR * np.sin(q * t),
    ])
    pts -= pts.mean(axis=0)                    # centroid to world origin
    pts *= POI_R / np.max(np.linalg.norm(pts, axis=1))   # normalise to poi sphere
    return pts.astype(np.float32)


# ── BISHOP PARALLEL TRANSPORT WITH HOLONOMY CORRECTION ───────────────────────
def bishop_frame(
    pts: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Compute twist-free Bishop normals N and binormals B for a CLOSED curve.

    WHY Bishop over Frenet?  Frenet normal is undefined at inflection points
    (where curvature vanishes).  Bishop removes this singularity by propagating
    only the tangent-aligning rotation (Rodrigues formula), leaving the normal
    free to rotate as little as possible.

    WHY holonomy correction?  For a closed curve the accumulated Bishop rotation
    after one full traversal (the holonomy Θ) is generally non-zero, so N[N-1]
    ≠ N[0].  We correct by applying a linear de-twist: at step i, rotate N[i]
    by −Θ·i/n around T[i].  This distributes the correction evenly so the tube
    closes smoothly without a visible seam.

    Returns T, N, B each of shape (n, 3).
    """
    n = len(pts)

    # Forward-difference tangents, closed: last point wraps to first
    raw       = np.empty_like(pts)
    raw[:-1]  = pts[1:] - pts[:-1]
    raw[-1]   = pts[0]  - pts[-1]    # closing chord
    T = raw / np.linalg.norm(raw, axis=1, keepdims=True)   # unit tangents

    # Seed the initial normal perpendicular to T[0]
    seed = np.array([0.0, 0.0, 1.0])
    if abs(np.dot(T[0], seed)) > 0.9:
        seed = np.array([1.0, 0.0, 0.0])   # fallback: T[0] near-vertical
    N    = np.empty_like(pts)
    N[0] = np.cross(T[0], seed)
    N[0] /= np.linalg.norm(N[0])

    # Sequential Bishop propagation (inherently serial — each step needs the previous)
    for i in range(1, n):
        axis  = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-10:            # T[i] ≈ T[i-1]: identity rotation
            N[i] = N[i - 1]
            continue
        axis /= sin_a
        cos_a = float(np.clip(np.dot(T[i - 1], T[i]), -1.0, 1.0))
        # Rodrigues' rotation of N[i-1] into the plane orthogonal to T[i]
        N[i] = (cos_a * N[i - 1]
                + sin_a * np.cross(axis, N[i - 1])
                + (1.0 - cos_a) * np.dot(axis, N[i - 1]) * axis)

    # ── Holonomy correction ────────────────────────────────────────────────────
    # Project N[n-1] into the plane ⊥ T[0] and measure signed angle to N[0]
    Nf   = N[n - 1] - np.dot(N[n - 1], T[0]) * T[0]
    Nf  /= max(np.linalg.norm(Nf), 1e-12)
    cos_h = float(np.clip(np.dot(Nf, N[0]), -1.0, 1.0))
    hol   = np.arccos(cos_h)
    if np.dot(np.cross(N[0], Nf), T[0]) < 0.0:
        hol = -hol   # signed angle: negative means clockwise when viewed along T[0]

    # Apply linear de-twist across all steps
    for i in range(n):
        angle   = -hol * i / n        # ramps from 0 (at i=0) to ≈ −hol (at i=n-1)
        ca, sa  = np.cos(angle), np.sin(angle)
        Bi_tmp  = np.cross(T[i], N[i])   # temporary binormal before correction
        N[i]    = ca * N[i] + sa * Bi_tmp

    B = np.cross(T, N)   # final binormal after all corrections
    return T, N, B


# ── TUBE MESH ─────────────────────────────────────────────────────────────────
def build_tube(
    pts: np.ndarray, N: np.ndarray, B: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """
    Extrude a TUBE_SIDES-gon cross-section along the curve.
    Returns verts (n*S, 3) and faces (n*S, 4) as contiguous float32/int32 arrays,
    ready for foreach_set.  All faces are quads; tube is closed (no end-caps).
    """
    n, S = len(pts), TUBE_SIDES
    angles = np.linspace(0.0, 2.0 * np.pi, S, endpoint=False)
    ca, sa = np.cos(angles), np.sin(angles)   # (S,) ring-angle components

    # Broadcasting: rings[i,j] = pts[i] + TUBE_R*(ca[j]*N[i] + sa[j]*B[i])
    rings = (pts[:, None, :]
             + TUBE_R * (ca[None, :, None] * N[:, None, :]
                         + sa[None, :, None] * B[:, None, :]))
    verts = rings.reshape(-1, 3).astype(np.float32)   # row-major: ring0v0 ring0v1 … ring1v0

    # Quad connectivity: ring i × ring (i+1)%n, vert j × vert (j+1)%S
    I, J  = np.meshgrid(np.arange(n), np.arange(S), indexing="ij")
    v00   = I * S + J
    v01   = I * S + (J + 1) % S
    v10   = ((I + 1) % n) * S + J
    v11   = ((I + 1) % n) * S + (J + 1) % S
    faces = np.stack([v00, v01, v11, v10], axis=-1).reshape(-1, 4).astype(np.int32)
    return verts, faces


# ── VERTEX COLOUR ─────────────────────────────────────────────────────────────
def knot_z_colours(pts: np.ndarray) -> np.ndarray:
    """
    z-coordinate → [0,1]: t=0 (z=-R_MINOR·scale) → COBALT, t=1 → AMBER.
    We use the actual (post-normalisation) z range of pts directly.
    Returns (n*TUBE_SIDES, 4) RGBA float32, one colour repeated per cross-section.
    """
    z     = pts[:, 2]
    z_max = np.abs(z).max() + 1e-9
    t_col = np.clip(0.5 + z / (2.0 * z_max), 0.0, 1.0)    # (n,) ∈ [0,1]
    rgb   = (np.outer(1.0 - t_col, COBALT[:3])
             + np.outer(t_col,       AMBER[:3]))              # (n,3)
    rgba  = np.hstack([rgb, np.ones((len(pts), 1))])          # (n,4) alpha=1
    return np.repeat(rgba, TUBE_SIDES, axis=0).astype(np.float32)  # (n*S,4)


# ── MATERIAL ──────────────────────────────────────────────────────────────────
def build_material(obj: bpy.types.Object) -> None:
    """
    Principled BSDF driven by ShaderNodeAttribute reading TorKnot_Z vertex colour.
    Emission drives the bloom glow in EEVEE Next at strength 1.8.
    """
    mat  = bpy.data.materials.new("TorKnotMat")
    mat.use_nodes   = True
    mat.blend_method = "OPAQUE"
    tree = mat.node_tree
    tree.nodes.clear()

    attr = tree.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "TorKnot_Z"
    bsdf = tree.nodes.new("ShaderNodeBsdfPrincipled")
    out  = tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf.inputs["Metallic"].default_value          = 0.45
    bsdf.inputs["Roughness"].default_value         = 0.26
    bsdf.inputs["Emission Strength"].default_value = 1.8

    tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    tree.links.new(attr.outputs["Color"], bsdf.inputs["Emission Color"])
    tree.links.new(bsdf.outputs["BSDF"],  out.inputs["Surface"])
    obj.data.materials.append(mat)


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # Build the Basis (T(2,3) trefoil) geometry
    p0, q0   = SHAPES["Basis"]
    pts0     = torus_knot_pts(p0, q0, N_STEPS)
    _, N0, B0 = bishop_frame(pts0)
    verts0, faces0 = build_tube(pts0, N0, B0)

    mesh = bpy.data.meshes.new(OBJ_NAME)
    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    # Bulk mesh population via foreach_set — 30–50× faster than Python loops
    nV, nF = len(verts0), len(faces0)
    mesh.vertices.add(nV)
    mesh.vertices.foreach_set("co", verts0.ravel())
    mesh.loops.add(nF * 4)
    mesh.polygons.add(nF)
    mesh.polygons.foreach_set("loop_start", np.arange(nF) * 4)
    mesh.polygons.foreach_set("loop_total",  np.full(nF, 4))
    mesh.loops.foreach_set("vertex_index",   faces0.ravel())
    mesh.update()
    mesh.validate()

    # Vertex colour attribute — POINT domain: one RGBA per vertex, exported in GLB
    vcol = mesh.color_attributes.new(
        name="TorKnot_Z", type="FLOAT_COLOR", domain="POINT"
    )
    vcol.data.foreach_set("color", knot_z_colours(pts0).ravel())

    # Shape keys: Basis first (required by Blender before any variant keys)
    sk_b = obj.shape_key_add(name="Basis", from_mix=False)
    sk_b.interpolation = "KEY_LINEAR"

    for sk_name, (p, q) in SHAPES.items():
        if sk_name == "Basis":
            continue
        pts_v    = torus_knot_pts(p, q, N_STEPS)
        _, Nv, Bv = bishop_frame(pts_v)
        verts_v, _ = build_tube(pts_v, Nv, Bv)   # face topology invariant

        sk   = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.interpolation = "KEY_LINEAR"
        # Write absolute positions into the shape key block (not deltas)
        sk.data.foreach_set("co", verts_v.ravel())

    # +Y-up for WebXR convention, apply so GLB exporter sees the correct orientation
    obj.rotation_euler = (-np.pi / 2.0, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Holoflow metadata read by the WebXR exporter add-on
    obj["holoflow:facet"]       = False
    obj["holoflow:category"]    = "poi-head"
    obj["holoflow:export_name"] = "hf_torus_knot_poi"

    build_material(obj)
    print(
        f"[TorusKnot] done — {nV} verts · {nF} quads · "
        f"4 shape keys (T(2,3)/T(2,5)/T(3,4)/T(3,5))"
    )


main()
