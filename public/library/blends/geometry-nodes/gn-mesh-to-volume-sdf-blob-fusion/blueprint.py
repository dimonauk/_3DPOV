"""
GN Mesh to Volume → Volume to Mesh: Organic SDF Blob Fusion
============================================================
Blender 5.1 — Geometry Nodes, bpy direct data API, headless-safe.

TECHNIQUE: Scatter UV sphere instances over an icosphere emitter,
realise all instances into a single unified mesh, voxelise to a
signed-distance-field (SDF) OpenVDB grid via Mesh to Volume, then
extract a new mesh via Volume to Mesh at a positive THRESHOLD value.
When neighbouring spheres are within 2×THRESHOLD of each other the
marching-cubes isosurface naturally bridges them — a smooth blob
fusion with no metaball stiffness tuning and no Boolean modifier.
"""

import bpy
import math
import pathlib

# ── output paths ──────────────────────────────────────────────────────────────
GLB_OUT = pathlib.Path("//blob_fusion.glb")

# ── scene parameters (edit these first) ───────────────────────────────────────
EMITTER_SUBDIVISIONS = 2      # icosphere subdivisions (emitter surface)
POINT_COUNT          = 28     # scattered sphere instances
SEED                 = 13     # random seed for point distribution
SPHERE_RADIUS        = 0.32   # radius of each UV sphere instance (m)
VOXEL_SIZE           = 0.035  # world-space VDB voxel dimension (m)
EXTERIOR_BAND        = 0.18   # SDF outward thickness  — must be >= THRESHOLD
INTERIOR_BAND        = 0.18   # SDF inward thickness   — fill thin cavities
THRESHOLD            = 0.09   # marching-cubes isosurface level (m)
ADAPTIVITY           = 0.0    # 0 = dense uniform tris, 1 = simplified
BLOB_COLOUR          = (0.15, 0.75, 0.65, 1.0)  # organic teal


def purge_scene():
    """Remove all objects and orphaned data from a fresh startup file."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for block in (bpy.data.meshes, bpy.data.materials,
                  bpy.data.node_groups, bpy.data.objects):
        for item in list(block):
            block.remove(item, do_unlink=True)


def make_material():
    """Organic translucent teal blob — Principled BSDF v2 with SSS."""
    mat = bpy.data.materials.new("BlobFusion_Mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value = BLOB_COLOUR
    # SSS gives the organic wax/soap appearance — radius controls scatter depth
    bsdf.inputs["Subsurface Weight"].default_value = 0.35
    bsdf.inputs["Subsurface Radius"].default_value = (0.2, 0.4, 0.35)
    bsdf.inputs["Roughness"].default_value = 0.25
    bsdf.inputs["Specular IOR Level"].default_value = 0.6

    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def build_gn_tree():
    """
    Construct the Geometry Nodes tree via the bpy node API.

    Node chain:
      GroupInput → IcoSphere (emitter) → DistributePointsOnFaces
                → UVSphere (instance) → InstanceOnPoints
                → RealizeInstances → MeshToVolume → VolumeToMesh
                → SetShadeSmooth → SetMaterial → GroupOutput
    """
    tree = bpy.data.node_groups.new("BlobFusion", "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    # Group I/O sockets (NodeTreeInterface API, Blender 4.2+)
    iface = tree.interface
    iface.new_socket("Point Count",    in_out="INPUT",  socket_type="NodeSocketInt")
    iface.new_socket("Seed",           in_out="INPUT",  socket_type="NodeSocketInt")
    iface.new_socket("Sphere Radius",  in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Voxel Size",     in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Threshold",      in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Adaptivity",     in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Geometry",       in_out="OUTPUT", socket_type="NodeSocketGeometry")

    gi = nodes.new("NodeGroupInput");   gi.location = (-900, 0)
    go = nodes.new("NodeGroupOutput");  go.location = (700, 0)

    # Emitter: icosphere for distributing points on its surface
    n_ico = nodes.new("GeometryNodeMeshIcoSphere")
    n_ico.location = (-700, 150)
    n_ico.inputs["Radius"].default_value = 1.0
    n_ico.inputs["Subdivisions"].default_value = EMITTER_SUBDIVISIONS

    # Scatter points on the emitter surface
    n_dist = nodes.new("GeometryNodeDistributePointsOnFaces")
    n_dist.location = (-500, 150)
    # POISSON mode enforces minimum spacing — prevents sphere pile-ups
    n_dist.distribute_method = "POISSON"
    n_dist.inputs["Distance Min"].default_value = SPHERE_RADIUS * 1.6
    n_dist.inputs["Density Max"].default_value = 4.0

    links.new(n_ico.outputs["Mesh"],       n_dist.inputs["Mesh"])
    links.new(gi.outputs["Point Count"],   n_dist.inputs["Density Max"])
    links.new(gi.outputs["Seed"],          n_dist.inputs["Seed"])

    # Instance geometry: UV sphere placed at each scattered point
    n_sphere = nodes.new("GeometryNodeMeshUVSphere")
    n_sphere.location = (-500, -100)
    n_sphere.inputs["Segments"].default_value = 16
    n_sphere.inputs["Rings"].default_value = 12

    # Scale the sphere by the group-input Sphere Radius
    n_scale = nodes.new("GeometryNodeScaleElements")
    n_scale.location = (-300, -100)
    # ScaleElements doesn't exist for this purpose — use Transform Geometry instead
    # Actually we scale via InstanceOnPoints Scale socket

    n_iop = nodes.new("GeometryNodeInstanceOnPoints")
    n_iop.location = (-250, 100)
    links.new(n_dist.outputs["Points"],    n_iop.inputs["Points"])
    links.new(n_sphere.outputs["Mesh"],    n_iop.inputs["Instance"])
    # Scale each sphere instance to SPHERE_RADIUS (default unit sphere has radius 1)
    links.new(gi.outputs["Sphere Radius"], n_iop.inputs["Scale"])

    # Realize: convert all instances to a single unified mesh geometry.
    # WHY: Mesh to Volume requires real geometry, not instances — it reads
    # actual triangle positions from the mesh datablock. Realized instances
    # produce one combined mesh; the SDF voxeliser sees all spheres at once.
    n_real = nodes.new("GeometryNodeRealizeInstances")
    n_real.location = (-50, 100)
    links.new(n_iop.outputs["Instances"], n_real.inputs["Geometry"])

    # Mesh to Volume: voxelise the combined mesh into an SDF OpenVDB grid.
    # The volume stores signed distance values: 0 = surface, <0 = inside.
    # EXTERIOR_BAND and INTERIOR_BAND must exceed THRESHOLD or the isosurface
    # will clip at the band boundary rather than the smooth mesh zero-crossing.
    n_m2v = nodes.new("GeometryNodeMeshToVolume")
    n_m2v.location = (150, 100)
    n_m2v.inputs["Density"].default_value = 1.0
    n_m2v.inputs["Interior Band Width"].default_value = INTERIOR_BAND
    n_m2v.inputs["Exterior Band Width"].default_value = EXTERIOR_BAND
    links.new(n_real.outputs["Geometry"],  n_m2v.inputs["Mesh"])
    links.new(gi.outputs["Voxel Size"],    n_m2v.inputs["Voxel Size"])

    # Volume to Mesh: marching cubes extraction at the chosen isosurface level.
    # THRESHOLD > 0 inflates the surface outward by that distance (metres).
    # When two spheres are 2×THRESHOLD apart their inflated surfaces touch,
    # producing a smooth bridge — the blob fusion effect.
    n_v2m = nodes.new("GeometryNodeVolumeToMesh")
    n_v2m.location = (350, 100)
    n_v2m.inputs["Adaptivity"].default_value = ADAPTIVITY
    links.new(n_m2v.outputs["Volume"],    n_v2m.inputs["Volume"])
    links.new(gi.outputs["Voxel Size"],   n_v2m.inputs["Voxel Size"])
    links.new(gi.outputs["Threshold"],    n_v2m.inputs["Threshold"])

    # Shade smooth: VolumeToMesh produces per-vertex normals; marking shade
    # smooth instructs EEVEE/Cycles to interpolate them — hides voxel facets.
    n_sss = nodes.new("GeometryNodeSetShadeSmooth")
    n_sss.location = (530, 100)
    n_sss.inputs["Shade Smooth"].default_value = True
    links.new(n_v2m.outputs["Mesh"], n_sss.inputs["Geometry"])

    # Set material
    n_mat = nodes.new("GeometryNodeSetMaterial")
    n_mat.location = (680, 100)
    links.new(n_sss.outputs["Geometry"], n_mat.inputs["Geometry"])

    links.new(n_mat.outputs["Geometry"], go.inputs["Geometry"])
    return tree, n_mat


def set_group_defaults(obj, mat):
    """Write sensible default values to the GN modifier's exposed inputs."""
    mod = obj.modifiers["BlobFusion"]
    mod["Socket_0"] = POINT_COUNT    # Point Count
    mod["Socket_1"] = SEED           # Seed
    mod["Socket_2"] = SPHERE_RADIUS  # Sphere Radius
    mod["Socket_3"] = VOXEL_SIZE     # Voxel Size
    mod["Socket_4"] = THRESHOLD      # Threshold
    mod["Socket_5"] = ADAPTIVITY     # Adaptivity
    # Assign material to the Set Material node input
    for node in obj.modifiers["BlobFusion"].node_group.nodes:
        if node.type == "SET_MATERIAL":
            node.inputs["Material"].default_value = mat


def main():
    purge_scene()

    # Material
    mat = make_material()

    # Build GN tree
    tree, n_mat = build_gn_tree()
    n_mat.inputs["Material"].default_value = mat

    # Carrier object — bare Empty mesh; all geometry comes from the GN modifier
    bpy.ops.mesh.primitive_plane_add(size=0.001, location=(0, 0, 0))
    carrier = bpy.context.active_object
    carrier.name = "blob_fusion"

    mod = carrier.modifiers.new("BlobFusion", "NODES")
    mod.node_group = tree

    # Set modifier socket defaults
    for sock in tree.interface.items_tree:
        if sock.name == "Point Count":
            sock.default_value = POINT_COUNT
        elif sock.name == "Seed":
            sock.default_value = SEED
        elif sock.name == "Sphere Radius":
            sock.default_value = SPHERE_RADIUS
        elif sock.name == "Voxel Size":
            sock.default_value = VOXEL_SIZE
        elif sock.name == "Threshold":
            sock.default_value = THRESHOLD
        elif sock.name == "Adaptivity":
            sock.default_value = ADAPTIVITY

    # Camera: framing a ~2m blob
    bpy.ops.object.camera_add(location=(0, -5.5, 2.0))
    cam = bpy.context.active_object
    cam.data.lens = 50
    bpy.context.scene.camera = cam

    import mathutils
    cam.rotation_euler = mathutils.Euler((math.radians(72), 0, 0), "XYZ")

    # Lighting: Sun + fill
    bpy.ops.object.light_add(type="SUN", location=(4, -3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.data.angle = math.radians(5)

    bpy.ops.object.light_add(type="AREA", location=(-3, 3, 2))
    fill = bpy.context.active_object
    fill.data.energy = 200
    fill.data.size = 3.0

    # Render settings
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = str(OUTPUT_DIR / "blob_fusion_0001.png")
    scene.eevee.use_shadows = True

    # Save .blend
    bpy.ops.wm.save_as_mainfile(filepath="//blob_fusion.blend")

    # GLB export — export_apply=True evaluates the GN modifier
    bpy.ops.object.select_all(action="DESELECT")
    carrier.select_set(True)
    bpy.context.view_layer.objects.active = carrier
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials="EXPORT",
    )
    print(f"[BlobFusion] GLB written → {GLB_OUT}")


if __name__ == "__main__":
    main()
