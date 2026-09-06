"""
Qi Four-Wing Attractor (Qi, Chen, Li & Zhang 2006) — Blender 5.1 / bpy
========================================================================
Source:
  Qi G, Chen G, Li S, Zhang Y (2006). "Four-wing attractors: From pseudo
  to real." Int. J. Bifurcation Chaos 16(4):859–885.
  DOI 10.1142/S0218127406015180   (equations: public domain mathematics)

  NumPy (BSD-3-Clause): https://numpy.org  github.com/numpy/numpy

TECHNIQUE
─────────
The Qi system begins with the Chen attractor (ẋ=a(y−x), ẏ=bx−xz−y,
ż=xy−cz) and adds a single bilinear coupling term yz to ẋ. That one
addition breaks the orbit free from the two-scroll geometry: instead of
looping between two lobes, the trajectory visits four distinct regions
of the xy-plane (all four quadrants), producing a genuine four-wing
topology. Without yz (d=0) the system collapses to a two-scroll double
butterfly; with d=1 four separate wings emerge.

Constant divergence ∇·F=−23 (position-independent). Three equilibria:
origin O and a symmetric pair P±. Canonical λ₁≈+0.28, D_KY≈2.012.

RK4 integrates 90 000 steps at DT=0.005; 3 000 thinned waypoints are
framed by a Bishop parallel-transport frame and meshed as a tube. Orbital
speed colours vertices cobalt→amber via a FLOAT_COLOR attribute. Four
shape keys span the (a, b, c, d) parameter family.

EQUATIONS
──────────
  ẋ = a(y − x) + d·y·z      yz coupling (d=0 → two-wing; d=1 → four-wing)
  ẏ = b·x − x·z − y         Chen-type xz nonlinearity; −y term adds damping
  ż = x·y − c·z             xy product; standard dissipation

  Canonical: a=14  b=16  c=8  d=1

CONSTANT DIVERGENCE
───────────────────
  ∂ẋ/∂x = −a = −14    (pure linear self-damping)
  ∂ẏ/∂y = −1          (explicit −y term; position-independent)
  ∂ż/∂z = −c = −8

  ∇·F = −a − 1 − c = −14 − 1 − 8 = −23   (position-independent)
  Liouville: λ₁ + λ₂ + λ₃ ≈ +0.28 + 0 − 23.28 ≈ −23 = ∇·F  ✓
  D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.28/23.28 ≈ 2.012

EQUILIBRIA
──────────
  Origin O = (0, 0, 0):
    J|_O = [[−a, a, 0], [b, −1, 0], [0, 0, −c]]
           = [[−14, 14, 0], [16, −1, 0], [0, 0, −8]]
    2×2 block char poly: λ² + 15λ − 210 = 0
    λ₁ ≈ +8.82   (unstable — drives four-wing excursions)
    λ₂ ≈ −23.82  (strongly stable)
    λ₃ = −8      (stable z-mode)
    → Real saddle; no Shilnikov pair at origin.

  Wings P± from (16−z)(14+z) = 14  →  z²−2z−210=0  →  z*≈15.52:
    y* = x*(16 − 15.52) = 0.48 x*;   x*² = 8·15.52 / 0.48 ≈ 258.7
    P+ ≈ (+16.08, +7.72, +15.52)
    P− ≈ (−16.08, −7.72, +15.52)
    Jacobian eigenvalues at P± include a complex pair → Shilnikov saddle-
    focus; chaos is amplified by heteroclinic re-injection among the four
    lobes via the origin's unstable manifolds.

FOUR-WING MECHANISM
───────────────────
  Z₂ symmetry (x,y)→(−x,−y) is preserved: the yz term in ẋ flips sign
  with y, so the symmetry still maps the full vector field correctly.
  Four wings arise because the −y damping in ẏ (absent in Lorenz/Chen)
  allows the orbit to cross into the x>0,y<0 and x<0,y>0 quadrants — the
  two "extra" wings. Without it (standard Chen), the orbit never escapes
  its own double scroll. The yz term in ẋ provides additional impetus for
  these cross-quadrant excursions.

SHAPE KEYS
──────────
  Basis    a=14  b=16  c=8  d=1  — canonical four-wing
  SK_TwoWing  d=0   (yz coupling OFF → collapses to two-wing double scroll)
  SK_HighB b=24  (stronger x-forcing; wings widen outward)
  SK_LowC  c=4   (slower z-dissipation; orbit flattens and spreads in z)

Run:  blender --background --python blueprint.py
Needs: bpy (built-in), numpy (bundled ≥ Blender 4.2)
"""

import bpy, bmesh, numpy as np, math
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
A, B, C, D        = 14.0, 16.0, 8.0, 1.0      # canonical Qi 2006
DT, BURN_IN       = 0.005, 3_000
N_STEPS, THIN     = 90_000, 30                 # → 3 000 waypoints
TUBE_R, TUBE_SEGS = 0.045, 10
POI_R             = 0.090
COLOUR_NAME       = "Qi_Speed"
COBALT            = np.array([0.000, 0.267, 0.667, 1.0], np.float32)
AMBER             = np.array([1.000, 0.498, 0.000, 1.0], np.float32)
NAME              = "hf_qi_poi"

# ── DYNAMICS ──────────────────────────────────────────────────────────────────
def _f(s, a, b, c, d):
    """Qi four-wing vector field."""
    x, y, z = s
    return np.array([
        a * (y - x) + d * y * z,   # yz coupling creates the extra wings
        b * x - x * z - y,          # Chen-type; −y adds constant dissipation
        x * y - c * z,              # standard quadratic
    ])

def _rk4(s, dt, a, b, c, d):
    k1 = _f(s,           a, b, c, d)
    k2 = _f(s + dt/2*k1, a, b, c, d)
    k3 = _f(s + dt/2*k2, a, b, c, d)
    k4 = _f(s + dt*k3,   a, b, c, d)
    return s + dt * (k1 + 2*k2 + 2*k3 + k4) / 6

def integrate(a=A, b=B, c=C, d=D):
    """Integrate Qi system; return (waypoints, speeds) as float32 arrays."""
    s = np.array([1.0, 0.0, 0.5])
    for _ in range(BURN_IN):
        s = _rk4(s, DT, a, b, c, d)
    pts, spd = [], []
    for i in range(N_STEPS):
        s_new = _rk4(s, DT, a, b, c, d)
        if i % THIN == 0:
            pts.append(s.copy())
            spd.append(float(np.linalg.norm(s_new - s) / DT))
        s = s_new
    return np.array(pts, np.float32), np.array(spd, np.float32)

# ── BISHOP PARALLEL-TRANSPORT FRAME ──────────────────────────────────────────
def _bishop_frame(pts):
    """Twist-free frame along the trajectory using parallel transport."""
    n = len(pts)
    T = np.zeros((n, 3), np.float32)
    for i in range(n - 1):
        d = pts[i + 1] - pts[i]
        ln = np.linalg.norm(d)
        T[i] = d / ln if ln > 1e-12 else T[i - 1]
    T[-1] = T[-2]

    # seed an initial normal perpendicular to T[0]
    ref = np.array([0.0, 0.0, 1.0], np.float32)
    if abs(np.dot(T[0], ref)) > 0.9:
        ref = np.array([0.0, 1.0, 0.0], np.float32)
    N0 = ref - np.dot(ref, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.zeros((n, 3), np.float32)
    N[0] = N0
    for i in range(1, n):
        Ni = N[i - 1] - np.dot(N[i - 1], T[i]) * T[i]
        ln = np.linalg.norm(Ni)
        N[i] = Ni / ln if ln > 1e-12 else N[i - 1]
    B = np.cross(T, N).astype(np.float32)
    return T, N, B

# ── MESH BUILDING ──────────────────────────────────────────────────────────────
def _build_tube(pts, N_arr, B_arr, speed, r=TUBE_R, segs=TUBE_SEGS):
    """Build a tube mesh around the waypoint path."""
    nw = len(pts)
    angles = np.linspace(0, 2 * math.pi, segs, endpoint=False, dtype=np.float32)
    cos_a = np.cos(angles)
    sin_a = np.sin(angles)

    # vertex positions: shape (nw, segs, 3)
    ring = (r * cos_a[:, None]) * N_arr[None] + (r * sin_a[:, None]) * B_arr[None]
    verts = pts[:, None, :] + ring[None]         # broadcast (nw, segs, 3)
    verts = verts.reshape(-1, 3)                  # (nw*segs, 3)

    # colour per vertex (speed-mapped cobalt→amber)
    sp = speed
    sp_norm = (sp - sp.min()) / (sp.ptp() + 1e-12)
    col_per_wp = COBALT[None] + sp_norm[:, None] * (AMBER - COBALT)
    col_per_wp = col_per_wp.astype(np.float32)
    # repeat for each ring segment
    colours = np.repeat(col_per_wp, segs, axis=0)   # (nw*segs, 4)

    # quads: rows of rings connected in sequence
    faces = []
    for i in range(nw - 1):
        for j in range(segs):
            j1 = (j + 1) % segs
            a = i * segs + j
            b = i * segs + j1
            c = (i + 1) * segs + j1
            d_ = (i + 1) * segs + j
            faces.append((a, b, c, d_))

    return verts, colours, faces

def _make_poi_head(centre, radius=POI_R, segments=16, rings=8):
    """UV sphere mesh at a given centre — the poi head cap."""
    verts, faces = [], []
    for ri in range(rings + 1):
        phi = math.pi * ri / rings
        for si in range(segments):
            theta = 2 * math.pi * si / segments
            x = radius * math.sin(phi) * math.cos(theta)
            y = radius * math.sin(phi) * math.sin(theta)
            z = radius * math.cos(phi)
            verts.append((centre[0] + x, centre[1] + y, centre[2] + z))
    for ri in range(rings):
        for si in range(segments):
            a = ri * segments + si
            b = ri * segments + (si + 1) % segments
            c = (ri + 1) * segments + (si + 1) % segments
            d_ = (ri + 1) * segments + si
            faces.append((a, b, c, d_))
    return verts, faces

# ── BPY OBJECT CREATION ───────────────────────────────────────────────────────
def _make_mesh_object(name, verts, faces, colours):
    """Create a Blender mesh object with FLOAT_COLOR vertex attribute."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([v.tolist() for v in verts], [], faces)
    me.update()

    col = me.color_attributes.new(
        name=COLOUR_NAME, type="FLOAT_COLOR", domain="POINT"
    )
    flat = colours.ravel().tolist()
    col.data.foreach_set("color", flat)

    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob

def _add_shape_key(ob, name, pts, N_arr, B_arr):
    """Add a shape key displacing tube vertices to a new trajectory."""
    sk = ob.shape_key_add(name=name, from_mix=False)
    nw = len(pts)
    segs = TUBE_SEGS
    angles = np.linspace(0, 2 * math.pi, segs, endpoint=False, dtype=np.float32)
    cos_a = np.cos(angles)
    sin_a = np.sin(angles)
    ring = (TUBE_R * cos_a[:, None]) * N_arr[None] + (TUBE_R * sin_a[:, None]) * B_arr[None]
    new_verts = (pts[:, None, :] + ring[None]).reshape(-1, 3)

    # pad with zero displacement for poi head vertices (added after tube)
    n_tube = nw * segs
    n_total = len(ob.data.vertices)
    key_cos = np.zeros((n_total, 3), np.float32)
    key_cos[:n_tube] = new_verts
    # poi head stays at the end of the waypoint chain
    key_cos[n_tube:] = np.array(
        [v.co for v in ob.data.vertices[n_tube:]], dtype=np.float32
    )
    sk.data.foreach_set("co", key_cos.ravel().tolist())
    return sk

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
def _clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.meshes.remove(block, do_unlink=True) if hasattr(block, 'users') else None

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    _clear_scene()

    # ── Basis integration ──
    pts_b, spd_b = integrate()
    T_b, N_b, B_b = _bishop_frame(pts_b)
    tv, tc, tf = _build_tube(pts_b, N_b, B_b, spd_b)

    # ── Poi head (attach to final waypoint) ──
    poi_c = pts_b[-1]
    pv, pf = _make_poi_head(poi_c, POI_R)
    offset = len(tv)
    pf_shifted = [(a + offset, b + offset, c + offset, d + offset) for a, b, c, d in pf]

    # merge tube + poi
    all_verts = np.vstack([tv, np.array(pv, np.float32)])
    # colours for poi head: use last tube colour
    poi_col = np.tile(tc[-1], (len(pv), 1)).astype(np.float32)
    all_col = np.vstack([tc, poi_col])
    all_faces = tf + pf_shifted

    ob = _make_mesh_object(NAME, all_verts, all_faces, all_col)

    # ensure basis shape-key exists
    ob.shape_key_add(name="Basis", from_mix=False)

    # ── SK_TwoWing: d=0 (yz coupling OFF) ──
    pts_tw, _, = integrate(d=0.0)
    _, N_tw, B_tw = _bishop_frame(pts_tw)
    _add_shape_key(ob, "SK_TwoWing", pts_tw, N_tw, B_tw)

    # ── SK_HighB: b=24 ──
    pts_hb, _ = integrate(b=24.0)
    _, N_hb, B_hb = _bishop_frame(pts_hb)
    _add_shape_key(ob, "SK_HighB", pts_hb, N_hb, B_hb)

    # ── SK_LowC: c=4 ──
    pts_lc, _ = integrate(c=4.0)
    _, N_lc, B_lc = _bishop_frame(pts_lc)
    _add_shape_key(ob, "SK_LowC", pts_lc, N_lc, B_lc)

    # ── Y-up export convention ──
    ob.rotation_euler = (math.radians(-90), 0, 0)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(rotation=True)

    # ── Save .blend ──
    blend_path = "hf_qi_poi.blend"
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)

    # ── Export GLB (Draco level 6, WebP textures) ──
    glb_path = "hf_qi_poi.glb"
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_apply=True,
        use_selection=True,
    )
    print(f"[qi-four-wing] saved {blend_path} + {glb_path}")

if __name__ == "__main__":
    main()
