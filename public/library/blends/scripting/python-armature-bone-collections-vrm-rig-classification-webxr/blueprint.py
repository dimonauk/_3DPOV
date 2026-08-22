"""
Python bpy.types.BoneCollection — Armature Rig Classification:
Named Collections, Deform Flags & Pose Bone Colour for VRM WebXR (Blender 5.1)

Technique
---------
Blender 4.0 retired the 32-layer armature system and replaced it with named
BoneCollection objects. Each collection is a data block on the armature, not
a scene-level object, so it survives linking and appending without translation.
In Python, arm.collections.new("name") creates a collection, and then
bone.collections.link(collection) assigns any Bone or EditBone to it — the
operation is available in both OBJECT and EDIT mode via their respective data
representations.

For VRM export the deform flag (bone.use_deform) decides which bones drive
skinning: set it True on deform bones, False on mechanism and control bones.
BoneCollections are purely organisational; the exporter reads use_deform, not
collection membership. But keeping collections aligned with deform intent
makes the rig auditable and is mandatory for studio pipelines.

Parameters
----------
All tunable values are named constants at the top of each section.
Run in Blender's Script Editor or headlessly:
  blender --background --python blueprint.py

Output
------
  public/library/blends/scripting/python-armature-bone-collections-vrm-rig-classification-webxr/
    rig_classified.blend
"""

import math
import bpy

# ---------------------------------------------------------------------------
# PATHS
# ---------------------------------------------------------------------------
BLEND_OUT = "//rig_classified.blend"

# ---------------------------------------------------------------------------
# SECTION 1: CLEAN SCENE
# ---------------------------------------------------------------------------
"""
Wipe the default scene to a known state.  Keeping data from a prior run can
cause stale references that silently survive save/load and confuse automation.
"""
bpy.ops.wm.read_factory_settings(use_empty=True)
sc   = bpy.context.scene
sc.name = "HoloflowRigClassification"
col  = bpy.data.collections.new("RigClassification")
sc.collection.children.link(col)

# ---------------------------------------------------------------------------
# SECTION 2: BUILD A MINIMAL BIPED ARMATURE IN EDIT MODE
# ---------------------------------------------------------------------------
"""
The armature is deliberately minimal — spine chain, two arm chains, two leg
chains, and a head.  Real VRM rigs are larger but the naming pattern scales
linearly: DEF- prefix = deform, MCH- prefix = mechanism, CTRL- = control.

WHY this naming convention?
  • Matches Blender's own Rigify prefix convention — artists already recognise it.
  • BoneCollection names (DEF, MCH, CTRL) can be derived from bone name prefixes
    with a single startswith() check, enabling fully automatic classification.
  • VRM1.0 maps bone names to roles (hips, spine, etc.) via an add-on string table;
    the DEF- prefix is stripped before the VRM name is resolved.

Bone chain:
  ROOT ── DEF-spine.001 ── DEF-spine.002 ── DEF-neck ── DEF-head
                        ├── DEF-shoulder.L ── DEF-upper_arm.L ── DEF-forearm.L
                        └── DEF-shoulder.R ── DEF-upper_arm.R ── DEF-forearm.R
         ── DEF-thigh.L ── DEF-shin.L ── DEF-foot.L
         ── DEF-thigh.R ── DEF-shin.R ── DEF-foot.R

CTRL bones (IK targets, not skinning):
  CTRL-ik_hand.L, CTRL-ik_hand.R
  CTRL-ik_foot.L, CTRL-ik_foot.R

MCH bones (twist helpers):
  MCH-twist_upper_arm.L, MCH-twist_upper_arm.R
"""

arm_data = bpy.data.armatures.new("HoloflowRig")
arm_obj  = bpy.data.objects.new("HoloflowRig", arm_data)
col.objects.link(arm_obj)
sc.view_layer.objects.active = arm_obj
arm_obj.select_set(True)

# Enter EDIT mode to build bones
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones

BONE_DEFS = {
    # name                  head (x, y, z)    tail (x, y, z)    parent name
    "ROOT":                 ((0,0,0),          (0,0,0.1),         None),
    "DEF-spine.001":        ((0,0,0.1),        (0,0,0.5),         "ROOT"),
    "DEF-spine.002":        ((0,0,0.5),        (0,0,0.85),        "DEF-spine.001"),
    "DEF-neck":             ((0,0,0.85),       (0,0,1.05),        "DEF-spine.002"),
    "DEF-head":             ((0,0,1.05),       (0,0,1.30),        "DEF-neck"),
    # Left arm
    "DEF-shoulder.L":       ((0,0,0.85),       (0.15,0,0.85),     "DEF-spine.002"),
    "DEF-upper_arm.L":      ((0.15,0,0.85),    (0.45,0,0.80),     "DEF-shoulder.L"),
    "DEF-forearm.L":        ((0.45,0,0.80),    (0.75,0,0.75),     "DEF-upper_arm.L"),
    # Right arm (mirror X)
    "DEF-shoulder.R":       ((0,0,0.85),       (-0.15,0,0.85),    "DEF-spine.002"),
    "DEF-upper_arm.R":      ((-0.15,0,0.85),   (-0.45,0,0.80),    "DEF-shoulder.R"),
    "DEF-forearm.R":        ((-0.45,0,0.80),   (-0.75,0,0.75),    "DEF-upper_arm.R"),
    # Left leg
    "DEF-thigh.L":          ((0.08,0,0.1),     (0.10,0,-0.40),    "ROOT"),
    "DEF-shin.L":           ((0.10,0,-0.40),   (0.10,0,-0.90),    "DEF-thigh.L"),
    "DEF-foot.L":           ((0.10,0,-0.90),   (0.10,0.12,-0.95), "DEF-shin.L"),
    # Right leg
    "DEF-thigh.R":          ((-0.08,0,0.1),    (-0.10,0,-0.40),   "ROOT"),
    "DEF-shin.R":           ((-0.10,0,-0.40),  (-0.10,0,-0.90),   "DEF-thigh.R"),
    "DEF-foot.R":           ((-0.10,0,-0.90),  (-0.10,0.12,-0.95),"DEF-shin.R"),
    # IK controls (no skinning)
    "CTRL-ik_hand.L":       ((0.75,0,0.75),    (0.75,0,0.65),     None),
    "CTRL-ik_hand.R":       ((-0.75,0,0.75),   (-0.75,0,0.65),    None),
    "CTRL-ik_foot.L":       ((0.10,0,-0.95),   (0.10,0,-1.05),    None),
    "CTRL-ik_foot.R":       ((-0.10,0,-0.95),  (-0.10,0,-1.05),   None),
    # Mechanism bones (twist helpers)
    "MCH-twist_upper_arm.L": ((0.15,0,0.85),  (0.30,0,0.825),    "DEF-shoulder.L"),
    "MCH-twist_upper_arm.R": ((-0.15,0,0.85), (-0.30,0,0.825),   "DEF-shoulder.R"),
}

# Create all edit bones
for name, (head, tail, parent_name) in BONE_DEFS.items():
    b       = eb.new(name)
    b.head  = head
    b.tail  = tail
    b.roll  = 0.0
    if parent_name:
        b.parent = eb[parent_name]

print(f"[holoflow] created {len(eb)} edit bones")
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------------------
# SECTION 3: CREATE BONE COLLECTIONS AND CLASSIFY BONES
# ---------------------------------------------------------------------------
"""
BoneCollection API (Blender 4.0+)
  arm_data.collections.new(name)         → BoneCollection
  arm_data.collections.remove(coll)      — deletes by reference
  arm_data.collections.move(from, to)    — reorders root-level list
  arm_data.collections.active            — sets UI active collection
  arm_data.collections.active_index      — integer index

Bone membership:
  bone.collections.link(coll)    — OBJECT or EDIT bone, add to collection
  bone.collections.unlink(coll)  — remove from collection
  bone.collections                — bpy_prop_collection (set-like) view

WHY we do not use old arm.layers:
  arm.layers still exists in 5.1 for migration but maps to the first 20
  collections.  Mixing both APIs on the same armature produces unpredictable
  UI state — use only collections in new scripts.

WHY three collections (DEF / MCH / CTRL)?
  DEF: drives mesh skinning (use_deform=True).  VRM exporters read use_deform.
  MCH: helper bones that drive DEF via copy-rotation or damped-track constraints.
       Hidden by default; set use_deform=False so they never appear in the skin.
  CTRL: artist-facing handles.  Visible, selectable, use_deform=False.
  ROOT: global placement bone.  Stays in its own single-bone collection.

ROOT is a special case — it controls world placement, should be deform=False,
and usually gets its own collection for quick viewport isolation.
"""

COLLECTIONS = {
    "DEF — Deform":       {"prefix": "DEF-",  "use_deform": True,  "visible": True},
    "CTRL — Controls":    {"prefix": "CTRL-", "use_deform": False, "visible": True},
    "MCH — Mechanism":    {"prefix": "MCH-",  "use_deform": False, "visible": False},
    "ROOT":               {"prefix": "ROOT",  "use_deform": False, "visible": True},
}

coll_map = {}
for coll_name, cfg in COLLECTIONS.items():
    coll = arm_data.collections.new(coll_name)
    coll.is_visible = cfg["visible"]
    coll_map[coll_name] = (coll, cfg)

print(f"[holoflow] created {len(coll_map)} bone collections")

# Assign each bone to the correct collection and set its deform flag
for bone in arm_data.bones:
    matched = False
    for coll_name, (coll, cfg) in coll_map.items():
        prefix = cfg["prefix"]
        if bone.name.startswith(prefix) or bone.name == prefix.rstrip("-"):
            bone.collections.link(coll)
            bone.use_deform = cfg["use_deform"]
            matched = True
            break
    if not matched:
        print(f"[holoflow] WARNING: bone '{bone.name}' unclassified")

print("[holoflow] bone classification complete")

# ---------------------------------------------------------------------------
# SECTION 4: APPLY POSE BONE COLOURS PER COLLECTION MEMBERSHIP
# ---------------------------------------------------------------------------
"""
Pose bone colours (bpy.types.BoneColor) are on PoseBone, NOT on BoneCollection.
Each pose bone picks up colour individually; the pattern here maps from which
collection a bone belongs to → which Blender theme palette to use.

Available palettes: 'DEFAULT', 'THEME01' … 'THEME20', 'CUSTOM'
  THEME01 = red    (good for: CTRL / selection handles)
  THEME03 = orange (good for: root / base bones)
  THEME04 = yellow
  THEME08 = teal   (good for: MCH / hidden helpers)
  THEME09 = green  (good for: DEF / deform bones, positive "skinning active")
  THEME14 = blue   (good for: IK targets)

WHY set colour per bone not per collection?
  BoneCollection has no colour property in the public API as of 5.1; the
  Blender UI's collection colour is implemented as a per-collection integer
  stored in the underlying C struct, exposed only through operators.  The safe,
  script-stable path is pose_bone.color.palette which IS in the Python API.

PITFALL: accessing arm_obj.pose.bones before leaving EDIT mode raises
AttributeError because the pose layer is not refreshed mid-edit.  Always set
mode back to OBJECT before touching pose bones.
"""

COLLECTION_PALETTE = {
    "DEF — Deform":    "THEME09",   # green: skin-active deform bones
    "CTRL — Controls": "THEME01",   # red: artist-facing handles
    "MCH — Mechanism": "THEME08",   # teal: hidden mechanism bones
    "ROOT":            "THEME03",   # orange: root placement
}

for coll_name, (coll, cfg) in coll_map.items():
    palette = COLLECTION_PALETTE.get(coll_name, "DEFAULT")
    for bone in coll.bones:
        pb = arm_obj.pose.bones.get(bone.name)
        if pb:
            pb.color.palette = palette

print("[holoflow] pose bone colours applied")

# ---------------------------------------------------------------------------
# SECTION 5: SET ACTIVE COLLECTION TO DEF (VRM EXPORT READY STATE)
# ---------------------------------------------------------------------------
"""
arm_data.collections.active points to the collection currently highlighted in
the Blender sidebar.  Setting it to 'DEF — Deform' makes the deform bones
immediately visible when the artist opens the blend file, which is the expected
state before running a VRM export.

arm_data.collections.active_index is the integer fallback if the reference
comparison fails (e.g., after undo/redo the collection object may be a new
Python wrapper even if the C data is the same).
"""

for i, coll in enumerate(arm_data.collections):
    if coll.name.startswith("DEF"):
        arm_data.collections.active_index = i
        break

print(f"[holoflow] active collection: {arm_data.collections.active.name}")

# ---------------------------------------------------------------------------
# SECTION 6: PRINT AUDIT TABLE
# ---------------------------------------------------------------------------
"""
An audit table printed to stdout lets headless CI pipelines verify the rig
classification without opening Blender.  Pipe the script output to a log file
and diff against a known-good baseline to detect regressions.
"""

print("\n[holoflow] ── Rig Classification Audit ──")
print(f"{'BONE':<30}  {'COLLECTION':<22}  {'USE_DEFORM'}")
print("─" * 68)
for bone in sorted(arm_data.bones, key=lambda b: b.name):
    coll_names = ", ".join(c.name for c in bone.collections) or "(none)"
    print(f"{bone.name:<30}  {coll_names:<22}  {bone.use_deform}")

# ---------------------------------------------------------------------------
# SECTION 7: SAVE .blend
# ---------------------------------------------------------------------------
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
print(f"\n[holoflow] saved → {BLEND_OUT}")
print("[holoflow] blueprint complete")
