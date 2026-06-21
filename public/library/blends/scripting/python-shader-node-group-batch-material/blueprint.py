# ============================================================
# Holoflow Studio — Python: Shader Node Groups
# Blender 5.1 · CC0 1.0 Universal
# ============================================================
# TECHNIQUE: Create a reusable HS_FacetCelShader node group via
# bpy.data.node_groups and batch-apply it to every mesh object.
# Editing one node inside the shared group propagates to every
# material that references it — no iteration required.
#
# EEVEE only: ShaderToRGB requires EEVEE. Cycles silently renders
# a blank surface when ShaderToRGB is in the tree — use a
# ColorRamp on the Diffuse BSDF Roughness for a Cycles fallback.
#
# Node group internal layout:
#   GroupInput (Color, Shadow Color, Toon Steps, Edge Glow)
#     ↓
#   Diffuse BSDF → ShaderToRGB → RGBToBW → posterise Math chain
#     ↓
#   ShaderNodeMixRGB (shadow ↔ colour, posterised blend factor)
#     ↓
#   Emission (body) ──────────────────────────────────┐
#                                                      ↓
#   Fresnel × Edge Glow → MixShader (body + rim) → GroupOutput
#     ↓
#   Emission (rim, white, bright)
# ============================================================

import bpy
import colorsys
import math

# ── Parameters ────────────────────────────────────────────────
GROUP_NAME    = "HS_FacetCelShader"
N_TOON_STEPS  = 3            # default toon bands (1 = flat, 8 = detailed)
EDGE_GLOW_DEF = 0.40         # Fresnel edge blend (0 = none, 1 = full rim)
BASE_COLOR    = (0.18, 0.18, 0.82, 1.0)   # cobalt blue default
SHADOW_COLOR  = (0.03, 0.03, 0.07, 1.0)   # near-black blue-shadow
RIM_STRENGTH  = 2.5          # emission strength for the rim highlight
OUTPUT_GLB    = "//cel_shader_scene.glb"

# World positions for 9 test primitives (3×3 grid)
PRIM_OFFSETS = [
    (-2.5, -2.5, 0.0), (0.0, -2.5, 0.0), (2.5, -2.5, 0.0),
    (-2.5,  0.0, 0.0), (0.0,  0.0, 0.0), (2.5,  0.0, 0.0),
    (-2.5,  2.5, 0.0), (0.0,  2.5, 0.0), (2.5,  2.5, 0.0),
]
PRIM_KINDS = [
    'cube', 'uv_sphere', 'cone',
    'cylinder', 'torus', 'ico_sphere',
    'cube', 'uv_sphere', 'cone',
]


# ── Helpers ───────────────────────────────────────────────────

def purge(name: str) -> None:
    """Remove existing node group so re-running is idempotent."""
    ng = bpy.data.node_groups.get(name)
    if ng:
        bpy.data.node_groups.remove(ng)


def at(node, x: float, y: float) -> None:
    node.location = (x, y)


# ── Build shader node group ───────────────────────────────────

def build_cel_group() -> bpy.types.ShaderNodeTree:
    purge(GROUP_NAME)

    # 'ShaderNodeTree' — not 'GeometryNodeTree'
    # This is the mandatory type string for shader node groups.
    nt    = bpy.data.node_groups.new(GROUP_NAME, 'ShaderNodeTree')
    nodes = nt.nodes
    links = nt.links

    # ── Interface (Blender 4.0+ NodeTreeInterface API) ────────
    # new_socket() registers each exposed parameter in the
    # modifier panel AND in every ShaderNodeGroup that wraps this
    # tree. Input socket order = panel display order.
    col_s = nt.interface.new_socket(
        'Color', in_out='INPUT', socket_type='NodeSocketColor')
    col_s.default_value = BASE_COLOR

    shd_s = nt.interface.new_socket(
        'Shadow Color', in_out='INPUT', socket_type='NodeSocketColor')
    shd_s.default_value = SHADOW_COLOR

    stp_s = nt.interface.new_socket(
        'Toon Steps', in_out='INPUT', socket_type='NodeSocketFloat')
    stp_s.default_value = float(N_TOON_STEPS)
    stp_s.min_value     = 1.0
    stp_s.max_value     = 8.0

    eg_s = nt.interface.new_socket(
        'Edge Glow', in_out='INPUT', socket_type='NodeSocketFloat')
    eg_s.default_value = EDGE_GLOW_DEF
    eg_s.min_value     = 0.0
    eg_s.max_value     = 1.0

    # NodeSocketShader — required for the Surface output slot;
    # using NodeSocketColor here would silently break the link to
    # the Material Output node's Surface input.
    nt.interface.new_socket(
        'Surface', in_out='OUTPUT', socket_type='NodeSocketShader')

    # ── Group I/O placeholder nodes ───────────────────────────
    grp_in  = nodes.new('NodeGroupInput');  at(grp_in,  -780,   0)
    grp_out = nodes.new('NodeGroupOutput'); at(grp_out,  700,   0)

    # ── Diffuse BSDF → Shader to RGB ─────────────────────────
    # DiffuseBSDF evaluates scene lighting and returns a shader.
    # ShaderToRGB converts that evaluation to a colour value for
    # further manipulation — the classic EEVEE toon pipeline.
    diff = nodes.new('ShaderNodeBsdfDiffuse')
    at(diff, -540, 100)
    links.new(grp_in.outputs['Color'], diff.inputs['Color'])

    s2r = nodes.new('ShaderNodeShaderToRGB')
    at(s2r, -330, 100)
    links.new(diff.outputs['BSDF'], s2r.inputs['Shader'])

    # ── RGB → BW (luminance for band logic) ───────────────────
    bw = nodes.new('ShaderNodeRGBToBW')
    at(bw, -120, 100)
    links.new(s2r.outputs['Color'], bw.inputs['Color'])

    # ── Posterise: floor(x × steps) ÷ steps ──────────────────
    # This is a live socket: animating or driving 'Toon Steps'
    # changes band count at render time — unlike a hard-coded
    # ColorRamp whose stop count is design-time only.
    mul = nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    at(mul, 60, 140)
    links.new(bw.outputs['Val'],              mul.inputs[0])
    links.new(grp_in.outputs['Toon Steps'],   mul.inputs[1])

    flr = nodes.new('ShaderNodeMath')
    flr.operation = 'FLOOR'
    at(flr, 240, 140)
    links.new(mul.outputs['Value'], flr.inputs[0])

    div = nodes.new('ShaderNodeMath')
    div.operation = 'DIVIDE'
    at(div, 420, 140)
    links.new(flr.outputs['Value'],           div.inputs[0])
    links.new(grp_in.outputs['Toon Steps'],   div.inputs[1])

    # ── Mix: Shadow Colour ↔ Colour (posterised blend) ────────
    # ShaderNodeMixRGB is the Blender 3.x-era node; still valid
    # in 5.1. In 4.0+ the canonical node is ShaderNodeMix with
    # data_type='RGBA' and inputs indexed as 0 (Factor), 6 (A),
    # 7 (B). Both work; MixRGB is kept here for named-input
    # clarity in the tutorial context.
    mix = nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'MIX'
    at(mix, 60, -100)
    links.new(div.outputs['Value'],                mix.inputs['Fac'])
    links.new(grp_in.outputs['Shadow Color'],      mix.inputs['Color1'])
    links.new(grp_in.outputs['Color'],             mix.inputs['Color2'])

    # ── Emission — body ───────────────────────────────────────
    emit_body = nodes.new('ShaderNodeEmission')
    emit_body.label = 'Body Emission'
    at(emit_body, 300, -80)
    links.new(mix.outputs['Color'], emit_body.inputs['Color'])

    # ── Fresnel rim ───────────────────────────────────────────
    fres = nodes.new('ShaderNodeFresnel')
    fres.inputs['IOR'].default_value = 1.45   # glass-like rim shape
    at(fres, -120, -260)

    rim_mul = nodes.new('ShaderNodeMath')
    rim_mul.operation = 'MULTIPLY'
    at(rim_mul, 60, -300)
    links.new(fres.outputs['Fac'],            rim_mul.inputs[0])
    links.new(grp_in.outputs['Edge Glow'],    rim_mul.inputs[1])

    # ── Emission — rim (white, strong) ────────────────────────
    emit_rim = nodes.new('ShaderNodeEmission')
    emit_rim.label = 'Rim Emission'
    emit_rim.inputs['Color'].default_value    = (1.0, 1.0, 1.0, 1.0)
    emit_rim.inputs['Strength'].default_value = RIM_STRENGTH
    at(emit_rim, 300, -260)

    # ── Mix Shader: body + rim ────────────────────────────────
    mix_shd = nodes.new('ShaderNodeMixShader')
    at(mix_shd, 520, -120)
    links.new(rim_mul.outputs['Value'],        mix_shd.inputs['Fac'])
    links.new(emit_body.outputs['Emission'],   mix_shd.inputs[1])
    links.new(emit_rim.outputs['Emission'],    mix_shd.inputs[2])

    links.new(mix_shd.outputs['Shader'], grp_out.inputs['Surface'])
    return nt


# ── Test scene: 9 primitives in a 3×3 grid ───────────────────

def build_test_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    for kind, offset in zip(PRIM_KINDS, PRIM_OFFSETS):
        getattr(bpy.ops.mesh, f'primitive_{kind}_add')(location=offset)
        bpy.context.active_object.name = f"cel_{kind}_{offset[0]:.0f}"


# ── Batch material application ────────────────────────────────

def apply_cel_to_all_meshes(group: bpy.types.ShaderNodeTree) -> int:
    """
    One ShaderNodeGroup per material; every node group references
    the same bpy.data.node_groups data-block.  Editing an internal
    node in the group — e.g. rim emission strength — propagates to
    every material here without iteration.
    """
    count = 0
    for obj in bpy.data.objects:
        if obj.type != 'MESH':
            continue

        # Unique material per object so per-object colour differs.
        mat_name = f"M_Cel_{obj.name}"
        mat = bpy.data.materials.get(mat_name)
        if mat:
            bpy.data.materials.remove(mat)
        mat = bpy.data.materials.new(mat_name)
        mat.use_nodes = True
        mat.node_tree.nodes.clear()

        grp_node = mat.node_tree.nodes.new('ShaderNodeGroup')
        grp_node.node_tree = group          # shared data-block reference
        grp_node.location  = (-200, 0)

        # Unique hue per object — only Color socket differs per material.
        hue = (count * 0.11) % 1.0
        r, g, b = colorsys.hsv_to_rgb(hue, 0.75, 0.85)
        grp_node.inputs['Color'].default_value = (r, g, b, 1.0)

        out_node = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
        out_node.location = (160, 0)
        mat.node_tree.links.new(
            grp_node.outputs['Surface'], out_node.inputs['Surface'])

        obj.data.materials.clear()
        obj.data.materials.append(mat)
        count += 1

    return count


# ── Live group edit — demonstrates propagation ────────────────

def demo_live_edit(group: bpy.types.ShaderNodeTree) -> None:
    """
    Change a value INSIDE the group; all N materials update.
    Internal node edits propagate automatically because all
    ShaderNodeGroup nodes share one data-block, not a copy.
    """
    rim = next(
        n for n in group.nodes
        if n.type == 'EMISSION' and n.label == 'Rim Emission')
    rim.inputs['Strength'].default_value = RIM_STRENGTH * 2.5


# ── GLB snapshot ─────────────────────────────────────────────

def export_glb() -> None:
    bpy.ops.export_scene.gltf(
        filepath            = bpy.path.abspath(OUTPUT_GLB),
        export_format       = 'GLB',
        use_selection       = False,
        export_apply        = True,
        export_yup          = True,
        export_materials    = 'EXPORT',
        export_image_format = 'WEBP',
    )


# ── Main ─────────────────────────────────────────────────────

if __name__ == '__main__':
    build_test_scene()
    group = build_cel_group()
    count = apply_cel_to_all_meshes(group)
    demo_live_edit(group)
    export_glb()
    print(f"[HS] {GROUP_NAME} applied to {count} mesh objects.")
    print(f"[HS] Rim strength boosted — {count} materials updated via one node edit.")
