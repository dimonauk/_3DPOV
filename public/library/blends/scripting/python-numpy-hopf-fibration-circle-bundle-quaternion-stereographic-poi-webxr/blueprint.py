"""
Hopf Fibration  —  π : S³ → S²  Circle Bundle  (Blender 5.1 / Python 3.11)
=============================================================================
Heinz Hopf, 1931. "Über die Abbildungen der dreidimensionalen Sphäre auf die
Kugelfläche."  Math. Annalen 104: 637–665.

Technique in two sentences
--------------------------
Every point p on the 2-sphere S² corresponds to a great circle (the Hopf
fibre) on the 3-sphere S³.  Stereographic projection from S³ into ordinary
ℝ³ turns each fibre into a circle — and any two such circles are pairwise
linked with Hopf linking number exactly 1.

Expert notes
============
• S³ is modelled in ℂ² as {(z₁,z₂) : |z₁|²+|z₂|² = 1}.
• The Hopf map  π(z₁,z₂) = (2 Re(z₁z̄₂), 2 Im(z₁z̄₂), |z₁|²−|z₂|²)
  is a smooth surjection S³ → S² with every fibre π⁻¹(p) ≅ S¹.
• In unit-quaternion terms: π(q) = q · i · q̄  (conjugation orbit).
  This is exactly how Blender's quaternion rotations work — the Hopf
  fibration is the geometry underlying SLERP.
• The stereographic projection from north pole (1,0,0,0) ∈ S³ sends each
  fibre circle to a circle (or a straight line for the north-pole fibre)
  in ℝ³.  The resulting family of circles fills all of ℝ³ with no two
  crossing — they merely link.
• Equatorial fibres (base point on S² equator, θ=π/2) project onto the
  CLIFFORD TORUS: the unique flat, embedded torus in S³, image of the
  product circle S¹×S¹ ⊂ S³.  Shape key SK_Clifford shows this.
• Bishop parallel-transport tubes avoid Frenet-frame singularities on
  nearly-straight segments (particularly for near-pole fibres in ℝ³).
• Scale: 95th percentile of vertex radii is mapped to POI_R so the dense
  inner cluster of south-hemisphere fibres is not washed out.

Author  : Holoflow Studio (CC0)
Blender : 5.1
Deps    : numpy (bundled with Blender)
Output  : hf_hopf_poi.blend  →  hf_hopf_poi.glb
"""

import bpy, math, numpy as np

# ── PARAMETERS ────────────────────────────────────────────────────────────────
N_FIBERS      = 48        # Fibonacci-sphere base points on S²
N_FIBER_STEPS = 80        # vertices along each fibre circle (even × N_TUBE_SIDES)
N_TUBE_SIDES  = 8         # polygon cross-section for Bishop tube
TUBE_R        = 0.018     # tube radius, metres (Basis shape key)
POI_R         = 0.082     # bounding sphere, metres

# Avoid projections that diverge to the S³ north pole: clamp 1/(1−w) here
STEREO_CLAMP  = 25.0      # max value of 1/(1−w); corresponds to w ≥ 1 − 1/25

# Colour palette: Cobalt (south-pole fibre) → Amber (north-pole fibre)
COL_COBALT = (0.06, 0.20, 0.80, 1.0)
COL_AMBER  = (0.88, 0.52, 0.04, 1.0)

OBJ_NAME  = "HF_Hopf_Poi"
ATTR_NAME = "Hopf_Fibre"   # FLOAT_COLOR POINT vertex attribute

# ── MATHS ─────────────────────────────────────────────────────────────────────

def fibonacci_sphere(n: int, theta_min: float = 0.08, theta_max: float = 0.92):
    """
    n uniformly distributed points on S², restricted to the polar band
    [theta_min·π, theta_max·π] to keep stereographic coordinates finite.
    Returns arrays (theta, phi) in radians.

    WHY golden-angle lattice: O(n) placement with ~uniform density and no
    clustering at the poles, unlike latitude-longitude grids.
    """
    golden = (1.0 + math.sqrt(5.0)) / 2.0
    i = np.arange(n, dtype=np.float64)
    # Raw Fibonacci latitudes, then remap to the desired polar band
    t_raw = (i + 0.5) / n                         # (0,1)
    theta = (theta_min + t_raw * (theta_max - theta_min)) * math.pi
    phi   = 2.0 * math.pi * i / golden
    return theta, phi


def hopf_fiber_R3(theta: float, phi: float, n: int) -> np.ndarray:
    """
    Stereographic projection π_stereo ∘ fibre(θ,φ) of the Hopf fibre over
    the point p = (sin θ cos φ, sin θ sin φ, cos θ) ∈ S².

    Fibre parametrisation (WHY: derived directly from the Hopf map condition
    π(z₁,z₂) = p):
        z₁(α) = r₁ · e^{iα}                 r₁ = √((1+cosθ)/2)
        z₂(α) = r₂ · e^{i(φ+α)}             r₂ = √((1−cosθ)/2)   α ∈ [0,2π)

    Stereographic projection from (1,0,0,0) ∈ S³:
        (w,x,y,z) → (x/(1−w), y/(1−w), z/(1−w))
    where (w,x,y,z) = (Re z₁, Im z₁, Re z₂, Im z₂).

    Near the S³ north pole (w→1) the projection diverges; we clamp
    1/(1−w) to STEREO_CLAMP — those fibres project to near-infinite lines.
    """
    alpha = np.linspace(0.0, 2.0 * math.pi, n, endpoint=False)

    r1 = math.sqrt(max((1.0 + math.cos(theta)) / 2.0, 0.0))
    r2 = math.sqrt(max((1.0 - math.cos(theta)) / 2.0, 0.0))

    w = r1 * np.cos(alpha)
    x = r1 * np.sin(alpha)
    y = r2 * np.cos(phi + alpha)
    z = r2 * np.sin(phi + alpha)

    # Clamp the inverse denominator (WHY: avoids degenerate tube geometry for
    # near-north-pole base points without discarding those fibres entirely)
    inv_denom = np.minimum(1.0 / np.maximum(1.0 - w, 1.0 / STEREO_CLAMP),
                           STEREO_CLAMP)
    pts = np.stack([x * inv_denom, y * inv_denom, z * inv_denom], axis=1)
    return pts   # shape (n, 3)


def bishop_tube(curve: np.ndarray, radius: float, n_sides: int):
    """
    Bishop parallel-transport tube around a closed curve.
    Returns (verts, quads) as numpy arrays, shapes (n·n_sides, 3) and (n·n_sides, 4).

    WHY Bishop over Frenet: Frenet frames are undefined where curvature = 0
    (locally straight segments of projected Hopf fibres near ±∞).  Bishop
    frames propagate the normal by a minimal Rodrigues rotation, avoiding
    that singularity.  A holonomy correction distributes the accumulated
    torsion uniformly so the tube seam closes.
    """
    n = len(curve)

    # Centred-difference tangents, normalised
    T = np.empty_like(curve)
    for i in range(n):
        d = curve[(i + 1) % n] - curve[(i - 1) % n]
        nrm = np.linalg.norm(d)
        T[i] = d / nrm if nrm > 1e-12 else d

    # Seed the first normal perpendicular to T[0]
    aux = np.array([0.0, 0.0, 1.0])
    if abs(T[0] @ aux) > 0.9:
        aux = np.array([1.0, 0.0, 0.0])
    N0 = np.cross(T[0], aux)
    N0 /= np.linalg.norm(N0)

    # Rodrigues parallel transport along the curve
    N = np.empty_like(curve)
    N[0] = N0
    for i in range(1, n):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        cos_a = float(np.clip(T[i - 1] @ T[i], -1.0, 1.0))
        if sin_a < 1e-10:
            N[i] = N[i - 1]
        else:
            axis /= sin_a
            Ni = N[i - 1]
            N[i] = (cos_a * Ni
                    + sin_a * np.cross(axis, Ni)
                    + (1.0 - cos_a) * (axis @ Ni) * axis)
            nrm = np.linalg.norm(N[i])
            if nrm > 1e-12:
                N[i] /= nrm

    # Holonomy correction: redistribute accumulated twist uniformly
    Nf = N[-1]
    gamma = math.atan2(float(Nf @ np.cross(T[0], N[0])), float(Nf @ N[0]))
    for i in range(n):
        ang = gamma * i / n
        ca, sa = math.cos(ang), math.sin(ang)
        Ti, Ni = T[i], N[i]
        N[i] = ca * Ni + sa * np.cross(Ti, Ni)

    # Binormals
    B = np.array([np.cross(T[i], N[i]) for i in range(n)])

    # Vertex rings: broadcast (n, 1, 3) + radius * cos·N + radius * sin·B
    ang_c = np.linspace(0.0, 2.0 * math.pi, n_sides, endpoint=False)
    cos_c, sin_c = np.cos(ang_c), np.sin(ang_c)

    verts = (curve[:, None, :]
             + radius * cos_c[None, :, None] * N[:, None, :]
             + radius * sin_c[None, :, None] * B[:, None, :])

    # Quads: (i,j) → (i·ns+j, i·ns+j+1, (i+1)%n·ns+j+1, (i+1)%n·ns+j)
    ns = n_sides
    quads = []
    for i in range(n):
        ni = (i + 1) % n
        for j in range(ns):
            nj = (j + 1) % ns
            quads.append((i * ns + j, i * ns + nj, ni * ns + nj, ni * ns + j))

    return verts.reshape(-1, 3), np.array(quads, dtype=np.int32)


# ── ASSEMBLY ───────────────────────────────────────────────────────────────────

def build_all_tubes(thetas, phis, tube_r):
    """Build the joined tube mesh for all N_FIBERS fibres."""
    all_v, all_q, all_col = [], [], []
    v_offset = 0
    for k in range(len(thetas)):
        th, ph = float(thetas[k]), float(phis[k])
        # Colour: south-pole (θ=π) → Cobalt, north-pole (θ=0) → Amber
        t = 1.0 - th / math.pi                    # 0=south  1=north
        col = tuple(COL_COBALT[i] * (1-t) + COL_AMBER[i] * t for i in range(4))

        pts        = hopf_fiber_R3(th, ph, N_FIBER_STEPS)
        verts, qds = bishop_tube(pts, tube_r, N_TUBE_SIDES)
        all_v.append(verts)
        all_q.append(qds + v_offset)
        all_col.extend([col] * len(verts))
        v_offset += len(verts)

    return (np.concatenate(all_v),
            np.concatenate(all_q),
            all_col)


# ── MAIN ───────────────────────────────────────────────────────────────────────

def main():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    thetas, phis = fibonacci_sphere(N_FIBERS)

    # ── Basis mesh ─────────────────────────────────────────────────────────────
    vb, qb, colb = build_all_tubes(thetas, phis, TUBE_R)

    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(vb.tolist(), [], qb.tolist())
    me.update()

    attr = me.attributes.new(ATTR_NAME, 'FLOAT_COLOR', 'POINT')
    attr.data.foreach_set("color", np.array(colb, dtype=np.float32).ravel())

    # ── Object + scale to POI_R ────────────────────────────────────────────────
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)

    # 95th-percentile radius keeps the dense inner cluster visible
    radii  = np.linalg.norm(vb, axis=1)
    max_r  = float(np.percentile(radii, 95))
    if max_r > 1e-6:
        scale = POI_R / max_r
        ob.scale = (scale, scale, scale)
        bpy.ops.object.transform_apply(scale=True)
        vb = vb * scale   # keep in sync for shape-key computation

    # ── Shape keys ─────────────────────────────────────────────────────────────
    ob.shape_key_add(name="Basis", from_mix=False)

    # SK_Clifford: all base points on S² equator (θ=π/2).
    # These project onto the CLIFFORD TORUS — the unique flat embedded torus
    # in S³ — shown as a ring of interlocked unit circles in ℝ³.
    th_clf = np.full(N_FIBERS, math.pi / 2.0)
    v_clf, _, _ = build_all_tubes(th_clf, phis, TUBE_R)
    v_clf = v_clf * scale
    sk = ob.shape_key_add(name="SK_Clifford", from_mix=False)
    sk.data.foreach_set("co", v_clf.astype(np.float32).ravel())

    # SK_SouthHeavy: base points in southern hemisphere (θ ∈ [0.55π, 0.92π]).
    # Fibres project to small, bounded circles near ℝ³ origin.
    th_s = np.linspace(0.55 * math.pi, 0.92 * math.pi, N_FIBERS)
    v_s, _, _ = build_all_tubes(th_s, phis, TUBE_R)
    v_s = v_s * scale
    sk2 = ob.shape_key_add(name="SK_SouthHeavy", from_mix=False)
    sk2.data.foreach_set("co", v_s.astype(np.float32).ravel())

    # SK_NorthHeavy: base points in northern hemisphere (θ ∈ [0.08π, 0.45π]).
    # Fibres project to large circles, spreading toward ℝ³ infinity.
    th_n = np.linspace(0.08 * math.pi, 0.45 * math.pi, N_FIBERS)
    v_n, _, _ = build_all_tubes(th_n, phis, TUBE_R)
    v_n = v_n * scale
    sk3 = ob.shape_key_add(name="SK_NorthHeavy", from_mix=False)
    sk3.data.foreach_set("co", v_n.astype(np.float32).ravel())

    # SK_Taut: same distribution as Basis but tube radius halved.
    # Shows the topological linking structure without visual thickness.
    v_t, _, _ = build_all_tubes(thetas, phis, TUBE_R * 0.5)
    v_t = v_t * scale
    sk4 = ob.shape_key_add(name="SK_Taut", from_mix=False)
    sk4.data.foreach_set("co", v_t.astype(np.float32).ravel())

    # ── Material ───────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new("Hopf_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    atr  = nt.nodes.new("ShaderNodeAttribute")
    atr.attribute_name = ATTR_NAME
    atr.attribute_type = "GEOMETRY"
    bsdf.inputs["Metallic"].default_value        = 0.40
    bsdf.inputs["Roughness"].default_value       = 0.28
    bsdf.inputs["Emission Strength"].default_value = 2.0
    nt.links.new(atr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(atr.outputs["Color"], bsdf.inputs["Emission Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    ob.data.materials.append(mat)

    # ── holoflow metadata ──────────────────────────────────────────────────────
    ob["holoflow:facet"]    = True
    ob["holoflow:category"] = "poi-head"
    ob["holoflow:topic"]    = "hopf-fibration"
    ob["holoflow:fibers"]   = N_FIBERS

    # ── +Y-up export ───────────────────────────────────────────────────────────
    ob.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    bpy.ops.object.transform_apply(rotation=True)

    bpy.ops.export_scene.gltf(
        filepath="//hf_hopf_poi.glb",
        use_selection=False,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_colors=True,
        export_morph=True,
        export_yup=True,
    )
    print("[HopfFibration] Done — hf_hopf_poi.glb written.")


if __name__ == "__main__":
    main()
