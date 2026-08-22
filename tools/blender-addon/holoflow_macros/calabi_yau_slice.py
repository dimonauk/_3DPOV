"""
holoflow_macros/calabi_yau_slice.py
====================================
Reusable macro: build a Blender mesh from any degree-d Fermat curve
    z₁^d + z₂^d = 1
projected to ℝ³ via (Re z₁, Im z₁, Re z₂), with all d analytic branches.

Usage (in a Blender Python session)::

    import importlib, sys
    sys.path.insert(0, "/path/to/tools/blender-addon")
    from holoflow_macros.calabi_yau_slice import build_fermat_curve_mesh

    obj = build_fermat_curve_mesh(
        degree=5,
        u_steps=100,
        v_steps=100,
        r_max=0.97,
        export_scale=0.05,
        name="my_cy_obj",
    )

Returns the Blender object linked into the active collection.
"""

import bpy
import numpy as np

# Studio palette — cycles through DEGREE sheets
_DEFAULT_COLOURS = [
    (0.95, 0.65, 0.10, 1.0),
    (0.85, 0.25, 0.55, 1.0),
    (0.10, 0.65, 0.95, 1.0),
    (0.40, 0.85, 0.30, 1.0),
    (0.65, 0.20, 0.90, 1.0),
    (0.80, 0.80, 0.20, 1.0),
    (0.20, 0.80, 0.80, 1.0),
]


def build_fermat_curve_mesh(
    degree: int = 5,
    u_steps: int = 100,
    v_steps: int = 100,
    r_max: float = 0.97,
    export_scale: float = 0.05,
    name: str = "fermat_curve",
    colours: list | None = None,
    auto_smooth_angle: float = 0.5236,   # 30° in radians
) -> bpy.types.Object:
    """
    Build a mesh from the Fermat curve z₁^d + z₂^d = 1.

    Parameters
    ----------
    degree : int
        Degree d of the Fermat curve.  5 gives the Calabi-Yau quintic slice.
    u_steps, v_steps : int
        Grid resolution (radial × angular) per sheet.
    r_max : float
        Maximum |z₁|.  Stay below 1.0 to avoid the branch-cut singularity.
    export_scale : float
        Radius of the normalised bounding sphere in metres.
    name : str
        Name given to the Blender mesh and object.
    colours : list | None
        List of RGBA tuples, one per sheet.  Cycles if shorter than degree.
        Defaults to the studio palette.
    auto_smooth_angle : float
        Smooth-by-angle threshold in radians.

    Returns
    -------
    bpy.types.Object
        The newly created and linked Blender object.
    """

    if colours is None:
        colours = _DEFAULT_COLOURS

    # ── Parametric grid ──────────────────────────────────────────────────────
    u = np.linspace(0.0, r_max, u_steps)
    v = np.linspace(0.0, 2.0 * np.pi, v_steps, endpoint=False)
    UU, VV = np.meshgrid(u, v, indexing='ij')

    z1   = UU * np.exp(1j * VV)
    w    = 1.0 - z1 ** degree
    mag  = np.abs(w) ** (1.0 / degree)
    arg_ = np.angle(w)

    sheets = []
    for n in range(degree):
        z2 = mag * np.exp(1j * (arg_ + 2.0 * np.pi * n) / degree)
        sheets.append((
            np.real(z1).ravel(),
            np.imag(z1).ravel(),
            np.real(z2).ravel(),
        ))

    # Normalise to bounding sphere
    all_pts = np.concatenate([np.column_stack(s) for s in sheets])
    rmax_val = np.sqrt((all_pts ** 2).sum(axis=1)).max()
    sc = export_scale / max(rmax_val, 1e-9)

    # ── Blender mesh ─────────────────────────────────────────────────────────
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    verts, faces, vc = [], [], []
    base = 0
    for n, (xs, ys, zs) in enumerate(sheets):
        col = colours[n % len(colours)]
        for i in range(len(xs)):
            verts.append((xs[i] * sc, ys[i] * sc, zs[i] * sc))
            vc.append(col)
        for iu in range(u_steps - 1):
            for iv in range(v_steps - 1):
                a = base + iu * v_steps + iv
                faces.append((a, a + 1, a + v_steps + 1, a + v_steps))
        base += len(xs)

    mesh.from_pydata(verts, [], faces)
    mesh.update()

    attr = mesh.color_attributes.new("BranchColour", 'FLOAT_COLOR', 'POINT')
    for i, col in enumerate(vc):
        attr.data[i].color = col

    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth(
        use_auto_smooth=True,
        auto_smooth_angle=auto_smooth_angle,
    )

    return obj
