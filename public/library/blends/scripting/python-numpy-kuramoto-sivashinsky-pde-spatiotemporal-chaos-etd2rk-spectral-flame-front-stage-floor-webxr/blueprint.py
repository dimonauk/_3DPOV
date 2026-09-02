"""
Kuramoto–Sivashinsky PDE — Spatiotemporal Chaos, ETD2RK Pseudo-Spectral
Stage Floor for WebXR  (Blender 5.1)
═══════════════════════════════════════════════════════════════════════════════
References
  Sivashinsky GI (1977) Acta Astronaut 4(11–12):1177–1206  — flame-front form
  Kuramoto Y & Tsuzuki T (1976) Prog Theor Phys 55(2):356–369  — chemical waves
  Cox SM & Matthews PC (2002) J Comput Phys 176(2):430–455  — ETD2RK scheme
Licence: CC0 (equations in public domain; implementation original)
───────────────────────────────────────────────────────────────────────────────
TECHNIQUE OVERVIEW
  The KS equation  u_t = −u_xxxx − u_xx − u·u_x  on a periodic 1-D domain
  describes flame-front propagation, thin-film flows, and reaction-diffusion
  pattern formation.  The −u_xx term drives a long-wave instability (growth
  at wavenumbers k < 1); −u_xxxx provides high-wavenumber damping; u·u_x is
  the nonlinear saturation.  For domain length L ≳ 20 the interplay produces
  spatiotemporal chaos: no periodic attractor, sensitive to initial conditions,
  positive Lyapunov exponent, yet bounded energy spectrum.

  We integrate with ETD2RK (exponential time differencing, 2nd-order
  Runge–Kutta):  the stiff linear operator is handled exactly via the
  integrating factor e^{L̂h}; the nonlinear term is advanced by Heun's
  predictor-corrector.  This avoids the tiny time-step constraint of purely
  explicit schemes while remaining simpler than IMEX multi-step methods.

  Output: 128 × 64 (space × time) height-field stage floor, four shape keys
  for different domain lengths.  KS_Velocity FLOAT_COLOR: cobalt = negative,
  amber = positive.
═══════════════════════════════════════════════════════════════════════════════
"""

import bpy, bmesh
import numpy as np
from math import pi

# ── PARAMETERS (edit here only) ───────────────────────────────────────────────
NX        = 128    # spatial grid points (power-of-2 for FFT)
NT        = 64     # time snapshots recorded per shape key
DT        = 0.25   # time step (ETD2RK stable for all L values below)
N_WARMUP  = 1200   # warm-up steps (discard transient; chaos onset ~500 steps)
SKIP      = 8      # integration steps between recorded snapshots
CELL_X    = 0.055  # metres per spatial node  → x-axis of floor
CELL_T    = 0.13   # metres per time snapshot → y-axis of floor
HEIGHT    = 0.55   # peak-to-peak height range in metres (z-axis)

# Domain lengths (L > 2π√2 ≈ 8.9 needed for instability; L > ~20 for chaos)
L_BASIS   = 64.0   # canonical fully-developed chaos  (~8 active cells)
L_ONSET   = 22.0   # near-onset: 2-cell quasi-regular travelling waves
L_SHORT   = 32.0   # sparse chaos (~4 cells)
L_LONG    = 96.0   # dense turbulence (12+ cells competing)

COBALT    = np.array([0.06, 0.14, 0.66, 1.0], dtype=np.float32)
AMBER     = np.array([0.88, 0.52, 0.04, 1.0], dtype=np.float32)
OBJ_NAME  = "ks_flame_floor"
ATTR_NAME = "KS_Velocity"   # FLOAT_COLOR vertex attribute

# ── ETD2RK SPECTRAL SOLVER ────────────────────────────────────────────────────
def _phi1(z, ez):
    """φ₁(z) = (e^z − 1)/z.  Numerically safe at z ≈ 0 via Taylor series."""
    small = np.abs(z) < 1e-8
    # Taylor: φ₁ ≈ 1 + z/2 + z²/6 for |z| small
    taylor = 1.0 + z * (0.5 + z / 6.0)
    return np.where(small, taylor, (ez - 1.0) / np.where(small, np.ones_like(z), z))


def _solve_ks(l_domain):
    """
    Integrate KS on [0, l_domain] with periodic BC; return snapshots (NT, NX).

    Why ETD2RK here?
      Explicit RK4 requires dt < 2.8 / max(|L̂|) where max|L̂| ≈ (π·NX/L)⁴.
      For L=64, NX=128 that gives dt_max ≈ 5×10⁻⁵ — far too slow for 1200
      warm-up steps.  ETD2RK handles the stiff linear part exactly, allowing
      dt = 0.25 (5000× larger) with second-order temporal accuracy.
    """
    # rfft wavenumbers for domain [0, L]: k_n = 2π·n / L, n = 0 … NX/2
    k = np.fft.rfftfreq(NX, d=1.0 / NX) * (2.0 * pi / l_domain)

    # Linear operator per mode: L̂(k) = k² − k⁴
    #   k² < k⁴  →  L̂ < 0  (damped)  for k > 1
    #   k² > k⁴  →  L̂ > 0  (unstable) for k < 1  ← drives pattern formation
    L_op = k**2 - k**4

    # Precompute integrating factors for ETD2RK
    E_full = np.exp(L_op * DT)
    E_half = np.exp(L_op * DT * 0.5)
    P1_F   = _phi1(L_op * DT,       E_full)   # φ₁(L·h)  for full corrector
    P1_H   = _phi1(L_op * DT * 0.5, E_half)   # φ₁(L·h/2) for half predictor

    # 2/3-rule dealiasing mask for rfft: zero modes index > NX//3
    # Prevents spurious energy accumulation at the Nyquist aliasing band.
    alias_cut = NX // 3
    dmask = np.ones(NX // 2 + 1, dtype=np.float64)
    dmask[alias_cut:] = 0.0
    ik_d = 1j * k * dmask    # ik with dealiasing pre-applied

    def nonlinear_hat(u_hat):
        """Compute N̂(û) = −(ik/2)·rfft(irfft(û)²), dealiased."""
        u = np.fft.irfft(u_hat * dmask, n=NX)   # physical-space field
        return ik_d * (-0.5) * np.fft.rfft(u * u)

    def step(u_hat):
        """Single ETD2RK step: predictor (half-step ETD1) + corrector."""
        N1    = nonlinear_hat(u_hat)
        w_hat = E_half * u_hat + P1_H * N1        # predictor
        N2    = nonlinear_hat(w_hat)
        return E_full * u_hat + P1_F * N2          # corrector

    # Initial condition: small multi-mode perturbation of zero
    x   = np.linspace(0.0, l_domain, NX, endpoint=False)
    u0  = (0.5 * np.sin(2.0 * pi * x / l_domain)
         + 0.3 * np.sin(4.0 * pi * x / l_domain)
         + 0.1 * np.sin(6.0 * pi * x / l_domain))
    u_hat = np.fft.rfft(u0)

    for _ in range(N_WARMUP):        # discard transient
        u_hat = step(u_hat)

    snaps = np.empty((NT, NX), dtype=np.float64)
    for it in range(NT):
        for _ in range(SKIP):        # advance between snapshots
            u_hat = step(u_hat)
        snaps[it] = np.fft.irfft(u_hat * dmask, n=NX)

    return snaps


# ── MESH UTILITIES ────────────────────────────────────────────────────────────
def _build_mesh(snaps, mesh, height=HEIGHT):
    """Populate a Blender Mesh from (NT, NX) snapshot array."""
    bm = bmesh.new()
    # Normalise height so max |u| == HEIGHT/2
    scale = height / (2.0 * (np.abs(snaps).max() + 1e-10))
    verts_grid = []
    for it in range(NT):
        row = []
        for ix in range(NX):
            v = bm.verts.new((ix * CELL_X, it * CELL_T, snaps[it, ix] * scale))
            row.append(v)
        verts_grid.append(row)
    for it in range(NT - 1):
        for ix in range(NX - 1):
            bm.faces.new([
                verts_grid[it][ix],
                verts_grid[it][ix + 1],
                verts_grid[it + 1][ix + 1],
                verts_grid[it + 1][ix],
            ])
    bm.to_mesh(mesh)
    bm.free()
    return scale


def _set_colours(mesh, snaps, scale):
    """Write KS_Velocity FLOAT_COLOR attribute (linear-interpolated cobalt→amber)."""
    flat = (snaps * scale).ravel().astype(np.float32)
    vmin, vmax = flat.min(), flat.max()
    t = (flat - vmin) / (vmax - vmin + 1e-10)
    cols = (np.outer(1.0 - t, COBALT) + np.outer(t, AMBER)).ravel()
    attr = mesh.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", cols)


def _emission_material():
    mat = bpy.data.materials.new("KS_Emit")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    anode = nt.nodes.new("ShaderNodeAttribute"); anode.attribute_name = ATTR_NAME
    anode.location = (-400, 0)
    emit = nt.nodes.new("ShaderNodeEmission"); emit.inputs["Strength"].default_value = 1.8
    emit.location = (-100, 0)
    out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (200, 0)
    nt.links.new(anode.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def _add_shape_key(obj, sk_name, l_domain):
    """Integrate KS for l_domain and add a shape key to obj."""
    snaps = _solve_ks(l_domain)
    scale = HEIGHT / (2.0 * (np.abs(snaps).max() + 1e-10))
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    co = []
    for it in range(NT):
        for ix in range(NX):
            co.extend([ix * CELL_X, it * CELL_T, snaps[it, ix] * scale])
    sk.data.foreach_set("co", co)


# ── MAIN BUILD ────────────────────────────────────────────────────────────────
def build():
    # Remove any previous run
    for ob in list(bpy.data.objects):
        if ob.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(OBJ_NAME):
            bpy.data.meshes.remove(me)

    # Basis: solve canonical chaos (L = 64)
    snaps_b = _solve_ks(L_BASIS)
    mesh = bpy.data.meshes.new(OBJ_NAME)
    scale_b = _build_mesh(snaps_b, mesh)
    _set_colours(mesh, snaps_b, scale_b)

    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(_emission_material())

    # holoflow metadata
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "stage-floor"
    obj["holoflow:topic"]    = "kuramoto-sivashinsky-pde"

    # Shape keys ──────────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)  # must be first
    _add_shape_key(obj, "SK_Onset", L_ONSET)   # near-onset quasi-regular
    _add_shape_key(obj, "SK_Short", L_SHORT)   # sparse 4-cell chaos
    _add_shape_key(obj, "SK_Long",  L_LONG)    # dense 12-cell turbulence

    # +Y-up convention: rotate −90° about X, then apply
    obj.rotation_euler[0] = pi / 2
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # GLB export
    import os
    out_path = os.path.join(
        os.path.dirname(bpy.data.filepath) or "/tmp",
        "ks_flame_floor.glb"
    )
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_morph=True,
        export_colors=True,
        export_image_format="WEBP",
        export_yup=True,
    )
    print(f"[KS] Exported → {out_path}")
    print(f"[KS] Vertices  : {len(mesh.vertices)} (expected {NX * NT} = {NX * NT})")
    print(f"[KS] Faces     : {len(mesh.polygons)} (expected {(NX-1)*(NT-1)} = {(NX-1)*(NT-1)})")


build()
