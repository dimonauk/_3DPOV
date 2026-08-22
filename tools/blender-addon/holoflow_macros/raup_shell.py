"""
holoflow_macros.raup_shell
==========================
Reusable Raup helicoidal shell surface generator for Blender 5.1.

Exports
-------
raup_surface(W, D, T, N_TURNS, NQ, NP) → (X, Y, Z) ndarrays
build_raup_obj(W, D, T, *, name, N_TURNS, NQ, NP, scale_m) → bpy.types.Object

Usage in Blender Scripting workspace or from another macro:

    from holoflow_macros.raup_shell import build_raup_obj
    obj = build_raup_obj(2.5, 0.35, 0.08, name="nautilus_poi")

Licence: CC0 1.0 Universal — Holoflow Studio
"""

import bpy
import bmesh
import numpy as np


# ─── SURFACE ──────────────────────────────────────────────────────────────────
def raup_surface(
    W: float, D: float, T: float,
    N_TURNS: int = 3, NQ: int = 180, NP: int = 40,
) -> tuple:
    """
    Vectorised Raup (1966) helicoidal shell surface.

    Parameters
    ----------
    W       : whorl expansion rate (ratio of consecutive whorl radii / revolution)
    D       : umbilical ratio     (aperture_radius / aperture_centre_distance)
    T       : translation rate    (axial displacement per revolution)
    N_TURNS : helical revolutions to compute
    NQ      : theta resolution (along coiling direction)
    NP      : phi resolution   (around aperture cross-section)

    Returns
    -------
    X, Y, Z : ndarray, shape (NQ, NP) — raw normalised coordinates

    Surface equations:
        scale(θ) = W^(θ / 2π)
        x = scale · (1 + D·cos φ) · cos θ
        y = scale · (1 + D·cos φ) · sin θ
        z = scale · (D·sin φ  +  T·θ/2π)
    """
    theta = np.linspace(0.0, 2.0 * np.pi * N_TURNS, NQ)
    phi   = np.linspace(0.0, 2.0 * np.pi, NP, endpoint=False)
    TH, PH = np.meshgrid(theta, phi, indexing="ij")

    scale = W ** (TH / (2.0 * np.pi))
    X = scale * (1.0 + D * np.cos(PH)) * np.cos(TH)
    Y = scale * (1.0 + D * np.cos(PH)) * np.sin(TH)
    Z = scale * (D * np.sin(PH) + T * TH / (2.0 * np.pi))
    return X, Y, Z


# ─── MESH BUILDER ─────────────────────────────────────────────────────────────
def build_raup_obj(
    W: float, D: float, T: float,
    *,
    name: str = "raup_shell",
    N_TURNS: int = 3,
    NQ: int = 180,
    NP: int = 40,
    scale_m: float = 0.12,
) -> bpy.types.Object:
    """
    Build and link a Raup shell mesh object.  Returns the Object.

    The mesh is normalised so its maximum vertex distance from the origin equals
    scale_m (default 0.12 m, standard Holoflow poi head radius).  Flat shading
    is applied so each quad uses its own polygon normal — matching the studio's
    faceted low-poly aesthetic.  The spiral axis is rotated to +Y (Holoflow up).
    """
    X, Y, Z = raup_surface(W, D, T, N_TURNS, NQ, NP)
    r_max = np.sqrt(X**2 + Y**2 + Z**2).max()
    s = scale_m / max(r_max, 1e-9)
    coords = np.stack([X * s, Y * s, Z * s], axis=-1).reshape(-1, 3)

    bm = bmesh.new()
    for co in coords:
        bm.verts.new(tuple(co))
    bm.verts.ensure_lookup_table()

    for i in range(NQ - 1):
        for j in range(NP):
            j1 = (j + 1) % NP
            bm.faces.new([
                bm.verts[i * NP + j],
                bm.verts[i * NP + j1],
                bm.verts[(i + 1) * NP + j1],
                bm.verts[(i + 1) * NP + j],
            ])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(f"{name}_mesh")
    bm.to_mesh(me)
    bm.free()

    me.use_auto_smooth = False
    for p in me.polygons:
        p.use_smooth = False

    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)

    # Align coiling axis to +Y (Holoflow convention)
    import mathutils
    obj.rotation_euler = (mathutils.pi / -2.0, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    return obj
