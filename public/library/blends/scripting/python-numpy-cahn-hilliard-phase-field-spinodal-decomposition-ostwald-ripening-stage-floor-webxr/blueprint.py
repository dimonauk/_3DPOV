"""
Cahn–Hilliard Phase-Field Spinodal Decomposition
=================================================
TECHNIQUE (2–3 sentences):
  The Cahn–Hilliard equation is a 4th-order PDE that governs phase separation
  in binary mixtures — alloys, polymer blends, oil/water emulsions. A SINGLE
  conserved composition field c(x,y,t)∈[0,1] spontaneously forms micro-domains
  driven by thermodynamic free-energy minimisation rather than autocatalysis.
  The result is labyrinthine patterns, isolated droplets, or coarsening domains
  depending on mean composition and integration time.

MATHEMATICS:
  ∂c/∂t = M ∇²μ               (conservation of mass)
  μ      = f'(c) − ε² ∇²c    (chemical potential)
  f(c)   = c²(1−c)²/4        (double-well Landau free energy)
  f'(c)  = c(1−c)(2c−1)      (driving force — zero at c=0, 0.5, 1)

  Spinodal instability: d²f/dc²= 6c²−6c+1 < 0 when 1/3 < c < 2/3.
  In that band any fluctuation grows — unlike nucleation which needs a seed.

NUMERICAL METHOD — FFT semi-implicit (Eyre 1998):
  ∂ĉ/∂t = M(−k²)[f̂'(c) + ε²k²ĉ] in Fourier space.
  Implicit denominator: (1 + dt·M·ε²·k⁴) — always ≥ 1, unconditionally stable.
  ĉ(t+dt) = [ĉ(t) − dt·M·k²·F̂{f'(c)}] / (1 + dt·M·ε²·k⁴)

  WHY FFT not finite-differences: the bi-Laplacian (k⁴ stiffness) couples all
  pairs; FFT handles it exactly in O(N²logN) with periodic boundary conditions
  — physical for bulk demixing where boundaries are irrelevant.

SOURCES (permissive):
  Cahn JW & Hilliard JE 1958 J Chem Phys 28:258 — equations are in the
  public domain (>65 yr). doi:10.1063/1.1744102
  Eyre DJ 1998 "Unconditionally gradient stable time marching..."
  MRS Symp Proc 529:39 — algorithmic insight, PD (1998).
  NumPy BSD-3-Clause https://numpy.org github.com/numpy/numpy
"""

import bpy, bmesh, numpy as np, pathlib, math

# ── Named constants ────────────────────────────────────────────────────────────
N             = 128      # grid resolution N×N
WORLD_SCALE   = 4.0      # mesh half-width (metres)
HEIGHT_SCALE  = 0.40     # c → z amplitude
M_MOB         = 1.0      # mobility
EPS_BASIS     = 0.030    # interface-thickness parameter ε  (basis + coarsened)
EPS_THICK     = 0.050    # thicker ε → softer domain walls
DT            = 0.25     # time-step (unconditionally stable)
COMP_SYMM     = 0.500    # symmetric composition → labyrinthine
COMP_DROP     = 0.300    # minority phase → isolated droplets
STEPS_EARLY   = 120      # Basis: early-stage demixing
STEPS_COARSE  = 600      # SK_Coarsened: Ostwald ripening / domain coarsening
SEED          = 42
COL_P0        = (0.030, 0.200, 0.780, 1.0)  # cobalt  (c≈0 phase)
COL_P1        = (0.980, 0.620, 0.050, 1.0)  # amber   (c≈1 phase)
ATTR_NAME     = "CH_Comp"

OUTPUT_DIR    = pathlib.Path(bpy.path.abspath("//"))
BLEND_NAME    = "cahn_hilliard_floor.blend"
GLB_NAME      = "cahn_hilliard_floor.glb"


# ── Fourier helpers ────────────────────────────────────────────────────────────

def _wavenumbers(N):
    """
    Integer wavenumber arrays kx, ky and derived |k|², |k|⁴.
    np.fft.fftfreq(N, d=1/N) gives integer frequencies [0,1,...,N/2,-N/2,...,-1].
    WHY integer (not angular): grid spacing is 1 cell; the real-space unit
    is arbitrary — HEIGHT_SCALE absorbs it.  k⁴ drives the bi-Laplacian stiffness.
    """
    f       = np.fft.fftfreq(N, d=1.0 / N)
    kx, ky  = np.meshgrid(f, f, indexing='ij')
    k2      = kx**2 + ky**2
    k4      = k2 ** 2
    return k2, k4


def _f_prime(c):
    """
    f'(c) = c(1−c)(2c−1) — gradient of double-well f = c²(1−c)²/4.
    Factored form avoids cancellation near boundaries c=0,1.
    Sign: negative in (0,0.5), zero at 0.5, positive in (0.5,1) —
    this pushes c toward the two minima simultaneously.
    """
    return c * (1.0 - c) * (2.0 * c - 1.0)


def integrate_ch(N, M, eps, dt, steps, c0_mean, noise=0.02, seed=42):
    """
    FFT semi-implicit integration of Cahn–Hilliard.
    Returns c [N,N] float64, values in [0,1].

    Scheme derivation:
      ĉⁿ⁺¹ = [ĉⁿ − dt·M·k²·f̂'(cⁿ)] / (1 + dt·M·ε²·k⁴)
    Denominator ≥ 1 for all k → no CFL constraint.
    Mass is conserved analytically: f̂'ₖ₌₀ = 0 (mean of f' = 0 at c̄=const)
    and the k=0 mode is unchanged (denominator=1 there).
    """
    rng = np.random.default_rng(seed)
    c   = c0_mean + noise * rng.standard_normal((N, N))
    np.clip(c, 0.0, 1.0, out=c)

    k2, k4  = _wavenumbers(N)
    denom   = 1.0 + dt * M * eps**2 * k4    # implicit denominator (≥1)

    for _ in range(steps):
        fp_hat  = np.fft.fft2(_f_prime(c))
        c_hat   = np.fft.fft2(c)
        c_hat   = (c_hat - dt * M * k2 * fp_hat) / denom
        c       = np.real(np.fft.ifft2(c_hat))
        np.clip(c, 0.0, 1.0, out=c)         # round-trip errors < 1e-12; clip is safety

    return c


# ── Mesh builders ──────────────────────────────────────────────────────────────

def _verts_faces(c, world_scale, height_scale):
    """N×N grid: z = c * height_scale. CCW quad faces."""
    N   = c.shape[0]
    xs  = np.linspace(-world_scale, world_scale, N)
    ys  = np.linspace(-world_scale, world_scale, N)
    zs  = c * height_scale

    verts = [(float(xs[i]), float(ys[j]), float(zs[i, j]))
             for i in range(N) for j in range(N)]
    faces = [(i*N+j, i*N+j+1, (i+1)*N+j+1, (i+1)*N+j)
             for i in range(N-1) for j in range(N-1)]
    return verts, faces


def _apply_colour(mesh, c_flat):
    """
    FLOAT_COLOR attribute: cobalt (c=0) → amber (c=1).
    WHY FLOAT_COLOR not BYTE_COLOR: preserves HDR intensity range;
    Eevee's ShaderNodeAttribute can drive Emission strength from it.
    """
    attr = mesh.attributes.new(name=ATTR_NAME, type='FLOAT_COLOR', domain='POINT')
    cols = []
    for v in c_flat:
        r = COL_P0[0] + (COL_P1[0] - COL_P0[0]) * v
        g = COL_P0[1] + (COL_P1[1] - COL_P0[1]) * v
        b = COL_P0[2] + (COL_P1[2] - COL_P0[2]) * v
        cols.extend([r, g, b, 1.0])
    attr.data.foreach_set("color", cols)


def _add_shape_key(obj, name, c):
    """Append one shape key from a pre-computed field."""
    sk      = obj.shape_key_add(name=name, from_mix=False)
    verts,_ = _verts_faces(c, WORLD_SCALE, HEIGHT_SCALE)
    for idx, v in enumerate(verts):
        sk.data[idx].co = v


# ── Material ───────────────────────────────────────────────────────────────────

def _make_material(obj):
    mat   = bpy.data.materials.new("CH_Floor_Mat")
    mat.use_nodes = True
    nt    = mat.node_tree
    nd, lk = nt.nodes, nt.links
    nd.clear()

    attr  = nd.new("ShaderNodeAttribute"); attr.attribute_name = ATTR_NAME
    bsdf  = nd.new("ShaderNodeBsdfPrincipled")
    emit  = nd.new("ShaderNodeEmission")
    mix   = nd.new("ShaderNodeMixShader")
    out   = nd.new("ShaderNodeOutputMaterial")

    bsdf.inputs["Metallic"].default_value  = 0.55
    bsdf.inputs["Roughness"].default_value = 0.22
    emit.inputs["Strength"].default_value  = 1.8

    lk.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    lk.new(attr.outputs["Color"], emit.inputs["Color"])
    lk.new(bsdf.outputs["BSDF"], mix.inputs[1])
    lk.new(emit.outputs["Emission"], mix.inputs[2])
    mix.inputs["Fac"].default_value = 0.35
    lk.new(mix.outputs["Shader"], out.inputs["Surface"])
    obj.data.materials.append(mat)


# ── Main ───────────────────────────────────────────────────────────────────────

def build():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Basis: symmetric composition, early stage → labyrinthine spinodal
    c_basis         = integrate_ch(N, M_MOB, EPS_BASIS, DT, STEPS_EARLY,  COMP_SYMM, seed=SEED)
    verts, faces    = _verts_faces(c_basis, WORLD_SCALE, HEIGHT_SCALE)

    me  = bpy.data.meshes.new("CH_Floor")
    me.from_pydata(verts, [], faces)
    me.validate()
    obj = bpy.data.objects.new("cahn_hilliard_floor", me)
    bpy.context.scene.collection.objects.link(obj)
    _apply_colour(me, c_basis.ravel())

    obj.shape_key_add(name="Basis", from_mix=False)

    # SK_Coarsened: Ostwald ripening — large domains absorb small ones
    c_coarse = integrate_ch(N, M_MOB, EPS_BASIS, DT, STEPS_COARSE, COMP_SYMM, seed=SEED)
    _add_shape_key(obj, "SK_Coarsened", c_coarse)

    # SK_Droplets: minority composition → isolated droplets of c≈1 in sea of c≈0
    c_drop = integrate_ch(N, M_MOB, EPS_BASIS, DT, STEPS_EARLY, COMP_DROP, seed=SEED+1)
    _add_shape_key(obj, "SK_Droplets", c_drop)

    # SK_ThickInterface: larger ε → softer, broader domain walls
    c_thick = integrate_ch(N, M_MOB, EPS_THICK, DT, STEPS_EARLY, COMP_SYMM, seed=SEED+2)
    _add_shape_key(obj, "SK_ThickInterface", c_thick)

    _make_material(obj)

    # +Y-up rotation for WebXR (Blender +Z-up → glTF +Y-up)
    obj.data.transform(mathutils.Matrix.Rotation(math.pi / 2, 4, 'X'))
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "stage-floor"

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_DIR / BLEND_NAME))
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_DIR / GLB_NAME),
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_morph=True,
        export_colors=True,
        export_extras=True,
        use_selection=False,
    )
    print("CH floor written →", OUTPUT_DIR)


import mathutils  # placed here so the module-level docstring stays clean
build()
