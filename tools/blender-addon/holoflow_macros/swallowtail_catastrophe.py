"""
holoflow_macros/swallowtail_catastrophe.py — Reusable Swallowtail Surface Builder
===================================================================================
Import and call build_swallowtail_disc() from any Blender 5.1 script to create a
swallowtail catastrophe disc poi with vertex colour and optional shape keys.

Usage:
    import sys; sys.path.insert(0, "/path/to/tools/blender-addon")
    from holoflow_macros.swallowtail_catastrophe import build_swallowtail_disc
    ob = build_swallowtail_disc("my_poi")
"""

import bpy, math, numpy as np


def build_swallowtail_disc(
    name: str = "hf_swallowtail",
    nx: int = 88,
    na: int = 66,
    x_range: tuple = (-2.3, 2.3),
    a_range: tuple = (-5.4, 1.2),
    poi_diam: float = 0.18,
    emit_str: float = 3.5,
    col_layer: str = "SCat",
    add_shape_keys: bool = True,
) -> bpy.types.Object:
    """
    Build the A₄ swallowtail discriminant surface as a disc poi mesh.

    Parameters
    ----------
    nx, na      Sampling resolution along state variable x and control parameter a.
    x_range     Domain for x (state variable); self-intersection visible for |x|>1.5.
    a_range     Domain for control parameter a; all three topological strata at a<0.
    poi_diam    Target diameter in metres (longest axis rescaled to this).
    emit_str    Emission node strength.
    col_layer   Vertex-colour attribute name (FLOAT_COLOR POINT).
    add_shape_keys  If True, add Swallowtail_Tight and Swallowtail_Flat shape keys.

    Returns
    -------
    bpy.types.Object  The newly created mesh object, linked to the active collection.
    """
    xs  = np.linspace(x_range[0], x_range[1], nx)
    as_ = np.linspace(a_range[0], a_range[1], na)
    x, a = np.meshgrid(xs, as_, indexing='ij')

    def compute(x_sc: float = 1.0, c_sc: float = 1.0) -> np.ndarray:
        xr = x * x_sc
        return np.stack([
            a.ravel(),
            (-10.0 * xr**3 - 3.0 * a * xr).ravel(),
            ((15.0 * xr**4 + 3.0 * a * xr**2) * c_sc).ravel(),
        ], axis=1)

    pts0     = compute()
    centroid = pts0.mean(axis=0)
    shifted  = pts0 - centroid
    scale    = (poi_diam / 2.0) / float(np.max(np.linalg.norm(shifted, axis=1)))
    verts_w  = (shifted * scale).tolist()

    faces = []
    for i in range(nx - 1):
        for j in range(na - 1):
            bl, br = i*na+j, i*na+(j+1)
            tr, tl = (i+1)*na+(j+1), (i+1)*na+j
            faces.append((bl, br, tr, tl))

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts_w, [], faces)
    me.update()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)

    for poly in me.polygons:
        poly.use_smooth = False

    # Vertex colour
    x_abs = np.abs(np.repeat(xs, na)) / (abs(x_range[1]) + 1e-9)
    t = np.clip(x_abs, 0.0, 1.0)
    cols = np.stack([1.0-0.55*t, 0.72-0.62*t, 0.08+0.90*t, np.ones_like(t)], axis=1)
    attr = me.color_attributes.new(col_layer, 'FLOAT_COLOR', 'POINT')
    attr.data.foreach_set("color", cols.astype(np.float32).ravel().tolist())

    # Material
    mat = bpy.data.materials.new(name + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    atr = nt.nodes.new("ShaderNodeAttribute")
    atr.attribute_name = col_layer
    em  = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = emit_str
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(atr.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    ob.data.materials.append(mat)
    ob["holoflow:facet"] = True

    # Shape keys
    if add_shape_keys:
        ob.shape_key_add(name="Basis", from_mix=False)
        for label, x_sc, c_sc in [("Swallowtail_Tight", 0.65, 1.0),
                                    ("Swallowtail_Flat",  1.00, 0.28)]:
            pts_v = compute(x_sc, c_sc)
            coords = ((pts_v - centroid) * scale).ravel().tolist()
            sk = ob.shape_key_add(name=label, from_mix=False)
            sk.data.foreach_set("co", coords)

    return ob
