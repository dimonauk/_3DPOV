"""
holoflow_macros/keying_set_vrm_capture.py
Blender 5.1  |  CC0  |  Holoflow Studio

Reusable macro: given an open .blend with a VRM-style armature active, builds
(or rebuilds) the "Holoflow VRM Capture" scene keying set for the current
scene.  Run from the Scripting workspace on any rig that follows the studio
conventions:
  • use_deform=True on bones you want captured
  • rig_ prefix on custom properties that are rig control dials
  • child meshes carry shape keys named with VRM 1.0 preset strings

Usage
-----
  blender my_rig.blend --background --python holoflow_macros/keying_set_vrm_capture.py
  # or paste into the Scripting workspace and Run Script

Output
------
  Scene keying set "Holoflow VRM Capture" created / refreshed on bpy.context.scene.
"""
import bpy

VRM_PRESETS = {
    "happy","angry","sad","surprised","relaxed",
    "aa","ih","ou","ee","oh",
    "blink","blinkLeft","blinkRight",
    "lookUp","lookDown","lookLeft","lookRight","neutral",
}

KS_NAME  = "Holoflow VRM Capture"
KS_IDNAME = "HOLOFLOW_vrm_capture"


def build_ks(context, arm_ob):
    sc = context.scene

    # Remove stale version so we start fresh
    existing = sc.keying_sets.get(KS_NAME)
    if existing:
        sc.keying_sets.remove(existing)

    ks = sc.keying_sets.new(idname=KS_IDNAME, name=KS_NAME)
    ks.bl_description = (
        "Holoflow full VRM capture — deform bones, rig control dials, "
        "and VRM 1.0 expression shape keys on child meshes."
    )

    path_count = 0

    # ── Deform bone transforms + rig_ custom properties ─────────────────────
    for pb in arm_ob.pose.bones:
        if not arm_ob.data.bones[pb.name].use_deform:
            continue
        pfx = f'pose.bones["{pb.name}"]'
        for prop in ("location", "rotation_euler", "scale"):
            ks.paths.add(arm_ob, f"{pfx}.{prop}", index=-1,
                         group_method='NAMED', group_name=pb.name)
            path_count += 1
        for kn in pb.keys():
            if kn.startswith("rig_"):
                ks.paths.add(arm_ob, f'{pfx}["{kn}"]', index=-1,
                             group_method='NAMED', group_name=f"{pb.name} Controls")
                path_count += 1

    # ── VRM expression shape keys on child meshes ────────────────────────────
    for child in arm_ob.children:
        if child.type != 'MESH':
            continue
        if not (child.data and child.data.shape_keys):
            continue
        skeys = child.data.shape_keys
        for kb in skeys.key_blocks:
            if kb.name not in VRM_PRESETS:
                continue
            ks.paths.add(skeys, f'key_blocks["{kb.name}"].value', index=-1,
                         group_method='NAMED', group_name=f"{child.name} Expressions")
            path_count += 1

    print(f"[holoflow] '{KS_NAME}': {path_count} paths built on '{sc.name}'")
    return ks


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ctx = bpy.context
    ob  = ctx.active_object
    if ob is None or ob.type != 'ARMATURE':
        raise RuntimeError(
            "Select an ARMATURE object before running this macro."
        )
    build_ks(ctx, ob)
