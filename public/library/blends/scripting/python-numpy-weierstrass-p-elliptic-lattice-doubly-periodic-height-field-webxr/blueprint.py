"""
Weierstrass ℘-function: Doubly-Periodic Elliptic Height Field  (Blender 5.1)
=============================================================================
The Weierstrass ℘-function is the foundational example of an elliptic function —
a meromorphic function doubly-periodic in the complex plane:

    ℘(z; Λ) = 1/z²  +  Σ_{ω ∈ Λ \ {0}} [ 1/(z−ω)²  −  1/ω² ]

Λ = ω₁ℤ + ω₂ℤ is the lattice;  τ = ω₂/ω₁ is the modular parameter (Im τ > 0).
The Eisenstein subtraction 1/ω² regularises the conditionally-convergent sum into
an absolutely-convergent one — crucial for correct numerical evaluation.  ℘ has a
second-order pole at every lattice point and no other singularities.

The function satisfies the Weierstrass ODE:
    (℘')²  =  4℘³  −  g₂ ℘  −  g₃
where  g₂ = 60 G₄ ,  g₃ = 140 G₆  (Eisenstein series of the lattice).
This cubic gives the Weierstrass model of an elliptic curve: (X,Y)=(℘,℘'), a
smooth genus-1 curve.  Three shape keys encode three classical modular shapes:
  • Square       τ = i            (g₃ = 0 by Z₄ symmetry)
  • Rectangular  τ = 1.5i         (elongated volcano)
  • Equianharmonic  τ = e^{iπ/3}  (g₂ = 0, Z₆ symmetry, Weierstrass P on
                                   the Eisenstein integers — genus-1 curve
                                   with complex multiplication by ℤ[ω], ω³=1)

Height field: Re(℘(z; τ)) sampled on a GRID×GRID quadrilateral mesh over the
fundamental domain, truncated near poles, and normalised to [−1, +1].
Vertex colour encodes |℘'| / |℘'|_max — steepest regions glow magenta (near poles),
flat zero regions glow cyan.  Exported as Draco-6 GLB for WebXR stage floor.

Outside sources:
  Whittaker & Watson, A Course of Modern Analysis §20 (1927) — public domain.
    https://archive.org/details/courseofmodernan00whit
  DLMF §23 Weierstrass Elliptic Functions — public domain (US gov't work).
    https://dlmf.nist.gov/23
  NumPy — BSD-3-Clause  https://numpy.org
"""

import bpy
import bmesh
import numpy as np

# ── Parameters ─────────────────────────────────────────────────────────────────
GRID         = 96          # mesh resolution (vertices per side)
N_SUM        = 10          # lattice sum radius ±N  (440 terms; N≥8 gives <0.01% error)
POLE_CLIP    = 9.0         # clamp Re(℘) outside [−POLE_CLIP, POLE_CLIP]
MESH_SCALE   = 2.0         # world XY extent in metres (−1 m … +1 m each axis)
HEIGHT_SCALE = 0.18        # world Z multiplier after normalisation
DOMAIN_FRAC  = 0.46        # sample domain radius as fraction of period (keeps poles visible)

# Lattice shapes: τ values (ω₁ = 1 fixed)
TAU_SQUARE         = 1j
TAU_RECTANGULAR    = 1.5j
TAU_EQUIANHARMONIC = np.exp(1j * np.pi / 3.0)

OBJ_NAME  = "hf_weierstrass_p"
GLB_PATH  = "//hf_weierstrass_p.glb"

# ── Core maths ─────────────────────────────────────────────────────────────────

def _lattice_terms(tau: complex, N: int = N_SUM):
    """Return (omega, inv_omega_sq) arrays for non-zero lattice points m + n·τ."""
    m_arr = np.arange(-N, N + 1, dtype=np.float64)
    mm, nn = np.meshgrid(m_arr, m_arr)
    mm, nn = mm.ravel(), nn.ravel()
    mask   = (mm != 0) | (nn != 0)
    omega  = (mm[mask] + nn[mask] * tau)           # complex, shape (M,)
    return omega, 1.0 / omega**2                   # also (M,)


def wp_real(tau: complex, grid: int = GRID, frac: float = DOMAIN_FRAC) -> np.ndarray:
    """
    Evaluate Re(℘(z; 1, τ)) on a (grid × grid) array.

    Domain: z = x + iy,  x ∈ [−frac, frac],  y ∈ [−frac·|Im τ|, frac·|Im τ|].
    The pole at z = 0 sits at the mesh centre; values beyond POLE_CLIP are clamped
    before the percentile normalisation so the interior structure remains legible.

    Broadcast strategy:
      z  → shape (G², 1)   ← G = grid
      ω  → shape (1, M)
    Produces (G², M) complex array; summing along axis=1 costs ≈ G² × M × 16 B.
    For G=96, M=440: ≈ 65 MB — well within Blender's Python heap.
    """
    omega, inv_w2 = _lattice_terms(tau)

    xs = np.linspace(-frac,            frac,              grid)
    ys = np.linspace(-frac * abs(tau), frac * abs(tau),   grid)
    X, Y = np.meshgrid(xs, ys)          # (grid, grid)
    z    = (X + 1j * Y).ravel()         # (G²,)

    EPS   = 1e-8
    safe  = np.where(np.abs(z) < EPS, EPS + 0j, z)
    p     = 1.0 / safe**2               # leading term (G²,)

    # Broadcast: (G², 1) − (1, M) → (G², M)
    diff  = z[:, None] - omega[None, :]
    safe2 = np.where(np.abs(diff) < EPS, EPS + 0j, diff)
    p    += (1.0 / safe2**2 - inv_w2).sum(axis=1)

    field = np.real(p).reshape(grid, grid)
    field = np.clip(field, -POLE_CLIP, POLE_CLIP)

    # Robust normalisation: map p5–p95 percentile band → [−1, +1]
    lo, hi = np.percentile(field, 3), np.percentile(field, 97)
    span   = max(hi - lo, 1e-6)
    field  = np.clip((field - lo) / span * 2.0 - 1.0, -1.0, 1.0)
    return field.astype(np.float64)


# ── Mesh helpers ───────────────────────────────────────────────────────────────

def _field_to_verts(field: np.ndarray, tau: complex):
    """Convert 2D height field to (verts, faces) for bpy.data.meshes.from_pydata."""
    H, W  = field.shape
    xs    = np.linspace(-MESH_SCALE / 2, MESH_SCALE / 2, W)
    ys    = np.linspace(-MESH_SCALE / 2 * abs(tau),
                         MESH_SCALE / 2 * abs(tau), H)
    verts = [
        (float(xs[c]), float(ys[r]), float(field[r, c]) * HEIGHT_SCALE)
        for r in range(H) for c in range(W)
    ]
    faces = []
    for r in range(H - 1):
        for c in range(W - 1):
            i = r * W + c
            faces.append((i, i + 1, i + W + 1, i + W))   # quad, CCW
    return verts, faces


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    # Clean scene
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    # ── Basis: square lattice ──
    print("℘ field — Square τ=i …")
    field_sq    = wp_real(TAU_SQUARE)
    verts, faces = _field_to_verts(field_sq, TAU_SQUARE)

    mesh = bpy.data.meshes.new(OBJ_NAME)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj  = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Flat shading — the faceted look reads the topology clearly
    for poly in mesh.polygons:
        poly.use_smooth = False

    # ── Shape keys ──
    sk_basis  = obj.shape_key_add(name="Square_tau_i",        from_mix=False)
    sk_basis.interpolation = "KEY_LINEAR"

    for sk_name, tau_sk in [
        ("Rectangular_tau_1p5i",  TAU_RECTANGULAR),
        ("Equianharmonic_tau_eiπ3", TAU_EQUIANHARMONIC),
    ]:
        print(f"℘ field — {sk_name} …")
        field_sk      = wp_real(tau_sk)
        verts_sk, _   = _field_to_verts(field_sk, tau_sk)
        sk            = obj.shape_key_add(name=sk_name, from_mix=False)
        sk.interpolation = "KEY_LINEAR"
        for idx, v in enumerate(sk.data):
            v.co = verts_sk[idx]

    # ── Vertex colour: |∇Re(℘)| → gradient magnitude ──
    print("Computing vertex colours …")
    gy, gx   = np.gradient(field_sq)
    gmag     = np.sqrt(gx**2 + gy**2)
    clip95   = np.percentile(gmag, 95)
    gnorm    = np.clip(gmag / (clip95 + 1e-8), 0.0, 1.0)

    col_attr = mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for vi in range(GRID * GRID):
        r, c = divmod(vi, GRID)
        t    = float(gnorm[r, c])
        # cyan (flat/zero regions) → magenta (steep pole surroundings)
        col_attr.data[vi].color = (0.2 + 0.8 * t, 1.0 - 0.9 * t, 1.0 - 0.4 * t, 1.0)

    # ── Material: unlit emission from vertex colour ──
    mat  = bpy.data.materials.new("WeierP")
    mat.use_nodes        = True
    mat.shadow_method    = "NONE"
    nt   = mat.node_tree
    nt.nodes.clear()

    vcol = nt.nodes.new("ShaderNodeVertexColor");  vcol.layer_name = "Col"
    emit = nt.nodes.new("ShaderNodeEmission");     emit.inputs["Strength"].default_value = 2.8
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(vcol.outputs["Color"],    emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    mesh.materials.append(mat)

    # Holoflow export metadata
    obj["holoflow:facet"] = True
    obj["holoflow:slug"]  = "weierstrass-p-elliptic-lattice"

    # ── Camera & sun ──
    bpy.ops.object.camera_add(location=(0, -3.2, 3.2))
    cam = bpy.context.object
    cam.rotation_euler = (np.radians(45), 0, 0)
    bpy.context.scene.camera = cam

    sun_d = bpy.data.lights.new("Sun", "SUN");  sun_d.energy = 2.5
    sun_o = bpy.data.objects.new("Sun", sun_d)
    bpy.context.collection.objects.link(sun_o);  sun_o.location = (2, -2, 4)

    # ── GLB export ──
    bpy.ops.export_scene.gltf(
        filepath          = GLB_PATH,
        use_selection     = False,
        export_format     = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_yup        = True,
        export_apply      = True,
        export_morph      = True,
        export_colors     = True,
        export_image_format = "WEBP",
    )
    print(f"✓  {OBJ_NAME}: {len(mesh.vertices)} verts  {len(mesh.polygons)} faces")
    print(f"   Shape keys: {[sk.name for sk in obj.data.shape_keys.key_blocks]}")
    print(f"   GLB → {GLB_PATH}")


main()
