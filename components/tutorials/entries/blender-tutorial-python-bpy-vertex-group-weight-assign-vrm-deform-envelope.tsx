import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A vertex group is a named list of (vertex-index, float-weight) pairs
        stored inside the mesh data block. Weights drive the armature deformer
        — each bone pulls only the vertices assigned to the group bearing its
        name — but they also feed Geometry Nodes field inputs, physics pinning
        masks, and modifier parameter fields. Unlike bone envelopes, which are
        evaluated at runtime from the bone&apos;s geometry, vertex group data is
        baked into the mesh and survives export to GLB and VRM without any
        additional conversion step. Understanding the scripting API lets you
        populate weights from procedural logic (distance functions, attribute
        noise, mesh-island queries) rather than hand-painting, which is
        essential for characters generated at scale or rigs that must be
        assembled from code for WebXR delivery. The{" "}
        <Link
          href="/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope"
          className={lk}
        >
          weight paint tutorial
        </Link>{" "}
        covers the interactive brush workflow; this tutorial is the scripting
        counterpart.
      </p>
      <p>
        The Python surface is <code>ob.vertex_groups</code> — a{" "}
        <code>VertexGroups</code> collection where each element is a{" "}
        <code>bpy.types.VertexGroup</code>. Creating a group:{" "}
        <code>vg = ob.vertex_groups.new(name=&quot;Spine&quot;)</code>. Assigning
        weights: <code>vg.add([vert_idx, …], weight, &apos;REPLACE&apos;)</code>.
        The third argument is the operation type — <code>&apos;REPLACE&apos;</code>{" "}
        overwrites any existing entry; <code>&apos;ADD&apos;</code> and{" "}
        <code>&apos;SUBTRACT&apos;</code> modify an existing entry and silently do
        nothing if the vertex is not yet in the group. Always use{" "}
        <code>&apos;REPLACE&apos;</code> when populating a group for the first
        time. Reading weights back uses the mesh vertex layer:{" "}
        <code>me.vertices[i].groups</code> returns a sequence of{" "}
        <code>VertexGroupElement</code> objects, each carrying{" "}
        <code>.group</code> (an index into <code>ob.vertex_groups</code>) and{" "}
        <code>.weight</code>. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm"
          className={lk}
        >
          pose bone matrix tutorial
        </Link>{" "}
        explains how the armature modifier then combines these weights with bone
        world transforms to produce final vertex positions.
      </p>
      <p>
        VRM and most real-time engines require that per-vertex skin weights sum
        to exactly 1.0. Blender&apos;s GLB exporter does not auto-normalise —
        if you ship non-normalised weights the viewer either silently clamps
        them (producing ghost-like see-through deformation) or rejects the file
        outright. The fix is two operator calls before export:{" "}
        <code>
          bpy.ops.object.vertex_group_normalize_all(group_select_mode=&apos;ALL&apos;)
        </code>{" "}
        followed by{" "}
        <code>bpy.ops.object.vertex_group_clean(limit=0.001)</code>. Both poll
        for an active mesh object, so wrap them in a{" "}
        <code>temp_override()</code> block as shown in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          context override tutorial
        </Link>
        . The envelope-bake strategy{" "}
        <code>paint.weight_from_bones(type=&apos;ENVELOPES&apos;)</code> is demonstrated
        as a second path and also requires a post-bake normalise pass. NLA-layer
        poses from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend"
          className={lk}
        >
          NLA track tutorial
        </Link>{" "}
        depend on correctly normalised vertex groups to blend deformation
        between clips. Outside reference:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.VertexGroup.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.VertexGroup API (Blender Foundation, CC-BY-SA 4.0)
        </a>
        ; sibling project:{" "}
        <a
          href="https://projects.blender.org/blender/blender-extensions"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-extensions
        </a>
        . Skin weight normalisation requirement:{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          vrm-specification (VRM Consortium, MIT)
        </a>
        ; sibling project:{" "}
        <a
          href="https://github.com/vrm-c/UniVRM"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          UniVRM (MIT)
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Clean scene and build a three-bone humanoid armature",
        body: `"""
Bones must be created in EDIT mode — there is no data-API shortcut that
bypasses mode switching for EditBone creation.  envelope_distance is only
writable on EditBone (not on the runtime Bone), so it must be set here.

BONE_DEFS drives both the armature geometry and the weight-falloff math in
later steps, so it is the single source of truth for bone layout.
"""
import bpy
from mathutils import Vector

ARM_NAME  = "HumanoidRig"
MESH_NAME = "BodyProxy"
BONE_DEFS = [
    ("Root",  0.00, 0.40, 0.22),
    ("Spine", 0.40, 1.00, 0.18),
    ("Head",  1.00, 1.30, 0.16),
]
CLEAN_LIMIT = 0.001
DRACO_LVL   = 6

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

arm_data = bpy.data.armatures.new(ARM_NAME)
arm_ob   = bpy.data.objects.new(ARM_NAME, arm_data)
sc.collection.objects.link(arm_ob)
sc.view_layer.objects.active = arm_ob

with bpy.context.temp_override(active_object=arm_ob):
    bpy.ops.object.mode_set(mode='EDIT')
    ebs  = arm_data.edit_bones
    prev = None
    for bname, hz, tz, env_r in BONE_DEFS:
        eb                   = ebs.new(bname)
        eb.head              = Vector((0, 0, hz))
        eb.tail              = Vector((0, 0, tz))
        eb.envelope_distance = env_r   # radius used by weight_from_bones()
        eb.envelope_weight   = 1.0
        if prev:
            eb.parent        = prev
            eb.use_connect   = True
        prev = eb
    bpy.ops.object.mode_set(mode='OBJECT')
print("[holoflow] armature built")`,
      },
      {
        title: "Build cylinder mesh proxy via bmesh",
        body: `"""
A cylinder with 16 radial segments and 1.30 m height gives enough ring loops
for the weight-blend zone between Root/Spine and Spine/Head to be visible.
create_cone() centres at the world origin; translate up so base sits at Z=0,
matching the Root bone head position.
"""
import bmesh

me = bpy.data.meshes.new(MESH_NAME)
ob = bpy.data.objects.new(MESH_NAME, me)
sc.collection.objects.link(ob)

bm = bmesh.new()
bmesh.ops.create_cone(
    bm, cap_ends=True, cap_tris=False,
    segments=16, radius1=0.12, radius2=0.12,
    depth=1.30, calc_uvs=True,
)
bmesh.ops.translate(bm, verts=bm.verts, vec=Vector((0, 0, 0.65)))
bm.to_mesh(me)
bm.free()
me.update()
print(f"[holoflow] mesh '{MESH_NAME}' — {len(me.vertices)} verts")`,
      },
      {
        title: "Create vertex groups and assign radial-falloff weights",
        body: `"""
Group names must exactly match pose bone names; a single-character mismatch
produces silent failure — the mesh deforms as if unweighted for that bone and
no error is raised.

linear_weight() intentionally produces overlapping influences: adjacent bones
share vertices in transition zones.  Blendskinning requires this overlap to
interpolate deformation smoothly; a hard cut at the bone midpoint produces
a visible crease.

'REPLACE' is the only safe operation type for first population.
'ADD' and 'SUBTRACT' modify an existing entry; if the vertex is not yet in
the group they silently no-op, leaving a zero or absent weight where you
expected a value.
"""
groups = {
    bname: ob.vertex_groups.new(name=bname)
    for bname, *_ in BONE_DEFS
}

def linear_weight(z, hz, tz):
    centre = (hz + tz) * 0.5
    half   = abs(tz - hz) * 0.5 + 1e-6
    return max(0.0, 1.0 - abs(z - centre) / half)

for v in me.vertices:
    z = v.co.z
    for bname, hz, tz, _ in BONE_DEFS:
        w = linear_weight(z, hz, tz)
        if w > CLEAN_LIMIT:
            groups[bname].add([v.index], w, 'REPLACE')
print("[holoflow] manual weights written")`,
      },
      {
        title: "Normalise weights and verify per-vertex sums",
        body: `"""
vertex_group_normalize_all() rescales all weights per vertex so the column
sum equals 1.0 while preserving the ratio between competing bones.
vertex_group_clean() removes entries below CLEAN_LIMIT to trim the
vertex-bone association list — GLB skinning supports up to 4 influences per
vertex; noise entries bloat the file and can confuse decoders.

me.vertices[i].groups is a sequence of VertexGroupElement.
  .group  = index into ob.vertex_groups (NOT a VertexGroup object)
  .weight = float in [0, 1]
The group name is recovered via ob.vertex_groups[element.group].name.
"""
sc.view_layer.objects.active = ob
ob.select_set(True)
with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.vertex_group_normalize_all(
        group_select_mode='ALL', lock_active=False
    )
    bpy.ops.object.vertex_group_clean(
        group_select_mode='ALL', limit=CLEAN_LIMIT, keep_single=False
    )

# Sanity check: each vertex sum should be 1.0 (or 0.0 if unweighted)
for v in me.vertices[:4]:
    total  = sum(g.weight for g in v.groups)
    detail = [(ob.vertex_groups[g.group].name, round(g.weight, 3)) for g in v.groups]
    print(f"  v{v.index:3d}  sum={total:.4f}  {detail}")`,
      },
      {
        title: "Add armature modifier and bake envelope weights",
        body: `"""
weight_from_bones(type='ENVELOPES') recomputes vertex group weights from
the bone envelope volumes (set via envelope_distance in Step 1).
It OVERWRITES all manually assigned weights — this is the alternative
strategy, not a supplement.  Call it before the manual pass if you want to
use the envelope as a baseline and then patch specific vertices by hand.

Poll requirements for weight_from_bones():
  - active_object is a mesh with an Armature modifier
  - the Armature object is in selected_objects
  - mode is OBJECT
Failing any of these raises RuntimeError without touching the vertex groups.

A second normalise pass is mandatory after the bake — the operator does not
guarantee sum=1.0 per vertex, especially near bone tips where envelopes
from adjacent bones barely overlap.
"""
mod                   = ob.modifiers.new("Armature", 'ARMATURE')
mod.object            = arm_ob
mod.use_bone_envelopes = True
mod.use_vertex_groups  = True

arm_ob.select_set(True)
with bpy.context.temp_override(
    active_object=ob,
    selected_objects=[ob, arm_ob],
    object=ob,
):
    bpy.ops.paint.weight_from_bones(type='ENVELOPES')
print(f"[holoflow] groups: {[g.name for g in ob.vertex_groups]}")

with bpy.context.temp_override(active_object=ob, selected_objects=[ob]):
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
    bpy.ops.object.vertex_group_clean(group_select_mode='ALL', limit=CLEAN_LIMIT, keep_single=False)`,
      },
      {
        title: "Export skinned GLB and save .blend",
        body: `"""
export_skins=True writes the JOINTS_0 and WEIGHTS_0 vertex attributes into
the GLB primitive.  Without it the armature modifier is baked into static
mesh positions; the skeleton joint hierarchy is omitted; VRM viewers reject
the file or display the character in bind pose forever.

Holoflow standard: export_yup=True, WebP textures, Draco level 6.
Coordinate note: Blender is Z-up; the exporter rotates to Y-up for GLB
when export_yup=True.  The VRM specification requires Y-up.
"""
with bpy.context.temp_override(scene=sc, view_layer=sc.view_layer):
    bpy.ops.export_scene.gltf(
        filepath="//vertex_group_vrm_proxy.glb",
        export_format="GLB",
        export_apply=False,
        export_skins=True,
        export_image_format="WEBP",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
        export_normals=True,
    )
bpy.ops.wm.save_as_mainfile(filepath="//vertex_group_vrm_proxy.blend")
print("[holoflow] vertex group VRM proxy exported")`,
      },
    ],
  },
  {
    slug: "python-bpy-vertex-group-weight-assign-vrm-deform-envelope",
    title:
      "Python bpy.types.VertexGroup — Scripted Weight Assignment, Group Merging & VRM Deformation Envelope Bake (Blender 5.1)",
    description:
      "Script vertex group creation, radial-falloff weight assignment, normalisation, and envelope bake via the bpy data API — then export a skinned GLB ready for VRM and WebXR.",
    image: null,
    body: <Body />,
    tags: ["blender", "python", "scripting", "vrm", "skinning", "webxr"],
  }
);
