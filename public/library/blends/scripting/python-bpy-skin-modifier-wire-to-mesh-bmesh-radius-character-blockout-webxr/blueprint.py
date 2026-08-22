"""
SkinModifier — wire-to-mesh conversion via bmesh skin vertex layer
Blender 5.1  ·  holoflow_webxr_exporter conventions (Y-up, apply transforms, Draco-6)

WHY THIS MODIFIER:
SkinModifier converts a mesh of vertices and edges — no faces — into a closed skin
surface by wrapping an organic tube around each edge, scaled by per-vertex radii
stored in a custom BMesh vertex layer. It sits in Blender's Generate modifier
category. The input wire is fully non-destructive: the mesh data holds only verts and
edges; the skin surface can be regenerated at any time by keeping the modifier live.

Stacking SubsurfModifier above it rounds the tube junctions. Keeping subdivision
low (levels=1) yields a faceted blockout appropriate for cel-shade work without
the memory overhead of a high-resolution base mesh.

WHAT WE BUILD:
A stylised humanoid upper-body silhouette: spine chain (pelvis → belly → chest →
neck → head) and a bilateral shoulder cross-bar with upper-arm stubs. Per-vertex
X/Y radii taper the torso shape. The modifier stack is applied at GLB export to
yield a closed-shell Draco-compressed file for WebXR review.
"""

import bpy
import bmesh
import pathlib
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG       = "hf_skin_blockout"
OUT_DIR    = pathlib.Path("//public/library/glbs/scripting")
MAT_COLOUR = (0.72, 0.42, 0.62, 1.0)   # muted VRM violet

# Per-vertex skin radii: (local-X, local-Y) in metres.
# Asymmetric X/Y produces a flattened/squashed cross-section on that vertex's tubes.
R_PELVIS   = (0.22, 0.22)
R_BELLY    = (0.20, 0.16)
R_CHEST    = (0.25, 0.18)
R_NECK     = (0.07, 0.07)
R_HEAD     = (0.14, 0.14)
R_SHOULDER = (0.09, 0.09)
R_ELBOW    = (0.07, 0.07)

# SubsurfModifier levels: 0 = raw skin quads, 1 = smooth junctions, 2 = high res
SUBSURF_LEVELS = 1
# ──────────────────────────────────────────────────────────────────────────────


def purge(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)
    mat = bpy.data.materials.get(SLUG + "_mat")
    if mat:
        bpy.data.materials.remove(mat)


def build_wire_and_skin(name):
    """
    Create a wire mesh (vertices + edges, zero faces) and write skin radii
    into the BMesh skin vertex layer before committing to a Blender Mesh.

    bm.verts.layers.skin.verify():
        Returns the existing skin layer or creates it if absent. MUST be called
        while the BMesh is live — committing bm.to_mesh() first drops the layer.
        Each vertex slot holds a BMVertSkin with three attributes:
            .radius    = (float, float)  local-X and local-Y tube radii
            .use_root  = bool            marks a root joint; at least ONE per
                                         connected component is required or
                                         SkinModifier generates open end-caps
            .use_loose = bool            disconnects vertex from the tree (rarely used)

    Radius (rx, ry) are in LOCAL SPACE before object scale is applied.
    Applying object scale after the fact doubles (or halves) world-space diameter
    silently. Apply transforms before export: bpy.ops.object.transform_apply(scale=True).
    """
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # ── Spine chain (+Z is up in Blender's default coordinate system) ─────────
    v_pelvis = bm.verts.new(Vector((0.00,  0.00, 0.00)))
    v_belly  = bm.verts.new(Vector((0.00,  0.00, 0.30)))
    v_chest  = bm.verts.new(Vector((0.00,  0.00, 0.60)))
    v_neck   = bm.verts.new(Vector((0.00,  0.00, 0.86)))
    v_head   = bm.verts.new(Vector((0.00,  0.00, 1.10)))

    # Shoulder cross-bar — diverges from chest vertex, not neck
    # (attaching at neck would generate a tight junction ring at the skull base)
    v_sL = bm.verts.new(Vector((-0.35,  0.00, 0.62)))
    v_sR = bm.verts.new(Vector(( 0.35,  0.00, 0.62)))

    # Upper-arm stubs — slight +Y lean for a natural arm-at-rest angle
    v_eL = bm.verts.new(Vector((-0.55,  0.04, 0.38)))
    v_eR = bm.verts.new(Vector(( 0.55,  0.04, 0.38)))

    # ── Edge topology (no faces needed by SkinModifier) ───────────────────────
    bm.edges.new((v_pelvis, v_belly))
    bm.edges.new((v_belly,  v_chest))
    bm.edges.new((v_chest,  v_neck))
    bm.edges.new((v_neck,   v_head))
    bm.edges.new((v_chest,  v_sL))   # shoulder arm branches from chest
    bm.edges.new((v_chest,  v_sR))
    bm.edges.new((v_sL,     v_eL))
    bm.edges.new((v_sR,     v_eR))

    # ── Skin vertex layer ─────────────────────────────────────────────────────
    sl = bm.verts.layers.skin.verify()

    # Pelvis marked use_root: closes the bottom of the trunk so the mesh is
    # watertight. Without a root SkinModifier opens caps at both ends of the
    # spine and WebXR back-face culling reveals the seam interior.
    v_pelvis[sl].use_root = True
    v_pelvis[sl].radius   = R_PELVIS

    v_belly [sl].radius   = R_BELLY
    v_chest [sl].radius   = R_CHEST
    v_neck  [sl].radius   = R_NECK
    v_head  [sl].radius   = R_HEAD
    v_sL    [sl].radius   = R_SHOULDER
    v_sR    [sl].radius   = R_SHOULDER
    v_eL    [sl].radius   = R_ELBOW
    v_eR    [sl].radius   = R_ELBOW

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    return obj


def add_modifier_stack(obj):
    """
    SkinModifier parameters:
        branch_smoothing = 0.4    blends the junction quad ring where branches meet,
                                  interpolating radius between parent and child edges.
                                  0.0 = sharp junctions; 1.0 = fully blended
                                  (over-inflates the shoulder cross-section on this
                                  topology — keep at ≤0.5).
        use_smooth_shade = False  flat-shading on generated quads; keeps the cel-shade
                                  faceted look. True passes smooth-per-vertex normals
                                  for a rounded appearance without Subsurf.
        use_x_mirror = False      would mirror skin-vertex data across X=0 in Edit Mode.
                                  Not applicable in this headless script where both
                                  sides of the shoulder bar are defined explicitly.

    SubsurfModifier stacks immediately above Skin in the modifier stack
    (listed second → evaluated after Skin in the Generate pass):
        levels=1 rounds the shoulder junction artefacts without inflating proportions.
        subdivision_type=CATMULL_CLARK — the standard smooth sub-d.
        SIMPLE (interpolating, no rounding) is useful only when you need to displace
        the subdivided surface without changing its silhouette.
    """
    skin_mod = obj.modifiers.new("Skin", "SKIN")
    skin_mod.branch_smoothing = 0.4
    skin_mod.use_smooth_shade = False
    skin_mod.use_x_mirror     = False

    sub_mod = obj.modifiers.new("Subsurf", "SUBSURF")
    sub_mod.levels           = SUBSURF_LEVELS
    sub_mod.render_levels    = SUBSURF_LEVELS
    sub_mod.subdivision_type = "CATMULL_CLARK"

    return skin_mod, sub_mod


def assign_material(obj):
    mat = bpy.data.materials.new(SLUG + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out_n = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = MAT_COLOUR
    bsdf.inputs["Roughness"].default_value  = 0.75
    nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"])
    obj.data.materials.append(mat)


def export_glb(obj, out_dir, slug):
    """
    export_apply=True collapses Skin + Subsurf into static closed-shell geometry.
    The underlying wire (verts + edges, no faces) is not included in the GLB;
    only the evaluated surface survives. This is the expected output for WebXR:
    a lightweight quad-dominant closed mesh for real-time rendering.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    path = str(out_dir / (slug + ".glb"))
    bpy.ops.export_scene.gltf(
        filepath      = path,
        export_format = "GLB",
        use_selection = False,
        export_apply  = True,
        export_yup    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )
    print(f"[holoflow] exported → {path}")
    return path


def main():
    purge(["HF_SkinBlockout"])

    obj = build_wire_and_skin("HF_SkinBlockout")
    add_modifier_stack(obj)
    assign_material(obj)

    bpy.context.view_layer.update()
    export_glb(obj, OUT_DIR, SLUG)


if __name__ == "__main__":
    main()
