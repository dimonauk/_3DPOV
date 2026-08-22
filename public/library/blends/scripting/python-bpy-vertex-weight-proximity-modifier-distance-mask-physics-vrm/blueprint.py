"""
VertexWeightProximityModifier — distance-driven weight mask, cloth pin & GLB export
Blender 5.1  ·  holoflow_webxr_exporter conventions (Y-up, apply transforms, Draco-6)

WHY THIS MODIFIER:
VertexWeightProximityModifier lives in Blender's "Modify" category — it writes
vertex-group weights rather than geometry. Modify modifiers evaluate BEFORE physics
and geometry modifiers in the stack. The cloth pin group therefore always reads fresh
proximity weights, making dynamic detachment possible: animate the target and the
pinned region tracks it without re-baking.

WHAT WE BUILD:
A soft lavender sash placed against a body-proxy icosphere. Vertices close to the
sphere surface get weight ≈ 1.0 (pinned by Cloth); vertices at MAX_DIST and beyond
get weight 0.0 (free to drape). The script also bakes the weights to a vertex-colour
layer so you can visualise them with Vertex Paint. A static GLB snapshot is exported
at the initial pose for WebXR review.
"""

import bpy
import bmesh
import math
import pathlib
from mathutils import Matrix, Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG        = "hf_vwprox_sash"
BODY_R      = 0.42          # body-proxy sphere radius (metres)
SASH_W      = 0.22          # sash half-width along X at body surface
SASH_H      = 0.56          # sash total height along Z
SEGS_X      = 10            # horizontal vertex density
SEGS_Z      = 24            # vertical vertex density
VG_NAME     = "prox_pin"    # vertex group read by Cloth as pin group
MIN_DIST    = 0.0           # distance → weight 1.0  (flush with body = fully pinned)
MAX_DIST    = 0.22          # distance → weight 0.0  (free-edge threshold)
FALLOFF     = "SMOOTH"      # C¹ ease-in/out; alternatives: LINEAR / SHARP / ROOT
OUT_DIR     = pathlib.Path("//public/library/glbs/scripting")
# ──────────────────────────────────────────────────────────────────────────────


def purge(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)


def make_body_proxy(name, radius):
    """Icosphere body proxy — renders hidden, used only as proximity target."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=radius)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.hide_render = True
    return ob


def make_sash(name, w, h, segs_x, segs_z, body_r):
    """
    Grid in XZ plane, positioned at x = body_r so vertices start flush with the
    sphere surface. segs_x / segs_z control how finely proximity weights are
    sampled — too few segs produces blocky pinning transitions.
    """
    verts, edges, faces = [], [], []
    for zi in range(segs_z):
        for xi in range(segs_x):
            x = body_r + (-w + 2 * w * xi / (segs_x - 1))
            z = h * zi / (segs_z - 1)
            verts.append(Vector((x, 0.0, z)))

    for zi in range(segs_z - 1):
        for xi in range(segs_x - 1):
            a = zi * segs_x + xi
            b = a + 1
            c = b + segs_x
            d = a + segs_x
            faces.append((a, b, c, d))

    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, edges, faces)
    me.validate()
    me.update()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    # Pre-create vertex group; proximity modifier writes into it by name
    ob.vertex_groups.new(name=VG_NAME)
    return ob


def add_proximity_modifier(sash_ob, body_ob):
    """
    VertexWeightProximityModifier API surface:

    proximity_mode   = 'GEOMETRY'   samples distance to nearest surface point.
                       'OBJECT'     samples distance to the target's origin only —
                                    useful for point-emitters but wrong for a body.

    proximity_geometry = {'FACE'}   measures against face planes (most accurate
                                    for closed watertight meshes). Add 'EDGE' or
                                    'VERTEX' for open meshes.

    min_dist / max_dist             world-space distances in metres.
                                    distance < min_dist  → weight clamped to 1.0
                                    distance > max_dist  → weight clamped to 0.0

    falloff_type = 'SMOOTH'         Hermite S-curve between the two clamp points.
                                    SHARP  = concave / rapid transition
                                    LINEAR = uniform ramp
                                    ROOT   = square-root, fast near min_dist

    invert_falloff = False          near body = high weight = pinned. If True,
                                    the sash would be free near the body (unusual
                                    but useful for masking displacement away from
                                    a contact region).

    normalize = True                re-normalises so the heaviest vertex = 1.0.
                                    Only affects the group if ALL vertices start
                                    beyond max_dist; leave True for safety.

    mask_vertex_group               secondary mask: final_weight = proximity × mask.
                                    Use to restrict pinning to a belt-strap region
                                    while leaving the rest of the sash fully free.
    """
    mod = sash_ob.modifiers.new("VWProx", "VERTEX_WEIGHT_PROXIMITY")
    mod.vertex_group       = VG_NAME
    mod.target             = body_ob
    mod.proximity_mode     = "GEOMETRY"
    mod.proximity_geometry = {"FACE"}
    mod.min_dist           = MIN_DIST
    mod.max_dist           = MAX_DIST
    mod.falloff_type       = FALLOFF
    mod.invert_falloff     = False
    mod.normalize          = True
    return mod


def add_cloth_modifier(sash_ob):
    """
    ClothModifier reads VG_NAME as pin group (settings.vertex_group_mass).
    use_pin_cloth must be True for the pin group to activate.
    pin_stiffness = 1.0 makes pinned vertices truly rigid.
    mass / tension / bending tuned for lightweight silk-weight sash fabric.
    """
    cloth = sash_ob.modifiers.new("Cloth", "CLOTH")
    s = cloth.settings
    s.quality               = 5
    s.mass                  = 0.30
    s.tension_stiffness     = 15.0
    s.compression_stiffness = 8.0
    s.bending_stiffness     = 0.5
    s.use_pin_cloth         = True
    s.vertex_group_mass     = VG_NAME
    s.pin_stiffness         = 1.0
    return cloth


def bake_weights_to_vertex_colour(sash_ob):
    """
    Read evaluated proximity weights from the depsgraph and bake them to a
    vertex-colour layer for visual debugging in Viewport Shading > Vertex Paint.
    Works WITHOUT running cloth: proximity modifier alone is enough.
    """
    dg = bpy.context.evaluated_depsgraph_get()
    ob_eval = sash_ob.evaluated_get(dg)
    me_eval = ob_eval.data

    vg_idx = ob_eval.vertex_groups[VG_NAME].index
    weights = [0.0] * len(me_eval.vertices)
    for v in me_eval.vertices:
        for g in v.groups:
            if g.group == vg_idx:
                weights[v.index] = g.weight
                break

    # Vertex colour layer (colour attribute, corner domain)
    if "debug_prox" not in sash_ob.data.color_attributes:
        sash_ob.data.color_attributes.new(
            name="debug_prox", type="FLOAT_COLOR", domain="CORNER"
        )
    attr = sash_ob.data.color_attributes["debug_prox"]
    me_src = sash_ob.data
    for loop in me_src.loops:
        w = weights[loop.vertex_index]
        attr.data[loop.index].color = (w, 1.0 - w, 0.3, 1.0)  # green→red


def export_glb(sash_ob, body_ob, out_dir, slug):
    """
    Export a STATIC snapshot (no cloth bake required) by hiding sim objects and
    exporting the sash in its initial rest position with modifiers applied.
    For a post-simulation snapshot, run bpy.ops.ptcache.bake_all(bake=True)
    in the Script Editor BEFORE calling this function.
    """
    body_ob.hide_render = True
    sash_ob.hide_render = False

    mat = bpy.data.materials.new(slug + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out_n = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.65, 0.45, 0.85, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.80
    nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"])
    if not sash_ob.data.materials:
        sash_ob.data.materials.append(mat)
    else:
        sash_ob.data.materials[0] = mat

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
    purge(["HF_BodyProxy", "HF_Sash", SLUG])

    body = make_body_proxy("HF_BodyProxy", BODY_R)
    sash = make_sash("HF_Sash", SASH_W, SASH_H, SEGS_X, SEGS_Z, BODY_R)

    add_proximity_modifier(sash, body)
    add_cloth_modifier(sash)

    # Force evaluate so proximity weights are computed before we read them back
    bpy.context.view_layer.update()
    bake_weights_to_vertex_colour(sash)

    export_glb(sash, body, OUT_DIR, SLUG)


if __name__ == "__main__":
    main()
