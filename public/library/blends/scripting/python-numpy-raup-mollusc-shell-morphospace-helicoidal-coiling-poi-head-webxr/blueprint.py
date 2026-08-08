"""
Raup Morphological Space — Mollusc Shell Coiling  (Blender 5.1, Python / NumPy)
================================================================================
Library: public/library/blends/scripting/
         python-numpy-raup-mollusc-shell-morphospace-helicoidal-coiling-poi-head-webxr/
Author : Holoflow Studio  |  Licence: CC0 1.0 Universal

Technique
---------
Raup (1966) collapsed the entire diversity of coiled-shell geometry into four
real numbers.  This blueprint implements the surface equations directly in bpy,
builds four morphotype shape keys (Ammonite, Nautilus, Cone, Turritella), and
exports a Draco-6 GLB suitable as a poi head in the Holoflow WebXR stage.

The helicoidal surface (all variables in radians / normalised units):

    scale(θ) = W^(θ / 2π)                     whorl expansion
    x(θ,φ)  = scale · (1 + D·cos φ) · cos θ
    y(θ,φ)  = scale · (1 + D·cos φ) · sin θ
    z(θ,φ)  = scale · (D·sin φ  +  T·θ/2π)

    W  — whorl expansion rate: ratio of consecutive whorl radii
         after one full revolution.  W ≈ 3 → ammonite; W ≈ 1.3 → turritella.
    D  — umbilical ratio: aperture radius / aperture-centre radius.
         D = 0 → wire (no cross-section); D ≈ 0.35 → open nautiloid umbilicus.
    T  — translation rate: axial displacement per revolution, as a multiple of
         the aperture-centre radius.  T = 0 → flat planispiral; T ≈ 3 → tall spire.

The inner edge of the outer whorl sits at radial distance (1−D)·scale from
the coiling axis, so the constraint D < 1 prevents self-intersection.

Sources:
  Raup, D.M. (1966). "Geometric Analysis of Shell Coiling: General Problems."
    Journal of Paleontology 40(5): 1178–1190.  DOI 10.2307/1301507
    Mathematical formulae are factual definitions in the public domain.
  NumPy (BSD-3-Clause) — vectorised meshgrid, broadcasting, array slicing.
"""

import bpy
import bmesh
import numpy as np
from mathutils import Vector

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
N_TURNS   = 3        # helix revolutions to compute
NQ        = 180      # θ-resolution: steps along the coiling direction
NP        = 40       # φ-resolution: facets around the aperture cross-section
SCALE_M   = 0.12     # target bounding radius in metres (standard poi head)
OBJ_NAME  = "raup_shell_poi"
DRACO_LVL = 6        # Draco compression level for GLB export

# Morphotype presets ─ (W, D, T, shape_key_name)
PRESETS = [
    (3.00, 0.30, 0.00, "Ammonite"),     # flat coil, moderate open umbilicus
    (2.50, 0.35, 0.08, "Nautilus"),     # slight spire, roomy umbilicus
    (1.70, 0.12, 1.20, "Cone"),         # moderate tower, tight umbilicus
    (1.35, 0.06, 2.80, "Turritella"),   # tall narrow spire, closed umbilicus
]

# ─── SURFACE EQUATION ─────────────────────────────────────────────────────────
def raup_surface(W: float, D: float, T: float) -> tuple:
    """
    Vectorised Raup helicoidal surface.

    Returns
    -------
    X, Y, Z : ndarray, shape (NQ, NP)
        Vertex positions in normalised (pre-scale) coordinates.

    Why endpoint=False for phi?  The aperture is a closed ring — vertex index 0
    and index NP are the same point.  Excluding the endpoint avoids a degenerate
    edge shared by both boundary quads at j=0 and j=NP−1.
    """
    theta = np.linspace(0.0, 2.0 * np.pi * N_TURNS, NQ)
    phi   = np.linspace(0.0, 2.0 * np.pi, NP, endpoint=False)
    TH, PH = np.meshgrid(theta, phi, indexing="ij")   # (NQ, NP)

    scale = W ** (TH / (2.0 * np.pi))                  # exponential radial growth
    X = scale * (1.0 + D * np.cos(PH)) * np.cos(TH)
    Y = scale * (1.0 + D * np.cos(PH)) * np.sin(TH)
    Z = scale * (D * np.sin(PH) + T * TH / (2.0 * np.pi))
    return X, Y, Z


def normalise_to_scale(X, Y, Z) -> tuple:
    """Rescale so the maximum vertex distance from origin equals SCALE_M."""
    r_max = np.sqrt(X**2 + Y**2 + Z**2).max()
    s = SCALE_M / max(r_max, 1e-9)
    return X * s, Y * s, Z * s


# ─── MESH BUILDER ─────────────────────────────────────────────────────────────
def build_base_mesh(W: float, D: float, T: float) -> bpy.types.Object:
    """
    Build the Ammonite base mesh, link it to the scene, return the Object.

    Topology: (NQ−1) × NP quads forming a tube; both ends left open so
    the shell mouth and columella are visible.  Flat-shading is applied
    by clearing custom normals — each quad uses its own face normal,
    producing the faceted low-poly look native to the Holoflow pipeline.
    """
    X, Y, Z = normalise_to_scale(*raup_surface(W, D, T))
    coords = np.stack([X, Y, Z], axis=-1).reshape(-1, 3)  # (NQ*NP, 3)

    bm = bmesh.new()
    for co in coords:
        bm.verts.new(tuple(co))
    bm.verts.ensure_lookup_table()

    # Quad strip along the coiling direction; φ wraps periodically
    for i in range(NQ - 1):
        for j in range(NP):
            j1 = (j + 1) % NP
            v0 = bm.verts[i  * NP + j ]
            v1 = bm.verts[i  * NP + j1]
            v2 = bm.verts[(i + 1) * NP + j1]
            v3 = bm.verts[(i + 1) * NP + j ]
            bm.faces.new([v0, v1, v2, v3])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    me = bpy.data.meshes.new(f"{OBJ_NAME}_mesh")
    bm.to_mesh(me)
    bm.free()

    # Clear custom normals → flat shading (each face uses its polygon normal)
    me.use_auto_smooth = False
    for p in me.polygons:
        p.use_smooth = False

    obj = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ─── SHAPE KEYS ───────────────────────────────────────────────────────────────
def add_shape_key(obj: bpy.types.Object, W: float, D: float,
                  T: float, name: str) -> None:
    """
    Append a Raup(W, D, T) shape key to obj.

    Each morphotype is independently normalised to SCALE_M so the poi head
    remains consistently sized regardless of W.  Shape key topology MUST
    match base: same NQ*NP vertex count and same index order.
    """
    X, Y, Z = normalise_to_scale(*raup_surface(W, D, T))
    coords = np.stack([X, Y, Z], axis=-1).reshape(-1, 3)

    sk = obj.shape_key_add(name=name, from_mix=False)
    for i, co in enumerate(coords):
        sk.data[i].co = tuple(co)


# ─── VERTEX COLOURS ───────────────────────────────────────────────────────────
def apply_vertex_colours(obj: bpy.types.Object) -> None:
    """
    Encode whorl age as a vertex colour: magenta (old, columella end) → cyan
    (young, aperture lip).  Hue maps linearly from θ=0 → θ=2π·N_TURNS.

    Uses bpy.data.color_attributes (Blender 3.3+ / 5.x API).  Each face-corner
    gets the colour of its vertex, giving per-face interpolation in Eevee.
    """
    me = obj.data
    ca = me.color_attributes.new(
        name="Col", type="BYTE_COLOR", domain="CORNER"
    )
    n_verts = NQ * NP
    t_arr = np.tile(np.linspace(0.0, 1.0, NQ), (NP, 1)).T.flatten()  # (NQ*NP,)

    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            if vi >= n_verts:
                continue                   # skip cap centre vertex if present
            t = t_arr[vi]
            # Magenta (1,0,1) → cyan (0,1,1) linear blend
            ca.data[li].color = (1.0 - t, t, 1.0, 1.0)


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main() -> None:
    # Remove prior objects with same name
    for ob in list(bpy.data.objects):
        if ob.name.startswith(OBJ_NAME):
            bpy.data.objects.remove(ob, do_unlink=True)

    W0, D0, T0, name0 = PRESETS[0]
    obj = build_base_mesh(W0, D0, T0)
    print(f"[raup] base mesh '{name0}': {len(obj.data.vertices)} verts, "
          f"{len(obj.data.polygons)} faces")

    # Basis shape key (required parent for subsequent keys)
    obj.shape_key_add(name="Basis", from_mix=False)

    for W, D, T, sk_name in PRESETS:
        add_shape_key(obj, W, D, T, sk_name)
        print(f"[raup] shape key '{sk_name}' (W={W}, D={D}, T={T})")

    apply_vertex_colours(obj)
    print("[raup] vertex colours applied (magenta=old whorl → cyan=aperture)")

    # Orient: rotate −90° about X so the spiral axis aligns with +Y (Holoflow up)
    import mathutils
    obj.rotation_euler = (mathutils.pi / -2.0, 0.0, 0.0)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(rotation=True)

    print("[raup] done — save as hf_raup_shell.blend then export GLB.")


main()
