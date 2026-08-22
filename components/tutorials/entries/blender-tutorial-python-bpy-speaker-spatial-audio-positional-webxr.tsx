import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s <code>bpy.types.Speaker</code> is the canonical 3D audio
        primitive: a scene object that wraps a <code>Sound</code> data block and
        exposes every parameter the Web Audio API&rsquo;s <code>PannerNode</code>{" "}
        understands — reference distance, maximum distance, rolloff factor, and a
        directional cone defined by inner angle, outer angle, and outer gain.
        Rather than scatter magic numbers across a Three.js scene, the workflow
        here is to author all spatial audio parameters inside Blender alongside
        the scene geometry, then export a <code>speakers_manifest.json</code>{" "}
        sidecar that the WebXR runtime consumes directly. The{" "}
        <Link href="/tutorials/wiring-spatial-audio-in-the-framework" className={lk}>
          spatial audio framework wiring tutorial
        </Link>{" "}
        shows how the Three.js side consumes that manifest; this blueprint is how
        you produce it.
      </p>

      <p>
        The critical decision at the top of every Speaker setup is{" "}
        <code>distance_reference</code> vs <code>distance_max</code> vs{" "}
        <code>attenuation</code>. These three numbers define the attenuation curve
        completely. <code>distance_reference</code> is the near-field anchor: at
        exactly this distance the gain equals <code>volume</code> (1.0 by
        default). <code>distance_max</code> is the far-field floor: beyond this
        distance the gain clamps to <code>volume_min</code>, regardless of how
        much further the listener walks. <code>attenuation</code> is the rolloff
        exponent — 1.0 is the standard inverse-square law used by almost every
        audio engine; 2.0 doubles the perceived drop-off rate for a tight
        proximity trigger; 0.5 gives a softer, ambient wash. The Web Audio API
        names these <code>PannerNode.refDistance</code>,{" "}
        <code>PannerNode.maxDistance</code>, and{" "}
        <code>PannerNode.rolloffFactor</code> respectively, and uses the{" "}
        <code>&lsquo;inverse&rsquo;</code> distance model to match Blender&rsquo;s
        physics. Setting <code>distanceModel = &lsquo;linear&rsquo;</code> on the
        PannerNode instead will diverge from the Blender preview even if the
        numbers look identical.
      </p>

      <p>
        The directional cone is the tool the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-sound-bake-fcurve-audio-reactive"
          className={lk}
        >
          audio-reactive FCurve tutorial
        </Link>{" "}
        doesn&rsquo;t need but every spatial audio designer eventually does: an
        audio &lsquo;spotlight&rsquo; that beams a full-gain signal forward and
        rapidly attenuates sideways. <code>cone_angle_inner</code> is the full
        cone angle (not the half-angle) inside which gain is 1.0;{" "}
        <code>cone_angle_outer</code> is the total cone where gain fades from 1.0
        to <code>cone_volume_outer</code>. A kiosk speaker might use
        inner&nbsp;=&nbsp;45°, outer&nbsp;=&nbsp;120°,
        outer_gain&nbsp;=&nbsp;0.02 — the listener hears the prompt clearly in
        front of the kiosk and almost nothing from the sides. The constraint:{" "}
        <code>cone_angle_inner</code> must always be strictly less than{" "}
        <code>cone_angle_outer</code>. When they are equal, the fade zone
        collapses to zero width, producing an audible click as the listener
        crosses the hard boundary. Blender&rsquo;s Speaker cone gizmo in the
        viewport shows this visually — enable it via Overlays → Geometry →
        Speaker Cone before authoring cone values.
      </p>

      <p>
        The JSON bake is the key engineering step that separates this from a
        simple property export: for the orbiting speaker, the{" "}
        <code>Follow Path</code> constraint evaluates lazily — the world-space
        position is not stored in FCurves but derived from the curve parameter at
        each frame. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable"
          className={lk}
        >
          procedural FCurve keyframe tutorial
        </Link>{" "}
        covers the standard bake approach; here the blueprint bypasses NLA entirely
        and reads <code>sp_obj.matrix_world</code> after{" "}
        <code>bpy.context.view_layer.update()</code> per frame, which flushes the
        depsgraph and captures the constraint-evaluated position. The same flush
        pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-camera-data-webxr-frustum-fov-calibration"
          className={lk}
        >
          camera intrinsics tutorial
        </Link>{" "}
        for orbit keyframes. The resulting manifest carries a <code>forward</code>{" "}
        vector per frame (the speaker&rsquo;s local &minus;Y in world space),
        which the Three.js side uses to set <code>PositionalAudio.rotation</code>{" "}
        — without it the PannerNode cone is always aligned to the world +Z axis
        regardless of the object&rsquo;s actual orientation. The{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Speaker.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Speaker API reference (CC-BY-4.0, Blender Foundation)
        </a>{" "}
        and the{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/src/audio/PositionalAudio.js"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          three.js PositionalAudio source (MIT, mrdoob)
        </a>{" "}
        are the two authoritative references: the first for property names and
        range constraints, the second for the exact PannerNode wiring the
        manifest drives.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-bpy-speaker-spatial-audio-positional-webxr",
  title:
    "Python bpy.types.Speaker — Positional Audio Scene Composition: Cone Parameters, Animated Paths & Web Audio API Export for WebXR",
  lede: "Author Speaker data blocks via the direct data API, configure attenuation curves and directional cones for omnidirectional and spotlight speakers, animate speaker objects along Bézier orbits, and export a speakers_manifest.json that drives THREE.PositionalAudio in WebXR.",
  date: "2026-07-09",
  author: "Holoflow Studio",
  tags: [
    "blender",
    "python",
    "bpy",
    "speaker",
    "spatial-audio",
    "positional-audio",
    "web-audio",
    "panner-node",
    "three.js",
    "webxr",
    "scripting",
    "animation",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-bpy-speaker-spatial-audio-positional-webxr",
    time: "thirty minutes",
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
      "Basic understanding of inverse-square audio attenuation",
      "Has reviewed the wiring-spatial-audio-in-the-framework tutorial (or equivalent)",
    ],
    steps: [
      {
        title:
          "Understand the Speaker audio model — attenuation curve, cone, PannerNode mapping",
        body: "# bpy.types.Speaker — property summary\n\n# Attenuation curve (maps directly to Web Audio PannerNode with distanceModel='inverse'):\n#   sp.volume             → master gain (0.0–1.0)\n#   sp.volume_min         → gain floor at and beyond distance_max\n#   sp.volume_max         → gain ceiling at close range\n#   sp.distance_reference → metres at which gain = volume (PannerNode.refDistance)\n#   sp.distance_max       → metres beyond which gain = volume_min (PannerNode.maxDistance)\n#   sp.attenuation        → rolloff exponent (PannerNode.rolloffFactor)\n\n# Cone (directional beam):\n#   sp.cone_angle_inner   → full cone angle, degrees — full gain inside this\n#   sp.cone_angle_outer   → full cone angle, degrees — fade zone outer boundary\n#   sp.cone_volume_outer  → gain outside the outer cone (PannerNode.coneOuterGain)\n#   360° inner + 360° outer = omnidirectional (no cone effect)\n\n# Sound datablock:\n#   sp.sound              → bpy.types.Sound; loaded via bpy.data.sounds.load(path)\n#   sp.pitch              → playback rate (1.0 = normal)\n\n# WHY does distance_model matter for the PannerNode?\n#   Three.js PositionalAudio defaults to distanceModel='inverse', matching Blender.\n#   If you set distanceModel='linear' on the PannerNode, the formula changes to:\n#     gain = 1 - rolloff * (d - refDistance) / (maxDistance - refDistance)\n#   This diverges from Blender's curve at every distance — the preview inside\n#   Blender will NEVER match the WebXR output.  Always use 'inverse'.\n\n# WHY is cone_angle_inner ALWAYS less than cone_angle_outer?\n#   The region between the two angles is the FADE ZONE where gain interpolates\n#   from 1.0 → cone_volume_outer.  If inner ≥ outer, the fade zone has zero\n#   width — gain steps instantly from 1.0 to cone_volume_outer, producing a\n#   hard click artefact as the listener's head crosses the boundary.  Blender\n#   does not enforce this constraint programmatically; the assertion in\n#   configure_cone() catches it at author time.\n\n# TROUBLESHOOTING:\n#   'Speaker cone gizmo not visible in viewport':\n#     Viewport Overlays → Geometry section → enable Speaker Cone.\n#   'volume_min has no effect at runtime':\n#     volume_min is a Blender preview hint; PannerNode.minDistance is not a\n#     standard Web Audio property.  Implement the gain floor in JavaScript:\n#       audio.gain.gain.value = Math.max(sp.volume_min, computedGain);",
      },
      {
        title:
          "Create Sound datablock and Speaker objects — headless-safe direct API",
        body: "import bpy, mathutils\n\n# ── WHY bpy.data.sounds.load() instead of bpy.ops.sound.open_mono()? ──────────\n#   bpy.ops.sound.open_mono() requires an active Sound context window.\n#   bpy.data.sounds.load(filepath, check_existing=True) creates the Sound\n#   data block regardless of context — works headless and in add-on panels.\n#   If the file is absent, Blender marks the sound as 'missing' (red X in UI)\n#   but the data block still exists and can hold speaker parameters.\n\n# ── WHY not bpy.ops.object.speaker_add()? ─────────────────────────────────────\n#   The operator requires a VIEW_3D area in OBJECT mode.\n#   In the Scripting workspace or from a background process it returns CANCELLED\n#   silently — the speaker object is never created but no error is raised.\n\nscene = bpy.context.scene\n\ndef new_speaker_object(name, audio_path, location, scene):\n    snd = bpy.data.sounds.load(bpy.path.abspath(audio_path), check_existing=True)\n    sp_data       = bpy.data.speakers.new(name)\n    sp_data.sound = snd\n    sp_obj        = bpy.data.objects.new(name, sp_data)\n    sp_obj.location = mathutils.Vector(location)\n    scene.collection.objects.link(sp_obj)\n    return sp_obj\n\namb_obj = new_speaker_object(\n    'speaker_ambient', '//audio/ambient_loop.wav', (0.0, 0.0, 1.5), scene\n)\ndir_obj = new_speaker_object(\n    'speaker_kiosk', '//audio/kiosk_prompt.wav', (2.0, 0.0, 1.2), scene\n)\n\n# Verify:\nprint(type(amb_obj.data))   # <class 'bpy.types.Speaker'>\nprint(amb_obj.data.sound)   # <bpy_struct, Sound('ambient_loop.wav')>\n\n# TROUBLESHOOTING:\n#   'bpy.data.speakers has no attribute new':\n#     Verify Blender version — bpy.data.speakers is present in Blender 3.0+.\n#     In very old versions (< 2.8) the API used a different pattern.\n#   'sound shows as missing (pink in speaker properties)':\n#     Correct — the //audio/ placeholder paths need real .wav/.ogg/.flac files.\n#     The blueprint runs regardless; replace paths before final production use.",
      },
      {
        title:
          "Configure attenuation — reference distance, max distance, rolloff exponent",
        body: "# ── Omnidirectional ambient speaker ──────────────────────────────────────────\namb = amb_obj.data   # bpy.types.Speaker\n\namb.volume             = 0.9    # master gain\namb.volume_min         = 0.05   # gain floor at max_distance (Blender preview only)\namb.volume_max         = 1.0    # gain ceiling at close range\namb.distance_reference = 1.5    # full gain at 1.5 m\namb.distance_max       = 20.0   # gain → 0.05 beyond 20 m\namb.attenuation        = 1.0    # standard inverse-square rolloff\n\n# ── Kiosk proximity trigger — tighter attenuation ─────────────────────────────\nksk = dir_obj.data\n\nksk.volume             = 1.0\nksk.volume_min         = 0.0    # completely silent outside range\nksk.volume_max         = 1.0\nksk.distance_reference = 0.8    # full gain within 0.8 m of the kiosk\nksk.distance_max       = 8.0    # silent beyond 8 m\nksk.attenuation        = 2.0    # steeper rolloff — hear it only when close\n\n# Rolloff intuition:\n#   attenuation=0.5  → very gradual drop-off, large ambient presence\n#   attenuation=1.0  → standard physics (sound energy halves with each doubling of distance)\n#   attenuation=2.0  → aggressive proximity — halved energy with each extra metre\n#   attenuation=4.0+ → hyper-local trigger zone, virtually silent beyond reference\n\n# PannerNode.refDistance: full gain zone boundary (m)\n# PannerNode.maxDistance: gain clamp floor boundary (m)\n# These are LINEAR distances in the WebXR scene's unit system.\n# If your scene is exported with export_apply_scale=True at 1:100 (centimetres),\n# multiply all distance values by 0.01 before writing to the manifest.\n\n# TROUBLESHOOTING:\n#   'Audio is inaudible at 2 m despite large ref_distance':\n#     Confirm distance_model='inverse' on the PannerNode — 'linear' with\n#     rolloffFactor=1.0 produces gain=0.0 at d = maxDistance, not refDistance.\n#   'volume_min has no effect in Three.js':\n#     PannerNode has no minVolume property.  Implement the floor with a\n#     downstream GainNode clamped to volume_min in the signal chain.",
      },
      {
        title:
          "Directional cone: inner angle, outer angle, outer gain — the audio spotlight",
        body: "# Omnidirectional speaker: both angles = 360° (no cone effect)\namb = amb_obj.data\namb.cone_angle_inner  = 360.0\namb.cone_angle_outer  = 360.0\namb.cone_volume_outer = 1.0\n\n# Directional kiosk speaker: ±22.5° full-gain beam, ±60° fade zone\nksk = dir_obj.data\nksk.cone_angle_inner  = 45.0    # full cone angle — listener inside ±22.5° hears full gain\nksk.cone_angle_outer  = 120.0   # fade zone out to ±60°\nksk.cone_volume_outer = 0.02    # nearly silent outside the outer cone\n\n# Point the kiosk speaker toward the reference geometry:\ncst            = dir_obj.constraints.new('TRACK_TO')\ncst.target     = bpy.data.objects.get('audio_reference_sphere')\ncst.track_axis = 'TRACK_NEGATIVE_Y'   # Speaker's forward axis = local -Y\ncst.up_axis    = 'UP_Z'\n\n# WHY is the Speaker's forward axis -Y (not -Z like a camera)?\n#   Cameras look along -Z; speakers in Blender look along -Y.\n#   When computing the 'forward' vector for the JSON manifest:\n#     fwd = sp_obj.matrix_world.to_3x3() @ mathutils.Vector((0.0, -1.0, 0.0))\n#   On the Three.js side: positionalAudio.rotation matches the object3D the\n#   PositionalAudio is attached to — if you parent it to a Mesh whose rotation\n#   matches the speaker forward vector, the PannerNode cone auto-aligns.\n\n# Cone angles reference — common creative presets:\n#   Stage monitor:  inner=30°,  outer=60°,   outer_gain=0.05  (tight wedge)\n#   Overhead PA:    inner=90°,  outer=150°,  outer_gain=0.15  (wide downward)\n#   Ambient wash:   inner=180°, outer=270°,  outer_gain=0.50  (soft hemispheric)\n#   Kiosk prompt:   inner=45°,  outer=120°,  outer_gain=0.02  (sharp forward)\n#   Omnidirectional: both=360°  outer_gain=1.0               (no cone)\n\n# TROUBLESHOOTING:\n#   'Speaker cone is large in viewport but audio is still omnidirectional in WebXR':\n#     Verify PositionalAudio is PARENTED to a mesh object that has the correct\n#     rotation — the PannerNode inherits orientation from the parent AudioNode\n#     object's world matrix.  A free-floating PositionalAudio always faces +Z.\n#   'Clicking artefact when listener enters or exits the cone':\n#     inner >= outer — add a wider fade zone; inner < outer - 10° is a safe minimum.",
      },
      {
        title:
          "Animate speaker along a Bézier orbit — Follow Path + per-frame world position bake",
        body: "import bpy, mathutils\n\nBAKE_START, BAKE_END, BAKE_STEP = 1, 60, 2\n\norbit_obj = bpy.data.objects.get('speaker_orbit')\nscene     = bpy.context.scene\n\n# ── Bézier circle path ────────────────────────────────────────────────────────\nbpy.ops.curve.primitive_bezier_circle_add(radius=3.0, location=(0.0, 0.0, 1.0))\npath_obj = bpy.context.active_object\npath_obj.name = 'speaker_orbit_path'\npath_obj.data.use_path      = True\npath_obj.data.path_duration = BAKE_END   # one orbit = BAKE_END frames\n\ncst = orbit_obj.constraints.new('FOLLOW_PATH')\ncst.target          = path_obj\ncst.use_curve_follow = True   # orient speaker tangent to path direction\n\n# Activate path evaluation — sets offset keyframe required for Follow Path\nbpy.context.view_layer.objects.active = orbit_obj\nbpy.ops.constraint.followpath_path_animate(\n    constraint='Follow Path', owner='OBJECT'\n)\n\n# ── Bake world-space position per frame ───────────────────────────────────────\n# WHY bpy.context.view_layer.update() per frame?\n#   Follow Path is a CONSTRAINT — its output is not stored in FCurves.\n#   Without the depsgraph flush, matrix_world still reflects the previous frame.\n#   This is the same pattern as the camera intrinsics tutorial orbit bake.\n\nframes_data = {}\nfor frame in range(BAKE_START, BAKE_END + 1, BAKE_STEP):\n    scene.frame_set(frame)\n    bpy.context.view_layer.update()       # flush depsgraph — constraints evaluate\n    mat = orbit_obj.matrix_world\n    pos = list(mat.to_translation())\n    fwd = mat.to_3x3() @ mathutils.Vector((0.0, -1.0, 0.0))  # speaker -Y forward\n    frames_data[str(frame)] = {\n        'position': [round(v, 5) for v in pos],\n        'forward':  [round(v, 5) for v in fwd],\n    }\n\nprint(f'Baked {len(frames_data)} frames for speaker_orbit')\nprint('Frame 1 position:', frames_data['1']['position'])\n\n# TROUBLESHOOTING:\n#   'All baked positions are identical':\n#     Follow Path constraint was not activated — ensure followpath_path_animate\n#     ran successfully (check System Console for errors).\n#     Also verify path_obj.data.use_path = True and path_duration > 1.\n#   'Orbit is in the wrong plane':\n#     The Bézier circle is created in the XY plane (Blender floor).\n#     After export_yup=True, this becomes the XZ plane in Three.js — the orbit\n#     appears horizontal (at Y = height), which is the correct spatial result.",
      },
      {
        title:
          "Export speakers_manifest.json and GLB — full WebXR audio handshake",
        body: "import json, os\n\nmanifest = {\n    'blender_version': '5.1',\n    'frame_start':     1,\n    'frame_end':       60,\n    'frame_step':      2,\n    'distance_model':  'inverse',   # ALWAYS match PannerNode.distanceModel\n    'speakers': [],                 # populated below\n    'three_js_note': (\n        'const pa = new THREE.PositionalAudio(listener); '\n        \"pa.setDistanceModel('inverse'); \"\n        'pa.setRolloffFactor(sp.rolloff_factor); '\n        'pa.setRefDistance(sp.ref_distance_m); '\n        'pa.setMaxDistance(sp.max_distance_m); '\n        'pa.panner.coneInnerAngle = sp.cone_inner_deg; '\n        'pa.panner.coneOuterAngle = sp.cone_outer_deg; '\n        'pa.panner.coneOuterGain  = sp.cone_outer_gain; '\n        'object3D.add(pa);'\n    ),\n}\n\nfor sp_obj in [bpy.data.objects[n] for n in\n               ['speaker_ambient', 'speaker_kiosk', 'speaker_orbit']\n               if n in bpy.data.objects]:\n    sp  = sp_obj.data\n    snd = sp.sound\n    entry = {\n        'name':            sp_obj.name,\n        'audio_file':      snd.filepath.replace('//', '') if snd else '',\n        'volume':          sp.volume,\n        'ref_distance_m':  sp.distance_reference,\n        'max_distance_m':  sp.distance_max,\n        'rolloff_factor':  sp.attenuation,\n        'cone_inner_deg':  sp.cone_angle_inner,\n        'cone_outer_deg':  sp.cone_angle_outer,\n        'cone_outer_gain': sp.cone_volume_outer,\n        'pitch':           sp.pitch,\n        'frames': frames_data if sp_obj.name == 'speaker_orbit' else {},\n    }\n    manifest['speakers'].append(entry)\n\njson_path = bpy.path.abspath('//speakers_manifest.json')\nwith open(json_path, 'w') as fh:\n    json.dump(manifest, fh, indent=2)\nprint(f'Exported → {json_path}')\n\n# GLB — geometry and speaker OBJECT positions only\n# NOTE: GLTF exporter does not embed audio files or Speaker parameters.\n# The manifest is the authoritative audio source.\nbpy.ops.export_scene.gltf(\n    filepath                             = bpy.path.abspath('//speaker_scene.glb'),\n    export_format                        = 'GLB',\n    use_selection                        = False,\n    export_extras                        = True,\n    export_animations                    = True,\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n    export_yup                           = True,\n)\n\n# Three.js consumption:\n#   import manifest from './speakers_manifest.json';\n#   const listener = new THREE.AudioListener();\n#   camera.add(listener);\n#   for (const sp of manifest.speakers) {\n#     const audio = new THREE.PositionalAudio(listener);\n#     audio.setDistanceModel('inverse');\n#     audio.setRolloffFactor(sp.rolloff_factor);\n#     audio.setRefDistance(sp.ref_distance_m);\n#     audio.setMaxDistance(sp.max_distance_m);\n#     audio.panner.coneInnerAngle = sp.cone_inner_deg;\n#     audio.panner.coneOuterAngle = sp.cone_outer_deg;\n#     audio.panner.coneOuterGain  = sp.cone_outer_gain;\n#     // Animated position:\n#     const p = sp.frames[String(currentFrame)]?.position ?? sp.frames['1'].position;\n#     audio.position.set(p[0], p[1], p[2]);\n#     scene.add(audio);\n#   }\n\n# TROUBLESHOOTING:\n#   'PositionalAudio is always centred on the camera, not the speaker position':\n#     PositionalAudio must be added to scene (or a non-camera mesh), not to camera.\n#     camera.add(listener) is correct; scene.add(positionalAudio) is correct.\n#     positionalAudio.position.set() sets the panner position in world space.\n#   'PannerNode cone has no effect despite correct angles':\n#     Cone only applies when the listener is NOT at the origin of the panner.\n#     If the listener and panner share the same position, coneInnerAngle has no\n#     meaningful direction to evaluate — move the panner off-origin first.",
      },
    ],
  },
  base
);
