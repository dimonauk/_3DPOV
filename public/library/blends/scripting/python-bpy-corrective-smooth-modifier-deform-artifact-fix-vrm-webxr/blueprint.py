"""
CorrectiveSmoothModifier — Laplacian deformation-artefact correction for VRM character rigs
Blender 5.1  ·  holoflow_webxr_exporter conventions (Y-up, apply transforms, Draco-6)

WHY THIS MODIFIER:
When an armature bends a mesh at a joint (elbow, knee, shoulder), linear blend skinning
produces a volume-loss crease and, on twist, a "candy-wrapper" collapse. CorrectiveSmoothModifier
sits AFTER ArmatureModifier in the stack and applies a Laplacian smooth to the REST POSE
geometry, then computes a delta between the smoothed rest and the original rest:

    delta  =  smooth(rest)  −  rest
    output =  deformed  +  delta

At joint creases the rest-smooth inflates the tube slightly (delta > 0). That inflation
transfers to the deformed output, counteracting the volume-loss — without requiring a
corrective shape key per posed angle.

smooth_type = LENGTH_WEIGHTED:
    Each Laplacian iteration distributes smoothing force proportional to edge length.
    Dense loops at joint creases (shorter edges) receive less force, preserving
    local curvature details. SIMPLE mode ignores edge length and over-smooths dense
    topology near the joint.

rest_source = ORCO:
    Uses the mesh's original coordinate positions (undeformed geometry) as the rest
    state. Suitable for headless scripting — no interactive bind step required.
    Use BIND when you need to freeze a specific posed state as the rest reference
    (requires bpy.ops.object.correctivesmooth_bind in an active viewport context).

use_pin_boundary = True:
    Vertices on the mesh boundary (open edges) are excluded from the smooth. For a
    capped cylinder this matters only at the endcap rings; setting True prevents
    shoulder and wrist rings from drifting toward the tube interior during correction.

WHAT WE BUILD:
A stylised arm tube (shoulder cap → elbow crease → wrist cap) weighted to a 2-bone
armature (UpperArm + Forearm). The elbow is posed to 90° to demonstrate the crease
artefact; CorrectiveSmoothModifier fills in the volume loss. Exported as a GLB with
the full modifier stack applied for WebXR review.
"""

import bpy
import bmesh
import pathlib
import math
from mathutils import Vector

# ── PARAMETERS ────────────────────────────────────────────────────────────────
SLUG    = "hf_corrective_smooth_arm"
OUT_DIR = pathlib.Path("//public/library/glbs/scripting")

ARM_LENGTH    = 1.2      # metres, shoulder to wrist
ARM_SEGMENTS  = 20       # cross-section loop count along the arm
ARM_SIDES     = 12       # polygon sides per cross-section (dodecagonal)

R_SHOULDER    = 0.12     # tube radius at shoulder end
R_ELBOW       = 0.09     # narrowest cross-section at joint
R_WRIST       = 0.060    # radius at wrist

ELBOW_BEND_DEG  = 90.0   # demo pose: forearm angled 90° off upper arm

CS_SMOOTH_TYPE  = "LENGTH_WEIGHTED"
CS_REST_SOURCE  = "ORCO"   # no bind step needed
CS_FACTOR       = 1.0      # 1.0 = full correction; 0.5 = half-strength blend
CS_ITERATIONS   = 3        # iterations ≥ 4 starts to over-inflate; 3 is the sweet spot

MAT_COLOUR = (0.78, 0.60, 0.50, 1.0)   # warm VRM-character tan
# ──────────────────────────────────────────────────────────────────────────────


def purge(names: list[str]) -> None:
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)
        arm = bpy.data.armatures.get(n + "_rig")
        if arm:
            bpy.data.armatures.remove(arm)
    for mat_name in (SLUG + "_mat",):
        m = bpy.data.materials.get(mat_name)
        if m:
            bpy.data.materials.remove(m)


def build_arm_mesh(name: str):
    """
    Construct a tapered cylindrical arm along the Y axis.
    The Y axis is used because VRM armature bones conventionally point in their local
    +Y direction, so aligning the mesh to Y yields consistent tangent frames at export.

    Radius tapers in two linear segments:
        shoulder  (y=0)                → elbow (y=ARM_LENGTH * 0.5)  : R_SHOULDER → R_ELBOW
        elbow     (y=ARM_LENGTH * 0.5) → wrist (y=ARM_LENGTH)        : R_ELBOW    → R_WRIST

    The elbow is the narrowest section; CorrectiveSmoothModifier's corrective delta
    is largest here because the rest-smooth tries to inflate the pinched tube, and
    that inflation is exactly what counteracts the armature's volume-loss deformation.

    Returns (mesh_obj, rings) where rings is a list of ARM_SEGMENTS lists of BMVerts
    — used downstream by vertex-group assignment.
    """
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    rings = []

    for i in range(ARM_SEGMENTS):
        y = ARM_LENGTH * i / (ARM_SEGMENTS - 1)

        # Piecewise linear radius taper
        if y <= ARM_LENGTH * 0.5:
            frac = y / (ARM_LENGTH * 0.5)
            r = R_SHOULDER + (R_ELBOW - R_SHOULDER) * frac
        else:
            frac = (y - ARM_LENGTH * 0.5) / (ARM_LENGTH * 0.5)
            r = R_ELBOW + (R_WRIST - R_ELBOW) * frac

        ring = []
        for j in range(ARM_SIDES):
            angle = 2.0 * math.pi * j / ARM_SIDES
            v = bm.verts.new(Vector((r * math.cos(angle), y, r * math.sin(angle))))
            ring.append(v)
        rings.append(ring)

    # Lateral quad faces between consecutive rings
    for i in range(ARM_SEGMENTS - 1):
        r0, r1 = rings[i], rings[i + 1]
        for j in range(ARM_SIDES):
            nj = (j + 1) % ARM_SIDES
            bm.faces.new([r0[j], r0[nj], r1[nj], r1[j]])

    # End caps (n-gon per end)
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[-1])))  # reversed for consistent outward winding

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    return obj, rings


def build_armature(name: str):
    """
    Two-bone armature: UpperArm (y: 0 → ARM_LENGTH/2) and Forearm (y: ARM_LENGTH/2 → ARM_LENGTH).
    Forearm is parented to UpperArm; no roll needed for a Y-axis arm.

    We enter EDIT mode to add bones, then return to OBJECT mode.
    In headless Blender the mode_set operator runs correctly if the armature object
    is active in the view layer.
    """
    arm_data = bpy.data.armatures.new(name + "_rig")
    arm_obj  = bpy.data.objects.new(name, arm_data)
    bpy.context.collection.objects.link(arm_obj)

    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")

    eb = arm_data.edit_bones

    ub = eb.new("UpperArm")
    ub.head = Vector((0, 0, 0))
    ub.tail = Vector((0, ARM_LENGTH * 0.5, 0))

    fb = eb.new("Forearm")
    fb.head   = Vector((0, ARM_LENGTH * 0.5, 0))
    fb.tail   = Vector((0, ARM_LENGTH, 0))
    fb.parent = ub              # Forearm rotates relative to UpperArm

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def assign_vertex_groups(mesh_obj, rings: list[list]) -> None:
    """
    Two deform groups (UpperArm, Forearm) use a linear blend across the elbow region
    instead of a hard split. The blend zone runs from y = 0.35 to y = 0.65 * ARM_LENGTH.
    This matches what automatic weight painting produces for a two-bone chain in practice.

    A third group 'cs_elbow' marks the correction zone for CorrectiveSmoothModifier.
    Vertices near the elbow receive weight = 1.0; verts at the ends receive weight = 0.0.
    This confines the corrective smooth to the joint, leaving wrist and shoulder rigid.

    Using vertex_group on CorrectiveSmoothModifier is the right idiom: it avoids
    the correction fighting against tight clothing collars or armour cuffs where flat
    geometry is intentional.
    """
    vg_ua  = mesh_obj.vertex_groups.new(name="UpperArm")
    vg_fa  = mesh_obj.vertex_groups.new(name="Forearm")
    vg_cs  = mesh_obj.vertex_groups.new(name="cs_elbow")

    blend_lo = ARM_LENGTH * 0.35   # blend zone start
    blend_hi = ARM_LENGTH * 0.65   # blend zone end

    for i, ring in enumerate(rings):
        y    = ARM_LENGTH * i / (ARM_SEGMENTS - 1)
        idxs = [v.index for v in ring]

        # Deform weights: linear gradient in the blend zone
        if y <= blend_lo:
            w_ua, w_fa = 1.0, 0.0
        elif y >= blend_hi:
            w_ua, w_fa = 0.0, 1.0
        else:
            t    = (y - blend_lo) / (blend_hi - blend_lo)
            w_ua = 1.0 - t
            w_fa = t

        vg_ua.add(idxs, w_ua, "REPLACE")
        vg_fa.add(idxs, w_fa, "REPLACE")

        # cs_elbow: bell-curve weight centred on the elbow joint
        dist_from_elbow = abs(y - ARM_LENGTH * 0.5)
        half_width      = ARM_LENGTH * 0.30
        w_cs = max(0.0, 1.0 - dist_from_elbow / half_width)
        vg_cs.add(idxs, w_cs, "REPLACE")


def add_modifier_stack(mesh_obj, arm_obj) -> None:
    """
    Stack order: ArmatureModifier → CorrectiveSmoothModifier

    Placement is critical. If CorrectiveSmoothModifier is placed BEFORE Armature, it
    operates on undeformed geometry and sees no joint crease to correct — the delta is
    nearly zero everywhere. Place it AFTER Armature so it observes the collapsed elbow
    cross-section and computes a delta that restores volume.

    CorrectiveSmoothModifier parameters:
        smooth_type = LENGTH_WEIGHTED   prefer over SIMPLE for character meshes
        rest_source = ORCO              headless-safe; no bind operator required
        factor      = 1.0               full correction; lower to blend subtly with
                                        corrective shapes if both are present
        iterations  = 3                 3–5 is character-safe; ≥6 starts to balloon
        vertex_group = 'cs_elbow'       confine correction to the joint region
        use_pin_boundary = True         keep endcap ring verts from drifting
        use_only_smooth  = False        False = corrective delta mode (default);
                                        True would reduce it to a plain Laplacian smooth
    """
    arm_mod = mesh_obj.modifiers.new("Armature", "ARMATURE")
    arm_mod.object               = arm_obj
    arm_mod.use_deform_preserve_volume = True   # volume-preserving quaternion blend

    cs_mod = mesh_obj.modifiers.new("CorrectiveSmooth", "CORRECTIVE_SMOOTH")
    cs_mod.smooth_type        = CS_SMOOTH_TYPE
    cs_mod.rest_source        = CS_REST_SOURCE
    cs_mod.factor             = CS_FACTOR
    cs_mod.iterations         = CS_ITERATIONS
    cs_mod.vertex_group       = "cs_elbow"
    cs_mod.invert_vertex_group = False
    cs_mod.use_pin_boundary   = True
    cs_mod.use_only_smooth    = False


def assign_material(mesh_obj) -> None:
    mat = bpy.data.materials.new(SLUG + "_mat")
    mat.use_nodes = True
    nt  = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = MAT_COLOUR
    bsdf.inputs["Roughness"].default_value  = 0.60
    bsdf.inputs["Subsurface Weight"].default_value = 0.08   # subtle SSS for skin tone
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    mesh_obj.data.materials.append(mat)


def pose_elbow(arm_obj, bend_deg: float) -> None:
    """
    Rotate the Forearm bone around its local X axis to create the elbow bend.
    Positive X rotation in bone-local space bends the forearm forward in a
    standard humanoid right-arm setup.

    We enter POSE mode on the armature, rotate the bone, then exit to OBJECT mode.
    The deformed state is immediately visible in the viewport and captured by
    export_apply=True during GLB export.
    """
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="POSE")

    pb = arm_obj.pose.bones["Forearm"]
    pb.rotation_mode = "XYZ"
    pb.rotation_euler.x = math.radians(bend_deg)

    bpy.ops.object.mode_set(mode="OBJECT")


def export_glb(out_dir: pathlib.Path, slug: str) -> str:
    """
    export_apply=True applies the ArmatureModifier (capturing the 90° bent pose) and
    then the CorrectiveSmoothModifier's corrective delta — producing a static snapshot
    of the corrected elbow for WebXR preview. The rig and pose data are not written
    to the GLB; only the evaluated mesh surface survives.
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


def main() -> None:
    purge(["HF_ArmMesh", "HF_ArmRig"])

    mesh_obj, rings = build_arm_mesh("HF_ArmMesh")
    arm_obj         = build_armature("HF_ArmRig")

    assign_vertex_groups(mesh_obj, rings)
    add_modifier_stack(mesh_obj, arm_obj)
    assign_material(mesh_obj)

    # Pose the elbow BEFORE export so export_apply captures the bent state
    pose_elbow(arm_obj, ELBOW_BEND_DEG)

    bpy.context.view_layer.update()
    export_glb(OUT_DIR, SLUG)


if __name__ == "__main__":
    main()
