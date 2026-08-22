"""
GN Volume to Mesh — Marching-Cubes Blob Reconstruction
=======================================================
Blender 5.1 | Holoflow Studio | CC0

Volume to Mesh runs Marching Cubes on a fog volume's scalar density field.
The voxel grid stores a density value at each cell centre; the node traces the
iso-surface where density equals the Threshold and produces a manifold triangle
mesh. The result is structurally identical to a metaball implicit surface but
lives entirely inside the GN stack — meaning downstream nodes (Set Material,
Merge by Distance, Subdivide) can operate on it non-destructively.

WHY Points to Volume radius controls blobby merging:
  Each input point places a Gaussian falloff density sphere of the specified
  Radius in the voxel grid. Points spaced closer than ~2×Radius overlap;
  their density values SUM at the overlap voxel. The iso-surface (Threshold)
  therefore bridges nearby points automatically — farther apart pairs stay
  disconnected, closer pairs merge into a single blob. Adjusting Threshold
  below 1.0 captures weaker overlaps (more connections); above 1.0 demands
  very dense stacking before bridging.

WHY Voxel Amount vs Voxel Size:
  Points to Volume and Volume to Mesh both offer two resolution modes.
  VOXEL_AMOUNT assigns N cells to the longest bounding-box axis and scales the
  other axes proportionally — resolution tracks object scale automatically.
  VOXEL_SIZE assigns a fixed world-space cell dimension regardless of scale.
  Use VOXEL_AMOUNT during authoring (predictable output at any scale); switch
  to VOXEL_SIZE for a WebXR export pass where you need a hard polygon cap
  (larger cell → fewer Marching Cubes triangles).

WHY Adaptivity on Volume to Mesh:
  Adaptivity (0–1) runs a post-extraction decimation pass on the Marching Cubes
  output. Flat surface regions merge into larger, fewer triangles. At 0 every
  voxel-face boundary has its own vertex (maximum fidelity). At 1 near-flat
  areas collapse to minimal triangles at the cost of softening fine ridges.
  For WebXR: 0.05–0.1 halves poly count vs 0 while preserving organic
  silhouette fidelity.

WHY this pipeline over Metaballs:
  Metaballs are evaluated by Blender's metaball system outside GN; their mesh
  cannot be piped into downstream GN nodes, cannot receive stored attributes,
  and cannot be triangulated or UV-unwrapped within the same modifier stack.
  The Points → Volume → Mesh pipeline gives full GN composability: scatter
  logic, reconstruction, material tagging, and GLB export all in one tree.
"""

import bpy
import math

# ── Constants ─────────────────────────────────────────────────────────────────
SPHERE_SUBDIVISIONS = 4     # UV sphere vertical segments → ~300 surface points
POINT_COUNT         = 280   # random scatter count on sphere surface
NOISE_SCALE         = 3.2   # noise frequency driving point displacement
NOISE_STRENGTH      = 0.35  # max world-unit displacement from sphere surface
POINT_RADIUS        = 0.42  # blob radius per point inside the SDF volume
VOXEL_AMOUNT        = 72    # voxel grid resolution on longest axis
ISO_THRESHOLD       = 0.45  # density iso-level; lower = more merged blobs
ADAPTIVITY          = 0.06  # post-Marching-Cubes decimation (0=full, 1=flat-collapse)


# ── 1. Scene reset ────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng, do_unlink=True)


# ── 2. Build Geometry Nodes tree ──────────────────────────────────────────────
def build_gn_tree() -> bpy.types.NodeTree:
    """
    Pipeline:
      GroupInput.Geometry [sphere]
        → DistributePointsOnFaces (random, COUNT=POINT_COUNT)
        → SetPosition (offset = Noise3D(position) × NOISE_STRENGTH, centred)
        → PointsToVolume (radius=POINT_RADIUS, voxel_amount=VOXEL_AMOUNT)
        → VolumeToMesh  (threshold=ISO_THRESHOLD, adaptivity=ADAPTIVITY)
        → SetShadeSmooth
        → GroupOutput.Geometry [reconstructed blob mesh]
    """
    nt = bpy.data.node_groups.new("BlobReconstruction", 'GeometryNodeTree')
    nt.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    nt.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    def N(bl_idname, x, y):
        nd = nt.nodes.new(bl_idname)
        nd.location = (x, y)
        return nd

    gin  = N('NodeGroupInput',                        -900,   0)
    gout = N('NodeGroupOutput',                        950,   0)

    # Scatter points on sphere surface
    dist = N('GeometryNodeDistributePointsOnFaces',   -650,   0)
    dist.distribute_method = 'RANDOM'
    dist.inputs['Count'].default_value = POINT_COUNT

    # Noise displacement: sample position on scattered points, then push outward
    ipos = N('GeometryNodeInputPosition',              -650, -220)
    ntex = N('ShaderNodeTexNoise',                     -430, -220)
    ntex.noise_dimensions     = '3D'
    ntex.inputs['Scale'].default_value     = NOISE_SCALE
    ntex.inputs['Detail'].default_value    = 6.0
    ntex.inputs['Roughness'].default_value = 0.55
    ntex.inputs['Distortion'].default_value = 0.15

    # Centre noise output (0–1) around zero (−0.5…+0.5)
    sub = N('ShaderNodeVectorMath',                    -200, -220)
    sub.operation = 'SUBTRACT'
    sub.inputs[1].default_value = (0.5, 0.5, 0.5)

    # Scale centred noise to NOISE_STRENGTH world-units
    scl = N('ShaderNodeVectorMath',                     40, -220)
    scl.operation = 'SCALE'
    scl.inputs['Scale'].default_value = NOISE_STRENGTH

    spos = N('GeometryNodeSetPosition',                -200,   0)

    # Points → Volume (fog/SDF voxel grid)
    ptv  = N('GeometryNodePointsToVolume',              200,   0)
    ptv.resolution_mode = 'VOXEL_AMOUNT'
    ptv.inputs['Radius'].default_value       = POINT_RADIUS
    ptv.inputs['Voxel Amount'].default_value = VOXEL_AMOUNT
    ptv.inputs['Density'].default_value      = 1.0

    # Volume → Mesh (Marching Cubes iso-surface extraction)
    vtm  = N('GeometryNodeVolumeToMesh',                500,   0)
    vtm.resolution_mode = 'VOXEL_AMOUNT'
    vtm.inputs['Threshold'].default_value    = ISO_THRESHOLD
    vtm.inputs['Adaptivity'].default_value   = ADAPTIVITY
    vtm.inputs['Voxel Amount'].default_value = VOXEL_AMOUNT

    # Smooth shade the reconstructed mesh
    sss  = N('GeometryNodeSetShadeSmooth',              730,   0)
    sss.inputs['Shade Smooth'].default_value = True

    L = nt.links.new
    # sphere → scatter
    L(gin.outputs['Geometry'],    dist.inputs['Mesh'])
    # scatter → displace with noise → volume
    L(dist.outputs['Points'],     spos.inputs['Geometry'])
    L(ipos.outputs['Position'],   ntex.inputs['Vector'])
    L(ntex.outputs['Color'],      sub.inputs[0])
    L(sub.outputs['Vector'],      scl.inputs[0])
    L(scl.outputs['Vector'],      spos.inputs['Offset'])
    L(spos.outputs['Geometry'],   ptv.inputs['Points'])
    # volume → mesh → smooth → output
    L(ptv.outputs['Volume'],      vtm.inputs['Volume'])
    L(vtm.outputs['Mesh'],        sss.inputs['Geometry'])
    L(sss.outputs['Geometry'],    gout.inputs['Geometry'])

    return nt


# ── 3. Organic blob material ──────────────────────────────────────────────────
def make_blob_material() -> bpy.types.Material:
    mat = bpy.data.materials.new("BlobOrganic")
    mat.use_nodes = True
    nd = mat.node_tree.nodes
    lk = mat.node_tree.links
    nd.clear()

    out   = nd.new('ShaderNodeOutputMaterial');  out.location   = (400, 0)
    mix   = nd.new('ShaderNodeMixShader');        mix.location   = (200, 0)
    diff  = nd.new('ShaderNodeBsdfDiffuse');      diff.location  = (0,  60)
    emis  = nd.new('ShaderNodeEmission');         emis.location  = (0, -80)
    lay   = nd.new('ShaderNodeLayerWeight');      lay.location   = (-200, -30)
    lay.inputs['Blend'].default_value = 0.35

    diff.inputs['Color'].default_value  = (0.12, 0.55, 0.82, 1.0)  # teal-cyan
    emis.inputs['Color'].default_value  = (0.06, 0.28, 0.42, 1.0)
    emis.inputs['Strength'].default_value = 0.3

    lk.new(lay.outputs['Facing'],  mix.inputs['Fac'])
    lk.new(diff.outputs['BSDF'],   mix.inputs[1])
    lk.new(emis.outputs['Emission'], mix.inputs[2])
    lk.new(mix.outputs['Shader'],  out.inputs['Surface'])
    return mat


# ── 4. Main assembly ──────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()
    scn = bpy.context.scene
    scn.frame_start = 1
    scn.frame_end   = 1
    scn.render.fps  = 24

    # Host sphere — faces are the source for DistributePointsOnFaces
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SPHERE_SUBDIVISIONS * 8,
        ring_count=SPHERE_SUBDIVISIONS * 4,
        radius=1.5,
        location=(0, 0, 0),
    )
    sphere = bpy.context.active_object
    sphere.name = "blob_source"

    # Geometry Nodes modifier
    nt  = build_gn_tree()
    mod = sphere.modifiers.new("GeometryNodes", 'NODES')
    mod.node_group = nt

    # Material
    mat = make_blob_material()
    sphere.data.materials.append(mat)

    # Camera
    bpy.ops.object.camera_add(location=(0, -5.5, 1.8))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(72), 0, 0)
    scn.camera = cam

    # World HDRI stub — use uniform grey for clean viewport preview
    scn.world = bpy.data.worlds.new("BlobWorld")
    scn.world.use_nodes = True
    bg_node = scn.world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs['Color'].default_value    = (0.04, 0.04, 0.06, 1.0)
        bg_node.inputs['Strength'].default_value = 1.0

    # Area light for soft volumetric look
    bpy.ops.object.light_add(type='AREA', location=(3, -3, 5))
    light = bpy.context.active_object
    light.data.energy = 120.0
    light.data.size   = 3.0

    print(
        f"[BlobReconstruction] sphere host created | "
        f"GN tree: dist({POINT_COUNT}pts) → noise({NOISE_STRENGTH}u) "
        f"→ ptv(r={POINT_RADIUS}, vox={VOXEL_AMOUNT}) "
        f"→ vtm(iso={ISO_THRESHOLD}, adapt={ADAPTIVITY})"
    )
    print("Run record.py next to render the viewport animation.")


main()
