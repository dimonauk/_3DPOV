"""
GN Shortest Edge Paths — Watershed River Network: Elevation-Cost Drainage
Blender 5.1 · CC0 · Holoflow Studio

Technique: Dijkstra's minimum-spanning-forest (via the Shortest Edge Paths node)
can model physically plausible river networks when the Edge Cost field is set to
vertex elevation. Low-elevation vertices become the "end" vertices (valley floors,
river mouths). Every ridge-top vertex traces its minimum-cost path downhill through
the mesh topology, producing a spanning tree of drainage channels that concentrates
flow into shared trunk rivers as paths converge toward valley bottoms.

The key insight: cost is additive across edge hops. A path that descends quickly
through steep edges accumulates low total cost; a path that wanders across a plateau
accumulates higher cost. The Dijkstra tree therefore naturally routes channels via
steepest-descent — the same governing principle as real stream-capture.

Key trade-offs:
  Fine grid (high res)  → smooth, dense tributary network; heavier GN evaluation
  Coarse grid           → visible stair-stepping; fewer tributaries; fast
  Low VALLEY_THRESHOLD  → few valley sources; long, trunk-dominated rivers
  High VALLEY_THRESHOLD → many sources; short, mosaic drainage basins
  RIDGE_THRESHOLD high  → few start verts; sparse path set; cleaner visual
  RIDGE_THRESHOLD low   → dense start verts; many overlapping path strands

Outside sources:
  Blender Manual — Shortest Edge Paths node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/shortest_edge_paths.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Wikipedia — Dijkstra's algorithm (cites Dijkstra 1959, journal Numerische Mathematik)
    https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
    CC-BY-SA 3.0 · Wikipedia contributors
  KhronosGroup/glTF-Blender-IO — GLB exporter used for WebXR output
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector
from mathutils.noise import noise as mn_noise, fractal as mn_fractal

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_RESOLUTION   = 40       # grid vertex count per side; 40 → 1600 verts, rich topology
GRID_SIZE         = 6.0      # metres, each side of the square terrain
NOISE_SCALE       = 1.2      # terrain noise frequency
NOISE_OCTAVES     = 6        # fractal octaves for multi-scale terrain features
NOISE_HEIGHT      = 1.8      # maximum terrain elevation (metres)
VALLEY_THRESHOLD  = -0.30    # vertices with elevation ≤ this become End Vertex (river mouths)
RIDGE_THRESHOLD   = 0.60     # vertices with elevation ≥ this emit path strands (Start Verts)
RIVER_MAX_RADIUS  = 0.035    # tube radius at valley (downstream end of each river strand)
RIVER_MIN_RADIUS  = 0.004    # tube radius at ridge (upstream tip of each tributary)
RIVER_TUBE_VERTS  = 5        # sides on the river tube cross-section
TERRAIN_MAT_NAME  = "Mat_Terrain"
RIVER_MAT_NAME    = "Mat_River"
BLEND_OUT         = "//watershed_river.blend"
GLB_OUT           = "//watershed_river.glb"


def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("WS_"):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith("WS_"):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("GN_Watershed"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("Mat_Terrain") or ma.name.startswith("Mat_River"):
            bpy.data.materials.remove(ma)


def _make_terrain() -> bpy.types.Object:
    """Create a grid, displace vertices with fractal noise, store elevation/flag attrs."""
    bm = bmesh.new()
    # bmesh.ops.create_grid produces an N×N quad grid centred at origin
    result = bmesh.ops.create_grid(
        bm,
        x_segments=GRID_RESOLUTION - 1,
        y_segments=GRID_RESOLUTION - 1,
        size=GRID_SIZE * 0.5,
    )
    # Displace each vertex vertically using fractal Perlin noise
    for v in bm.verts:
        # mn_fractal: multi-octave noise returning value in [-1, 1]
        raw = mn_fractal(
            Vector((v.co.x * NOISE_SCALE, v.co.y * NOISE_SCALE, 0.0)),
            H=1.0,
            lacunarity=2.0,
            octaves=NOISE_OCTAVES,
            noise_basis="PERLIN_ORIGINAL",
        )
        v.co.z = raw * NOISE_HEIGHT
    bm.verts.ensure_lookup_table()

    mesh = bpy.data.meshes.new("WS_Terrain")
    bm.to_mesh(mesh)
    bm.free()

    # ── Vertex attributes ─────────────────────────────────────────────────────
    # elevation: float per vertex — used as Edge Cost in Shortest Edge Paths
    elev_attr     = mesh.attributes.new("elevation",  "FLOAT",   "POINT")
    # is_valley: End Vertex flag — river mouths, where all paths terminate
    valley_attr   = mesh.attributes.new("is_valley",  "BOOLEAN", "POINT")
    # is_ridge: Start Vertex flag — ridgetops, where path strands originate
    ridge_attr    = mesh.attributes.new("is_ridge",   "BOOLEAN", "POINT")

    for i, v in enumerate(mesh.vertices):
        z = v.co.z
        elev_attr.data[i].value   = z
        valley_attr.data[i].value = z <= VALLEY_THRESHOLD
        ridge_attr.data[i].value  = z >= RIDGE_THRESHOLD

    ob = bpy.data.objects.new("WS_Terrain", mesh)
    bpy.context.collection.objects.link(ob)
    return ob


def _make_materials() -> tuple:
    # Terrain: Principled BSDF, earthy mid-tone; coloured further by vertex paint in GN
    mt = bpy.data.materials.new(TERRAIN_MAT_NAME)
    mt.use_nodes = True
    bsdf = mt.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = (0.32, 0.25, 0.18, 1.0)
    bsdf.inputs["Roughness"].default_value   = 0.85

    # River: deep-blue emissive — suggests moving water catching sky light
    mr = bpy.data.materials.new(RIVER_MAT_NAME)
    mr.use_nodes = True
    bsdf_r = mr.node_tree.nodes["Principled BSDF"]
    bsdf_r.inputs["Base Color"].default_value    = (0.03, 0.15, 0.55, 1.0)
    bsdf_r.inputs["Emission Color"].default_value = (0.05, 0.35, 1.0,  1.0)
    bsdf_r.inputs["Emission Strength"].default_value = 1.5
    bsdf_r.inputs["Roughness"].default_value     = 0.05
    bsdf_r.inputs["Specular IOR Level"].default_value = 0.9
    return mt, mr


def _build_gn_tree(ob: bpy.types.Object) -> None:
    mod = ob.modifiers.new("GN_Watershed", "NODES")
    ng  = bpy.data.node_groups.new("GN_Watershed", "GeometryNodeTree")
    mod.node_group = ng

    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    nodes = ng.nodes
    links = ng.links

    def N(bl_idname: str, x: float = 0, y: float = 0):
        n = nodes.new(bl_idname)
        n.location = (x, y)
        return n

    grp_in  = N("NodeGroupInput",  -900, 0)
    grp_out = N("NodeGroupOutput",  900, 0)

    # ── Read elevation attribute as Edge Cost ─────────────────────────────────
    # Using elevation as cost: Dijkstra routes paths through LOWEST elevation
    # because cost is cumulative — steep downhill descent = many low-cost hops.
    attr_elev = N("GeometryNodeInputNamedAttribute", -700,  200)
    attr_elev.data_type = "FLOAT"
    attr_elev.inputs["Name"].default_value = "elevation"

    # Remap elevation [-NOISE_HEIGHT, +NOISE_HEIGHT] → [0, 1] so cost is always positive.
    # Dijkstra requires non-negative edge costs (negative cost breaks the algorithm).
    remap_cost = N("ShaderNodeMapRange", -500, 200)
    remap_cost.data_type = "FLOAT"
    remap_cost.inputs["From Min"].default_value = -NOISE_HEIGHT
    remap_cost.inputs["From Max"].default_value =  NOISE_HEIGHT
    remap_cost.inputs["To Min"].default_value   = 0.0
    remap_cost.inputs["To Max"].default_value   = 1.0
    links.new(attr_elev.outputs["Attribute"], remap_cost.inputs["Value"])

    # ── Valley (End Vertex) and Ridge (Start Vertex) flags ────────────────────
    attr_valley = N("GeometryNodeInputNamedAttribute", -700,   0)
    attr_valley.data_type = "BOOLEAN"
    attr_valley.inputs["Name"].default_value = "is_valley"

    attr_ridge = N("GeometryNodeInputNamedAttribute", -700, -200)
    attr_ridge.data_type = "BOOLEAN"
    attr_ridge.inputs["Name"].default_value = "is_ridge"

    # ── Shortest Edge Paths ───────────────────────────────────────────────────
    # End Vertex = valley floors. Dijkstra routes every non-valley vertex toward
    # its nearest valley along the minimum-cumulative-elevation path.
    sep = N("GeometryNodeInputShortestEdgePaths", -300, 100)
    links.new(attr_valley.outputs["Attribute"],    sep.inputs["End Vertex"])
    links.new(remap_cost.outputs["Result"],        sep.inputs["Edge Cost"])

    # ── Edge Paths to Curves ──────────────────────────────────────────────────
    # Start Vertices = ridge tops. Each ridge vertex emits one path strand
    # down to the nearest valley. Multiple ridges that share a nearby valley
    # will produce converging tributaries — the Dijkstra tree encodes that.
    eptc = N("GeometryNodeEdgePathsToCurves", 0, 0)
    links.new(grp_in.outputs["Geometry"],          eptc.inputs["Mesh"])
    links.new(attr_ridge.outputs["Attribute"],     eptc.inputs["Start Vertices"])
    links.new(sep.outputs["Next Vertex Index"],    eptc.inputs["Next Vertex Index"])

    # ── Taper river tube by downstream progress ───────────────────────────────
    # Spline Parameter Factor: 0 = ridge tip (upstream), 1 = valley (downstream).
    # Rivers widen downstream as tributaries merge — Factor→ larger radius.
    spline_param = N("GeometryNodeSplineParameter", 180, -200)
    taper_remap  = N("ShaderNodeMapRange", 350, -200)
    taper_remap.data_type = "FLOAT"
    taper_remap.inputs["From Min"].default_value = 0.0
    taper_remap.inputs["From Max"].default_value = 1.0
    taper_remap.inputs["To Min"].default_value   = RIVER_MIN_RADIUS
    taper_remap.inputs["To Max"].default_value   = RIVER_MAX_RADIUS
    links.new(spline_param.outputs["Factor"], taper_remap.inputs["Value"])

    scr = N("GeometryNodeSetCurveRadius", 180, 0)
    links.new(eptc.outputs["Curves"],       scr.inputs["Curve"])
    links.new(taper_remap.outputs["Result"], scr.inputs["Radius"])

    # ── Curve to Mesh with N-gon profile ─────────────────────────────────────
    profile_circle = N("GeometryNodeCurvePrimitiveCircle", 480, -200)
    profile_circle.mode = "POINTS"
    profile_circle.inputs["Resolution"].default_value = RIVER_TUBE_VERTS
    profile_circle.inputs["Radius"].default_value     = 1.0

    c2m = N("GeometryNodeCurveToMesh", 480, 0)
    links.new(scr.outputs["Curve"],            c2m.inputs["Curve"])
    links.new(profile_circle.outputs["Curve"], c2m.inputs["Profile Curve"])
    c2m.inputs["Fill Caps"].default_value = True

    # ── River material (slot 1) ────────────────────────────────────────────────
    set_mat = N("GeometryNodeSetMaterialIndex", 650, 0)
    links.new(c2m.outputs["Mesh"], set_mat.inputs["Geometry"])
    set_mat.inputs["Material Index"].default_value = 1

    # ── Join terrain (slot 0) and rivers (slot 1) ─────────────────────────────
    join = N("GeometryNodeJoinGeometry", 780, 0)
    links.new(grp_in.outputs["Geometry"],      join.inputs["Geometry"])
    links.new(set_mat.outputs["Geometry"],     join.inputs["Geometry"])
    links.new(join.outputs["Geometry"], grp_out.inputs["Geometry"])


def _export_glb(filepath: str) -> None:
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_attributes=True,
    )


def main() -> None:
    _cleanup()
    mt, mr = _make_materials()
    terrain = _make_terrain()
    terrain.data.materials.clear()
    terrain.data.materials.append(mt)  # slot 0 — terrain
    terrain.data.materials.append(mr)  # slot 1 — river tubes
    _build_gn_tree(terrain)

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    _export_glb(bpy.path.abspath(GLB_OUT))
    print("WatershedRiver: saved .blend and .glb")


main()
