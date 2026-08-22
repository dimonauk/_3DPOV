"""
VertexWeightEditModifier + VertexWeightMixModifier
— Custom S-Curve Weight Remap & Per-Vertex Group Blend for VRM Cloth Pinning
Blender 5.1  ·  holoflow_webxr_exporter conventions (Y-up, apply, Draco-6)

WHY THESE TWO MODIFIERS BELONG IN A PIPELINE:
Raw proximity or procedural weights are almost always linear — a gradual ramp
that leaves cloth half-pinned in the middle. VertexWeightEditModifier remaps
that ramp through a custom CurveMapping, sharpening the S-shape so you get a
hard "fully pinned" zone and a hard "fully free" zone with only a thin blend
band between them. VertexWeightMixModifier then multiplies the remapped values
with a hand-painted mask, combining automated geometry-driven weights with art
direction in a single, stackable, non-destructive step.

Both modifiers write vertex-group data rather than geometry — they sit in
Blender's 'Modify' category, evaluate before Deform/Generate, and update live
as their inputs change.

WHAT WE BUILD:
A faceted VRM shoulder pauldron. Three vertex groups are involved:
  [shoulder_prox]  — height-based gradient (0 at base, 1 at shoulder cap)
  [cloth_pin]      — a narrow stripe painted manually around the shoulder rim
  [cloth_result]   — VWMix MULTIPLY output; this is the Cloth pin group

VertexWeightEditModifier remaps [shoulder_prox] through a steep S-curve.
VertexWeightMixModifier MULTIPLY-blends the remapped [shoulder_prox] with
[cloth_pin] into [cloth_result]. Cloth modifier reads [cloth_result].
A debug vertex-colour layer visualises [cloth_result] without running physics.
"""

import bpy
import bmesh
import math
import pathlib
from mathutils import Vector, Matrix

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG         = "hf_vwedit_pauldron"
PLATE_R      = 0.26          # shoulder plate half-width radius (m)
PLATE_H      = 0.28          # plate height (m)
PLATE_VERTS  = 8             # octagonal cross-section
SHELL_T      = 0.012         # plate wall thickness (for Solidify later)
RIM_FRAC     = 0.15          # fraction of plate height that is the rim stripe
VG_PROX      = "shoulder_prox"
VG_PIN       = "cloth_pin"
VG_RESULT    = "cloth_result"
OUT_DIR      = pathlib.Path("//public/library/glbs/scripting")
# ──────────────────────────────────────────────────────────────────────────────


def purge(*names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)


def build_pauldron(name: str) -> bpy.types.Object:
    """
    Octagonal shell: top cap + cylindrical wall. Low-poly to keep the vertex
    count readable for weight inspection. The outer-ring cap edge sits at Z=PLATE_H
    and is the 'shoulder' region; the bottom ring at Z=0 is the free-edge.
    """
    bm = bmesh.new()
    angle_step = 2 * math.pi / PLATE_VERTS

    # Top rim ring  Z = PLATE_H
    top_verts = [
        bm.verts.new(Vector((
            PLATE_R * math.cos(i * angle_step),
            PLATE_R * math.sin(i * angle_step),
            PLATE_H,
        )))
        for i in range(PLATE_VERTS)
    ]
    # Bottom rim ring  Z = 0
    bot_verts = [
        bm.verts.new(Vector((
            PLATE_R * math.cos(i * angle_step),
            PLATE_R * math.sin(i * angle_step),
            0.0,
        )))
        for i in range(PLATE_VERTS)
    ]
    # Center cap vertex  Z = PLATE_H + dome offset
    cap = bm.verts.new(Vector((0, 0, PLATE_H + PLATE_R * 0.25)))

    bm.verts.ensure_lookup_table()

    # Side quads — cylindrical wall
    for i in range(PLATE_VERTS):
        j = (i + 1) % PLATE_VERTS
        bm.faces.new([top_verts[i], top_verts[j], bot_verts[j], bot_verts[i]])

    # Top triangulated cap (dome facets)
    for i in range(PLATE_VERTS):
        j = (i + 1) % PLATE_VERTS
        bm.faces.new([cap, top_verts[j], top_verts[i]])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def assign_height_group(ob: bpy.types.Object) -> None:
    """
    [shoulder_prox] — weight proportional to vertex Z height, 0 at base, 1 at cap.
    Simulates what a VertexWeightProximityModifier (target = shoulder bone head)
    would produce on a real VRM rig, without needing a target object.
    """
    vg = ob.vertex_groups.new(name=VG_PROX)
    me = ob.data
    me.calc_normals()
    z_min = min(v.co.z for v in me.vertices)
    z_max = max(v.co.z for v in me.vertices)
    z_range = z_max - z_min or 1.0
    for v in me.vertices:
        w = (v.co.z - z_min) / z_range
        vg.add([v.index], w, 'REPLACE')


def assign_pin_stripe(ob: bpy.types.Object) -> None:
    """
    [cloth_pin] — a narrow stripe at the top of the plate (the shoulder
    contact zone). Vertices within RIM_FRAC of the maximum height get weight
    1.0; everything else gets 0.0. This represents art-directed pinning: only
    the actual shoulder contact edge should resist cloth movement, not the
    whole upper half.
    """
    vg = ob.vertex_groups.new(name=VG_PIN)
    me = ob.data
    z_min = min(v.co.z for v in me.vertices)
    z_max = max(v.co.z for v in me.vertices)
    z_range = z_max - z_min or 1.0
    threshold = z_max - z_range * RIM_FRAC
    for v in me.vertices:
        w = 1.0 if v.co.z >= threshold else 0.0
        vg.add([v.index], w, 'REPLACE')

    # Pre-create result group so VertexWeightMix can reference it by name
    ob.vertex_groups.new(name=VG_RESULT)


def add_vwedit(ob: bpy.types.Object) -> bpy.types.VertexWeightEditModifier:
    """
    VertexWeightEditModifier — in-place remaps [shoulder_prox] through a
    custom S-curve. The default linear ramp leaves weights gradual; the
    S-curve snaps low weights toward 0 and high weights toward 1.

    KEY API NOTES:
      falloff_type = 'CURVE'
        Activates the mod.map_curve CurveMapping. Other built-in options
        ('SMOOTH', 'SHARP', 'ROOT', 'SPHERE') apply a fixed mathematical
        shape; only 'CURVE' exposes the per-handle control points.

      map_curve.curves[0]
        The weight modifier uses only curves[0]. Other channel indices
        (1, 2, 3) are unused unless you attach a colour texture.

      S-curve control points (Blender normalises input 0→1, output 0→1):
        (0.00, 0.00)  lower anchor — zero stays zero
        (0.30, 0.05)  pulls the lower ramp steeply toward zero
        (0.70, 0.95)  pulls the upper ramp steeply toward one
        (1.00, 1.00)  upper anchor — one stays one
        All handles set to AUTO_CLAMPED to prevent overshooting.

      add_threshold / remove_threshold
        After the curve remap, weights below remove_threshold are deleted
        from the group entirely; weights below add_threshold are not added.
        0.01 prevents near-zero weights causing phantom cloth attachment.

      use_global_normalization = True
        Re-normalises so the heaviest resulting vertex reaches exactly 1.0.
        Leave False when multiple vertex groups must not shift relative to
        each other; set True when you want guaranteed full pinning.
    """
    mod = ob.modifiers.new("VWEdit", "VERTEX_WEIGHT_EDIT")
    mod.vertex_group          = VG_PROX
    mod.default_weight        = 0.0
    mod.falloff_type          = 'CURVE'
    mod.invert_falloff        = False
    mod.use_global_normalization = False
    mod.add_threshold         = 0.01
    mod.remove_threshold      = 0.01

    # ── S-curve setup ─────────────────────────────────────────────────────────
    cm = mod.map_curve           # CurveMapping
    c  = cm.curves[0]            # CurveMap (the single weight channel)
    pts = c.points

    # Default curve has 2 points at (0,0) and (1,1); reposition them first
    pts[0].location = Vector((0.0, 0.0))
    pts[1].location = Vector((1.0, 1.0))
    pts[0].handle_type = 'AUTO_CLAMPED'
    pts[1].handle_type = 'AUTO_CLAMPED'

    # Two inner S-curve inflection points
    lo = pts.new(0.30, 0.05)
    lo.handle_type = 'AUTO_CLAMPED'
    hi = pts.new(0.70, 0.95)
    hi.handle_type = 'AUTO_CLAMPED'

    cm.update()   # must call after any point changes or handles will be stale
    return mod


def add_vwmix(ob: bpy.types.Object) -> bpy.types.VertexWeightMixModifier:
    """
    VertexWeightMixModifier — blends two vertex groups and writes the result
    back into vertex_group_a. Here:
      vertex_group_a = VG_PROX  (the S-curve-remapped shoulder weights)
      vertex_group_b = VG_PIN   (the hand-painted rim stripe)
      Result written to: a THIRD group via 'result_vertex_group'

    KEY API NOTES:
      mix_mode = 'MULTIPLY'
        per-vertex: result = weight_a × weight_b.
        Only vertices that are BOTH highly weighted in the remapped proximity
        group AND in the pin stripe reach weight ≈ 1.0. Vertices outside the
        stripe get multiplied toward 0 even if proximity is high.
        Other useful modes:
          MINIMUM — same conservative result, handles edge cases differently
          REPLACE  — group_b simply overwrites group_a (ignores group_a values)
          ADD      — accumulates; can exceed 1.0 before normalisation
          AVERAGE  — softens; (a+b)/2 splits the difference

      mix_set = 'OR'
        Operate on every vertex that has weight in group_a OR group_b (union).
        Use 'AND' to restrict to vertices present in both groups only — useful
        when groups may not overlap and you want to avoid writing zeroes.
        'ALL' writes to every vertex, assigning default_weight for absent ones.

      result_vertex_group
        Names the output group explicitly. Without this the modifier OVERWRITES
        vertex_group_a in-place. Setting it to VG_RESULT leaves VG_PROX intact
        for downstream inspection, which is important for debugging.
    """
    mod = ob.modifiers.new("VWMix", "VERTEX_WEIGHT_MIX")
    mod.vertex_group_a       = VG_PROX
    mod.vertex_group_b       = VG_PIN
    mod.default_weight_a     = 0.0
    mod.default_weight_b     = 0.0
    mod.mix_mode             = 'MULTIPLY'
    mod.mix_set              = 'OR'
    mod.result_vertex_group  = VG_RESULT   # writes into a separate group
    return mod


def bake_result_to_vcol(ob: bpy.types.Object) -> None:
    """Read evaluated [cloth_result] weights and encode as a green→red vertex colour."""
    dg = bpy.context.evaluated_depsgraph_get()
    ob_ev = ob.evaluated_get(dg)
    me_ev = ob_ev.data
    vg_idx = ob_ev.vertex_groups[VG_RESULT].index
    weights = {}
    for v in me_ev.vertices:
        for g in v.groups:
            if g.group == vg_idx:
                weights[v.index] = g.weight
                break
        weights.setdefault(v.index, 0.0)

    if "debug_result" not in ob.data.color_attributes:
        ob.data.color_attributes.new("debug_result", "FLOAT_COLOR", "CORNER")
    attr = ob.data.color_attributes["debug_result"]
    for loop in ob.data.loops:
        w = weights.get(loop.vertex_index, 0.0)
        attr.data[loop.index].color = (w, 1.0 - w, 0.2, 1.0)


def apply_and_export(ob: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(SLUG + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out_n = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf  = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.2, 0.55, 0.85, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.65
    bsdf.inputs["Metallic"].default_value   = 0.4
    nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"])
    if not ob.data.materials:
        ob.data.materials.append(mat)
    else:
        ob.data.materials[0] = mat

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = str(OUT_DIR / (SLUG + ".glb"))
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath    = path,
        export_format = "GLB",
        use_selection = True,
        export_apply  = True,
        export_yup    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
    )
    print(f"[holoflow] → {path}")


def main():
    purge("HF_Pauldron", SLUG)
    ob = build_pauldron("HF_Pauldron")
    ob.name = SLUG

    assign_height_group(ob)
    assign_pin_stripe(ob)
    add_vwedit(ob)
    add_vwmix(ob)
    bpy.context.view_layer.update()
    bake_result_to_vcol(ob)
    apply_and_export(ob)


if __name__ == "__main__":
    main()
