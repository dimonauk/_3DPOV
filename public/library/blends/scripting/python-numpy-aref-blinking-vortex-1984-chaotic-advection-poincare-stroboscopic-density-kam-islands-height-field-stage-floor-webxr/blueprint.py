"""
Aref Blinking Vortex — Chaotic Advection, Poincaré Stroboscopic Density Map
=============================================================================
Hassan Aref, "Stirring by chaotic advection," J. Fluid Mech. 143, 1–21 (1984).
Blender 5.1 blueprint — CC0 / no rights reserved

TECHNIQUE
---------
Two point vortices at (±a, 0) in the 2-D plane alternate with period T.
Each vortex is "on" for T/2; during that half-period every fluid particle
executes a PURE CIRCULAR ARC about the active vortex (radius conserved,
angle advances by ΔΘ = Γ·(T/2)/(2π·r²)).  The full-period map M = M₂ ∘ M₁
is area-preserving (Hamiltonian).  Ten thousand particles are seeded on a
grid, iterated for 300 periods, and their trajectory density is binned into
a 120×120 height field that is extruded as a WebXR stage floor.

WHY THIS IS FOUNDATIONAL
------------------------
The blinking vortex was the FIRST published system to show that a
non-turbulent, time-periodic, 2-D velocity field produces CHAOTIC particle
paths — Aref coined the term "chaotic advection" in this paper.  Before
1984, mixing was associated with turbulence.  Here the Eulerian flow is
smooth and periodic; the Lagrangian (particle) dynamics is chaotic.

The system is Hamiltonian (stream-function ψ = −Γ/(2π)·log(r) for each
half-period), so Liouville's theorem holds: no attractors exist.  The
density map reveals the coexistence of KAM islands (invariant tori that
particles cannot cross) and chaotic seas (where mixing is exponentially
fast).  As μ = ΓT/(2πa²) increases, islands break down via the
Poincaré–Birkhoff theorem and KAM cascade.

EXACT HALF-PERIOD MAP
---------------------
Active vortex at (v, 0) with circulation Γ, time τ = T/2:
    r² = (x−v)² + y²          [conserved]
    ΔΘ = Γ·τ / (2π·r²)       [angular advance]
    x′ = v + r·cos(θ + ΔΘ)
    y′ =     r·sin(θ + ΔΘ)

Full-period map:  M₂ ∘ M₁ (each computed exactly, no RK4 needed).

LYAPUNOV / CHAOS INDICATOR
---------------------------
The finite-time Lyapunov exponent (FTLE) from two nearby trajectories
grows like λ ≈ log(ΔΘ_max / ΔΘ_0) / (N·T).  Inside KAM tori λ → 0;
in the chaotic sea λ > 0.  The density map is a proxy: a particle in the
chaotic sea visits many cells (high global density); a particle on a
KAM torus traces a closed curve (narrow ring pattern).

SHAPE KEYS — μ SCAN
--------------------
μ = ΓT/(2πa²) is the single dimensionless control parameter:
  Basis      μ=4.0  canonical chaos — partial islands, partial sea
  SK_Ordered μ=1.5  KAM-dominated — concentric rings, tiny chaotic zone
  SK_Islands μ=3.0  island chains — Poincaré–Birkhoff resonances visible
  SK_Turbulent μ=7.0 mostly ergodic — islands almost gone, flat density

References:
    Aref, H. (1984). Stirring by chaotic advection.
    J. Fluid Mech. 143, 1–21. DOI: 10.1017/S0022112084001233
    Mathematical formulation: public domain (physical law).

    Aref, H. (2002). The development of chaotic advection.
    Phys. Fluids 14(4), 1315–1325. DOI: 10.1063/1.1458932
    (Free to read via AIP.)

    Ottino, J.M. (1989). The Kinematics of Mixing: Stretching, Chaos and
    Transport. Cambridge University Press. ISBN 0-521-36878-2.
    (Standard textbook — cited, not linked.)
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ── Parameters ──────────────────────────────────────────────────────────────
A          = 0.5        # vortex half-separation (Blender units)
GAMMA      = np.pi      # circulation Γ — choice makes T = μ/2 cleanly

# μ = ΓT/(2πa²): full-period map control parameter
MU_SETS = {
    "Basis":       4.0,   # canonical — coexisting KAM islands and chaotic sea
    "SK_Ordered":  1.5,   # near-integrable — tori dominate
    "SK_Islands":  3.0,   # Poincaré–Birkhoff island chains prominent
    "SK_Turbulent": 7.0,  # ergodic — density nearly uniform
}

N_PARTICLES = 9801   # 99×99 regular grid (≈ 10k)
N_PERIODS   = 300    # stroboscopic periods to integrate per particle
R_ESCAPE    = 3.5    # max radius — escaped particles excluded from density

GRID_N    = 120      # density grid resolution in each axis
GRID_LIM  = 2.5      # domain: [−GRID_LIM, +GRID_LIM]²

COLOUR_LO = (0.027, 0.159, 0.557)   # cobalt blue  — low visit count
COLOUR_HI = (0.950, 0.600, 0.000)   # amber         — high visit count

MESH_NAME = "aref_blinking_vortex_floor"
OBJ_NAME  = "Aref_BlinkingVortex_Floor"


# ── Core physics ─────────────────────────────────────────────────────────────

def _half_map(x: np.ndarray, y: np.ndarray,
              vx: float, vy: float,
              half_tau: float) -> tuple[np.ndarray, np.ndarray]:
    """Exact half-period map: rotate each particle about (vx, vy).

    Point vortex at (vx, vy) with circulation Γ induces purely azimuthal
    velocity u_θ = Γ/(2π·r).  Radial distance r is conserved; θ advances
    by ΔΘ = Γ·τ/(2π·r²) where τ = half_tau.
    """
    dx = x - vx
    dy = y - vy
    r2 = dx * dx + dy * dy
    # Guard: singularity at the vortex centre (measure-zero event)
    r2 = np.where(r2 < 1e-14, 1e-14, r2)
    delta_theta = GAMMA * half_tau / (2.0 * np.pi * r2)
    c, s = np.cos(delta_theta), np.sin(delta_theta)
    return vx + c * dx - s * dy, vy + s * dx + c * dy


def _run_density(mu: float) -> np.ndarray:
    """Integrate the blinking-vortex stroboscopic map for μ=mu.

    Returns a (GRID_N, GRID_N) array of log(1+visit_count).
    """
    # T = μ·2πa²/Γ; with Γ=π, a=0.5 → T = μ·0.5; half_tau = μ·0.25
    half_tau = mu * 2.0 * np.pi * A * A / (2.0 * GAMMA)

    # Seed particles on a regular grid inside [−2, 2]²
    n_side = int(np.sqrt(N_PARTICLES))
    gv = np.linspace(-2.0, 2.0, n_side)
    xx, yy = np.meshgrid(gv, gv)
    x = xx.ravel().copy()
    y = yy.ravel().copy()

    density = np.zeros((GRID_N, GRID_N), dtype=np.float64)
    cell = 2.0 * GRID_LIM / GRID_N    # cell width
    alive = np.ones(len(x), dtype=bool)

    for _ in range(N_PERIODS):
        # Phase 1: vortex on at (+A, 0)
        x, y = _half_map(x, y, A, 0.0, half_tau)
        # Phase 2: vortex on at (−A, 0)
        x, y = _half_map(x, y, -A, 0.0, half_tau)

        # Retire escaped particles (they are no longer physically meaningful)
        alive &= (x * x + y * y < R_ESCAPE * R_ESCAPE)
        if not np.any(alive):
            break

        # Accumulate density for alive particles
        xi = ((x[alive] + GRID_LIM) / cell).astype(int)
        yi = ((y[alive] + GRID_LIM) / cell).astype(int)
        valid = (xi >= 0) & (xi < GRID_N) & (yi >= 0) & (yi < GRID_N)
        np.add.at(density, (yi[valid], xi[valid]), 1.0)

    return np.log1p(density)


# ── Mesh helpers ──────────────────────────────────────────────────────────────

def _clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)


def _build_mesh(heights: np.ndarray) -> bpy.types.Object:
    """Create a GRID_N×GRID_N mesh from the density heights array."""
    me = bpy.data.meshes.new(MESH_NAME)
    bm = bmesh.new()

    cell = 2.0 * GRID_LIM / GRID_N
    verts = []
    for j in range(GRID_N):          # row (y)
        row = []
        for i in range(GRID_N):      # col (x)
            px = -GRID_LIM + (i + 0.5) * cell
            py = -GRID_LIM + (j + 0.5) * cell
            pz = float(heights[j, i])
            row.append(bm.verts.new((px, py, pz)))
        verts.append(row)

    bm.verts.ensure_lookup_table()

    for j in range(GRID_N - 1):
        for i in range(GRID_N - 1):
            bm.faces.new([
                verts[j][i], verts[j][i + 1],
                verts[j + 1][i + 1], verts[j + 1][i],
            ])

    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    return ob


def _add_shape_key(ob: bpy.types.Object,
                   name: str,
                   heights: np.ndarray) -> None:
    """Add a shape key that replaces z-heights with a new density field."""
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.interpolation = "KEY_LINEAR"
    flat = heights.ravel()
    for idx, v in enumerate(sk.data):
        v.co.z = float(flat[idx])


def _assign_material(ob: bpy.types.Object,
                     heights_basis: np.ndarray) -> None:
    """FLOAT_COLOR attribute coloured by visit density (cobalt→amber)."""
    me = ob.data
    me.attributes.new("BV_Density", "FLOAT_COLOR", "POINT")
    col_attr = me.attributes["BV_Density"]

    flat = heights_basis.ravel()
    norm = flat / flat.max() if flat.max() > 0 else flat
    lo = np.array(COLOUR_LO, dtype=float)
    hi = np.array(COLOUR_HI, dtype=float)

    for i, t in enumerate(norm):
        c = lo + t * (hi - lo)
        col_attr.data[i].color = (*c, 1.0)

    mat = bpy.data.materials.new("Mat_BlinkingVortex")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    attr  = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "BV_Density"
    bsdf  = nodes.new("ShaderNodeBsdfPrincipled")
    out   = nodes.new("ShaderNodeOutputMaterial")
    links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    ob.data.materials.append(mat)


# ── Camera & lighting ─────────────────────────────────────────────────────────

def _setup_camera() -> None:
    bpy.ops.object.camera_add(location=(0.0, -7.5, 5.5),
                              rotation=(np.radians(55), 0, 0))
    bpy.context.scene.camera = bpy.context.active_object


def _setup_lighting() -> None:
    bpy.ops.object.light_add(type="SUN",
                             location=(4.0, -4.0, 8.0))
    bpy.context.active_object.data.energy = 3.0


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    _clear_scene()

    # Compute density maps for all shape-key sets
    print("[BlinkingVortex] Computing density maps …")
    density_maps: dict[str, np.ndarray] = {}
    for label, mu in MU_SETS.items():
        print(f"  μ = {mu} ({label}) …")
        density_maps[label] = _run_density(mu)

    # Normalise heights globally (so all shape keys share a common scale)
    all_max = max(d.max() for d in density_maps.values())
    for k in density_maps:
        density_maps[k] = density_maps[k] / all_max if all_max > 0 else density_maps[k]

    # Build mesh from the Basis density field
    ob = _build_mesh(density_maps["Basis"])

    # Add Basis shape key, then shape keys for each variant
    ob.shape_key_add(name="Basis", from_mix=False)
    for sk_name, heights in density_maps.items():
        if sk_name == "Basis":
            continue
        _add_shape_key(ob, sk_name, heights)

    # Colour by Basis density
    _assign_material(ob, density_maps["Basis"])

    _setup_camera()
    _setup_lighting()

    # Export GLB
    bpy.ops.export_scene.gltf(
        filepath="//aref_blinking_vortex_floor.glb",
        export_format="GLB",
        export_apply=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print("[BlinkingVortex] Done — aref_blinking_vortex_floor.glb written.")


if __name__ == "__main__":
    main()
