# blends/geometry-nodes/gn-points-to-volume-organic-coral/blueprint.py
# Blender 5.1 | CC0
#
# GN Points to Volume + Volume to Mesh — Procedural Organic Coral Blob
#
# Points to Volume converts a point cloud into an OpenVDB density field by
# splatting a Gaussian kernel around every point. Volume to Mesh then runs
# marching cubes on that field at a chosen isosurface threshold. When the
# Gaussian radii of neighbouring point kernels overlap, their densities
# accumulate: the isosurface "fuses" adjacent blobs into organic branch-like
# protrusions — the same principle behind metaballs, but driven by a VDB
# pipeline that exports cleanly to GLB.
#
# Studio notes:
#   • The result carries NO UV coordinates — marching cubes generates
#     topologically arbitrary faces. Use world-space procedural shading or
#     bake before export.
#   • Adaptivity > 0 on Volume to Mesh simplifies the marching-cubes output
#     into the studio's characteristic faceted aesthetic.
#   • Volume is a separate geometry type: you cannot feed a Volume socket
#     into a mesh node (Extrude, Set Position, etc.). The pipeline is
#     strictly Mesh → Points → Volume → Mesh.
#
# Outside sources:
#   Blender Manual — Points to Volume Node
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/point/points_to_volume.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   Blender Manual — Volume to Mesh Node
#   https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/volume_to_mesh.html
#   Licence: CC-BY-SA 4.0, Blender Documentation Team
#
#   KhronosGroup/glTF-Blender-IO
#   https://github.com/KhronosGroup/glTF-Blender-IO
#   Licence: Apache-2.0, Khronos Group
#
#   AcademySoftwareFoundation/openvdb (the underlying VDB library)
#   https://github.com/AcademySoftwareFoundation/openvdb
#   Licence: Apache-2.0, Academy Software Foundation

import bpy
import math

# ── Parameters ──────────────────────────────────────────────────────────────
BLEND_NAME   = "organic_coral"
OBJ_NAME     = "coral_blob"
MAT_NAME     = "coral_mat"
GNM_NAME     = "OrganicCoral"

ICO_RADIUS       = 1.0   # icosphere radius (metres) — sets coral footprint
ICO_SUBDIVISIONS = 1     # subdivision 1 = 42 vertices — 42 Gaussian seeds
                         # at subdiv 0: 12 fat branches; at subdiv 2: 162 fine tips

VOXEL_SIZE   = 0.06   # metres per voxel — finer = smoother but slower
POINT_RADIUS = 0.32   # Gaussian kernel half-width per point (metres)
              # Rule: POINT_RADIUS >= VOXEL_SIZE * 3 to avoid jagged surfaces
              # At ICO_RADIUS=1.0, subdiv-1 vertex spacing ~0.6 m;
              # POINT_RADIUS=0.32 gives ~50% peak overlap between neighbours
              # → core fuses, tips protrude → coral/sponge silhouette

THRESHOLD    = 0.08   # isosurface density level; lower → fatter mesh
              # Overlap density at midpoint between two kernels:
              #   ρ = exp(-d²/(2r²)) + exp(-d²/(2r²))
              # At d=0.3, r=0.32: ρ ≈ 0.80 per kernel → 1.60 total
              # THRESHOLD=0.08 catches the whole fused region plus thin tips

ADAPTIVITY   = 0.45   # Volume to Mesh simplification (0=full, 1=maximal)
              # 0.45 → mid-poly faceted surface, ~1200 faces on default params

COOL_COLOUR  = (0.04, 0.55, 0.60, 1.0)   # teal  (recessed, shadowed areas)
WARM_COLOUR  = (0.95, 0.38, 0.28, 1.0)   # coral-pink (prominent tips)

OUT_BLEND = ("public/library/blends/geometry-nodes/"
             "gn-points-to-volume-organic-coral/organic_coral.blend")
OUT_GLB   = ("public/library/glbs/geometry-nodes/"
             "gn-points-to-volume-organic-coral/organic_coral.glb")


# ── Geometry Nodes tree ──────────────────────────────────────────────────────
def _build_gn_tree() -> bpy.types.GeometryNodeTree:
    ng    = bpy.data.node_groups.new(GNM_NAME, "GeometryNodeTree")
    nodes = ng.nodes
    links = ng.links

    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")

    # Exposed group sockets let record.py drive the animation
    s_thresh = ng.interface.new_socket("Threshold", in_out="INPUT",
                                       socket_type="NodeSocketFloat")
    s_thresh.default_value = THRESHOLD
    s_thresh.min_value     = 0.001
    s_thresh.max_value     = 2.0

    s_adapt = ng.interface.new_socket("Adaptivity", in_out="INPUT",
                                      socket_type="NodeSocketFloat")
    s_adapt.default_value = ADAPTIVITY
    s_adapt.min_value     = 0.0
    s_adapt.max_value     = 1.0

    n_in  = nodes.new("NodeGroupInput")
    n_out = nodes.new("NodeGroupOutput")

    # ── Seed geometry: IcoSphere built inside the GN tree ─────────────────
    # GeometryNodeMeshIcoSphere: inputs[0]=Radius, inputs[1]=Subdivisions
    # Using an in-tree node (vs. an external mesh) makes this modifier
    # self-contained — no mesh exists before the modifier fires.
    n_ico = nodes.new("GeometryNodeMeshIcoSphere")
    n_ico.inputs[0].default_value = ICO_RADIUS
    n_ico.inputs[1].default_value = ICO_SUBDIVISIONS

    # ── Mesh to Points — convert icosphere vertices to a point cloud ──────
    # mode='VERTICES': each of the 42 icosphere vertices becomes one point.
    # The points carry their vertex positions; no extra attribute is needed.
    # mode='FACES' or 'EDGES' would produce centroid / edge-midpoint points
    # and change the coral silhouette completely — a useful variation to try.
    n_mtp = nodes.new("GeometryNodeMeshToPoints")
    n_mtp.mode = "VERTICES"

    # ── Points to Volume ──────────────────────────────────────────────────
    # resolution_mode='VOXEL_SIZE': voxel dimensions defined in world space.
    # 'VOXEL_AMOUNT' would scale voxels relative to bounding box — less
    # predictable across scale changes, avoid for size-sensitive pipelines.
    #
    # Density socket (inputs[1]) = per-point weight added to the VDB grid.
    # Radius socket (inputs[3])  = Gaussian kernel radius.  MUST be >= 3×
    # VOXEL_SIZE or the marching cubes grid is too coarse to represent the
    # kernel shape and the isosurface will show staircase artefacts.
    n_ptv = nodes.new("GeometryNodePointsToVolume")
    n_ptv.resolution_mode = "VOXEL_SIZE"
    n_ptv.inputs["Voxel Size"].default_value = VOXEL_SIZE
    n_ptv.inputs["Density"].default_value    = 1.0
    n_ptv.inputs["Radius"].default_value     = POINT_RADIUS

    # ── Volume to Mesh ────────────────────────────────────────────────────
    # resolution_mode='GRID': inherits the voxel resolution of the incoming
    # VDB field.  This is the correct choice when the PointsToVolume upstream
    # already defines the resolution — using 'VOXEL_SIZE' here would
    # resample the volume and add aliasing.
    #
    # Threshold (inputs[1]): the density value where the isosurface sits.
    # Lower threshold → larger mesh (catches lower-density outer shell).
    # Higher threshold → smaller mesh (only the dense fused core survives).
    # Animate this socket in record.py to show the blob emerge from nothing.
    #
    # Adaptivity (inputs[2]): marching-cubes simplification ratio.
    # 0 = every voxel face represented (high poly, smooth).
    # 0.45 = medium simplification → faceted organic silhouette.
    # 1.0 = maximum simplification → chunky voxel-brick look.
    n_vtm = nodes.new("GeometryNodeVolumeToMesh")
    n_vtm.resolution_mode = "GRID"
    # Wire group input sockets for live parameter control
    # inputs[1]=Threshold and inputs[2]=Adaptivity

    # ── Flat-shade the result for the studio's faceted aesthetic ──────────
    # marching-cubes normals default to smooth (vertex-averaged).
    # Setting shade_smooth=False gives each face a hard face normal —
    # the flat-shaded faceted look that reads well in WebXR and 3D print.
    n_smooth = nodes.new("GeometryNodeSetShadeSmooth")
    n_smooth.domain = "FACE"
    n_smooth.inputs["Shade Smooth"].default_value = False

    # ── Links ──────────────────────────────────────────────────────────────
    links.new(n_ico.outputs["Mesh"],          n_mtp.inputs[0])
    links.new(n_mtp.outputs["Points"],        n_ptv.inputs[0])
    links.new(n_ptv.outputs["Volume"],        n_vtm.inputs[0])
    links.new(n_in.outputs["Threshold"],      n_vtm.inputs[1])
    links.new(n_in.outputs["Adaptivity"],     n_vtm.inputs[2])
    links.new(n_vtm.outputs["Mesh"],          n_smooth.inputs[0])
    links.new(n_smooth.outputs["Geometry"],   n_out.inputs[0])

    return ng


# ── Material ─────────────────────────────────────────────────────────────────
def _build_material() -> bpy.types.Material:
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    n_out  = nt.nodes.new("ShaderNodeOutputMaterial")
    n_bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    n_bsdf.inputs["Roughness"].default_value   = 0.35
    n_bsdf.inputs["Metallic"].default_value    = 0.05

    # World-space noise: no UVs exist after marching cubes.
    # InputPosition gives the object-space vertex position;
    # feeding it to TexNoise drives a unique, non-repeating pattern
    # across the entire organic surface without UV unwrap.
    n_pos   = nt.nodes.new("ShaderNodeNewGeometry")
    n_noise = nt.nodes.new("ShaderNodeTexNoise")
    n_noise.inputs["Scale"].default_value     = 2.4
    n_noise.inputs["Detail"].default_value    = 3.0
    n_noise.inputs["Roughness"].default_value = 0.60

    n_ramp = nt.nodes.new("ShaderNodeValToRGB")
    n_ramp.color_ramp.elements[0].color    = COOL_COLOUR
    n_ramp.color_ramp.elements[0].position = 0.0
    n_ramp.color_ramp.elements[1].color    = WARM_COLOUR
    n_ramp.color_ramp.elements[1].position = 1.0

    nt.links.new(n_pos.outputs["Position"],    n_noise.inputs["Vector"])
    nt.links.new(n_noise.outputs["Fac"],       n_ramp.inputs["Fac"])
    nt.links.new(n_ramp.outputs["Color"],      n_bsdf.inputs["Base Color"])
    nt.links.new(n_bsdf.outputs[0],            n_out.inputs["Surface"])
    return mat


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Base object: a single-vertex mesh.  GN replaces its geometry entirely.
    bpy.ops.object.empty_add(type="PLAIN_AXES")
    base = bpy.context.active_object
    base.name = OBJ_NAME + "_seed"

    # A plane is a valid base for a GN modifier that builds its own geometry
    bpy.ops.mesh.primitive_plane_add(size=0.001)
    obj      = bpy.context.active_object
    obj.name = OBJ_NAME

    ng  = _build_gn_tree()
    mat = _build_material()
    obj.data.materials.append(mat)

    mod            = obj.modifiers.new(GNM_NAME, "NODES")
    mod.node_group = ng

    # Camera: positioned to frame the ~2 m diameter coral blob
    bpy.ops.object.camera_add(location=(3.2, -3.2, 2.4))
    cam = bpy.context.active_object
    cam.rotation_euler        = (math.radians(52), 0.0, math.radians(45))
    bpy.context.scene.camera  = cam

    # Three-point lighting: key + fill + rim
    bpy.ops.object.light_add(type="AREA", location=(3.0, -2.0, 4.0))
    bpy.context.active_object.data.energy = 600
    bpy.ops.object.light_add(type="AREA", location=(-2.5, 1.5, 2.0))
    bpy.context.active_object.data.energy = 150
    bpy.ops.object.light_add(type="SPOT",  location=(0.0,  2.5, 3.5))
    bpy.context.active_object.data.energy = 200

    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

    # Apply modifier and export as a GLB snapshot (THRESHOLD at default)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=GNM_NAME)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[organic-coral] Saved:    {OUT_BLEND}")
    print(f"[organic-coral] Exported: {OUT_GLB}")


if __name__ == "__main__":
    main()
