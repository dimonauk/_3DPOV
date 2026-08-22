"""
GN Scene Time + Rotation Socket — Procedural Mechanical Clockwork
Blender 5.1  ·  CC0  ·  Holoflow Studio

Two meshing gears and a pendulum animated entirely inside Geometry Nodes using
the Scene Time node.  No keyframes.  No drivers.  No NLA actions.

The Rotation socket (formalised as a first-class GN socket type in Blender 4.3,
stable in 5.x) carries an Euler triple without the implicit-vector ambiguity of
passing a raw VECTOR socket to Transform Geometry.  EulerToRotation makes the
intent explicit and opens the door to downstream rotation composition via
FunctionNodeRotateRotation.

Node tree per animated object (3 separate GN modifiers, one per mesh):
  SceneTime.Frame  →  Math(MUL, angle_per_frame)  →  Math(ADD, phase)
  → CombineXYZ(0, 0, z_angle)  →  FunctionNodeEulerToRotation
  →  GeometryNodeTransform.Rotation

Pendulum uses SceneTime.Seconds instead:
  SceneTime.Seconds  →  Math(MUL, 2π/period)  →  Math(SINE)
  →  Math(MUL, amplitude)  →  CombineXYZ(x_angle, 0, 0)
  →  FunctionNodeEulerToRotation  →  GeometryNodeTransform.Rotation

Gear-ratio law: ω_small = −ω_big × (T_big / T_small)
  — opposite sign (external meshing reverses direction)
  — faster by the tooth-count ratio

Outside sources:
  Blender Manual — Scene Time node
    CC-BY-SA 4.0  ·  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/scene_time.html
    Related: all GN Input / Scene nodes at
      https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/
  Blender Manual — Euler to Rotation node
    CC-BY-SA 4.0  ·  Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/rotation/euler_to_rotation.html
    Related: Rotation to Euler, Rotate Rotation, Axis Angle to Rotation
      at https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/rotation/
"""

import bpy
import bmesh
import math

# ── Parameters ────────────────────────────────────────────────────────────────
TEETH_BIG        = 20          # tooth count on the driver gear
TEETH_SMALL      = 12          # tooth count on the follower gear
R_BIG            = 1.00        # root radius, driver gear (m)
R_SMALL          = R_BIG * TEETH_SMALL / TEETH_BIG   # 0.60 m — exact mesh tangency
TOOTH_HEIGHT     = 0.14        # radial distance from root to tip
TOOTH_FRACTION   = 0.46        # fraction of tooth arc occupied by the tip plateau
GEAR_WIDTH       = 0.20        # gear thickness along Z (m)

PENDULUM_LENGTH  = 1.60        # rod length below the driver-gear centre (m)
BOB_RADIUS       = 0.13        # pendulum bob disc radius (m)
PENDULUM_WIDTH   = 0.06        # rod + bob thickness along Z

SWING_AMP_RAD    = math.radians(26.0)    # ≈ ±26° swing
SWING_PERIOD_S   = 2.20                  # seconds per full oscillation (isochronous)

FPS              = 24
FRAME_END        = 120         # 5 s of clockwork at 24 fps

# Colours
COL_GEAR_BASE    = (0.10, 0.08, 0.20, 1.0)   # deep indigo-charcoal
COL_GEAR_EMIT    = (0.40, 0.80, 1.00, 1.0)   # cool cyan rim glow
COL_PENDULUM     = (0.80, 0.60, 0.10, 1.0)   # warm brass

EMIT_STRENGTH    = 2.5

# ── Gear mesh ─────────────────────────────────────────────────────────────────
def make_gear(name, teeth, r_root, r_tip, width):
    """
    Build a gear mesh via bmesh: profile polygon extruded to 'width' along -Z.

    Each tooth contributes 4 profile vertices:
        root_enter (r_root, angle - half_gap)
        tip_start  (r_tip,  angle - half_tip)
        tip_end    (r_tip,  angle + half_tip)
        root_exit  (r_root, angle + half_gap)

    The 'half_gap' is the root-arc half-angle between adjacent teeth; the
    'half_tip' is the addendum-plateau half-angle.  TOOTH_FRACTION controls
    the ratio: higher values produce wider tips (spur-gear style), lower
    values produce narrower spike teeth.
    """
    tau = 2.0 * math.pi
    apt = tau / teeth
    half_tip = apt * TOOTH_FRACTION * 0.5
    half_gap = apt * (1.0 - TOOTH_FRACTION) * 0.5

    profile = []
    for i in range(teeth):
        base = i * apt
        for (r, da) in (
            (r_root, -half_gap),
            (r_tip,  -half_tip),
            (r_tip,  +half_tip),
            (r_root, +half_gap),
        ):
            a = base + da
            profile.append((r * math.cos(a), r * math.sin(a), 0.0))

    N = len(profile)   # 4 × teeth

    mesh = bpy.data.meshes.new(name)
    bm   = bmesh.new()

    top = [bm.verts.new(v) for v in profile]
    bot = [bm.verts.new((v[0], v[1], -width)) for v in profile]

    bm.faces.new(top)                              # top face
    bm.faces.new(list(reversed(bot)))              # bottom face (flip winding)

    for i in range(N):                             # side quads
        j = (i + 1) % N
        bm.faces.new([top[i], bot[i], bot[j], top[j]])

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


# ── Pendulum mesh ─────────────────────────────────────────────────────────────
def make_pendulum(name, length, bob_radius, width):
    """
    Rod (thin rectangle) + bob (circle) as a single flat mesh, extruded to width.
    The pivot is at the origin so Transform Geometry rotation acts about (0,0,0).
    """
    ROD_W = 0.06
    mesh = bpy.data.meshes.new(name)
    bm   = bmesh.new()

    # Rod: simple quad
    rod_verts_top = [
        bm.verts.new((-ROD_W * 0.5,  0.0,    0.0)),
        bm.verts.new(( ROD_W * 0.5,  0.0,    0.0)),
        bm.verts.new(( ROD_W * 0.5, -length, 0.0)),
        bm.verts.new((-ROD_W * 0.5, -length, 0.0)),
    ]
    bm.faces.new(rod_verts_top)

    # Bob: circle centred at (0, -(length + bob_radius), 0)
    N_BOB = 20
    cx, cy = 0.0, -(length + bob_radius)
    bob_verts_top = []
    for i in range(N_BOB):
        a = 2.0 * math.pi * i / N_BOB
        bob_verts_top.append(bm.verts.new(
            (cx + bob_radius * math.cos(a), cy + bob_radius * math.sin(a), 0.0)
        ))
    bm.faces.new(bob_verts_top)

    # Extrude all top faces to -width
    result = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    verts_extruded = [v for v in result['geom'] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0.0, 0.0, -width), verts=verts_extruded)

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


# ── GN modifier: constant-rate Z rotation driven by Scene Time ────────────────
def build_rotation_gn(obj, angle_per_frame, phase_rad=0.0):
    """
    Add a Geometry Nodes modifier that rotates obj around its local Z axis.

    angle_per_frame (rad): how many radians to advance per frame.
      Positive = CCW when viewed from +Z.
      Negative = CW (external-meshing follower).

    Node chain:
      SceneTime.Frame
        → Math(MUL, angle_per_frame)
        → Math(ADD, phase_rad)        ← optional offset to dephase the gears
        → CombineXYZ(0, 0, z)
        → FunctionNodeEulerToRotation     ← explicit Rotation socket, Blender 5.1
        → GeometryNodeTransform.Rotation
    """
    mod  = obj.modifiers.new('SceneTimeRotation', 'NODES')
    tree = bpy.data.node_groups.new(f'GN_ZRotation_{obj.name}', 'GeometryNodeTree')
    mod.node_group = tree

    iface = tree.interface
    iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = tree.nodes
    links = tree.links

    gi   = nodes.new('NodeGroupInput');  gi.location   = (-700,  0)
    go   = nodes.new('NodeGroupOutput'); go.location   = ( 500,  0)
    time = nodes.new('GeometryNodeInputSceneTime'); time.location = (-500, 120)

    mul  = nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = angle_per_frame; mul.location = (-300, 120)

    add  = nodes.new('ShaderNodeMath'); add.operation = 'ADD'
    add.inputs[1].default_value = phase_rad;       add.location = (-100, 120)

    cxyz = nodes.new('ShaderNodeCombineXYZ');       cxyz.location = ( 100, 120)

    e2r  = nodes.new('FunctionNodeEulerToRotation'); e2r.location = ( 280, 120)

    xfrm = nodes.new('GeometryNodeTransform');       xfrm.location = ( 280, -60)

    links.new(time.outputs['Frame'],  mul.inputs[0])
    links.new(mul.outputs[0],         add.inputs[0])
    links.new(add.outputs[0],         cxyz.inputs['Z'])
    links.new(cxyz.outputs['Vector'], e2r.inputs['Euler'])
    links.new(e2r.outputs['Rotation'], xfrm.inputs['Rotation'])
    links.new(gi.outputs['Geometry'], xfrm.inputs['Geometry'])
    links.new(xfrm.outputs['Geometry'], go.inputs['Geometry'])


# ── GN modifier: sinusoidal X rotation for pendulum ───────────────────────────
def build_pendulum_gn(obj, amplitude_rad, period_seconds):
    """
    sin(Seconds × 2π/period) × amplitude → X rotation via Transform Geometry.

    Using SceneTime.Seconds (wall-clock seconds) rather than Frame makes the
    swing period independent of FPS — the pendulum isochronism is preserved
    whether the scene runs at 24, 30, or 60 fps.
    """
    mod  = obj.modifiers.new('PendulumSwing', 'NODES')
    tree = bpy.data.node_groups.new(f'GN_Pendulum_{obj.name}', 'GeometryNodeTree')
    mod.node_group = tree

    iface = tree.interface
    iface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    iface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = tree.nodes
    links = tree.links

    gi   = nodes.new('NodeGroupInput');  gi.location   = (-700,  0)
    go   = nodes.new('NodeGroupOutput'); go.location   = ( 500,  0)
    time = nodes.new('GeometryNodeInputSceneTime'); time.location = (-500, 120)

    freq = nodes.new('ShaderNodeMath'); freq.operation = 'MULTIPLY'
    freq.inputs[1].default_value = 2.0 * math.pi / period_seconds
    freq.location = (-300, 120)

    sin_ = nodes.new('ShaderNodeMath'); sin_.operation = 'SINE'
    sin_.location = (-100, 120)

    amp  = nodes.new('ShaderNodeMath'); amp.operation = 'MULTIPLY'
    amp.inputs[1].default_value = amplitude_rad; amp.location = (100, 120)

    cxyz = nodes.new('ShaderNodeCombineXYZ'); cxyz.location = (280, 120)
    e2r  = nodes.new('FunctionNodeEulerToRotation'); e2r.location = (460, 120)
    xfrm = nodes.new('GeometryNodeTransform');       xfrm.location = (460, -60)

    links.new(time.outputs['Seconds'], freq.inputs[0])
    links.new(freq.outputs[0],         sin_.inputs[0])
    links.new(sin_.outputs[0],         amp.inputs[0])
    links.new(amp.outputs[0],          cxyz.inputs['X'])
    links.new(cxyz.outputs['Vector'],  e2r.inputs['Euler'])
    links.new(e2r.outputs['Rotation'], xfrm.inputs['Rotation'])
    links.new(gi.outputs['Geometry'],  xfrm.inputs['Geometry'])
    links.new(xfrm.outputs['Geometry'], go.inputs['Geometry'])


# ── Material ──────────────────────────────────────────────────────────────────
def make_material(obj, base_col, emit_col, emit_strength):
    mat = bpy.data.materials.new(obj.name + '_mat')
    mat.use_nodes = True
    mat.blend_method = 'OPAQUE'
    nt  = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (400, 0)
    mix = nt.nodes.new('ShaderNodeMixShader');      mix.location = (200, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); bsdf.location = (-100, 80)
    emit = nt.nodes.new('ShaderNodeEmission');        emit.location = (-100, -80)
    fres = nt.nodes.new('ShaderNodeFresnel');         fres.location = (-300, 0)

    bsdf.inputs['Base Color'].default_value = base_col
    bsdf.inputs['Metallic'].default_value   = 0.9
    bsdf.inputs['Roughness'].default_value  = 0.25
    emit.inputs['Color'].default_value      = emit_col
    emit.inputs['Strength'].default_value   = emit_strength

    nt.links.new(fres.outputs['Fac'],  mix.inputs['Fac'])
    nt.links.new(bsdf.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emit.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'],    out.inputs['Surface'])

    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_homefile(use_empty=True)
    col = bpy.context.scene.collection

    # Scene settings
    scene = bpy.context.scene
    scene.render.fps      = FPS
    scene.frame_start     = 1
    scene.frame_end       = FRAME_END

    # ── Gears ─────────────────────────────────────────────────────────────────
    gear_big = make_gear(
        'gear_big', TEETH_BIG,
        r_root=R_BIG, r_tip=R_BIG + TOOTH_HEIGHT,
        width=GEAR_WIDTH,
    )

    gear_small = make_gear(
        'gear_small', TEETH_SMALL,
        r_root=R_SMALL, r_tip=R_SMALL + TOOTH_HEIGHT,
        width=GEAR_WIDTH,
    )
    # Position small gear so pitch circles are tangent
    gear_small.location.x = R_BIG + R_SMALL

    # Angle per frame for each gear (one tooth spacing per frame on the big gear)
    APF_BIG   =  2.0 * math.pi / TEETH_BIG     # +CCW
    APF_SMALL = -APF_BIG * (TEETH_BIG / TEETH_SMALL)  # −CW, faster

    build_rotation_gn(gear_big,   APF_BIG,   phase_rad=0.0)
    build_rotation_gn(gear_small, APF_SMALL,
                      phase_rad=math.pi / TEETH_SMALL)  # half-tooth dephase

    make_material(gear_big,   COL_GEAR_BASE, COL_GEAR_EMIT, EMIT_STRENGTH)
    make_material(gear_small, COL_GEAR_BASE, COL_GEAR_EMIT, EMIT_STRENGTH)

    # ── Pendulum ───────────────────────────────────────────────────────────────
    pendulum = make_pendulum(
        'pendulum', PENDULUM_LENGTH, BOB_RADIUS, PENDULUM_WIDTH
    )
    # Hang pendulum from the driver gear centre (0,0,0 is the gear hub)
    pendulum.location.z = -GEAR_WIDTH * 0.5

    build_pendulum_gn(pendulum, SWING_AMP_RAD, SWING_PERIOD_S)
    make_material(pendulum, COL_PENDULUM, COL_PENDULUM, 1.0)

    # ── Lighting ───────────────────────────────────────────────────────────────
    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
    col.objects.link(sun)
    sun.location        = (4, -6, 8)
    sun.data.energy     = 3.0
    sun.data.angle      = math.radians(5)

    # ── Camera ────────────────────────────────────────────────────────────────
    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    col.objects.link(cam)
    cam.location        = (0.8, -6.0, 0.8)
    cam.rotation_euler  = (math.radians(80), 0, math.radians(8))
    cam.data.lens       = 50
    scene.camera        = cam

    # ── Export GLB (frame 1 as rest snapshot; full range for animation) ────────
    bpy.ops.export_scene.gltf(
        filepath='//clockwork.glb',
        export_format='GLB',
        export_animations=True,
        export_bake_animation=True,
        export_force_sampling=True,
        export_frame_range=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )


if __name__ == '__main__':
    main()
