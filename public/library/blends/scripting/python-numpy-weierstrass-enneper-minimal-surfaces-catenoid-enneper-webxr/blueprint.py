"""
Weierstrass–Enneper Minimal Surfaces: Catenoid, Helicoid & Enneper Surface
— Blender 5.1 blueprint.

A minimal surface has zero mean curvature H = (κ₁ + κ₂) / 2 = 0 everywhere.
The Weierstrass–Enneper representation (Weierstrass 1866, Enneper 1864)
parameterises every conformal minimal immersion X: Ω ⊂ ℂ → ℝ³ as

    X(z) = Re[ ∫_{z₀}^{z} (Φ₁, Φ₂, Φ₃) dζ ]

where  Φ₁ = f(1 − g²)/2,  Φ₂ = i f(1 + g²)/2,  Φ₃ = f·g
with f holomorphic, g meromorphic, fg² holomorphic.

The null condition Φ₁² + Φ₂² + Φ₃² = 0 is what forces each coordinate
to be harmonic (Laplace equation), which in conformal coordinates is
equivalent to zero mean curvature.

The Bonnet transformation X^θ = Re[ e^{iθ} ∫ Φ dζ ] produces the
associated family: for the catenoid this morphs smoothly into the
helicoid at θ = π/2.  Both surfaces are isometric (same 1st fundamental
form) — a result Schwarz proved in 1865.
"""
import bpy
import numpy as np
from math import pi, tau

# ── Parameters ──────────────────────────────────────────────────────────
NU            = 64          # grid steps along u
NV            = 64          # grid steps along v
U_CATENOID    = (-2.0,  2.0)
U_ENNEPER     = (-1.5,  1.5)   # self-intersects beyond ±1.6
ASSOCIATE_N   = 9           # Shape Key count: θ = 0 → π/2
SEP_X         = 6.0         # x-offset between the three objects
OUTPUT_PATH   = "//hf_weierstrass_minimal.glb"

COL_CATENOID  = (0.05, 0.55, 1.00)   # steel blue
COL_HELICOID  = (0.00, 1.00, 0.65)   # cyan-mint
COL_ENNEPER   = (1.00, 0.28, 0.60)   # magenta-rose


# ── Weierstrass antiderivatives ──────────────────────────────────────────

def _antideriv_catenoid(z: np.ndarray):
    """
    WE data: f = e^{−z}, g = e^z.
    Integrands: Φ₁ = −sinh z, Φ₂ = i cosh z, Φ₃ = 1.
    Antiderivatives: F₁ = cosh z, F₂ = i sinh z, F₃ = z.

    The path-integral is exact (no monodromy on a simply-connected domain)
    so we use the closed form; for surfaces with non-trivial topology (e.g.
    Costa, where g = ℘(z)) a numerical cumtrapz along u then v is needed.
    """
    return np.cosh(z), 1j * np.sinh(z), z


def _antideriv_enneper(z: np.ndarray):
    """
    WE data: f = 1, g = z.
    Integrands: Φ₁ = (1−z²)/2, Φ₂ = i(1+z²)/2, Φ₃ = z.
    Antiderivatives: F₁ = (z − z³/3)/2, F₂ = i(z + z³/3)/2, F₃ = z²/2.

    At u=v=1.5 the surface just begins to fold back on itself; the
    self-intersection locus is the set where the map X loses injectivity
    but not conformality — the surface remains minimal throughout.
    """
    z3 = z * z * z
    F1 = (z - z3 / 3.0) * 0.5
    F2 = 1j * (z + z3 / 3.0) * 0.5
    F3 = z * z * 0.5
    return F1, F2, F3


# ── Bonnet rotation + extraction ─────────────────────────────────────────

def _xyz(F1, F2, F3, theta: float = 0.0) -> np.ndarray:
    """Apply e^{iθ} and take Re[·] to get (nu, nv, 3) vertex array."""
    rot = np.exp(1j * theta)
    return np.stack([np.real(rot * F1),
                     np.real(rot * F2),
                     np.real(rot * F3)], axis=-1)


# ── Grid builders ────────────────────────────────────────────────────────

def _cyl_grid(u_range, nu, nv):
    """(nu, nv) complex grid z = u + iv, v ∈ [0, 2π)."""
    u = np.linspace(u_range[0], u_range[1], nu)
    v = np.linspace(0.0, tau, nv, endpoint=False)
    uu, vv = np.meshgrid(u, v, indexing='ij')
    return uu + 1j * vv


def _sq_grid(u_range, nu, nv):
    """(nu, nv) complex grid z = u + iv on a square domain."""
    u = np.linspace(u_range[0], u_range[1], nu)
    v = np.linspace(u_range[0], u_range[1], nv)
    uu, vv = np.meshgrid(u, v, indexing='ij')
    return uu + 1j * vv


# ── Mesh construction ────────────────────────────────────────────────────

def _mesh_from_xyz(name: str, xyz: np.ndarray,
                   wrap_v: bool = True) -> bpy.types.Object:
    """Build a quad mesh from (nu, nv, 3).  wrap_v closes the v seam."""
    nu, nv, _ = xyz.shape
    verts = xyz.reshape(-1, 3).tolist()
    faces = []
    for i in range(nu - 1):
        for j in range(nv):
            j1 = (j + 1) % nv if wrap_v else j + 1
            if not wrap_v and j1 >= nv:
                continue
            a = i * nv + j
            b = i * nv + j1
            c = (i + 1) * nv + j1
            d = (i + 1) * nv + j
            faces.append((a, b, c, d))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    # Flat shading: the saddle geometry reads more clearly without smooth
    for poly in mesh.polygons:
        poly.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def _add_associate_keys(obj: bpy.types.Object,
                         xyz_list: list, labels: list):
    """Add Shape Keys for the associate family θ-sweep."""
    obj.shape_key_add(name="Basis", from_mix=False)
    for xyz, lbl in zip(xyz_list[1:], labels[1:]):
        sk = obj.shape_key_add(name=lbl, from_mix=False)
        flat = xyz.reshape(-1, 3)
        for i, co in enumerate(flat):
            sk.data[i].co = tuple(co)


def _emission(name: str, rgb: tuple, strength: float = 3.5):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out   = nodes.new("ShaderNodeOutputMaterial")
    emit  = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = (*rgb, 1.0)
    emit.inputs["Strength"].default_value = strength
    mat.node_tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# ── Scene helpers ────────────────────────────────────────────────────────

def _clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def _camera():
    bpy.ops.object.camera_add(location=(0, -20, 3))
    cam = bpy.context.active_object
    cam.rotation_euler = (pi * 0.42, 0.0, 0.0)
    bpy.context.scene.camera = cam
    bpy.ops.object.light_add(type='SUN', location=(4, -8, 12))
    bpy.context.active_object.data.energy = 1.8


# ── Main ─────────────────────────────────────────────────────────────────

def main():
    _clear()
    _camera()

    # ── Catenoid + associate family Shape Keys ───────────────────────────
    z_c = _cyl_grid(U_CATENOID, NU, NV)
    F1c, F2c, F3c = _antideriv_catenoid(z_c)
    thetas  = np.linspace(0.0, pi / 2, ASSOCIATE_N)
    xyz_fam = [_xyz(F1c, F2c, F3c, t) for t in thetas]
    labels  = [f"theta_{i:02d}" for i in range(ASSOCIATE_N)]

    cat_obj = _mesh_from_xyz("hf_catenoid", xyz_fam[0])
    cat_obj.location.x = -SEP_X
    _add_associate_keys(cat_obj, xyz_fam, labels)
    cat_obj.data.materials.append(_emission("mat_catenoid", COL_CATENOID))
    cat_obj["holoflow:facet"] = True

    # ── Helicoid (θ = π/2 endpoint) ──────────────────────────────────────
    heli_xyz = _xyz(F1c, F2c, F3c, pi / 2)
    heli_obj = _mesh_from_xyz("hf_helicoid", heli_xyz)
    heli_obj.location.x = 0.0
    heli_obj.data.materials.append(_emission("mat_helicoid", COL_HELICOID))
    heli_obj["holoflow:facet"] = True

    # ── Enneper surface ───────────────────────────────────────────────────
    # Square domain (not cylindrical): Enneper has no periodic parameter.
    z_e = _sq_grid(U_ENNEPER, NU, NV)
    F1e, F2e, F3e = _antideriv_enneper(z_e)
    enn_xyz = _xyz(F1e, F2e, F3e)
    enn_obj = _mesh_from_xyz("hf_enneper", enn_xyz, wrap_v=False)
    enn_obj.location.x = SEP_X
    enn_obj.data.materials.append(_emission("mat_enneper", COL_ENNEPER))
    enn_obj["holoflow:facet"] = True

    # ── EEVEE Next bloom ─────────────────────────────────────────────────
    bpy.context.scene.render.engine        = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.eevee.use_bloom      = True
    bpy.context.scene.eevee.bloom_threshold = 0.40
    bpy.context.scene.eevee.bloom_intensity = 0.22

    # ── GLB export ────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action='DESELECT')
    for obj in (cat_obj, heli_obj, enn_obj):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = cat_obj
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_PATH),
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_apply=True,
        export_yup=True,
    )
    print("✓ Exported →", OUTPUT_PATH)


main()
