import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A <code>bpy.types.KeyingSet</code> is a named list of property paths;
        pressing <kbd>I</kbd> writes a keyframe on every channel it contains in
        one operation. The <em>scene keying set</em> route —{" "}
        <code>scene.keying_sets.new(idname, name)</code> — populates paths with{" "}
        <code>ks.paths.add()</code> upfront: correct when the rig is stable.
        The <em>KeyingSetInfo</em> route subclasses{" "}
        <code>bpy.types.KeyingSetInfo</code> and registers it globally; Blender
        calls <code>generate(self, context, ks, data)</code> live at every{" "}
        <kbd>I</kbd>-press, regenerating the path list from the rig&apos;s
        current bone and shape key structure — the right pattern for add-ons
        distributed across rigs that evolve. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-bone-collections-vrm-rig-classification-webxr"
          className={lk}
        >
          bone collections tutorial
        </Link>{" "}
        for the <code>use_deform</code> bone tagging that both routes rely on.
      </p>
      <p>
        <code>ks.paths.add(id, data_path, index, group_method, group_name)</code>{" "}
        has one non-obvious rule: <code>id</code> must be the data-block that{" "}
        <em>owns</em> the RNA path — bone transforms use{" "}
        <code>id=arm_ob</code>; shape key values live on{" "}
        <code>bpy.types.Key</code> not the mesh, so{" "}
        <code>id=ob.data.shape_keys</code> with{" "}
        <code>data_path=&apos;key_blocks["happy"].value&apos;</code> is correct
        (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-shape-key-data-block-morph-target-vrm-webxr"
          className={lk}
        >
          shape key tutorial
        </Link>
        ). Custom rig dials with a <code>rig_</code> prefix (set via{" "}
        <Link
          href="/tutorials/blender-tutorial-python-id-properties-ui-custom-prop-schema-rig-controls"
          className={lk}
        >
          id_properties_ui
        </Link>
        ) are addressed as{" "}
        <code>&apos;pose.bones["Head"]["rig_nod"]&apos;</code>. For headless
        batch insertion iterate <code>ks.paths</code> and call{" "}
        <code>ksp.id.keyframe_insert(data_path=ksp.data_path, index=ksp.array_index, frame=f)</code>{" "}
        — no operator context needed.{" "}
        <code>&apos;INSERTKEY_NEEDED&apos;</code> keeps the action sparse for
        NLA (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend"
          className={lk}
        >
          NLA track tutorial
        </Link>
        ). Outside references:{" "}
        <
          href="https://docs.blender.org/api/5.1/bpy.types.KeyingSet.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.KeyingSet (Blender Foundation, CC-BY-SA-4.0)
        </a>
        , siblings{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.KeyingSetInfo.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.KeyingSetInfo
        </a>{" "}
        and{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.KeyingSetPath.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.KeyingSetPath
        </a>
        ; VRM expression presets:{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/expressions.md"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          VRMC_vrm-1.0 expressions (VRM Consortium, MIT)
        </a>
        , siblings{" "}
        <a href="https://github.com/pixiv/three-vrm" className={lk} target="_blank" rel="noopener noreferrer">
          three-vrm (pixiv, MIT)
        </a>{" "}
        and{" "}
        <a href="https://github.com/vrm-c/UniVRM" className={lk} target="_blank" rel="noopener noreferrer">
          UniVRM (VRM Consortium, MIT)
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
        title: "Scene, armature proxy, head mesh, and VRM shape keys",
        body: `"""
arm_ob.pose.bones["Head"]["rig_nod"]=0.0 creates an ID property; rig_ prefix
signals 'capture this dial' to the keying set enumerator.  Shape key .value
lives on head_ob.data.shape_keys (the Key block), NOT on head_ob — this is the
critical id distinction for ks.paths.add() later.  foreach_set writes vertex
deltas at C speed.
"""
import bpy, array as arr
SLUG = "python-bpy-keying-set-vrm-auto-key-capture"
VRM_PRESETS = {"happy","sad","surprised","blink","aa"}

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene;  sc.render.fps = 24

arm_data = bpy.data.armatures.new("vrm_proxy_arm")
arm_ob   = bpy.data.objects.new("vrm_proxy_arm", arm_data)
sc.collection.objects.link(arm_ob)
bpy.context.view_layer.objects.active = arm_ob
arm_ob.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
ebs = arm_data.edit_bones
for n,h,t in [("Root",(0,0,0),(0,0,.5)),("Spine",(0,0,.5),(0,0,1.1)),("Head",(0,0,1.1),(0,0,1.55))]:
    eb=ebs.new(n); eb.head=h; eb.tail=t
    if n=="Spine": eb.parent=ebs["Root"]
    if n=="Head":  eb.parent=ebs["Spine"]
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm_ob.data.bones: b.use_deform = True
arm_ob.pose.bones["Head"]["rig_nod"] = 0.0
arm_ob.pose.bones["Head"].id_properties_ui("rig_nod").update(min=0.0, max=1.0)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.4, location=(0,0,1.325))
head_ob = bpy.context.active_object;  head_ob.name = "vrm_head"
head_ob.parent = arm_ob
basis = head_ob.shape_key_add(name="Basis", from_mix=False)
head_ob.data.shape_keys.use_relative = True
nv = len(head_ob.data.vertices)
flat0 = arr.array('f',[0.0]*(3*nv));  basis.data.foreach_get('co', flat0)
def add_expr(name, sv):
    sk = head_ob.shape_key_add(name=name, from_mix=False); sk.relative_key = basis
    flat = arr.array('f', flat0)
    for i in range(nv): flat[i*3+1] += sv * flat0[i*3+1] * 0.18
    sk.data.foreach_set('co', flat)
for e,v in [("happy",.3),("sad",-.2),("surprised",.5),("blink",-.1)]: add_expr(e,v)
skeys = head_ob.data.shape_keys;  print(f"[{SLUG}] {nv}v {len(skeys.key_blocks)}sk")`,
      },
      {
        title: "Scene-level keying set: paths API",
        body: `"""
scene.keying_sets.new(idname, name) returns a KeyingSet bound to this scene.
paths.add id argument: arm_ob for bone properties, skeys (the Key data-block)
for shape key .value.  group_method='NAMED' clusters channels under a labelled
header in the Graph Editor — essential for VRM rigs with dozens of bone tracks.
"""
ks = sc.keying_sets.new(idname="HOLOFLOW_vrm_capture", name="Holoflow VRM Capture")
ks.bl_description = "Holoflow VRM capture — deform bones, expressions, rig dials"

for pb in arm_ob.pose.bones:
    if not arm_ob.data.bones[pb.name].use_deform: continue
    pfx = f'pose.bones["{pb.name}"]'
    for prop in ("location","rotation_euler","scale"):
        ks.paths.add(arm_ob, f"{pfx}.{prop}", index=-1, group_method='NAMED', group_name=pb.name)
    for kn in pb.keys():
        if kn.startswith("rig_"):
            ks.paths.add(arm_ob, f'{pfx}["{kn}"]', index=-1,
                         group_method='NAMED', group_name=f"{pb.name} Controls")

for kb in skeys.key_blocks:
    if kb.name in VRM_PRESETS:
        ks.paths.add(skeys, f'key_blocks["{kb.name}"].value', index=-1,
                     group_method='NAMED', group_name=f"{head_ob.name} Expressions")
print(f"[{SLUG}] keying set '{ks.name}': {len(ks.paths)} paths")`,
      },
      {
        title: "Register HoloflowVrmCaptureKSI: dynamic path generation",
        body: `"""
KeyingSetInfo.generate() is called live at every I-press so paths reflect the
rig's current bone and shape key structure — bones added after scene-open are
captured without rebuilding the keying set.  'INSERTKEY_NEEDED' suppresses
channels whose value hasn't changed, keeping the action strip sparse and clean
for NLA blending.  After register_class(), the type appears globally in
context.scene.keying_sets_all.
"""
class HoloflowVrmCaptureKSI(bpy.types.KeyingSetInfo):
    bl_label   = "Holoflow VRM Capture (Dynamic)"
    bl_options = {'INSERTKEY_NEEDED'}

    def poll(self, context):
        ob = context.active_object
        return ob is not None and ob.type == 'ARMATURE'

    def iterator(self, context, ks):
        yield context.active_object  # generate() receives the armature as data

    def generate(self, context, ks, data):
        ob = data
        for pb in ob.pose.bones:
            if not ob.data.bones[pb.name].use_deform: continue
            pfx = f'pose.bones["{pb.name}"]'
            for prop in ("location","rotation_euler","scale"):
                ks.paths.add(ob, f"{pfx}.{prop}", index=-1, group_method='NAMED', group_name=pb.name)
            for kn in pb.keys():
                if kn.startswith("rig_"):
                    ks.paths.add(ob, f'{pfx}["{kn}"]', index=-1,
                                 group_method='NAMED', group_name=f"{pb.name} Controls")
        for child in ob.children:
            if child.type != 'MESH' or not (child.data and child.data.shape_keys): continue
            sk_b = child.data.shape_keys
            for kb in sk_b.key_blocks:
                if kb.name in VRM_PRESETS:
                    ks.paths.add(sk_b, f'key_blocks["{kb.name}"].value',
                                 index=-1, group_method='NAMED', group_name=f"{child.name} Expressions")

bpy.utils.register_class(HoloflowVrmCaptureKSI)
print(f"[{SLUG}] '{HoloflowVrmCaptureKSI.bl_label}' registered in keying_sets_all")`,
      },
      {
        title: "Batch keyframe insertion and GLB export",
        body: `"""
Iterating ks.paths and calling ksp.id.keyframe_insert() is the reliable
headless pattern — no operator context or pose-mode requirement.
ksp.array_index is the stored index (-1 = whole vector = all XYZ components).
export_apply=False keeps shape key animation live; export_animations=True packs
the keyed action as a glTF animation clip for three-vrm's AnimationMixer.
"""
bpy.context.view_layer.objects.active = arm_ob
arm_ob.select_set(True)
bpy.ops.object.mode_set(mode='POSE')

head_pb  = arm_ob.pose.bones["Head"]
happy_kb = skeys.key_blocks.get("happy")
blink_kb = skeys.key_blocks.get("blink")

TIMELINE = {1:(0.0,0.0,0.0,0.0), 12:(0.35,0.8,0.0,0.0),
            24:(0.0,0.0,1.0,0.0), 36:(0.0,0.0,1.0,1.0), 48:(0.0,0.0,0.0,0.0)}

for frame,(rx,nod,happy,blink) in TIMELINE.items():
    sc.frame_set(frame)
    head_pb.rotation_mode="XYZ"; head_pb.rotation_euler=(rx,0.0,0.0)
    head_pb["rig_nod"]=nod
    if happy_kb: happy_kb.value = happy
    if blink_kb: blink_kb.value = blink
    for ksp in ks.paths:
        try: ksp.id.keyframe_insert(data_path=ksp.data_path, index=ksp.array_index, frame=frame)
        except Exception: pass
    print(f"[{SLUG}] frame {frame} keyed")

sc.frame_start=1; sc.frame_end=48
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//keying_set_vrm_capture.glb"),
    export_format='GLB', use_selection=False, export_apply=False,
    export_morph=True, export_morph_normal=True, export_morph_tangent=False,
    export_animations=True, export_nla_strips=False,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_image_format='WEBP', export_yup=True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//keying_set_vrm_capture.blend"))
bpy.utils.unregister_class(HoloflowVrmCaptureKSI)
print(f"[{SLUG}] done — keying_set_vrm_capture.glb")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-keying-set-vrm-auto-key-capture",
    title:
      "Python bpy.types.KeyingSet + KeyingSetInfo — Custom VRM Auto-Key Capture Pipeline: Paths API, Dynamic KSI & Batch Keyframe Insertion (Blender 5.1)",
    description:
      "Build a 'Holoflow VRM Capture' keying set in Blender 5.1 Python: enumerate deform-bone transforms, rig control dials, and VRM expression shape keys via ks.paths.add() with the correct id data-block per channel type; register a KeyingSetInfo subclass for live-adaptive path generation; and batch-insert keyframes by iterating ksp.id.keyframe_insert() for a reliable headless GLB export with animation.",
    topic: "scripting",
    tags: ["blender","python","keying-set","keyframe","vrm","animation","bpy","armature","shape-keys","webxr","glb","scripting"],
    date: "2026-07-12",
    body: <Body />,
  }
);
