"""
GN Simulation Zone — Euler-Integrated Rolling Sphere
Blender 5.1  |  CC0  |  Holoflow Studio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNIQUE
A Geometry Nodes Simulation Zone carries two VECTOR state items (Position,
Velocity) across frames. Each frame: (1) add gravity*dt to velocity, (2) predict
next position, (3) Raycast straight down against the terrain, (4) if the sphere
penetrates the surface (hit_distance < sphere_radius), reflect velocity off the
hit normal using v - 2·dot(v,n)·n and scale by the restitution coefficient,
then clamp position to hit_pos + normal*radius. This is explicit Euler
integration — first-order accurate, stable at 24 fps for moderate speeds, and
requires zero external physics engine involvement.

WHY NOT BLENDER'S RIGID BODY
Blender's rigid body engine solves a full multi-body constraint system each
frame and cannot be baked inside a GN modifier. The Simulation Zone approach
runs entirely inside GN, so it exports correctly to GLB, works headlessly, and
its state is accessible to other GN nodes (shaders, scatter, trails).

RUN
    blender --background --python blueprint.py
OUTPUTS
    rolling_sphere.blend
    rolling_sphere_frame60.glb (sphere mid-bounce on terrain, Draco 6, WebP)

Outside source — Blender Manual: Simulation Zone Node
    https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html
    Licence: CC BY-SA 4.0  ·  © Blender Foundation  ·  sibling: github.com/blender/blender
Outside source — Wikipedia: Euler method
    https://en.wikipedia.org/wiki/Euler_method
    Licence: CC BY-SA 3.0  ·  Various contributors
"""

import bpy, bmesh, math

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
TERRAIN_NAME   = "rolling_terrain"
SPHERE_SRC     = "sphere_source"
HOST_NAME      = "physics_host"
GN_NAME        = "RollingSphereSim"
OUTPUT_BLEND   = "//rolling_sphere.blend"
OUTPUT_GLB     = "//rolling_sphere_frame60.glb"

SPHERE_RADIUS  = 0.12          # metres — icosphere bounding radius
INITIAL_POS    = (0.0, 1.8, 2.2)   # launch point (terrain-local, above a hill)
INITIAL_VEL    = (0.28, -0.65, 0.0)  # m/s — angled across the terrain
GRAVITY_Z      = -9.81             # m/s²
RESTITUTION    = 0.55              # energy fraction retained per bounce
DT             = 1.0 / 24.0       # seconds per frame at 24 fps
SIM_FRAMES     = 120
GLB_FRAME      = 60               # snapshot mid-trajectory

TERRAIN_HALF   = 2.5              # 5 m × 5 m mesh
TERRAIN_DIVS   = 18               # cuts → (DIVS+1)² vertices


# ── SCENE SETUP ────────────────────────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for b in list(bpy.data.meshes):      bpy.data.meshes.remove(b)
    for b in list(bpy.data.node_groups): bpy.data.node_groups.remove(b)


def build_terrain():
    """
    Subdivided plane with two-frequency sin/cos displacement.
    Pure math displacement (no random seed) guarantees the same hills every run.
    Flat-shaded throughout — consistent with holoflow:facet aesthetics.
    """
    bpy.ops.mesh.primitive_plane_add(size=TERRAIN_HALF * 2, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = TERRAIN_NAME
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=TERRAIN_DIVS, use_grid_fill=True)
    for v in bm.verts:
        x, y = v.co.x, v.co.y
        v.co.z = (
            0.28 * math.sin(x * 2.4 + 0.7) * math.cos(y * 1.9 + 1.1)
            + 0.14 * math.sin(x * 5.2 + 2.0) * math.cos(y * 4.0 + 0.4)
        )
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    for p in obj.data.polygons:
        p.use_smooth = False
    return obj


def build_sphere_source():
    """
    Icosphere template — placed off-screen, hidden from render.
    The GN InstanceOnPoints node references this via ObjectInfo; the instance
    appears at the simulated position each frame rather than at this location.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2, radius=SPHERE_RADIUS, location=(0, -100, 0)
    )
    obj = bpy.context.active_object
    obj.name = SPHERE_SRC
    obj.hide_render = True
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def build_host():
    """Empty mesh object that carries the GN physics modifier."""
    mesh = bpy.data.meshes.new(HOST_NAME)
    obj = bpy.data.objects.new(HOST_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ── GEOMETRY NODES TREE ────────────────────────────────────────────────────────
def build_gn_tree(host_obj, terrain_obj, sphere_obj):
    """
    Build the full Simulation Zone node tree for the rolling sphere.

    BODY STRATEGY
    The simulation zone body is a single-point PointCloud (GeometryNodePoints,
    count=1). Inside the zone, SetPosition moves that point to the predicted
    sphere position so Raycast can fire from InputPosition — implicitly the body
    point's world position. A second SetPosition updates the body to the final
    corrected position. Outside the zone, sim_out.outputs['Geometry'] holds the
    body at the final position; InstanceOnPoints drops the sphere template there.

    SWITCH SOCKET LAYOUT (Blender 5.1)
    GeometryNodeSwitch with input_type='VECTOR':
      inputs[0]  = condition (bool)
      inputs[4]  = False branch (vector)   ← skips FLOAT/INT/BOOL groups
      inputs[5]  = True branch (vector)
    output: outputs['Output'] (vector)

    VectorMath SCALE / DOT_PRODUCT quirks:
      SCALE  → inputs[0]='Vector', inputs[3]='Scale'  (not inputs[1])
      DOT    → outputs[1]='Value' holds the scalar     (not outputs[0])
    """
    mod = host_obj.modifiers.new(GN_NAME, 'NODES')
    tree = bpy.data.node_groups.new(GN_NAME, 'GeometryNodeTree')
    mod.node_group = tree
    nodes, links = tree.nodes, tree.links

    def N(bl_type, label=""):
        n = nodes.new(bl_type)
        if label: n.label = label
        return n

    def L(src, dst):
        links.new(src, dst)

    # ── Group IO ───────────────────────────────────────────────────────────────
    g_in  = N('NodeGroupInput')
    g_out = N('NodeGroupOutput')
    iface = tree.interface

    iface.new_socket('Geometry',         in_out='OUTPUT', socket_type='NodeSocketGeometry')
    iface.new_socket('Geometry',         in_out='INPUT',  socket_type='NodeSocketGeometry')
    s = iface.new_socket('Initial Position', in_out='INPUT', socket_type='NodeSocketVector')
    s.default_value = INITIAL_POS
    s = iface.new_socket('Initial Velocity', in_out='INPUT', socket_type='NodeSocketVector')
    s.default_value = INITIAL_VEL
    s = iface.new_socket('Gravity Z',    in_out='INPUT', socket_type='NodeSocketFloat')
    s.default_value = GRAVITY_Z
    s = iface.new_socket('Restitution',  in_out='INPUT', socket_type='NodeSocketFloat')
    s.default_value = RESTITUTION
    s = iface.new_socket('Sphere Radius',in_out='INPUT', socket_type='NodeSocketFloat')
    s.default_value = SPHERE_RADIUS

    # ── Body: single-point PointCloud ─────────────────────────────────────────
    n_body = N('GeometryNodePoints', 'Body (1 pt)')
    n_body.inputs['Count'].default_value = 1
    L(g_in.outputs['Initial Position'], n_body.inputs['Position'])

    # ── Simulation Zone ────────────────────────────────────────────────────────
    sim_out = N('GeometryNodeSimulationOutput', 'Sim Out')
    sim_out.state_items.new('VECTOR', 'Position')
    sim_out.state_items.new('VECTOR', 'Velocity')
    sim_in = N('GeometryNodeSimulationInput', 'Sim In')
    sim_in.pair_with_output(sim_out)

    # Skip-path (frame 1) initial values
    L(n_body.outputs['Geometry'],          sim_in.inputs['Geometry'])
    L(g_in.outputs['Initial Position'],    sim_in.inputs['Position'])
    L(g_in.outputs['Initial Velocity'],    sim_in.inputs['Velocity'])

    # ── INSIDE ZONE: gravity integration ──────────────────────────────────────
    n_dt = N('ShaderNodeValue', 'dt = 1/24')
    n_dt.outputs[0].default_value = DT

    n_grav_dt = N('ShaderNodeMath', 'gravity×dt')
    n_grav_dt.operation = 'MULTIPLY'
    L(g_in.outputs['Gravity Z'], n_grav_dt.inputs[0])
    L(n_dt.outputs[0],           n_grav_dt.inputs[1])

    n_grav_vec = N('ShaderNodeCombineXYZ', 'Δvel/frame')
    n_grav_vec.inputs[0].default_value = 0.0
    n_grav_vec.inputs[1].default_value = 0.0
    L(n_grav_dt.outputs[0], n_grav_vec.inputs[2])  # Z only

    n_vel_new = N('ShaderNodeVectorMath', 'vel + gravity')
    n_vel_new.operation = 'ADD'
    L(sim_in.outputs['Velocity'],     n_vel_new.inputs[0])
    L(n_grav_vec.outputs['Vector'],   n_vel_new.inputs[1])

    # ── INSIDE ZONE: position prediction ──────────────────────────────────────
    n_vel_dt = N('ShaderNodeVectorMath', 'vel×dt')
    n_vel_dt.operation = 'SCALE'
    L(n_vel_new.outputs['Vector'], n_vel_dt.inputs[0])   # Vector
    L(n_dt.outputs[0],            n_vel_dt.inputs[3])    # Scale (index 3, not 1)

    n_pos_pred = N('ShaderNodeVectorMath', 'pos predicted')
    n_pos_pred.operation = 'ADD'
    L(sim_in.outputs['Position'],    n_pos_pred.inputs[0])
    L(n_vel_dt.outputs['Vector'],    n_pos_pred.inputs[1])

    # ── INSIDE ZONE: SetPosition → body point moves to pos_pred ───────────────
    # Raycast later uses InputPosition (implicit) = this predicted location.
    n_sp1 = N('GeometryNodeSetPosition', 'Body→pred')
    L(sim_in.outputs['Geometry'],    n_sp1.inputs['Geometry'])
    L(n_pos_pred.outputs['Vector'],  n_sp1.inputs['Position'])

    # ── INSIDE ZONE: Raycast downward against terrain ─────────────────────────
    n_terrain = N('GeometryNodeObjectInfo', 'Terrain')
    n_terrain.transform_space = 'ORIGINAL'
    n_terrain.inputs['Object'].default_value = terrain_obj

    n_down = N('ShaderNodeCombineXYZ', 'Down dir')
    n_down.inputs[0].default_value =  0.0
    n_down.inputs[1].default_value =  0.0
    n_down.inputs[2].default_value = -1.0

    n_ray = N('GeometryNodeRaycast', 'Down Raycast')
    n_ray.data_type = 'FLOAT'
    n_ray.inputs['Ray Length'].default_value = 8.0
    L(n_terrain.outputs['Geometry'], n_ray.inputs['Target Geometry'])
    L(n_down.outputs['Vector'],      n_ray.inputs['Ray Direction'])
    # Ray Origin intentionally omitted → uses InputPosition = body pt at pos_pred

    # ── INSIDE ZONE: collision detection ──────────────────────────────────────
    # is_penetrating = hit_distance < sphere_radius
    n_pen = N('FunctionNodeCompare', 'Penetrating?')
    n_pen.data_type = 'FLOAT'
    n_pen.operation = 'LESS_THAN'
    L(n_ray.outputs['Hit Distance'],  n_pen.inputs[0])  # A
    L(g_in.outputs['Sphere Radius'],  n_pen.inputs[1])  # B

    n_and = N('FunctionNodeBooleanMath', 'is_hit AND pen')
    n_and.operation = 'AND'
    L(n_ray.outputs['Is Hit'],        n_and.inputs[0])
    L(n_pen.outputs['Result'],        n_and.inputs[1])

    # ── INSIDE ZONE: reflection formula v - 2·dot(v,n)·n ·restitution ─────────
    n_dot = N('ShaderNodeVectorMath', 'dot(vel,n)')
    n_dot.operation = 'DOT_PRODUCT'
    L(n_vel_new.outputs['Vector'],    n_dot.inputs[0])
    L(n_ray.outputs['Hit Normal'],    n_dot.inputs[1])
    # DOT_PRODUCT scalar lives in outputs[1] ('Value'), not outputs[0] ('Vector')

    n_2dot = N('ShaderNodeMath', '2·dot')
    n_2dot.operation = 'MULTIPLY'
    n_2dot.inputs[1].default_value = 2.0
    L(n_dot.outputs[1],              n_2dot.inputs[0])

    n_ns = N('ShaderNodeVectorMath', '2·dot·n')
    n_ns.operation = 'SCALE'
    L(n_ray.outputs['Hit Normal'],   n_ns.inputs[0])  # Vector
    L(n_2dot.outputs[0],             n_ns.inputs[3])  # Scale

    n_vr_raw = N('ShaderNodeVectorMath', 'v - 2·dot·n')
    n_vr_raw.operation = 'SUBTRACT'
    L(n_vel_new.outputs['Vector'],   n_vr_raw.inputs[0])
    L(n_ns.outputs['Vector'],        n_vr_raw.inputs[1])

    n_vr = N('ShaderNodeVectorMath', 'vel·restitution')
    n_vr.operation = 'SCALE'
    L(n_vr_raw.outputs['Vector'],    n_vr.inputs[0])  # Vector
    L(g_in.outputs['Restitution'],   n_vr.inputs[3])  # Scale

    # ── INSIDE ZONE: corrected position = hit_pos + normal·radius ─────────────
    n_noff = N('ShaderNodeVectorMath', 'n·radius')
    n_noff.operation = 'SCALE'
    L(n_ray.outputs['Hit Normal'],   n_noff.inputs[0])
    L(g_in.outputs['Sphere Radius'], n_noff.inputs[3])

    n_pc = N('ShaderNodeVectorMath', 'pos corrected')
    n_pc.operation = 'ADD'
    L(n_ray.outputs['Hit Position'], n_pc.inputs[0])
    L(n_noff.outputs['Vector'],      n_pc.inputs[1])

    # ── INSIDE ZONE: Switch (free-flight vs bounce) ────────────────────────────
    n_sw_v = N('GeometryNodeSwitch', 'Vel switch')
    n_sw_v.input_type = 'VECTOR'
    L(n_and.outputs['Boolean'],      n_sw_v.inputs[0])  # condition
    L(n_vel_new.outputs['Vector'],   n_sw_v.inputs[4])  # False = free flight
    L(n_vr.outputs['Vector'],        n_sw_v.inputs[5])  # True  = bounce

    n_sw_p = N('GeometryNodeSwitch', 'Pos switch')
    n_sw_p.input_type = 'VECTOR'
    L(n_and.outputs['Boolean'],      n_sw_p.inputs[0])
    L(n_pos_pred.outputs['Vector'],  n_sw_p.inputs[4])  # False = predicted
    L(n_pc.outputs['Vector'],        n_sw_p.inputs[5])  # True  = corrected

    # ── INSIDE ZONE: update body geometry to final pos, pass to sim_out ────────
    # The body point at pos_final is what InstanceOnPoints uses outside the zone.
    # The Raycast above evaluated in the context of n_sp1 (body at pos_pred) —
    # NOT this geometry — because its outputs feed into n_sw_p via field wiring,
    # not via a geometry passthrough.
    n_sp2 = N('GeometryNodeSetPosition', 'Body→final')
    L(n_sp1.outputs['Geometry'],     n_sp2.inputs['Geometry'])
    L(n_sw_p.outputs['Output'],      n_sp2.inputs['Position'])

    L(n_sp2.outputs['Geometry'],     sim_out.inputs['Geometry'])
    L(n_sw_p.outputs['Output'],      sim_out.inputs['Position'])
    L(n_sw_v.outputs['Output'],      sim_out.inputs['Velocity'])

    # ── OUTSIDE ZONE: instance sphere at tracked position ─────────────────────
    n_sph_info = N('GeometryNodeObjectInfo', 'Sphere src')
    n_sph_info.transform_space = 'ORIGINAL'
    n_sph_info.inputs['Object'].default_value = sphere_obj

    # sim_out.Geometry = body (1 pt) at pos_final → use directly as instance host
    n_inst = N('GeometryNodeInstanceOnPoints', 'Place sphere')
    L(sim_out.outputs['Geometry'],        n_inst.inputs['Points'])
    L(n_sph_info.outputs['Geometry'],     n_inst.inputs['Instance'])

    n_real = N('GeometryNodeRealizeInstances', 'Realize')
    L(n_inst.outputs['Instances'],    n_real.inputs['Geometry'])
    L(n_real.outputs['Geometry'],     g_out.inputs['Geometry'])


# ── SIMULATION ADVANCE ─────────────────────────────────────────────────────────
def advance_simulation(host_obj, n_frames):
    """
    Iterate the Simulation Zone sequentially.

    frame_set(N) alone is insufficient — the zone reads the PREVIOUS frame's
    cached geometry.  Skipping directly to frame 60 gives only the frame-1 state.
    view_layer.update() forces the GN modifier to evaluate and write to cache.
    """
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = n_frames
    bpy.context.view_layer.objects.active = host_obj
    for f in range(1, n_frames + 1):
        scene.frame_set(f)
        bpy.context.view_layer.update()


# ── GLB EXPORT ────────────────────────────────────────────────────────────────
def export_glb(host_obj, scene, frame):
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    host_obj.select_set(True)
    terrain = bpy.data.objects.get(TERRAIN_NAME)
    if terrain:
        terrain.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
        export_animations=False,
    )


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    clear_scene()
    terrain_obj = build_terrain()
    sphere_obj  = build_sphere_source()
    host_obj    = build_host()
    build_gn_tree(host_obj, terrain_obj, sphere_obj)
    advance_simulation(host_obj, SIM_FRAMES)
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    export_glb(host_obj, bpy.context.scene, GLB_FRAME)
    print(f"[rolling-sphere] blend saved, GLB at frame {GLB_FRAME}")


if __name__ == "__main__":
    main()
