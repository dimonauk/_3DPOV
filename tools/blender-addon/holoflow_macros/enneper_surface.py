"""
holoflow_macros/enneper_surface.py
===================================
Reusable Weierstrass–Enneper surface generator for Holoflow Studio.

Usage (from another blueprint or the Blender Python console):

    from holoflow_macros.enneper_surface import make_enneper
    obj = make_enneper(pmax=2.0, nu=80, nv=80, poi_r=0.082)

The function creates and returns a Blender object with:
  - Flat-shaded quad mesh
  - FLOAT_COLOR attribute  "K_curvature" (analytic Gauss curvature)
  - Three shape keys: SK_Tight / SK_Wide / SK_Rotate45
  - holoflow:facet / holoflow:category / holoflow:surface custom props
  - +Y-up transform applied (ready for glTF export)
"""

from __future__ import annotations
import bpy, numpy as np
from typing import Tuple

# Colour stops for the K_curvature ramp
_C_EDGE   = (0.88, 0.62, 0.04)   # amber-gold  — outer arms, |K| → 0
_C_MID    = (0.04, 0.72, 0.65)   # teal
_C_CENTRE = (0.04, 0.10, 0.82)   # deep cobalt — origin, |K| = 4


def _lerp3(t: np.ndarray,
           c0: Tuple, c1: Tuple, c2: Tuple) -> Tuple[np.ndarray, ...]:
    lo = t < 0.5
    tl = t * 2.0;  th = (t - 0.5) * 2.0
    ch = lambda i: np.where(lo, c0[i]+tl*(c1[i]-c0[i]), c1[i]+th*(c2[i]-c1[i]))
    return ch(0), ch(1), ch(2)


def _enneper_xyz(pmax: float, nu: int, nv: int, poi_r: float):
    """Return scaled (X, Y, Z), (U, V) arrays on (nu, nv) grid."""
    u = np.linspace(-pmax, pmax, nu)
    v = np.linspace(-pmax, pmax, nv)
    U, V = np.meshgrid(u, v, indexing='ij')
    X = U - U**3/3.0 + U*V**2
    Y = -V + V**3/3.0 - U**2*V
    Z = U**2 - V**2
    sc = poi_r / np.sqrt(X**2 + Y**2 + Z**2).max()
    return X*sc, Y*sc, Z*sc, U, V


def make_enneper(
    pmax: float = 2.0,
    nu: int = 80,
    nv: int = 80,
    poi_r: float = 0.082,
    name: str = "enneper_poi",
    collection: "bpy.types.Collection | None" = None,
) -> bpy.types.Object:
    """Build and register an Enneper surface object.  Returns the Object."""
    X, Y, Z, U, V = _enneper_xyz(pmax, nu, nv, poi_r)

    # ── Curvature colour ────────────────────────────────────────────────────
    r2   = U**2 + V**2
    Kmag = 4.0 / (1.0 + r2)**4
    t    = (Kmag / Kmag.max()) ** 0.30
    CR, CG, CB = _lerp3(t, _C_EDGE, _C_MID, _C_CENTRE)
    colours = np.stack([CR, CG, CB, np.ones_like(CR)], axis=-1)

    # ── Faces ───────────────────────────────────────────────────────────────
    Ii, Ji = np.meshgrid(np.arange(nu-1), np.arange(nv-1), indexing='ij')
    a = (Ii*nv+Ji).ravel();     b = ((Ii+1)*nv+Ji).ravel()
    c = ((Ii+1)*nv+Ji+1).ravel(); d = (Ii*nv+Ji+1).ravel()
    faces = np.stack([a, b, c, d], axis=1).tolist()

    # ── Mesh ────────────────────────────────────────────────────────────────
    verts = np.stack([X, Y, Z], axis=-1).reshape(-1, 3).tolist()
    mesh  = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    coll = collection or bpy.context.collection
    coll.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_flat()

    col = mesh.color_attributes.new("K_curvature", 'FLOAT_COLOR', 'POINT')
    col.data.foreach_set("color",
        colours.reshape(-1, 4).astype(np.float32).ravel())

    # ── Material ─────────────────────────────────────────────────────────────
    mat = bpy.data.materials.new(f"{name}_mat")
    mat.use_nodes = True;  mat.use_backface_culling = False
    nt  = mat.node_tree;  nt.nodes.clear()
    nd_a = nt.nodes.new("ShaderNodeAttribute"); nd_a.attribute_name = "K_curvature"
    nd_b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nd_b.inputs["Metallic"].default_value  = 0.22
    nd_b.inputs["Roughness"].default_value = 0.32
    nd_o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(nd_a.outputs["Color"], nd_b.inputs["Base Color"])
    nt.links.new(nd_b.outputs["BSDF"],  nd_o.inputs["Surface"])
    mesh.materials.append(mat)

    # ── Shape keys ───────────────────────────────────────────────────────────
    obj.shape_key_add(name="Basis", from_mix=False)

    def _sk_verts(p):
        Xp, Yp, Zp, _, _ = _enneper_xyz(p, nu, nv, poi_r)
        return np.stack([Xp, Yp, Zp], axis=-1).reshape(-1,3).astype(np.float32)

    sk_t = obj.shape_key_add(name="SK_Tight",    from_mix=False)
    sk_t.data.foreach_set("co", _sk_verts(1.0).ravel())
    sk_w = obj.shape_key_add(name="SK_Wide",     from_mix=False)
    sk_w.data.foreach_set("co", _sk_verts(3.0).ravel())

    u = np.linspace(-pmax, pmax, nu)
    v = np.linspace(-pmax, pmax, nv)
    UU, VV = np.meshgrid(u, v, indexing='ij')
    s45 = np.sqrt(0.5)
    UR = s45*UU-s45*VV; VR = s45*UU+s45*VV
    XR = UR-UR**3/3+UR*VR**2; YR = -VR+VR**3/3-UR**2*VR; ZR = UR**2-VR**2
    sc_r = poi_r / np.sqrt(XR**2+YR**2+ZR**2).max()
    sk_r = obj.shape_key_add(name="SK_Rotate45", from_mix=False)
    sk_r.data.foreach_set("co",
        np.stack([XR*sc_r,YR*sc_r,ZR*sc_r],axis=-1).reshape(-1,3).astype(np.float32).ravel())

    # ── +Y-up ────────────────────────────────────────────────────────────────
    obj.rotation_euler[0] = 1.5707963
    bpy.ops.object.transform_apply(rotation=True)

    obj["holoflow:facet"]    = True
    obj["holoflow:category"] = "poi-head"
    obj["holoflow:surface"]  = "minimal"
    obj["holoflow:K"]        = "analytic: -4/(1+u^2+v^2)^4"
    return obj
