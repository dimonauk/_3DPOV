"""
GN Dual Mesh — Procedural Voronoi Cell Sphere  (Blender 5.1)
blueprint.py — run via Text Editor ▸ Run Script, or:
               blender --background --python blueprint.py

WHY DUAL MESH IS NOT "JUST VORONOI"
  The topological dual of a triangulated surface is a cell decomposition where
  every original face becomes a vertex (at its centroid) and every original
  vertex becomes a face (one edge per adjacent triangle).  For a closed,
  uniformly-triangulated sphere this is exactly the spherical Voronoi
  tessellation of the original vertex positions — but it is computed purely
  by topology, not by a Euclidean distance query.  Perturbing the sphere's
  vertices with noise BEFORE dualising changes the face-centre positions, so
  the output cells become irregular without any extra "randomise" node.

  This is more controllable than a noise-textured displacement on the dual
  output, because the irregularity is baked into the input topology: you
  adjust one parameter (NOISE_STRENGTH) and cells grow or shrink organically.

PIPELINE SUMMARY
  IcoSphere(subdiv=3) → SetPosition(+noise) → DualMesh
    → ScaleElements(FACE, CELL_SCALE)         ← inter-cell gap
    → ExtrudeMesh(individual=True, depth)     ← raised tiles
    → SetShadeSmooth(False)                   ← crisp flat facets
    → SetMaterial → GroupOutput

OUTSIDE SOURCES
  Blender Manual — Dual Mesh Node (Geometry Nodes)
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/dual_mesh.html
    CC-BY-SA 4.0 · Blender Foundation
  Sverchok Add-on — Node-based Parametric Modelling for Blender (MIT)
    https://github.com/nortikin/sverchok
    Nikita Gorodetskiy et al. — includes Voronoi nodes for cross-reference
  Geometry Processing JS (MIT) — Fortune's Voronoi math reference
    https://github.com/geometryprocessing/geometry-processing-js
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
RADIUS            = 1.0
ICO_SUBDIVISIONS  = 3       # 1280 input triangles → 642 output Voronoi cells
NOISE_SCALE       = 2.5     # spatial frequency of vertex jitter in object space
NOISE_DETAIL      = 3.0     # fractal octaves — adds finer wrinkles to cell edges
NOISE_ROUGHNESS   = 0.65    # persistence per octave
NOISE_DISTORTION  = 0.20    # distortion pre-warp; roughens jagged cell boundaries
NOISE_STRENGTH    = 0.08    # radial displacement amplitude (metres)
CELL_SCALE        = 0.87    # per-face scale after dual: 0.87 → 13 % inter-cell gap
EXTRUSION_DEPTH   = 0.055   # how far each tile pops outward
ANIM_FRAMES       = 72      # 3 s at 24 fps (for record.py noise-W sweep)

OUTPUT_BLEND = "//voronoi_cell_sphere.blend"
OUTPUT_GLB   = "//voronoi_cell_sphere.glb"
# ─────────────────────────────────────────────────────────────────────────────


def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.node_groups, bpy.data.materials):
        for item in list(pool):
            pool.remove(item)


def make_material() -> bpy.types.Material:
    """Ceramic-style mat: off-white base, slight roughness, KHR_materials_sheen."""
    mat = bpy.data.materials.new("CellSphereMat")
    mat.use_nodes = True
    pb = mat.node_tree.nodes.get("Principled BSDF")
    # Off-white porcelain — tiles read as distinct without a per-cell colour.
    pb.inputs['Base Color'].default_value = (0.94, 0.91, 0.86, 1.0)
    pb.inputs['Roughness'].default_value  = 0.30
    pb.inputs['Metallic'].default_value   = 0.0
    # Subsurface gives gentle translucency matching a ceramic glaze.
    pb.inputs['Subsurface Weight'].default_value = 0.06
    pb.inputs['Subsurface Radius'].default_value = (0.5, 0.2, 0.1)
    return mat


def build_gn_tree() -> bpy.types.GeometryNodeTree:
    """
    Self-contained Geometry Nodes tree — no external geometry input.

    Critical wiring details:
    - Noise Texture vector input = Position (object space); this anchors the
      noise to world geometry so it doesn't swim when the object moves.
    - VectorMath SCALE: scales the Normal vector by the float output of
      Math(MULTIPLY, NOISE_STRENGTH), giving a per-vertex offset vector
      pointing radially outward — AFTER the ico-sphere construction, where
      Normal == normalised Position.
    - DualMesh 'Keep Boundaries' = False (sphere has no boundary edges;
      True has no effect but is worth knowing for partial-surface use).
    - ScaleElements domain='FACE': scales each face toward its OWN centroid;
      the Center socket is left unconnected so Blender uses per-element
      centres automatically.
    - ExtrudeMesh 'Individual Faces' input (boolean socket) = True: each face
      extrudes independently.  False would extrude the outer boundary as a
      shell, merging adjacent cells.
    """
    ng  = bpy.data.node_groups.new("voronoi_cell_sphere_gn", 'GeometryNodeTree')
    ni  = ng.interface
    nds = ng.nodes
    lks = ng.links

    # ── Group interface ──────────────────────────────────────────────────────
    s_ns  = ni.new_socket("Noise Strength", in_out='INPUT',  socket_type='NodeSocketFloat')
    s_mat = ni.new_socket("Material",       in_out='INPUT',  socket_type='NodeSocketMaterial')
    ni.new_socket("Geometry",               in_out='OUTPUT', socket_type='NodeSocketGeometry')
    s_ns.default_value  = NOISE_STRENGTH
    s_ns.min_value      = 0.0
    s_ns.max_value      = 0.4

    def nd(t, lbl="", loc=(0, 0)):
        n = nds.new(t); n.label = lbl; n.location = loc; return n

    def math_nd(op, loc, val_b=None):
        n = nd('ShaderNodeMath', op.title(), loc)
        n.operation = op
        if val_b is not None:
            n.inputs[1].default_value = val_b
        return n

    n_in  = nd('NodeGroupInput',  loc=(-1600, 0))
    n_out = nd('NodeGroupOutput', loc=(1500, 0))

    # ── 1. IcoSphere ─────────────────────────────────────────────────────────
    n_ico = nd('GeometryNodeMeshIcoSphere', 'IcoSphere', loc=(-1200, 200))
    n_ico.inputs['Radius'].default_value       = RADIUS
    n_ico.inputs['Subdivisions'].default_value = ICO_SUBDIVISIONS

    # ── 2. Noise displacement (radial) ───────────────────────────────────────
    n_pos  = nd('GeometryNodeInputPosition', 'Position',       loc=(-1400, -100))
    n_nrm  = nd('GeometryNodeInputNormal',   'Normal',         loc=(-1200, -200))

    n_noise = nd('ShaderNodeTexNoise', 'Noise', loc=(-1100, -100))
    n_noise.noise_dimensions                    = '3D'
    n_noise.inputs['Scale'].default_value       = NOISE_SCALE
    n_noise.inputs['Detail'].default_value      = NOISE_DETAIL
    n_noise.inputs['Roughness'].default_value   = NOISE_ROUGHNESS
    n_noise.inputs['Distortion'].default_value  = NOISE_DISTORTION
    # Connect position as the vector coordinate for stable object-space noise.
    lks.new(n_pos.outputs['Position'], n_noise.inputs['Vector'])

    # Fac (0-1) × NOISE_STRENGTH → displacement magnitude
    n_mul = math_nd('MULTIPLY', loc=(-850, -100))
    lks.new(n_noise.outputs['Fac'], n_mul.inputs[0])
    lks.new(n_in.outputs['Noise Strength'], n_mul.inputs[1])

    # Scale Normal vector by displacement magnitude → offset vector
    n_vmul = nd('ShaderNodeVectorMath', 'Normal×Disp', loc=(-650, -150))
    n_vmul.operation = 'SCALE'
    lks.new(n_nrm.outputs['Normal'], n_vmul.inputs['Vector'])
    lks.new(n_mul.outputs['Value'],  n_vmul.inputs['Scale'])

    # SetPosition: offset the ico sphere's vertices radially
    n_setp = nd('GeometryNodeSetPosition', 'Set Position', loc=(-400, 200))
    lks.new(n_ico.outputs['Mesh'],         n_setp.inputs['Geometry'])
    lks.new(n_vmul.outputs['Vector'],      n_setp.inputs['Offset'])

    # ── 3. Dual Mesh ─────────────────────────────────────────────────────────
    n_dual = nd('GeometryNodeDualMesh', 'Dual Mesh', loc=(-150, 200))
    # Keep Boundaries=False: sphere is closed; boundary handling irrelevant.
    n_dual.inputs['Keep Boundaries'].default_value = False
    lks.new(n_setp.outputs['Geometry'], n_dual.inputs['Mesh'])

    # ── 4. Scale Elements (per-face gap) ─────────────────────────────────────
    n_scale = nd('GeometryNodeScaleElements', 'Cell Gap', loc=(100, 200))
    n_scale.domain     = 'FACE'
    n_scale.scale_mode = 'UNIFORM'
    n_scale.inputs['Scale'].default_value = CELL_SCALE
    lks.new(n_dual.outputs['Dual Mesh'], n_scale.inputs['Geometry'])

    # ── 5. Extrude Mesh (individual tiles) ───────────────────────────────────
    n_ext = nd('GeometryNodeExtrudeMesh', 'Extrude', loc=(350, 200))
    n_ext.mode = 'FACES'
    n_ext.inputs['Individual Faces'].default_value = True
    n_ext.inputs['Offset Scale'].default_value     = EXTRUSION_DEPTH
    lks.new(n_scale.outputs['Geometry'], n_ext.inputs['Mesh'])

    # ── 6. Flat shading — crisp facet edges match studio aesthetic ───────────
    n_sms = nd('GeometryNodeSetShadeSmooth', 'Flat Shade', loc=(600, 200))
    n_sms.inputs['Shade Smooth'].default_value = False
    lks.new(n_ext.outputs['Mesh'], n_sms.inputs['Geometry'])

    # ── 7. Material + output ─────────────────────────────────────────────────
    n_mat = nd('GeometryNodeSetMaterial', 'Set Mat', loc=(850, 200))
    lks.new(n_sms.outputs['Geometry'],  n_mat.inputs['Geometry'])
    lks.new(n_in.outputs['Material'],   n_mat.inputs[2])
    lks.new(n_mat.outputs['Geometry'],  n_out.inputs['Geometry'])

    return ng


def make_scaffold_object(ng: bpy.types.GeometryNodeTree,
                         mat: bpy.types.Material) -> bpy.types.Object:
    me  = bpy.data.meshes.new("VoronoiCellSphere")
    obj = bpy.data.objects.new("VoronoiCellSphere", me)
    bpy.context.collection.objects.link(obj)
    mod = obj.modifiers.new("VoronoiCellSphere", 'NODES')
    mod.node_group = ng
    # Assign material via socket identifier lookup (robust across socket reorders)
    for item in ng.interface.items_tree:
        if item.name == "Material":
            mod[item.identifier] = mat
            break
    return obj


def add_camera_and_light() -> None:
    # Slightly off-axis perspective camera emphasises the tile depth.
    bpy.ops.object.camera_add(location=(2.1, -2.1, 1.8))
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    cam.rotation_euler = (1.05, 0.0, 0.785)   # ~60° tilt, 45° azimuth
    cam.data.lens = 50
    bpy.context.scene.camera = cam

    bpy.ops.object.light_add(type='SUN', location=(4, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = 0.05   # narrow sun → hard shadows accentuate tile edges

    bpy.ops.object.light_add(type='AREA', location=(-2, 3, 3))
    fill = bpy.context.active_object
    fill.data.energy = 80
    fill.data.size   = 4.0   # soft fill to lift shadows in grooves


def export_glb(output: str = OUTPUT_GLB) -> None:
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format='GLB',
        export_apply=True,
        export_animations=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )


def main() -> None:
    clear_scene()
    mat = make_material()
    ng  = build_gn_tree()
    obj = make_scaffold_object(ng, mat)   # noqa: F841 — used implicitly via scene
    add_camera_and_light()

    scene = bpy.context.scene
    scene.frame_start = scene.frame_end = 1
    scene.frame_set(1)

    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT_BLEND)
    export_glb()
    print("✓ voronoi_cell_sphere.blend  ✓ voronoi_cell_sphere.glb")


if __name__ == "__main__":
    main()
