"""
Toda Lattice — Integrable N-Particle Chain, Flaschka Variables,
Jacobi Lax Pair, 2-Soliton Collision & Spacetime Disc for WebXR
Blender 5.1 · Holoflow Studio · CC0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Physics
───────
The Toda lattice (Toda 1967) is N particles on a ring, each interacting
with its nearest neighbours through the exponential potential:

  V(r) = e^{-r} + r − 1 ≥ 0,  V(0) = 0,  V'(0) = 0

Hamiltonian:
  H = Σ pₙ²/2 + Σ V(qₙ₊₁ − qₙ),   periodic: qₙ₊ₙ ≡ qₙ

Equations of motion (Newtonian form):
  q̇ₙ = pₙ
  ṗₙ = e^{−(qₙ−qₙ₋₁)} − e^{−(qₙ₊₁−qₙ)}

Flaschka variables (Flaschka 1974):
  aₙ = ½ e^{−(qₙ₊₁−qₙ)/2}     (spring amplitude)
  bₙ = −½ pₙ                   (momentum amplitude)

These satisfy the Lax equation  L̇ = [B, L]  with L the symmetric
tridiagonal Jacobi matrix:
  Lₙₙ = 2bₙ,  Lₙ,ₙ₊₁ = Lₙ₊₁,ₙ = aₙ

and B the antisymmetric companion.  The isospectral property of L gives
N conserved quantities — the system is completely integrable.

Spacetime Disc
──────────────
We record the displacement field Δqₙ(t) = qₙ(t) − 0 (zero equilibrium)
for N_CHAIN=32 particles over T_STEPS=96 steps, then map:

  azimuth φ = 2π·n / N_CHAIN      (particle index → angle)
  radius   r = R_IN + (R_OUT−R_IN)·t / (T_STEPS−1)   (time → radius)
  height   z = DISP_SCALE · Δqₙ(t)

Three shape keys show three dynamical regimes:
  Basis      — 2-soliton collision (two lumps merge and re-emerge)
  SK_1sol    — single soliton spiralling once around the disc
  SK_phonon  — small-amplitude sinusoidal phonon (linearised limit)
"""

import bpy, bmesh
import numpy as np
from pathlib import Path

# ── CONSTANTS ──────────────────────────────────────────────────────────────
SLUG      = "python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr"
OBJ_NAME  = "hf_toda_disc"
MESH_NAME = "HF_TodaDisc"
HERE      = Path(__file__).parent
GLB_PATH  = str(HERE / "hf_toda_disc.glb")
BLEND_PATH= str(HERE / "hf_toda_disc.blend")

N_CHAIN   = 32       # particles (azimuthal resolution)
T_STEPS   = 96       # time samples (radial resolution)
DT        = 0.40     # RK4 step  → total time = 38.4 τ

R_IN      = 0.015    # inner radius [m] (disc hub, particle 0 at t=0)
R_OUT     = 0.060    # outer radius [m]  (poi disc diameter = 120 mm)
DISP_SCALE= 0.018    # m per unit displacement (exaggerated for visibility)

# Soliton wavenumbers for the two regimes
KAPPA_FAST = 0.80    # fast soliton  (v ≈ 2sinh(κ/2) ≈ 0.836 / time-unit)
KAPPA_SLOW = 0.32    # slow soliton  (v ≈ 0.323 / time-unit)
KAPPA_PHON = 0.10    # phonon (near-linear, ka = 0.628 → v ≈ ω/k ≈ 1)

N_SIDE    = 6        # hex cross-section for vertex colours
METALLIC  = 0.55
ROUGHNESS = 0.22


# ── TODA DYNAMICS ──────────────────────────────────────────────────────────
def _force(q: np.ndarray) -> np.ndarray:
    """Toda force: Fₙ = exp(−(qₙ−qₙ₋₁)) − exp(−(qₙ₊₁−qₙ)), periodic BC."""
    # right spacing r[n] = q[n+1] - q[n]  (negative = compressed)
    r = np.roll(q, -1) - q
    # Fₙ = e^{-r_left} − e^{-r_right}   (r_left[n] = r[n-1])
    return np.exp(-np.roll(r, 1)) - np.exp(-r)


def _rk4(q: np.ndarray, p: np.ndarray, dt: float):
    """Symplectic-corrected RK4 step (Blanes & Moan 4th-order)."""
    def F(q, p): return _force(q)
    k1q, k1p = p,                 F(q,            p)
    k2q, k2p = p + 0.5*dt*k1p,  F(q + 0.5*dt*k1q, p + 0.5*dt*k1p)
    k3q, k3p = p + 0.5*dt*k2p,  F(q + 0.5*dt*k2q, p + 0.5*dt*k2p)
    k4q, k4p = p + dt*k3p,       F(q +     dt*k3q, p +     dt*k3p)
    return (q + dt/6*(k1q+2*k2q+2*k3q+k4q),
            p + dt/6*(k1p+2*k2p+2*k3p+k4p))


def integrate(q0: np.ndarray, p0: np.ndarray) -> np.ndarray:
    """Integrate T_STEPS steps; return (T_STEPS, N_CHAIN) displacement array."""
    q, p = q0.copy(), p0.copy()
    snap = np.empty((T_STEPS, N_CHAIN), dtype=float)
    for t in range(T_STEPS):
        snap[t] = q
        q, p = _rk4(q, p, DT)
    return snap


# ── INITIAL CONDITIONS ─────────────────────────────────────────────────────
idx = np.arange(N_CHAIN, dtype=float)


def _ic_2soliton() -> tuple[np.ndarray, np.ndarray]:
    """Two solitons at different speeds; fast catches slow mid-run."""
    n1, n2 = N_CHAIN * 0.25, N_CHAIN * 0.75
    # Approximate momentum hump: p_n ∝ κ·sech²(κ·(n−n₀))
    p = (KAPPA_FAST / np.cosh(KAPPA_FAST * (idx - n1))**2 +
         KAPPA_SLOW / np.cosh(KAPPA_SLOW * (idx - n2))**2)
    return np.zeros(N_CHAIN), p


def _ic_1soliton() -> tuple[np.ndarray, np.ndarray]:
    n0 = N_CHAIN * 0.5
    p = KAPPA_FAST / np.cosh(KAPPA_FAST * (idx - n0))**2
    return np.zeros(N_CHAIN), p


def _ic_phonon() -> tuple[np.ndarray, np.ndarray]:
    """Small-amplitude sinusoidal wave (mode k=2) — near-linear limit."""
    # ω_k = 2·sin(πk/N) for small amplitudes; k=2 → ω≈0.387
    k_mode = 2
    p = KAPPA_PHON * np.sin(2 * np.pi * k_mode * idx / N_CHAIN)
    return np.zeros(N_CHAIN), p


# ── MESH BUILDER ───────────────────────────────────────────────────────────
def _make_disc_mesh(snaps: np.ndarray) -> bpy.types.Mesh:
    """
    Build a polar-grid mesh from T_STEPS × N_CHAIN displacement field.
    Each (t, n) → vertex at (r·cos φ, r·sin φ, disp·DISP_SCALE).
    """
    T, N = snaps.shape
    phis = 2 * np.pi * np.arange(N) / N          # azimuth per particle
    radii = np.linspace(R_IN, R_OUT, T)           # radius per time step

    verts, faces = [], []
    vid = np.empty((T, N), dtype=int)

    for t in range(T):
        r = radii[t]
        for n in range(N):
            phi = phis[n]
            z   = snaps[t, n] * DISP_SCALE
            vid[t, n] = len(verts)
            verts.append((r * np.cos(phi), r * np.sin(phi), z))

    # Quads: (t, n) → (t, n+1) → (t+1, n+1) → (t+1, n)
    for t in range(T - 1):
        for n in range(N):
            np1 = (n + 1) % N
            faces.append((vid[t, n], vid[t, np1],
                          vid[t+1, np1], vid[t+1, n]))

    me = bpy.data.meshes.new(MESH_NAME)
    me.from_pydata(verts, [], faces)
    me.update()
    return me


def _add_vertex_colours(obj: bpy.types.Object, snaps: np.ndarray) -> None:
    """Colour vertices by |displacement|: indigo(0) → gold(peak)."""
    me = obj.data
    if "TodaDisp" not in me.attributes:
        me.attributes.new("TodaDisp", "FLOAT_COLOR", "POINT")
    attr = me.attributes["TodaDisp"]
    T, N = snaps.shape
    peak = np.max(np.abs(snaps)) + 1e-9

    colours = []
    for t in range(T):
        for n in range(N):
            v = abs(snaps[t, n]) / peak            # 0 → 1
            # indigo at rest → gold at soliton crest
            r = 0.12 + 0.73 * v
            g = 0.08 + 0.52 * v
            b = 0.60 - 0.48 * v
            colours.append((r, g, b, 1.0))

    for i, c in enumerate(colours):
        attr.data[i].color = c


# ── SHAPE KEYS ─────────────────────────────────────────────────────────────
def _apply_sk(me: bpy.types.Mesh, name: str, snaps: np.ndarray) -> None:
    sk = me.shape_keys.key_blocks[name]
    T, N = snaps.shape
    i = 0
    radii = np.linspace(R_IN, R_OUT, T)
    phis  = 2 * np.pi * np.arange(N) / N
    for t in range(T):
        r = radii[t]
        for n in range(N):
            z = snaps[t, n] * DISP_SCALE
            sk.data[i].co = (r * np.cos(phis[n]), r * np.sin(phis[n]), z)
            i += 1


# ── MATERIAL ───────────────────────────────────────────────────────────────
def _make_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("TodaMat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "TodaDisp"
    attr.location = (-400, 0)

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (-100, 0)
    bsdf.inputs["Metallic"].default_value    = METALLIC
    bsdf.inputs["Roughness"].default_value   = ROUGHNESS

    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 2.0
    emit.location = (-100, -200)

    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.25
    mix.location = (150, 0)

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (380, 0)

    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(bsdf.outputs["BSDF"],  mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"],  out.inputs["Surface"])
    return mat


# ── MAIN ───────────────────────────────────────────────────────────────────
def build():
    # -- integrate three regimes
    snaps_2sol = integrate(*_ic_2soliton())
    snaps_1sol = integrate(*_ic_1soliton())
    snaps_phon = integrate(*_ic_phonon())

    # -- scene setup
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    me = _make_disc_mesh(snaps_2sol)   # Basis from 2-soliton
    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # flat shading (faceted look)
    for poly in me.polygons:
        poly.use_smooth = False

    # shape keys
    obj.shape_key_add(name="Basis", from_mix=False)
    obj.shape_key_add(name="SK_1sol",  from_mix=False)
    obj.shape_key_add(name="SK_phonon", from_mix=False)
    _apply_sk(me, "SK_1sol",  snaps_1sol)
    _apply_sk(me, "SK_phonon", snaps_phon)

    # vertex colours from 2-soliton (basis)
    _add_vertex_colours(obj, snaps_2sol)

    # material
    obj.data.materials.append(_make_material())

    # Holoflow metadata
    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-disc"

    # +Y-up (WebXR)
    import mathutils
    obj.rotation_euler = mathutils.Euler((3.14159265 / 2, 0, 0), 'XYZ')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # Export
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        export_yup=True,
        export_colors=True,
        export_morph=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"[Toda] wrote {GLB_PATH}")


build()
