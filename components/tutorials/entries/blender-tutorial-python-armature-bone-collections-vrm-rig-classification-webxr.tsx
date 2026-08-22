import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.0 retired the 32-layer boolean armature system and replaced it
        with named <code>BoneCollection</code> objects stored directly on the
        armature data block. A collection is not a scene object — it lives inside
        the armature, survives file linking and appending without translation, and
        can be nested into parent/child hierarchies via{" "}
        <code>arm.collections.new(name, parent=coll)</code>. In Python,{" "}
        <code>bone.collections.link(coll)</code> assigns any <code>Bone</code>{" "}
        (object mode) or <code>EditBone</code> (edit mode) to a collection; a
        single bone can belong to multiple collections simultaneously, and
        removing it from all collections leaves it permanently visible — it does{" "}
        not disappear. This is critically different from the old layer system,
        where a bone with all 32 layers unchecked was effectively hidden.
      </p>
      <p>
        For VRM export the relevant flag is not the collection but{" "}
        <code>bone.use_deform</code>: when <code>True</code> the bone drives
        mesh skinning and appears in the VRM skin data; when <code>False</code>{" "}
        it is excluded from the export regardless of which collection it sits in.
        The studio convention aligns collection names with deform intent — DEF,
        MCH, CTRL — so a single <code>startswith()</code> check against the bone
        name prefix can auto-classify an entire rig. This tutorial scripts that
        classification pipeline, applies pose bone colours per collection for
        visual feedback, and produces a <code>rig_classified.blend</code> ready
        for VRM export. For the edit-bone construction that precedes
        classification see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-edit-bones-vrm-spine-chain"
          className={lk}
        >
          armature edit-bones spine-chain tutorial
        </Link>
        .
      </p>
      <p>
        One important API boundary: <code>BoneCollection</code> has no colour
        property in the public Python API as of Blender 5.1. The per-collection
        tinting visible in the Blender UI is a C-level integer not exposed to
        Python; the stable, script-safe path is{" "}
        <code>pose_bone.color.palette = &quot;THEME09&quot;</code> on each
        individual pose bone. The blueprint applies colours after classification
        by iterating <code>coll.bones</code> — the read-only collection of{" "}
        <code>Bone</code> objects belonging to each <code>BoneCollection</code>{" "}
        — and looking up the corresponding <code>PoseBone</code> by name. Pose
        bones must be accessed <em>after</em> leaving EDIT mode; accessing{" "}
        <code>arm_obj.pose.bones</code> mid-edit raises{" "}
        <code>AttributeError</code> because the pose layer is not flushed during
        geometry editing. For the pose-bone matrix decompositions that come after
        a rig is classified, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm"
          className={lk}
        >
          pose bone matrix world-space IK bake tutorial
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Clean scene and build a biped armature in edit mode",
        body: `"""
bpy.ops.wm.read_factory_settings(use_empty=True) gives a known-clean state.
Leaving the default scene objects risks stale mesh data interfering with armature
bone name lookups.

The armature is built by creating an ArmatureObject, linking it to the scene
collection, activating it, and entering EDIT mode.  All edit-bone construction
must happen while the context mode is 'EDIT' — any mode switch in between
flushes the edit bone buffer back to the underlying C mesh and discards
un-committed changes.

arm_data.edit_bones.new(name) returns the new EditBone.  Setting .head and .tail
immediately is mandatory: an edit bone with head == tail is zero-length and
Blender silently deletes it on mode exit.  Roll=0 produces a bone with the Y
axis pointing along the bone and the X axis pointing right, which is standard
for humanoid rigs.

parent=eb["name"] sets the bone parent before mode exit; trying to re-parent via
arm_data.bones (object mode) after the fact does not work — parenting is only
writable on EditBone.
"""
arm_data = bpy.data.armatures.new("HoloflowRig")
arm_obj  = bpy.data.objects.new("HoloflowRig", arm_data)
col.objects.link(arm_obj)
sc.view_layer.objects.active = arm_obj
arm_obj.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones

# Minimal biped: spine, head, arms, legs, IK controls, MCH twist helpers
BONE_DEFS = {
    "ROOT":              ((0,0,0),     (0,0,0.1),     None),
    "DEF-spine.001":     ((0,0,0.1),   (0,0,0.5),     "ROOT"),
    "DEF-spine.002":     ((0,0,0.5),   (0,0,0.85),    "DEF-spine.001"),
    "DEF-neck":          ((0,0,0.85),  (0,0,1.05),    "DEF-spine.002"),
    "DEF-head":          ((0,0,1.05),  (0,0,1.30),    "DEF-neck"),
    "DEF-shoulder.L":    ((0,0,0.85),  (0.15,0,0.85), "DEF-spine.002"),
    "DEF-upper_arm.L":   ((0.15,0,0.85),(0.45,0,0.80),"DEF-shoulder.L"),
    "DEF-forearm.L":     ((0.45,0,0.80),(0.75,0,0.75),"DEF-upper_arm.L"),
    "DEF-shoulder.R":    ((0,0,0.85),  (-0.15,0,0.85),"DEF-spine.002"),
    "DEF-upper_arm.R":   ((-0.15,0,0.85),(-0.45,0,0.80),"DEF-shoulder.R"),
    "DEF-forearm.R":     ((-0.45,0,0.80),(-0.75,0,0.75),"DEF-upper_arm.R"),
    "DEF-thigh.L":       ((0.08,0,0.1),(0.10,0,-0.40),"ROOT"),
    "DEF-shin.L":        ((0.10,0,-0.40),(0.10,0,-0.90),"DEF-thigh.L"),
    "DEF-foot.L":        ((0.10,0,-0.90),(0.10,0.12,-0.95),"DEF-shin.L"),
    "DEF-thigh.R":       ((-0.08,0,0.1),(-0.10,0,-0.40),"ROOT"),
    "DEF-shin.R":        ((-0.10,0,-0.40),(-0.10,0,-0.90),"DEF-thigh.R"),
    "DEF-foot.R":        ((-0.10,0,-0.90),(-0.10,0.12,-0.95),"DEF-thigh.R"),
    "CTRL-ik_hand.L":    ((0.75,0,0.75),(0.75,0,0.65), None),
    "CTRL-ik_hand.R":    ((-0.75,0,0.75),(-0.75,0,0.65),None),
    "CTRL-ik_foot.L":    ((0.10,0,-0.95),(0.10,0,-1.05),None),
    "CTRL-ik_foot.R":    ((-0.10,0,-0.95),(-0.10,0,-1.05),None),
    "MCH-twist_upper_arm.L": ((0.15,0,0.85),(0.30,0,0.825),"DEF-shoulder.L"),
    "MCH-twist_upper_arm.R": ((-0.15,0,0.85),(-0.30,0,0.825),"DEF-shoulder.R"),
}

for name, (head, tail, parent_name) in BONE_DEFS.items():
    b      = eb.new(name)
    b.head = head
    b.tail = tail
    b.roll = 0.0
    if parent_name:
        b.parent = eb[parent_name]

bpy.ops.object.mode_set(mode='OBJECT')
print(f"[holoflow] {len(arm_data.bones)} bones created")`,
      },
      {
        title:
          "Create BoneCollections and classify bones by naming convention",
        body: `"""
arm_data.collections is an ArmatureCollections object.  Key methods:
  .new(name, parent=None)  → BoneCollection (new root-level collection)
  .remove(coll)            — removes by reference; does not delete bones
  .move(from_index, to)    — reorders the root-level list only
  .active_index = N        — sets the sidebar highlight

BoneCollection attributes:
  .name          str (editable)
  .is_visible    bool — hides/shows all member bones in the viewport
  .is_solo       bool — when True all other collections are temporarily hidden
  .bones         bpy_prop_collection[Bone] (read-only)
  .parent        BoneCollection | None
  .children      bpy_prop_collection[BoneCollection]

Bone assignment (object-mode representation):
  arm_data.bones["DEF-spine.001"].collections.link(coll)
  arm_data.bones["DEF-spine.001"].collections.unlink(coll)

WHY object mode here, not edit mode?
  In edit mode you address arm_data.edit_bones[name]; outside edit mode you
  address arm_data.bones[name].  Both expose .collections.link() but the edit-
  bone version requires an active EDIT context.  For headless scripts where no
  context is guaranteed, using arm_data.bones after mode exit is more robust.

WHY classify by prefix not manually?
  Real VRM rigs have 80–200 bones.  Manual collection assignment is error-prone.
  A startswith() check against a naming convention scales linearly and is git-
  diffable: changing a bone's prefix changes its classification.
"""
COLLECTIONS = {
    "DEF — Deform":    {"prefix": "DEF-",  "use_deform": True,  "visible": True},
    "CTRL — Controls": {"prefix": "CTRL-", "use_deform": False, "visible": True},
    "MCH — Mechanism": {"prefix": "MCH-",  "use_deform": False, "visible": False},
    "ROOT":            {"prefix": "ROOT",  "use_deform": False, "visible": True},
}

coll_map = {}
for coll_name, cfg in COLLECTIONS.items():
    coll = arm_data.collections.new(coll_name)
    coll.is_visible = cfg["visible"]
    coll_map[coll_name] = (coll, cfg)

for bone in arm_data.bones:
    for coll_name, (coll, cfg) in coll_map.items():
        prefix = cfg["prefix"]
        if bone.name.startswith(prefix) or bone.name == prefix.rstrip("-"):
            bone.collections.link(coll)
            bone.use_deform = cfg["use_deform"]
            break

print("[holoflow] bone classification complete")`,
      },
      {
        title: "Apply pose bone colours per collection",
        body: `"""
BoneCollection has no .color property in the public Python API as of Blender 5.1.
The per-collection colour tinting in the Blender UI is a C-level integer not
exposed to Python scripts.

The stable path: iterate coll.bones → look up pose_bone → set palette.

Pose bone colour palettes:
  'DEFAULT'  — theme's default (usually white/light grey)
  'THEME01'  — red     (good for: CTRL / IK handles)
  'THEME03'  — orange  (good for: root bones)
  'THEME08'  — teal    (good for: MCH / helpers, distinguishes from active)
  'THEME09'  — green   (good for: DEF / deform — positive "this drives skin")

PITFALL: arm_obj.pose.bones requires OBJECT mode and an up-to-date depsgraph.
Accessing pose bones mid-EDIT mode raises AttributeError.  Always call
bpy.ops.object.mode_set(mode='OBJECT') before this block.

PITFALL: coll.bones is read-only; you cannot add to it directly.
Assignment goes through bone.collections.link(coll), not coll.bones.append().
"""
COLLECTION_PALETTE = {
    "DEF — Deform":    "THEME09",
    "CTRL — Controls": "THEME01",
    "MCH — Mechanism": "THEME08",
    "ROOT":            "THEME03",
}

for coll_name, (coll, cfg) in coll_map.items():
    palette = COLLECTION_PALETTE.get(coll_name, "DEFAULT")
    for bone in coll.bones:
        pb = arm_obj.pose.bones.get(bone.name)
        if pb:
            pb.color.palette = palette

print("[holoflow] pose bone colours applied")`,
      },
      {
        title: "Audit table — verify classification headlessly",
        body: `"""
A printed audit table lets CI pipelines diff rig classification without opening
Blender.  The output is deterministic when bones are sorted alphabetically,
making it safe to use in snapshot tests.

arm_data.collections.active_index sets the sidebar's highlighted collection —
useful for ensuring the file opens with DEF visible and selected, which is the
correct pre-export state for the studio's VRM pipeline.

After printing, save the blend.  export_apply is not needed here because no
modifier stack exists — the armature is pure bone data.
"""
print("\\n[holoflow] ── Rig Classification Audit ──")
print(f"{'BONE':<30}  {'COLLECTION':<22}  {'USE_DEFORM'}")
print("─" * 68)
for bone in sorted(arm_data.bones, key=lambda b: b.name):
    coll_names = ", ".join(c.name for c in bone.collections) or "(none)"
    print(f"{bone.name:<30}  {coll_names:<22}  {bone.use_deform}")

# Set active collection to DEF before save
for i, coll in enumerate(arm_data.collections):
    if coll.name.startswith("DEF"):
        arm_data.collections.active_index = i
        break

bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//rig_classified.blend"))
print("[holoflow] saved → rig_classified.blend")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-armature-bone-collections-vrm-rig-classification-webxr",
    title:
      "Python bpy.types.BoneCollection — Named Rig Layers: Deform/Control/Mechanism Classification & Pose Bone Colour for VRM WebXR (Blender 5.1)",
    description:
      "Script Blender 5.1's BoneCollection API to replace the old 32-layer system: create DEF/CTRL/MCH collections, auto-classify bones by naming prefix, set use_deform flags for VRM export, and apply pose bone colour palettes headlessly.",
    topic: "scripting",
    tags: [
      "blender",
      "python",
      "armature",
      "bone-collection",
      "bpy",
      "vrm",
      "rig",
      "classification",
      "webxr",
      "scripting",
    ],
    date: "2026-07-12",
    body: <Body />,
  }
);
