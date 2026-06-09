"""
GN Mesh Topology — Vertex Valence Heat Map (Blender 5.1)
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY VERTEX VALENCE MATTERS
  Valence = the number of edges meeting at a vertex.
  In a clean quad mesh every vertex should have valence 4.
  Vertices where valence ≠ 4 are poles (extraordinary vertices):
    Valence 3: N-pole — triangle fan, mesh-join seam, some retopology stars
    Valence 5: E-pole — IcoSphere vertex, star-point in hand retopology
    Valence 6+: high-degree pole — UV sphere cap vertex (valence = UV_U)
  Poles cause:
    • Catmull-Clark subdivision: dimple at N-poles, slight ridge near high-valence poles
    • UV unwrap: angular distortion concentrates at poles, fanning island seams
    • Rigging: skin weight blending pinches across a pole at mid-weight
    • Smooth shading: averaged normals diverge from face normal at high-valence cap,
      producing a subtle highlight ring visible in beauty renders

TECHNIQUE
  GeometryNodeEdgesOfVertex.Total is an integer FIELD in vertex domain.
  Connecting InputIndex → Vertex Index makes it evaluate at each vertex.
  Total output = edge count = valence.
  Map [VALENCE_MIN → VALENCE_MAX] → [0 → 1] → ColorRamp → FLOAT_COLOR
  named attribute stored per vertex.  Material reads via ShaderNodeAttribute.

OUTSIDE SOURCES
  Edges of Vertex Node — CC-BY-SA 4.0  Blender Documentation Team
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/topology/edges_of_vertex.html
  blender-scripting — MIT  Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
  glTF-Blender-IO — Apache-2.0  Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
UV_U          = 8    # longitude segments — poles get exactly this valence
UV_V          = 6    # latitude rings — adequate resolution without excess vertices
SPHERE_RADIUS = 1.0

VALENCE_MIN   = 3    # colour ramp cold end: N-pole (valence 3 = blue)
VALENCE_MAX   = 8    # colour ramp hot end:  UV sphere pole (valence = UV_U = red)
                     # WHY UV_U: each cap vertex connects to exactly U ring verts

ANIM_FRAMES   = 60   # 2.5 s at 24 fps — enough to see poles from every angle
EXPORT_FRAME  = 30   # equatorial view for GLB snapshot

ATTR_NAME     = "valence_col"    # FLOAT_COLOR per-vertex; exported as glTF custom attribute

OUTPUT_GLB    = "//vertex_valence_heat_map.glb"
OUTPUT_BLEND  = "//vertex_valence_heat_map.blend"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for b in list(d):
            d.remove(b)


def make_valence_material():
    """Emission shader reads ATTR_NAME directly.
    WHY EMISSION not Principled BSDF:
      The heat map is diagnostic — colour correctness matters more than
      physically plausible lighting.  Emission is unaffected by scene lights
      so the blue/green/red mapping reads consistently from every view angle.
      In a Principled BSDF the same green vertex would darken on shadow faces
      and brighten near the area light, obscuring the valence difference.
    """
    mat = bpy.data.materials.new("Valence_Heat_Map")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    nattr = nt.nodes.new('ShaderNodeAttribute')
    nattr.attribute_type = 'GEOMETRY'
    nattr.attribute_name = ATTR_NAME     # reads FLOAT_COLOR stored by GN modifier

    emis = nt.nodes.new('ShaderNodeEmission')
    emis.inputs['Strength'].default_value = 1.0   # full brightness diagnostic

    mout = nt.nodes.new('ShaderNodeOutputMaterial')

    nt.links.new(nattr.outputs['Color'],   emis.inputs['Color'])
    nt.links.new(emis.outputs['Emission'], mout.inputs['Surface'])
    return mat


def _build_colour_ramp(nd_fn, loc=(0, 0)):
    """Valence → colour mapping.
    0.0 (val 3)  → blue   #0A2EDA  N-pole, under-connected
    0.2 (val 4)  → green  #0DD18A  ideal quad vertex
    0.4 (val 5)  → yellow #F5E00A  E-pole (IcoSphere native)
    0.7 (val 6)  → orange #F87210
    1.0 (val 8)  → red    #DE1212  UV sphere cap
    WHY 5 stops not 2: the human eye distinguishes 5 hue bands reliably.
    Linear interpolation between just blue/red would make valence 4 read as
    purple — indistinguishable from valence 5 or 3 at a glance.
    """
    cramp = nd_fn('ShaderNodeValToRGB', 'Valence Ramp', loc)
    cr = cramp.color_ramp
    cr.interpolation = 'LINEAR'
    cr.elements[0].position = 0.0
    cr.elements[0].color    = (0.04, 0.18, 0.85, 1.0)
    cr.elements[1].position = 1.0
    cr.elements[1].color    = (0.87, 0.07, 0.07, 1.0)
    e4 = cr.elements.new(0.2); e4.color = (0.05, 0.82, 0.54, 1.0)   # quad
    e5 = cr.elements.new(0.4); e5.color = (0.96, 0.88, 0.04, 1.0)   # E-pole
    e6 = cr.elements.new(0.7); e6.color = (0.97, 0.45, 0.06, 1.0)   # 6-valence
    return cramp


def build_gn_tree(mat):
    """
    Node graph (left → right):
      GroupInput[Geometry]
        ↓                         InputIndex
        ↓                              ↓
        ↓              EdgesOfVertex[Vertex Index]
        ↓              EdgesOfVertex.Total (INT field)
        ↓                              ↓
        ↓              MapRange [VALENCE_MIN→MAX : 0→1]
        ↓                              ↓
        ↓                         ColorRamp
        ↓                              ↓
      StoreNamedAttribute(ATTR_NAME, FLOAT_COLOR, POINT domain)
        ↓
      SetMaterial
        ↓
      GroupOutput[Geometry]

    WHY POINT domain on StoreNamedAttribute:
      POINT = per-vertex.  The MapRange+ColorRamp field evaluates once per vertex,
      driven by InputIndex = that vertex's own index.  Choosing FACE domain instead
      would evaluate at face centres — topologically wrong because EdgesOfVertex
      queries vertex topology, not face topology.  CORNER domain would store one
      value per loop, wasting memory with identical values at each loop of a vertex.
    """
    ng = bpy.data.node_groups.new("ValenceHeatMap", 'GeometryNodeTree')
    ni, nds, lks = ng.interface, ng.nodes, ng.links

    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
    ni.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')

    def nd(t, lbl=None, loc=(0, 0)):
        n = nds.new(t)
        if lbl:
            n.label = lbl
        n.location = loc
        return n

    gin  = nd('NodeGroupInput',  loc=(-840,   0))
    gout = nd('NodeGroupOutput', loc=( 620,   0))

    # InputIndex: integer field evaluating to current element index.
    # In POINT domain (as consumed by StoreNamedAttribute) this is the vertex index.
    iidx = nd('GeometryNodeInputIndex', 'Vertex Index Field', loc=(-840, -220))

    # TOPOLOGY NODE
    # inputs[0] 'Vertex Index': which vertex to query — feed InputIndex here
    # inputs[1] 'Sort Index':   which adjacent edge to look up (unused — we want Total)
    # outputs[0] 'Edge Index':  adjacent edge at position Sort Index (unused)
    # outputs[1] 'Total':       number of adjacent edges = VALENCE (this is our diagnostic)
    eov = nd('GeometryNodeEdgesOfVertex', 'Edges of Vertex', loc=(-580, -220))

    # MapRange: INT Total (auto-cast to FLOAT) → [0, 1]
    # clamp=True: valence outside [VALENCE_MIN, VALENCE_MAX] pins to 0 or 1
    # without distorting the readable range (degenerate valence-2 → blue, not NaN)
    mran = nd('ShaderNodeMapRange', 'Valence→0-1', loc=(-320, -220))
    mran.data_type = 'FLOAT'
    mran.clamp     = True
    mran.inputs[1].default_value = float(VALENCE_MIN)
    mran.inputs[2].default_value = float(VALENCE_MAX)
    mran.inputs[3].default_value = 0.0
    mran.inputs[4].default_value = 1.0

    cramp = _build_colour_ramp(nd, loc=(-60, -220))

    # StoreNamedAttribute FLOAT_COLOR
    # WHY FLOAT_COLOR not BYTE_COLOR:
    #   FLOAT_COLOR = 32-bit per channel — preserves the smooth gradient exactly.
    #   BYTE_COLOR = 8-bit per channel — introduces visible banding in the linear
    #   ramp between blue (0.04, 0.18, 0.85) and green (0.05, 0.82, 0.54).
    sattr = nd('GeometryNodeStoreNamedAttribute', 'Store Valence Col', loc=(240, 0))
    sattr.data_type = 'FLOAT_COLOR'
    sattr.domain    = 'POINT'
    sattr.inputs['Name'].default_value = ATTR_NAME
    sattr.inputs[1].default_value = True   # Selection = all vertices

    smat = nd('GeometryNodeSetMaterial', loc=(450, 0))
    smat.inputs[2].default_value = mat

    # ── Wires ────────────────────────────────────────────────────────────────
    lks.new(iidx.outputs['Index'],    eov.inputs['Vertex Index'])
    lks.new(eov.outputs['Total'],     mran.inputs[0])    # INT→FLOAT implicit cast
    lks.new(mran.outputs['Result'],   cramp.inputs['Fac'])
    lks.new(gin.outputs['Geometry'],  sattr.inputs[0])
    lks.new(cramp.outputs['Color'],   sattr.inputs[3])   # Value (FLOAT_COLOR socket)
    lks.new(sattr.outputs[0],         smat.inputs[0])
    lks.new(smat.outputs[0],          gout.inputs[0])

    return ng


def add_uv_sphere():
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=UV_U, ring_count=UV_V, radius=SPHERE_RADIUS, location=(0, 0, 0)
    )
    obj = bpy.context.object
    obj.name = "ValenceSphere"
    # Smooth shading so colour interpolates cleanly across the surface.
    # The valence map itself provides the structural information.
    bpy.ops.object.shade_smooth()
    return obj


def setup_modifier(obj, ng):
    mod = obj.modifiers.new("ValenceHeatMap", 'NODES')
    mod.node_group = ng
    return mod


def animate_rotation(obj):
    """360° Y-tilt rotation so the audience sees both poles (red caps) and the
    equatorial band (green) from every angle during the screen recording."""
    sc = bpy.context.scene
    obj.rotation_euler = (math.radians(15), 0.0, 0.0)
    obj.keyframe_insert(data_path='rotation_euler', frame=1)
    sc.frame_set(ANIM_FRAMES)
    obj.rotation_euler = (math.radians(15), 0.0, math.tau)
    obj.keyframe_insert(data_path='rotation_euler', frame=ANIM_FRAMES)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def setup_scene():
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, ANIM_FRAMES
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.fps    = 24
    bpy.ops.object.camera_add(location=(0.0, -3.5, 0.6))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(80), 0.0, 0.0)
    sc.camera = cam
    bpy.ops.object.light_add(type='AREA', location=(3.0, -2.0, 4.0))
    key = bpy.context.object
    key.data.energy = 40.0    # subtle — emission material carries the colour


def export_glb():
    bpy.context.scene.frame_set(EXPORT_FRAME)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(OUTPUT_GLB),
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
        export_colors=True,       # include vertex colour layers
        export_attributes=True,   # export named custom attributes as glTF accessors
        export_animations=True,
    )
    print(f"[ValenceHeatMap] GLB → {bpy.path.abspath(OUTPUT_GLB)}")


def main():
    clear_scene()
    mat = make_valence_material()
    ng  = build_gn_tree(mat)
    obj = add_uv_sphere()
    setup_modifier(obj, ng)
    animate_rotation(obj)
    setup_scene()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    export_glb()
    print("[ValenceHeatMap] Done.")


if __name__ == "__main__" or True:
    main()
