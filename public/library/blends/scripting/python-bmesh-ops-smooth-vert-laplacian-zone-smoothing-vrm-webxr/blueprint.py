"""
Holoflow Studio — Blender 5.1
bmesh.ops.smooth_vert + bmesh.ops.smooth_laplacian_vert
Zone-Selective Vertex Smoothing: VRM Shoulder Blend

Technique:
  Two Laplacian kernels — uniform (smooth_vert) and cotangent-weighted
  (smooth_laplacian_vert) — are applied to distinct Z-height zones of a
  shoulder pauldron mesh.  smooth_vert is a pure centroid relaxation that
  gently shrinks mesh volume with repeated iterations; smooth_laplacian_vert
  weights each neighbour contribution by the cotangent of the opposite angles,
  producing shape-preserving smoothing when preserve_volume=True.

  Studio prop:
    hf_smooth_pauldron.blend — source file
    hf_smooth_pauldron.glb  — VRM-compatible, +Y-up, Draco L6, WebP textures

  Outside sources:
    Blender Foundation — bmesh.ops API Reference — CC-BY-SA-4.0
    https://docs.blender.org/api/5.1/bmesh.ops.html
    Related: https://projects.blender.org/blender/blender
              https://docs.blender.org/api/5.1/bmesh.types.html

    KhronosGroup — glTF-Blender-IO — Apache-2.0
    https://github.com/KhronosGroup/glTF-Blender-IO
    Related: https://github.com/KhronosGroup/glTF
             https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ─── PARAMETERS ───────────────────────────────────────────────────────────────
DOME_RADIUS      = 0.60   # outer dome radius in metres
COLLAR_SEGS      = 16     # lateral segments (shared by collar + dome equator)
DOME_V_SEGS      = 10     # latitude rings in UV sphere (10 → 9 ring rows)
COLLAR_DROP      = 0.12   # how far the collar extrudes below the dome base (m)
COLLAR_THICKNESS = 0.04   # solidify thickness for collar ring shell

# Zone thresholds (Z coordinate after hemisphere construction)
# The dome base ring sits at approx Z ≈ 0.104 for DOME_RADIUS=0.6, V_SEGS=10.
ZONE_COLLAR_MAX  = 0.16   # Z ≤ this → hard collar zone (no smoothing)
ZONE_BLEND_MAX   = 0.35   # Z ≤ this (and > COLLAR_MAX) → blend zone (smooth_vert)
                           # Z > BLEND_MAX → dome cap zone (smooth_laplacian_vert)

# smooth_vert parameters (uniform Laplacian)
SV_FACTOR        = 0.50   # relaxation weight per pass (0 = none, 1 = full snap)
SV_ITERATIONS    = 5      # number of uniform-smooth passes

# smooth_laplacian_vert parameters (cotangent Laplacian)
SLV_LAMBDA       = 0.50   # cotangent weight factor
SLV_LAMBDA_BDR   = 0.20   # border-vertex weight (lower → stiffer boundary)
SLV_ITERATIONS   = 3      # number of cotangent passes

EXPORT_GLB  = "//hf_smooth_pauldron.glb"
EXPORT_BLEND = "//hf_smooth_pauldron.blend"
# ──────────────────────────────────────────────────────────────────────────────


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for pool in (bpy.data.meshes, bpy.data.materials,
                 bpy.data.objects, bpy.data.cameras, bpy.data.lights):
        for item in list(pool):
            pool.remove(item, do_unlink=True)


def make_cel_material(name: str, base_rgb=(0.22, 0.28, 0.55)) -> bpy.types.Material:
    """Flat-shaded cel material: ShaderToRGB posterise → Emission for WebXR."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    em   = nt.nodes.new('ShaderNodeEmission')
    str2 = nt.nodes.new('ShaderNodeShaderToRGB')
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    mix  = nt.nodes.new('ShaderNodeMixRGB')

    diff.inputs['Color'].default_value = (*base_rgb, 1.0)
    mix.blend_type  = 'MULTIPLY'
    mix.inputs['Fac'].default_value  = 1.0
    mix.inputs['Color2'].default_value = (1.2, 1.2, 1.3, 1.0)  # cool tint

    nt.links.new(diff.outputs['BSDF'], str2.inputs['Shader'])
    nt.links.new(str2.outputs['Color'], mix.inputs['Color1'])
    nt.links.new(mix.outputs['Color'], em.inputs['Color'])
    nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    em.inputs['Strength'].default_value = 1.0
    return mat


def _perturb_blend_zone(bm: bmesh.types.BMesh, verts: list) -> None:
    """Add deterministic sine-wave bumps to make smooth_vert effect visible."""
    for v in verts:
        theta = math.atan2(v.co.y, v.co.x)
        bump  = math.sin(theta * 7 + v.co.z * 22) * 0.022
        r = math.sqrt(v.co.x**2 + v.co.y**2)
        if r > 1e-5:
            v.co.x += bump * (v.co.x / r)
            v.co.y += bump * (v.co.y / r)
        v.co.z += math.sin(theta * 5 + v.co.z * 14) * 0.012


def build_pauldron() -> bpy.types.Object:
    bm = bmesh.new()
    bm.loops.layers.uv.new("UVMap")

    # ── 1. UV sphere hemisphere ───────────────────────────────────────────────
    # create_uvsphere produces a full sphere; we delete the lower half.
    bmesh.ops.create_uvsphere(
        bm,
        u_segments=COLLAR_SEGS,
        v_segments=DOME_V_SEGS,
        radius=DOME_RADIUS,
        calc_uvs=True,
    )
    bm.verts.ensure_lookup_table()

    # Delete all verts in the southern hemisphere (z < 0).
    # Using context='VERTS' removes connected edges and faces with them,
    # leaving a clean boundary loop at the equator ring.
    lower_verts = [v for v in bm.verts if v.co.z < -0.005]
    bmesh.ops.delete(bm, geom=lower_verts, context='VERTS')
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # ── 2. Identify zones BEFORE perturbing ───────────────────────────────────
    collar_verts = [v for v in bm.verts if v.co.z <= ZONE_COLLAR_MAX]
    blend_verts  = [v for v in bm.verts
                    if ZONE_COLLAR_MAX < v.co.z <= ZONE_BLEND_MAX]
    dome_verts   = [v for v in bm.verts if v.co.z > ZONE_BLEND_MAX]

    # ── 3. Perturb blend zone to demonstrate smoothing effect ─────────────────
    _perturb_blend_zone(bm, blend_verts)

    # ── 4. Apply smooth_vert to blend zone ────────────────────────────────────
    # smooth_vert: uniform Laplacian — moves each vertex toward the
    # centroid average of its direct neighbours.  Repeated passes amplify
    # the effect but also shrink the mesh slightly; useful for moderate
    # relax without the cotangent setup cost.
    for _ in range(SV_ITERATIONS):
        bmesh.ops.smooth_vert(
            bm,
            verts=blend_verts,
            factor=SV_FACTOR,
            mirror_clip_x=False,
            mirror_clip_y=False,
            mirror_clip_z=False,
            clip_dist=1e-5,
            use_axis_x=True,
            use_axis_y=True,
            use_axis_z=True,
        )
    bm.normal_update()

    # ── 5. Apply smooth_laplacian_vert to dome cap ────────────────────────────
    # smooth_laplacian_vert: cotangent-weighted Laplacian — each neighbour is
    # weighted by cot(α) + cot(β) where α/β are the angles opposite the
    # shared edge in adjacent triangles.  This compensates for irregular
    # triangle shapes that would bias a uniform average.  preserve_volume=True
    # applies a uniform-scale correction each pass to counteract the shrinkage
    # inherent in all Laplacian schemes.
    for _ in range(SLV_ITERATIONS):
        bmesh.ops.smooth_laplacian_vert(
            bm,
            verts=dome_verts,
            lambda_factor=SLV_LAMBDA,
            lambda_border=SLV_LAMBDA_BDR,
            use_x=True,
            use_y=True,
            use_z=True,
            preserve_volume=True,
        )
    bm.normal_update()

    # ── 6. Extrude collar ring downward ───────────────────────────────────────
    # The lowest ring of the hemisphere becomes the hard collar.
    # Extrude it downward to form a short shell wall.
    base_ring_verts = [v for v in bm.verts if v.co.z <= ZONE_COLLAR_MAX + 0.005]
    base_ring_edges = [
        e for e in bm.edges
        if all(v in set(base_ring_verts) for v in e.verts)
        and not e.link_faces or len(e.link_faces) == 1
    ]
    # Safer: find actual boundary edges (only one face linked)
    boundary_edges = [e for e in bm.edges if len(e.link_faces) == 1]
    if boundary_edges:
        ret = bmesh.ops.extrude_edge_only(bm, edges=boundary_edges)
        new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, verts=new_verts, vec=Vector((0, 0, -COLLAR_DROP)))

    bm.normal_update()
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    # ── 7. Hard normals on collar: split edges at sharp angle ─────────────────
    # Re-detect zone after extrusion.  The newly extruded collar edges sit
    # at Z < ZONE_COLLAR_MAX and at Z < 0 (the drop).
    collar_sharp_edges = [
        e for e in bm.edges
        if any(v.co.z <= ZONE_COLLAR_MAX + 0.01 for v in e.verts)
        and e.calc_face_angle(0.0) > math.radians(30)
    ]
    if collar_sharp_edges:
        bmesh.ops.split_edges(bm, edges=collar_sharp_edges)

    # ── 8. Smooth shading on dome, flat on collar ─────────────────────────────
    for f in bm.faces:
        f.smooth = (f.calc_center_median().z > ZONE_COLLAR_MAX)

    # ── 9. Write to Object ────────────────────────────────────────────────────
    me = bpy.data.meshes.new("hf_smooth_pauldron")
    ob = bpy.data.objects.new("hf_smooth_pauldron", me)
    bpy.context.collection.objects.link(ob)
    bm.to_mesh(me)
    bm.free()
    me.update()

    mat = make_cel_material("hf_pauldron_cel", base_rgb=(0.22, 0.28, 0.55))
    ob.data.materials.append(mat)
    return ob


def export_glb(ob: bpy.types.Object, path: str) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,
        export_yup=True,
    )
    print(f"Exported → {path}")


def main() -> None:
    purge_scene()
    ob = build_pauldron()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(EXPORT_BLEND))
    export_glb(ob, bpy.path.abspath(EXPORT_GLB))
    print("Done: hf_smooth_pauldron.blend + .glb")


if __name__ == "__main__":
    main()
