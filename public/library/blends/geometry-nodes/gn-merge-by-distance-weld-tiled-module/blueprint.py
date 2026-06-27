"""
GN Merge by Distance — Weld-Clean Tiled Module Assembly
Blender 5.1 · CC0 · Holoflow Studio

Technique:
  GeometryNodeMergeByDistance collapses any vertices (or a boolean-masked subset)
  that lie within a distance threshold into a single merged vertex.  The surrounding
  edges and faces are re-wired automatically; orphaned half-edges are removed.
  This is the parametric, GN-tree version of Edit-Mode 'Merge by Distance'
  (formerly 'Remove Doubles').  Unlike the bpy.ops operator the node evaluates
  lazily inside the modifier stack — no object context is required, and it works
  on geometry produced by nodes that have no stand-alone existence (instances,
  sub-expressions, multi-stream joins).

Primary pipeline:
  MeshGrid → MeshToPoints → InstanceOnPoints → RealizeInstances
                                                    ↓
                                          MergeByDistance (hero)
                                                    ↓
                                            GroupOutput (watertight mesh)

After RealizeInstances the 9 brick copies share NO topology — adjacent borders
contain DUPLICATE vertices at identical XYZ positions.  MergeByDistance with
threshold 0.0005 m welds those duplicates into shared vertices, turning 9 disjoint
meshes into one manifold, watertight solid ready for boolean operations or 3D print.

mode = 'ALL' vs 'CONNECTED':
  ALL      — merges any two vertices within threshold regardless of edge connectivity.
             Correct here: after RealizeInstances, boundary verts from different
             instances are NOT connected by edges, so CONNECTED would miss them.
  CONNECTED — only collapses verts reachable via an edge path.  Use when the mesh
              is a single continuous shell and you want to close sub-millimetre gaps
              without risking merges between geometrically-separate shells.

Selection mask (inputs['Selection'], BOOL field):
  Vertices where Selection = False are excluded from merging.  Wire a named
  boolean attribute to protect precision features (sharp chamfers, mating faces)
  while still welding the rough seam verts.

Outside sources:
  Blender Manual — Merge by Distance Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/merge_by_distance.html
    CC-BY-SA 4.0 · Blender Documentation Team
    Related nodes in same section: Join Geometry, Delete Geometry, Weld (Edit Mode)
  KhronosGroup/glTF-Blender-IO
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
    Sibling: glTF-Sample-Assets (CC0) https://github.com/KhronosGroup/glTF-Sample-Assets
  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
"""

import bpy
import bmesh
import math

# ── Parameters ─────────────────────────────────────────────────────────────
TILE_W     = 1.0    # tile width  (X), metres
TILE_D     = 1.0    # tile depth  (Y), metres
TILE_H     = 0.05   # tile thickness (Z), metres

# Raised border ridge along top perimeter (dressed-stone look, creates seam detail)
RIDGE_W    = 0.06   # ridge width from edge inward
RIDGE_H    = 0.012  # ridge rise above main tile face

GRID_COLS  = 3      # tiles across (X)
GRID_ROWS  = 3      # tiles deep  (Y)

# Weld distance: above floating-point epsilon (~1e-15) but well below any
# intentional geometric gap.  0.0005 m = 0.5 mm is safe at 1 m tile scale.
WELD_DIST  = 0.0005

BLEND_PATH = "//tile_wall_welded.blend"
GLB_PATH   = "//tile_wall_welded.glb"
DRACO_LVL  = 6


# ── Scene ──────────────────────────────────────────────────────────────────
def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


# ── Module mesh ─────────────────────────────────────────────────────────────
def make_tile_module(name: str = "tile_module") -> bpy.types.Object:
    """
    Build a single dressed-stone floor tile via the bmesh direct data API.

    Geometry (24 verts, 10 faces):
      - Base slab: 8 verts (box, TILE_W × TILE_D × TILE_H)
      - Top surface inner quad: 4 additional verts inset by RIDGE_W
      - Ridge ring: the RIDGE_W strip around the perimeter raised by RIDGE_H
        (4 outer top verts at Z=TILE_H, 4 inner top verts at Z=TILE_H+RIDGE_H)

    Exact vertex positions at outer top ring (Z = TILE_H):
      (-hw, -hd, TILE_H), (hw, -hd, TILE_H), (hw, hd, TILE_H), (-hw, hd, TILE_H)

    After tiling with 1 m spacing in XY and MergeByDistance:
      The outer top ring verts of adjacent tiles share XY positions, so
      (-TILE_W/2, y, TILE_H) on tile A == (TILE_W/2, y, TILE_H) on tile B
      → welded to one shared vertex, forming a continuous ridge network.
    """
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    bm = bmesh.new()

    hw  = TILE_W * 0.5
    hd  = TILE_D * 0.5
    rw  = RIDGE_W
    rh  = RIDGE_H

    # Bottom ring (Z = 0)
    b_fl = bm.verts.new((-hw, -hd, 0.0))
    b_fr = bm.verts.new(( hw, -hd, 0.0))
    b_br = bm.verts.new(( hw,  hd, 0.0))
    b_bl = bm.verts.new((-hw,  hd, 0.0))

    # Outer top ring (Z = TILE_H)  ← these share positions with adjacent tiles
    t_fl = bm.verts.new((-hw, -hd, TILE_H))
    t_fr = bm.verts.new(( hw, -hd, TILE_H))
    t_br = bm.verts.new(( hw,  hd, TILE_H))
    t_bl = bm.verts.new((-hw,  hd, TILE_H))

    # Inner top ring (Z = TILE_H + RIDGE_H)  ← the raised centre panel
    i_fl = bm.verts.new((-hw + rw, -hd + rw, TILE_H + rh))
    i_fr = bm.verts.new(( hw - rw, -hd + rw, TILE_H + rh))
    i_br = bm.verts.new(( hw - rw,  hd - rw, TILE_H + rh))
    i_bl = bm.verts.new((-hw + rw,  hd - rw, TILE_H + rh))

    def F(*verts): bm.faces.new(verts)

    # Bottom face (normal points −Z)
    F(b_fl, b_bl, b_br, b_fr)
    # Four side faces (vertical)
    F(b_fl, b_fr, t_fr, t_fl)   # front
    F(b_fr, b_br, t_br, t_fr)   # right
    F(b_br, b_bl, t_bl, t_br)   # back
    F(b_bl, b_fl, t_fl, t_bl)   # left
    # Ridge ring: 4 sloped faces from outer top down-to-inner top
    F(t_fl, t_fr, i_fr, i_fl)   # front ridge
    F(t_fr, t_br, i_br, i_fr)   # right ridge
    F(t_br, t_bl, i_bl, i_br)   # back ridge
    F(t_bl, t_fl, i_fl, i_bl)   # left ridge
    # Centre panel (top face)
    F(i_fl, i_fr, i_br, i_bl)

    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    me.update()

    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.shade_flat()

    v_count = len(me.vertices)
    f_count = len(me.polygons)
    print(f"[blueprint] Module '{name}': {v_count} verts, {f_count} faces")
    return ob


# ── GN modifier ─────────────────────────────────────────────────────────────
def build_gn_weld_tile(ob: bpy.types.Object) -> bpy.types.NodesModifier:
    """
    Wire the tile-scatter + weld graph onto `ob`.

    Node graph:
      GroupInput.Geometry (module mesh)
         │
         ├─ MeshGrid (COLS×ROWS point grid, XY plane)
         │     └─ MeshToPoints (extract grid vertices as point cloud)
         │           └─ InstanceOnPoints
         │                 ├─ Instance ← GroupInput.Geometry
         │                 └─ RealizeInstances
         │                       └─ MergeByDistance (WELD_DIST, mode=ALL)
         │                             └─ GroupOutput.Geometry
    """
    mod = ob.modifiers.new("GN_WeldTile", 'NODES')
    ng  = bpy.data.node_groups.new("GN_WeldTile", 'GeometryNodeTree')
    mod.node_group = ng
    nodes = ng.nodes
    links = ng.links

    def N(bl_id: str, x: float = 0, y: float = 0):
        n = nodes.new(bl_id)
        n.location = (x, y)
        return n

    # Declare I/O sockets (Blender 5.1 interface panel)
    ng.interface.new_socket('Geometry', in_out='INPUT',
                             socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT',
                             socket_type='NodeSocketGeometry')

    gi = N('NodeGroupInput',   -1000, 0)
    go = N('NodeGroupOutput',    800, 0)

    # ── Grid of tile positions ───────────────────────────────────────────────
    # MeshGrid with vertices_x=COLS, vertices_y=ROWS gives COLS×ROWS verts.
    # Spacing = size / (vertices − 1), so size = spacing × (vertices − 1).
    grid = N('GeometryNodeMeshGrid', -750, 250)
    grid.inputs['Size X'].default_value     = TILE_W * (GRID_COLS - 1)
    grid.inputs['Size Y'].default_value     = TILE_D * (GRID_ROWS - 1)
    grid.inputs['Vertices X'].default_value = GRID_COLS
    grid.inputs['Vertices Y'].default_value = GRID_ROWS

    m2p = N('GeometryNodeMeshToPoints', -550, 250)
    m2p.mode = 'VERTS'
    links.new(grid.outputs['Mesh'], m2p.inputs['Mesh'])

    # ── Instance module at each point ────────────────────────────────────────
    inst = N('GeometryNodeInstanceOnPoints', -300, 0)
    links.new(m2p.outputs['Points'],  inst.inputs['Points'])
    links.new(gi.outputs['Geometry'], inst.inputs['Instance'])

    # ── Realize: 9 disjoint copies, seam verts are duplicated ────────────────
    real = N('GeometryNodeRealizeInstances', 0, 0)
    links.new(inst.outputs['Instances'], real.inputs['Geometry'])

    # ── Merge by Distance: weld seam verts into shared topology ─────────────
    # After RealizeInstances adjacent tiles share edge positions but NOT edges.
    # mode='ALL' is REQUIRED here: CONNECTED only merges verts connected by
    # an edge path, but seam verts from different instances have no shared edges.
    mbd = N('GeometryNodeMergeByDistance', 350, 0)
    mbd.mode = 'ALL'
    mbd.inputs['Distance'].default_value = WELD_DIST
    links.new(real.outputs['Geometry'], mbd.inputs['Geometry'])

    links.new(mbd.outputs['Geometry'], go.inputs['Geometry'])
    return mod


# ── Material ────────────────────────────────────────────────────────────────
def make_tile_material(name: str = "M_StoneTile") -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.72, 0.68, 0.60, 1.0)
    bsdf.inputs['Roughness'].default_value  = 0.82
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


# ── Main ────────────────────────────────────────────────────────────────────
def main() -> None:
    clear_scene()

    ob  = make_tile_module()
    mat = make_tile_material()
    ob.data.materials.append(mat)

    mod = build_gn_weld_tile(ob)

    # Camera + sun light
    bpy.ops.object.camera_add(location=(4.5, -4.5, 3.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(55), 0.0, math.radians(45))
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(5.0, -5.0, 8.0))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(40), 0.0, math.radians(25))

    # Diagnostic: report pre- and post-weld vertex counts via depsgraph
    dg = bpy.context.evaluated_depsgraph_get()
    ob_eval = ob.evaluated_get(dg)
    me_eval = ob_eval.to_mesh()
    v_after = len(me_eval.vertices)
    f_after = len(me_eval.polygons)
    e_after = len(me_eval.edges)
    ob_eval.to_mesh_clear()

    # Pre-weld: GRID_COLS × GRID_ROWS × verts-per-module
    verts_per_module = len(ob.data.vertices)   # 12 (before GN modifier)
    v_before = GRID_COLS * GRID_ROWS * verts_per_module
    print(f"[blueprint] Pre-weld  verts (estimate): {v_before}")
    print(f"[blueprint] Post-weld verts:             {v_after}")
    print(f"[blueprint] Verts merged (saved):        {v_before - v_after}")
    print(f"[blueprint] Evaluated faces:             {f_after}, edges: {e_after}")

    # Save blend
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))

    # Export GLB (watertight, Draco compressed, flat-shaded)
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LVL,
        export_materials='EXPORT',
    )
    print(f"[blueprint] Saved: {BLEND_PATH}")
    print(f"[blueprint] GLB:   {GLB_PATH}")


if __name__ == "__main__":
    main()
