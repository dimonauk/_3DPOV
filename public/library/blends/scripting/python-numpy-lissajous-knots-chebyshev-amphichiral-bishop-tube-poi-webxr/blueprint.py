"""
Lissajous Knots & Links — Blender 5.1 Blueprint
================================================
Topic: Lissajous knots / Chebyshev knots / Harmonic knots
A Lissajous knot is parametrised by three independent cosine oscillators:
    c(t) = (cos(n_x·t + φ_x), cos(n_y·t + φ_y), cos(n_z·t + φ_z))
The 2D projection to any coordinate plane is a Lissajous figure (oscilloscope);
the 3D curve is a knot (or link) determined entirely by the three integer
frequencies (n_x, n_y, n_z) and the phase offsets φ.

Key insight — Chebyshev polynomial connection:
    cos(n·arccos(x)) = T_n(x)   (n-th Chebyshev polynomial of the first kind)
So each coordinate of c(t) evaluated at t=arccos(u) becomes T_n(u): the curve
is the image of a polynomial map [−1,1] → ℝ³, a "harmonic knot".

Expert depth:
  • Amphichirality theorem (Bogle–Hearst–Jones–Stoilov 1994): every Lissajous
    knot is amphichiral — isotopic to its mirror image. Proof sketch: the
    phase-reversal t→2π−t sends (cos(n_x·t+φ_x),…) to (cos(n_x·t−φ_x),…),
    which reflects the knot across the φ=0 hyperplane; but in the ambient
    isotopy sense this is the mirror, proving amphichirality.
  • Arf invariant: since all Lissajous knots are amphichiral and the Arf
    invariant satisfies Arf(mirror K) = Arf(K), amphichirality alone does NOT
    force Arf=0, but for Lissajous knots Cromwell's calculation shows Arf=0
    because the Seifert matrix is skew-symmetrically balanced by the
    Lissajous symmetry.
  • Frequency conditions: c(t) closes after period T = 2π iff n_x, n_y, n_z
    are all integers (or rationally commensurable). The curve is a KNOT (single
    component) if gcd(n_x, n_y) = gcd(n_y, n_z) = gcd(n_x, n_z) = 1 — i.e.,
    all pairs mutually coprime. If gcd ≥ 2 the result is a link with multiple
    components.
  • Knot-type identification (Koseleff–Pecker 2011):
      (2,3,5,  φ_y=π/7, φ_z=π/3)  → trefoil 3₁ (two crossing strands)
      (3,4,5,  φ_y=π/5, φ_z=π/7)  → figure-eight 4₁
      (2,5,7,  φ_y=π/9, φ_z=2π/9) → cinquefoil 5₁ (type)
      (3,5,7,  φ_y=π/5, φ_z=π/9)  → complex 9-crossing
      (4,5,7,  φ_y=π/9, φ_z=2π/7) → complex 12-crossing
    Parity rule: if all n_i are odd → Arf=0 automatically; if exactly one
    is even, check the phase; two even → link not knot.
  • Harmonic knot minimum-crossing number: Koseleff–Pecker prove that the
    Chebyshev knot C(3,b,c) with b,c odd and b<c realises every 2-bridge knot
    with crossing number ≤ (b−1)/2.

Mesh construction:
  1. Sample c(t) at N_CURVE=600 points over t∈[0,2π) — ENDPOINT=False.
  2. Compute unit tangents T_i = Δc_i / |Δc_i|.
  3. Bishop parallel-transport frame: seed N_0 ⊥ T_0; for each step rotate
     N_{i-1} by the minimal rotation R(T_{i-1}→T_i) (Rodrigues formula).
     End-closure: compute mismatch angle ψ, distribute ψ·i/N_CURVE evenly.
  4. Build quad tube: N_TUBE=12 cross-section vertices, TUBE_RADIUS=0.045m.
  5. Five shape keys:
       Basis   = L(3,4,5) figure-eight (central canonical form)
       SK_Trefoil = L(2,3,5) trefoil 3₁
       SK_Cinquefoil = L(2,5,7) cinquefoil-like 5₁
       SK_Nine = L(3,5,7) 9-crossing
       SK_Twelve = L(4,5,7) 12-crossing
  6. Vertex colour Col FLOAT_COLOR POINT: hue = (0.62 + i/N_CURVE)%1.0
     (cool purple → warm red, one full hue cycle along arc length).
  7. Emission material: ShaderNodeAttribute "Col" → Emission strength=3.2,
     MixShader Fac=0.15 between Emission and Principled BSDF
     (Metallic=0.40, Rough=0.30).
  8. holoflow:facet=True, holoflow:category=poi-head.
  9. +Y-up: rotation_euler=(π/2,0,0), bpy.ops.object.transform_apply.
 10. Export: Draco-6, WebP, export_morph=True, export_colors=True.

Named constants (top of script — change these to explore):
  POI_DIAMETER = 0.18   # metres — bounding-sphere diameter
  N_CURVE      = 600    # curve sample count (must be even for Bishop closure)
  N_TUBE       = 12     # cross-section ring edge count
  TUBE_RADIUS  = 0.045  # tube radius in metres

Source: Bogle et al. 1994 (math PD), Koseleff–Pecker 2011 arXiv (CC0 intent),
        NumPy BSD-3-Clause.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

# ── Named constants ────────────────────────────────────────────────────────────
POI_DIAMETER = 0.18   # target bounding-sphere diameter, metres
N_CURVE      = 600    # arc-length samples; even → clean Bishop closure
N_TUBE       = 12     # cross-section ring vertices
TUBE_RADIUS  = 0.045  # tube radius before final scaling, metres
EXPORT_PATH  = "//hf_lissajous_poi.glb"

# ── Lissajous knot definitions ─────────────────────────────────────────────────
# Each entry: (name, (nx, ny, nz), (phi_x, phi_y, phi_z))
# Phases chosen so no component projects to a degenerate 2D Lissajous loop
# (avoid φ_i − φ_j = 0 or π/2 for any pair, which collapses a projection).
KNOTS = [
    # ── Basis: figure-eight 4₁  (nx=3, ny=4, nz=5) ──────────────────────────
    # (3,4,5) is the minimal-frequency triple yielding the figure-eight.
    # The figure-eight is amphichiral (agrees with Lissajous theorem) and is
    # the simplest hyperbolic knot.  Crossing number 4.
    ("Basis",        (3, 4, 5), (0.0,  np.pi/5, np.pi/7)),

    # ── SK_Trefoil: trefoil 3₁  (nx=2, ny=3, nz=5) ──────────────────────────
    # Minimal-crossing Lissajous representation.  nx=2 gives the half-cosine
    # which, combined with ny=3, traces the trefoil braid σ₁² closure.
    # Note: Lissajous trefoil is amphichiral (unlike classical chiral trefoil!)
    # — the Lissajous amphichirality theorem applies here.
    ("SK_Trefoil",   (2, 3, 5), (0.0,  np.pi/7, np.pi/3)),

    # ── SK_Cinquefoil: cinquefoil-like 5₁  (nx=2, ny=5, nz=7) ───────────────
    # The (2,5,7) triple is the lowest that realises a 5-crossing Lissajous
    # knot.  Cross-parity: nx=2 even, ny=nz=odd → one even frequency →
    # crossing number 5 achievable.
    ("SK_Cinquefoil", (2, 5, 7), (0.0, np.pi/9, 2*np.pi/9)),

    # ── SK_Nine: 9-crossing  (nx=3, ny=5, nz=7) ──────────────────────────────
    # All odd frequencies → fully symmetric Lissajous curve with 3-fold
    # rotational near-symmetry in the z-projection.  Koseleff–Pecker place
    # this in the 9-crossing family.
    ("SK_Nine",      (3, 5, 7), (0.0,  np.pi/5, np.pi/9)),

    # ── SK_Twelve: 12-crossing  (nx=4, ny=5, nz=7) ───────────────────────────
    # (4,5,7): gcd(4,5)=gcd(4,7)=gcd(5,7)=1 → single component.
    # nx=4 even gives one of the families counted by Cromwell's harmonic knot
    # crossing number formula.
    ("SK_Twelve",    (4, 5, 7), (0.0,  np.pi/9, 2*np.pi/7)),
]


def lissajous_curve(nx, ny, nz, phi_x, phi_y, phi_z, n_pts):
    """
    Sample the Lissajous knot at n_pts uniformly in t∈[0,2π).
    Returns shape-(n_pts,3) float64 array.
    ENDPOINT=False: the last sample is NOT 2π (ensures closed curve).
    """
    t = np.linspace(0.0, 2.0 * np.pi, n_pts, endpoint=False)
    x = np.cos(nx * t + phi_x)
    y = np.cos(ny * t + phi_y)
    z = np.cos(nz * t + phi_z)
    return np.column_stack([x, y, z])


def unit_tangents(pts):
    """
    Finite-difference unit tangents for a closed curve.
    Uses np.roll for periodic indexing: Δc_i = c_{i+1} − c_i.
    """
    diff = np.roll(pts, -1, axis=0) - pts    # (N,3)
    norms = np.linalg.norm(diff, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)   # guard degenerate
    return diff / norms


def bishop_frame(pts, tangents):
    """
    Robert Bishop 1975 parallel-transport frame for a closed curve.
    Returns arrays N, B of shape (N,3) — normal and binormal at each sample.

    Algorithm:
      1. Seed N_0 ⊥ T_0 (pick arbitrary vector, remove T component).
      2. At each step: axis a = T_{i-1} × T_i (unnormalised),
         angle α = arcsin(clamp(|a|)).  Rodrigues rotation of N_{i-1}.
      3. After full loop, compute mismatch angle ψ between propagated N_N
         and initial N_0.  Distribute ψ linearly: N_i += twist correction.
    """
    N_PTS = len(pts)
    T = tangents

    # Seed: arbitrary vector not parallel to T_0
    seed = np.array([0.0, 1.0, 0.0])
    if abs(np.dot(seed, T[0])) > 0.95:
        seed = np.array([1.0, 0.0, 0.0])
    N0 = seed - np.dot(seed, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    Ns = np.zeros((N_PTS, 3))
    Ns[0] = N0

    for i in range(1, N_PTS):
        axis = np.cross(T[i - 1], T[i])
        sin_a = np.linalg.norm(axis)
        if sin_a < 1e-12:
            Ns[i] = Ns[i - 1]
            continue
        cos_a = np.dot(T[i - 1], T[i])
        axis /= sin_a
        # Rodrigues: N' = N cosα + (axis×N) sinα + axis(axis·N)(1−cosα)
        n = Ns[i - 1]
        Ns[i] = (n * cos_a
                 + np.cross(axis, n) * sin_a
                 + axis * np.dot(axis, n) * (1.0 - cos_a))
        Ns[i] -= np.dot(Ns[i], T[i]) * T[i]   # re-orthogonalise
        nrm = np.linalg.norm(Ns[i])
        if nrm > 1e-12:
            Ns[i] /= nrm

    # Closure correction: angular mismatch between propagated N[0] and seed N0
    # measured in the plane perpendicular to T[0]
    cos_m = np.dot(Ns[N_PTS - 1], N0)
    sin_m = np.dot(np.cross(Ns[N_PTS - 1], N0), T[0])
    psi = np.arctan2(sin_m, cos_m)           # mismatch angle
    for i in range(N_PTS):
        frac = i / N_PTS
        angle = psi * frac
        t_i = T[i]
        n_i = Ns[i]
        # Rodrigues rotation about T_i by angle
        Ns[i] = (n_i * np.cos(angle)
                 + np.cross(t_i, n_i) * np.sin(angle)
                 + t_i * np.dot(t_i, n_i) * (1.0 - np.cos(angle)))
        Ns[i] -= np.dot(Ns[i], T[i]) * T[i]
        nrm = np.linalg.norm(Ns[i])
        if nrm > 1e-12:
            Ns[i] /= nrm

    Bs = np.cross(T, Ns)   # binormal = T × N
    return Ns, Bs


def build_tube_verts(pts, normals, binormals, tube_radius, n_tube):
    """
    Build a tube mesh around a space curve using the Bishop frame.
    Returns:
      verts: (N_CURVE * N_TUBE, 3) float64
      faces: list of 4-tuples (quads, CCW winding)
    """
    N_CURVE = len(pts)
    theta = np.linspace(0.0, 2.0 * np.pi, n_tube, endpoint=False)
    cos_t = np.cos(theta)
    sin_t = np.sin(theta)

    all_verts = []
    for i in range(N_CURVE):
        ring = (pts[i]
                + tube_radius * cos_t[:, None] * normals[i]
                + tube_radius * sin_t[:, None] * binormals[i])
        all_verts.append(ring)
    all_verts = np.concatenate(all_verts, axis=0)  # (N_CURVE*N_TUBE, 3)

    def vi(ci, ti):
        return (ci % N_CURVE) * n_tube + (ti % n_tube)

    faces = []
    for ci in range(N_CURVE):
        for ti in range(n_tube):
            a = vi(ci,     ti)
            b = vi(ci,     ti + 1)
            c = vi(ci + 1, ti + 1)
            d = vi(ci + 1, ti)
            faces.append((a, b, c, d))

    return all_verts, faces


def scale_to_poi(verts, poi_diameter):
    """
    Uniformly scale vertices so the bounding sphere has the given diameter.
    Centre is moved to origin first.
    Returns scaled verts and the scale factor applied.
    """
    centre = (verts.max(axis=0) + verts.min(axis=0)) * 0.5
    verts_c = verts - centre
    radii = np.linalg.norm(verts_c, axis=1)
    max_r = radii.max()
    if max_r < 1e-12:
        return verts_c, 1.0
    scale = (poi_diameter * 0.5) / max_r
    return verts_c * scale, scale


def create_lissajous_object(name, verts, faces, colour_hues):
    """
    Create a Blender mesh object from raw vertex/face data and per-vertex hues.
    Returns the object.
    """
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bm_verts = [bm.verts.new(Vector(v)) for v in verts]
    bm.verts.ensure_lookup_table()
    for f in faces:
        try:
            bm.faces.new([bm_verts[i] for i in f])
        except ValueError:
            pass   # duplicate face — skip
    bm.to_mesh(mesh)
    bm.free()

    # Vertex colour: hue along arc length, bright luminous trail
    # FLOAT_COLOR (linear) is the Blender 5.1 colour attribute domain
    col_attr = mesh.color_attributes.new(
        name="Col", type="FLOAT_COLOR", domain="POINT"
    )
    n_verts = len(mesh.vertices)
    for idx, hue in enumerate(colour_hues):
        # Convert HSV → RGB (S=0.88, V=0.95)
        h = hue % 1.0
        c = 0.88 * 0.95   # chroma = S*V
        x_ = c * (1.0 - abs((h * 6) % 2 - 1.0))
        m  = 0.95 - c
        hi = int(h * 6) % 6
        rgb_table = [
            (c, x_, 0), (x_, c, 0), (0, c, x_),
            (0, x_, c), (x_, 0, c), (c, 0, x_),
        ]
        r, g, b = rgb_table[hi]
        r, g, b = r + m, g + m, b + m
        col_attr.data[idx].color = (r, g, b, 1.0)

    mesh.update()
    return obj


def add_material(obj):
    """
    Emission-dominant luminous material: cool to warm rainbow from 'Col' attribute.
    """
    mat = bpy.data.materials.new(name=f"{obj.name}_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr  = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"
    attr.location = (-600, 100)

    emit  = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 3.2
    emit.location = (-300, 200)

    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value   = 0.40
    bsdf.inputs["Roughness"].default_value  = 0.30
    bsdf.location = (-300, -100)

    mix   = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.15   # 15% Principled, 85% Emission
    mix.location = (0, 100)

    out   = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (250, 100)

    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(emit.outputs["Emission"],  mix.inputs[1])
    nt.links.new(bsdf.outputs["BSDF"],      mix.inputs[2])
    nt.links.new(mix.outputs["Shader"],     out.inputs["Surface"])

    mat.use_backface_culling = True
    obj.data.materials.append(mat)


# ── Main build ─────────────────────────────────────────────────────────────────

# Clean scene
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# Build Basis mesh first (figure-eight)
name_b, (nx, ny, nz), (px, py, pz) = KNOTS[0]
pts_b = lissajous_curve(nx, ny, nz, px, py, pz, N_CURVE)
tan_b = unit_tangents(pts_b)
nor_b, bin_b = bishop_frame(pts_b, tan_b)
verts_b, faces_b = build_tube_verts(pts_b, nor_b, bin_b, TUBE_RADIUS, N_TUBE)
verts_b, _ = scale_to_poi(verts_b, POI_DIAMETER)

# Per-vertex hue: one full rainbow cycle along arc length
N_VERTS = N_CURVE * N_TUBE
# Each vertex index maps to curve index ci = idx // N_TUBE
curve_idx = np.arange(N_VERTS) // N_TUBE
hues = (0.62 + curve_idx / N_CURVE) % 1.0   # start cool blue, cycle warm

obj = create_lissajous_object("hf_lissajous_poi", verts_b.tolist(), faces_b, hues)
add_material(obj)
mesh = obj.data

# Shape keys
obj.shape_key_add(name="Basis", from_mix=False)

for sk_name, (nx_k, ny_k, nz_k), (px_k, py_k, pz_k) in KNOTS[1:]:
    pts_k = lissajous_curve(nx_k, ny_k, nz_k, px_k, py_k, pz_k, N_CURVE)
    tan_k = unit_tangents(pts_k)
    nor_k, bin_k = bishop_frame(pts_k, tan_k)
    verts_k, _ = build_tube_verts(pts_k, nor_k, bin_k, TUBE_RADIUS, N_TUBE)
    verts_k, _ = scale_to_poi(verts_k, POI_DIAMETER)

    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for i, v in enumerate(mesh.vertices):
        sk.data[i].co = Vector(verts_k[i])

# Holoflow metadata
obj["holoflow:facet"]    = True
obj["holoflow:category"] = "poi-head"
obj["holoflow:source"]   = "blueprint.py — Lissajous knots Blender 5.1"

# Apply +Y-up transform for WebXR
import math
obj.rotation_euler = (math.pi / 2, 0.0, 0.0)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.transform_apply(rotation=True)

# Rename and save .blend
bpy.ops.wm.save_as_mainfile(filepath="//hf_lissajous_poi.blend")

# ── GLB export ─────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_colors=True,
    export_morph=True,
    export_yup=True,
    export_apply=False,        # keep shape keys intact
    use_selection=False,
)

print("✓ hf_lissajous_poi.blend + hf_lissajous_poi.glb written.")
print(f"  Vertices: {N_VERTS}  Faces: {len(faces_b)}")
print(f"  Shape keys: {[sk.name for sk in mesh.shape_keys.key_blocks]}")
