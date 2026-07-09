import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s camera is, at its core, four numbers: focal length,
        sensor dimension, clip planes, and an optional frustum shift. From those
        four numbers you can derive the full optical geometry — field of view,
        aspect ratio, and the OpenGL projection matrix that drives every render
        and viewport. The problem is that <code>bpy.types.Camera</code> hides
        the maths behind property names that don&rsquo;t map cleanly to the
        formulas you&rsquo;d find in a computer-graphics textbook. This
        blueprint makes each step explicit: create the data block directly (no
        operator context required), set every intrinsic with named constants,
        then derive the projection matrix in pure Python so you can emit a
        sidecar JSON that a Three.js or WebXR runtime can consume without any
        guesswork. The connection to the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-camera-rig-dolly-focus-pull"
          className={lk}
        >
          dolly focus-pull rig tutorial
        </Link>{" "}
        is that the rig there animates <code>dof.focus_distance</code> — but
        it starts from a camera object that already exists. Here you build that
        camera from scratch, and the intrinsics you set now are the ones the
        animated rig will inherit.
      </p>

      <p>
        The critical property is <code>cam.sensor_fit</code>.{" "}
        <code>&lsquo;HORIZONTAL&rsquo;</code> means the horizontal sensor
        dimension drives the field of view: if you change the render resolution
        aspect ratio, the vertical FoV adjusts to fit, and the horizontal FoV
        stays fixed. <code>&lsquo;VERTICAL&rsquo;</code> locks the vertical FoV
        instead. <code>&lsquo;AUTO&rsquo;</code> picks whichever dimension is
        larger — portrait and landscape renders produce different FoVs from the
        same lens, which is usually wrong for a calibrated output. Almost every
        studio should use <code>&lsquo;HORIZONTAL&rsquo;</code> explicitly.
        The FoV formula for a single axis is{" "}
        <code>2 · arctan(sensor_dim / (2 · focal_mm))</code> — an 18 mm lens
        on a 24 mm sensor gives a horizontal FoV of exactly 90°, which matches
        the default horizontal FoV of a Quest 3 HMD. The companion formula for
        Three.js is{" "}
        <code>
          camera.fov = vfov_deg; camera.aspect = sensor_w / sensor_h;
        </code>{" "}
        — Three.js <code>PerspectiveCamera.fov</code> is the{" "}
        <em>vertical</em> FoV in degrees, so always convert. The Blender
        Foundation&rsquo;s{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Camera.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Camera API reference (CC-BY-4.0)
        </a>{" "}
        documents every property used here, including the less-documented{" "}
        <code>sensor_height</code> — note that it is only active when{" "}
        <code>sensor_fit = &lsquo;VERTICAL&rsquo;</code>; in HORIZONTAL mode
        Blender computes the effective vertical sensor from{" "}
        <code>sensor_width / aspect_ratio</code> at render time.
      </p>

      <p>
        Off-axis shift (<code>cam.shift_x / cam.shift_y</code>) is Blender&rsquo;s
        name for frustum asymmetry: the principal point moves away from the
        image centre. Shift is expressed in units of sensor width/height (not
        pixels), so <code>shift_x = 0.5</code> moves the principal point a
        full sensor-width to the right. In the projection matrix this becomes a
        translation of the clip-space X column:{" "}
        <code>P[0][2] = -2 · shift_x</code>. The negative sign comes from
        OpenGL&rsquo;s column-major convention where the translation column
        index is 3, but Blender places it in the third column (index 2) of its
        row-major layout. Getting this sign wrong produces a frustum that
        appears to work until you cross-check it against a real lens profile or
        a multi-projector blend overlap — the off-axis correction will be
        mirrored. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-movieclip-motion-tracking-camera-solve-webxr-ar"
          className={lk}
        >
          motion-tracking camera solve tutorial
        </Link>{" "}
        arrives at a solved camera with a non-zero shift because real lenses are
        rarely centred on the sensor; this blueprint is how you inspect and
        replicate that solved frustum in a fresh scene.
      </p>

      <p>
        The exported <code>camera_intrinsics.json</code> is the handshake
        between Blender and the WebXR runtime. It carries the projection matrix
        in row-major order (matching{" "}
        <code>THREE.Matrix4.toArray()</code>), the FoV values in degrees for
        readability, and a one-line Three.js snippet you can paste directly. The{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/src/cameras/PerspectiveCamera.js"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Three.js PerspectiveCamera source (MIT, mrdoob)
        </a>{" "}
        internally stores focal length as{" "}
        <code>focal = 0.5 / tan(fov * π / 360)</code>, the exact inverse of
        the Blender formula — so a round-trip of Blender lens → JSON FoV →
        Three.js lens is lossless. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-render-engine-webxr-snapshot"
          className={lk}
        >
          custom render engine snapshot tutorial
        </Link>{" "}
        uses the same projection-matrix pipeline on the GPU side: the camera
        intrinsics here define the view frustum that the custom engine captures.
        Axis convention: Blender exports with Z-up; Three.js / WebXR expects
        Y-up right-handed. The GLB exporter&rsquo;s{" "}
        <code>export_yup=True</code> parameter applies the{" "}
        <code>rotateX(-π/2)</code> correction at export time so the camera
        object lands in the correct orientation inside the WebXR scene.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-bpy-camera-data-webxr-frustum-fov-calibration",
  title:
    "Python bpy.types.Camera — Sensor Intrinsics, Off-Axis Shift & WebXR Projection Matrix Calibration",
  lede: "Build a Camera data block from scratch, compute the OpenGL projection matrix from focal length and sensor size, handle off-axis shift for asymmetric frustums, and export a camera_intrinsics.json sidecar for Three.js / WebXR.",
  date: "2026-07-09",
  author: "Holoflow Studio",
  tags: [
    "blender",
    "python",
    "bpy",
    "camera",
    "frustum",
    "fov",
    "projection-matrix",
    "sensor",
    "dof",
    "webxr",
    "three.js",
    "scripting",
    "calibration",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-bpy-camera-data-webxr-frustum-fov-calibration",
    time: "thirty-five minutes",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable in the Scripting workspace; understands bpy.data vs bpy.ops",
      "Basic understanding of focal length and field of view from photography",
      "Has reviewed the dolly focus-pull camera rig tutorial (or equivalent)",
    ],
    steps: [
      {
        title:
          "Understand sensor_fit, lens, and the FoV formula — three numbers govern everything",
        body: "# Blender Camera Intrinsic Properties\n\ncam.lens        — Effective focal length in mm. Governs angular compression.\ncam.sensor_width  — Horizontal sensor dimension in mm (default 36 mm = full-frame).\ncam.sensor_height — Vertical sensor dimension in mm (default 24 mm).\ncam.sensor_fit   — Which sensor dimension DRIVES FoV:\n  'HORIZONTAL': horizontal FoV fixed; vertical follows aspect ratio.  USE THIS.\n  'VERTICAL':   vertical FoV fixed; horizontal follows aspect ratio.\n  'AUTO':       the larger dimension drives (changes with aspect ratio). AVOID.\n\n# FoV formula — horizontal and vertical:\nimport math\ndef fov_degrees(focal_mm, sensor_mm):\n    return math.degrees(2.0 * math.atan(sensor_mm / (2.0 * focal_mm)))\n\nhfov = fov_degrees(18.0, 24.0)   # → 90.00°  (18 mm lens on 24 mm sensor)\nvfov = fov_degrees(18.0, 18.0)   # → 73.74°  (derived vertical at 4:3 crop)\n\n# Three.js PerspectiveCamera:\n# camera.fov    = vfov_deg   (Three.js fov is the VERTICAL angle)\n# camera.aspect = hfov_width / vfov_height = sensor_w / sensor_h\n# camera.near   = cam.clip_start\n# camera.far    = cam.clip_end\n\n# WHY use bpy.data.cameras.new() instead of bpy.ops.object.camera_add()?\n#   bpy.ops.object.camera_add() requires an active VIEW_3D area with OBJECT mode;\n#   it silently does nothing (returns CANCELLED) in headless / background scripts.\n#   bpy.data.cameras.new(name) creates the Camera ID block regardless of context.\n#   You then create an object wrapper: bpy.data.objects.new(name, cam_data)\n#   and link it: scene.collection.objects.link(cam_obj).\n#   This pattern works headless, in modal operators, and from add-on panels.\n\n# TROUBLESHOOTING:\n#   'Horizontal and vertical FoV seem swapped':\n#     Check sensor_fit. If set to AUTO and render resolution is portrait,\n#     Blender treats sensor_height as the driving dimension — switch to HORIZONTAL.\n#   'camera.fov in Three.js gives wrong result':\n#     Three.js fov is vertical degrees; Blender's Lens Angle readout in the UI\n#     shows horizontal. Always convert with the fov_degrees() formula above.",
      },
      {
        title:
          "Create the Camera data block and link it to the scene — direct data API",
        body: "import bpy, math, mathutils\n\nFOCAL_LENGTH_MM  = 18.0\nSENSOR_WIDTH_MM  = 24.0\nSENSOR_HEIGHT_MM = 18.0\nSENSOR_FIT       = 'HORIZONTAL'\nCLIP_NEAR        = 0.05\nCLIP_FAR         = 500.0\n\nscene = bpy.context.scene\n\n# ── Camera DATA block (the optical properties) ───────────────────────────────\ncam_data = bpy.data.cameras.new('orbit_cam')\ncam_data.lens          = FOCAL_LENGTH_MM\ncam_data.sensor_width  = SENSOR_WIDTH_MM\ncam_data.sensor_height = SENSOR_HEIGHT_MM   # only read when sensor_fit = 'VERTICAL'\ncam_data.sensor_fit    = SENSOR_FIT\ncam_data.clip_start    = CLIP_NEAR\ncam_data.clip_end      = CLIP_FAR\n\n# ── Camera OBJECT (position, orientation, constraints) ────────────────────────\ncam_obj = bpy.data.objects.new('orbit_cam', cam_data)   # wrap data in an object\nscene.collection.objects.link(cam_obj)                   # add to root collection\nscene.camera = cam_obj                                   # designate active camera\n\n# Optional: position the camera manually (later overridden by orbit keyframes)\ncam_obj.location = mathutils.Vector((0.0, -5.0, 2.0))\n\n# WHY separate data block from object?\n#   bpy.types.Camera (the data block) stores the OPTICAL properties.\n#   bpy.types.Object (the wrapper) stores TRANSFORM and constraints.\n#   Multiple objects can SHARE one Camera data block — useful for a multi-view\n#   rig where all cameras share the same lens but orbit to different positions.\n#   Scene.camera points to an OBJECT, not a data block.\n#\n# VERIFY in the UI:\n#   Select the camera → Properties → Object Data Properties (camera icon).\n#   Lens = 18.0 mm, Sensor Width = 24.0 mm, sensor_fit = Horizontal.\n#   Clip Start = 0.05 m, Clip End = 500 m.\n#\n# TROUBLESHOOTING:\n#   'scene.camera is None after the script':\n#     You linked cam_obj to scene.collection but forgot scene.camera = cam_obj.\n#     The camera exists in the scene but isn't designated as the active camera.\n#   'bpy.data.objects.new() produced a generic object, not a camera':\n#     The second argument to bpy.data.objects.new() must be a Camera data block,\n#     not None. Passing None creates a MESH object with no data.",
      },
      {
        title:
          "Compute the projection matrix from Blender intrinsics — derive for WebXR",
        body: "def blender_projection_matrix(\n    focal_mm, sensor_w, sensor_h, near, far, shift_x=0.0, shift_y=0.0\n):\n    \"\"\"\n    Row-major projection matrix matching Blender's frustum definition.\n\n    Derivation:\n      Blender normalises focal length to sensor_width:\n        f_x = focal_mm / sensor_w   (~0.75 for 18 mm / 24 mm)\n      NDC X scale:  P[0][0] = 2 * f_x\n      NDC Y scale:  P[1][1] = 2 * (focal_mm / sensor_h)\n      Off-axis shift:\n        P[0][2] = -2 * shift_x   (shift in units of sensor_w)\n        P[1][2] = -2 * shift_y   (shift in units of sensor_h)\n      Standard depth mapping (OpenGL convention):\n        P[2][2] = -(far + near) / (far - near)\n        P[2][3] = -1.0           (perspective divide)\n        P[3][2] = -2 * far * near / (far - near)\n    \"\"\"\n    import mathutils\n    f_x = focal_mm / sensor_w\n    f_y = focal_mm / sensor_h\n\n    m = mathutils.Matrix.Identity(4)\n    m[0][0] =  2.0 * f_x\n    m[1][1] =  2.0 * f_y\n    m[0][2] = -2.0 * shift_x\n    m[1][2] = -2.0 * shift_y\n    m[2][2] = -(far + near) / (far - near)\n    m[2][3] = -1.0\n    m[3][2] = -2.0 * far * near / (far - near)\n    m[3][3] =  0.0\n    return [list(row) for row in m]\n\n# For the constants above: focal=18, sensor_w=24, sensor_h=18, near=0.05, far=500\nproj = blender_projection_matrix(18.0, 24.0, 18.0, 0.05, 500.0)\nprint('P[0][0] (NDC X scale):', proj[0][0])   # → 1.5  (2 * 18/24)\nprint('P[1][1] (NDC Y scale):', proj[1][1])   # → 2.0  (2 * 18/18)\n\n# WHY compute this in Python rather than reading cam.projection_matrix?\n#   bpy.types.Camera has NO projection_matrix property — Blender only exposes it\n#   through bpy.context.scene.camera.calc_matrix_camera(deps) which requires\n#   an evaluated depsgraph and a render resolution.  The manual computation is\n#   stable, context-free, and produces the same matrix as Blender's renderer.\n#\n# CROSS-CHECK against THREE.js PerspectiveCamera:\n#   camera.projectionMatrix after updateProjectionMatrix() should match exactly.\n#   THREE stores in column-major (elements[] is column-by-column).\n#   To compare:  threeMatrix.elements[0] == blenderMatrix[0][0]\n#\n# TROUBLESHOOTING:\n#   'NDC Y scale is larger than NDC X scale':\n#     Expected — 18/18 > 18/24 (sensor_h < sensor_w for landscape); vertical\n#     scale is larger because the frustum is narrower vertically.\n#   'Projection matrix produces wrong depth in shader':\n#     WebGL NDC depth is [-1, +1]; reversed-Z buffers negate P[2][2] and P[3][2].\n#     Standard WebGL / Three.js uses the convention above (no reversal needed).",
      },
      {
        title:
          "Off-axis shift: shift_x / shift_y for asymmetric frustums",
        body: "# Off-axis shift moves the principal point away from the image centre.\n# Use cases:\n#   • Multi-projector blending overlap (SHIFT_X = 0.3 for 30% overlap zone)\n#   • Motion-tracking-solved cameras (non-zero shift common after solve)\n#   • VR display distortion pre-correction (shift per eye)\n#   • Architectural renderings looking parallel to floor (SHIFT_Y = -0.3)\n\n# Shift is a FRACTION of the sensor dimension, not pixels:\n#   shift_x = 0.5  → principal point displaced one full sensor-width to the right\n#   shift_x = 0.1  → 10% of sensor_width to the right\n\ncam_data.shift_x = 0.10   # nudge principal point rightward by 10% of sensor_width\ncam_data.shift_y = 0.00\n\n# How it appears in the projection matrix:\n#   P[0][2] = -2 * shift_x = -0.20   (NDC column-2 translation in X)\n#   P[1][2] = -2 * shift_y =  0.00   (unchanged)\n\n# THREE.js equivalent for the same off-axis shift:\n#   camera.setViewOffset(\n#       fullWidth, fullHeight,      # total tiled mosaic dimensions\n#       offsetX,   offsetY,         # this camera's pixel offset in the mosaic\n#       viewWidth, viewHeight,      # this camera's viewport dimensions\n#   )\n#   setViewOffset MODIFIES the projection matrix directly.\n#   A simpler route: manually set camera.projectionMatrix.elements[] from the JSON.\n\n# To RESET shift after a motion-tracking session:\ncam_data.shift_x = 0.0\ncam_data.shift_y = 0.0\n\n# TROUBLESHOOTING:\n#   'Off-axis correction is mirrored (corrects the wrong side)':\n#     The sign of shift_x in the blueprint matches Blender's UI convention\n#     (positive → right).  THREE.js setViewOffset() uses pixel offsets from\n#     the top-left corner — make sure you account for the coordinate origin.\n#   'Shift causes render to be cropped at the edge':\n#     A large shift can push the frustum so the subject exits the frame.\n#     Keep |shift_x| < 0.5 unless you intentionally want a tile of a larger view.",
      },
      {
        title:
          "Depth of field: use_dof, aperture_fstop, focus_distance, focus_object",
        body: "# DOF in Blender 5.1 is a property of the Camera DATA block, not the object.\n\ncam_data.dof.use_dof         = True\ncam_data.dof.aperture_fstop  = 2.0     # f/2.0 → wide aperture, shallow DOF\ncam_data.dof.focus_distance  = 3.0     # 3 m to the sharp plane\n\n# Alternative: track focus distance to a scene object automatically\n# (object moves → focus plane tracks with it):\nsubject_obj = bpy.data.objects.get('subject')\nif subject_obj:\n    cam_data.dof.focus_object   = subject_obj\n    cam_data.dof.use_dof        = True\n    # focus_distance is ignored when focus_object is set.\n    # Blender evaluates the object's world-space distance at every frame.\n\n# Bokeh shape: cam_data.dof.aperture_blades  (0 = disc, 3–12 = polygon)\n# Rotation:    cam_data.dof.aperture_rotation (rads; rotates the blade shape)\n# Ratio:       cam_data.dof.aperture_ratio    (1.0 = circular, < 1 = oval anamorphic)\ncam_data.dof.aperture_blades   = 6     # hexagonal bokeh\ncam_data.dof.aperture_rotation = 0.0\ncam_data.dof.aperture_ratio    = 1.0\n\n# EEVEE DOF: enabled by default when use_dof = True and engine = BLENDER_EEVEE_NEXT.\n# Cycles DOF: always active when use_dof = True.\n# VIEWPORT DOF: Properties → Render → Depth of Field → ON in viewport.\n\n# WHY separate focus_distance from the camera's clip_start?\n#   clip_start is the depth buffer near plane (geometry closer is not rendered).\n#   focus_distance is the OPTICAL focus point (sharpness peak).\n#   Setting them equal is coincidence.  They are completely independent properties.\n\n# DOF in THREE.js:\n#   Three.js core has no DOF; use the BokehPass in THREE.BokehPass:\n#     const bokehPass = new BokehPass(scene, camera, { focus: 3.0, aperture: 0.001 });\n#   The aperture parameter is NOT f-stop — it is a fraction of screen size.\n#   Mapping: aperture_screen ≈ (sensor_w / focal_mm) / (2 * fstop * render_w_px)\n#\n# TROUBLESHOOTING:\n#   'DOF has no effect in EEVEE render':\n#     Check Properties → Render Properties → Depth of Field is enabled.\n#     Also verify scene.render.engine = 'BLENDER_EEVEE_NEXT' (not 'CYCLES').\n#   'Focus plane appears at wrong depth':\n#     focus_distance is in METRES from the camera origin, not from the sensor.\n#     Blender measures from cam_obj.location along cam_obj's -Z axis.",
      },
      {
        title:
          "Animate the camera on an orbit arc with TrackTo — 360° in 72 frames",
        body: "import math, mathutils\n\n# ── TrackTo constraint — camera always looks at cam_target ───────────────────\nbpy.ops.object.empty_add(type='SPHERE', radius=0.08, location=(0.0, 0.0, 1.0))\ntarget      = bpy.context.active_object\ntarget.name = 'cam_target'\n\ncst            = cam_obj.constraints.new('TRACK_TO')\ncst.target     = target\ncst.track_axis = 'TRACK_NEGATIVE_Z'  # camera look-direction is -Z in Blender\ncst.up_axis    = 'UP_Y'\n\n# WHY TRACK_NEGATIVE_Z for track_axis?\n#   Blender cameras point along their local -Z axis.  TRACK_NEGATIVE_Z aligns\n#   that local -Z toward the target.  TRACK_Z (positive) would aim the BACK of\n#   the camera at the target — common mistake.\n\n# ── Orbit keyframes ───────────────────────────────────────────────────────────\nORBIT_RADIUS = 5.0\nORBIT_HEIGHT = 2.0\nFRAME_START, FRAME_END = 1, 72\n\nbpy.context.scene.frame_start = FRAME_START\nbpy.context.scene.frame_end   = FRAME_END\n\ncam_obj.animation_data_create()\n\nfor frame in range(FRAME_START, FRAME_END + 1):\n    bpy.context.scene.frame_set(frame)\n    t     = (frame - FRAME_START) / max(1, FRAME_END - FRAME_START)\n    angle = 2.0 * math.pi * t\n    cam_obj.location = mathutils.Vector((\n        ORBIT_RADIUS * math.cos(angle),\n        ORBIT_RADIUS * math.sin(angle),\n        ORBIT_HEIGHT,\n    ))\n    cam_obj.keyframe_insert(data_path='location', frame=frame)\n\nbpy.context.view_layer.update()\n\n# TROUBLESHOOTING:\n#   'Camera orbits but does not look at the target':\n#     Verify cst.track_axis = 'TRACK_NEGATIVE_Z' (not 'TRACK_Z').\n#   'Camera flips upside-down during orbit':\n#     The camera passed directly overhead or under the target.\n#     Change ORBIT_HEIGHT to avoid the gimbal singularity, or set cst.up_axis = 'UP_Z'\n#     and rotate the target Empty so its local Z points away from the overhead zone.",
      },
      {
        title:
          "Export camera_intrinsics.json and GLB — full sidecar + WebXR handshake",
        body: "import json\n\ndef export_intrinsics_json(cam, filepath):\n    hfov = math.degrees(2.0 * math.atan(cam.sensor_width  / (2.0 * cam.lens)))\n    vfov = math.degrees(2.0 * math.atan(cam.sensor_height / (2.0 * cam.lens)))\n    proj = blender_projection_matrix(\n        cam.lens, cam.sensor_width, cam.sensor_height,\n        cam.clip_start, cam.clip_end, cam.shift_x, cam.shift_y,\n    )\n    payload = {\n        'focal_length_mm':   cam.lens,\n        'sensor_width_mm':   cam.sensor_width,\n        'sensor_height_mm':  cam.sensor_height,\n        'sensor_fit':        cam.sensor_fit,\n        'hfov_deg':          round(hfov, 4),\n        'vfov_deg':          round(vfov, 4),\n        'clip_near':         cam.clip_start,\n        'clip_far':          cam.clip_end,\n        'shift_x':           cam.shift_x,\n        'shift_y':           cam.shift_y,\n        'dof_fstop':         cam.dof.aperture_fstop if cam.dof.use_dof else None,\n        'dof_focus_m':       cam.dof.focus_distance  if cam.dof.use_dof else None,\n        'projection_matrix': proj,\n        'three_js_note': (\n            f'camera.fov={round(vfov,2)}; '\n            f'camera.aspect={round(cam.sensor_width/cam.sensor_height,4)}; '\n            'camera.near=clip_near; camera.far=clip_far; '\n            'camera.updateProjectionMatrix();'\n        ),\n    }\n    with open(bpy.path.abspath(filepath), 'w') as fh:\n        json.dump(payload, fh, indent=2)\n\nexport_intrinsics_json(cam_data, '//camera_intrinsics.json')\n\n# Export GLB with camera embedded\nbpy.ops.export_scene.gltf(\n    filepath                             = bpy.path.abspath('//camera_orbit.glb'),\n    export_format                        = 'GLB',\n    use_selection                        = False,\n    export_cameras                       = True,    # camera node included in GLB\n    export_animations                    = True,\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_yup                           = True,    # rotate to Y-up for WebXR\n)\n\n# Three.js consumption:\n#   const loader = new THREE.GLTFLoader();\n#   loader.load('camera_orbit.glb', (gltf) => {\n#     const blenderCam = gltf.cameras[0];   // THREE.PerspectiveCamera\n#     // FoV, aspect, near, far are read from GLB CameraOrthographic/Perspective node.\n#     // Orbit animation:\n#     const mixer = new THREE.AnimationMixer(gltf.scene);\n#     mixer.clipAction(gltf.animations[0]).play();\n#   });\n#\n# WHY export_yup = True?\n#   Blender coordinate system is Z-up right-handed.\n#   Three.js / WebXR is Y-up right-handed.\n#   Without export_yup, the camera orbit is in the XY plane (Blender floor),\n#   which becomes the XZ plane in Three.js — the camera appears to orbit\n#   horizontally at Y = 0, not elevated at Y = ORBIT_HEIGHT.\n#\n# TROUBLESHOOTING:\n#   'No cameras array in gltf.cameras':\n#     export_cameras=True must be set; it is False by default.\n#   'Animation not found in gltf.animations':\n#     The orbit keyframes must exist on cam_obj.  Verify animation_data is not None\n#     and at least one FCurve is present in cam_obj.animation_data.action.fcurves.",
      },
    ],
  },
  base
);
