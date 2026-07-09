"""
bpy.types.Speaker — Positional Audio Scene Composition:
Cone Parameters, Animated Paths & Web Audio API Export for WebXR
Blender 5.1 | CC0 — Holoflow Studio

Technique: Create Speaker data blocks via the direct data API (no operator),
configure per-speaker attenuation curves and directional cones, animate
speaker objects along Bézier paths, bake world-space positions per frame,
and export a speakers_manifest.json that drives THREE.PositionalAudio in WebXR.

Run: Scripting workspace → Run Script, or:
  blender --background --python blueprint.py
Outputs: speakers_manifest.json, speaker_scene.glb (relative to .blend)

Outside sources referenced:
  Blender Foundation bpy.types.Speaker API (CC-BY-4.0)
    https://docs.blender.org/api/5.1/bpy.types.Speaker.html
  mrdoob/three.js PositionalAudio (MIT)
    https://github.com/mrdoob/three.js/blob/dev/src/audio/PositionalAudio.js
"""

import bpy, json, math, mathutils, os

# ── Named constants ──────────────────────────────────────────────────────────
BAKE_FRAME_START = 1
BAKE_FRAME_END   = 60          # 2.5 s at 24 fps
BAKE_STEP        = 2           # sample every other frame (30 fps equivalent)

# Ambient omnidirectional speaker placed at world centre
AMBIENT_VOLUME           = 0.9
AMBIENT_VOL_MIN          = 0.05   # gain floor at max distance
AMBIENT_VOL_MAX          = 1.0    # gain ceiling at close range
AMBIENT_REF_DIST         = 1.5    # metres — full gain at 1.5 m
AMBIENT_MAX_DIST         = 20.0   # metres — beyond this, gain = VOL_MIN
AMBIENT_ATTENUATION      = 1.0    # PannerNode.rolloffFactor
AMBIENT_CONE_INNER       = 360.0  # omnidirectional (inner cone covers all angles)
AMBIENT_CONE_OUTER       = 360.0
AMBIENT_CONE_VOL_OUTER   = 1.0

# Directional "spotlight" speaker — e.g. a terminal kiosk beaming audio forward
DIR_VOLUME           = 1.0
DIR_VOL_MIN          = 0.0
DIR_VOL_MAX          = 1.0
DIR_REF_DIST         = 0.8
DIR_MAX_DIST         = 8.0
DIR_ATTENUATION      = 2.0    # steeper rolloff for a close-proximity trigger
DIR_CONE_INNER       = 45.0   # ±22.5° full-volume beam
DIR_CONE_OUTER       = 120.0  # ±60° fade-out zone
DIR_CONE_VOL_OUTER   = 0.02   # nearly silent outside the outer cone

AUDIO_FILE_AMBIENT   = "//audio/ambient_loop.wav"   # replace with real file
AUDIO_FILE_DIR       = "//audio/kiosk_prompt.wav"

OUTPUT_JSON = "//speakers_manifest.json"
OUTPUT_GLB  = "//speaker_scene.glb"


# ── Helpers ──────────────────────────────────────────────────────────────────

def new_speaker_object(name: str, audio_path: str, location, scene) -> bpy.types.Object:
    """
    Create a Speaker data block, link an audio file (missing-file OK for blueprint),
    wrap it in an Object, and link it to the scene.

    WHY not bpy.ops.object.speaker_add()?
      The operator requires an active VIEW_3D area in OBJECT mode.
      The direct API (bpy.data.speakers.new / bpy.data.objects.new) works
      headless and in any context — including modal operators and add-on panels.
    """
    snd = bpy.data.sounds.load(bpy.path.abspath(audio_path), check_existing=True)

    sp_data       = bpy.data.speakers.new(name)
    sp_data.sound = snd

    sp_obj       = bpy.data.objects.new(name, sp_data)
    sp_obj.location = mathutils.Vector(location)
    scene.collection.objects.link(sp_obj)
    return sp_obj


def configure_attenuation(sp_data: bpy.types.Speaker,
                           volume: float, vol_min: float, vol_max: float,
                           ref_dist: float, max_dist: float,
                           attenuation: float) -> None:
    """
    Set all attenuation parameters on a Speaker data block.

    Blender → Web Audio PannerNode mapping:
      sp_data.distance_reference  → PannerNode.refDistance
      sp_data.distance_max        → PannerNode.maxDistance
      sp_data.attenuation         → PannerNode.rolloffFactor
      sp_data.volume_min          → not directly exposed; set coneOuterGain
                                    or clip gain in the WebXR runtime
      sp_data.volume              → GainNode.gain (master multiplier)

    PannerNode.distanceModel should be 'inverse' to match Blender's model:
      gain = clamp(refDistance / (refDistance + rolloff * (d - refDistance)))
    """
    sp_data.volume             = volume
    sp_data.volume_min         = vol_min
    sp_data.volume_max         = vol_max
    sp_data.distance_reference = ref_dist
    sp_data.distance_max       = max_dist
    sp_data.attenuation        = attenuation


def configure_cone(sp_data: bpy.types.Speaker,
                   inner_deg: float, outer_deg: float,
                   outer_gain: float) -> None:
    """
    Configure the directional audio cone.

    Blender → PannerNode:
      sp_data.cone_angle_inner   → PannerNode.coneInnerAngle  (full-gain cone)
      sp_data.cone_angle_outer   → PannerNode.coneOuterAngle  (fade-to-outer zone)
      sp_data.cone_volume_outer  → PannerNode.coneOuterGain   (gain outside cone)

    Cone angles are FULL angles (not half-angles).
    A 45° inner cone = ±22.5° from the speaker's -Y axis in Blender world space.
    (Blender speakers point along their local -Y axis.)

    WHY is inner < outer always required?
      If inner ≥ outer, the fade zone collapses to zero width — the transition
      from full gain to outer gain is instantaneous, creating a hard click artefact
      in the audio as the listener crosses the boundary.
    """
    assert inner_deg < outer_deg or outer_deg == 360.0, (
        "cone_angle_inner must be < cone_angle_outer for a valid fade zone."
    )
    sp_data.cone_angle_inner  = inner_deg
    sp_data.cone_angle_outer  = outer_deg
    sp_data.cone_volume_outer = outer_gain


def orbit_path_for_speaker(sp_obj: bpy.types.Object,
                            radius: float, height: float,
                            scene) -> bpy.types.Object:
    """
    Add a circular Bézier path and attach the speaker via Follow Path constraint.
    The speaker animates one full orbit in BAKE_FRAME_END frames.

    WHY Follow Path + baked NLA rather than manual keyframes?
      The Follow Path constraint evaluates the exact parametric curve — uniform
      speed with no aliasing artefact from linear-interpolated keyframes.
      We bake to keyframes before JSON export so the manifest reflects the real
      evaluated world positions (constraints evaluate lazily, not stored in FCurves).
    """
    bpy.ops.curve.primitive_bezier_circle_add(radius=radius, location=(0.0, 0.0, height))
    path_obj       = bpy.context.active_object
    path_obj.name  = f"{sp_obj.name}_orbit_path"
    path_obj.data.use_path       = True
    path_obj.data.path_duration  = BAKE_FRAME_END  # one orbit = BAKE_FRAME_END frames

    cst              = sp_obj.constraints.new('FOLLOW_PATH')
    cst.target       = path_obj
    cst.use_curve_follow = True  # orient speaker along path tangent

    # Activate path evaluation (operator sets the frame offset keyframe)
    bpy.context.view_layer.objects.active = sp_obj
    bpy.ops.constraint.followpath_path_animate(
        constraint='Follow Path', owner='OBJECT'
    )
    return path_obj


def bake_speaker_positions(sp_obj: bpy.types.Object,
                            scene) -> dict:
    """
    Evaluate the speaker's world-space position and -Y forward vector per frame.
    Returns a dict keyed by str(frame).

    WHY bake instead of reading constraints at export time?
      bpy.ops.export_scene.gltf() doesn't bake audio metadata — we need the
      evaluated matrix per frame.  scene.view_layer.update() flushes the
      dependency graph so sp_obj.matrix_world reflects Follow Path offsets.
    """
    frames = {}
    for frame in range(BAKE_FRAME_START, BAKE_FRAME_END + 1, BAKE_STEP):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        mat   = sp_obj.matrix_world
        pos   = list(mat.to_translation())            # [x, y, z] in metres
        # Speaker forward = local -Y, transform by rotation matrix
        fwd   = mat.to_3x3() @ mathutils.Vector((0.0, -1.0, 0.0))
        frames[str(frame)] = {
            "position":  [round(v, 5) for v in pos],
            "forward":   [round(v, 5) for v in fwd],
        }
    return frames


def speaker_to_dict(sp_obj: bpy.types.Object, frames: dict) -> dict:
    """Build a JSON-serialisable dict from one speaker object."""
    sp  = sp_obj.data   # bpy.types.Speaker
    snd = sp.sound
    return {
        "name":             sp_obj.name,
        "audio_file":       snd.filepath.replace("//", "") if snd else "",
        "volume":           sp.volume,
        "volume_min":       sp.volume_min,
        "volume_max":       sp.volume_max,
        "ref_distance_m":   sp.distance_reference,
        "max_distance_m":   sp.distance_max,
        "rolloff_factor":   sp.attenuation,
        "cone_inner_deg":   sp.cone_angle_inner,
        "cone_outer_deg":   sp.cone_angle_outer,
        "cone_outer_gain":  sp.cone_volume_outer,
        "pitch":            sp.pitch,
        "frames":           frames,
    }


# ── Scene setup ──────────────────────────────────────────────────────────────

scene = bpy.context.scene
scene.frame_start = BAKE_FRAME_START
scene.frame_end   = BAKE_FRAME_END

# Remove default cube
for ob in list(scene.collection.objects):
    if ob.type == 'MESH' and ob.name.startswith('Cube'):
        bpy.data.objects.remove(ob, do_unlink=True)

# Reference object (the audio source scene — e.g. a gallery plinth)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(0.0, 0.0, 0.9))
plinth = bpy.context.active_object
plinth.name = 'audio_reference_sphere'

# ── Speaker 1 — Ambient omnidirectional ──────────────────────────────────────
amb_obj  = new_speaker_object('speaker_ambient', AUDIO_FILE_AMBIENT,
                               (0.0, 0.0, 1.5), scene)
configure_attenuation(amb_obj.data,
    AMBIENT_VOLUME, AMBIENT_VOL_MIN, AMBIENT_VOL_MAX,
    AMBIENT_REF_DIST, AMBIENT_MAX_DIST, AMBIENT_ATTENUATION)
configure_cone(amb_obj.data,
    AMBIENT_CONE_INNER, AMBIENT_CONE_OUTER, AMBIENT_CONE_VOL_OUTER)

# ── Speaker 2 — Directional kiosk ────────────────────────────────────────────
dir_obj = new_speaker_object('speaker_kiosk', AUDIO_FILE_DIR,
                              (2.0, 0.0, 1.2), scene)
configure_attenuation(dir_obj.data,
    DIR_VOLUME, DIR_VOL_MIN, DIR_VOL_MAX,
    DIR_REF_DIST, DIR_MAX_DIST, DIR_ATTENUATION)
configure_cone(dir_obj.data,
    DIR_CONE_INNER, DIR_CONE_OUTER, DIR_CONE_VOL_OUTER)

# Aim the kiosk speaker toward the reference sphere
cst            = dir_obj.constraints.new('TRACK_TO')
cst.target     = plinth
cst.track_axis = 'TRACK_NEGATIVE_Y'   # Speaker forward = local -Y
cst.up_axis    = 'UP_Z'

# ── Speaker 3 — Animated orbit path ──────────────────────────────────────────
orbit_obj  = new_speaker_object('speaker_orbit', AUDIO_FILE_AMBIENT,
                                 (3.0, 0.0, 1.0), scene)
configure_attenuation(orbit_obj.data,
    0.7, 0.05, 1.0, 1.2, 12.0, 1.0)
configure_cone(orbit_obj.data, 90.0, 180.0, 0.1)

orbit_path = orbit_path_for_speaker(orbit_obj, radius=3.0, height=1.0, scene=scene)

# ── Bake positions for export ─────────────────────────────────────────────────
scene.frame_set(BAKE_FRAME_START)
bpy.context.view_layer.update()

manifest = {
    "blender_version": "5.1",
    "frame_start":     BAKE_FRAME_START,
    "frame_end":       BAKE_FRAME_END,
    "frame_step":      BAKE_STEP,
    "distance_model":  "inverse",    # matches Blender's attenuation model
    "speakers": [
        speaker_to_dict(amb_obj,   bake_speaker_positions(amb_obj,   scene)),
        speaker_to_dict(dir_obj,   bake_speaker_positions(dir_obj,   scene)),
        speaker_to_dict(orbit_obj, bake_speaker_positions(orbit_obj, scene)),
    ],
    "three_js_note": (
        "For each speaker: const pa = new THREE.PositionalAudio(listener); "
        "pa.setDistanceModel('inverse'); pa.setRolloffFactor(rolloff_factor); "
        "pa.setRefDistance(ref_distance_m); pa.setMaxDistance(max_distance_m); "
        "pa.panner.coneInnerAngle=cone_inner_deg; "
        "pa.panner.coneOuterAngle=cone_outer_deg; "
        "pa.panner.coneOuterGain=cone_outer_gain; "
        "object3d.add(pa);"
    ),
}

json_path = bpy.path.abspath(OUTPUT_JSON)
os.makedirs(os.path.dirname(json_path), exist_ok=True) if os.path.dirname(json_path) else None
with open(json_path, 'w') as fh:
    json.dump(manifest, fh, indent=2)
print(f"[blueprint] Exported → {json_path}")

# ── GLB export ────────────────────────────────────────────────────────────────
# NOTE: the GLTF exporter does not embed Speaker audio data.
# The GLB carries the spatial geometry and speaker OBJECT positions only.
# speakers_manifest.json is the authoritative audio parameter source.
bpy.ops.export_scene.gltf(
    filepath                             = bpy.path.abspath(OUTPUT_GLB),
    export_format                        = 'GLB',
    use_selection                        = False,
    export_extras                        = True,   # carry sp.name in mesh extras
    export_animations                    = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_yup                           = True,
)
print(f"[blueprint] Exported → {bpy.path.abspath(OUTPUT_GLB)}")
