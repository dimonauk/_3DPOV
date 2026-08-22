"""
Blender 5.1 — bpy.types.MovieClip: Motion Tracking → Camera Solve → WebXR AR Overlay
======================================================================================
Expert blueprint for the programmatic motion-tracking pipeline.

WHY PYTHON OVER THE UI
----------------------
The UI tracker is interactive but not scriptable for batch production.
Python lets you: load clip libraries in sequence, inject pre-computed
marker positions from a feature detector, gate on solve_error before
committing the camera, and pipe the solved path directly to a WebXR
JSON feed — all unattended.

KEY CONSTRAINT
--------------
bpy.ops.clip.* operators require a CLIP_EDITOR space in the active area.
The `_clip_ctx` helper uses bpy.context.temp_override (Blender 3.2+) to
satisfy that constraint without touching the UI permanently.

OUTPUTS
-------
  solved_camera.glb   — GLB containing only the solved camera node with TRS
                        keyframes baked from the clip-solver result.
  camera_path.json    — [{frame, t:[x,y,z], q:[x,y,z,w]}, …] for every
                        CURVE_SAMPLE_STEP frames; WebXR scene can consume this
                        to anchor virtual objects to the real-world camera path.

LICENCE CC0 — Holoflow Studio
"""

import bpy
import json
import math
from contextlib import contextmanager
from mathutils import Vector, Matrix

# ─────────────────────────── CONSTANTS ────────────────────────────────────────
FOOTAGE_PATH      = bpy.path.abspath("//footage/clip.mp4")  # replace with real path
FRAME_START       = 1
FRAME_END         = 120
SENSOR_WIDTH_MM   = 36.0    # camera sensor width for solve
FOCAL_LENGTH_MM   = 24.0    # focal length initial guess (refined by solver)
SOLVE_ERROR_MAX   = 0.5     # RMS pixel error threshold; abort if exceeded
CURVE_SAMPLE_STEP = 2       # sample every N frames into camera_path.json
OUTPUT_GLB        = bpy.path.abspath("//solved_camera.glb")
OUTPUT_JSON       = bpy.path.abspath("//camera_path.json")

# ─────────────────────────── CONTEXT HELPER ───────────────────────────────────
@contextmanager
def _clip_ctx(clip: bpy.types.MovieClip):
    """
    Temporarily repurpose an area as CLIP_EDITOR so clip operators fire.
    Operators like clip.track_markers and clip.solve_camera mandate this;
    they assert the active space is CLIP_EDITOR before executing.

    The context manager restores the original area type on exit so the
    user's UI layout is not permanently changed.
    """
    screen = bpy.context.screen
    # prefer an existing CLIP_EDITOR first
    target_area = next(
        (a for a in screen.areas if a.type == "CLIP_EDITOR"), None
    )
    original_type = None
    if target_area is None:
        # pick the smallest non-3D-viewport area to repurpose
        candidates = [a for a in screen.areas if a.type != "VIEW_3D"]
        target_area = min(candidates, key=lambda a: a.width * a.height)
        original_type = target_area.type
        target_area.type = "CLIP_EDITOR"

    sp = target_area.spaces.active
    sp.clip = clip

    region = next(r for r in target_area.regions if r.type == "WINDOW")
    with bpy.context.temp_override(area=target_area, region=region,
                                   space_data=sp):
        yield target_area

    # restore if we repurposed
    if original_type is not None:
        target_area.type = original_type


# ─────────────────────────── STEP 1: LOAD CLIP ────────────────────────────────
def load_clip(path: str = FOOTAGE_PATH) -> bpy.types.MovieClip:
    """
    bpy.data.movieclips.load() creates a new MovieClip data-block.
    Subsequent calls with the same path return the SAME block (Blender
    deduplicates by path). Use bpy.data.movieclips.remove(clip) to purge
    if you need a clean reload.
    """
    clip = bpy.data.movieclips.load(path)
    clip.frame_start = FRAME_START
    clip.use_proxy   = False    # proxy would reduce resolution; use original
    bpy.context.scene.frame_start = FRAME_START
    bpy.context.scene.frame_end   = FRAME_END
    return clip


# ─────────────────────────── STEP 2: CONFIGURE TRACKING ──────────────────────
def configure_tracking(clip: bpy.types.MovieClip) -> None:
    """
    MovieTrackingSettings controls the solver and refine options.
    keyframe_a / keyframe_b define the two anchor frames the solver uses
    to bootstrap the initial camera pose estimate. They should be frames
    where the camera has moved at least 10% of its field of view to give
    the solver enough parallax for a stable triangulation.

    refine_intrinsics_focal_length=True allows the solver to adjust
    focal_length during bundle adjustment. Switch to False once you have
    a pre-calibrated lens profile to prevent drift.
    """
    s = clip.tracking.settings
    s.keyframe_a = FRAME_START
    s.keyframe_b = FRAME_START + (FRAME_END - FRAME_START) // 3
    s.refine_intrinsics_focal_length = True
    s.refine_intrinsics_principal_point = False  # only needed for fisheye/wide
    s.use_tripod_solver = False   # tripod=True for locked-off cameras with NO pan
    s.use_keyframe_selection = True  # auto-selects best keyframes for initialisation

    cam = clip.tracking.camera
    cam.sensor_width  = SENSOR_WIDTH_MM
    cam.focal_length  = FOCAL_LENGTH_MM


# ─────────────────────────── STEP 3: AUTO-DETECT MARKERS ─────────────────────
def detect_markers(clip: bpy.types.MovieClip) -> None:
    """
    clip.detect_features() is the Python API for the 'Detect Features'
    button in the UI. It analyses the first frame to find high-contrast
    corners (Shi-Tomasi) and creates a MovieTrackingTrack for each one.

    margin keeps markers away from the image edge where JPEG artefacts
    cause poor tracking. threshold filters out low-contrast candidates.
    min_distance prevents clusters of overlapping tracks that would provide
    no additional epipolar baseline.
    """
    with _clip_ctx(clip):
        bpy.ops.clip.detect_features(
            threshold=0.005,    # Shi-Tomasi corner quality; lower = more tracks
            margin=10,          # px from edge — avoids vignetting / cropping
            min_distance=150,   # px minimum between track centroids
        )
    print(f"[tracking] {len(clip.tracking.tracks)} tracks detected")


# ─────────────────────────── STEP 4: TRACK ALL MARKERS ───────────────────────
def track_all(clip: bpy.types.MovieClip) -> None:
    """
    clip.track_markers runs the KLT optical-flow tracker across all frames.
    Tracking backwards (backwards=True, sequence=True) from any manually
    corrected frame improves accuracy for long shots where drift accumulates.

    pattern_size (16 × 16 by default in the tracking settings) is the
    template patch size; search_size is the search window. Large search
    windows handle fast motion but slow the track considerably.
    """
    # Select all tracks before running the operator
    for track in clip.tracking.tracks:
        track.select = True

    with _clip_ctx(clip):
        bpy.ops.clip.track_markers(
            backwards=False,
            sequence=True,    # track entire sequence, not just next frame
        )
    # Report how many tracks survived to the end frame
    active = sum(1 for t in clip.tracking.tracks
                 if t.markers.find_frame(FRAME_END) is not None)
    print(f"[tracking] {active} tracks reached frame {FRAME_END}")


# ─────────────────────────── STEP 5: CAMERA SOLVE ────────────────────────────
def camera_solve(clip: bpy.types.MovieClip) -> float:
    """
    bpy.ops.clip.solve_camera performs Structure-from-Motion:
    1. Initialises pose from keyframe pair (step 2 settings)
    2. Extends reconstruction frame-by-frame
    3. Runs sparse bundle adjustment to minimise reprojection error

    Returns the RMS reprojection error in pixels.
    Values below 0.3 px are excellent; 0.3–0.8 px is acceptable;
    above 1.0 px indicates insufficient tracks or a bad keyframe pair.
    """
    with _clip_ctx(clip):
        bpy.ops.clip.solve_camera()

    obj_tracking = clip.tracking.objects.get("Camera") or clip.tracking.objects[0]
    error = obj_tracking.solve_error
    print(f"[solve] RMS reprojection error: {error:.4f} px")
    if error > SOLVE_ERROR_MAX:
        raise RuntimeError(
            f"Solve error {error:.3f} px exceeds threshold {SOLVE_ERROR_MAX} px. "
            "Increase track count, choose a better keyframe pair, or refine markers."
        )
    return error


# ─────────────────────────── STEP 6: SET SCENE ORIGIN ────────────────────────
def set_floor_and_origin(clip: bpy.types.MovieClip) -> None:
    """
    After solving, the reconstructed camera floats at an arbitrary scale
    and orientation. Two operators normalise the scene:

    clip.set_plane  — fits a floor constraint to the selected 4+ coplanar
                      tracks (hold them selected in the CLIP_EDITOR before
                      calling). Rotates the camera so those points define
                      the ground plane (Y=0 in 3D space).

    clip.set_origin — translates the entire reconstruction so the selected
                      single track sits at the world origin.

    These can also be called from Python via the clip operators as long as
    the correct tracks are selected in clip.tracking.tracks[i].select.
    """
    # Mark the 4 tracks with lowest Y (floor candidates) as selected
    floor_tracks = sorted(clip.tracking.tracks,
                          key=lambda t: t.markers[0].co[1])[:4]
    for t in clip.tracking.tracks:
        t.select = False
    for t in floor_tracks:
        t.select = True

    with _clip_ctx(clip):
        bpy.ops.clip.set_plane(plane="FLOOR")

    # Use first floor track as origin
    for t in clip.tracking.tracks:
        t.select = False
    floor_tracks[0].select = True
    with _clip_ctx(clip):
        bpy.ops.clip.set_origin()


# ─────────────────────────── STEP 7: LINK CAMERA TO SCENE ────────────────────
def link_camera_to_scene(clip: bpy.types.MovieClip) -> bpy.types.Object:
    """
    clip.setup_tracking_scene creates a camera object and links it to the
    current scene, binding its animation to the solved clip. Calling it
    twice creates a second camera — check for an existing solved camera first.
    """
    cam_obj = bpy.data.objects.get(CAM_NAME)
    if cam_obj is None:
        with _clip_ctx(clip):
            bpy.ops.clip.setup_tracking_scene()
        # setup_tracking_scene names the camera after the clip by default;
        # rename for clarity
        for obj in bpy.context.scene.objects:
            if obj.type == "CAMERA" and obj.animation_data:
                obj.name = CAM_NAME
                cam_obj = obj
                break
    if cam_obj is None:
        raise RuntimeError("setup_tracking_scene did not create a camera object")
    bpy.context.scene.camera = cam_obj
    return cam_obj


# ─────────────────────────── STEP 8: BAKE CAMERA PATH ────────────────────────
def bake_camera_fcurves(cam_obj: bpy.types.Object) -> None:
    """
    The camera from setup_tracking_scene is driven by object-level
    constraints (Follow Track, Camera Solver). GLB export cannot write
    these constraints as animation; the track-driven channel must be baked
    to plain FCurves first.

    bpy.ops.nla.bake with visual_keying=True evaluates the constraint stack
    at each frame and writes world-space TRS keys. clear_constraints=True
    removes the clip driver afterwards — essential or the GLB exporter
    would ignore the FCurves because the constraint takes priority at runtime.
    """
    bpy.context.view_layer.objects.active = cam_obj
    cam_obj.select_set(True)
    bpy.ops.nla.bake(
        frame_start=FRAME_START,
        frame_end=FRAME_END,
        step=1,
        visual_keying=True,       # evaluates constraint chain
        clear_constraints=True,   # removes Follow Track + Camera Solver constraints
        clear_parents=False,
        use_current_action=True,
        bake_types={'OBJECT'},
    )


# ─────────────────────────── STEP 9: EXPORT GLB ──────────────────────────────
def export_camera_glb(cam_obj: bpy.types.Object) -> None:
    """
    Export the camera node alone. Three.js / Babylon.js can load this GLB
    and use the camera TRS animation to replay the solved path in WebXR.
    The camera FOV is encoded in the GLB extras (yfov, aspectRatio).
    """
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    cam_obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        use_selection=True,
        export_animations=True,
        export_frame_range=True,
        export_force_sampling=True,
        export_apply=False,       # camera has no mesh to apply
        export_cameras=True,
        export_draco_mesh_compression_enable=False,  # no mesh to compress
    )
    print(f"[export] GLB written → {OUTPUT_GLB}")


# ─────────────────────────── STEP 10: EXPORT JSON PATH ───────────────────────
def export_json_path(cam_obj: bpy.types.Object) -> None:
    """
    For WebXR scenes that cannot load a full GLB, the camera path is
    serialised as a compact JSON array. Each entry carries the frame index
    plus translation and quaternion rotation in Blender's +Y-up coordinate
    system. The consumer (Three.js scene) converts to WebXR's +Y-up /
    -Z-forward convention via:
        q_webxr = new THREE.Quaternion(q.x, q.z, -q.y, q.w)
        t_webxr = new THREE.Vector3(t.x, t.z, -t.y)

    Reading from FCurves rather than bpy.context.scene.frame_set is ~30×
    faster on long sequences because it avoids viewport redraw and
    depsgraph evaluation per frame.
    """
    action = cam_obj.animation_data.action
    # Build channel lookup: dp → array of FCurve sorted by array_index
    fcmap: dict[str, list] = {}
    for fc in action.fcurves:
        fcmap.setdefault(fc.data_path, [None, None, None, None])
        fcmap[fc.data_path][fc.array_index] = fc

    def sample(dp: str, idx: int, frame: float) -> float:
        curves = fcmap.get(dp)
        if curves is None or curves[idx] is None:
            return 0.0
        return curves[idx].evaluate(frame)

    records = []
    for f in range(FRAME_START, FRAME_END + 1, CURVE_SAMPLE_STEP):
        tx = sample("location", 0, f)
        ty = sample("location", 1, f)
        tz = sample("location", 2, f)
        qw = sample("rotation_quaternion", 0, f)
        qx = sample("rotation_quaternion", 1, f)
        qy = sample("rotation_quaternion", 2, f)
        qz = sample("rotation_quaternion", 3, f)
        records.append({
            "frame": f,
            "t": [round(tx, 5), round(ty, 5), round(tz, 5)],
            "q": [round(qx, 5), round(qy, 5), round(qz, 5), round(qw, 5)],
        })

    with open(OUTPUT_JSON, "w") as fh:
        json.dump(records, fh, separators=(",", ":"), indent=None)
    print(f"[export] JSON path written → {OUTPUT_JSON}  ({len(records)} frames)")


# ─────────────────────────── MAIN ─────────────────────────────────────────────
if __name__ == "__main__":
    clip = load_clip()
    configure_tracking(clip)
    detect_markers(clip)
    track_all(clip)
    error = camera_solve(clip)
    set_floor_and_origin(clip)
    cam = link_camera_to_scene(clip)
    bake_camera_fcurves(cam)
    export_camera_glb(cam)
    export_json_path(cam)
    print(f"[done] solve error {error:.4f} px → {OUTPUT_GLB}, {OUTPUT_JSON}")
