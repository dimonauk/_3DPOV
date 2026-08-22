import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every animated GLB you export from Blender rests on a stack of
        data-blocks most people never inspect directly: an{" "}
        <strong>Action</strong> that owns the FCurves, FCurves that own the
        keyframe points, and an <strong>NLA editor</strong> that sequences
        multiple Actions into a single scene timeline without merging them.
        This tutorial authors three distinct poi spin patterns — butterfly,
        helicopter, and weave — as independent reusable Actions via the{" "}
        <code>bpy.data.actions</code> API, then stacks them with NLA strips
        for a clean 240-frame performance export.
      </p>
      <p>
        The critical technique is the <em>batch FCurve path</em>:{" "}
        <code>keyframe_points.add(n)</code> pre-allocates slots, direct{" "}
        <code>.co</code> assignment fills them, and a single{" "}
        <code>fc.update()</code> call at the end runs one sort and one handle
        recalculation pass. Compared with calling{" "}
        <code>keyframe_points.insert()</code> inside a Python loop, this is
        three to five times faster for key counts above fifty, because the
        sequential-insert path re-sorts the entire keyframe list and
        recalculates handles on every call.
      </p>

      <h2>The Action data model</h2>
      <p>
        An Action is a named container in <code>bpy.data.actions</code>. It
        holds FCurves; each FCurve addresses one animated channel of one
        property — a single component of a vector, one colour channel, a
        boolean toggle. For a location property three FCurves are needed:{" "}
        <code>data_path="location"</code> with <code>index</code> 0, 1, and
        2 respectively.
      </p>
      <pre>{`action = bpy.data.actions.new("hf_poi_butterfly")

# Each call creates one channel curve.
# action_group is purely cosmetic — groups FCurves in the editor sidebar.
fc_x = action.fcurves.new(data_path="location", index=0, action_group="Location")
fc_y = action.fcurves.new(data_path="location", index=1, action_group="Location")
fc_z = action.fcurves.new(data_path="location", index=2, action_group="Location")`}</pre>
      <p>
        The Action is not yet connected to any object. It is a free-floating
        data-block — you can inspect it under <em>Dope Sheet → Action Editor</em>{" "}
        by switching the header dropdown from <em>Dope Sheet</em> to{" "}
        <em>Action Editor</em>. Only once you assign it to an object&apos;s{" "}
        <code>animation_data</code> does it animate anything.
      </p>

      <h2>Batch keyframe insertion</h2>
      <pre>{`def bake_location(action, samples):
    # samples: list of (frame, x, y, z)
    paths = ("location", 0), ("location", 1), ("location", 2)
    for (dp, idx), values in zip(paths, zip(*[(x,y,z) for _,x,y,z in samples])):
        fc = action.fcurves.new(data_path=dp, index=idx, action_group="Location")
        pts = fc.keyframe_points
        pts.add(len(samples))          # ← pre-allocate: one allocation, not N
        for i, (fr, val) in enumerate(zip([s[0] for s in samples], values)):
            pts[i].co               = (fr, val)
            pts[i].interpolation    = 'BEZIER'
            pts[i].handle_left_type  = 'AUTO'
            pts[i].handle_right_type = 'AUTO'
        fc.update()                    # ← one sort + handle pass for all keys`}</pre>

      <h2>Why AUTO handles, not VECTOR?</h2>
      <p>
        <code>AUTO</code> handle type asks Blender to compute the Bézier
        tangent at each key so that the curve passes smoothly through the
        surrounding points — the classic Catmull-Rom-like behaviour. For poi
        motion this is correct: the ball follows a continuous path with no
        abrupt velocity changes between keyframes.
      </p>
      <p>
        <code>VECTOR</code> handles aim the tangent directly at the adjacent
        keyframe, producing piecewise-linear motion. Useful for mechanical
        animation (valves, pistons) but wrong for poi paths, which should
        have smooth velocity profiles through each sample.
      </p>
      <p>
        <code>FREE</code> handles allow fully independent left and right
        tangents — necessary when you need a sharp velocity discontinuity
        mid-curve, such as a sudden contact bounce. Not needed here.
      </p>
      <p>
        Compare with the Kuramoto tutorial&apos;s direct fcurve baking, where{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          emission-colour keyframes
        </Link>{" "}
        use the same batch pattern but on{" "}
        <code>inputs[0].default_value</code> paths inside material node
        trees.
      </p>

      <h2>Setting action.frame_range</h2>
      <pre>{`act.frame_range = (1, FRAMES_PER_PATTERN)   # e.g. (1, 80)`}</pre>
      <p>
        The NLA editor reads <code>action.frame_range</code> to determine how
        long a strip is when you drop the Action onto a track. Without setting
        it explicitly, Blender derives it from the lowest and highest keyframe
        numbers — which is correct here since our keys run from frame 1 to 80.
        Setting it explicitly is safer: if a future edit adds a key outside
        that range, the strip length is unchanged.
      </p>

      <h2>NLA strip stacking</h2>
      <pre>{`ad = obj.animation_data_create()
ad.action = None    # clear direct-action binding before NLA

for action, nla_start in sequence:
    track       = ad.nla_tracks.new()
    track.name  = action.name
    strip       = track.strips.new(action.name, int(nla_start), action)
    strip.blend_type    = 'REPLACE'
    strip.use_auto_blend = False
    strip.blend_in      = 0.0
    strip.blend_out     = 0.0`}</pre>
      <p>
        Each Action gets its own track. Tracks are evaluated bottom-to-top in
        Blender&apos;s NLA stack — a higher track&apos;s strip overrides lower ones
        within its time range when <code>blend_type = 'REPLACE'</code>.
        Placing each pattern on a separate track rather than the same track
        avoids the constraint that strips on one track cannot overlap.
      </p>

      <h2>Blend types: REPLACE vs ADD vs COMBINE</h2>
      <p>
        <strong>REPLACE</strong>: the strip&apos;s evaluated value completely
        replaces any result from lower tracks. Correct for sequenced,
        non-overlapping patterns — each one is fully in charge during its
        window.
      </p>
      <p>
        <strong>ADD</strong>: the strip&apos;s value is <em>added</em> to the
        result below it. Used for additive layers — for example, a breathing
        layer that nudges a character&apos;s chest offset without touching the
        base walk cycle.
      </p>
      <p>
        <strong>COMBINE</strong>: uses channel-specific combination — location
        adds, rotation multiplies (quaternion product). Closer to physically
        correct layering of transformations but more expensive to evaluate.
        See{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          the spring-pendulum poi tutorial
        </Link>{" "}
        for a case where combined offsets matter.
      </p>

      <h2>Clearing ad.action before NLA</h2>
      <p>
        If an object has both a direct-action binding (<code>ad.action</code>)
        and NLA strips, Blender evaluates the direct action <em>on top of</em>{" "}
        the NLA result. Setting <code>ad.action = None</code> before building
        the NLA prevents this double-evaluation, which would shift the poi
        ball to the direct action&apos;s start position at frame 1 regardless of
        which NLA strip is active.
      </p>

      <h2>Exporting animated GLB</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath="//hf_poi_performance.glb",
    export_format='GLB',
    export_yup=True,
    export_animations=True,
    export_nla_strips=True,
    export_nla_strips_merged_animation_name="poi_performance",
)`}</pre>
      <p>
        <code>export_nla_strips=True</code> bakes all NLA strips into the GLB
        output as a single merged animation track named{" "}
        <code>poi_performance</code>. Without this flag, only the direct{" "}
        <code>ad.action</code> binding is exported — which is <code>None</code>{" "}
        in our setup, producing a static GLB with no animation.
      </p>
      <p>
        In three.js / A-Frame / Babylon.js the animation is loaded via the
        usual <code>AnimationMixer</code> and played with{" "}
        <code>action.play()</code>. The poi traces all three patterns
        sequentially within one 10-second clip at 24 fps.
      </p>

      <h2>Blender 4.4+ Action Slot note</h2>
      <p>
        In Blender 4.4, Blender introduced a &quot;slotted Actions&quot; system
        allowing one Action to simultaneously drive multiple object types (a
        mesh, an armature, and a light, for example). In 5.1 this is the
        preferred path for complex rigs. The blueprint uses the legacy
        single-object API (<code>action.fcurves.new()</code> directly) which
        remains fully supported. For multi-ID Actions in 5.1, the new path is{" "}
        <code>slot = action.slots.new(id_type=&apos;OBJECT&apos;, name=obj.name)</code>{" "}
        followed by <code>obj.animation_data.action_slot = slot</code>. The
        FCurve binding API is otherwise identical.
      </p>

      <h2>Poi path geometry</h2>
      <p>
        The three patterns use parametric curves mapped onto{" "}
        <code>t ∈ [0, 2π]</code> over <code>FRAMES_PER_PATTERN</code> frames:
      </p>
      <pre>{`# Butterfly (Lissajous 2:1, 2 cycles):
x = CORD_LEN · sin(2·2π·t)
y = CORD_LEN · sin(2·2·2π·t) · 0.45
z = HAND_Z  − CORD_LEN · 0.25 · (1 − cos(t))

# Helicopter (horizontal circle, 3 revolutions):
x = CORD_LEN · cos(3·2π·t)
y = CORD_LEN · sin(3·2π·t)
z = HAND_Z + 0.50

# Weave (3-beat lateral + 1-cycle front-back arc):
x = 0.70 · sin(3·2π·t)
y = CORD_LEN · cos(2π·t)
z = HAND_Z − CORD_LEN · 0.45 · |sin(1.5·2π·t)|`}</pre>
      <p>
        These are idealised — a real poi weave would also animate hand
        position. The parametric path captures the poi-head locus that appears
        in long-exposure photography. Compare the Lissajous approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          spring-pendulum poi light-painting tutorial
        </Link>{" "}
        where the path emerges from a physical simulation rather than an
        analytic formula.
      </p>
      <p>
        To extend into trails visible in WebXR, feed the poi ball&apos;s animated
        position through the technique in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points-to-Curves poi trail tutorial
        </Link>
        : sample the world-space position each frame with a geometry-nodes
        modifier and convert the point cloud to a ribbon mesh.
      </p>

      <h2>Quaternion rotation (extension)</h2>
      <p>
        The blueprint only animates location. To make the poi ball face its
        direction of travel, add quaternion rotation channels. The quaternion
        that rotates the local +Y axis to the velocity vector{" "}
        <code>v = pos(t+1) − pos(t)</code> is:
      </p>
      <pre>{`import mathutils
vel = pos_next - pos_curr      # mathutils.Vector
rot = mathutils.Vector((0,1,0)).rotation_difference(vel.normalized())
# rot is a mathutils.Quaternion → (w, x, y, z)

# Set object rotation mode first:
obj.rotation_mode = 'QUATERNION'

# Four FCurve channels per keyframe:
fc_w = action.fcurves.new("rotation_quaternion", index=0, action_group="Rotation")
fc_x = action.fcurves.new("rotation_quaternion", index=1, action_group="Rotation")
# ... similarly for y (2) and z (3)
# Then batch-insert as with location.`}</pre>
      <p>
        Quaternion interpolation avoids Euler gimbal lock — essential when the
        poi swings through vertical (helicopter → weave transition, frame 160).
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting"
          className={lk}
        >
          N-body star cluster tutorial
        </Link>{" "}
        shows the same <code>mathutils.Vector.rotation_difference()</code>{" "}
        technique applied to orient billboard quads toward the camera.
      </p>

      <h2>Troubleshooting</h2>
      <pre>{`# NLA strips appear but poi ball does not move on playback
→ ad.action is still set. Add: ad.action = None before build_nla().

# GLB loads but has no animation in three.js
→ export_nla_strips was False (default). Flip to True.
   Confirm: open GLB in Babylon.js sandbox — Animation tab should show
   "poi_performance" clip.

# All three patterns overlap at frame 1 position
→ strip.blend_type is ADD, not REPLACE. Each strip adds its offset.
   Change all strips to REPLACE.

# fc.update() causes a freeze for 2+ seconds
→ You have tens of thousands of keys. Use keyframe_points.add(n) +
   direct .co assignment instead of sequential .insert() calls.
   fc.update() is O(n log n) — the slow part is the sort, not the
   handle computation.

# Keyframes appear on wrong frames in Dope Sheet
→ Check that FRAMES_PER_PATTERN and KEY_DENSITY are correct.
   The frame_seq() range is [1, FRAMES_PER_PATTERN] inclusive.`}</pre>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
  title:
    "Python bpy Action & NLA Editor — Programmatic FCurve Keyframe Insertion, NLA Strip Sequencing & Poi Performance Animated GLB (Blender 5.1)",
  subtitle:
    "bpy.data.actions API; batch keyframe_points.add + fc.update pattern; AUTO vs VECTOR handle types; NLA track/strip stacking; REPLACE blend type; action.frame_range contract; export_nla_strips GLB.",
  description:
    "Author three poi spin patterns (butterfly figure-8, helicopter circle, 3-beat weave) as independent reusable Blender Actions using the direct FCurve data API, sequence them with NLA strips using REPLACE blending, and export a single 240-frame animated GLB for WebXR. Covers the batch keyframe-insertion performance pattern, handle types, action slot note for Blender 4.4+, and quaternion rotation extension.",
  date: "2026-07-24",
  tags: [
    "blender",
    "python",
    "animation",
    "nla",
    "fcurve",
    "keyframes",
    "action",
    "poi",
    "glb",
    "webxr",
    "scripting",
    "performance",
    "light-painting",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
});
