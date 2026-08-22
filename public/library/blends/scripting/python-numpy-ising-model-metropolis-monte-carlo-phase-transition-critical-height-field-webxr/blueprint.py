"""
2D Ising Model — Metropolis Monte Carlo  (Blender 5.1)
=======================================================
The 2D square-lattice Ising model assigns a spin σᵢ ∈ {-1, +1} to every site.
The Hamiltonian is H = -J Σ σᵢσⱼ (nearest-neighbour pairs, J=1).
Lars Onsager solved it exactly in 1944: the ferromagnetic–paramagnetic phase
transition occurs at Tc = 2J / (kB · ln(1+√2)) ≈ 2.2692.

Below Tc large domains of aligned spins form; at Tc domain clusters appear at
every length scale (fractal / self-similar); above Tc the lattice is disordered.
This blueprint captures all three regimes as Blender shape keys on a 64×64
height-field grid and exports a Draco-6 GLB for WebXR stage use.

Algorithm:  checkerboard (bipartite) Metropolis-Hastings — all sites of the same
sublattice share no nearest neighbours, so a whole sublattice can be updated in
a single vectorised numpy pass without violating detailed balance.

Outside sources:
  Onsager L 1944 Phys Rev 65 117–149  (exact Tc, mathematical content PD)
  Metropolis N et al 1953 J Chem Phys 21 1087  (algorithm, mathematical content PD)
  NumPy — BSD-3-Clause  https://numpy.org
"""

import bpy
import numpy as np

# ── Parameters ─────────────────────────────────────────────────────────────────
N           = 64            # grid edge: N×N = 4096 spins
J           = 1.0           # exchange coupling (sets energy scale)
KB          = 1.0           # Boltzmann constant (same units as J)
TC          = 2.0 / np.log(1.0 + np.sqrt(2.0))   # Onsager 1944 ≈ 2.2692
T_HIGH      = 4.0           # > Tc: disordered / paramagnetic
T_CRIT      = TC            # ≈ Tc: critical fluctuations (fractal domains)
T_LOW       = 1.0           # < Tc: ordered / ferromagnetic

SPACING     = 0.1           # metres between adjacent vertices
Z_AMP       = 0.08          # metres — half-range of height displacement
N_EQUIL     = 2000          # Metropolis sweeps: equilibration per temperature
N_PROD      = 400           # sweeps: production (final snapshot)
SEED        = 42

OBJ_NAME    = "hf_ising_floor"
GLB_PATH    = "//hf_ising_floor.glb"

# Checkerboard sublattice masks — precomputed once (black/white chessboard sites)
# Sites of the same colour share no nearest neighbours, enabling parallel updates.
_ii, _jj = np.indices((N, N))
_MASKS = {c: (_ii[(_ii + _jj) % 2 == c], _jj[(_ii + _jj) % 2 == c])
          for c in (0, 1)}

# ── Metropolis simulation ───────────────────────────────────────────────────────
def _sweep(spins: np.ndarray, T: float, rng: np.random.Generator) -> None:
    """One checkerboard sweep: update both sublattices in sequence."""
    beta = 1.0 / (KB * T)
    for colour in (0, 1):
        i_, j_ = _MASKS[colour]
        # nearest-neighbour sum with periodic boundary conditions
        nb = (spins[(i_ - 1) % N, j_] + spins[(i_ + 1) % N, j_] +
              spins[i_, (j_ - 1) % N] + spins[i_, (j_ + 1) % N])
        # energy cost of flipping σᵢ: ΔE = 2Jσᵢ(Σneighbours)
        dE = (2.0 * J) * spins[i_, j_].astype(np.float32) * nb
        # Metropolis criterion: clip dE at 0 so exp argument is always ≤ 0
        prob = np.where(dE <= 0.0, 1.0, np.exp(-beta * np.maximum(dE, 0.0)))
        flip = rng.random(len(i_), dtype=np.float32) < prob
        spins[i_, j_] = np.where(flip, -spins[i_, j_], spins[i_, j_]).astype(np.int8)


def _run(T: float, rng: np.random.Generator) -> np.ndarray:
    """Equilibrate then snapshot at temperature T."""
    spins = rng.choice(np.array([-1, 1], dtype=np.int8), size=(N, N))
    for _ in range(N_EQUIL):
        _sweep(spins, T, rng)
    for _ in range(N_PROD):
        _sweep(spins, T, rng)
    return spins.copy()


# ── Geometry helpers ────────────────────────────────────────────────────────────
def _positions(spins: np.ndarray) -> np.ndarray:
    """Map N×N spin lattice → flat (N², 3) float32 vertex positions."""
    x = (_ii * SPACING).ravel().astype(np.float32)
    y = (_jj * SPACING).ravel().astype(np.float32)
    z = spins.ravel().astype(np.float32) * Z_AMP
    return np.stack([x, y, z], axis=1)   # shape (N*N, 3)


def _quad_faces() -> list:
    """(N-1)² quads, row-major vertex index v(i,j) = i*N + j."""
    faces = []
    for i in range(N - 1):
        for j in range(N - 1):
            v00 = i * N + j
            faces.append((v00, v00 + N, v00 + N + 1, v00 + 1))
    return faces


def _vert_colours(spins: np.ndarray) -> np.ndarray:
    """±1 spins → linear RGBA float array: +1=electric blue, −1=hot magenta."""
    flat = spins.ravel()
    col = np.zeros((len(flat), 4), dtype=np.float32)
    col[flat > 0] = [0.05, 0.35, 1.00, 1.0]   # spin-up: deep blue
    col[flat < 0] = [1.00, 0.05, 0.45, 1.0]   # spin-down: hot magenta
    return col


# ── Blender mesh + material ─────────────────────────────────────────────────────
def build_scene(sp_high: np.ndarray, sp_crit: np.ndarray, sp_low: np.ndarray) -> bpy.types.Object:
    # clean slate
    for name in (OBJ_NAME,):
        if name in bpy.data.objects:
            bpy.data.objects[name].select_set(True)
    bpy.ops.object.select_all(action="DESELECT")
    if OBJ_NAME in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[OBJ_NAME], do_unlink=True)
    if OBJ_NAME in bpy.data.meshes:
        bpy.data.meshes.remove(bpy.data.meshes[OBJ_NAME])

    verts_high = _positions(sp_high)
    verts_crit = _positions(sp_crit)
    verts_low  = _positions(sp_low)
    faces      = _quad_faces()

    # mesh from high-T state (basis shape)
    me = bpy.data.meshes.new(OBJ_NAME)
    me.from_pydata(verts_high.tolist(), [], faces)
    me.update()

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)

    # shape keys: Basis (T_high) → T_crit → T_low
    obj.shape_key_add(name="Basis", from_mix=False)
    sk_crit = obj.shape_key_add(name="T_crit",  from_mix=False)
    sk_low  = obj.shape_key_add(name="T_low",   from_mix=False)
    sk_crit.data.foreach_set("co", verts_crit.flatten().tolist())
    sk_low.data.foreach_set("co",  verts_low.flatten().tolist())
    me.update()

    # vertex colour attribute from critical state (most visually rich)
    attr = me.color_attributes.new("spin_colour", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", _vert_colours(sp_crit).flatten().tolist())

    # emission material: attribute colour → emission
    mat = bpy.data.materials.new("ising_emit")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    atn  = nt.nodes.new("ShaderNodeAttribute")
    atn.attribute_name = "spin_colour"
    emit.inputs["Strength"].default_value = 2.0
    nt.links.new(atn.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    me.materials.append(mat)

    # consistent normals
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    return obj


# ── GLB export ──────────────────────────────────────────────────────────────────
def export_glb(obj: bpy.types.Object, path: str) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(path),
        use_selection                        = True,
        export_format                        = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
        export_apply                         = True,
        export_morph                         = True,
        export_colors                        = True,
    )


# ── Main ────────────────────────────────────────────────────────────────────────
def main() -> None:
    print(f"[ising] Tc (Onsager 1944) = {TC:.6f}")
    rng = np.random.default_rng(SEED)

    print(f"[ising] T_high = {T_HIGH:.3f}  (paramagnetic) …")
    sp_high = _run(T_HIGH, rng)

    print(f"[ising] T_crit = {T_CRIT:.4f} (critical)      …")
    sp_crit = _run(T_CRIT, rng)

    print(f"[ising] T_low  = {T_LOW:.3f}  (ferromagnetic) …")
    sp_low  = _run(T_LOW,  rng)

    magnetisation = {
        "high": float(sp_high.mean()),
        "crit": float(sp_crit.mean()),
        "low":  float(sp_low.mean()),
    }
    print(f"[ising] mean magnetisation: {magnetisation}")

    print("[ising] building mesh …")
    obj = build_scene(sp_high, sp_crit, sp_low)

    print("[ising] exporting GLB …")
    export_glb(obj, GLB_PATH)
    print(f"[ising] ✓ exported {GLB_PATH}")


if __name__ == "__main__":
    main()
