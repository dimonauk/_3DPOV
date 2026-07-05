import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Motion tracking in Blender is not just a UI workflow — the entire
        pipeline is accessible from Python through{" "}
        <code>bpy.types.MovieClip</code>,{" "}
        <code>bpy.types.MovieTracking</code>, and a set of{" "}
        <code>bpy.ops.clip.*</code> operators. The catch is that clip
        operators assert the active area is a{" "}
        <code>CLIP_EDITOR</code> space before executing. Scripts running in
        the Scripting workspace fail with{" "}
        <code>
          RuntimeError: Operator bpy.ops.clip.solve_camera poll failed
        </code>{" "}
        unless a compatible context is provided. The{" "}
        <code>bpy.context.temp_override</code> API (Blender 3.2+) is the
        correct tool: repurpose an existing area temporarily, run the
        operator, and restore the original layout on exit — all inside a
        Python context manager. Compare this with the UI workaround covered
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          context temp_override pipeline tutorial
        </Link>
        .
      </p>

      <p>
        The solve pipeline breaks into three phases. Detection + tracking
        uses{" "}
        <code>bpy.ops.clip.detect_features</code> (Shi-Tomasi corner
        detection) followed by{" "}
        <code>bpy.ops.clip.track_markers(sequence=True)</code> to propagate
        each track through all frames via KLT optical flow. The quality of
        every downstream step depends entirely on the number and spread of
        tracks that survive to the last frame; the solver needs a minimum of
        eight well-distributed, non-coplanar points to constrain six degrees
        of camera freedom. Camera solve — <code>bpy.ops.clip.solve_camera</code>{" "}
        — runs Blender&rsquo;s incremental SfM solver, which initialises
        camera pose from the two anchor keyframes in{" "}
        <code>tracking.settings.keyframe_a/b</code> and extends the
        reconstruction frame-by-frame. RMS reprojection error is read back
        from{" "}
        <code>clip.tracking.objects[0].solve_error</code>{" "}
        immediately after the operator returns; values below 0.5 px are
        production-acceptable. Scene normalisation — the{" "}
        <code>clip.set_plane</code> and{" "}
        <code>clip.set_origin</code> operators — reorients the point cloud
        so that your chosen coplanar tracks define the floor and origin,
        giving a sensible coordinate system for the exported GLB.
      </p>

      <p>
        The camera object created by{" "}
        <code>bpy.ops.clip.setup_tracking_scene</code> carries a{" "}
        <strong>Camera Solver</strong> constraint that continuously
        re-evaluates from the clip at render time. GLB exporters write
        actual keyframe channels, not constraint evaluation — so this
        camera, exported directly, produces a static node. The fix is{" "}
        <code>bpy.ops.nla.bake(visual_keying=True, clear_constraints=True)</code>:
        it evaluates the constraint at every frame and writes plain FCurves
        for location and rotation, then removes the constraint so nothing
        overrides those curves at export. The same pattern applies to any
        constraint-driven object you need to ship in a GLB — it is exactly
        what the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
          className={lk}
        >
          NLA bake IK → FK tutorial
        </Link>{" "}
        uses for inverse-kinematics chains on character rigs. The result
        is a self-contained GLB camera node with embedded TRS animation,
        loadable directly in Three.js via{" "}
        <code>GLTFLoader</code> with no runtime constraint dependency.
      </p>

      <p>
        For WebXR AR overlays, the JSON path export is often more practical
        than the GLB. A Three.js XR session creates its own camera tied to
        the headset&rsquo;s pose; you cannot replace it with a loaded
        camera. Instead, the JSON stream drives virtual object placement:
        at each frame the solved translation and quaternion are read from the
        array and applied to a target{" "}
        <code>THREE.Object3D</code>, anchoring it to the real-world location
        the tracker associated with the origin track. This is the bridge
        between a Blender camera solve and the{" "}
        <Link href="/wiring-spatial-audio-in-the-framework" className={lk}>
          spatial audio framework
        </Link>{" "}
        — a sound source locked to a tracked prop follows the camera solve
        path automatically. The FCurve direct evaluation approach (reading{" "}
        <code>fc.evaluate(frame)</code> without calling{" "}
        <code>scene.frame_set</code>) is 30× faster than frame-stepping
        because it skips viewport redraw and the full depsgraph update cycle.
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-multiview-camera-rig-gaussian-splat-render"
          className={lk}
        >
          multi-view camera rig tutorial
        </Link>{" "}
        for the complementary workflow of building a scripted camera rig for
        Gaussian splatting capture — the two pipelines meet when you want to
        splat a scene and align a tracked camera path to it.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.MovieClip API Reference</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.MovieClip.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.MovieClip.html
        </a>{" "}
        CC-BY-SA 4.0 — full property listing for MovieClip, MovieTracking,
        MovieTrackingTrack, and MovieTrackingMarker; sibling pages{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.MovieTracking.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          MovieTracking
        </a>{" "}
        and{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.MovieTrackingSettings.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          MovieTrackingSettings
        </a>{" "}
        document all solver parameters including keyframe_a/b, tripod mode,
        and refine_intrinsics flags. Blender Foundation —{" "}
        <em>Motion Tracking Manual</em>{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/movie_clip/tracking/introduction.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/manual/en/latest/movie_clip/tracking
        </a>{" "}
        CC-BY-SA 4.0 — explains the SfM reconstruction algorithm, keyframe
        selection heuristics, and the meaning of the solve error metric;
        the related{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/movie_clip/tracking/clip/editing/track.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          Track Editing reference
        </a>{" "}
        documents all detect_features parameters exposed through the Python
        operator interface.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-movieclip-motion-tracking-camera-solve-webxr-ar",
  title:
    "Python bpy.types.MovieClip — Motion Tracking: Camera Solve & WebXR AR Overlay Export (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial",
  excerpt:
    "The bpy.ops.clip.* operators require a CLIP_EDITOR context that scripts cannot assume — temp_override solves this. Covers detect_features, track_markers KLT propagation, solve_camera SfM reconstruction, RMS error gating, nla.bake to strip Camera Solver constraints, and exporting the path as both a GLB camera node and a WebXR-consumable JSON curve stream.",
  tags: [
    "blender",
    "python",
    "scripting",
    "motion-tracking",
    "camera-solve",
    "sfm",
    "webxr",
    "ar",
    "glb",
    "animation",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-movieclip-motion-tracking-camera-solve-webxr-ar",
    time: "one to two hours",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts from the Scripting workspace",
      "Understands bpy.context.temp_override for operator context injection",
      "Familiar with basic camera concepts: focal length, sensor width, FOV",
      "Has real or synthetic footage (image sequence or video) to track",
    ],
    steps: [
      {
        title: "Load footage and configure the clip",
        body: "bpy.data.movieclips.load() creates a MovieClip data-block keyed on the file path. Subsequent loads of the same path return the existing block — use bpy.data.movieclips.remove(clip) if you need a clean reload after replacing the file on disk:\n\n  clip = bpy.data.movieclips.load(bpy.path.abspath('//footage/clip.mp4'))\n  clip.frame_start  = 1\n  clip.use_proxy    = False   # proxy reduces resolution; disable for accuracy\n  scene.frame_start = 1\n  scene.frame_end   = 120\n\nThe clip's lens model lives at clip.tracking.camera:\n\n  cam = clip.tracking.camera\n  cam.sensor_width  = 36.0   # mm — match your physical camera\n  cam.focal_length  = 24.0   # initial guess; solver refines this\n\nGetting sensor_width right matters: a 10% error propagates directly into the final scale of the reconstruction. Most modern phones have sensors in the 5–7 mm range; DSLRs are 24–36 mm. If you do not know your sensor, enable refine_intrinsics_focal_length=True and the solver will estimate it.",
      },
      {
        title: "Detect features with context override",
        body: "bpy.ops.clip.detect_features requires the active area to be a CLIP_EDITOR. Use temp_override to satisfy that constraint:\n\n  @contextmanager\n  def _clip_ctx(clip):\n      screen = bpy.context.screen\n      target = next((a for a in screen.areas if a.type == 'CLIP_EDITOR'), None)\n      original_type = None\n      if target is None:\n          candidates = [a for a in screen.areas if a.type != 'VIEW_3D']\n          target = min(candidates, key=lambda a: a.width * a.height)\n          original_type = target.type\n          target.type = 'CLIP_EDITOR'\n      target.spaces.active.clip = clip\n      region = next(r for r in target.regions if r.type == 'WINDOW')\n      with bpy.context.temp_override(area=target, region=region,\n                                     space_data=target.spaces.active):\n          yield target\n      if original_type:\n          target.type = original_type\n\n  with _clip_ctx(clip):\n      bpy.ops.clip.detect_features(\n          threshold=0.005,    # Shi-Tomasi quality; lower = more candidates\n          margin=10,          # pixels from image edge — avoids vignetting\n          min_distance=150,   # minimum px between track centroids\n      )\n\nPrint len(clip.tracking.tracks) after detection. For a reliable solve you want 15–40 tracks spread across the full frame area. Too few tracks produce a degenerate solve; too many slow the tracker without improving accuracy.",
      },
      {
        title: "Track markers across all frames",
        body: "bpy.ops.clip.track_markers(sequence=True) runs KLT optical flow from the current frame to the last frame. It must be called with the CLIP_EDITOR context and all tracks selected:\n\n  for t in clip.tracking.tracks:\n      t.select = True\n\n  with _clip_ctx(clip):\n      bpy.ops.clip.track_markers(backwards=False, sequence=True)\n\nKLT tracks the patch defined by each marker's search_size window frame-to-frame. Tracks that lose their patch (blur, occlusion, motion blur exceeding the search window) are flagged red and drop out. A track that reaches frame_end is called a 'complete track' — these are the ones that contribute to the solve.\n\nCheck after tracking:\n\n  complete = sum(1 for t in clip.tracking.tracks\n                 if t.markers.find_frame(120) is not None)\n  print(f'{complete} complete tracks')\n\nIf fewer than 8 tracks complete the run, the solve will fail or produce a degenerate result. Increase min_distance and re-detect on a frame with strong texture, or manually add tracks in the Clip Editor.",
      },
      {
        title: "Configure solver settings and solve",
        body: "tracking.settings controls the SfM algorithm:\n\n  s = clip.tracking.settings\n  s.keyframe_a = 1\n  s.keyframe_b = 40    # roughly 1/3 through — enough parallax\n  s.refine_intrinsics_focal_length = True\n  s.refine_intrinsics_principal_point = False\n  s.use_tripod_solver = False  # True only for fully locked-off cameras\n  s.use_keyframe_selection = True  # overrides keyframe_a/b with auto-selection\n\n  with _clip_ctx(clip):\n      bpy.ops.clip.solve_camera()\n\n  err = clip.tracking.objects[0].solve_error\n  print(f'RMS reprojection error: {err:.4f} px')\n\nThe solve_error is the RMS of all reprojection residuals across all tracks and all frames — essentially how far the 3D-reconstructed points' projected positions deviate from the actual 2D marker positions. Sub-0.5 px is excellent; 0.5–1.0 px is acceptable for film VFX; above 1.0 px means the solve will produce visibly unstable tracking data.\n\nCommon failure modes: keyframe pair too close (insufficient baseline), coplanar tracks only (solve degenerates to planar homography), or footage without enough texture (all tracks drift).",
      },
      {
        title: "Set floor plane and scene origin",
        body: "After solving, the reconstruction exists at an arbitrary scale and orientation. Normalise it with the set_plane and set_origin operators. These require specific tracks to be selected:\n\n  # Select 4 coplanar floor tracks — e.g. corner markers on a flat surface\n  floor_track_names = ['track_01', 'track_02', 'track_03', 'track_04']\n  for t in clip.tracking.tracks:\n      t.select = t.name in floor_track_names\n\n  with _clip_ctx(clip):\n      bpy.ops.clip.set_plane(plane='FLOOR')\n\n  for t in clip.tracking.tracks:\n      t.select = False\n  clip.tracking.tracks['track_01'].select = True\n  with _clip_ctx(clip):\n      bpy.ops.clip.set_origin()\n\nIf you do not have identifiable floor markers, skip set_plane and instead rotate the camera manually in the 3D viewport using Euler XYZ decomposition from the solve. The WebXR consumer can handle an arbitrary Y-up scene as long as the floor calibration JSON is included as a separate offset.",
      },
      {
        title: "Link solved camera to the scene",
        body: "bpy.ops.clip.setup_tracking_scene creates three objects: a camera (with Camera Solver + Follow Track constraints), a background image plane, and a marker empties group. The camera constraint reads from the clip in real-time:\n\n  with _clip_ctx(clip):\n      bpy.ops.clip.setup_tracking_scene()\n\n  # rename and make active\n  cam_obj = next(o for o in bpy.context.scene.objects\n                 if o.type == 'CAMERA' and o.animation_data)\n  cam_obj.name = 'SolvedCamera'\n  bpy.context.scene.camera = cam_obj\n\nCall this at most once per clip. Calling it a second time creates a second camera — check with bpy.data.objects.get('SolvedCamera') first.\n\nThe camera now animates correctly in the 3D viewport: press Numpad 0 to enter camera view and play back the timeline. The footage appears as the viewport background and the reconstructed point cloud floats in 3D space. Tight reprojection residuals (small red circles) around the feature locations = good solve.",
      },
      {
        title: "Bake constraints to FCurves",
        body: "The Camera Solver constraint drives the camera in Blender's internal evaluation, but GLB exporters write FCurve data, not constraint evaluation. The camera's channels appear static in the exported file because the constraint takes priority over any stored keys at runtime.\n\nFix with nla.bake:\n\n  bpy.context.view_layer.objects.active = cam_obj\n  cam_obj.select_set(True)\n  bpy.ops.nla.bake(\n      frame_start=1,\n      frame_end=120,\n      step=1,\n      visual_keying=True,       # evaluates full constraint stack per frame\n      clear_constraints=True,   # removes Camera Solver + Follow Track after bake\n      clear_parents=False,\n      use_current_action=True,\n      bake_types={'OBJECT'},\n  )\n\nclear_constraints=True is mandatory — without it, the constraint remains active and overrides the baked FCurves at export time, producing a static camera again. After baking, verify by checking cam_obj.constraints is empty and cam_obj.animation_data.action.fcurves has 7 channels (3 location + 4 rotation_quaternion).",
      },
      {
        title: "Export GLB and JSON camera path",
        body: "Export the camera alone as a GLB:\n\n  for obj in bpy.context.scene.objects:\n      obj.select_set(False)\n  cam_obj.select_set(True)\n  bpy.ops.export_scene.gltf(\n      filepath=bpy.path.abspath('//solved_camera.glb'),\n      use_selection=True,\n      export_animations=True,\n      export_force_sampling=True,\n      export_cameras=True,\n      export_draco_mesh_compression_enable=False,\n  )\n\nFor the JSON path, read directly from FCurves (30× faster than frame_set):\n\n  action = cam_obj.animation_data.action\n  fcmap = {}\n  for fc in action.fcurves:\n      fcmap.setdefault(fc.data_path, [None]*4)[fc.array_index] = fc\n\n  records = []\n  for f in range(1, 121, 2):     # every other frame\n      def s(dp, i): return (fcmap.get(dp) or [None]*4)[i].evaluate(f)\n      records.append({\n          'frame': f,\n          't': [round(s('location', i), 5) for i in range(3)],\n          'q': [round(s('rotation_quaternion', i), 5) for i in range(4)],\n      })\n\n  import json\n  with open(bpy.path.abspath('//camera_path.json'), 'w') as fh:\n      json.dump(records, fh, separators=(',', ':'))\n\nThe Three.js consumer applies Blender→WebXR axis conversion:\n  q_webxr = new THREE.Quaternion(q[0], q[2], -q[1], q[3]);\n  t_webxr = new THREE.Vector3(t[0], t[2], -t[1]);",
      },
    ],
    finalResult:
      "A Blender .blend containing a movie clip with tracked features, a 3D reconstructed point cloud, and a solved camera baked to plain FCurves. Two exports: solved_camera.glb (camera node with embedded TRS animation, loadable in Three.js GLTFLoader) and camera_path.json ([{frame, t, q}, …] stream). The JSON stream drives AR overlay placement in WebXR scenes without requiring a full GLB load.",
    variations: [
      "Pre-computed markers: skip detect_features and track_markers entirely if you have 2D tracking data from an external tracker (DaVinci Resolve, PFTrack, mocha). Create track markers manually: t = clip.tracking.tracks.new(name='pt'); t.markers.insert_frame(f, co=(x_norm, y_norm)). Normalised coordinates: (0,0) = bottom-left, (1,1) = top-right. Feed all frames of each track this way, then jump straight to solve_camera.",
      "Tripod solve: if the camera is locked off with no translation (only rotation), set tracking.settings.use_tripod_solver=True. The tripod solver uses only 4 tracks and optimises for pure rotation — it runs faster and is more stable than the full SfM solver for this camera motion type. The resulting camera has no translation FCurves, only rotation.",
      "Undistort footage: for wide-angle lenses with visible barrel distortion, set clip.tracking.camera.distortion_model='POLYNOMIAL' and run bpy.ops.clip.undistort_mapping() after the solve. This warps the footage to remove lens distortion, improving track accuracy and making the clip suitable for accurate 3D projection texturing.",
      "Multi-object tracking: add a secondary tracking object with clip.tracking.objects.new('TableProp'). Track markers that lie on the prop and solve them separately. The prop's solved path can be linked to an actual mesh object in the scene, giving a tracked prop that moves correctly relative to the camera — useful for AR overlays on physical objects.",
      "Stabilisation export: once the camera is solved, bpy.ops.clip.setup_2d_stabilization() builds a 2D stabilised render of the clip that removes camera shake. The stabilised output is useful as a clean background plate for 2D composite work even when 3D tracking is not the end goal.",
    ],
    troubleshooting: [
      {
        symptom:
          "RuntimeError: Operator bpy.ops.clip.solve_camera poll failed",
        cause:
          "The active area is not a CLIP_EDITOR. Clip operators assert this before running.",
        fix: "Wrap the operator call in the _clip_ctx() context manager that temporarily repurposes an area as CLIP_EDITOR using bpy.context.temp_override.",
      },
      {
        symptom: "solve_error is very high (> 2.0 px) or solve fails silently",
        cause:
          "Insufficient tracks, coplanar point cloud (no 3D baseline), or bad keyframe pair with too little parallax.",
        fix: "Print len(clip.tracking.tracks) — ensure > 15 survive. Set tracking.settings.use_keyframe_selection=True to let Blender auto-pick frames with maximum baseline. If all your tracks lie on a flat surface, add a few tracks on off-plane objects (e.g. a chair leg).",
      },
      {
        symptom: "Exported GLB camera is static (no animation)",
        cause:
          "Camera Solver constraint was not cleared. The constraint overrides FCurve data at runtime inside Blender, but the GLB exporter reads the stored keys, which show no motion.",
        fix: "Run nla.bake with visual_keying=True and clear_constraints=True before export. Verify cam_obj.constraints is empty after the bake.",
      },
      {
        symptom:
          "camera_path.json reads all zeros for rotation_quaternion",
        cause:
          "The camera action uses Euler rotation instead of quaternion. After baking, check cam_obj.rotation_mode.",
        fix: "Set cam_obj.rotation_mode = 'QUATERNION' before calling nla.bake. The bake respects the active rotation mode when writing channels.",
      },
      {
        symptom:
          "detect_features creates tracks only on one small region of the frame",
        cause:
          "The threshold is too high (selects only the most prominent corner) or min_distance is too large for the footage resolution.",
        fix: "Lower threshold to 0.001 and min_distance to 80. Increase margin only if you see tracks on the edge of a letterbox. Re-run detect_features with bpy.data.movieclips['clip.mp4'].tracking.tracks.clear() first to remove the previous attempt.",
      },
    ],
  },
  base,
);
