"""
Crystal Grotto — GN Realize Instances Blueprint
Blender 5.1  ·  CC0  ·  Holoflow Studio

GeometryNodeRealizeInstances converts the lightweight instance list produced by
InstanceOnPoints into actual vertex geometry.  This tutorial uses CaptureAttribute
at the INSTANCE domain before RealizeInstances to preserve per-crystal colour,
which survives realization as a per-vertex named attribute and drives emission.

Source: docs.blender.org — CC-BY-SA 4.0 — Blender Foundation
"""

import bpy, bmesh, math, pathlib

# ── parameters ───────────────────────────────────────────────────────────────
SHARD_HEIGHT     = 0.28     # metres — prototype crystal height
SHARD_HEX_RADIUS = 0.042    # hex cross-section radius at base
SHARD_TIP_FRAC   = 0.28     # fraction of height where prism tapers to apex
SPHERE_RADIUS    = 0.88     # grotto sphere radius
SPHERE_SEGS_U    = 24
SPHERE_SEGS_V    = 16
SCATTER_COUNT    = 110      # maximum shards from DistributePointsOnFaces
SCATTER_SEED     = 0
SCALE_MIN        = 0.45     # shortest crystal (relative to prototype)
SCALE_MAX        = 2.00     # tallest crystal
EMISSION_STR     = 1.6
DRACO_LEVEL      = 6
ANIM_FRAMES      = 120      # 5 seconds at 24 fps
OUTPUT_GLB       = "//crystal_grotto.glb"
BLEND_FILENAME   = "crystal_grotto.blend"


# ── scene setup ───────────────────────────────────────────────────────────────
def setup_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.scene.unit_settings.system       = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.render.fps                 = 24
    bpy.context.scene.frame_start                = 1
    bpy.context.scene.frame_end                  = ANIM_FRAMES


# ── prototype shard (hexagonal prism → apex) ──────────────────────────────────
def make_shard_prototype(name="shard_proto"):
    """
    6-sided prism for the lower (1 − TIP_FRAC) portion, tapering to an apex.
    Flat-shaded on the prototype; that flag propagates to all realized copies.
    Hidden from render and viewport — only exists as the Instance target.
    WHY hexagonal: 6-sided cross-section gives faceted gem character with flat
    shading; 4-sided would read as pillar, 8-sided looks round at low scale.
    """
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm   = bmesh.new()
    n     = 6
    h     = SHARD_HEIGHT
    tip_z = h * (1.0 - SHARD_TIP_FRAC)
    base, top = [], []
    for i in range(n):
        a = math.pi / n + i * math.tau / n
        c, s = math.cos(a), math.sin(a)
        base.append(bm.verts.new((SHARD_HEX_RADIUS * c,       SHARD_HEX_RADIUS * s,       0.0)))
        top.append( bm.verts.new((SHARD_HEX_RADIUS * 0.5 * c, SHARD_HEX_RADIUS * 0.5 * s, tip_z)))
    apex = bm.verts.new((0.0, 0.0, h))
    bm.verts.ensure_lookup_table()
    bm.faces.new(reversed(base))                                   # base cap (−Z normal)
    for i in range(n):
        bm.faces.new([base[i], base[(i+1)%n], top[(i+1)%n], top[i]])  # side quads
    for i in range(n):
        bm.faces.new([top[i], top[(i+1)%n], apex])                # tip triangles
    bm.to_mesh(mesh)
    bm.free()
    mesh.shade_flat()
    obj.hide_render   = True
    obj.hide_viewport = True
    return obj


# ── crystal emission material ─────────────────────────────────────────────────
def make_material(name="crystal_mat"):
    """
    ShaderNodeAttribute reads 'crystal_hue' (FLOAT [0, 1]) from each vertex.
    HueSaturation converts the scalar to full-saturation colour.
    Emission makes the colour lighting-independent — important for a cave scene
    where direct lighting would darken crystals facing away from the key light.
    WHY not Principled BSDF Base Color: PBSDF with a per-vertex colour field
    requires a more complex UV/attribute switch; emission reads vertex attributes
    directly and is the natural choice for self-lit crystal surfaces.
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    hsv  = nt.nodes.new('ShaderNodeHueSaturation')
    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_type  = 'GEOMETRY'
    attr.attribute_name  = 'crystal_hue'
    hsv.inputs['Saturation'].default_value = 0.90
    hsv.inputs['Value'].default_value      = 1.00
    hsv.inputs['Fac'].default_value        = 1.00
    emit.inputs['Strength'].default_value  = EMISSION_STR
    lk = nt.links.new
    lk(attr.outputs['Fac'],      hsv.inputs['Hue'])
    lk(hsv.outputs['Color'],     emit.inputs['Color'])
    lk(emit.outputs['Emission'], out.inputs['Surface'])
    out.location  = ( 400, 0);  emit.location = ( 200, 0)
    hsv.location  = (   0, 0);  attr.location = (-200, 0)
    return mat


# ── scatter surface ───────────────────────────────────────────────────────────
def make_scatter_sphere(name="scatter_sphere"):
    """
    UV sphere that DistributePointsOnFaces scatters points across.
    The sphere geometry itself is consumed inside the GN modifier;
    only the realized crystal geometry appears in the final mesh and GLB.
    """
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=SPHERE_SEGS_U,
                              v_segments=SPHERE_SEGS_V, radius=SPHERE_RADIUS)
    bm.to_mesh(mesh)
    bm.free()
    return obj


# ── geometry nodes modifier ───────────────────────────────────────────────────
def build_gn(sphere_obj, shard_obj, mat):
    """
    Node chain (in order):
      GroupInput → DistributePointsOnFaces → InstanceOnPoints
        → CaptureAttribute(domain=INSTANCE) → RealizeInstances
        → StoreNamedAttribute(domain=POINT, name='crystal_hue')
        → SetMaterial → SetShadeSmooth(False) → GroupOutput

    ORDER LAW — CaptureAttribute must precede RealizeInstances:
      DistributePointsOnFaces + InstanceOnPoints produce a geometry
      containing INSTANCE domain data (one record per instance, not per vertex).
      CaptureAttribute(INSTANCE) locks the random hue field into the instances.
      RealizeInstances then expands each instance into real vertices, copying
      that per-instance value to every vertex of each realized shard.
      Placing CaptureAttribute AFTER RealizeInstances would evaluate the random
      field at POINT domain — every vertex gets an independent random colour,
      destroying the one-colour-per-crystal intent.
    """
    ng  = bpy.data.node_groups.new("CrystalGrotto", 'GeometryNodeTree')
    mod = sphere_obj.modifiers.new("CrystalGrotto", 'NODES')
    mod.node_group = ng
    ifc = ng.interface
    ifc.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ifc.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    ifc.new_socket('Count',    in_out='INPUT',  socket_type='NodeSocketInt')
    ifc.new_socket('Seed',     in_out='INPUT',  socket_type='NodeSocketInt')
    ns = ng.nodes
    lk = ng.links.new

    gin  = ns.new('NodeGroupInput')
    gout = ns.new('NodeGroupOutput')

    # distribute points on faces — POISSON_DISK gives natural non-uniform scatter
    dpt = ns.new('GeometryNodeDistributePointsOnFaces')
    dpt.mode = 'POISSON_DISK'
    # minimum separation: ~14 % of sphere radius avoids extreme crystal overlap
    dpt.inputs['Distance Min'].default_value = SPHERE_RADIUS * 0.14

    # instance on points
    ionp = ns.new('GeometryNodeInstanceOnPoints')

    # shard prototype reference
    oi = ns.new('GeometryNodeObjectInfo')
    oi.inputs[0].default_value = shard_obj
    # ORIGINAL: use the prototype mesh as-is (not relative to scatter sphere origin)
    oi.transform_space = 'ORIGINAL'

    # random height scale — tall/short crystals (XY scale stays 1 to preserve cross-section)
    rscl = ns.new('FunctionNodeRandomValue')
    rscl.data_type = 'FLOAT'
    rscl.inputs['Min'].default_value  = SCALE_MIN
    rscl.inputs['Max'].default_value  = SCALE_MAX
    rscl.inputs['Seed'].default_value = 7
    cscl = ns.new('ShaderNodeCombineXYZ')
    cscl.inputs['X'].default_value = 1.0
    cscl.inputs['Y'].default_value = 1.0

    # per-instance hue [0, 1] — DIFFERENT seed from rscl to avoid correlation
    rhue = ns.new('FunctionNodeRandomValue')
    rhue.data_type = 'FLOAT'
    rhue.inputs['Min'].default_value  = 0.0
    rhue.inputs['Max'].default_value  = 1.0
    rhue.inputs['Seed'].default_value = 31

    # CaptureAttribute at INSTANCE domain — stores per-instance value in geometry
    cap = ns.new('GeometryNodeCaptureAttribute')
    cap.domain    = 'INSTANCE'
    cap.data_type = 'FLOAT'

    # RealizeInstances — converts instance list to real vertex geometry
    real = ns.new('GeometryNodeRealizeInstances')

    # StoreNamedAttribute — assigns the stable name 'crystal_hue' post-realization
    store = ns.new('GeometryNodeStoreNamedAttribute')
    store.domain    = 'POINT'
    store.data_type = 'FLOAT'
    store.inputs['Name'].default_value = 'crystal_hue'

    smat = ns.new('GeometryNodeSetMaterial')
    smat.inputs[2].default_value = mat

    shd = ns.new('GeometryNodeSetShadeSmooth')
    shd.domain = 'FACE'
    shd.inputs[2].default_value = False   # flat shading

    # geometry chain
    lk(gin.outputs['Geometry'],         dpt.inputs['Mesh'])
    lk(gin.outputs['Count'],            dpt.inputs['Maximum Count'])
    lk(gin.outputs['Seed'],             dpt.inputs['Seed'])
    lk(dpt.outputs['Points'],           ionp.inputs['Points'])
    # Rotation output aligns instance +Z axis to the face normal — crystals grow outward
    lk(dpt.outputs['Rotation'],         ionp.inputs['Rotation'])
    lk(oi.outputs['Geometry'],          ionp.inputs['Instance'])
    lk(rscl.outputs['Value'],           cscl.inputs['Z'])
    lk(cscl.outputs['Vector'],          ionp.inputs['Scale'])
    lk(ionp.outputs['Instances'],       cap.inputs['Geometry'])
    lk(rhue.outputs['Value'],           cap.inputs[1])    # Value socket
    lk(cap.outputs['Geometry'],         real.inputs['Geometry'])
    lk(real.outputs['Geometry'],        store.inputs['Geometry'])
    lk(cap.outputs[1],                  store.inputs[3])  # Attribute → Value
    lk(store.outputs['Geometry'],       smat.inputs['Geometry'])
    lk(smat.outputs['Geometry'],        shd.inputs['Geometry'])
    lk(shd.outputs['Geometry'],         gout.inputs['Geometry'])

    # set modifier defaults via dynamic identifier lookup
    for item in ng.interface.items_tree:
        if item.in_out != 'INPUT':
            continue
        if item.name == 'Count':
            mod[item.identifier] = SCATTER_COUNT
        elif item.name == 'Seed':
            mod[item.identifier] = SCATTER_SEED

    # node positions
    for xi, nd in enumerate([gin, dpt, ionp, cap, real, store, smat, shd, gout]):
        nd.location = (xi * 250 - 1000, 0)
    oi.location   = ( dpt.location[0] + 250, -320)
    rscl.location = ( dpt.location[0],        -320)
    cscl.location = ( dpt.location[0] + 250,  -470)
    rhue.location = (ionp.location[0],         -320)
    return mod


# ── lighting ──────────────────────────────────────────────────────────────────
def setup_lights():
    for name, kind, loc, energy, col in [
        ('Key',  'AREA',  ( 3.2, -2.0,  3.0), 400.0, (1.00, 0.96, 0.88)),
        ('Fill', 'POINT', (-2.5,  2.2,  0.8),  80.0, (0.70, 0.82, 1.00)),
        ('Amb',  'POINT', ( 0.0,  0.0, -1.6),  15.0, (1.00, 1.00, 1.00)),
    ]:
        ld = bpy.data.lights.new(name, kind)
        ld.energy = energy; ld.color = col
        lo = bpy.data.objects.new(name, ld); lo.location = loc
        bpy.context.collection.objects.link(lo)


# ── camera ────────────────────────────────────────────────────────────────────
def setup_camera():
    cd = bpy.data.cameras.new("Camera"); cd.lens = 50.0
    co = bpy.data.objects.new("Camera", cd)
    co.location        = (0.0, -3.4, 0.6)
    co.rotation_euler  = (math.radians(79), 0.0, 0.0)
    bpy.context.collection.objects.link(co)
    bpy.context.scene.camera = co


# ── GLB export ────────────────────────────────────────────────────────────────
def export_glb(filepath=OUTPUT_GLB):
    """
    export_apply=True bakes the NODES modifier — without it the exporter may
    write the prototype mesh only (a single 26-vertex shard) instead of the full
    realized crystal buffer.  export_attributes=True writes 'crystal_hue' as
    the glTF custom vertex attribute '_crystal_hue' (underscore prefix per spec).
    Three.js: geometry.attributes['_crystal_hue'].array → Float32Array of hues.
    """
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_attributes=True,
        export_materials='EXPORT',
        export_image_format='WEBP',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_yup=True,
        export_animations=False,
    )


# ── main ──────────────────────────────────────────────────────────────────────
def main():
    setup_scene()
    shard_obj = make_shard_prototype()
    mat       = make_material()
    sphere    = make_scatter_sphere()
    sphere.data.materials.append(mat)
    build_gn(sphere, shard_obj, mat)
    setup_lights()
    setup_camera()
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # export static GLB before adding rotation animation
    export_glb()

    # slow full-rotation for the viewport record clip
    sphere.rotation_euler = (0.0, 0.0, 0.0)
    sphere.keyframe_insert(data_path='rotation_euler', frame=1)
    sphere.rotation_euler = (0.0, 0.0, math.tau)
    sphere.keyframe_insert(data_path='rotation_euler', frame=ANIM_FRAMES)
    if sphere.animation_data and sphere.animation_data.action:
        for fc in sphere.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

    here = pathlib.Path(bpy.data.filepath).parent if bpy.data.filepath else pathlib.Path.cwd()
    bpy.ops.wm.save_as_mainfile(filepath=str(here / BLEND_FILENAME))
    print("Crystal grotto saved and exported.")


if __name__ == '__main__':
    main()
