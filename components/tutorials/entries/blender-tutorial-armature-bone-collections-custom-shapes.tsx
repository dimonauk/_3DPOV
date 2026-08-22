import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ArmatureBoneCollectionsBody() {
  return (
    <>
      <p>
        Every rigger who worked in Blender before version&nbsp;4.0 knows the
        ritual: open the Armature&nbsp;→&nbsp;Layers panel, stare at thirty-two
        identical grey squares, and try to remember whether layer&nbsp;3 was FK
        controls or deform bones.  The answer was always buried in a sticky note
        or a colleague&rsquo;s memory.  Named bone collections, introduced in
        Blender&nbsp;4.0 and fully developed through 5.1, replace that bitmask
        entirely with a self-documenting list: &ldquo;Spine FK&rdquo;,
        &ldquo;Arm IK.L&rdquo;, &ldquo;Head&rdquo; — unambiguous at a glance.
      </p>

      <p>
        Custom bone shapes are the companion ergonomic upgrade.  The default
        octahedral spike tells you nothing about a bone&rsquo;s role.  A large
        ring on the root communicates &ldquo;translate the whole character here&rdquo;;
        a small circle on a wrist IK target says &ldquo;grab and drag&rdquo;;
        a diamond on a pole vector says &ldquo;nudge to steer the elbow&rdquo;.
        Shape objects live in a collection that is excluded from the view
        layer — they render as gizmos in the armature without appearing in
        your final render or cluttering the scene.
      </p>

      <p>
        This tutorial builds a biped upper-body control shell in Python, walking
        through the full{" "}
        <code>armature.collections</code> API, the shape-object exclusion
        pattern, and the <code>use_custom_shape_bone_size</code> flag that keeps
        gizmos proportional across rig scales.  The result exports as a GLB
        skeleton compatible with VRM tooling and{" "}
        <code>three.js SkeletonHelper</code>.  Cross-reference the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          IK robot arm tutorial
        </Link>{" "}
        for the inverse-kinematics constraints that make the wrist and pole
        targets functional, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA + VRM animation tutorial
        </Link>{" "}
        for stacking action clips on this rig once it is clothed in a mesh.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-armature-bone-collections-custom-shapes",
  title:
    "Armature — Bone Collections + Custom Bone Shapes: Named Control Rig Layers (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Replace the 32-layer bitmask with self-documenting named bone collections, " +
    "assign ring/circle/diamond gizmo shapes to control bones, and export a VRM-compatible skeleton GLB.",
  Body: ArmatureBoneCollectionsBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "public/library/blends/rigging/armature-bone-collections-custom-shapes/",
    time: "two to three hours",
    difficulty: "intermediate",
    overview:
      "Named bone collections (Blender 4.0+) replace the opaque 32-layer bitmask with a " +
      "self-documenting list visible in the Outliner. Combined with custom bone shapes — " +
      "mesh objects assigned to pose bones as gizmos — they make a rig readable at a glance " +
      "without opening the Properties panel. This tutorial walks both systems end-to-end " +
      "in Python and produces a VRM-ready skeleton GLB.",
    goal:
      "Build a biped upper-body control rig with seven named bone collections and three " +
      "custom bone shapes, then export a clean skeleton GLB.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable creating and editing armatures in Edit Mode",
      "Familiar with Pose Mode — selecting, rotating, and inserting keyframes on pose bones",
      "Basic Python in Blender's Scripting workspace (running a script, reading errors)",
      "Understood the difference between Edit Bone and Pose Bone (rest pose vs. posed state)",
    ],
    steps: [
      {
        title: "Why collections replaced layers",
        body: `Blender 3.x stored bone visibility as a 32-bit bitmask on each bone
(bone.layers — a tuple of 32 bools) and a matching bitmask on the armature
(armature.layers).  Toggling a bone's layer membership required indexing a
specific bit position, known only by convention.

In Blender 4.0 this was rearchitected completely:
  armature.collections  — a BoneCollections sequence, indexed by name
  collection.assign(bone)  — assigns a Bone, EditBone, or PoseBone
  collection.is_visible    — bool, toggle in the Outliner
  collection.is_solo       — bool, solo mode (hides everything else)

The old bone.layers and armature.layers properties still exist in 4.x as a
deprecated shim that reads/writes through the new collections.  In Blender 5.x
the shim is present but emits a deprecation warning when accessed.  If you open
a 3.x file in 5.1, Blender auto-migrates the bitmask to unnamed collections
(named "Collection 0" through "Collection N" for each layer that had at least
one bone assigned).  Rename them immediately:

  for i, col in enumerate(arm.collections):
      col.name = ["Root", "Spine FK", "Head", ...][i]

The blueprint.py in this entry removes the auto-created default collection
(arm.collections.remove(col)) before adding seven named ones — a cleaner
approach than renaming auto-generated entries.`,
      },
      {
        title: "Create and exclude the SHAPES collection",
        body: `Custom bone shapes must be mesh objects.  The convention is to place them in a
dedicated collection called "SHAPES" (or "WGTs" in some rigs) and then exclude
that collection from the active View Layer:

  shapes_col = bpy.data.collections.new("SHAPES")
  bpy.context.scene.collection.children.link(shapes_col)
  bpy.context.view_layer.layer_collection.children["SHAPES"].exclude = True

The exclude flag means:
  - The shape objects do NOT appear in the 3D viewport as regular objects.
  - They DO render as bone gizmos inside the armature — Blender bypasses the
    View Layer exclusion specifically for custom shape rendering.
  - They are NOT included in renders or GLB exports.

This is different from hiding the objects (ob.hide_viewport = True) or hiding
the collection checkbox in the viewport.  Exclusion removes them from the
evaluation stack entirely while preserving their use as shape references.

An alternative — used by tools like Rigify — is to put shapes in a collection
on a hidden View Layer.  Exclusion is simpler for single-file rigs.`,
      },
      {
        title: "Build ring, circle, and diamond shape meshes",
        body: `Three shapes cover most control roles.  Each is built with bmesh so the
script is self-contained (no pre-existing objects required).

Ring (root bone — large ground-plane indicator):
  bm = bmesh.new()
  segs = 24
  vs = [bm.verts.new((R*cos(2π*i/segs), R*sin(2π*i/segs), 0)) for i in range(segs)]
  for i in range(segs): bm.edges.new((vs[i], vs[(i+1)%segs]))

The mesh is EDGES ONLY — no faces.  Blender renders edge-only meshes as wire
shapes, which look identical to the classic circle gizmo.  Adding faces would
fill the ring, which is rarely what you want for a bone gizmo.

Circle (IK wrist target — slightly smaller):
  Same construction, R=0.8, segs=12.  Fewer segments give a more
  "control-widget" faceted look that distinguishes it from the smoother root ring.

Diamond (pole vector — orientation hint):
  Four vertices at 0°, 90°, 180°, 270° with edges connecting them in a square
  rotated 45°.  The diamond silhouette reads as "directional cue" — ideal for
  pole vectors whose job is to steer elbow/knee direction.`,
      },
      {
        title: "Build the armature in Edit Mode",
        body: `bpy.ops.object.mode_set(mode='EDIT') is required before accessing arm.edit_bones.
A helper closure keeps the bone creation lines concise:

  def _eb(name, head, tail, parent=None, connected=False):
      eb = arm.edit_bones.new(name)
      eb.head, eb.tail = head, tail
      if parent:
          eb.parent = arm.edit_bones[parent]
          eb.use_connect = connected
      return eb

use_connect=True means the child's head snaps to the parent's tail and the two
bones share a vertex in the skeleton display.  use_connect=False leaves a gap —
correct for shoulder bones (slight offset from the spine) and mandatory for
IK target bones, which float in space unconnected to the deform chain.

The IK target bones (ctrl_ik_wrist.L / .R, ctrl_ik_pole.L / .R) have no parent
and no connection.  They are placed near the wrist and behind the elbow
respectively.  Their names begin with ctrl_ to signal that they are control
objects, not deformation bones — a naming convention respected by the
VRM-Addon-for-Blender and most auto-riggers.

See the companion
IK robot arm tutorial for adding the IKConstraint that wires these targets to
the actual elbow chain.`,
      },
      {
        title: "Create named bone collections and assign",
        body: `After returning to Object Mode, the armature.collections API is available:

  arm.collections.remove(col)        # clear auto-created default
  col_root  = arm.collections.new("Root")
  col_spine = arm.collections.new("Spine FK")
  col_ik_l  = arm.collections.new("Arm IK.L")
  # etc.

  col_root.assign(arm.bones["root"])
  col_root.assign(arm.bones["hips"])

assign() accepts three bone types: Bone (arm.bones), EditBone (arm.edit_bones,
only valid in Edit Mode), and PoseBone (obj.pose.bones, only valid in Pose Mode).
In Object Mode use arm.bones — the Bone objects.

A bone can belong to multiple collections simultaneously.  This is useful for
"visibility presets" — a bone assigned to both "Arm FK.L" and a "Picker" collection
appears in both toggle groups.  The blueprint assigns each bone to exactly one
collection to keep the demo unambiguous.

Verify in the Outliner: switch its header from "Scenes" to "Bone Collections"
(the armature icon).  Seven rows should appear.  The eye icon on each row
corresponds to collection.is_visible.`,
      },
      {
        title: "Assign custom shapes in Pose Mode",
        body: `Custom shapes are set on PoseBone objects, which only exist in Pose Mode:

  bpy.ops.object.mode_set(mode='POSE')
  pb = rig_obj.pose.bones["root"]
  pb.custom_shape = bpy.data.objects["SHAPE_root_ring"]
  pb.custom_shape_scale_xyz = (1.6, 1.6, 1.6)
  pb.use_custom_shape_bone_size = True

custom_shape_scale_xyz is applied AFTER the bone-size scaling.  With
use_custom_shape_bone_size=True, the total display scale is:
  shape_display_size = bone_rest_length × custom_shape_scale_xyz

This means the root ring stays proportional when the rig is scaled at the
Object level (Ctrl+A → Scale to apply), because bone_rest_length scales with
the mesh.  Without use_custom_shape_bone_size the shape stays at the fixed
custom_shape_scale_xyz regardless of rig scale — useful for UI-style rigs where
gizmo size should be screen-space constant.

pbone.custom_shape_transform is an optional secondary bone whose transform is
used as the shape's coordinate origin instead of the assigned bone's.  This
allows one shape object (e.g. a circle on the world X-Y plane) to be displayed
in a rotated frame by pointing custom_shape_transform at a bone that is already
oriented to the desired plane.  Not used in this blueprint but essential for
facial rig circles that need to face the camera rather than lie flat.`,
      },
      {
        title: "Export skeleton GLB for VRM / Three.js",
        body: `bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//armature_control_rig.glb"),
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_draco_mesh_compression_enable=False,
)

export_apply=True bakes any modifiers before export — not critical for a bare
armature but good practice.  Draco compression is disabled because the output
is a skeleton (joints + inverse-bind matrices), not geometry — Draco targets
mesh data and produces no benefit here.

The exported GLB contains:
  - One Skin node with joints for all 20 bones in this blueprint.
  - Each joint carries its rest-pose (inverse bind) matrix.
  - No mesh — the GLB is a pure skeleton file.

In Three.js, load with GLTFLoader then:
  const helper = new THREE.SkeletonHelper(model.scene);
  scene.add(helper);

This renders the bone hierarchy as coloured lines.  Attach a skinned mesh
(e.g. from a VRM export) by matching bone names and calling mesh.bind(skeleton).

Custom bone shapes do NOT travel in the GLB — they are Blender-only viewport
metadata.  The VRM-Addon-for-Blender (MIT) handles VRM-specific metadata
(spring bones, look-at constraints) separately.`,
      },
    ],
    notes: `Blender 3.x migration:
When opening a 3.x blend in Blender 5.1, each used bone layer becomes an
unnamed collection ("Collection 0", "Collection 1", ...).  Rename them in
the Python console immediately after opening — names are not inferred from
context.  Also check armature.collections_all vs armature.collections:
collections returns the top-level list; collections_all returns ALL collections
including nested children.  On a freshly migrated file both are identical.

Nested collections (Blender 4.1+):
arm.collections.new("Arm.L", parent=col_arm) creates a child collection.
This lets you fold "Arm FK.L" and "Arm IK.L" under a parent "Arm.L" row in
the Outliner, which collapses cleanly on complex rigs.  The blueprint omits
nesting to keep the demo readable — add it once you have 50+ collections and
want to group them.

Bone colour (Blender 4.0+):
Bone colour themes replaced Bone Groups in 4.0.  Assign per-collection:
  col_ik_l.color_set = 'THEME09'  (9th colour swatch = cyan in default theme)
Blender 5.1 supports per-bone colour override via pbone.color.palette.`,
    variations: [
      "Nested collections for a production rig: add parent collections 'Controls', 'Deformation', 'Mechanics' at the top level and nest the seven named collections under them. arm.collections.new('Arm.L', parent=arm.collections['Controls']) creates the hierarchy. Deformation bones go under a 'DEF' child of 'Deformation' with is_visible=False by default.",
      "Picker panel via bone shapes: place all control bones on a flat XY plane at Z=0, set the armature's display to 'WIRE', and use a Viewport Shading with X-Ray so all bones show through the mesh. Custom shapes can then act as a 2D picker panel — click the circle to select the IK wrist, click the ring to select the root. This is the approach used by Rigify's generated pickers.",
      "Per-collection bone colours: after assigning collections, set col_root.color_set = 'THEME04' (yellow), col_ik_l.color_set = 'THEME09' (cyan), col_ik_r.color_set = 'THEME09'. Blender 5.1 renders the assigned colour on all bones in that collection in Pose Mode. Override per-bone with pbone.color.palette = 'CUSTOM'; pbone.color.custom.normal = (r,g,b).",
    ],
    troubleshooting: [
      {
        symptom: "arm.collections.new() raises AttributeError — 'Armature' has no attribute 'collections'",
        cause:
          "You are running Blender 3.x.  The BoneCollection API was introduced in Blender 4.0.  " +
          "The blueprint.py is written for Blender 5.1.",
        fix: "Download and install Blender 5.1 from blender.org/download.  " +
          "In 3.x, bone layers are the only option: bone.layers[N] = True; armature.layers[N] = True.",
      },
      {
        symptom: "Custom shapes not visible in the viewport",
        cause:
          "Either the armature's Overlay settings have 'Shapes' disabled, or the shapes collection " +
          "is excluded at the Object level rather than the View Layer level.",
        fix: "In the 3D Viewport header, click the Overlay dropdown and ensure 'Bone Shapes' (or 'Custom Shapes') " +
          "is ticked.  Then check the SHAPES collection exclusion: Outliner → right-click the 'SHAPES' " +
          "collection row → 'View Layer Exclude' must be ticked (not just the eye icon).  " +
          "If you only hid the collection with the eye icon, the shapes objects may show in the viewport " +
          "as standalone meshes rather than as bone gizmos.",
      },
      {
        symptom: "col.assign(arm.bones['root']) raises TypeError — Bone expected, EditBone given",
        cause:
          "You are calling assign() after bpy.ops.object.mode_set(mode='EDIT').  " +
          "In Edit Mode, arm.bones returns an empty or stale list; the active bone objects are arm.edit_bones.",
        fix: "Return to Object Mode before calling collection.assign(): bpy.ops.object.mode_set(mode='OBJECT'). " +
          "Then arm.bones is populated and assign() works correctly.  " +
          "Alternatively, call col.assign(arm.edit_bones['root']) while still in Edit Mode — EditBone " +
          "objects are also accepted by assign().",
      },
      {
        symptom: "GLB exports an empty file (0 KB or no nodes)",
        cause:
          "The armature object is not in the active scene collection, or export_apply=True failed " +
          "because the armature was in Edit Mode at export time.",
        fix: "Ensure the rig object is linked to bpy.context.scene.collection (blueprint.py does this). " +
          "Call bpy.ops.object.mode_set(mode='OBJECT') before bpy.ops.export_scene.gltf().  " +
          "Check the system console (Window → Toggle System Console on Windows) for export errors.",
      },
    ],
  },
  base,
);

export { entry };
