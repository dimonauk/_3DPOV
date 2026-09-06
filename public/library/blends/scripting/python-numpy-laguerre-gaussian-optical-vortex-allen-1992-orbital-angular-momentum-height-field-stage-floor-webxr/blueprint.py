"""
Laguerre–Gaussian Optical Vortex Beams (Allen et al. 1992)
===========================================================
TECHNIQUE (2–3 sentences):
  A Laguerre–Gaussian (LG) beam is an exact solution of the paraxial wave
  equation parameterised by radial index p and azimuthal index l.  The
  azimuthal factor exp(i·l·φ) winds the optical phase l times around the
  beam axis, creating a phase singularity (optical vortex) at r=0 where the
  amplitude is exactly zero.  Each photon in an LG_p^l mode carries ℏl of
  orbital angular momentum — a degree of freedom entirely independent of
  polarisation spin.

MATHEMATICS:
  LG_p^l(r,φ,z=0) =
    C_pl · (√2 r/w₀)^|l| · L_p^|l|(2r²/w₀²) · exp(−r²/w₀²) · exp(i·l·φ)

  C_pl = √[ 2 p! / (π (p+|l|)!) ] / w₀   (normalisation, ‖LG‖²=1)
  L_p^α(x) = Σ_{k=0}^{p} C(p+α, p−k) (−x)^k / k!   (associated Laguerre poly)

  Why |LG|² not |LG|:  we plot the optical INTENSITY (proportional to |E|²),
  which gives the physically observable power distribution, and its ring
  structure is more pronounced than the bare amplitude.

  Annular intensity maximum at  r_max = w₀ √(|l|/2)  (for p=0).
  Radial index p adds p nodes between r=0 and r→∞: p+1 bright rings.

COLOUR ATTRIBUTE — LG_Phase:
  Hue encodes helical phase arg(LG) = l·φ ∈ [−π,π).
  Mapped to cobalt (phase=0) ↔ amber (phase=π) via |sin(l·φ/2)|.
  This makes the l "arms" of the phase singularity visible as coloured wedges.

SOURCES (permissive):
  Allen L, Beijersbergen MW, Spreeuw RJC, Woerdman JP (1992)
    "Orbital angular momentum of light and the transformation of
    Laguerre–Gaussian laser modes" Phys. Rev. A 45(11):8185–8189.
    https://doi.org/10.1103/PhysRevA.45.8185  [academic citation only]
  NumPy BSD-3-Clause https://numpy.org  github.com/numpy/numpy
  NIST DLMF §18.3 Laguerre polynomials — US Gov. PD
    https://dlmf.nist.gov/18.3

BLENDER 5.1 NOTES:
  bpy.ops.mesh.primitive_grid_add is context-dependent; prefer
  bmesh + from_pydata for scripted geometry (no operator context needed).
  FLOAT_COLOR attributes on POINT domain are the correct path for per-vertex
  colours in Blender 5.1 (BYTE_COLOR deprecated for new work).
"""

import bpy, bmesh, math, pathlib
import numpy as np

# ── Named constants ─────────────────────────────────────────────────────────────
SLUG          = "lg-vortex-floor"
N             = 128         # grid resolution → N²=16384 verts, (N−1)²=16129 quads
EXTENT        = 3.5         # half-width in units of beam waist w₀
W0            = 1.0         # beam waist radius (normalised; 1 unit = 1 cm in export)
HEIGHT_SCALE  = 0.55        # peak intensity → metres (visual scale)
WORLD_SCALE   = 2.0         # grid half-width in metres (EXTENT * WORLD_SCALE/EXTENT)
ATTR_NAME     = "LG_Phase"  # FLOAT_COLOR vertex attribute

COBALT = np.array([0.016, 0.172, 0.548, 1.0])   # low phase / valley
AMBER  = np.array([1.000, 0.600, 0.050, 1.0])   # high phase / peak

# Each shape key: (name, l, p)
MODES = [
    ("Basis", 1, 0),   # l=1 p=0: single ring, topological charge 1
    ("SK_l2", 2, 0),   # l=2 p=0: larger ring, charge 2
    ("SK_l3", 3, 0),   # l=3 p=0: three-arm star, charge 3
    ("SK_p1", 1, 1),   # l=1 p=1: two concentric rings, charge 1
]

OUTPUT_DIR = pathlib.Path(bpy.path.abspath("//"))
BLEND_NAME = "lg_vortex_floor.blend"
GLB_NAME   = "lg_vortex_floor.glb"


# ── Laguerre polynomial ─────────────────────────────────────────────────────────

def laguerre(p: int, alpha: float, x: np.ndarray) -> np.ndarray:
    """
    Associated Laguerre polynomial L_p^alpha(x) via three-term recurrence.
    WHY recurrence not sum: numerically stable for large p without factorial
    cancellations; O(p·N²) versus O(p²·N²) for naive term expansion.
    """
    if p == 0:
        return np.ones_like(x)
    L_prev = np.ones_like(x)
    L_curr = 1.0 + alpha - x
    for k in range(1, p):
        L_next = ((2*k + 1 + alpha - x) * L_curr - (k + alpha) * L_prev) / (k + 1)
        L_prev, L_curr = L_curr, L_next
    return L_curr


# ── LG intensity and phase ──────────────────────────────────────────────────────

def lg_field(r: np.ndarray, phi: np.ndarray, l: int, p: int,
             w0: float = 1.0) -> tuple[np.ndarray, np.ndarray]:
    """
    Returns (intensity, phase) of LG_p^l at beam waist (z=0).

    intensity = |LG|² (proportional to optical power per unit area)
    phase     = l·φ ∈ [−π·|l|, π·|l|]

    WHY intensity (|LG|²) not amplitude:
      Intensity is the physically measurable quantity — the ring radius
      r_max=w₀√(|l|/2) and radial nodes are clearest in intensity.
    """
    alpha = abs(l)
    xi    = math.sqrt(2.0) * r / w0          # dimensionless radial coordinate
    # Normalisation constant C_pl (probability-normalised, ‖LG‖=1)
    norm  = math.sqrt(2.0 * math.factorial(p) /
                      (math.pi * math.factorial(p + alpha))) / w0
    Lp    = laguerre(p, float(alpha), xi**2)  # L_p^|l|(2r²/w₀²) = L_p^|l|(xi²)
    amp   = norm * (xi**alpha) * np.abs(Lp) * np.exp(-xi**2 / 2.0)
    return amp**2, float(l) * phi             # intensity, helical phase


# ── Colour mapping ──────────────────────────────────────────────────────────────

def phase_colour(phi_lm: np.ndarray, l: int) -> np.ndarray:
    """
    Map helical phase l·φ to cobalt–amber colour.
    |sin(l·φ/2)| produces |l| petals alternating cobalt↔amber.
    This makes the topological charge l visible by colour alone.
    """
    t = np.abs(np.sin(0.5 * phi_lm))        # ∈ [0,1], l-fold petal pattern
    t = np.clip(t, 0.0, 1.0)
    rgba = (1.0 - t[:, None]) * COBALT + t[:, None] * AMBER
    return rgba.astype(np.float32)


# ── Grid helpers ────────────────────────────────────────────────────────────────

def make_grid(n: int, extent: float, world_scale: float):
    """
    Return (xs, ys, r, phi) on an N×N Cartesian grid in [−extent·s, extent·s].
    Grid is aligned so each cell has equal area — important for the intensity
    normalisation (the integral ∑|LG|²·dA ≈ 1).
    """
    lin = np.linspace(-extent, extent, n)
    xs, ys = np.meshgrid(lin, lin, indexing="ij")   # shape (N,N)
    # Physical scale
    scale = world_scale / extent                     # metres per w₀
    xs_m  = xs * scale
    ys_m  = ys * scale
    r     = np.hypot(xs, ys)                         # dimensionless radius
    phi   = np.arctan2(ys, xs)                       # azimuthal angle ∈ (−π,π]
    return xs_m, ys_m, r, phi


# ── Mesh construction ───────────────────────────────────────────────────────────

def build_mesh(obj_name: str) -> tuple:
    """
    Create base N×N quad grid at z=0.  Returns (mesh, bm) ready for
    shape-key assignment.  Uses bmesh.from_pydata to avoid operator-context
    dependency (bpy.ops.mesh.primitive_grid_add needs a 3D VIEW context).
    """
    me = bpy.data.meshes.new(obj_name)
    bm = bmesh.new()
    xs_m, ys_m, _, _ = make_grid(N, EXTENT, WORLD_SCALE)
    verts = []
    for i in range(N):
        for j in range(N):
            verts.append(bm.verts.new((xs_m[i, j], ys_m[i, j], 0.0)))
    bm.verts.ensure_lookup_table()
    for i in range(N - 1):
        for j in range(N - 1):
            v00 = verts[i * N + j]
            v10 = verts[(i+1) * N + j]
            v11 = verts[(i+1) * N + (j+1)]
            v01 = verts[i * N + (j+1)]
            bm.faces.new([v00, v10, v11, v01])
    bm.to_mesh(me)
    bm.free()
    return me


def set_z_and_colour(mesh, l: int, p: int, sk_name: str,
                     intensity_ref: np.ndarray | None = None):
    """
    Set vertex Z heights from LG intensity and write LG_Phase FLOAT_COLOR
    attribute.  If sk_name == "Basis", set reference intensity for normalisation
    and initialise the shape-key block; otherwise add a new shape-key block.

    WHY store intensity_ref: normalise ALL shape keys to the same Z scale so
    the floor never flips below ground — different (l,p) modes have very
    different peak heights.
    """
    xs_m, ys_m, r, phi = make_grid(N, EXTENT, WORLD_SCALE)
    intensity, phase_lm = lg_field(r, phi, l, p, W0)
    if intensity_ref is None:
        intensity_ref = intensity
    i_max = intensity_ref.max() or 1.0
    z = (intensity / i_max) * HEIGHT_SCALE    # normalised to [0, HEIGHT_SCALE]
    colours = phase_colour(phase_lm, l)       # (N², 4) RGBA

    flat_z = z.ravel()
    flat_x = xs_m.ravel()
    flat_y = ys_m.ravel()

    if sk_name == "Basis":
        attr = mesh.attributes.new(ATTR_NAME, "FLOAT_COLOR", "POINT")
    else:
        attr = mesh.attributes[ATTR_NAME]

    for vi, v in enumerate(mesh.vertices):
        v.co.x = flat_x[vi]
        v.co.y = flat_y[vi]
        v.co.z = flat_z[vi]

    for vi in range(len(mesh.vertices)):
        attr.data[vi].color = colours[vi]

    return intensity_ref


# ── Material ─────────────────────────────────────────────────────────────────────

def make_material(obj):
    """
    Principled BSDF driven by LG_Phase FLOAT_COLOR attribute.
    WHY Attribute → Base Color + Emission: the cobalt–amber phase patterning
    must be visible under ambient WebXR lighting, so we mix 35% self-emission
    (unlit colour fidelity) with 65% Principled BSDF (depth/shadow cues).
    """
    mat = bpy.data.materials.new("LG_Vortex_Mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()

    attr  = nt.nodes.new("ShaderNodeAttribute");  attr.attribute_name = ATTR_NAME
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit  = nt.nodes.new("ShaderNodeEmission")
    mix   = nt.nodes.new("ShaderNodeMixShader")
    out   = nt.nodes.new("ShaderNodeOutputMaterial")

    bsdf.inputs["Metallic"].default_value    = 0.35
    bsdf.inputs["Roughness"].default_value   = 0.22
    emit.inputs["Strength"].default_value    = 1.6

    nt.links.new(attr.outputs["Color"],  bsdf.inputs["Base Color"])
    nt.links.new(attr.outputs["Color"],  emit.inputs["Color"])
    nt.links.new(bsdf.outputs["BSDF"],   mix.inputs[1])
    nt.links.new(emit.outputs["Emission"], mix.inputs[2])
    mix.inputs["Fac"].default_value = 0.35
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    obj.data.materials.append(mat)


# ── Main ─────────────────────────────────────────────────────────────────────────

def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    me   = build_mesh("lg_vortex")
    obj  = bpy.data.objects.new("lg_vortex", me)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # Shape keys — one per LG mode
    obj.shape_key_add(name="Basis", from_mix=False)
    intensity_ref = None

    for sk_name, l, p in MODES:
        intensity_ref = set_z_and_colour(me, l, p, sk_name, intensity_ref)
        if sk_name != "Basis":
            sk = obj.shape_key_add(name=sk_name, from_mix=False)
            # Push vertex positions into this shape key block
            for vi, v in enumerate(me.vertices):
                sk.data[vi].co = v.co.copy()

    # Reset basis verts
    l0, p0 = MODES[0][1], MODES[0][2]
    intensity_ref = None
    intensity_ref = set_z_and_colour(me, l0, p0, "Basis", None)

    make_material(obj)

    # holoflow export hints
    obj["holoflow:facet"]    = False
    obj["holoflow:category"] = "stage-floor"

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_DIR / BLEND_NAME))

    # GLB export (Draco 6, WebP, +Y up, morph targets)
    bpy.ops.export_scene.gltf(
        filepath          = str(OUTPUT_DIR / GLB_NAME),
        export_format     = "GLB",
        export_yup        = True,
        export_apply      = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_morph      = True,
        export_colors     = True,
    )
    print(f"[LG Vortex] written {BLEND_NAME} + {GLB_NAME}")


main()
