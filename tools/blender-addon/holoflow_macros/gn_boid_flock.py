"""
holoflow_macros/gn_boid_flock.py
Blender 5.1  ·  CC0  ·  Holoflow Studio

Reusable macro: add_boid_flock(obj, instance_obj, **kwargs)
Applies a ready-to-run Geometry Nodes boid-flock modifier to any mesh object
that has a 'vel' FLOAT_VECTOR attribute on its POINT domain.

Typical usage:
    import bpy
    from holoflow_macros.gn_boid_flock import add_boid_flock, init_vel_attribute

    cloud = bpy.data.objects['my_points']
    cone  = bpy.data.objects['my_cone']
    init_vel_attribute(cloud, speed=0.04)
    add_boid_flock(cloud, cone, sep_weight=0.06, align_weight=0.08, coh_weight=0.005)
"""

import bpy

VEL_ATTR = 'vel'


def init_vel_attribute(obj: bpy.types.Object, speed: float = 0.04, seed: int = 7):
    """Add / reset the 'vel' FLOAT_VECTOR attribute with random unit velocities."""
    import math, random
    me  = obj.data
    rng = random.Random(seed)

    if VEL_ATTR in me.attributes:
        me.attributes.remove(me.attributes[VEL_ATTR])
    attr = me.attributes.new(VEL_ATTR, 'FLOAT_VECTOR', 'POINT')

    for i in range(len(me.vertices)):
        while True:
            u = rng.gauss(0, 1)
            v = rng.gauss(0, 1)
            w = rng.gauss(0, 1)
            m = math.sqrt(u*u + v*v + w*w)
            if m > 1e-6:
                break
        attr.data[i].vector = (u/m * speed, v/m * speed, w/m * speed)


def add_boid_flock(
    obj: bpy.types.Object,
    instance_obj: bpy.types.Object,
    *,
    sep_weight: float   = 0.06,
    align_weight: float = 0.08,
    coh_weight: float   = 0.005,
    max_speed: float    = 0.12,
    tree_name: str      = 'BoidFlockGN',
) -> bpy.types.NodesModifier:
    """Attach a boid-flock GN modifier to obj and return it."""

    mod = obj.modifiers.new('BoidFlock', 'NODES')
    ng  = bpy.data.node_groups.new(tree_name, 'GeometryNodeTree')
    mod.node_group = ng
    nodes, links = ng.nodes, ng.links

    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')

    g_in  = nodes.new('NodeGroupInput');  g_in.location  = (-1400, 0)
    g_out = nodes.new('NodeGroupOutput'); g_out.location = ( 1600, 0)

    sim_in  = nodes.new('GeometryNodeSimulationInput')
    sim_out = nodes.new('GeometryNodeSimulationOutput')
    sim_in.location  = (-1000, 0)
    sim_out.location = ( 800, 0)
    sim_in.pair_with_output(sim_out)
    links.new(g_in.outputs['Geometry'], sim_in.inputs['Geometry'])

    def vm(op, a, b=None, *, loc=(0, 0)):
        n = nodes.new('ShaderNodeVectorMath')
        n.operation = op; n.location = loc
        links.new(a, n.inputs[0])
        if b is not None:
            if isinstance(b, (int, float)):
                n.inputs['Scale'].default_value = b
            else:
                links.new(b, n.inputs[1])
        return n

    def sm(op, a, b=None, *, loc=(0, 0)):
        n = nodes.new('ShaderNodeMath')
        n.operation = op; n.location = loc
        (links.new if not isinstance(a, (int, float)) else lambda *_: setattr(n.inputs[0], 'default_value', a))(a, n.inputs[0])
        if b is not None:
            if isinstance(b, (int, float)):
                n.inputs[1].default_value = b
            else:
                links.new(b, n.inputs[1])
        return n

    n_pos = nodes.new('GeometryNodeInputPosition'); n_pos.location = (-750, 200)

    n_read_vel = nodes.new('GeometryNodeInputNamedAttribute')
    n_read_vel.data_type = 'FLOAT_VECTOR'
    n_read_vel.inputs['Name'].default_value = VEL_ATTR
    n_read_vel.location = (-750, 0)

    n_near = nodes.new('GeometryNodeIndexOfNearest'); n_near.location = (-550, 100)

    def sample(data_type, value_sock, *, loc=(0, 0)):
        n = nodes.new('GeometryNodeSampleIndex')
        n.data_type = data_type; n.domain = 'POINT'; n.location = loc
        links.new(sim_in.outputs['Geometry'], n.inputs['Geometry'])
        links.new(value_sock, n.inputs['Value'])
        links.new(n_near.outputs['Index'], n.inputs['Index'])
        return n

    n_sp = sample('FLOAT_VECTOR', n_pos.outputs['Position'],      loc=(-350, 200))
    n_sv = sample('FLOAT_VECTOR', n_read_vel.outputs['Attribute'], loc=(-350,   0))

    # Separation
    sep = vm('SCALE', vm('NORMALIZE', vm('SUBTRACT', n_pos.outputs['Position'],
             n_sp.outputs['Value'], loc=(-150,300)).outputs['Vector'],
             loc=(50,300)).outputs['Vector'], sep_weight, loc=(250,300))

    # Alignment
    aln = vm('SCALE', vm('SUBTRACT', n_sv.outputs['Value'],
             n_read_vel.outputs['Attribute'], loc=(-150,0)).outputs['Vector'],
             align_weight, loc=(50,0))

    # Cohesion
    n_stat = nodes.new('GeometryNodeAttributeStatistic')
    n_stat.data_type = 'FLOAT_VECTOR'; n_stat.domain = 'POINT'; n_stat.location = (-350,-220)
    links.new(sim_in.outputs['Geometry'], n_stat.inputs['Geometry'])
    links.new(n_pos.outputs['Position'],  n_stat.inputs['Attribute'])
    coh = vm('SCALE', vm('SUBTRACT', n_stat.outputs['Mean'],
             n_pos.outputs['Position'], loc=(-150,-200)).outputs['Vector'],
             coh_weight, loc=(50,-200))

    # Sum + clamp
    v3 = vm('ADD', vm('ADD', vm('ADD', n_read_vel.outputs['Attribute'],
            sep.outputs['Vector'], loc=(400,150)).outputs['Vector'],
            aln.outputs['Vector'], loc=(550,100)).outputs['Vector'],
            coh.outputs['Vector'], loc=(700,50))
    spd = vm('LENGTH', v3.outputs['Vector'], loc=(850,-50))
    n_new_vel = vm('SCALE', vm('NORMALIZE', v3.outputs['Vector'], loc=(850,100)).outputs['Vector'],
                   loc=(1150,50))
    links.new(sm('MINIMUM', spd.outputs['Value'], max_speed, loc=(1000,-50)).outputs['Value'],
              n_new_vel.inputs['Scale'])

    # Integrate + store
    n_sp2 = nodes.new('GeometryNodeSetPosition'); n_sp2.location = (1300,150)
    links.new(sim_in.outputs['Geometry'], n_sp2.inputs['Geometry'])
    links.new(vm('ADD', n_pos.outputs['Position'], n_new_vel.outputs['Vector'],
                 loc=(1150,200)).outputs['Vector'], n_sp2.inputs['Position'])

    n_sto = nodes.new('GeometryNodeStoreNamedAttribute')
    n_sto.data_type = 'FLOAT_VECTOR'; n_sto.domain = 'POINT'
    n_sto.inputs['Name'].default_value = VEL_ATTR; n_sto.location = (1450,100)
    links.new(n_sp2.outputs['Geometry'],  n_sto.inputs['Geometry'])
    links.new(n_new_vel.outputs['Vector'], n_sto.inputs['Value'])
    links.new(n_sto.outputs['Geometry'],  sim_out.inputs['Geometry'])

    # Instance orientation outside zone
    n_vout = nodes.new('GeometryNodeInputNamedAttribute')
    n_vout.data_type = 'FLOAT_VECTOR'; n_vout.inputs['Name'].default_value = VEL_ATTR
    n_vout.location = (900,-300)

    n_ali = nodes.new('FunctionNodeAlignEulerToVector')
    n_ali.axis = 'Z'; n_ali.pivot_axis = 'AUTO'; n_ali.location = (1050,-300)
    links.new(n_vout.outputs['Attribute'], n_ali.inputs['Vector'])

    n_inst = nodes.new('GeometryNodeInstanceOnPoints'); n_inst.location = (1300,-250)
    links.new(sim_out.outputs['Geometry'],  n_inst.inputs['Points'])
    links.new(n_ali.outputs['Rotation'],    n_inst.inputs['Rotation'])
    n_inst.inputs['Instance'].default_value = instance_obj
    links.new(n_inst.outputs['Instances'],  g_out.inputs['Geometry'])

    return mod
