"""
holoflow_macros/pom_brick_shader.py
Blender 5.1 | CC0 | Holoflow Studio

Reusable helper: build a 4-step steep parallax occlusion material on any mesh.

Usage
-----
  from holoflow_macros.pom_brick_shader import build_pom_material
  mat = build_pom_material(
      name="MyBrickWall",
      height_scale=0.06,
      brick_freq=8.0,
      mortar_width=0.03,
  )
  my_object.data.materials.append(mat)
"""

import bpy


def build_pom_material(
    name: str = "POM_BrickWall",
    height_scale: float = 0.06,
    brick_freq: float = 8.0,
    mortar_width: float = 0.03,
    n_steps: int = 4,
) -> bpy.types.Material:
    """
    Return a new material with a 4-step (unrolled) steep parallax node graph.

    Parameters
    ----------
    height_scale  : max UV displacement depth; 0.01=subtle, 0.12=very deep
    brick_freq    : BrickTexture Scale (bricks per unit)
    mortar_width  : BrickTexture Mortar Size as fraction of brick face
    n_steps       : number of unrolled samples (only 4 supported without
                    code changes; copy-paste uv_at_step calls for more)
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    T = mat.node_tree
    T.nodes.clear()

    def _n(t, **kw):
        n = T.nodes.new(t)
        for k, v in kw.items():
            setattr(n, k, v)
        return n

    def _l(src, dst):
        T.links.new(src, dst)

    def math_node(op, a=None, b=None, val=None):
        m = _n("ShaderNodeMath", operation=op)
        if a   is not None: _l(a, m.inputs[0])
        if b   is not None: _l(b, m.inputs[1])
        if val is not None: m.inputs[1].default_value = val
        return m

    def dot_vecs(va, vb):
        d = _n("ShaderNodeVectorMath", operation='DOT_PRODUCT')
        _l(va, d.inputs[0]); _l(vb, d.inputs[1])
        return d.outputs["Value"]

    out   = _n("ShaderNodeOutputMaterial")
    pbsdf = _n("ShaderNodeBsdfPrincipled")
    _l(pbsdf.outputs[0], out.inputs[0])

    uv_in = _n("ShaderNodeTexCoord")
    geom  = _n("ShaderNodeNewGeometry")
    tang  = _n("ShaderNodeTangent", direction_type='UV_MAP')

    incoming = geom.outputs["Incoming"]
    geo_n    = geom.outputs["Normal"]

    cross_nb = _n("ShaderNodeVectorMath", operation='CROSS_PRODUCT')
    _l(geo_n, cross_nb.inputs[0]); _l(tang.outputs[0], cross_nb.inputs[1])
    bitan = cross_nb.outputs["Vector"]

    dot_t = dot_vecs(incoming, tang.outputs[0])
    dot_b = dot_vecs(incoming, bitan)
    dot_n = dot_vecs(incoming, geo_n)

    clamp_n = math_node('MAXIMUM', dot_n, val=0.001)
    ofs_x   = math_node('MULTIPLY',
                  math_node('DIVIDE', dot_t, clamp_n.outputs[0]).outputs[0],
                  val=height_scale)
    ofs_y   = math_node('MULTIPLY',
                  math_node('DIVIDE', dot_b, clamp_n.outputs[0]).outputs[0],
                  val=height_scale)

    def uv_at_step(frac):
        mx  = math_node('MULTIPLY', ofs_x.outputs[0], val=frac)
        my  = math_node('MULTIPLY', ofs_y.outputs[0], val=frac)
        sep = _n("ShaderNodeSeparateXYZ"); _l(uv_in.outputs["UV"], sep.inputs[0])
        ax  = math_node('ADD', sep.outputs[0], mx.outputs[0])
        ay  = math_node('ADD', sep.outputs[1], my.outputs[0])
        comb = _n("ShaderNodeCombineXYZ")
        _l(ax.outputs[0], comb.inputs[0]); _l(ay.outputs[0], comb.inputs[1])
        bk = _n("ShaderNodeTexBrick")
        bk.inputs['Scale'].default_value       = brick_freq
        bk.inputs['Mortar Size'].default_value = mortar_width
        bk.inputs['Color1'].default_value      = (0.72, 0.42, 0.28, 1.0)
        bk.inputs['Color2'].default_value      = (0.65, 0.35, 0.22, 1.0)
        bk.inputs['Mortar'].default_value      = (0.44, 0.41, 0.38, 1.0)
        _l(comb.outputs[0], bk.inputs['Vector'])
        return bk.outputs['Fac'], bk.outputs['Color']

    h0, c0 = uv_at_step(0.00)
    h1, c1 = uv_at_step(0.25)
    h2, c2 = uv_at_step(0.50)
    h3, c3 = uv_at_step(0.75)
    h4, c4 = uv_at_step(1.00)

    def gt_mix(val_sock, threshold, col_keep, col_override):
        gt = math_node('GREATER_THAN', val_sock, val=threshold).outputs[0]
        m  = _n("ShaderNodeMixRGB"); m.blend_type = 'MIX'
        _l(gt, m.inputs[0]); _l(col_keep, m.inputs[1]); _l(col_override, m.inputs[2])
        return m.outputs[0]

    sel = c0
    sel = gt_mix(h1, 1.0 / n_steps, sel, c1)
    sel = gt_mix(h2, 2.0 / n_steps, sel, c2)
    sel = gt_mix(h3, 3.0 / n_steps, sel, c3)
    sel = gt_mix(h4, 0.99,          sel, c4)

    _l(sel, pbsdf.inputs["Base Color"])
    pbsdf.inputs["Roughness"].default_value = 0.75
    return mat
