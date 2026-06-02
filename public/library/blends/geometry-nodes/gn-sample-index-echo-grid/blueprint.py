#!/usr/bin/env python3
"""
GN Sample Index — Echo-Grid Interference Deformation (Blender 5.1)
Holoflow Studio | CC0 | 2026-06-02

Technique: Sample Index reads a field value at an ARBITRARY element index
rather than the element currently being evaluated.  This tutorial uses it to
build a wave-interference deformation on a flat grid:

  1. Compute noise-driven Z at each vertex from its flat XY position.
  2. Freeze those values as attribute "src_z" via StoreNamedAttribute.
  3. For vertex i, look up src_z at vertex (i + ROW_OFFSET) % TOTAL — one
     full grid row ahead.
  4. final_Z = own_src_z  +  echo_src_z × ECHO_SCALE

Because ROW_OFFSET equals the row width, vertex i receives the noise
amplitude of the vertex directly one row "ahead" of it (+Y direction in
Blender's Grid layout).  The two phases create constructive / destructive
interference: crests stack where phases align, troughs cancel where they
oppose.  A single noise evaluation drives the whole effect — no duplication,
no simulation.

StoreNamedAttribute freezes values BEFORE any SetPosition call.  GN field
nodes evaluate lazily: Position inside the SetPosition.Position sub-tree
still reads the pre-deformation flat coordinates.  Named-attribute read-back
(InputNamedAttribute) also evaluates on the frozen geometry.

Domain note: Grid primitive vertices are stored row-by-row, X varying
fastest (left → right), Y increasing by row.  ROW_OFFSET = N_COLS shifts
lookups across exactly one row boundary.  Modulo wrapping ensures row-0
vertices echo from the last row, giving a seamless periodic boundary.
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_SUBDIVISIONS   = 14          # gives 15 × 15 = 225 vertices
GRID_SIZE           = 3.0         # world-space square extent (metres)
NOISE_SCALE         = 0.9         # Noise Texture frequency
NOISE_DETAIL        = 3.0         # fractal octave count
NOISE_ROUGHNESS     = 0.55        # persistence between octaves
NOISE_DISTORTION    = 0.20        # warps the noise domain for organic feel
NOISE_STRENGTH      = 0.50        # half-amplitude of noise Z displacement (m)
ECHO_SCALE          = 0.70        # echo amplitude relative to own amplitude
N_COLS              = GRID_SUBDIVISIONS + 1   # 15 vertices per row
TOTAL_POINTS        = N_COLS * N_COLS         # 225
ROW_OFFSET          = N_COLS                  # look one full row ahead
BLEND_OUT           = "//echo_grid.blend"
GLB_OUT             = "//echo_grid.glb"


# ── Scene reset ───────────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 24
    bpy.context.scene.frame_set(1)


# ── Material ──────────────────────────────────────────────────────────────────
def make_material() -> "bpy.types.Material":
    """Gradient driven by the src_z attribute: valley = deep teal, peak = ivory.

    ShaderNodeAttribute(attribute_type='GEOMETRY') reads the named GN
    attribute at fragment level after interpolation from the POINT domain.
    MapRange normalises the symmetric [-NOISE_STRENGTH, +NOISE_STRENGTH] range
    to [0, 1] before the colour mix — keeps the gradient centred regardless of
    the NOISE_STRENGTH constant.
    """
    mat = bpy.data.materials.new("EchoGrid")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    for n in list(nodes):
        nodes.remove(n)

    out   = nodes.new("ShaderNodeOutputMaterial");   out.location   = (600, 0)
    bsdf  = nodes.new("ShaderNodeBsdfPrincipled");   bsdf.location  = (350, 0)
    mix   = nodes.new("ShaderNodeMixRGB");            mix.location   = (100, 0)
    mrang = nodes.new("ShaderNodeMapRange");          mrang.location = (-200, 0)
    attr  = nodes.new("ShaderNodeAttribute");         attr.location  = (-500, 0)

    attr.attribute_type = "GEOMETRY"
    attr.attribute_name = "src_z"

    mrang.clamp = True
    mrang.inputs["From Min"].default_value = -NOISE_STRENGTH
    mrang.inputs["From Max"].default_value =  NOISE_STRENGTH
    mrang.inputs["To Min"].default_value   = 0.0
    mrang.inputs["To Max"].default_value   = 1.0

    mix.blend_type = "MIX"
    mix.inputs["Color1"].default_value = (0.04, 0.28, 0.38, 1.0)  # deep teal valley
    mix.inputs["Color2"].default_value = (0.92, 0.94, 0.96, 1.0)  # ivory peak

    bsdf.inputs["Roughness"].default_value = 0.45
    bsdf.inputs["Metallic"].default_value  = 0.08

    links.new(attr.outputs["Fac"],      mrang.inputs["Value"])
    links.new(mrang.outputs["Result"],  mix.inputs["Fac"])
    links.new(mix.outputs["Color"],     bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"],     out.inputs["Surface"])
    return mat


# ── Geometry Nodes ────────────────────────────────────────────────────────────
def build_gn_tree(mat: "bpy.types.Material") -> "bpy.types.GeometryNodeTree":
    """
    Node graph summary:

    GroupInput (flat grid)
      Position ─────────────────────────────────────────────┐
      │                                                       ↓ (for final XY)
      → NoiseTexture → MapRange(-STR→+STR) → StoreNamedAttribute("src_z")
                                               │  geometry with src_z frozen
                                               ├─ Index + ROW_OFFSET % TOTAL
                                               │  → SampleIndex(src_z) → echo_z
                                               ├─ InputNamedAttribute("src_z") → own_z
                                               └─ own_z + echo_z×SCALE → final_z
                                                → CombineXYZ(x_flat, y_flat, final_z)
                                                → SetPosition → SetMaterial → GroupOutput

    The two InputNamedAttribute nodes read from the geometry that flows
    through their respective downstream consumers (both resolve to the frozen
    flat-grid geometry because StoreNamedAttribute is the last geometry
    modifier before SetPosition).
    """
    nt    = bpy.data.node_groups.new("EchoGridGN", "GeometryNodeTree")
    nodes = nt.nodes
    links = nt.links

    # Group sockets
    nt.interface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nt.interface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    sk_e = nt.interface.new_socket("Echo Scale",  in_out="INPUT", socket_type="NodeSocketFloat")
    sk_e.default_value, sk_e.min_value, sk_e.max_value = ECHO_SCALE, 0.0, 2.0
    sk_r = nt.interface.new_socket("Row Offset",  in_out="INPUT", socket_type="NodeSocketInt")
    sk_r.default_value = ROW_OFFSET

    def N(bl_type, x, y):
        n = nodes.new(bl_type)
        n.location = (x, y)
        return n

    # I/O
    ni   = N("NodeGroupInput",  -1800,   0)
    no   = N("NodeGroupOutput",  1200,   0)

    # Phase 1 — noise Z
    pos    = N("GeometryNodeInputPosition",  -1600,  200)
    noise  = N("ShaderNodeTexNoise",         -1300,  200)
    noise.noise_dimensions   = "3D"
    noise.inputs["Scale"].default_value      = NOISE_SCALE
    noise.inputs["Detail"].default_value     = NOISE_DETAIL
    noise.inputs["Roughness"].default_value  = NOISE_ROUGHNESS
    noise.inputs["Distortion"].default_value = NOISE_DISTORTION

    mrange = N("ShaderNodeMapRange",         -1000,  200)
    mrange.clamp = True
    mrange.inputs["From Min"].default_value = 0.0
    mrange.inputs["From Max"].default_value = 1.0
    mrange.inputs["To Min"].default_value   = -NOISE_STRENGTH
    mrange.inputs["To Max"].default_value   =  NOISE_STRENGTH

    # Phase 2 — freeze noise Z as src_z attribute
    store  = N("GeometryNodeStoreNamedAttribute",  -600,   0)
    store.data_type = "FLOAT"
    store.domain    = "POINT"
    store.inputs["Name"].default_value = "src_z"

    # Phase 3 — echo index: (current_index + ROW_OFFSET) % TOTAL_POINTS
    idx    = N("GeometryNodeInputIndex",     -600, -200)
    m_add  = N("ShaderNodeMath",             -350, -200)
    m_add.operation = "ADD"
    m_mod  = N("ShaderNodeMath",             -100, -200)
    m_mod.operation  = "MODULO"
    m_mod.inputs[1].default_value = float(TOTAL_POINTS)

    # Phase 4 — Sample Index: look up src_z at the echo vertex
    na_echo = N("GeometryNodeInputNamedAttribute",  -100, -400)
    na_echo.data_type = "FLOAT"
    na_echo.inputs["Name"].default_value = "src_z"

    samp   = N("GeometryNodeSampleIndex",     200, -200)
    samp.data_type = "FLOAT"
    samp.domain    = "POINT"
    samp.inputs["Clamp"].default_value = False

    # Phase 5 — own_z + echo_z × ECHO_SCALE
    na_own  = N("GeometryNodeInputNamedAttribute",   200,  200)
    na_own.data_type = "FLOAT"
    na_own.inputs["Name"].default_value = "src_z"

    m_scale = N("ShaderNodeMath",   450, -200)
    m_scale.operation = "MULTIPLY"

    m_final = N("ShaderNodeMath",   650,   0)
    m_final.operation = "ADD"

    # Phase 6 — reconstruct position and apply
    sep    = N("ShaderNodeSeparateXYZ",   650,  250)
    comb   = N("ShaderNodeCombineXYZ",    850,    0)
    setp   = N("GeometryNodeSetPosition", 1000,   0)
    setmat = N("GeometryNodeSetMaterial", 1100,   0)
    setmat.inputs["Material"].default_value = mat

    # ── Wiring ────────────────────────────────────────────────────────────────
    # Noise → MapRange → store.Value
    links.new(pos.outputs["Position"],     noise.inputs["Vector"])
    links.new(noise.outputs["Fac"],        mrange.inputs["Value"])
    links.new(ni.outputs["Geometry"],      store.inputs["Geometry"])
    links.new(mrange.outputs["Result"],    store.inputs["Value"])

    # Echo index arithmetic
    links.new(idx.outputs["Index"],        m_add.inputs[0])
    links.new(ni.outputs["Row Offset"],    m_add.inputs[1])
    links.new(m_add.outputs["Value"],      m_mod.inputs[0])

    # SampleIndex
    links.new(store.outputs["Geometry"],   samp.inputs["Geometry"])
    links.new(na_echo.outputs["Attribute"], samp.inputs["Value"])
    links.new(m_mod.outputs["Value"],      samp.inputs["Index"])

    # own_z + scaled echo_z
    links.new(samp.outputs["Value"],       m_scale.inputs[0])
    links.new(ni.outputs["Echo Scale"],    m_scale.inputs[1])
    links.new(na_own.outputs["Attribute"], m_final.inputs[0])
    links.new(m_scale.outputs["Value"],    m_final.inputs[1])

    # Final position assembly
    links.new(pos.outputs["Position"],     sep.inputs["Vector"])
    links.new(sep.outputs["X"],            comb.inputs["X"])
    links.new(sep.outputs["Y"],            comb.inputs["Y"])
    links.new(m_final.outputs["Value"],    comb.inputs["Z"])

    links.new(store.outputs["Geometry"],   setp.inputs["Geometry"])
    links.new(comb.outputs["Vector"],      setp.inputs["Position"])
    links.new(setp.outputs["Geometry"],    setmat.inputs["Geometry"])
    links.new(setmat.outputs["Geometry"],  no.inputs["Geometry"])

    return nt


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_SUBDIVISIONS,
        y_subdivisions=GRID_SUBDIVISIONS,
        size=GRID_SIZE,
        enter_editmode=False,
    )
    grid = bpy.context.active_object
    grid.name = "EchoGrid"

    mat = make_material()
    grid.data.materials.append(mat)

    nt  = build_gn_tree(mat)
    mod = grid.modifiers.new("GNEchoGrid", "NODES")
    mod.node_group = nt

    # Camera for viewport recording
    bpy.ops.object.camera_add(location=(3.8, -3.8, 3.8))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(52), 0, math.radians(45))
    bpy.context.scene.camera = cam

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_OUT),
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_yup=True,
    )
    print("✓ Echo grid complete →", GLB_OUT)


if __name__ == "__main__":
    main()
