import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CastCartoonSquashBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Cast modifier morphs vertices toward a sphere, cylinder,
        or cuboid centroid via a single <code>factor</code> float — keyframeable,
        stackable, and requiring no rig whatsoever. Two Cast modifiers stacked in
        sequence produce cartoon squash-and-stretch that rivals a dedicated bone
        chain: the first collapses the mesh toward a flat disc on impact, the
        second elongates it into a teardrop at the apex. The technique is ideal
        for secondary animation on single-object props, bouncing creatures, and
        any cel-shaded character where skeleton complexity is unjustified.
      </p>
      <p>
        The modifier stack order is the technique&rsquo;s load-bearing detail.{" "}
        <strong>Simple Subdivision</strong> must sit in position [0] — not
        Catmull-Clark. Catmull-Clark moves base-mesh vertices toward the limit
        surface before subdivision, so <code>Cast factor=1.0</code> targets a
        slightly-shrunken sphere rather than the original blob radius. Simple
        subdivision only splits edges without repositioning, so the Cast target
        geometry aligns exactly with the sculpted blob. The{" "}
        <strong>CastCuboid</strong> modifier at position [1] morphs the XY
        cross-section into a square footprint; <code>use_z=False</code> leaves
        the vertical axis to keyframed <code>object.scale.z</code> for explicit
        volume compensation. The <strong>CastSphere</strong> at position [2] acts
        on the already-cuboid-deformed mesh and elongates the Z axis — at{" "}
        <code>factor=1.8</code> the blob crown extends roughly 1.4× its natural
        height. The Cast modifier accepts <code>factor</code> up to 10.0, so
        extreme cartoon spike shapes are reachable without shape keys. For a
        physics-based alternative to the same visual goal, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-soft-body-jelly-squash-stretch"
          className={lk}
        >
          Soft Body jelly squash tutorial
        </Link>{" "}
        — soft body calculates volume preservation automatically but cannot be
        keyframed to a precise timing. For character work where the squash must
        follow a skeleton, compare this modifier approach with the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm"
          className={lk}
        >
          Stretchy IK volume-preserve rig
        </Link>
        .
      </p>
      <p>
        Volume compensation is handled manually here, which is not a limitation
        but an opportunity for exaggeration. The squash frame uses{" "}
        <code>scale&nbsp;=&nbsp;(1.30,&nbsp;1.30,&nbsp;0.40)</code> and the
        stretch frame uses{" "}
        <code>scale&nbsp;=&nbsp;(0.85,&nbsp;0.85,&nbsp;1.50)</code>. Both
        approximate the original sphere volume but deliberately overshoot —
        the squash is 37% wider and the stretch is 50% taller. This controlled
        exaggeration is the whole point of cartoon secondary animation, and it
        cannot be achieved by a physics solver without tuning that takes longer
        than keyframing the scale directly. To pair the squash-stretch with
        timing noise for a bouncing feel, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped"
          className={lk}
        >
          F-Curve Modifiers: Noise and Cycles tutorial
        </Link>
        , which adds procedural bounce variation to any animated property via
        the F-Curve noise modifier — applicable directly to the Cast{" "}
        <code>factor</code> channel. The finished cel-shaded look for the blob
        is covered in the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE Toon Cel Shader tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-cast-sphere-cuboid-cartoon-squash",
  title:
    "Modifier — Cast: Sphere / Cuboid Morph for Cartoon Squash-and-Stretch (Blender 5.1)",
  date: "2026-06-21",
  kind: "tutorial",
  excerpt:
    "Stack Cast(CUBOID) and Cast(SPHERE) modifiers with keyframed factor values to produce Disney-style squash-and-stretch on a UV sphere blob — no rig, no shape keys, full overshoot control.",
  Body: CastCartoonSquashBody,
};

export const entry = buildInstructable(
  {
    time: "one sitting",
    difficulty: "beginner",
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/modifiers/modifier-cast-sphere-cuboid-cartoon-squash/",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Cast modifier available since Blender 2.4x; factor keyframing and EEVEE Next confirmed stable in 5.1.",
      },
    ],
    prerequisites: [
      "Comfortable adding modifiers in the Properties panel.",
      "Knows how to set keyframes (I key or right-click → Insert Keyframe).",
      "Basic Timeline / Playback familiarity.",
    ],
    steps: [
      {
        title: "Why Cast instead of shape keys or bones",
        body:
          "Shape key squash needs a sculpted key mesh, manual blending, and a driver to tie it to an action. A stretch bone chain requires IK targets, Stretch-To constraints, weight painting, and a controller rig — minimum 30 minutes of setup before animating.\n\nCast adds two modifiers and four float keyframes per axis. Total setup is under five minutes, and the modifier stack stays non-destructive — change the blob's base mesh and the squash-stretch updates automatically.\n\nLimitations: Cast works on single meshes only. Multi-component rigs (head + body + arms separate objects) need bones to coordinate. Use Cast for single-object character stand-ins, bouncing props, and background creatures; upgrade to bones when the character needs separate mesh components or lip-sync targets.",
      },
      {
        title: "Build the blob and add Simple Subdivision",
        body:
          "UV sphere, radius 0.45 m, 32 segments × 24 rings, centred at Z = 0.45 (resting on the ground plane). Shade Smooth.\n\nAdd a Subdivision Surface modifier, set Type to Simple. This is position [0] in the stack.\n\nWHY SIMPLE:\n  Catmull-Clark moves base-mesh vertices toward the interpolated limit surface during evaluation. A 0.45 m sphere subdivided with Catmull-Clark evaluates slightly smaller than 0.45 m because the surface vertex positions shift inward. Cast at factor=1.0 then targets a 0.45 m sphere but the mesh has already shrunk — a noticeable gap appears between the cast target and the actual geometry.\n  Simple subdivision only splits each edge at its midpoint without repositioning. The base mesh vertices stay at exactly 0.45 m, so Cast factor=1.0 maps cleanly to the original sphere surface.\n\nSet Levels Viewport to 2. This gives the 32×24 sphere 1792 faces — enough for smooth cuboid corner transitions without viewport stutter.",
      },
      {
        title: "Add CastCuboid — the squash modifier",
        body:
          "Add a Cast modifier at position [1]. Set:\n  Type    = Cuboid\n  Radius  = 1.26 m  (BLOB_RADIUS × 2.8 — must enclose every vertex)\n  Factor  = 0.0\n  use_x   = True\n  use_y   = True\n  use_z   = False\n  Use Radius as Size = off\n\nWHY use_z = False?\n  Cuboid cast in Z would compress the blob vertically toward a flat disc on its own — but the Cast-induced Z deformation is uniform and ignores volume. We separately animate object.scale.z = 0.40 at the squash frame, which compresses the mesh in world space AFTER the cuboid shape is applied. This decoupling makes volume compensation explicit: you can see and adjust the scale value independently of the cast blend.\n\nWHY radius > blob diameter?\n  The Cast modifier only influences vertices within the falloff sphere defined by Radius. If radius = BLOB_RADIUS (0.45 m), the outermost equatorial vertices sit exactly on the boundary and receive partial influence. Depending on the falloff curve, you get a pinched equator rather than a clean square perimeter. Set radius to 2.5–3× BLOB_RADIUS to guarantee 100% influence across every vertex.\n\nTest it: drag Factor to 1.0 — the blob should flatten to a near-square disc. Drag back to 0.",
      },
      {
        title: "Add CastSphere — the stretch modifier",
        body:
          "Add a second Cast modifier at position [2]. Set:\n  Type    = Sphere\n  Radius  = 1.26 m  (same as CastCuboid)\n  Factor  = 0.0\n  use_x   = False\n  use_y   = False\n  use_z   = True\n  Use Radius as Size = off\n\nStack note: CastSphere evaluates AFTER CastCuboid. At the squash frame, CastSphere.factor=0 so it does nothing and CastCuboid produces the disc. At the stretch frame, CastCuboid.factor=0 (blob has recovered) and CastSphere.factor=1.8 pulls the Z axis into a teardrop.\n\nFACTOR > 1.0:\n  Cast factor can exceed 1.0, up to a maximum of 10.0. At factor=1.0, all Z-axis vertices hit the sphere surface exactly. At factor=1.8, the cast overshoots — vertices are pushed 80% further past the sphere surface in the Z direction. This creates the characteristic cartoon teardrop where the crown extends well above the natural sphere boundary. Experiment: 1.5 = gentle stretch, 2.5 = aggressive spike, 3.5 = extreme anime-style stretch.\n\nTest: with CastCuboid.factor=0, drag CastSphere.factor to 1.8 — the blob should elongate into a tall teardrop. Drag back to 0.",
      },
      {
        title: "Keyframe the animation",
        body:
          "Timeline (24 fps):\n  Frame  1: both factors = 0.0,  scale = (1.0, 1.0, 1.0)  — natural shape\n  Frame 12: CuboidCast = 1.0,   scale = (1.3, 1.3, 0.4)   — squash impact\n  Frame 22: both factors = 0.0,  scale = (1.0, 1.0, 1.0)  — recovery\n  Frame 30: SphereCast = 1.8,   scale = (0.85, 0.85, 1.5) — stretch apex\n  Frame 42: both factors = 0.0,  scale = (1.0, 1.0, 1.0)  — settled\n\nKeyframing a modifier property:\n  Right-click the Factor slider → Insert Keyframe, or position the cursor on the field and press I. The field turns yellow to confirm.\n\nFor object.scale: press I in the 3D viewport with the blob selected → choose Scale, or right-click scale fields in Item Properties.\n\nVolume maths (sphere volume = 4/3 π r³):\n  Original:   r = 0.45 → V ≈ 0.382 m³\n  Squash:     scale (1.3, 1.3, 0.4) → V ≈ 0.381 m³  (≈ 100% preserved)\n  Stretch:    scale (0.85, 0.85, 1.5) → V ≈ 0.389 m³ (≈ 102% — slight surplus for cartoon bounciness)\n\nAfter keyframing, set all keyframe handles to Auto-Clamped (Graph Editor → A → T → Auto Clamped) for natural Disney easing. The squash impact reads fastest when the frames 10→12 transition is tight (reduce handle weight on frame 12 to sharpen the hit).",
      },
      {
        title: "Material: cel-shader emission blend",
        body:
          "A Principled BSDF blended with a small Emission component (factor 0.15) gives the blob a slight internal glow that reads well under EEVEE Next bloom settings without overpowering the shape silhouette.\n\nNodes:\n  TexCoord → (unused, reserved for future UV detail)\n  Principled BSDF: Base Color (0.18, 0.72, 0.42), Roughness 0.35, Metallic 0\n  Emission: same colour, Strength 0.35\n  Mix Shader: Fac = 0.15 (15% emission, 85% BSDF)\n\nEEVEE Next bloom: Threshold 0.8, Intensity 0.25 — the emission at 0.35 is below the threshold at most angles; only the brightest specular catch triggers bloom. This avoids the 'glowing blob' look while still adding a subtle cartoon aura.\n\nFor a full cel shader with ink-line outlines and flat colour bands, see the EEVEE Toon Cel Shader tutorial linked below.",
      },
      {
        title: "Export squash and stretch poses as GLBs",
        body:
          "Never apply modifiers on the working object — the live stack is the source of truth. Use the apply-on-duplicate pattern:\n\n  1. Set frame to 12 (squash).\n  2. Select the blob, duplicate it: Shift+D, then Esc (keep in place).\n  3. With the duplicate active: Object → Apply → All Modifiers.\n  4. Apply transforms: Ctrl+A → All Transforms.\n  5. File → Export → glTF 2.0 → GLB format, Draco level 6, WebP textures, +Y up.\n  6. Name the file cartoon_blob_squash.glb.\n  7. Delete the duplicate.\n  8. Repeat at frame 30 → cartoon_blob_stretch.glb.\n\nThe script (blueprint.py) automates this. The GLBs are static snapshots of the squash and stretch extremes — useful as prop assets in WebXR scenes where a character might be frozen mid-impact.",
      },
      {
        title: "Viewport render with record.py",
        body:
          "Open the .blend and run record.py from the Scripting workspace or:\n\n  blender cartoon_blob.blend --background --python record.py\n\nThe script adds a 60° camera orbit over 42 frames and renders EEVEE Next animation to:\n  public/library/videos/modifiers/modifier-cast-sphere-cuboid-cartoon-squash/viewport.mp4\n\n24 fps × 42 frames = 1.75 seconds at playback speed. This captures the full squash-and-stretch cycle with the orbit providing depth context. For a longer showcase, extend FRAME_REST to 80 and adjust the orbit end angle to 90°.",
      },
    ],
    finalResult:
      "A UV sphere cartoon blob with a non-destructive Cast modifier stack that squashes to a flat disc at frame 12 and stretches to a teardrop at frame 30 — keyframed via two float values and volume-compensated via object scale. Two GLB snapshots export the extreme poses for static WebXR prop use.",
    variations: [
      "Cylinder cast for a barrel roll: set CastCuboid.cast_type = 'CYLINDER' and animate with use_x=True, use_y=True, use_z=False — the blob morphs to a circular cylinder footprint rather than a square. Use this for characters rolling on the ground where a flat-bottomed disc is wrong but a circular cross-section is right. Combine with an object rotation keyframe on the Z axis for the roll motion.",
      "Animated Cast Radius for a travelling squash wave: keyframe CastCuboid.radius from BLOB_RADIUS (only the top squashes) to BLOB_RADIUS*3 (everything squashes). This creates a squeeze that travels from the outside inward — a different feel from the simultaneous whole-body squash. Pair with a bouncing-ball Z location track for a complete ball drop with contact squash.",
      "Two blobs sharing a Cast target: the Cast modifier's vertex_group property lets you mask which verts are influenced. Weight-paint two groups on a single elongated mesh (head region, body region) and apply separate Cast modifiers per group — one squashes the head, one squashes the body independently. Useful for a character whose head and torso have different secondary motion timing.",
    ],
    troubleshooting: [
      {
        symptom: "CastCuboid shows a round disc, not a square",
        cause:
          "Radius is smaller than the blob diameter, so equatorial verts fall outside the influence sphere and are not fully cast. The cast corners are rounded because only near-centre verts reach factor=1.0.",
        fix:
          "Increase mod.radius to at least 2.5 × BLOB_RADIUS. In the modifier panel: Cast → Radius field → set to 1.26 m (for a 0.45 m blob). All vertices must be inside the radius sphere to receive 100% cast influence.",
      },
      {
        symptom: "SphereCast creates a squashed shape instead of a stretch",
        cause:
          "use_x and use_y are both True (copying the CastCuboid settings). The sphere cast is then pulling X and Y inward (toward the sphere surface) while also pushing Z out — the net result looks squashed.",
        fix:
          "Set CastSphere.use_x = False and use_y = False. Only use_z = True. The XY axes stay in whatever state CastCuboid left them (natural at the stretch frame when CastCuboid.factor = 0).",
      },
      {
        symptom: "Modifier factor keyframes are missing from the Dope Sheet",
        cause:
          "Modifier properties are shown in the Dope Sheet only when 'Only Show Selected' is active and the object is selected, or when 'Show Modifiers' is toggled on in the Dope Sheet header.",
        fix:
          "In the Dope Sheet header, enable the filter: View → Only Show Errors → off; and check that 'Show Modifier' channels are not filtered out. Alternatively, open the Graph Editor and look for the 'modifiers[\"CastCuboid\"].factor' channel under the object's animation data.",
      },
      {
        symptom: "GLB export has no animation — just the rest pose",
        cause:
          "The export option 'Export Animations' is off, or the object has no Action assigned (the modifier factor keyframes live in the Action but it is unlinked).",
        fix:
          "Confirm the object has an active Action in the Animation Data properties. In File → Export → glTF 2.0, enable: Animation → Export Animations ✓, Bake All Objects ✓. Because modifier properties drive the deformation, also enable 'Force Sampling' to capture per-frame geometry snapshots rather than relying on sparse curve evaluation.",
      },
    ],
  },
  base,
);
