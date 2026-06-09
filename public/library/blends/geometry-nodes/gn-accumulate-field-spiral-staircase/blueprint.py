"""
GN Accumulate Field — Procedural Spiral Staircase (Blender 5.1)
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY ACCUMULATE FIELD
  GeometryNodeAccumulateField is a prefix-sum (running-total) node.  For each
  element in a domain it outputs the cumulative sum of the field values for all
  PRECEDING elements (Leading output) or including the current (Trailing output).
  On 16 points with a constant RISE value:
      Leading[0] = 0.0,  Leading[1] = RISE,  Leading[2] = 2·RISE, …
  This is identical to Index × RISE for uniform spacing — but AccumulateField
  generalises to any per-element variation without any extra arithmetic.  Swap
  the constant RISE field for a noise-driven field and you immediately get a
  non-uniform irregular staircase.  It is the GN equivalent of numpy.cumsum.

TECHNIQUE
  A MeshLine of STEPS vertices (all at origin, offset=(0,0,0)) is the scaffold.
  Two AccumulateField nodes — FLOAT for height, FLOAT for rotation — run in
  parallel on the same domain.  Their Leading outputs feed SetPosition (Z only)
  and RotateInstances (Z Euler only) respectively, assembling the helix purely
  from field arithmetic without a single For-Each zone.

OUTSIDE SOURCES
  Accumulate Field Node — CC-BY-SA 4.0  Blender Documentation Team
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/accumulate_field.html
  blender-python-scripts — MIT  Zach Noblitt
    https://github.com/znoblitt/blender-python-scripts
  glTF-Blender-IO — Apache-2.0  Khronos Group
    https://github.com/KhronosGroup/glTF-Blender-IO
"""

import bpy
import bmesh
import math

# ── Parameters ────────────────────────────────────────────────────────────────
STEPS              = 16      # number of stair treads
RISE               = 0.15    # height per step in metres (standard UK: 0.17 m)
TWIST_PER_STEP_DEG = 22.5    # STEPS × TWIST = 360° → one full revolution
TREAD_WIDTH        = 0.80    # tread width (X axis, metres)
TREAD_DEPTH        = 0.28    # tread radial extent (metres)
TREAD_THICKNESS    = 0.05    # tread slab thickness
INNER_RADIUS       = 0.22    # distance from Z axis to tread inner edge
POST_RADIUS        = 0.06    # newel post radius
POST_HEIGHT        = STEPS * RISE + 0.32   # post extends slightly above top step

ANIM_FRAMES        = 96      # 4 s at 24 fps — one slow orbit
EXPORT_FRAME       = 48      # mid-orbit for GLB snapshot

OUTPUT_GLB         = "//spiral_staircase.glb"
OUTPUT_BLEND       = "//spiral_staircase.blend"
# ─────────────────────────────────────────────────────────────────────────────

TWIST_RAD = math.radians(TWIST_PER_STEP_DEG)


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for b in list(d):
            d.remove(b)


def make_tread_mesh() -> bpy.types.Object:
    """
    A flat cuboid (TREAD_WIDTH × TREAD_DEPTH × TREAD_THICKNESS).
    Vertex offset +Y so inner edge is at Y = INNER_RADIUS; tread centre at
    Y = INNER_RADIUS + TREAD_DEPTH / 2.

    WHY bmesh vertex offset not object.location offset:
      InstanceOnPoints copies the mesh data as-is; the object origin is
      placed at the scaffold point.  An object.location offset on the tread
      source object is NOT carried into instances — the origin stays at the
      point position.  Baking the Y offset into the mesh vertices guarantees
      every instance has its inner edge at the post surface regardless of which
      transform mode the GN modifier uses.
    """
    me = bpy.data.meshes.new("Tread")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm,
                    vec=(TREAD_WIDTH, TREAD_DEPTH, TREAD_THICKNESS),
                    verts=bm.verts)
    # Shift +Y: inner edge = INNER_RADIUS, outer edge = INNER_RADIUS + TREAD_DEPTH
    y_offset = INNER_RADIUS + TREAD_DEPTH / 2.0
    for v in bm.verts:
        v.co.y += y_offset
    bm.to_mesh(me)
    bm.free()
    tread_obj = bpy.data.objects.new("Tread", me)
    bpy.context.collection.objects.link(tread_obj)
    return tread_obj


def make_centre_post() -> bpy.types.Object:
    """
    Newel post cylinder running the full staircase height.
    WHY standalone not inside GN tree:
      The post is static — no instances, no fields, no per-element variation.
      Keeping it as a separate object lets the GLB exporter pack it independently
      from the tread geometry, which is useful for WebXR LOD: the post can share
      a broad-phase BVH tile with the floor plane, while the 16 treads are loaded
      separately.  Merging via JoinGeometry inside GN would bind them to one draw
      call, losing that flexibility.
    """
    bpy.ops.mesh.primitive_cylinder_add(
        radius=POST_RADIUS,
        depth=POST_HEIGHT,
        vertices=16,
        location=(0.0, 0.0, POST_HEIGHT / 2.0),
    )
    post = bpy.context.object
    post.name = "CentrePost"
    return post


def make_materials():
    """
    Tread: warm concrete — Principled BSDF, Roughness 0.72, Metallic 0.
    Post:  brushed steel — Principled BSDF, Roughness 0.28, Metallic 1.
    Both map directly to glTF pbrMetallicRoughness without baking.
    """
    def pbsdf(name, base_rgb, roughness, metallic):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        nt  = mat.node_tree
        pb  = nt.nodes.get("Principled BSDF") or nt.nodes.new('ShaderNodeBsdfPrincipled')
        pb.inputs['Base Color'].default_value = (*base_rgb, 1.0)
        pb.inputs['Roughness'].default_value  = roughness
        pb.inputs['Metallic'].default_value   = metallic
        return mat

    tread_mat = pbsdf("TreadConcrete", (0.72, 0.66, 0.58), 0.72, 0.0)
    post_mat  = pbsdf("PostSteel",     (0.60, 0.62, 0.64), 0.28, 1.0)
    return tread_mat, post_mat


def build_gn_tree(tread_obj, tread_mat):
    """
    Geometry Nodes graph — AccumulateField prefix-sum scaffold.

    Node graph (L → R):

      MeshLine(count=STEPS, offset=(0,0,0))
          ↓ Geometry: STEPS vertices, all at origin
          SetPosition(pos=(0,0, acc_h.Leading))
          ↓ Geometry: STEPS vertices at (0,0,0), (0,0,RISE), (0,0,2·RISE) …
          InstanceOnPoints(instance = ObjectInfo(tread_obj))
          ↓ Instances
          RotateInstances(rotation=(0,0, acc_r.Leading), local=False)
          ↓ Instances: each tread swept to its angular position
          SetMaterial(tread_mat)
          RealizeInstances
          ↓
      GroupOutput

    AccumulateField nodes (field nodes — no geometry I/O, evaluated in
    POINT domain at the moment their output is consumed by SetPosition /
    RotateInstances):

      acc_h: data_type='FLOAT', domain='POINT', Value=RISE
             Leading[i] = i × RISE  (step i starts at this height)
      acc_r: data_type='FLOAT', domain='POINT', Value=TWIST_RAD
             Leading[i] = i × TWIST_RAD  (step i starts at this angle)

    WHY Leading not Trailing:
      Leading[i] = sum(values[0..i-1]).  At i=0 → 0: step 0 is at floor level,
      rotated 0°.  Trailing[i] = sum(values[0..i]): step 0 would be at height
      RISE (the first step floating above the floor) — physically wrong.

    WHY RotateInstances with local=False (world space):
      The tread mesh points in +Y with its inner edge at Y = INNER_RADIUS.
      Rotating in world Z swings the tread around the post axis — the helical
      sweep.  local=True would spin each tread about its own geometric centre
      (the mid-point of the tread slab), which only rotates the slab in place
      without sweeping it around the post.
    """
    ng = bpy.data.node_groups.new("SpiralStaircase", 'GeometryNodeTree')
    ni, nds, lks = ng.interface, ng.nodes, ng.links

    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def nd(t, lbl=None, loc=(0, 0)):
        n = nds.new(t)
        if lbl:
            n.label = lbl
        n.location = loc
        return n

    gout = nd('NodeGroupOutput', loc=(1060, 0))

    # ── 1. Scaffold: STEPS points, all at origin ───────────────────────────────
    mline = nd('GeometryNodeMeshLine', 'Steps Scaffold', loc=(-900, 0))
    mline.mode                           = 'OFFSET'
    mline.count_mode                     = 'TOTAL'
    mline.inputs['Count'].default_value  = STEPS
    mline.inputs['Offset'].default_value = (0.0, 0.0, 0.0)
    # All STEPS vertices at origin.  AccumulateField (a pure field node that
    # evaluates per-element when consumed downstream) will spread them in Z
    # and in angle — no explicit per-vertex offsets in MeshLine needed.

    # ── 2. AccumulateField — height (pure field, no geometry input) ────────────
    # Evaluate later in SetPosition's Position socket; domain='POINT' matches
    # the vertex domain of the scaffold.
    acc_h = nd('GeometryNodeAccumulateField', 'Cumul. Height', loc=(-620, 120))
    acc_h.data_type               = 'FLOAT'
    acc_h.domain                  = 'POINT'
    acc_h.inputs[0].default_value = RISE   # constant: uniform step height
    # To vary step heights: wire a noise or custom attribute field into inputs[0]
    # instead of this constant.  AccumulateField handles the summation either way.

    # ── 3. AccumulateField — rotation (pure field) ─────────────────────────────
    acc_r = nd('GeometryNodeAccumulateField', 'Cumul. Rotation', loc=(-620, -120))
    acc_r.data_type               = 'FLOAT'
    acc_r.domain                  = 'POINT'
    acc_r.inputs[0].default_value = TWIST_RAD

    # ── 4. Position vector (0, 0, Leading_height) ──────────────────────────────
    cpos = nd('ShaderNodeCombineXYZ', 'Step Z Position', loc=(-360, 120))
    # X and Y remain 0; tread offset in Y is baked into the mesh.

    # ── 5. SetPosition — lift scaffold points to their stair heights ───────────
    spos = nd('GeometryNodeSetPosition', 'Set Step Heights', loc=(-120, 0))

    # ── 6. ObjectInfo — tread mesh as instance source ──────────────────────────
    oinfo = nd('GeometryNodeObjectInfo', 'Tread Source', loc=(-620, -360))
    oinfo.inputs[0].default_value = tread_obj
    oinfo.transform_space         = 'ORIGINAL'
    # ORIGINAL: preserves the Y offset baked into the tread mesh vertices.
    # RELATIVE would re-interpret tread coords relative to the scaffold object,
    # losing the inner-radius positioning.

    # ── 7. InstanceOnPoints — place one tread per scaffold vertex ──────────────
    inst = nd('GeometryNodeInstanceOnPoints', 'Place Treads', loc=(140, 0))

    # ── 8. Rotation vector (0, 0, Leading_rotation) ────────────────────────────
    crot = nd('ShaderNodeCombineXYZ', 'Step Z Rotation', loc=(-120, -240))

    # ── 9. RotateInstances — sweep each tread to its angular position ──────────
    rinst = nd('GeometryNodeRotateInstances', 'Rotate Treads', loc=(380, 0))
    rinst.inputs['Local Space'].default_value = False
    # Pivot Point inputs default to (0,0,0) = post centre — correct as-is.

    # ── 10. SetMaterial + Realise ──────────────────────────────────────────────
    smat = nd('GeometryNodeSetMaterial', 'Tread Mat', loc=(620, 0))
    smat.inputs[2].default_value = tread_mat

    real = nd('GeometryNodeRealizeInstances', 'Realise', loc=(840, 0))
    # Realise before export: Draco compresses vertex data; instanced geometry
    # is only Draco-compressed if realised to independent meshes first.

    # ── Wires ──────────────────────────────────────────────────────────────────
    # Geometry path: MeshLine → SetPosition → InstanceOnPoints → Rotate → Mat → Realise → Output
    lks.new(mline.outputs['Mesh'],          spos.inputs['Geometry'])
    lks.new(spos.outputs['Geometry'],       inst.inputs['Points'])
    lks.new(inst.outputs['Instances'],      rinst.inputs['Instances'])
    lks.new(rinst.outputs['Instances'],     smat.inputs[0])
    lks.new(smat.outputs[0],               real.inputs[0])
    lks.new(real.outputs[0],               gout.inputs['Geometry'])

    # Field path: AccumulateField outputs → CombineXYZ → SetPosition / RotateInstances
    lks.new(acc_h.outputs['Leading'],       cpos.inputs['Z'])
    lks.new(cpos.outputs['Vector'],         spos.inputs['Position'])

    lks.new(oinfo.outputs['Geometry'],      inst.inputs['Instance'])

    lks.new(acc_r.outputs['Leading'],       crot.inputs['Z'])
    lks.new(crot.outputs['Vector'],         rinst.inputs['Rotation'])

    return ng


def make_scaffold_object(ng):
    """
    An empty-mesh object carrying the GN modifier.
    WHY empty mesh not a plane: a mesh with vertices would inject those
    vertices into the GN tree's GroupInput geometry socket.  Since this tree's
    MeshLine is internal, GroupInput is unused — an empty mesh guarantees no
    geometry leak from outside the node graph.
    """
    me  = bpy.data.meshes.new("StaircaseScaffold")
    obj = bpy.data.objects.new("StaircaseScaffold", me)
    bpy.context.collection.objects.link(obj)
    mod = obj.modifiers.new("SpiralStaircase", 'NODES')
    mod.node_group = ng
    return obj


def setup_scene_and_camera(post_mat):
    sc = bpy.context.scene
    sc.frame_start   = 1
    sc.frame_end     = ANIM_FRAMES
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.fps    = 24

    post = bpy.data.objects.get("CentrePost")
    if post:
        post.data.materials.append(post_mat)

    # Camera at 45° around Y, elevated 30°, looking at mid-staircase
    mid_z = POST_HEIGHT / 2.0
    dist  = 4.8
    elev  = math.radians(28)
    cx    = dist * math.cos(elev) * math.cos(math.radians(45))
    cy    = -dist * math.cos(elev) * math.sin(math.radians(45))
    cz    = mid_z + dist * math.sin(elev)
    bpy.ops.object.camera_add(location=(cx, cy, cz))
    cam      = bpy.context.object
    cam.name = "OrbitCamera"
    sc.camera = cam

    dx, dy, dz = -cx, -cy, mid_z - cz
    hor        = math.sqrt(dx*dx + dy*dy)
    cam.rotation_euler = (
        math.atan2(hor, -dz),
        0.0,
        math.atan2(dx, dy),
    )

    bpy.ops.object.light_add(type='AREA', location=(5.0, -3.0, 5.5))
    key = bpy.context.object
    key.data.energy    = 400.0
    key.data.size      = 4.0
    key.rotation_euler = (math.radians(50), 0.0, math.radians(35))

    bpy.ops.object.light_add(type='SUN', location=(-3.0, 4.0, 7.0))
    rim = bpy.context.object
    rim.data.energy    = 2.0
    rim.rotation_euler = (math.radians(50), 0.0, math.radians(-130))


def animate_camera():
    """
    Parent camera to an orbit pivot at staircase mid-height; keyframe pivot
    Z rotation from 0 → 2π over ANIM_FRAMES.  Single-channel LINEAR animation.
    """
    bpy.ops.object.empty_add(type='PLAIN_AXES',
                              location=(0.0, 0.0, POST_HEIGHT / 2.0))
    pivot       = bpy.context.object
    pivot.name  = "CameraOrbit"
    cam         = bpy.data.objects["OrbitCamera"]
    cam.parent  = pivot

    sc = bpy.context.scene
    pivot.rotation_euler = (0.0, 0.0, 0.0)
    pivot.keyframe_insert(data_path='rotation_euler', frame=1)
    sc.frame_set(ANIM_FRAMES)
    pivot.rotation_euler = (0.0, 0.0, math.tau)
    pivot.keyframe_insert(data_path='rotation_euler', frame=ANIM_FRAMES)
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


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
    print(f"[SpiralStaircase] GLB → {bpy.path.abspath(OUTPUT_GLB)}")


def main():
    clear_scene()
    tread_mat, post_mat = make_materials()
    tread_obj           = make_tread_mesh()
    make_centre_post()
    ng                  = build_gn_tree(tread_obj, tread_mat)
    make_scaffold_object(ng)
    setup_scene_and_camera(post_mat)
    animate_camera()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(OUTPUT_BLEND))
    export_glb()
    print("[SpiralStaircase] Done.")


if __name__ == "__main__" or True:
    main()
