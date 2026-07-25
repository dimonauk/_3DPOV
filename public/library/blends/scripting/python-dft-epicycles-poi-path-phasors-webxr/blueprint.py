"""
Holoflow Studio | DFT Epicycles — Poi Path Phasors | Blender 5.1
─────────────────────────────────────────────────────────────────
Decomposes a closed 2-D poi path into N_H rotating phasors (epicycles)
using the Discrete Fourier Transform, then animates each epicycle as a
rotating arm so the tip traces the reconstructed path.

THEORY
──────
Given N complex samples z[n] of a closed curve, the DFT yields:
    Z[k] = (1/N) Σ_{n=0}^{N-1}  z[n] · exp(−2πi·k·n/N)

Each bin Z[k] carries:
    amplitude  = |Z[k]|            ← arm length (circle radius)
    phase      = arg(Z[k])         ← initial rotation angle
    frequency  = k          (k ≤ N//2)
                 k − N      (k > N//2)   ← alias / negative frequency

Sorting bins by magnitude and keeping N_H of them reconstructs the curve
to within the alias error — the same principle used in Fourier-series
approximation of any periodic function.

Animation: keyframe rotation_z of each Empty pivot at frame 1 and FRAMES+1.
Over one period (FRAMES frames) the pivot rotates 2π·freq radians; LINEAR
FCurve interpolation gives exact constant-rate motion at every frame.

SOURCE PATH (poi petal antispin)
─────────────────────────────────
    z(t) = exp(2πit) + 0.5·exp(−4πit)

Harmonic 1 (CCW, r=1.0) + harmonic −2 (CW, r=0.5) produce a 3-petal
figure. The two non-zero harmonics let us verify that the DFT correctly
recovers exactly the input when N_H ≥ 2 above the highest frequency.

DEPENDENCIES
────────────
Pure stdlib: cmath, math, array — no numpy required.
bpy, bmesh, mathutils — Blender 5.1 built-ins.
"""

import cmath, math
import bpy, bmesh, mathutils

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
N_SAMPLES   = 256   # temporal samples of the source path (power of 2 preferred)
N_H         = 10    # epicycles to keep (top-N by DFT magnitude)
FRAMES      = 180   # animation length = one full period at 30 fps → 6 s
ARM_R       = 0.012 # radius of each arm cylinder
BEVEL_TRACE = 0.018 # bevel depth for the trace curve ribbon
BEVEL_ORIG  = 0.010 # bevel depth for the original-path reference curve
SCALE       = 1.0   # world-space multiplier (1 = metres)

def SOURCE_PATH(t: float) -> complex:
    """Poi petal: harmonic 1 (CCW, r=1) + harmonic −2 (CW, r=0.5)."""
    return cmath.exp(2j * math.pi * t) + 0.5 * cmath.exp(-4j * math.pi * t)

# Emission colours  (R, G, B, A)
CLR_ARM   = (0.10, 0.55, 1.00, 1.0)  # blue  — rotating arm cylinders
CLR_TRACE = (1.00, 0.35, 0.05, 1.0)  # orange — reconstructed path
CLR_ORIG  = (0.05, 0.80, 0.30, 1.0)  # green  — original path reference

# ─── HELPERS ─────────────────────────────────────────────────────────────────
def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                bpy.data.lights, bpy.data.cameras):
        for blk in list(col):
            col.remove(blk)

def emit_mat(name: str, colour: tuple, strength: float = 4.0):
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

def eff_freq(k: int, N: int) -> int:
    """Convert DFT bin index k to signed frequency in cycles per period."""
    return k if k <= N // 2 else k - N

def arm_mesh(length: float, radius: float, name: str) -> bpy.types.Mesh:
    """Hexagonal prism from local origin (0,0,0) to (length,0,0)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    # create_cone generates along Z, centred at origin
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False,
                          segments=6, radius1=radius, radius2=radius,
                          depth=length)
    # Rotate −90° around Y: Z+ → X+
    rot = mathutils.Matrix.Rotation(math.radians(-90), 4, 'Y')
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=rot.to_3x3())
    # Shift so the arm runs 0 → length instead of −length/2 → +length/2
    bmesh.ops.translate(bm, verts=bm.verts, vec=(length * 0.5, 0, 0))
    bm.to_mesh(me)
    bm.free()
    return me

def link(ob):
    bpy.context.collection.objects.link(ob)
    return ob

def set_linear_fcurves(ob):
    """Force all FCurves on an object to LINEAR interpolation."""
    if not ob.animation_data or not ob.animation_data.action:
        return
    for fc in ob.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

# ─── DFT (selective bins — O(N·N_H) instead of O(N²)) ───────────────────────
def compute_dft_bins(samples: list) -> list:
    """Return all N DFT bins, sorted by magnitude descending."""
    N = len(samples)
    bins = []
    for k in range(N):
        Z_k = sum(samples[n] * cmath.exp(-2j * math.pi * k * n / N)
                  for n in range(N)) / N
        bins.append((k, abs(Z_k), Z_k))
    # Sort by magnitude descending; DC (k=0) stays in; it anchors the chain
    return sorted(bins, key=lambda x: x[1], reverse=True)

# ─── MAIN BUILD ──────────────────────────────────────────────────────────────
def build():
    purge()
    scene            = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = FRAMES
    scene.render.fps  = 30

    samples = [SOURCE_PATH(n / N_SAMPLES) for n in range(N_SAMPLES)]

    all_bins = compute_dft_bins(samples)
    selected = all_bins[:N_H]  # top N_H bins by magnitude

    print("DFT bins selected (freq, amplitude):")
    for k, amp, Z_k in selected:
        freq = eff_freq(k, N_SAMPLES)
        print(f"  k={k:4d}  freq={freq:+4d}  |Z|={amp:.6f}  φ={math.degrees(cmath.phase(Z_k)):+.1f}°")

    mat_arm   = emit_mat("hf_epi_arm",   CLR_ARM,   strength=5.0)
    mat_trace = emit_mat("hf_epi_trace", CLR_TRACE, strength=6.0)
    mat_orig  = emit_mat("hf_epi_orig",  CLR_ORIG,  strength=3.5)

    empties = []
    prev_amp = None

    for i, (k, amp, Z_k) in enumerate(selected):
        freq  = eff_freq(k, N_SAMPLES)
        phase = cmath.phase(Z_k)  # arg(Z_k) ∈ [−π, π]
        world_amp = amp * SCALE

        # Empty: the rotation pivot for this epicycle
        empty = bpy.data.objects.new(f"epi_{i:02d}_f{freq:+d}", None)
        empty.empty_display_type = 'PLAIN_AXES'
        empty.empty_display_size = 0.04
        link(empty)

        if i == 0:
            # First (largest) epicycle — place at the path's centroid.
            # For our poi petal path the centroid is 0; Z[0] ≈ 0.
            # The Empty sits at (Z_k.real, Z_k.imag, 0) in world space.
            empty.location = (Z_k.real * SCALE, Z_k.imag * SCALE, 0.0)
        else:
            # Child of previous pivot; offset along parent's local X by
            # the previous arm's length — that places this pivot at the
            # previous arm's tip.
            empty.parent = empties[i - 1]
            empty.location = (prev_amp, 0.0, 0.0)
            empty.matrix_parent_inverse = empties[i - 1].matrix_world.inverted()

        # Keyframe: one full rotation (2π · freq) over FRAMES frames.
        # Negative freq → CW rotation (rotation decreases). Linear FCurve
        # ensures constant angular velocity matching the DFT's sinusoidal rate.
        empty.rotation_mode = 'XYZ'
        empty.rotation_euler[2] = phase
        empty.keyframe_insert('rotation_euler', index=2, frame=1)
        empty.rotation_euler[2] = phase + 2 * math.pi * freq
        empty.keyframe_insert('rotation_euler', index=2, frame=FRAMES + 1)
        set_linear_fcurves(empty)

        # Arm mesh: runs from pivot (0,0,0) to arm tip (world_amp, 0, 0)
        if world_amp > 0.002:
            me_arm = arm_mesh(world_amp, ARM_R, f"arm_{i:02d}")
            ob_arm = bpy.data.objects.new(f"arm_{i:02d}", me_arm)
            ob_arm.data.materials.append(mat_arm)
            ob_arm.parent = empty
            ob_arm.matrix_parent_inverse = empty.matrix_world.inverted()
            link(ob_arm)

        prev_amp = world_amp
        empties.append(empty)

    # ── Tracer at tip of final arm ────────────────────────────────────────
    tracer = bpy.data.objects.new("tracer", None)
    tracer.empty_display_type = 'SPHERE'
    tracer.empty_display_size = 0.05
    tracer.parent = empties[-1]
    tracer.location = (prev_amp, 0.0, 0.0)
    tracer.matrix_parent_inverse = empties[-1].matrix_world.inverted()
    link(tracer)

    # ── Bake tracer world positions → trace curve ─────────────────────────
    # Evaluate the dependency graph at each frame; store the tracer's
    # world-space translation. Using evaluated_get() avoids re-running
    # unrelated modifiers on every frame.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    trace_pts = []
    for f in range(1, FRAMES + 1):
        scene.frame_set(f)
        depsgraph.update()
        t_eval = tracer.evaluated_get(depsgraph)
        trace_pts.append(t_eval.matrix_world.translation.copy())

    cu_trace = bpy.data.curves.new("hf_trace_cu", 'CURVE')
    cu_trace.dimensions  = '3D'
    cu_trace.bevel_depth = BEVEL_TRACE
    spl = cu_trace.splines.new('NURBS')
    spl.points.add(len(trace_pts) - 1)
    for i, pt in enumerate(trace_pts):
        spl.points[i].co = (*pt, 1.0)
    spl.use_cyclic_u = True
    ob_trace = bpy.data.objects.new("hf_trace_curve", cu_trace)
    ob_trace.data.materials.append(mat_trace)
    link(ob_trace)

    # ── Original path reference curve ──────────────────────────────────────
    cu_orig = bpy.data.curves.new("hf_orig_cu", 'CURVE')
    cu_orig.dimensions  = '3D'
    cu_orig.bevel_depth = BEVEL_ORIG
    spl2 = cu_orig.splines.new('NURBS')
    orig_pts = [SOURCE_PATH(n / N_SAMPLES) for n in range(N_SAMPLES + 1)]
    spl2.points.add(len(orig_pts) - 1)
    for i, z in enumerate(orig_pts):
        spl2.points[i].co = (z.real * SCALE, z.imag * SCALE, -0.06, 1.0)
    spl2.use_cyclic_u = True
    ob_orig = bpy.data.objects.new("hf_orig_curve", cu_orig)
    ob_orig.data.materials.append(mat_orig)
    link(ob_orig)

    # ── Camera & world ────────────────────────────────────────────────────
    bpy.ops.object.camera_add(
        location=(0, -6.5, 4.5),
        rotation=(math.radians(52), 0, 0),
    )
    scene.camera = bpy.context.object
    scene.world = bpy.data.worlds.new("hf_world")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value    = (0.01, 0.01, 0.03, 1.0)
    bg.inputs['Strength'].default_value = 0.3

    scene.frame_set(1)
    print(f"\nScene ready — {N_H} epicycles, {FRAMES} frames. Press Space to play.")

build()
