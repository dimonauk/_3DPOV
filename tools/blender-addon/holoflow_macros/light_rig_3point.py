# holoflow_macros/light_rig_3point.py
# Operator: Holoflow — Create 3-Point Light Rig
# Registers as: holoflow.light_rig_3point
# Blender 5.1 — Holoflow Studio
#
# Wraps blueprint.py logic as a registered bpy.types.Operator so it can be
# called from a panel, pie menu, or the F3 search bar. All parameters are
# exposed as operator properties so the Redo panel lets the user adjust values
# after running.

import bpy
import math
import json
from mathutils import Vector
from bpy.props import FloatProperty, FloatVectorProperty, StringProperty


class HOLOFLOW_OT_light_rig_3point(bpy.types.Operator):
    """Create a scripted 3-point lighting rig (Key/Fill/Rim) with EEVEE Next light groups"""

    bl_idname = "holoflow.light_rig_3point"
    bl_label  = "HF: 3-Point Light Rig"
    bl_options = {'REGISTER', 'UNDO'}

    subject_radius: FloatProperty(
        name="Subject Radius", default=1.0, min=0.1, max=20.0,
        description="Bounding radius of the lit subject; scales all rig distances",
    )
    key_energy: FloatProperty(
        name="Key Energy (W)", default=800.0, min=0.0, max=100000.0,
    )
    fill_energy: FloatProperty(
        name="Fill Energy (W)", default=300.0, min=0.0, max=100000.0,
    )
    rim_energy: FloatProperty(
        name="Rim Energy (W)", default=550.0, min=0.0, max=100000.0,
    )
    key_az_deg: FloatProperty(
        name="Key Azimuth (°)", default=45.0, min=-180.0, max=180.0,
    )
    rim_cone_deg: FloatProperty(
        name="Rim Cone (°)", default=28.0, min=5.0, max=90.0,
    )
    export_json: bpy.props.BoolProperty(
        name="Export light_rig.json", default=False,
    )

    def execute(self, context):
        r = self.subject_radius
        col   = context.scene.collection
        scene = context.scene

        # ── helpers ────────────────────────────────────────────────────────────
        def sph(az_deg, el_deg, dist):
            az = math.radians(az_deg)
            el = math.radians(el_deg)
            return Vector((
                dist * math.sin(az) * math.cos(el),
               -dist * math.cos(az) * math.cos(el),
                dist * math.sin(el),
            ))

        def make_light(name, ltype, energy, color, loc):
            ld = bpy.data.lights.new(name=name, type=ltype)
            ld.energy     = energy
            ld.color      = color
            ld.use_shadow = True
            obj = bpy.data.objects.new(name, ld)
            col.objects.link(obj)
            obj.location  = loc
            d = (-loc).normalized()
            obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
            return obj, ld

        # ── rig Empty ──────────────────────────────────────────────────────────
        rig = bpy.data.objects.new("LightRig_3Point", None)
        rig.empty_display_type = 'SPHERE'
        rig.empty_display_size = r * 0.2
        col.objects.link(rig)

        # ── key ────────────────────────────────────────────────────────────────
        key_obj, key_ld = make_light(
            "Key_Area", 'AREA', self.key_energy,
            (1.00, 0.95, 0.85), sph(self.key_az_deg, 40.0, r * 5.0),
        )
        key_ld.shape  = 'RECTANGLE'
        key_ld.size   = r * 1.20
        key_ld.size_y = r * 0.60
        key_ld.spread = math.radians(160)

        # ── fill ───────────────────────────────────────────────────────────────
        fill_obj, fill_ld = make_light(
            "Fill_Disk", 'AREA', self.fill_energy,
            (0.82, 0.88, 1.00), sph(self.key_az_deg + 180.0, 20.0, r * 5.5),
        )
        fill_ld.shape  = 'DISK'
        fill_ld.size   = r * 0.90
        fill_ld.spread = math.radians(150)

        # ── rim ────────────────────────────────────────────────────────────────
        rim_obj, rim_ld = make_light(
            "Rim_Spot", 'SPOT', self.rim_energy,
            (0.92, 0.97, 1.00), sph(self.key_az_deg + 135.0, 55.0, r * 4.5),
        )
        rim_ld.spot_size        = math.radians(self.rim_cone_deg)
        rim_ld.spot_blend       = 0.12
        rim_ld.shadow_soft_size = r * 0.06

        # ── parent ─────────────────────────────────────────────────────────────
        for lo in (key_obj, fill_obj, rim_obj):
            lo.parent = rig
            lo.matrix_parent_inverse = rig.matrix_world.inverted()

        # ── light groups ───────────────────────────────────────────────────────
        vl = scene.view_layers[0]
        for g in ('key', 'fill', 'rim'):
            if g not in {lg.name for lg in vl.lightgroups}:
                vl.lightgroups.new(name=g)
        key_obj.lightgroup  = 'key'
        fill_obj.lightgroup = 'fill'
        rim_obj.lightgroup  = 'rim'
        vl.use_pass_diffuse_direct = True

        if scene.render.engine not in ('BLENDER_EEVEE_NEXT', 'CYCLES'):
            scene.render.engine = 'BLENDER_EEVEE_NEXT'

        # ── optional JSON export ────────────────────────────────────────────────
        if self.export_json and bpy.data.filepath:
            def bl_to_three(v):
                return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]
            rig_data = {
                "schema": "holoflow_light_rig_v1",
                "rig_name": "3PointRig",
                "lights": [
                    {"name": key_obj.name,  "type": "RectAreaLight",
                     "energy_watts": self.key_energy,
                     "width_m": float(key_ld.size), "height_m": float(key_ld.size_y),
                     "position_threejs": bl_to_three(key_obj.location)},
                    {"name": fill_obj.name, "type": "RectAreaLight",
                     "energy_watts": self.fill_energy,
                     "width_m": float(fill_ld.size) * 2, "height_m": float(fill_ld.size) * 2,
                     "position_threejs": bl_to_three(fill_obj.location)},
                    {"name": rim_obj.name,  "type": "SpotLight",
                     "energy_watts": self.rim_energy,
                     "angle_rad": float(rim_ld.spot_size) * 0.5,
                     "penumbra": float(rim_ld.spot_blend),
                     "position_threejs": bl_to_three(rim_obj.location)},
                ],
            }
            import os
            json_path = os.path.join(
                os.path.dirname(bpy.data.filepath), "light_rig.json"
            )
            with open(json_path, 'w') as fp:
                json.dump(rig_data, fp, indent=2)
            self.report({'INFO'}, f"light_rig.json written to {json_path}")

        self.report({'INFO'}, "3-Point Light Rig created")
        return {'FINISHED'}


def register():
    bpy.utils.register_class(HOLOFLOW_OT_light_rig_3point)


def unregister():
    bpy.utils.unregister_class(HOLOFLOW_OT_light_rig_3point)
