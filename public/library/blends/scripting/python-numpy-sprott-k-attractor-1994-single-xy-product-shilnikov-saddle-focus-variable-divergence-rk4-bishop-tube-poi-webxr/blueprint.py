"""
Sprott K Attractor  —  Blender 5.1 Expert Blueprint
====================================================
Julien Clinton Sprott, "Some simple chaotic flows"
Phys Rev E 50(2):R647–R650, 1994.
DOI 10.1103/PhysRevE.50.R647  |  Public-domain equations

System
------
  ẋ = x·y − z           ← single bilinear product; z acts as a brake
  ẏ = x − y             ← asymptotic tracking: y → x
  ż = x + a·z           ← z driven by x, weakly self-amplified

Equilibria (a = 0.3 canonical)
-------------------------------
  O = (0, 0, 0)
    Jacobian at O: [[0,0,−1],[1,−1,0],[1,0,a]]
    Characteristic poly: −(λ+1)(λ²−aλ+1)
      → λ_s = −1  (exact),  λ_c = a/2 ± i·√(1−a²/4) ≈ 0.15 ± 0.985i
    Shilnikov condition: |λ_s|=1 > Re(λ_c)=0.15  ✓  chaos guaranteed at O

  P = (−1/a, −1/a, 1/a²) = (−3.333, −3.333, 11.111)  [second saddle]

Key quantities (a = 0.3)
-------------------------
  Divergence:  ∇·F = y − 1 + a = y − 0.7   (position-dependent)
  MLE:         λ₁ ≈ +0.076
  KY dimension: D_KY ≈ 2.11
  Lyapunov time: τ ≈ 13 time-units

  The variable divergence is rare among the canonical Sprott family —
  most members have constant ∇·F.  Here the attractor must live where
  ⟨y⟩ ≈ 0.7 on average to maintain bounded volume contraction.

Shape-key parametric survey
----------------------------
  Basis    a=0.30  canonical Shilnikov spiral  (|λ_s|/Re(λ_c) = 6.7)
  SK_LoA   a=0.15  weaker ż self-coupling; wider outer loops
  SK_HiA   a=0.50  stronger self-amplification; orbit tightens near O
  SK_NearP a=0.65  near second equilibrium topology; figure alters shape

Conventions
-----------
  +Y up after ROT_YUP  [[1,0,0],[0,0,-1],[0,1,0]]
  cobalt (0.05, 0.20, 0.75) → amber (0.95, 0.60, 0.00) speed colourmap
  SprottK_Speed  FLOAT_COLOR  POINT
  Bishop parallel-transport framing (no twist accumulation)
  3000 waypoints × 8-sided tube  = 24 000 vertices, ≈23 992 quads
  Poi head: UV sphere r=0.090
  Draco-6, WebP textures, export_morph=True, export_colors=True → GLB
"""

import bpy, bmesh, math, numpy as np
from mathutils import Vector

# ── parameters ────────────────────────────────────────────────────────────────
A_BASIS   = 0.30   # canonical
A_LOA     = 0.15   # lower self-coupling
A_HIA     = 0.50   # higher self-coupling
A_NEARP   = 0.65   # near second equilibrium topology shift

DT        = 0.01
BURN_IN   = 3000
N_STEPS   = 90_000
THIN      = 30          # keep every 30th step → 3000 waypoints
TUBE_R    = 0.045
TUBE_SEGS = 8
POI_R     = 0.090

# cobalt → amber speed colourmap
COBALT = np.array([0.05, 0.20, 0.75, 1.0])
AMBER  = np.array([0.95, 0.60, 0.00, 1.0])

ROT_YUP = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], dtype=float)

# ── ODE right-hand side ───────────────────────────────────────────────────────
def _f(s: np.ndarray, a: float) -> np.ndarray:
    x, y, z = s
    # x·y is the sole bilinear nonlinearity; z brakes x-growth
    return np.array([x*y - z,   # ẋ: product minus z
                     x - y,     # ẏ: asymptotic tracking x→y
                     x + a*z])  # ż: x injection + self-coupling

def _rk4(s: np.ndarray, a: float, dt: float) -> np.ndarray:
    k1 = _f(s,              a)
    k2 = _f(s + 0.5*dt*k1, a)
    k3 = _f(s + 0.5*dt*k2, a)
    k4 = _f(s +     dt*k3, a)
    return s + dt/6*(k1 + 2*k2 + 2*k3 + k4)

# ── integrator → waypoints + speeds ──────────────────────────────────────────
def _integrate(a: float) -> tuple[np.ndarray, np.ndarray]:
    """Return (pts[3000,3], speeds[3000]) in +Y-up space."""
    s = np.array([0.1, 0.0, 0.1])
    for _ in range(BURN_IN):
        s = _rk4(s, a, DT)

    raw, spds = [], []
    count = 0
    for _ in range(N_STEPS):
        s    = _rk4(s, a, DT)
        count += 1
        if count % THIN == 0:
            vel  = _f(s, a)
            spds.append(float(np.linalg.norm(vel)))
            raw.append(s.copy())

    pts   = np.array(raw, dtype=float)
    pts   = (ROT_YUP @ pts.T).T   # +Y up
    return pts, np.array(spds, dtype=float)

# ── Bishop parallel-transport frames ─────────────────────────────────────────
def _bishop(pts: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    T = np.diff(pts, axis=0)
    norms = np.linalg.norm(T, axis=1, keepdims=True)
    norms = np.where(norms < 1e-12, 1.0, norms)
    T /= norms                         # unit tangents

    # seed N perpendicular to T[0]
    ref = np.array([0.0, 1.0, 0.0]) if abs(T[0,1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    N0  = ref - np.dot(ref, T[0]) * T[0]
    N0 /= np.linalg.norm(N0)

    N = np.empty_like(T)
    N[0] = N0
    for i in range(1, len(T)):
        # Rodrigues rotation: rotate N[i-1] by the angle between T[i-1] and T[i]
        axis = np.cross(T[i-1], T[i])
        sa   = np.linalg.norm(axis)
        ca   = float(np.dot(T[i-1], T[i]))
        if sa < 1e-12:
            N[i] = N[i-1]
        else:
            ax  = axis / sa
            Ni  = N[i-1]
            N[i] = ca*Ni + sa*np.cross(ax, Ni) + (1-ca)*np.dot(ax, Ni)*ax
            Ni_n = np.linalg.norm(N[i])
            if Ni_n > 1e-12:
                N[i] /= Ni_n

    B = np.cross(T, N)
    return N, B

# ── tube geometry ─────────────────────────────────────────────────────────────
def _build_tube(pts, spds, N, B, name: str) -> bpy.types.Object:
    angles = np.linspace(0, 2*math.pi, TUBE_SEGS, endpoint=False)
    cos_a  = np.cos(angles); sin_a = np.sin(angles)
    n_rings = len(pts) - 1

    rings = (pts[:-1, None, :]                    # shape (n_rings, 1, 3)
             + TUBE_R * (cos_a[None,:,None]*N[:,None,:]
                       + sin_a[None,:,None]*B[:,None,:]))  # (n_rings, 8, 3)
    verts = rings.reshape(-1, 3).tolist()

    # quad faces: each ring → next ring
    faces = []
    for r in range(n_rings - 1):
        base = r * TUBE_SEGS
        for s in range(TUBE_SEGS):
            nxt = (s + 1) % TUBE_SEGS
            faces.append([base+s, base+nxt,
                          base+TUBE_SEGS+nxt, base+TUBE_SEGS+s])

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    # speed colour attribute (cobalt→amber)
    lo, hi = np.percentile(spds, [2, 98])
    t      = np.clip((spds - lo) / max(hi - lo, 1e-12), 0, 1)
    rgba   = np.outer(1-t, COBALT) + np.outer(t, AMBER)  # (3000, 4)
    rgba   = np.repeat(rgba, TUBE_SEGS, axis=0)            # (3000×8, 4)

    attr = mesh.color_attributes.new("SprottK_Speed", "FLOAT_COLOR", "POINT")
    flat = rgba.flatten().tolist()
    attr.data.foreach_set("color", flat)

    return obj

# ── Principled BSDF + emission material ──────────────────────────────────────
def _make_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("SprottK_Mat")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    attr  = tree.nodes.new("ShaderNodeAttribute");  attr.attribute_name = "SprottK_Speed"
    bsdf  = tree.nodes.new("ShaderNodeBsdfPrincipled")
    mix   = tree.nodes.new("ShaderNodeMixShader")
    emit  = tree.nodes.new("ShaderNodeEmission")
    out   = tree.nodes.new("ShaderNodeOutputMaterial")

    bsdf.inputs["Metallic"].default_value   = 0.50
    bsdf.inputs["Roughness"].default_value  = 0.22
    emit.inputs["Strength"].default_value   = 1.8
    mix.inputs["Fac"].default_value         = 0.35

    lnk = tree.links.new
    lnk(attr.outputs["Color"], bsdf.inputs["Base Color"])
    lnk(attr.outputs["Color"], emit.inputs["Color"])
    lnk(bsdf.outputs["BSDF"],  mix.inputs[1])
    lnk(emit.outputs["Emission"], mix.inputs[2])
    lnk(mix.outputs["Shader"],  out.inputs["Surface"])

    obj.data.materials.append(mat)

# ── shape-key helper ──────────────────────────────────────────────────────────
def _apply_shape_key(obj: bpy.types.Object, a: float, key_name: str) -> None:
    """Integrate with parameter a and store as a shape key on obj."""
    if obj.data.shape_keys is None:
        obj.shape_key_add(name="Basis", from_mix=False)

    pts2, spds2 = _integrate(a)
    N2, B2      = _bishop(pts2)

    angles = np.linspace(0, 2*math.pi, TUBE_SEGS, endpoint=False)
    cos_a  = np.cos(angles); sin_a = np.sin(angles)
    rings2 = (pts2[:-1, None, :]
              + TUBE_R * (cos_a[None,:,None]*N2[:,None,:]
                        + sin_a[None,:,None]*B2[:,None,:]))
    verts2 = rings2.reshape(-1, 3)

    sk = obj.shape_key_add(name=key_name, from_mix=False)
    for i, v in enumerate(verts2):
        sk.data[i].co = Vector(v)

# ── poi head ─────────────────────────────────────────────────────────────────
def _make_poi(tube: bpy.types.Object, pts: np.ndarray) -> None:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=POI_R,
                                         location=Vector(pts[-2].tolist()))
    poi = bpy.context.active_object
    poi.name = "SprottK_Poi"
    poi["holoflow:facet"] = False

    mat2 = bpy.data.materials.new("SprottK_Poi_Mat")
    mat2.use_nodes = True
    nt = mat2.node_tree; nt.nodes.clear()
    e   = nt.nodes.new("ShaderNodeEmission")
    o   = nt.nodes.new("ShaderNodeOutputMaterial")
    e.inputs["Color"].default_value   = (0.95, 0.60, 0.00, 1.0)
    e.inputs["Strength"].default_value = 3.0
    nt.links.new(e.outputs["Emission"], o.inputs["Surface"])
    poi.data.materials.append(mat2)

# ── main entry point ──────────────────────────────────────────────────────────
def build_sprott_k(a: float = A_BASIS,
                   shape_keys: bool = True,
                   export_glb: str | None = None) -> bpy.types.Object:
    """
    Build the Sprott K attractor tube in Blender 5.1.

    Parameters
    ----------
    a          : canonical dissipation parameter (default 0.30)
    shape_keys : if True, adds SK_LoA / SK_HiA / SK_NearP keys
    export_glb : absolute path → writes Draco-6 GLB (or None)
    """
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    pts, spds = _integrate(a)
    N, B      = _bishop(pts)
    tube      = _build_tube(pts, spds, N, B, "SprottK_Tube")
    _make_material(tube)

    if shape_keys:
        _apply_shape_key(tube, A_LOA,   "SK_LoA")
        _apply_shape_key(tube, A_HIA,   "SK_HiA")
        _apply_shape_key(tube, A_NEARP, "SK_NearP")

    _make_poi(tube, pts)

    if export_glb:
        bpy.ops.export_scene.gltf(
            filepath=export_glb,
            export_format="GLB",
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_image_format="WEBP",
            export_morph=True,
            export_colors=True,
            use_selection=False,
        )

    return tube

if __name__ == "__main__":
    build_sprott_k()
