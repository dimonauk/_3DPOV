"""
bpy.types.KeyingSet + bpy.types.KeyingSetInfo — Custom VRM Auto-Key Capture Pipeline
Blender 5.1  |  CC0  |  Holoflow Studio

TECHNIQUE
---------
A Blender KeyingSet is a named container of property paths.  Pressing I (or
calling keyframe_insert programmatically) writes a keyframe on every channel
listed in the active keying set in one go.

TWO CREATION ROUTES:

  SCENE KEYING SET  — scene.keying_sets.new(idname, name)
    Lives on the .blend's scene data-block; populated by explicit
    ks.paths.add() calls.  Appears in the scene's Keying Sets panel.
    Best for shot-specific setups where the property list is stable.

  KEYING SET INFO   — class MyKSI(bpy.types.KeyingSetInfo)
    Registered globally via bpy.utils.register_class().  Blender calls
    generate() every time I is pressed, so it inspects the rig live and
    builds the path list fresh — bones added after initial setup are
    captured automatically.  Appears in the global Active Keying Set
    dropdown.  This tutorial implements both; the KSI pattern is the one
    to ship in a production add-on.

KeyingSetPath fields (ks.paths.add):
  id          — the ID data-block owning the property (Object, Key, …)
  data_path   — RNA path from that ID root:
                  bone rotation → 'pose.bones["Root"].rotation_euler'
                  shape key    → 'key_blocks["happy"].value'
                  (NOTE: shape key .value is on the Key block, not the Object)
  index       — -1 = whole vector, 0/1/2 for a single component
  group_method— 'NAMED' groups channels under a named header in the editor
  group_name  — label string for 'NAMED' grouping

BLENDER 5.1 NOTES
-----------------
• KeyingSetInfo.generate(self, context, ks, data): data is the value yielded
  by iterator(); add all desired paths to ks inside generate().
• 'INSERTKEY_NEEDED' in bl_options skips a channel when its value has not
  changed since the last keyframe — keeps action strips sparse and clean.
• After register_class(MyKSI), access the keying set via
  context.scene.keying_sets_all["<bl_label>"].
• Most reliable insertion script: iterate ks.paths yourself and call
  ksp.id.keyframe_insert(data_path=ksp.data_path, index=ksp.array_index, frame=f)
  — no operator-context dependency.
"""
import bpy
import array as arr

SLUG       = "python-bpy-keying-set-vrm-auto-key-capture"
BLEND_PATH = "//keying_set_vrm_capture.blend"
GLB_PATH   = "//keying_set_vrm_capture.glb"

VRM_PRESETS = {
    "happy","angry","sad","surprised","relaxed",
    "aa","ih","ou","ee","oh",
    "blink","blinkLeft","blinkRight",
    "lookUp","lookDown","lookLeft","lookRight","neutral",
}

# ── 1. SCENE ──────────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = 24

# ── 2. ARMATURE — minimal 3-bone spine proxy ──────────────────────────────────
arm_data = bpy.data.armatures.new("vrm_proxy_arm")
arm_ob   = bpy.data.objects.new("vrm_proxy_arm", arm_data)
sc.collection.objects.link(arm_ob)
bpy.context.view_layer.objects.active = arm_ob
arm_ob.select_set(True)

bpy.ops.object.mode_set(mode='EDIT')
BONES = [
    ("Root",  (0,0,0),    (0,0,0.5)),
    ("Spine", (0,0,0.5),  (0,0,1.1)),
    ("Head",  (0,0,1.1),  (0,0,1.55)),
]
ebs = arm_data.edit_bones
for name, h, t in BONES:
    eb = ebs.new(name);  eb.head = h;  eb.tail = t
    if name == "Spine": eb.parent = ebs["Root"]
    if name == "Head":  eb.parent = ebs["Spine"]
bpy.ops.object.mode_set(mode='OBJECT')

for bone in arm_ob.data.bones:
    bone.use_deform = True

# rig_ prefix marks this property for pickup by the keying set enumerator
arm_ob.pose.bones["Head"]["rig_nod"] = 0.0
arm_ob.pose.bones["Head"].id_properties_ui("rig_nod").update(
    min=0.0, max=1.0, description="Head nod: 0=neutral, 1=full-down")

# ── 3. HEAD MESH + VRM EXPRESSION SHAPE KEYS ─────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.4, location=(0, 0, 1.325))
head_ob = bpy.context.active_object
head_ob.name = "vrm_head"
head_ob.parent = arm_ob
arm_mod = head_ob.modifiers.new("Armature", 'ARMATURE')
arm_mod.object = arm_ob

basis = head_ob.shape_key_add(name="Basis", from_mix=False)
head_ob.data.shape_keys.use_relative = True
nv = len(head_ob.data.vertices)
flat0 = arr.array('f', [0.0] * (3 * nv))
basis.data.foreach_get('co', flat0)

def add_expr(name, yscale):
    sk = head_ob.shape_key_add(name=name, from_mix=False)
    sk.relative_key = basis
    flat = arr.array('f', flat0)
    for i in range(nv):
        flat[i*3+1] += yscale * flat0[i*3+1] * 0.18
    sk.data.foreach_set('co', flat)

for expr, sv in [("happy",.3),("sad",-.2),("surprised",.5),("blink",-.1)]:
    add_expr(expr, sv)

skeys = head_ob.data.shape_keys
print(f"[{SLUG}] {nv} verts, {len(skeys.key_blocks)} shape keys")

# ── 4. SCENE KEYING SET: EXPLICIT PATH ENUMERATION ───────────────────────────
ks = sc.keying_sets.new(idname="HOLOFLOW_vrm_capture", name="Holoflow VRM Capture")
ks.bl_description = "Holoflow full VRM capture — deform bones, expressions, rig dials"

for pb in arm_ob.pose.bones:
    if not arm_ob.data.bones[pb.name].use_deform:
        continue
    pfx = f'pose.bones["{pb.name}"]'
    for prop in ("location", "rotation_euler", "scale"):
        ks.paths.add(arm_ob, f"{pfx}.{prop}", index=-1,
                     group_method='NAMED', group_name=pb.name)
    for kn in pb.keys():
        if kn.startswith("rig_"):
            ks.paths.add(arm_ob, f'{pfx}["{kn}"]', index=-1,
                         group_method='NAMED', group_name=f"{pb.name} Controls")

for kb in skeys.key_blocks:
    if kb.name in VRM_PRESETS:
        ks.paths.add(skeys, f'key_blocks["{kb.name}"].value', index=-1,
                     group_method='NAMED', group_name=f"{head_ob.name} Expressions")

print(f"[{SLUG}] keying set '{ks.name}': {len(ks.paths)} paths")

# ── 5. KEYING SET INFO — DYNAMIC REGISTERED TYPE ─────────────────────────────
class HoloflowVrmCaptureKSI(bpy.types.KeyingSetInfo):
    """
    Dynamic variant: generate() is called live at every I-press so it adapts
    to rigs that have had bones added or shape keys expanded since scene open.
    The 'INSERTKEY_NEEDED' flag suppresses a channel when value hasn't changed
    — keeps the action strip sparse for downstream NLA blending.
    """
    bl_label   = "Holoflow VRM Capture (Dynamic)"
    bl_options = {'INSERTKEY_NEEDED'}

    def poll(self, context):
        ob = context.active_object
        return ob is not None and ob.type == 'ARMATURE'

    def iterator(self, context, ks):
        yield context.active_object  # generate() receives the armature as `data`

    def generate(self, context, ks, data):
        ob = data
        for pb in ob.pose.bones:
            if not ob.data.bones[pb.name].use_deform:
                continue
            pfx = f'pose.bones["{pb.name}"]'
            for prop in ("location", "rotation_euler", "scale"):
                ks.paths.add(ob, f"{pfx}.{prop}", index=-1,
                             group_method='NAMED', group_name=pb.name)
            for kn in pb.keys():
                if kn.startswith("rig_"):
                    ks.paths.add(ob, f'{pfx}["{kn}"]', index=-1,
                                 group_method='NAMED', group_name=f"{pb.name} Controls")
        for child in ob.children:
            if child.type != 'MESH' or not (child.data and child.data.shape_keys):
                continue
            sk_block = child.data.shape_keys
            for kb in sk_block.key_blocks:
                if kb.name in VRM_PRESETS:
                    ks.paths.add(sk_block, f'key_blocks["{kb.name}"].value',
                                 index=-1, group_method='NAMED',
                                 group_name=f"{child.name} Expressions")

bpy.utils.register_class(HoloflowVrmCaptureKSI)
print(f"[{SLUG}] KeyingSetInfo '{HoloflowVrmCaptureKSI.bl_label}' registered")

# ── 6. BATCH KEYFRAME INSERTION ───────────────────────────────────────────────
#
# Iterate ks.paths manually and call ID.keyframe_insert() per path — this
# bypasses operator context requirements and works reliably in headless mode.
# array_index on KeyingSetPath is the stored index (-1 for the whole vector).
bpy.context.view_layer.objects.active = arm_ob
arm_ob.select_set(True)
bpy.ops.object.mode_set(mode='POSE')

head_pb  = arm_ob.pose.bones["Head"]
happy_kb = skeys.key_blocks.get("happy")
blink_kb = skeys.key_blocks.get("blink")

TIMELINE = {
     1: (0.0,  0.0, 0.0, 0.0),
    12: (0.35, 0.8, 0.0, 0.0),
    24: (0.0,  0.0, 1.0, 0.0),
    36: (0.0,  0.0, 1.0, 1.0),
    48: (0.0,  0.0, 0.0, 0.0),
}

for frame, (rx, nod, happy, blink) in TIMELINE.items():
    sc.frame_set(frame)
    head_pb.rotation_mode  = 'XYZ'
    head_pb.rotation_euler = (rx, 0.0, 0.0)
    head_pb["rig_nod"]     = nod
    if happy_kb: happy_kb.value = happy
    if blink_kb: blink_kb.value = blink

    for ksp in ks.paths:
        try:
            ksp.id.keyframe_insert(data_path=ksp.data_path,
                                   index=ksp.array_index,
                                   frame=frame)
        except Exception:
            pass  # some paths may not be addressable in headless context
    print(f"[{SLUG}] frame {frame} keyed ({len(ks.paths)} channels)")

sc.frame_start = 1
sc.frame_end   = 48
bpy.ops.object.mode_set(mode='OBJECT')

# ── 7. GLB EXPORT + SAVE ─────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(GLB_PATH),
    export_format                        = 'GLB',
    use_selection                        = False,
    export_apply                         = False,
    export_morph                         = True,
    export_morph_normal                  = True,
    export_morph_tangent                 = False,
    export_animations                    = True,
    export_nla_strips                    = False,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format                  = 'WEBP',
    export_yup                           = True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
bpy.utils.unregister_class(HoloflowVrmCaptureKSI)
print(f"[{SLUG}] done — {GLB_PATH}")
