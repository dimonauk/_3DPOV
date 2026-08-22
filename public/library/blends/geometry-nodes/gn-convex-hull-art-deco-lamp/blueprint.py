"""
GN Convex Hull — Procedural Faceted Art-Deco Lamp Shade (Blender 5.1)
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY CONVEX HULL CREATES FACETS
  An IcoSphere starts smooth. Noise displaces each vertex radially in or out,
  creating an uneven cloud of peaks and valleys.  GeometryNodeConvexHull wraps
  that cloud in the tightest possible convex polyhedron — every concavity between
  adjacent peaks is "bridged" by a single planar face.  The result is a faceted
  gem whose face count and face size are controlled by one number: NOISE_SCALE.
  Low scale → few large bumps → few large faces (art-deco lantern, 12–30 faces).
  High scale → many small bumps → many small faces (crushed-velvet effect, 60+).
  The hull faces are EXACTLY planar by mathematical construction, making flat
  shading lossless — no softened edges to fight, no custom split normals required.

OUTSIDE SOURCES
  Convex Hull node — CC-BY-SA 4.0  Blender Documentation Team
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/convex_hull.html
  blender-scripting — MIT  Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
  glTF-Blender-IO — Apache-2.0  Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
"""

import bpy
import math

# ── Parameters ──────────────────────────────────────────────────────────────
SPHERE_SUBDIVISIONS = 3      # 162 verts; hull faces ≈ 20–50 for this noise range
NOISE_SCALE         = 2.2    # WHY 2.2: produces ~30 distinct hull faces (lantern silhouette)
NOISE_DETAIL        = 2.0    # WHY LOW: more octaves → self-similar bumps → hull≈sphere
NOISE_ROUGHNESS     = 0.52
NOISE_AMP_DEFAULT   = 0.32   # displacement in Blender units (fraction of sphere radius)
W_ANIM_START        = 0.0
W_ANIM_END          = 1.8    # 4D noise shift: different facet topology, not scale change
ANIM_FRAMES         = 48     # 2 s at 24 fps
EXPORT_FRAME        = 24     # mid-morph GLB snapshot

LAMP_COLOUR         = (0.95, 0.85, 0.60, 1.0)  # warm amber
LAMP_EMISSION_STR   = 1.2
LAMP_IOR            = 1.52   # borosilicate glass
LAMP_ROUGHNESS      = 0.04

OUTPUT_GLB   = "//convex_hull_lamp.glb"
OUTPUT_BLEND = "//convex_hull_lamp.blend"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes):      bpy.data.meshes.remove(b)
    for b in list(bpy.data.node_groups): bpy.data.node_groups.remove(b)
    for b in list(bpy.data.materials):   bpy.data.materials.remove(b)


def make_lamp_material():
    mat = bpy.data.materials.new("ArtDeco_Glass")
    mat.use_nodes = True
    pb = mat.node_tree.nodes.get("Principled BSDF")
    pb.inputs["Base Color"].default_value          = LAMP_COLOUR
    pb.inputs["Roughness"].default_value           = LAMP_ROUGHNESS
    pb.inputs["IOR"].default_value                 = LAMP_IOR
    pb.inputs["Transmission Weight"].default_value = 0.85   # glass-like
    pb.inputs["Emission Color"].default_value      = LAMP_COLOUR
    pb.inputs["Emission Strength"].default_value   = LAMP_EMISSION_STR
    mat.blend_method  = 'BLEND'
    mat.shadow_method = 'NONE'
    return mat


def build_gn_tree(mat):
    """
    Node graph (left → right):
      GroupInput[Geometry, W Seed, Amp]
        → InputPosition  → ShaderNodeTexNoise 4D  → centring chain → amplitude scale
        → InputNormal    → VectorMath SCALE  →  SetPosition[Offset]
                                                  → ConvexHull
                                                  → SetShadeSmooth(False)
                                                  → SetMaterial
      → GroupOutput[Geometry]

    The W Seed socket is animated by the modifier keyframes in setup_modifier().
    Noise W translates through a 4D field — each W value is a DIFFERENT spatial
    pattern, so facets morph (topology change) rather than merely grow/shrink.
    Animating NOISE_SCALE instead would only zoom the field: all facets scale
    proportionally and no novel topology appears.
    """
    ng = bpy.data.node_groups.new("ConvexHullLamp", 'GeometryNodeTree')
    ni, nds, lks = ng.interface, ng.nodes, ng.links

    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
    ni.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ws  = ni.new_socket("W Seed", in_out='INPUT', socket_type='NodeSocketFloat')
    amp = ni.new_socket("Amp",    in_out='INPUT', socket_type='NodeSocketFloat')
    ws.default_value  = W_ANIM_START
    amp.default_value = NOISE_AMP_DEFAULT

    def nd(t, lbl=None, loc=(0, 0)):
        n = nds.new(t)
        if lbl: n.label = lbl
        n.location = loc
        return n

    gin   = nd('NodeGroupInput',               loc=(-900,    0))
    ipos  = nd('GeometryNodeInputPosition',    loc=(-900, -220))
    inorm = nd('GeometryNodeInputNormal',      loc=(-900, -340))

    noise = nd('ShaderNodeTexNoise', 'Noise4D', loc=(-660, 0))
    noise.noise_dimensions                  = '4D'
    noise.inputs['Scale'].default_value     = NOISE_SCALE
    noise.inputs['Detail'].default_value    = NOISE_DETAIL
    noise.inputs['Roughness'].default_value = NOISE_ROUGHNESS

    # Centre noise output: (Fac − 0.5) × 2  →  [−1, +1] symmetric about zero.
    # Without this step the displacement is always positive (0→1), pushing all
    # vertices outward and producing a bloated rather than sculpted shape.
    msub = nd('ShaderNodeMath', '−0.5',  loc=(-380, 100))
    msub.operation = 'SUBTRACT'; msub.inputs[1].default_value = 0.5
    mmul = nd('ShaderNodeMath', '×2',    loc=(-200, 100))
    mmul.operation = 'MULTIPLY'; mmul.inputs[1].default_value = 2.0
    mamp = nd('ShaderNodeMath', '×Amp',  loc=(-20,  100))
    mamp.operation = 'MULTIPLY'

    # Scale Normal vector by signed amplitude scalar.
    # VectorMath SCALE: inputs[0]=Vector, inputs['Scale']=Float (4.0+ named socket)
    vscl = nd('ShaderNodeVectorMath', 'N×amp', loc=(200, 0))
    vscl.operation = 'SCALE'

    setp = nd('GeometryNodeSetPosition', 'Displace', loc=(420,  40))
    setp.inputs[1].default_value = True   # Selection = True (whole mesh)

    # CONVEX HULL — the key node.  Takes the displaced ICO sphere (162 points)
    # and returns the minimal enclosing convex polyhedron.
    hull = nd('GeometryNodeConvexHull', 'Convex Hull', loc=(660,  40))

    # Set Shade Smooth = False on every face.
    # WHY: hull faces are already perfectly planar; smooth shading would smear
    # normals across face boundaries and destroy the hard-edge facet look.
    sssm = nd('GeometryNodeSetShadeSmooth', 'Flat', loc=(880, 40))
    sssm.domain                 = 'FACE'
    sssm.inputs[2].default_value = False  # Shade Smooth = False

    smat = nd('GeometryNodeSetMaterial', 'Set Mat', loc=(1100, 40))
    smat.inputs[2].default_value = mat

    gout = nd('NodeGroupOutput', loc=(1340, 40))

    # ── Wires ────────────────────────────────────────────────────────────────
    lks.new(ipos.outputs['Position'],  noise.inputs['Vector'])
    lks.new(gin.outputs['W Seed'],     noise.inputs['W'])
    lks.new(noise.outputs['Fac'],      msub.inputs[0])
    lks.new(msub.outputs['Value'],     mmul.inputs[0])
    lks.new(mmul.outputs['Value'],     mamp.inputs[0])
    lks.new(gin.outputs['Amp'],        mamp.inputs[1])
    lks.new(inorm.outputs['Normal'],   vscl.inputs[0])
    lks.new(mamp.outputs['Value'],     vscl.inputs['Scale'])
    lks.new(gin.outputs['Geometry'],   setp.inputs[0])
    lks.new(vscl.outputs['Vector'],    setp.inputs[3])   # Offset socket
    lks.new(setp.outputs[0],           hull.inputs[0])
    lks.new(hull.outputs[0],           sssm.inputs[0])
    lks.new(sssm.outputs[0],           smat.inputs[0])
    lks.new(smat.outputs[0],           gout.inputs[0])

    return ng


def add_ico_sphere():
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=SPHERE_SUBDIVISIONS, radius=1.0, location=(0, 0, 0)
    )
    return bpy.context.object


def setup_modifier(obj, ng):
    mod = obj.modifiers.new("ConvexHullLamp", 'NODES')
    mod.node_group = ng

    w_id = amp_id = None
    for item in ng.interface.items_tree:
        if item.in_out == 'INPUT' and item.name == 'W Seed':
            w_id = item.identifier
        elif item.in_out == 'INPUT' and item.name == 'Amp':
            amp_id = item.identifier

    mod[amp_id] = NOISE_AMP_DEFAULT

    sc = bpy.context.scene
    sc.frame_set(1)
    mod[w_id] = W_ANIM_START
    mod.keyframe_insert(data_path=f'["{w_id}"]', frame=1)
    sc.frame_set(ANIM_FRAMES)
    mod[w_id] = W_ANIM_END
    mod.keyframe_insert(data_path=f'["{w_id}"]', frame=ANIM_FRAMES)

    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    return w_id, amp_id


def animate_rotation(obj):
    sc = bpy.context.scene
    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert(data_path='rotation_euler', frame=1)
    sc.frame_set(ANIM_FRAMES)
    obj.rotation_euler.z = math.tau   # full 360° in ANIM_FRAMES
    obj.keyframe_insert(data_path='rotation_euler', frame=ANIM_FRAMES)
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def setup_scene():
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, ANIM_FRAMES
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.fps    = 24
    bpy.ops.object.camera_add(location=(0.0, -4.4, 0.6))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(82), 0.0, 0.0)
    sc.camera = cam
    bpy.ops.object.light_add(type='POINT', location=(2.8, -2.2, 3.2))
    key = bpy.context.object
    key.data.energy, key.data.color = 130.0, (1.0, 0.92, 0.80)
    bpy.ops.object.light_add(type='POINT', location=(-2.0, 2.0, 1.5))
    rim = bpy.context.object
    rim.data.energy, rim.data.color = 60.0, (0.78, 0.88, 1.0)


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
        export_animations=True,
    )
    print(f"[ConvexHullLamp] GLB → {bpy.path.abspath(OUTPUT_GLB)}")


def main():
    clear_scene()
    mat = make_lamp_material()
    ng  = build_gn_tree(mat)
    obj = add_ico_sphere()
    setup_modifier(obj, ng)
    animate_rotation(obj)
    setup_scene()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    export_glb()
    print("[ConvexHullLamp] Done.")


if __name__ == "__main__" or True:
    main()
