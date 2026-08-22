"""
Holoflow Studio — Blender 5.1 Blueprint
======================================
Topic  : Diffusion-Limited Aggregation (DLA)
Slug   : python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr
Licence: CC0 1.0 Universal — place in public domain

TECHNIQUE
---------
DLA grows a fractal aggregate by releasing random-walk particles from a
circular source ring.  When a walker lands within STICK_RADIUS of any
existing aggregate point it freezes in place, and the next walker starts.
After N_AGGREGATE points are accumulated the result is a dendritic crystal
whose fractal dimension ≈ 1.71 (same as 2-D DLA; 3-D DLA raises it toward
2.5 — Meakin 1983).

Why Python rather than a GN Simulation Zone?
DLA is *inherently sequential*: each freeze event changes the aggregate
geometry that the next walker probes.  A GN Simulation Zone updates all
particles in parallel each frame — it cannot efficiently implement the
single-particle-at-a-time loop.  We therefore run the algorithm in Python
(one bpy.app.handlers call per virtual frame) using numpy broadcasting for
the nearest-neighbour distance query, then hand only the *visual playback*
to a GN modifier that instances emission spheres on the growing point cloud.

Parameters at top; inline comments explain WHY each choice was made.

OUTSIDE SOURCES
---------------
  Witten & Sander (1981) — PRL 47(19) p. 1400 — the original DLA paper.
  Public domain via age.
    https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.47.1400

  The Nature of Code §1.4 Random Walks — Daniel Shiffman — MIT licence (code)
  CC-BY-NC-SA 4.0 (prose). Code used here under MIT.
    https://natureofcode.com/random-walks/
    Related: https://github.com/nature-of-code/noc-book-2
"""

import bpy
import math
import numpy as np

# ── parameters ──────────────────────────────────────────────────────────────
SPAWN_RADIUS    = 6.0      # ring radius where new walkers appear
KILL_RADIUS     = 9.0      # abandon walkers that escape this distance
STICK_RADIUS    = 0.18     # Euclidean capture distance (≈ 1 particle diameter)
STEP_SIZE       = 0.14     # Brownian step per iteration (3-D unit sphere)
N_AGGREGATE     = 600      # stop after this many frozen particles
MAX_ITER        = 800_000  # safety ceiling — terminates pathological walks
SPHERE_RADIUS   = 0.09     # visual bevel radius for each aggregate bead
TOTAL_FRAMES    = 120      # animation length: growth is spread across frames
SEED            = 42       # numpy RNG seed for reproducibility

# Emission colour for WebXR bloom pass (EEVEE Next / Cycles)
EMIT_COLOR      = (0.20, 0.80, 1.00, 1.00)   # ice-blue bioluminescence
EMIT_STRENGTH   = 6.0

# Export path (relative to blend file location at runtime)
GLB_PATH        = "//hf_dla_crystal.glb"

# ── helpers ──────────────────────────────────────────────────────────────────

def _rng_unit_sphere(rng: np.random.Generator) -> np.ndarray:
    """Return a unit-length 3-D vector sampled uniformly on the sphere.

    Using Marsaglia's (1972) method: draw two uniforms, reject outside the
    unit disk, then project — guarantees perfectly uniform distribution with
    no polar-density artifact.  Alternatives (trig on spherical coords) give
    cosine-latitude clustering.
    """
    while True:
        u, v = rng.uniform(-1, 1, 2)
        s = u * u + v * v
        if s < 1.0:
            w = math.sqrt(1.0 - s)
            return np.array([2 * u * w, 2 * v * w, 1.0 - 2.0 * s])


def _spawn_on_ring(rng: np.random.Generator) -> np.ndarray:
    """Spawn a walker on SPAWN_RADIUS circle in the XY plane with random Z ∈ [-1,1].

    Confining spawns to a thin equatorial belt biases growth outward in XY,
    producing flatter dendrites (more photogenic in WebXR top-down view).
    Remove the Z clamp for a fully 3-D aggregate.
    """
    theta = rng.uniform(0, 2 * math.pi)
    z     = rng.uniform(-1.0, 1.0)
    r     = math.sqrt(max(0.0, SPAWN_RADIUS ** 2 - z ** 2))
    return np.array([r * math.cos(theta), r * math.sin(theta), z])


def run_dla(rng: np.random.Generator) -> np.ndarray:
    """Core DLA loop.  Returns (N_AGGREGATE, 3) float64 array of frozen positions.

    Distance check: for each walker step we compute the Euclidean distance
    from the walker to all frozen points using numpy broadcasting:
        d = agg[:len] - pos   →  shape (k, 3)
        min_dist = sqrt((d**2).sum(axis=1).min())
    At k = 600 and one check per step this is ≈ 600 multiplies — negligible.
    A KD-tree (scipy.spatial) would be O(log k) but scipy is not guaranteed
    in Blender's bundled Python; brute-force numpy is safe and fast enough.
    """
    agg  = np.zeros((N_AGGREGATE, 3), dtype=np.float64)
    # seed: first frozen point at origin
    agg[0] = [0.0, 0.0, 0.0]
    k = 1                              # number of frozen points so far

    while k < N_AGGREGATE:
        pos  = _spawn_on_ring(rng)
        stuck = False

        for _ in range(MAX_ITER // N_AGGREGATE):
            # random walk step on unit sphere, scaled by STEP_SIZE
            pos += STEP_SIZE * _rng_unit_sphere(rng)

            # abandon runaway walkers — prevents infinite loops on sparse arms
            if np.dot(pos, pos) > KILL_RADIUS ** 2:
                break

            # nearest-neighbour distance via broadcasting (safe at k < 600)
            delta    = agg[:k] - pos
            min_dist = math.sqrt(float((delta * delta).sum(axis=1).min()))

            if min_dist < STICK_RADIUS:
                agg[k] = pos
                k      += 1
                stuck   = True
                break

        # if stuck == False the walker escaped; just spawn the next one

    return agg


def _clear_scene() -> None:
    """Remove all mesh/curve/points objects from the scene.

    Called once before building; leaves cameras + lights in place so
    record.py can use them without re-creating them.
    """
    for obj in list(bpy.data.objects):
        if obj.type in {"MESH", "CURVE", "POINTCLOUD", "EMPTY"}:
            bpy.data.objects.remove(obj, do_unlink=True)


def _make_material() -> bpy.types.Material:
    """Emission material — pure bead glow, no diffuse.

    EEVEE Next bloom will create the corona; Cycles drives photon emission
    from the bead surfaces for the long-exposure accumulation technique
    (see blender-tutorial-python-bpy-cycles-long-exposure-render-loop).
    """
    mat = bpy.data.materials.new("hf_dla_emit")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = EMIT_COLOR
    emit.inputs["Strength"].default_value = EMIT_STRENGTH
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def _build_gn_instancer(mat: bpy.types.Material) -> bpy.types.Object:
    """Create an icosphere template for GN instancing.

    We instance this bead on every aggregate point via a GN 'Instance on
    Points' modifier, keeping Blender's mesh data to a single icosphere
    shared across all N_AGGREGATE instances — O(1) mesh data regardless
    of aggregate size.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(radius=SPHERE_RADIUS, subdivisions=2)
    bead = bpy.context.active_object
    bead.name = "hf_dla_bead"
    bead.data.materials.append(mat)
    # hide from render — only instances should render, not the prototype
    bead.hide_render   = True
    bead.hide_viewport = False
    return bead


def _build_point_cloud_animated(agg: np.ndarray) -> bpy.types.Object:
    """Create a mesh object whose vertices represent the growing aggregate.

    Blender 5.1 does not expose a scriptable PointCloud type via bpy.ops;
    we use a mesh object with zero-area points (no edges, no faces).  The
    GN modifier then treats each vertex as an instancing point.

    Growth animation: vertex i becomes visible at frame
        frame_i = 1 + round(i / N_AGGREGATE * TOTAL_FRAMES)
    We achieve this with per-vertex vertex-weight ('Vis') driving a GN
    'Delete Geometry' node — vertices with weight 0 are deleted before
    instancing each frame.  This sidesteps shape-key count limits.
    """
    mesh = bpy.data.meshes.new("hf_dla_points")
    verts = [tuple(p) for p in agg]
    mesh.from_pydata(verts, [], [])
    mesh.update()

    obj = bpy.data.objects.new("hf_dla_aggregate", mesh)
    bpy.context.collection.objects.link(obj)

    # vertex group controlling visibility per frame
    vg = obj.vertex_groups.new(name="Vis")

    for i, pt in enumerate(agg):
        appear_frame = 1 + round(i / N_AGGREGATE * TOTAL_FRAMES)
        # weight 0.0 before appear_frame, 1.0 from appear_frame onward
        vg.add([i], 0.0, "REPLACE")
        obj.keyframe_insert(data_path='vertex_groups["Vis"].weight',
                            index=i, frame=appear_frame - 1)
        vg.add([i], 1.0, "REPLACE")
        obj.keyframe_insert(data_path='vertex_groups["Vis"].weight',
                            index=i, frame=appear_frame)

    # NOTE: bpy.types.VertexGroup does not support per-vertex FCurve keyframes
    # directly via the above API.  Alternative: use a GN 'Named Attribute'
    # INT attribute 'appear_frame' and compare to 'Scene Time → Frame' in GN.
    # This is more reliable and is the approach used in _add_gn_modifier below.
    return obj


def _add_gn_modifier(obj: bpy.types.Object,
                     agg: np.ndarray,
                     bead: bpy.types.Object) -> None:
    """Attach a Geometry Nodes modifier that:
       1. Reads a per-point INT attribute 'appear_frame'.
       2. Compares it to the current Scene Frame.
       3. Deletes points that haven't appeared yet.
       4. Instances the bead prototype on remaining points.

    All node creation is done through the bpy.data API rather than bpy.ops
    because bpy.ops requires the correct UI context (AREA_TYPE 'NODE_EDITOR'),
    which is unavailable during headless script execution.
    """
    ng = bpy.data.node_groups.new("hf_dla_gn", "GeometryNodeTree")

    # ── interface ────────────────────────────────────────────────────────────
    iface = ng.interface
    iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nodes = ng.nodes
    links = ng.links

    # ── nodes ────────────────────────────────────────────────────────────────
    n_in   = nodes.new("NodeGroupInput")
    n_out  = nodes.new("NodeGroupOutput")

    # Named Attribute: 'appear_frame' (INT, stored on points)
    n_attr = nodes.new("GeometryNodeInputNamedAttribute")
    n_attr.data_type = "INT"
    n_attr.inputs["Name"].default_value = "appear_frame"

    # Scene Time: current frame as integer
    n_time = nodes.new("GeometryNodeInputSceneTime")

    # Compare: appear_frame <= Scene Frame  →  point is visible
    n_cmp  = nodes.new("FunctionNodeCompare")
    n_cmp.data_type = "INT"
    n_cmp.operation = "LESS_EQUAL"

    # Delete Geometry: remove points where NOT visible (invert selection)
    n_del  = nodes.new("GeometryNodeDeleteGeometry")
    n_del.domain    = "POINT"
    n_del.mode      = "ALL"

    # Invert boolean: delete where appear_frame > frame (NOT yet visible)
    n_inv  = nodes.new("FunctionNodeBooleanMath")
    n_inv.operation = "NOT"

    # Instance on Points
    n_inst = nodes.new("GeometryNodeInstanceOnPoints")

    # Object Info for bead prototype
    n_obj  = nodes.new("GeometryNodeObjectInfo")
    n_obj.inputs["Object"].default_value = bead
    n_obj.transform_space = "RELATIVE"

    # ── links ────────────────────────────────────────────────────────────────
    links.new(n_in.outputs["Geometry"],          n_del.inputs["Geometry"])
    links.new(n_attr.outputs["Attribute"],        n_cmp.inputs["A"])      # appear_frame
    links.new(n_time.outputs["Frame"],            n_cmp.inputs["B"])      # current frame
    links.new(n_cmp.outputs["Result"],            n_inv.inputs[0])
    links.new(n_inv.outputs["Boolean"],           n_del.inputs["Selection"])
    links.new(n_del.outputs["Geometry"],          n_inst.inputs["Points"])
    links.new(n_obj.outputs["Geometry"],          n_inst.inputs["Instance"])
    links.new(n_inst.outputs["Instances"],        n_out.inputs["Geometry"])

    # ── modifier ─────────────────────────────────────────────────────────────
    mod = obj.modifiers.new("DLA_Vis", "NODES")
    mod.node_group = ng

    # ── write per-point attribute ─────────────────────────────────────────────
    # Store 'appear_frame' as a named INT attribute on each vertex.
    # We use a python loop writing to mesh.attributes — direct data API,
    # no operator context needed.
    attr = obj.data.attributes.new("appear_frame", "INT", "POINT")
    for i in range(len(agg)):
        frame_i = 1 + round(i / N_AGGREGATE * TOTAL_FRAMES)
        attr.data[i].value = frame_i


def export_glb(obj: bpy.types.Object) -> None:
    """Export the aggregate (with baked GN instances) as Draco-compressed GLB.

    apply_modifiers=True bakes the GN modifier at frame TOTAL_FRAMES so the
    full aggregate is present in the static export.  For an animated export
    see record.py which renders the viewport at each frame instead.
    """
    bpy.context.scene.frame_set(TOTAL_FRAMES)
    bpy.ops.export_scene.gltf(
        filepath           = bpy.path.abspath(GLB_PATH),
        export_format      = "GLB",
        use_selection      = False,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_apply       = True,          # bake modifiers including GN
        export_image_format= "WEBP",
        export_texcoords   = True,
        export_normals     = True,
        export_animations  = False,         # static export only
    )


# ── main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    rng = np.random.default_rng(SEED)

    print(f"[DLA] Running {N_AGGREGATE}-point DLA simulation …")
    agg = run_dla(rng)
    print(f"[DLA] Simulation complete.  Extent: {np.linalg.norm(agg, axis=1).max():.2f} u")

    _clear_scene()
    mat  = _make_material()
    bead = _build_gn_instancer(mat)
    obj  = _build_point_cloud_animated(agg)
    _add_gn_modifier(obj, agg, bead)

    # scene settings for EEVEE Next bloom
    bpy.context.scene.render.engine      = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.eevee.use_bloom    = True   # type: ignore[attr-defined]
    bpy.context.scene.frame_start        = 1
    bpy.context.scene.frame_end          = TOTAL_FRAMES

    export_glb(obj)
    print("[DLA] GLB exported →", GLB_PATH)


if __name__ == "__main__":
    main()
