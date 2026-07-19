"""
Holoflow Studio — Blender 5.1
bmesh.ops.extrude_discrete_faces
Per-Face Independent Extrusion: Spike Array & Crystal Urchin for WebXR

Technique:
  bmesh.ops.extrude_discrete_faces extrudes every selected face as its own
  independent solid — each face gets a private set of side-wall quads and a
  cap face with no shared verts between adjacent spikes.

  Compare with extrude_face_region: that op treats the whole selection as one
  region and merges shared boundary edges between adjacent selected faces before
  extruding, producing a single connected shell. discrete_faces never merges
  — it is the correct choice whenever you need separate, individually movable
  geometry per face (spikes, studs, panel bosses, tentacles).

  Pipeline here:
    icosphere (subdiv=2, 80 tri faces)
    → extrude_discrete_faces → 80 cap tri-faces + 240 side quads
    → per-cap translate along cap normal (spike height)
    → per-cap scale toward cap centroid (spike taper)
    → sharp-edge tag (flat-shaded crystal facets)
    → export GLB with Draco

Output: hf_spike_urchin.glb
"""

import bpy
import bmesh
import math
from mathutils import Matrix, Vector

# ─── PARAMETERS ──────────────────────────────────────────────────────────────
SPHERE_RADIUS   = 1.0    # base icosphere radius (metres)
ICO_SUBDIVS     = 2      # 1→20 faces · 2→80 faces · 3→320 faces
SPIKE_HEIGHT    = 0.30   # extrusion depth along face normal
SPIKE_TIP_SCALE = 0.06   # cap scale factor (0=point · 1=flat top)
EXPORT_PATH     = "//hf_spike_urchin.glb"
# ─────────────────────────────────────────────────────────────────────────────


def purge_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for d in [bpy.data.meshes, bpy.data.materials,
              bpy.data.objects, bpy.data.cameras, bpy.data.lights]:
        for item in list(d):
            d.remove(item, do_unlink=True)


def build_spike_urchin() -> bpy.types.Object:
    """
    Build the spike urchin via bmesh.

    Step 1 — icosphere:  evenly distributed triangular faces; all the same
    size and orientation relative to the sphere centre.  A UV sphere is NOT
    used here because its polar caps have smaller faces than the equatorial
    band, which would cause inconsistent spike heights even with a uniform
    SPIKE_HEIGHT constant.

    Step 2 — extrude_discrete_faces:  each of the 80 faces gets its own set
    of side walls and a cap face.  result['faces'] holds the 80 cap faces.
    The originals are consumed by the extrusion; the base ring edges remain
    on the urchin surface.

    Step 3 — per-cap translate:  the cap verts move along the cap face's
    current normal.  We read the normal BEFORE the translate because
    bm.normal_update() after a translate invalidates it.  The normal is
    already correct after extrude_discrete_faces — no explicit update needed
    for the first access.

    Step 4 — per-cap scale:  shrink each cap toward its centroid to taper the
    spike to a pyramidal point.  SPIKE_TIP_SCALE=0.06 leaves a tiny triangle
    tip (~3 mm) that looks sharp without degenerate zero-area geometry, which
    the GLB exporter would silently omit.

    Step 5 — sharp edges + flat faces:  all edges and faces are tagged as
    flat/sharp before writing back to the mesh.  In Blender 5.1 this writes
    the 'sharp_edge' BOOLEAN attribute on the EDGE domain and disables smooth
    shading per face — the glTF exporter turns both into split per-corner
    normals in the GLB NORMAL accessor.
    """
    bm = bmesh.new()

    # ── icosphere ─────────────────────────────────────────────────────────
    bmesh.ops.create_icosphere(
        bm,
        subdivisions = ICO_SUBDIVS,
        radius       = SPHERE_RADIUS,
        calc_uvs     = False,
    )

    # ── extrude each face independently ───────────────────────────────────
    bm.faces.ensure_lookup_table()
    all_faces = list(bm.faces)

    result = bmesh.ops.extrude_discrete_faces(
        bm,
        faces               = all_faces,
        use_select_history  = False,
    )
    cap_faces = result['faces']   # one BMFace per original face

    # ── translate + taper caps ────────────────────────────────────────────
    for cap in cap_faces:
        # Read normal before mutating verts (avoids stale reference after
        # bm.normal_update).  Cap normals point away from the sphere centre
        # because the icosphere was built with outward-facing normals.
        normal = cap.normal.copy()
        verts  = list(cap.verts)

        # Translate cap along its face normal
        bmesh.ops.translate(
            bm,
            verts = verts,
            vec   = normal * SPIKE_HEIGHT,
        )

        # Compute centroid AFTER translate (the cap has moved)
        centroid = Vector((
            sum(v.co.x for v in verts) / len(verts),
            sum(v.co.y for v in verts) / len(verts),
            sum(v.co.z for v in verts) / len(verts),
        ))

        # Scale cap verts toward centroid → pyramidal taper
        # Matrix.Translation(centroid) is the pivot; we invert to move into
        # centroid-local space, apply uniform scale, then move back.
        pivot = Matrix.Translation(centroid)
        bmesh.ops.scale(
            bm,
            verts = verts,
            vec   = (SPIKE_TIP_SCALE, SPIKE_TIP_SCALE, SPIKE_TIP_SCALE),
            space = pivot.inverted(),
        )

    # ── flat shading / sharp edges ─────────────────────────────────────────
    # All edges sharp — every triangle reads as a discrete flat facet in the
    # exported GLB.  This is intentional: the urchin is a crystal/gemstone
    # prop, not a smooth organic mesh.
    bm.normal_update()
    for e in bm.edges:
        e.smooth = False
    for f in bm.faces:
        f.smooth = False

    # ── write to object ────────────────────────────────────────────────────
    mesh = bpy.data.meshes.new("hf_spike_urchin")
    obj  = bpy.data.objects.new("hf_spike_urchin", mesh)
    bpy.context.collection.objects.link(obj)
    bm.to_mesh(mesh)
    bm.free()
    return obj


def add_material(obj: bpy.types.Object) -> None:
    """
    Deep-violet emission material — flat cel-shade suitable for WebXR Eevee.
    Emission rather than Principled BSDF avoids view-dependent shading that
    would compete with the geometric silhouette of the spikes.
    """
    mat  = bpy.data.materials.new("hf_urchin_crystal")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()

    out  = tree.nodes.new('ShaderNodeOutputMaterial')
    emit = tree.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value    = (0.08, 0.03, 0.55, 1.0)
    emit.inputs['Strength'].default_value = 1.2

    tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    out.location  = (300, 0)
    emit.location = (0,   0)

    obj.data.materials.append(mat)


def export_glb(path: str) -> None:
    bpy.ops.export_scene.gltf(
        filepath                                = path,
        export_format                           = 'GLB',
        export_apply                            = True,
        use_selection                           = False,
        export_draco_mesh_compression_enable    = True,
        export_draco_mesh_compression_level     = 6,
        export_normals                          = True,
        export_colors                           = False,
        export_yup                              = True,
    )


def main() -> None:
    purge_scene()
    obj = build_spike_urchin()
    add_material(obj)
    export_glb(EXPORT_PATH)
    tri_count = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    print(f"[holoflow] hf_spike_urchin — {len(obj.data.vertices)} verts "
          f"· {len(obj.data.polygons)} faces · ~{tri_count} tris → {EXPORT_PATH}")


if __name__ == "__main__":
    main()
