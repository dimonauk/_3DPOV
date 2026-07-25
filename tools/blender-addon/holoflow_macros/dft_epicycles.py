"""
holoflow_macros.dft_epicycles — Blender 5.1
────────────────────────────────────────────
Reusable macro: decompose any complex-valued closed-curve sampler into
N_H DFT epicycles and build an animated parent chain in the active scene.

Usage
─────
    from holoflow_macros.dft_epicycles import build_dft_chain

    def my_path(t):
        import cmath, math
        return cmath.exp(2j * math.pi * t) + 0.3 * cmath.exp(-6j * math.pi * t)

    build_dft_chain(
        sampler   = my_path,
        n_h       = 8,
        n_samples = 256,
        frames    = 180,
        scale     = 1.0,
        arm_r     = 0.012,
        bevel     = 0.018,
        clr_arm   = (0.1, 0.55, 1.0, 1.0),
        clr_trace = (1.0, 0.35, 0.05, 1.0),
        clr_orig  = (0.05, 0.8, 0.3, 1.0),
    )
"""

import cmath, math
import bpy, bmesh, mathutils


def _emit(name, colour, strength=4.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    node = nt.nodes.new('ShaderNodeEmission')
    node.inputs['Color'].default_value    = colour
    node.inputs['Strength'].default_value = strength
    nt.links.new(node.outputs['Emission'], out.inputs['Surface'])
    return mat


def _eff_freq(k, N):
    return k if k <= N // 2 else k - N


def _arm_mesh(length, radius, name):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False,
                          segments=6, radius1=radius, radius2=radius,
                          depth=length)
    rot = mathutils.Matrix.Rotation(math.radians(-90), 4, 'Y')
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=rot.to_3x3())
    bmesh.ops.translate(bm, verts=bm.verts, vec=(length * 0.5, 0, 0))
    bm.to_mesh(me)
    bm.free()
    return me


def _link(ob):
    bpy.context.collection.objects.link(ob)
    return ob


def _linear_fcurves(ob):
    if not ob.animation_data or not ob.animation_data.action:
        return
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


def _dft_bins(samples):
    N = len(samples)
    bins = []
    for k in range(N):
        Z_k = sum(samples[n] * cmath.exp(-2j * math.pi * k * n / N)
                  for n in range(N)) / N
        bins.append((k, abs(Z_k), Z_k))
    return sorted(bins, key=lambda x: x[1], reverse=True)


def build_dft_chain(
    sampler,
    n_h=10,
    n_samples=256,
    frames=180,
    scale=1.0,
    arm_r=0.012,
    bevel=0.018,
    clr_arm=(0.1, 0.55, 1.0, 1.0),
    clr_trace=(1.0, 0.35, 0.05, 1.0),
    clr_orig=(0.05, 0.8, 0.3, 1.0),
):
    """Build N_H DFT epicycle arms, bake trace curve, and add original path.

    Returns (empties, tracer, trace_ob, orig_ob).
    """
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = frames
    scene.render.fps  = 30

    samples  = [sampler(n / n_samples) for n in range(n_samples)]
    all_bins = _dft_bins(samples)
    selected = all_bins[:n_h]

    mat_arm   = _emit("hf_epi_arm",   clr_arm,   5.0)
    mat_trace = _emit("hf_epi_trace", clr_trace, 6.0)
    mat_orig  = _emit("hf_epi_orig",  clr_orig,  3.5)

    empties  = []
    prev_amp = None

    for i, (k, amp, Z_k) in enumerate(selected):
        freq  = _eff_freq(k, n_samples)
        phase = cmath.phase(Z_k)
        wa    = amp * scale

        empty = bpy.data.objects.new(f"epi_{i:02d}_f{freq:+d}", None)
        empty.empty_display_type = 'PLAIN_AXES'
        empty.empty_display_size = 0.04
        _link(empty)

        if i == 0:
            empty.location = (Z_k.real * scale, Z_k.imag * scale, 0.0)
        else:
            empty.parent   = empties[i - 1]
            empty.location = (prev_amp, 0.0, 0.0)
            empty.matrix_parent_inverse = empties[i - 1].matrix_world.inverted()

        empty.rotation_mode    = 'XYZ'
        empty.rotation_euler[2] = phase
        empty.keyframe_insert('rotation_euler', index=2, frame=1)
        empty.rotation_euler[2] = phase + 2 * math.pi * freq
        empty.keyframe_insert('rotation_euler', index=2, frame=frames + 1)
        _linear_fcurves(empty)

        if wa > 0.002:
            me_arm = _arm_mesh(wa, arm_r, f"arm_{i:02d}")
            ob_arm = bpy.data.objects.new(f"arm_{i:02d}", me_arm)
            ob_arm.data.materials.append(mat_arm)
            ob_arm.parent = empty
            ob_arm.matrix_parent_inverse = empty.matrix_world.inverted()
            _link(ob_arm)

        prev_amp = wa
        empties.append(empty)

    tracer = bpy.data.objects.new("tracer", None)
    tracer.empty_display_type = 'SPHERE'
    tracer.empty_display_size = 0.05
    tracer.parent   = empties[-1]
    tracer.location = (prev_amp, 0.0, 0.0)
    tracer.matrix_parent_inverse = empties[-1].matrix_world.inverted()
    _link(tracer)

    depsgraph  = bpy.context.evaluated_depsgraph_get()
    trace_pts  = []
    for f in range(1, frames + 1):
        scene.frame_set(f)
        depsgraph.update()
        t_eval = tracer.evaluated_get(depsgraph)
        trace_pts.append(t_eval.matrix_world.translation.copy())

    cu = bpy.data.curves.new("hf_trace_cu", 'CURVE')
    cu.dimensions  = '3D'
    cu.bevel_depth = bevel
    spl = cu.splines.new('NURBS')
    spl.points.add(len(trace_pts) - 1)
    for i, pt in enumerate(trace_pts):
        spl.points[i].co = (*pt, 1.0)
    spl.use_cyclic_u = True
    trace_ob = bpy.data.objects.new("hf_trace_curve", cu)
    trace_ob.data.materials.append(mat_trace)
    _link(trace_ob)

    cu2 = bpy.data.curves.new("hf_orig_cu", 'CURVE')
    cu2.dimensions  = '3D'
    cu2.bevel_depth = bevel * 0.55
    spl2 = cu2.splines.new('NURBS')
    orig_pts = [sampler(n / n_samples) for n in range(n_samples + 1)]
    spl2.points.add(len(orig_pts) - 1)
    for i, z in enumerate(orig_pts):
        spl2.points[i].co = (z.real * scale, z.imag * scale, -0.06, 1.0)
    spl2.use_cyclic_u = True
    orig_ob = bpy.data.objects.new("hf_orig_curve", cu2)
    orig_ob.data.materials.append(mat_orig)
    _link(orig_ob)

    scene.frame_set(1)
    return (empties, tracer, trace_ob, orig_ob)
