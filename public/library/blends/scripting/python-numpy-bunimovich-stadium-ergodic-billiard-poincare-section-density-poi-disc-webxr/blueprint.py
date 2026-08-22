"""
Bunimovich Stadium Ergodic Billiard — Birkhoff Coordinates (s, p),
Poincaré Section Density: Integrable Circle (ordered rings) vs Chaotic Stadium
(uniform ergodic fill), Positive Lyapunov Exponent λ > 0,
Height-Field Poi Disc for WebXR · Blender 5.1 · Holoflow Studio · CC0
════════════════════════════════════════════════════════════════════════

Domain: rectangle [−L, L]×[−1,1] ∪ two semicircular end-caps of radius 1.
L. A. Bunimovich (1979) proved this domain is ergodic and mixing for L > 0:
  p  = sin θ at each bounce is NOT conserved → the Poincaré section (s, p)
  fills [0,1]² uniformly (ergodicity ≡ flat density).

Compare with the INTEGRABLE CIRCULAR BILLIARD (L = 0):
  SO(2) symmetry conserves p = sin θ → each orbit lives on the invariant
  horizontal line {p = p₀} → concentric rings of density spikes.

Birkhoff coordinates: s = arc-length/S_total ∈ [0,1), p = sin(θ) ∈ (0,1).
The invariant measure is ds dp — it is FLAT, so p = sin θ rather than θ.

The tutorial maps (s_norm, p) → a polar disc:
  φ = s_norm · 2π  (arc-length → azimuth)
  r = p · DISC_R   (reflection angle → radius)
Height = visit-density in each (s, p) bin:
  Stadium → nearly flat (ergodic); Circle → ring spikes (integrable).

Shape key SK_Circle stores the ring-spike height field so the artist can
morph between order and chaos in the Timeline (value 0 = chaos, 1 = rings).

Colour: cobalt (sparse) → white → amber (dense), following Holoflow curvature
palette convention used throughout the scripting library.

Sources:
  Bunimovich L. A. (1979) Comm. Math. Phys. 65:295–312 [Academic, free to cite]
  Birkhoff G. D. (1927) Dynamical Systems. AMS. [Public Domain by age]
  See also Cvitanović et al., ChaosBook.org (creative-commons licence)

Studio Conventions: DISC_R = 0.100 m, holoflow:facet=True, +Y up, Draco-6, WebP.
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── Named constants ──────────────────────────────────────────────────────────
L        = 1.20    # half-length of flat walls; S_TOT = 4L + 2π ≈ 11.08
S_TOT    = 4*L + 2*math.pi
N_TRAJ   = 14      # independent stadium orbits
N_ITER   = 3500    # reflections per orbit (large → smoother ergodic fill)
N_BINS   = 60      # histogram bins per Birkhoff axis
N_R      = 26      # radial rings in disc mesh
N_PHI    = 56      # angular sectors
DISC_R   = 0.100   # outer radius (m)
H_SCALE  = 0.018   # max height at density peak (m)
RNG_SEED = 2079
NAME     = "hf_bunimovich_poi"

# ── Billiard helpers ─────────────────────────────────────────────────────────
def _t_seg(px, py, dx, dy, ax, ay, bx, by):
    ex, ey = bx-ax, by-ay
    det = dx*ey - dy*ex
    if abs(det) < 1e-12: return math.inf
    ox, oy = ax-px, ay-py
    t = (ox*ey - oy*ex) / det
    s = (ox*dy - oy*dx) / det
    return t if t > 1e-9 and -1e-9 <= s <= 1+1e-9 else math.inf

def _t_circ(px, py, dx, dy, cx, cy):
    ox, oy = px-cx, py-cy
    b = 2*(ox*dx + oy*dy)
    c = ox*ox + oy*oy - 1.0    # radius=1
    disc = b*b - 4*c
    if disc < 0: return math.inf
    sq = math.sqrt(disc)
    t0, t1 = (-b-sq)*0.5, (-b+sq)*0.5
    if t0 > 1e-9: return t0
    if t1 > 1e-9: return t1
    return math.inf

def _arc(x, y):
    """Normalised arc-length s/S_TOT ∈ [0,1), CCW from (−L, −1)."""
    if y < -0.98 and -L <= x <= L:
        return (x + L) / S_TOT
    if x > L - 0.02:
        return (2*L + math.atan2(y, x-L) + math.pi*0.5) / S_TOT
    if y > 0.98 and -L <= x <= L:
        return (2*L + math.pi + L - x) / S_TOT
    α = math.atan2(y, x+L)
    if α < 0: α += 2*math.pi
    return (4*L + math.pi*0.5 + α) / S_TOT

def _step(x, y, vx, vy):
    """One stadium bounce. Returns (x', y', vx', vy', s_norm, p)."""
    tb = _t_seg(x,y,vx,vy, -L,-1,  L,-1)   # bottom wall
    tt = _t_seg(x,y,vx,vy,  L,+1, -L,+1)   # top wall (right→left)
    tr = _t_circ(x,y,vx,vy,  L, 0)          # right cap
    tl = _t_circ(x,y,vx,vy, -L, 0)          # left cap
    t  = min(tb, tt, tr, tl)
    nx, ny = x + t*vx, y + t*vy
    if   t == tb: nx_n, ny_n = 0.0, -1.0
    elif t == tt: nx_n, ny_n = 0.0, +1.0
    elif t == tr:
        nx_n, ny_n = nx-L, ny; r = math.hypot(nx_n,ny_n); nx_n/=r; ny_n/=r
    else:
        nx_n, ny_n = nx+L, ny; r = math.hypot(nx_n,ny_n); nx_n/=r; ny_n/=r
    dot = vx*nx_n + vy*ny_n          # < 0 (incoming vs outward normal)
    nvx = vx - 2*dot*nx_n            # specular reflection
    nvy = vy - 2*dot*ny_n
    return nx, ny, nvx, nvy, _arc(nx, ny), -dot   # p = sin θ = −dot

# ── Simulation runs ──────────────────────────────────────────────────────────
def _stadium_pts():
    rng = np.random.default_rng(RNG_SEED)
    s_list, p_list = [], []
    for k in range(N_TRAJ):
        x = float(rng.uniform(-L+0.1, L-0.1))
        y = -1.0
        θ = float(rng.uniform(0.07*math.pi, 0.93*math.pi))
        vx = math.sin(θ) * (1 if k%2==0 else -1)
        vy = math.cos(θ)
        for _ in range(N_ITER):
            x, y, vx, vy, s, p = _step(x, y, vx, vy)
            s_list.append(s); p_list.append(p)
    return np.array(s_list), np.array(p_list)

def _circle_pts():
    """Periodic orbits of 9-, 7-, 5-, 4-, 3-gon inscribed in unit circle.
    WHY these angles: θ₀ = π/n gives an n-gon orbit; p₀ = sin(π/n) is fixed.
    The Poincaré section for each shows a single horizontal band → ring in disc.
    """
    s_list, p_list = [], []
    N_STEPS = 800
    for idx, n in enumerate([9, 7, 5, 4, 3]):
        θ0 = math.pi / n
        p0 = math.sin(θ0)
        φ  = idx * 0.37 * math.pi
        for _ in range(N_STEPS):
            s_norm = (φ % (2*math.pi)) / (2*math.pi)
            s_list.append(s_norm); p_list.append(p0)
            φ += 2*θ0
    return np.array(s_list), np.array(p_list)

def _density(s, p):
    h, _, _ = np.histogram2d(s, p, bins=N_BINS, range=[[0,1],[0,1]])
    mx = h.max()
    return h/mx if mx > 0 else h

# ── Blender mesh ──────────────────────────────────────────────────────────────
def _make_disc():
    me = bpy.data.meshes.new(NAME)
    bm = bmesh.new()
    c  = bm.verts.new(Vector((0,0,0)))
    rings = [[c]]
    for ri in range(N_R):
        r = (ri+1)/N_R * DISC_R
        row = [bm.verts.new(Vector((r*math.cos(j/N_PHI*2*math.pi),
                                    r*math.sin(j/N_PHI*2*math.pi), 0)))
               for j in range(N_PHI)]
        rings.append(row)
    inner = rings[1]
    for j in range(N_PHI):
        bm.faces.new([c, inner[j], inner[(j+1)%N_PHI]])
    for ri in range(1, N_R):
        a, b = rings[ri], rings[ri+1]
        for j in range(N_PHI):
            jn = (j+1)%N_PHI
            bm.faces.new([a[j], b[j], b[jn], a[jn]])
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(NAME, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob

def _set_heights(ob, den):
    coords = np.zeros((len(ob.data.vertices), 3), np.float32)
    coords[0] = [0,0,0]
    idx = 1
    for ri in range(N_R):
        r = (ri+1)/N_R * DISC_R
        pv = r / DISC_R
        for j in range(N_PHI):
            φ  = j/N_PHI * 2*math.pi
            si = min(int(j/N_PHI * N_BINS), N_BINS-1)
            pi = min(int(pv    * N_BINS), N_BINS-1)
            h  = float(den[si, pi]) * H_SCALE
            coords[idx] = [r*math.cos(φ), r*math.sin(φ), h]
            idx += 1
    ob.data.vertices.foreach_set("co", coords.ravel())
    ob.data.update()

def _vc(ob, den):
    me = ob.data
    if "dc" not in me.color_attributes:
        me.color_attributes.new("dc", 'FLOAT_COLOR', 'POINT')
    cols = np.zeros((len(me.vertices), 4), np.float32); cols[:,3] = 1.0
    cols[0] = [0.4, 0.5, 0.9, 1.0]
    idx = 1
    for ri in range(N_R):
        r = (ri+1)/N_R * DISC_R; pv = r/DISC_R
        for j in range(N_PHI):
            si = min(int(j/N_PHI * N_BINS), N_BINS-1)
            pi = min(int(pv * N_BINS), N_BINS-1)
            t  = float(den[si, pi])
            if t < 0.5:
                f = t*2; cols[idx] = [0.08+0.92*f, 0.38+0.62*f, 0.80+0.20*f, 1.0]
            else:
                f = (t-0.5)*2; cols[idx] = [1.0, 1.0-0.37*f, 1.0-0.87*f, 1.0]
            idx += 1
    me.color_attributes["dc"].data.foreach_set("color", cols.ravel())
    me.update()

def _material(ob):
    mat = bpy.data.materials.new(f"{NAME}_mat")
    mat.use_nodes = True; mat["holoflow:facet"] = True
    nd = mat.node_tree.nodes; nd.clear()
    a = nd.new("ShaderNodeAttribute"); a.attribute_name = "dc"
    b = nd.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.55
    b.inputs["Metallic"].default_value  = 0.10
    o = nd.new("ShaderNodeOutputMaterial")
    lk = mat.node_tree.links
    lk.new(a.outputs["Color"], b.inputs["Base Color"])
    lk.new(b.outputs["BSDF"],  o.inputs["Surface"])
    ob.data.materials.append(mat)

# ── Assemble ──────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.length_unit = 'METERS'

ss, ps = _stadium_pts()
sc, pc = _circle_pts()
den_s  = _density(ss, ps)
den_c  = _density(sc, pc)

ob = _make_disc()
_set_heights(ob, den_s)

ob.shape_key_add(name="Basis",     from_mix=False)
sk = ob.shape_key_add(name="SK_Circle", from_mix=False)
idx = 0
for ri in range(N_R):
    r = (ri+1)/N_R * DISC_R; pv = r/DISC_R
    for j in range(N_PHI):
        φ  = j/N_PHI * 2*math.pi
        si = min(int(j/N_PHI * N_BINS), N_BINS-1)
        pi = min(int(pv * N_BINS), N_BINS-1)
        h  = float(den_c[si, pi]) * H_SCALE
        sk.data[idx+1].co = Vector((r*math.cos(φ), r*math.sin(φ), h))
        idx += 1

_vc(ob, den_s)
_material(ob)
ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.object.shade_flat()
ob["holoflow:facet"] = True

print(f"[holoflow] {NAME}: stadium σ={den_s.std():.4f}, circle peak={den_c.max():.4f}")
