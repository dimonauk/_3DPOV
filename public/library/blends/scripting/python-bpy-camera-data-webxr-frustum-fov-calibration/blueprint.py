"""
bpy.types.Camera — Sensor Intrinsics, Off-Axis Shift & WebXR Frustum Calibration
Blender 5.1 | CC0 – Holoflow Studio

Technique: Create a Camera data block via the direct data API (no operator),
configure every intrinsic property, compute the OpenGL projection matrix from
those intrinsics, and export a camera_intrinsics.json sidecar for the WebXR
runtime.  A 360° orbit animation demonstrates the live frustum in context.

Run: Scripting workspace → Run Script, or:
  blender --background --python blueprint.py
Outputs: camera_intrinsics.json, camera_orbit.glb (relative to .blend)
"""

import bpy, json, math, mathutils

# ── Named constants ──────────────────────────────────────────────────────────
FOCAL_LENGTH_MM   = 18.0          # 18 mm EFL → ~90° H FoV on 24 mm sensor
SENSOR_WIDTH_MM   = 24.0          # full-frame landscape horizontal
SENSOR_HEIGHT_MM  = 18.0          # full-frame landscape vertical (4:3 crop)
SENSOR_FIT        = 'HORIZONTAL'  # FoV is driven by the horizontal dimension
CLIP_NEAR         = 0.05          # 5 cm – matches THREE.js PerspectiveCamera default
CLIP_FAR          = 500.0
FSTOP             = 2.0           # wide aperture for visible bokeh at 3 m
DOF_FOCUS_M       = 3.0           # focus distance in metres
SHIFT_X           = 0.0           # lateral frustum offset (0 = symmetric)
SHIFT_Y           = 0.0           # vertical frustum offset

ORBIT_RADIUS      = 5.0           # camera orbits 5 m from world origin
ORBIT_HEIGHT      = 2.0           # camera height above ground plane
FRAME_START       = 1
FRAME_END         = 72            # 3 s at 24 fps – full 360° orbit

OUTPUT_GLB        = "//camera_orbit.glb"
OUTPUT_JSON       = "//camera_intrinsics.json"


# ── Helpers ──────────────────────────────────────────────────────────────────

def fov_degrees(focal_mm: float, sensor_mm: float) -> float:
    """FoV for one sensor axis.  Pass sensor_width for H, sensor_height for V."""
    return math.degrees(2.0 * math.atan(sensor_mm / (2.0 * focal_mm)))


def blender_projection_matrix(
    focal_mm: float,
    sensor_w: float,
    sensor_h: float,
    near: float,
    far: float,
    shift_x: float = 0.0,
    shift_y: float = 0.0,
) -> list:
    """
    Build the OpenGL/WebGL clip-space projection matrix from Blender's camera
    intrinsics.  Returned as a row-major list-of-lists (same layout as
    THREE.Matrix4.toArray() / WebXR XRProjectionLayer).

    Derivation:
      Blender normalises focal length to sensor width:
        f_x = focal_mm / sensor_w   (dimensionless, ~0.75 for an 18 mm / 24 mm lens)
      NDC X scale (column 0, row 0):
        P[0][0] = 2 * f_x
      NDC Y scale — driven by sensor_h when HORIZONTAL fit is active:
        P[1][1] = 2 * (focal_mm / sensor_h)
      Off-axis shift adds a column-2 translation in NDC:
        P[0][2] = -2 * shift_x   (shift is in units of sensor_w)
        P[1][2] = -2 * shift_y   (shift is in units of sensor_h)
      Standard OpenGL depth mapping (reversed-Z requires negating signs):
        P[2][2] = -(far + near) / (far - near)
        P[3][2] = -1.0           (perspective divide hook)
        P[2][3] = -2 * far * near / (far - near)
    """
    f_x = focal_mm / sensor_w
    f_y = focal_mm / sensor_h

    m = mathutils.Matrix.Identity(4)
    m[0][0] =  2.0 * f_x
    m[1][1] =  2.0 * f_y
    # Off-axis: shift is a fraction of sensor dimension, maps to clip-space offset
    m[0][2] = -2.0 * shift_x
    m[1][2] = -2.0 * shift_y
    m[2][2] = -(far + near) / (far - near)
    m[2][3] = -1.0
    m[3][2] = -2.0 * far * near / (far - near)
    m[3][3] =  0.0

    return [list(row) for row in m]


def export_intrinsics_json(cam: "bpy.types.Camera", filepath: str) -> None:
    hfov = fov_degrees(cam.lens, cam.sensor_width)
    vfov = fov_degrees(cam.lens, cam.sensor_height)
    proj = blender_projection_matrix(
        cam.lens, cam.sensor_width, cam.sensor_height,
        cam.clip_start, cam.clip_end,
        cam.shift_x, cam.shift_y,
    )
    payload = {
        "focal_length_mm":   cam.lens,
        "sensor_width_mm":   cam.sensor_width,
        "sensor_height_mm":  cam.sensor_height,
        "sensor_fit":        cam.sensor_fit,
        "hfov_deg":          round(hfov, 4),
        "vfov_deg":          round(vfov, 4),
        "clip_near":         cam.clip_start,
        "clip_far":          cam.clip_end,
        "shift_x":           cam.shift_x,
        "shift_y":           cam.shift_y,
        "dof_enabled":       cam.dof.use_dof,
        "dof_fstop":         cam.dof.aperture_fstop if cam.dof.use_dof else None,
        "dof_focus_m":       cam.dof.focus_distance  if cam.dof.use_dof else None,
        "projection_matrix": proj,
        "three_js_note": (
            f"camera.fov = {round(vfov, 2)}; "
            f"camera.aspect = {round(cam.sensor_width / cam.sensor_height, 4)}; "
            "camera.near = clip_near; camera.far = clip_far; "
            "camera.updateProjectionMatrix();"
        ),
        "blender_version":   "5.1",
        "axis_note": (
            "Blender: Z-up right-handed.  "
            "Three.js / WebXR: Y-up right-handed.  "
            "Apply glTF axis remap (scene.rotateX(-Math.PI/2)) or "
            "export_yup=True in bpy.ops.export_scene.gltf."
        ),
    }
    abs_path = bpy.path.abspath(filepath)
    with open(abs_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
    print(f"[holoflow] intrinsics → {abs_path}")
    print(f"[holoflow] FoV  H={hfov:.2f}°  V={vfov:.2f}°")
    print(f"[holoflow] Three.js snippet:  {payload['three_js_note']}")


# ── Scene construction ───────────────────────────────────────────────────────

def build_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END

    # Subject icosphere at 1 m height — gives the camera something to frame
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.5, location=(0.0, 0.0, 1.0))
    subject      = bpy.context.active_object
    subject.name = "subject"

    # TrackTo target: empty at subject centre
    bpy.ops.object.empty_add(type='SPHERE', radius=0.08, location=(0.0, 0.0, 1.0))
    target      = bpy.context.active_object
    target.name = "cam_target"

    # ── Camera data block — direct API, no operator ──────────────────────────
    cam_data = bpy.data.cameras.new("orbit_cam")

    cam_data.lens          = FOCAL_LENGTH_MM
    cam_data.sensor_width  = SENSOR_WIDTH_MM
    cam_data.sensor_height = SENSOR_HEIGHT_MM
    cam_data.sensor_fit    = SENSOR_FIT        # 'HORIZONTAL' | 'VERTICAL' | 'AUTO'
    cam_data.clip_start    = CLIP_NEAR
    cam_data.clip_end      = CLIP_FAR
    cam_data.shift_x       = SHIFT_X           # units: fraction of sensor_width
    cam_data.shift_y       = SHIFT_Y           # units: fraction of sensor_height

    cam_data.dof.use_dof         = True
    cam_data.dof.aperture_fstop  = FSTOP
    cam_data.dof.focus_distance  = DOF_FOCUS_M

    # ── Camera object ─────────────────────────────────────────────────────────
    cam_obj = bpy.data.objects.new("orbit_cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj   # designate as scene's active camera

    # Track-To constraint: camera -Z always aims at cam_target
    cst            = cam_obj.constraints.new('TRACK_TO')
    cst.target     = target
    cst.track_axis = 'TRACK_NEGATIVE_Z'  # camera look direction is -Z in Blender
    cst.up_axis    = 'UP_Y'

    # ── Orbit animation ───────────────────────────────────────────────────────
    cam_obj.animation_data_create()

    for frame in range(FRAME_START, FRAME_END + 1):
        scene.frame_set(frame)
        t     = (frame - FRAME_START) / max(1, FRAME_END - FRAME_START)
        angle = 2.0 * math.pi * t                  # full 360° orbit
        x     = ORBIT_RADIUS * math.cos(angle)
        y     = ORBIT_RADIUS * math.sin(angle)
        cam_obj.location = mathutils.Vector((x, y, ORBIT_HEIGHT))
        cam_obj.keyframe_insert(data_path='location', frame=frame)

    bpy.context.view_layer.update()

    # ── Emit intrinsics sidecar ───────────────────────────────────────────────
    export_intrinsics_json(cam_data, OUTPUT_JSON)


def export_glb() -> None:
    bpy.ops.export_scene.gltf(
        filepath                             = bpy.path.abspath(OUTPUT_GLB),
        export_format                        = 'GLB',
        use_selection                        = False,
        export_cameras                       = True,   # embed Camera object in GLB
        export_animations                    = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_yup                           = True,   # Y-up for WebXR/Three.js
    )
    print(f"[holoflow] GLB → {bpy.path.abspath(OUTPUT_GLB)}")


build_scene()
export_glb()
