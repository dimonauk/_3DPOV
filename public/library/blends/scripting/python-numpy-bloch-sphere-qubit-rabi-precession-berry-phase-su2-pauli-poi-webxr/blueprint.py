# SPDX-License-Identifier: CC0-1.0
"""
Bloch Sphere — Qubit Pure-State Geometry (Bloch 1946 / Feynman–Vernon–Hellwarth 1957)
======================================================================================
Holoflow Studio · Blender 5.1 tutorial

Every pure state of a qubit is a point on S², the Bloch sphere.
The Bloch vector r = (⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩) has |r| = 1 for pure states.
Under H = ω/2 · (n̂·σ), r precesses around n̂ at angular frequency ω (Rabi frequency).
This blueprint builds THREE closed paths on S² as POLY bevel-tube shape keys:

  Basis       — Rabi great circle in the y-z plane: one full 2π precession
                about the x-axis starting and ending at |0⟩ = (0,0,1).

  SK_Berry    — Adiabatic Berry phase loop at BERRY_THETA = 60° colatitude.
                Solid angle Ω_c = 2π(1−cos 60°) = π; geometric phase γ = −π/2.
                The loop is traced counterclockwise viewed from the north pole,
                accumulating a measurable phase without any dynamic contribution.

  SK_DoubleLoop — Spinor double-cover demonstration (SU(2) → SO(3)).
                First arc: |0⟩ → |1⟩ in the y-z plane (σ_y rotation).
                Second arc: |1⟩ → |0⟩ in the x-z plane (σ_x rotation).
                One 2π Hamiltonian rotation traces BOTH arcs on the Bloch sphere —
                the qubit acquires phase −1 and requires a 4π rotation to return
                to its initial Hilbert-space state.

References
----------
Bloch F (1946) Nuclear Induction. Phys Rev 70:460–474
Berry M V (1984) Quantal Phase Factors. Proc Roy Soc A 392:45–57
Feynman R P, Vernon F L, Hellwarth R W (1957) J Appl Phys 28:49–52

Cross-references (Holoflow Studio library)
------------------------------------------
/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr
/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr
/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr
/tutorials/blender-tutorial-python-numpy-villarceau-circles-torus-hopf-fiber-interlocked-poi-head-webxr
/tutorials/blender-tutorial-python-numpy-quaternion-julia-set-4d-hyperplane-sweep-de-height-field-webxr
"""

import math
import numpy as np
import bpy
from pathlib import Path

# ── Parameters ───────────────────────────────────────────────────────────────
# Bloch sphere geometry
SPHERE_R     = 0.100          # sphere radius in metres; all paths lie on this sphere
TUBE_R       = 0.006          # POLY bevel radius — visible but non-bulky
TUBE_RES     = 3              # bevel_resolution → 2^(3+1) = 16-sided tube
N_TRAJ       = 360            # sample count for each closed path (1°/sample)

# Berry phase loop parameter
BERRY_THETA  = math.pi / 3   # 60° colatitude; Ω_c = 2π(1−cos 60°) = π; γ = −π/2

# Emission colour — cobalt (cool quantum blue, aligns with north-pole |0⟩)
COBALT = (0.08, 0.38, 0.80, 1.0)

OBJ_NAME = "Bloch_Trajectory"
LICENCE  = "CC0"


# ── Path generators ──────────────────────────────────────────────────────────

def _rabi_great_circle() -> np.ndarray:
    """
    Rabi precession about the x-axis.
    H = Ω/2 · σ_x  →  ṙ = ω × r,  ω = (Ω, 0, 0).
    Starting from |0⟩ = (0,0,1): r(t) = (0, −sin t, cos t).
    One complete 2π orbit; closed because r(0) = r(2π) = (0,0,1).
    """
    t = np.linspace(0.0, 2.0 * math.pi, N_TRAJ, endpoint=False)
    return np.column_stack([np.zeros(N_TRAJ), -np.sin(t), np.cos(t)]) * SPHERE_R


def _berry_latitude_circle() -> np.ndarray:
    """
    Adiabatic Berry phase loop at colatitude BERRY_THETA = π/3 (60°).
    When the Hamiltonian direction slowly traces this circle on S², the qubit
    accumulates a purely GEOMETRIC phase γ = −Ω_c/2 = −π/2 on top of any
    dynamic phase — independent of how slowly the loop is traversed.
    r(φ) = (sin θ₀ cos φ, sin θ₀ sin φ, cos θ₀);  θ₀ = π/3.
    """
    phi    = np.linspace(0.0, 2.0 * math.pi, N_TRAJ, endpoint=False)
    sin_t  = math.sin(BERRY_THETA)   # √3/2 ≈ 0.866
    cos_t  = math.cos(BERRY_THETA)   # 0.5  (Berry height above equator)
    return np.column_stack([
        sin_t * np.cos(phi),
        sin_t * np.sin(phi),
        cos_t * np.ones(N_TRAJ),
    ]) * SPHERE_R


def _double_loop() -> np.ndarray:
    """
    Spinor double-cover path: two great-circle arcs, together forming ONE
    2π Hamiltonian rotation that traverses the Bloch sphere TWICE (topologically).

    Arc 1  (first N//2 points):  |0⟩ → |1⟩  in the y-z plane
           r(t) = (0, −sin t, cos t),  t ∈ [0, π)
    Arc 2  (second N//2 points): |1⟩ → |0⟩  in the x-z plane
           r(α) = (sin α, 0, −cos α),  α ∈ [0, π)

    At the junction (t=α=0 for arc 2): (0, 0, −1) = south pole ✓
    At closure (α → π): (0, 0, 1) = north pole ✓ (connects back to arc 1 start).
    The seam demonstrates that SU(2) ≅ S³ double-covers SO(3) ≅ RP³:
    a physical 2π rotation returns the Bloch vector to (0,0,1) but multiplies
    the spinor by −1 — requiring 4π to restore the full quantum state.
    """
    half = N_TRAJ // 2
    t1   = np.linspace(0.0, math.pi, half, endpoint=False)  # arc 1: [0, π)
    t2   = np.linspace(0.0, math.pi, half, endpoint=False)  # arc 2: [0, π)

    r1 = np.column_stack([np.zeros(half),  -np.sin(t1),  np.cos(t1)])
    r2 = np.column_stack([np.sin(t2),       np.zeros(half), -np.cos(t2)])

    return np.vstack([r1, r2]) * SPHERE_R


# ── Scene helpers ─────────────────────────────────────────────────────────────

def _clear() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def _emission_material(name: str, colour: tuple) -> bpy.types.Material:
    """Emission shader — suitable for viewport rendering and GLB export."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = colour
    emit.inputs["Strength"].default_value = 2.8
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def _build_poly_tube(pts: np.ndarray, name: str):
    """
    Build a closed POLY bevel curve from (N, 3) world-space points.
    use_cyclic_u = True closes the last point back to the first,
    producing a seamless ring tube.
    """
    crv = bpy.data.curves.new(name, "CURVE")
    crv.dimensions       = "3D"
    crv.bevel_mode       = "ROUND"
    crv.bevel_depth      = TUBE_R
    crv.bevel_resolution = TUBE_RES
    crv.use_fill_caps    = True

    spl = crv.splines.new("POLY")
    spl.use_cyclic_u = True                        # close the loop
    spl.points.add(len(pts) - 1)                   # one point already exists
    flat = np.ones((len(pts), 4), dtype=float)     # homogeneous: w = 1
    flat[:, :3] = pts
    spl.points.foreach_set("co", flat.ravel())

    obj = bpy.data.objects.new(name, crv)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _add_shape_key(obj: bpy.types.Object, pts: np.ndarray, key_name: str) -> None:
    """
    Append a shape-key deformation target to a POLY curve object.
    ShapeKeyCurvePoint.co is a 3-vector (NOT a 4-vector like spline.points.co).
    The Basis key is auto-created on the first call, capturing the current spline.
    """
    if obj.data.shape_keys is None:
        obj.shape_key_add(name="Basis", from_mix=False)
    sk = obj.shape_key_add(name=key_name, from_mix=False)
    for i, p in enumerate(pts):
        sk.data[i].co = p.tolist()   # must be list, not ndarray
    sk.value = 0.0


def _export_glb(obj: bpy.types.Object, path: Path) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_morph=True,
        export_apply=False,
    )


# ── Main build ────────────────────────────────────────────────────────────────

def build():
    _clear()

    # ── 1. Compute the three closed paths ────────────────────────────────
    pts_rabi   = _rabi_great_circle()      # Basis  — Rabi precession
    pts_berry  = _berry_latitude_circle()  # SK_Berry — geometric phase loop
    pts_double = _double_loop()            # SK_DoubleLoop — spinor 4π demonstration

    # ── 2. Build POLY tube from the Rabi basis path ──────────────────────
    obj = _build_poly_tube(pts_rabi, OBJ_NAME)
    obj.data.materials.append(_emission_material("mat_bloch_cobalt", COBALT))
    obj["holoflow:facet"] = False   # smooth curved tube; faceting is for flat-shaded meshes

    # ── 3. Shape keys ─────────────────────────────────────────────────────
    # _add_shape_key creates 'Basis' automatically on first call (mirrors pts_rabi)
    _add_shape_key(obj, pts_berry,  "SK_Berry")
    _add_shape_key(obj, pts_double, "SK_DoubleLoop")

    # ── 4. Export GLB ─────────────────────────────────────────────────────
    glb_path = (
        Path(bpy.data.filepath).parent / "hf_bloch_poi.glb"
        if bpy.data.filepath
        else Path("/tmp/hf_bloch_poi.glb")
    )
    print(f"[Bloch] Exporting GLB → {glb_path}")
    _export_glb(obj, glb_path)

    print(
        f"[Bloch] Done — {N_TRAJ} pts per path · sphere r={SPHERE_R} m · "
        f"tube r={TUBE_R} m · paths: Basis/SK_Berry/SK_DoubleLoop"
    )
    return obj


if __name__ == "__main__":
    build()
