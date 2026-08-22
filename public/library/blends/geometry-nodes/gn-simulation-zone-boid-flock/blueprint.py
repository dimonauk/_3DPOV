"""
GN Simulation Zone — Boid Flocking: Cohesion + Separation + Alignment
Blender 5.1  ·  CC0  ·  Holoflow Studio

Craig Reynolds' three steering rules in a GN Simulation Zone.
Per-boid velocity is a FLOAT_VECTOR named attribute ('vel') on the Points
cloud; the single implicit Geometry body channel carries position and
momentum across frames — no extra state items required.
  Separation : NORMALIZE(self_pos - nearest_pos) × SEP_WEIGHT
  Alignment  : (nearest_vel - self_vel) × ALIGN_WEIGHT
  Cohesion   : (AttributeStatistic.Mean - self_pos) × COH_WEIGHT
Forces summed, speed-clamped (NORMALIZE+MIN+SCALE), Euler-integrated.

Outside sources
  Blender Manual — Index of Nearest Node  CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/index_of_nearest.html
  Blender Manual — Attribute Statistic Node  CC-BY-SA 4.0  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/attribute_statistic.html
"""

import bpy, bmesh, math, random

# ── Parameters ────────────────────────────────────────────────────────────────
BOID_COUNT     = 64      # agents; keep ≥ 32 for nearest-neighbour approx to hold
SPAWN_RADIUS   = 2.5     # metres — initial scatter sphere radius
INITIAL_SPEED  = 0.04    # m/frame seed velocity magnitude
MAX_SPEED      = 0.12    # m/frame hard cap (~3 m/s at 25 fps)
SEP_WEIGHT     = 0.06    # push magnitude away from nearest neighbour
ALIGN_WEIGHT   = 0.08    # pull toward nearest neighbour's velocity direction
COH_WEIGHT     = 0.005   # pull toward global flock centroid (gentle; no tunnelling)
VEL_ATTR       = 'vel'   # FLOAT_VECTOR attribute name on the Points cloud
BOID_OBJ_NAME  = 'boid_flock'
CONE_OBJ_NAME  = 'boid_instance'
FRAME_END      = 120
GLB_FRAME      = 60      # snapshot frame for GLB export
GLB_PATH       = '//../../glbs/geometry-nodes/gn-simulation-zone-boid-flock/boid_flock.glb'


# ── Scene helpers ─────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials) + list(bpy.data.node_groups):
        bpy.data.batch_remove([block])


def make_boid_cloud() -> bpy.types.Object:
    me = bpy.data.meshes.new(BOID_OBJ_NAME)
    bm = bmesh.new()
    rng = random.Random(42)
    for _ in range(BOID_COUNT):
        while True:                         # rejection-sample uniform sphere
            x, y, z = rng.uniform(-1,1), rng.uniform(-1,1), rng.uniform(-1,1)
            if x*x + y*y + z*z <= 1.0: break
        bm.verts.new((x*SPAWN_RADIUS, y*SPAWN_RADIUS, z*SPAWN_RADIUS))
    bm.to_mesh(me); bm.free()

    vel_attr = me.attributes.new(VEL_ATTR, 'FLOAT_VECTOR', 'POINT')
    rng2 = random.Random(7)
    for i in range(BOID_COUNT):
        while True:                         # Marsaglia unit-sphere direction
            u, v, w = rng2.gauss(0,1), rng2.gauss(0,1), rng2.gauss(0,1)
            mag = math.sqrt(u*u + v*v + w*w)
            if mag > 1e-6: break
        vel_attr.data[i].vector = (u/mag*INITIAL_SPEED, v/mag*INITIAL_SPEED, w/mag*INITIAL_SPEED)

    obj = bpy.data.objects.new(BOID_OBJ_NAME, me)
    bpy.context.collection.objects.link(obj)
    return obj


def make_cone_instance() -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(radius1=0.05, radius2=0.0, depth=0.18,
                                    location=(0, 0, -9999))
    cone = bpy.context.active_object
    cone.name = CONE_OBJ_NAME
    cone.hide_render = False

    mat = bpy.data.materials.new('BoidMat')
    mat.use_nodes = True
    nt = mat.node_tree
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value = (0.15, 0.85, 1.0, 1.0)
    emit.inputs['Strength'].default_value = 2.5
    nt.links.new(emit.outputs['Emission'],
                 nt.nodes['Material Output'].inputs['Surface'])
    cone.data.materials.append(mat)
    return cone


# ── Geometry Nodes tree ───────────────────────────────────────────────────────
def _vm(nodes, links, op, a, b=None, *, loc=(0, 0)):
    n = nodes.new('ShaderNodeVectorMath'); n.operation = op; n.location = loc
    links.new(a, n.inputs[0])
    if b is not None:
        (setattr(n.inputs['Scale'], 'default_value', b) if isinstance(b, (int, float))
         else links.new(b, n.inputs[1]))
    return n


def _sm(nodes, links, op, a, b=None, *, loc=(0, 0)):
    n = nodes.new('ShaderNodeMath'); n.operation = op; n.location = loc
    (setattr(n.inputs[0], 'default_value', a) if isinstance(a, (int, float))
     else links.new(a, n.inputs[0]))
    if b is not None:
        (setattr(n.inputs[1], 'default_value', b) if isinstance(b, (int, float))
         else links.new(b, n.inputs[1]))
    return n


def build_gn_tree(obj: bpy.types.Object, inst_obj: bpy.types.Object):
    mod = obj.modifiers.new('BoidFlock', 'NODES')
    ng  = bpy.data.node_groups.new('BoidFlockGN', 'GeometryNodeTree')
    mod.node_group = ng
    nodes, links = ng.nodes, ng.links

    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')

    g_in  = nodes.new('NodeGroupInput');  g_in.location  = (-1400, 0)
    g_out = nodes.new('NodeGroupOutput'); g_out.location = ( 1600, 0)

    sim_in  = nodes.new('GeometryNodeSimulationInput');  sim_in.location  = (-1000, 0)
    sim_out = nodes.new('GeometryNodeSimulationOutput'); sim_out.location = ( 800, 0)
    sim_in.pair_with_output(sim_out)
    links.new(g_in.outputs['Geometry'], sim_in.inputs['Geometry'])

    n_pos = nodes.new('GeometryNodeInputPosition'); n_pos.location = (-750, 200)

    n_read_vel = nodes.new('GeometryNodeInputNamedAttribute')
    n_read_vel.data_type = 'FLOAT_VECTOR'
    n_read_vel.inputs['Name'].default_value = VEL_ATTR
    n_read_vel.location = (-750, 0)

    # IndexOfNearest — leave Position unconnected → uses implicit position attribute.
    n_nearest = nodes.new('GeometryNodeIndexOfNearest'); n_nearest.location = (-550, 100)

    def sample(value_sock, *, loc):
        n = nodes.new('GeometryNodeSampleIndex')
        n.data_type = 'FLOAT_VECTOR'; n.domain = 'POINT'; n.location = loc
        links.new(sim_in.outputs['Geometry'], n.inputs['Geometry'])
        links.new(value_sock, n.inputs['Value'])
        links.new(n_nearest.outputs['Index'], n.inputs['Index'])
        return n

    n_sp = sample(n_pos.outputs['Position'],         loc=(-350, 200))
    n_sv = sample(n_read_vel.outputs['Attribute'],   loc=(-350,   0))

    # Separation: self_pos − nearest_pos → normalise → scale
    n_sep = _vm(nodes, links, 'SCALE', loc=(250, 300),
                a=_vm(nodes, links, 'NORMALIZE', loc=(50, 300),
                      a=_vm(nodes, links, 'SUBTRACT', n_pos.outputs['Position'],
                            n_sp.outputs['Value'], loc=(-150, 300)).outputs['Vector']
                      ).outputs['Vector'], b=SEP_WEIGHT)

    # Alignment: (nearest_vel − self_vel) × ALIGN_WEIGHT
    n_aln = _vm(nodes, links, 'SCALE', loc=(50, 0),
                a=_vm(nodes, links, 'SUBTRACT', n_sv.outputs['Value'],
                      n_read_vel.outputs['Attribute'], loc=(-150, 0)).outputs['Vector'],
                b=ALIGN_WEIGHT)

    # Cohesion: AttributeStatistic Mean → (centroid − self_pos) × COH_WEIGHT
    n_stat = nodes.new('GeometryNodeAttributeStatistic')
    n_stat.data_type = 'FLOAT_VECTOR'; n_stat.domain = 'POINT'; n_stat.location = (-350, -220)
    links.new(sim_in.outputs['Geometry'], n_stat.inputs['Geometry'])
    links.new(n_pos.outputs['Position'],  n_stat.inputs['Attribute'])
    n_coh = _vm(nodes, links, 'SCALE', loc=(50, -200),
                a=_vm(nodes, links, 'SUBTRACT', n_stat.outputs['Mean'],
                      n_pos.outputs['Position'], loc=(-150, -200)).outputs['Vector'],
                b=COH_WEIGHT)

    # Sum forces onto previous velocity.
    n_v3 = _vm(nodes, links, 'ADD', loc=(700, 50),
               a=_vm(nodes, links, 'ADD', loc=(550, 100),
                     a=_vm(nodes, links, 'ADD', n_read_vel.outputs['Attribute'],
                           n_sep.outputs['Vector'], loc=(400, 150)).outputs['Vector'],
                     b=n_aln.outputs['Vector']).outputs['Vector'],
               b=n_coh.outputs['Vector'])

    # Speed-clamp: NORMALIZE → SCALE with Math(MIN, speed, MAX_SPEED).
    n_new_vel = _vm(nodes, links, 'SCALE',
                    _vm(nodes, links, 'NORMALIZE', n_v3.outputs['Vector'], loc=(850, 100)).outputs['Vector'],
                    loc=(1150, 50))
    links.new(
        _sm(nodes, links, 'MINIMUM',
            _vm(nodes, links, 'LENGTH', n_v3.outputs['Vector'], loc=(850, -50)).outputs['Value'],
            MAX_SPEED, loc=(1000, -50)).outputs['Value'],
        n_new_vel.inputs['Scale']
    )

    # Euler integrate position.
    n_set_pos = nodes.new('GeometryNodeSetPosition'); n_set_pos.location = (1300, 150)
    links.new(sim_in.outputs['Geometry'],  n_set_pos.inputs['Geometry'])
    links.new(_vm(nodes, links, 'ADD', n_pos.outputs['Position'],
                  n_new_vel.outputs['Vector'], loc=(1150, 200)).outputs['Vector'],
              n_set_pos.inputs['Position'])

    # Store updated velocity → SimulationOutput closes the feedback loop.
    n_store = nodes.new('GeometryNodeStoreNamedAttribute')
    n_store.data_type = 'FLOAT_VECTOR'; n_store.domain = 'POINT'
    n_store.inputs['Name'].default_value = VEL_ATTR; n_store.location = (1450, 100)
    links.new(n_set_pos.outputs['Geometry'],  n_store.inputs['Geometry'])
    links.new(n_new_vel.outputs['Vector'],    n_store.inputs['Value'])
    links.new(n_store.outputs['Geometry'],    sim_out.inputs['Geometry'])

    # Outside zone: read post-update vel, orient cones, instance per boid.
    n_vel_out = nodes.new('GeometryNodeInputNamedAttribute')
    n_vel_out.data_type = 'FLOAT_VECTOR'
    n_vel_out.inputs['Name'].default_value = VEL_ATTR; n_vel_out.location = (900, -300)

    n_align = nodes.new('FunctionNodeAlignEulerToVector')
    n_align.axis = 'Z'; n_align.pivot_axis = 'AUTO'; n_align.location = (1050, -300)
    links.new(n_vel_out.outputs['Attribute'], n_align.inputs['Vector'])

    n_inst = nodes.new('GeometryNodeInstanceOnPoints'); n_inst.location = (1300, -250)
    links.new(sim_out.outputs['Geometry'], n_inst.inputs['Points'])
    links.new(n_align.outputs['Rotation'], n_inst.inputs['Rotation'])
    n_inst.inputs['Instance'].default_value = inst_obj
    links.new(n_inst.outputs['Instances'], g_out.inputs['Geometry'])


# ── Camera and world ──────────────────────────────────────────────────────────
def setup_scene():
    scene = bpy.context.scene
    scene.frame_end = FRAME_END
    scene.render.engine = 'BLENDER_EEVEE_NEXT'

    bpy.ops.object.camera_add(location=(0, -14, 4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(80), 0, 0)
    scene.camera = cam

    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value    = (0.02, 0.02, 0.06, 1.0)
    bg.inputs['Strength'].default_value = 1.0


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()
    boid_cloud = make_boid_cloud()
    cone       = make_cone_instance()
    build_gn_tree(boid_cloud, cone)
    setup_scene()

    scene = bpy.context.scene

    # Sequential advance mandatory — jumping to GLB_FRAME produces wrong results.
    for f in range(1, GLB_FRAME + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath('//boid_flock.blend'))

    bpy.ops.export_scene.gltf(
        filepath        = bpy.path.abspath(GLB_PATH),
        export_format   = 'GLB',
        export_apply    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
    )
    print(f'[holoflow] boid_flock.blend + GLB written at frame {GLB_FRAME}.')


main()
