"""
RemeshModifier — VOXEL + SHARP Modes, Topology-Clean Pipeline
==============================================================
Blender 5.1 | CC0 | Holoflow Studio

Technique
---------
RemeshModifier reconstructs a manifold uniform mesh from a signed-distance
field (SDF) evaluated over the source geometry. It solves four topology
problems common in studio work:

  • Boolean junction seams (non-manifold T-junctions left by fast solver)
  • Over-dense sculpt or displacement mesh (10 k faces where 400 would do)
  • Irregular post-import triangulation (photogrammetry, point-cloud bakes)
  • Noise-displaced procedural meshes whose density is spatially uneven

Four modes in Blender 5.1:

  BLOCKS  — axis-aligned cubic cells; voxel-art look; never UV-safe.
  SMOOTH  — marching-cubes surface; smooth normals but no feature-edge tracking.
  SHARP   — dual-contouring variant; tracks feature angles; flat-shading safe;
            best for hard-surface and the studio's faceted aesthetic.
  VOXEL   — OpenVDB volumetric SDF; most accurate; supports adaptivity to
            simplify flat regions; requires watertight source geometry.

Why SHARP over SMOOTH for faceted studio work?
  SMOOTH averages normals toward the surface centroid, rounding all angles.
  SHARP runs dual contouring which places vertices at feature edge crossings,
  preserving angles ≥ the dihedral threshold. Flat-shading on a SHARP mesh
  reads as intentional faceting; flat-shading on a SMOOTH mesh reads as
  broken normals.

Failure modes (read before touching these params)
-------------------------------------------------
  voxel_size < 0.02 m on a 1 m object → the voxel grid exceeds 50^3 = 125 k
    cells per axis. At 0.005 m that is 200^3 = 8 M cells: OOM crash.
    Keep voxel_size >= 0.025 unless working on sub-centimetre jewellery.
  Non-manifold input to VOXEL: holes, interior faces, or T-junctions produce
    undefined SDF samples. Pre-process with bmesh.ops.holes_fill().
    SHARP / SMOOTH / BLOCKS are more tolerant — they use octree voxels rather
    than a global volumetric SDF.
  adaptivity with SHARP mode: ignored — SHARP does dual contouring, not
    surface simplification. adaptivity only affects VOXEL mode.
  UVs destroyed: all four modes discard existing UV layers. Re-unwrap with
    Smart UV Project or use triplanar shading (no UV required).
  use_remove_disconnected + threshold = 1.0: drops every island except the
    largest-volume component. Set threshold = 0.0 to keep interior cavities.
  Scale not applied: VOXEL count = object_size / voxel_size * object.scale.
    An unapplied 2× scale doubles expected voxel count silently. Always
    bpy.ops.object.transform_apply(scale=True) before remesh, or
    compute world-space bounds manually and set voxel_size accordingly.

Pipeline in this blueprint
--------------------------
  1. Subdivided icosphere (4 levels) → Perlin noise vertex displacement
     → organic irregular source blob (~2 500 faces, uneven density)
  2. RemeshModifier VOXEL on the source — live preview, stays on stack
  3. Copy → RemeshModifier SHARP → flat-shaded faceted studio look
  4. Flat toon material on the SHARP copy (single colour, roughness=1)
  5. GLB export with export_apply=True (collapses modifier without bpy.ops)

Outside sources
---------------
  bpy.types.RemeshModifier — Blender Python API 5.1 (CC-BY-SA-4.0)
  https://docs.blender.org/api/5.1/bpy.types.RemeshModifier.html
  Blender Foundation · https://projects.blender.org/blender/blender

  Remesh Modifier — Blender Manual (CC-BY-SA-4.0)
  https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/remesh.html
  Blender Documentation Team

  glTF-Blender-IO (Apache-2.0)
  https://github.com/KhronosGroup/glTF-Blender-IO
  Khronos Group
"""

import bpy
import bmesh
from mathutils import Vector
from mathutils import noise as mn   # Perlin noise — headless-safe in 5.1

# ── Tunable constants ─────────────────────────────────────────────────────────
SPHERE_RADIUS      = 0.40          # metres — source blob radius
ICO_SUBDIVISIONS   = 4             # 4 → 2 560 faces; 5 → 10 240 (slow to remesh)
NOISE_STRENGTH     = 0.09          # vertex offset amplitude in metres
NOISE_SCALE        = 4.1           # spatial frequency of Perlin noise

VOXEL_SIZE         = 0.048         # metres — VOXEL cell size (keep >= 0.025)
VOXEL_ADAPTIVITY   = 0.14          # 0–1 — simplify flat regions (VOXEL only)

SHARP_OCTREE_DEPTH = 5             # 2^5 = 32 grid cells per axis
SHARP_SCALE        = 0.90          # 0.5–0.99 fit margin inside grid cell

OBJECT_NAME        = "hf_remesh_blob"
MATERIAL_NAME      = "hf_toon_remesh"
EXPORT_PATH        = "//hf_remesh_blob.glb"
BASE_COLOUR        = (0.14, 0.38, 0.72, 1.0)  # studio cool-blue


# ── Helpers ───────────────────────────────────────────────────────────────────

def purge_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for block in list(col):
            col.remove(block)


def make_noisy_blob() -> bpy.types.Object:
    """Subdivided icosphere displaced by Perlin noise → irregular source mesh."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=ICO_SUBDIVISIONS,
                                          radius=SPHERE_RADIUS)
    ob = bpy.context.active_object
    ob.name = ob.data.name = OBJECT_NAME + "_src"

    bm = bmesh.new()
    bm.from_mesh(ob.data)

    for v in bm.verts:
        # Noise sample in local space, scaled by NOISE_SCALE for frequency
        t = Vector((v.co.x * NOISE_SCALE,
                    v.co.y * NOISE_SCALE,
                    v.co.z * NOISE_SCALE))
        offset = mn.noise(t) * NOISE_STRENGTH
        v.co += v.normal * offset   # displace along face normal → organic lumps

    bm.to_mesh(ob.data)
    ob.data.update()
    bm.free()

    # Apply scale so VOXEL size is computed in world space (see failure modes)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return ob


def add_remesh_voxel(ob: bpy.types.Object) -> bpy.types.RemeshModifier:
    """VOXEL mode: OpenVDB SDF → uniform quad-dominant topology, stays live."""
    rem = ob.modifiers.new("Remesh_VOXEL", 'REMESH')
    rem.mode             = 'VOXEL'
    rem.voxel_size       = VOXEL_SIZE
    rem.adaptivity       = VOXEL_ADAPTIVITY
    rem.use_smooth_shade = True    # smooth normals on VOXEL output
    return rem


def build_sharp_ob(src: bpy.types.Object) -> bpy.types.Object:
    """Duplicate source, replace modifier stack with SHARP, flat-shade."""
    sharp_ob = src.copy()
    sharp_ob.data = src.data.copy()
    sharp_ob.name = sharp_ob.data.name = OBJECT_NAME
    bpy.context.collection.objects.link(sharp_ob)
    sharp_ob.location.x += SPHERE_RADIUS * 2.5   # side-by-side in viewport

    for mod in list(sharp_ob.modifiers):
        sharp_ob.modifiers.remove(mod)

    rem = sharp_ob.modifiers.new("Remesh_SHARP", 'REMESH')
    rem.mode                    = 'SHARP'
    rem.octree_depth            = SHARP_OCTREE_DEPTH
    rem.scale                   = SHARP_SCALE
    rem.use_smooth_shade        = False   # flat faces = visible facets
    rem.use_remove_disconnected = True
    rem.threshold               = 1.0

    return sharp_ob


def make_toon_material() -> bpy.types.Material:
    """Minimal Principled BSDF: flat colour, no specular, roughness=1."""
    mat = bpy.data.materials.new(name=MATERIAL_NAME)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new('ShaderNodeOutputMaterial')
    bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')

    bsdf.inputs['Base Color'].default_value          = BASE_COLOUR
    bsdf.inputs['Roughness'].default_value           = 1.0
    bsdf.inputs['Specular IOR Level'].default_value  = 0.0  # 5.1 field name

    tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    out.location  = (300, 0)
    bsdf.location = (0, 0)
    return mat


def assign_material(ob: bpy.types.Object, mat: bpy.types.Material) -> None:
    if ob.data.materials:
        ob.data.materials[0] = mat
    else:
        ob.data.materials.append(mat)


def export_glb(ob: bpy.types.Object) -> None:
    """Select only the export target; GLB with export_apply collapses modifiers."""
    for o in bpy.context.scene.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob

    bpy.ops.export_scene.gltf(
        filepath          = bpy.path.abspath(EXPORT_PATH),
        export_format     = 'GLB',
        use_selection     = True,
        export_apply      = True,
        export_yup        = True,               # +Y up convention for WebXR
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    purge_scene()

    src = make_noisy_blob()
    add_remesh_voxel(src)           # VOXEL modifier stays live on source

    sharp_ob = build_sharp_ob(src)  # SHARP modifier on separate copy
    mat = make_toon_material()
    assign_material(sharp_ob, mat)

    export_glb(sharp_ob)            # exports SHARP-remeshed faceted blob

    print(f"[holoflow] VOXEL preview: {src.name!r}  "
          f"voxel_size={VOXEL_SIZE}  adaptivity={VOXEL_ADAPTIVITY}")
    print(f"[holoflow] SHARP export:  {sharp_ob.name!r}  "
          f"depth={SHARP_OCTREE_DEPTH}  scale={SHARP_SCALE}")
    print(f"[holoflow] GLB → {EXPORT_PATH}")


if __name__ == "__main__":
    main()
