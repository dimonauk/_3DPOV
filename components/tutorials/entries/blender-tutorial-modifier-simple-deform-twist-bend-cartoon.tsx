import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SimpleDeformBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Simple Deform modifier operates in four modes &mdash;
        Twist, Bend, Taper, and Stretch &mdash; all controlled by a single{" "}
        <code>angle</code> float that is directly keyframeable. No rig, no
        shape keys, no lattice. A low-poly octagonal column plus two stacked
        Simple Deform modifiers produces a candy-cane spiral pillar that
        exports cleanly to GLB in under five minutes of setup. That same
        modifier stack drives an animated winding sequence for WebXR, where
        the column untwists itself as a portal-reveal effect.
      </p>
      <p>
        The stack order is load-bearing. TAPER must precede TWIST. Taper
        narrows the column cross-section from base to tip; Twist then rotates
        the already-narrowed profile. The result is a helix where the wider
        base coils have greater arc-length than the narrower tip coils &mdash;
        this reads as a genuine architectural baluster. Reversing the order
        applies taper to the post-twist bounding box, misaligning the taper
        axis with the silhouette and producing an asymmetric lump. The{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-screw-revolve-column"
          className={lk}
        >
          Screw modifier column tutorial
        </Link>{" "}
        achieves a similar visual via revolution rather than deformation
        &mdash; useful when the profile must be a Bezier curve.
      </p>
      <p>
        The TAPER mode&rsquo;s <code>mod.origin</code> is the subtlety that
        separates expert use from cargo-cult use. Without an origin object,
        the taper scales symmetrically around the mesh centre &mdash; both ends
        narrow, producing a bicone. Setting <code>mod.origin</code> to an
        Empty at the column base anchors the full-width end there, so only
        the tip narrows. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-cast-sphere-cuboid-cartoon-squash"
          className={lk}
        >
          Cast modifier squash-and-stretch tutorial
        </Link>
        , which morphs toward a centroid target &mdash; Cast suits radially
        symmetric blobs, Simple Deform suits elongated props with a clear axis.
      </p>
    </>
  );
}

const base: Entry = {
  slug:   "blender-tutorial-modifier-simple-deform-twist-bend-cartoon",
  title:  "Modifier Simple Deform — Twist, Bend, Taper & Stretch: Spiral Column and Arch Gateway (Blender 5.1)",
  date:   "2026-06-22",
  kind:   "tutorial",
  excerpt:
    "All four modes of the Simple Deform modifier demonstrated through a " +
    "candy-cane twisted column and a bent arch gateway. Keyframeable angle, " +
    "stacking order, and Empty-as-origin explained at expert depth for WebXR export.",
  Body:   SimpleDeformBody,
  libraryPath:
    "public/library/blends/modifiers/modifier-simple-deform-twist-bend-cartoon/",
  software: [
    {
      name:      "Blender",
      version:   "5.1",
      url:       "https://www.blender.org/download/",
      cost:      "open-source",
      platforms: ["windows", "macos", "linux"],
      note:
        "Simple Deform stable since Blender 2.46. mod.origin Empty support " +
        "and `angle` keyframe path modifiers[\"Twist\"].angle confirmed in 5.1.",
    },
  ],
  prerequisites: [
    "Comfortable adding modifiers in the Properties panel.",
    "Knows how to set keyframes (I key or right-click → Insert Keyframe).",
    "Basic understanding of modifier stack order.",
  ],
  steps: [
    {
      title: "Why Simple Deform over shape keys or a lattice",
      body:
        "Shape keys require a sculpted target mesh per pose — a twist shape key " +
        "needs a pre-twisted version. A lattice object needs manual cage placement " +
        "and binding, and shears unevenly on non-box meshes.\n\n" +
        "Simple Deform adds one modifier and one float. An arch doorway for a " +
        "WebXR portal takes two clicks: add Simple Deform, set BEND, drag angle " +
        "to 180°. Revising from pointed arch (180°) to segmental arch (120°) is " +
        "one slider pull, not a re-sculpt.\n\n" +
        "Limitation: one axis per modifier. For S-curve compound bends, stack " +
        "two BEND modifiers on perpendicular axes. The second BEND reads the " +
        "already-curved result of the first.",
    },
    {
      title: "Build the column with ring divisions via bmesh",
      body:
        "bpy.ops.mesh.primitive_cylinder_add creates only top + bottom rings — " +
        "TWIST on that produces a single planar shear, not a helix.\n\n" +
        "Use bmesh to build COLUMN_RINGS+1 profiles at equal Z steps, connect " +
        "with quads, cap both ends with n-gons. Ring density rule: ≥6 rings per " +
        "360° of twist to keep each quad shear below 60°.\n\n" +
        "COLUMN_SEGS=8 (octagon) balances realism and poly budget: readable as " +
        "a column at WebXR render distance, cheap enough to instance in multiples.\n\n" +
        "At COLUMN_RINGS=24 and TWIST_ANGLE=270°: shear per ring ≈ 11° — clean " +
        "quads. At 6 rings / 270°: 45° shear — borderline acceptable.",
    },
    {
      title: "TAPER modifier with Empty origin",
      body:
        "mod_taper.deform_method = 'TAPER', axis='Z', angle=0.60 rad.\n\n" +
        "Create an Empty at (0, 0, -COLUMN_HEIGHT/2), assign to mod_taper.origin.\n\n" +
        "Scale formula: cross-section at position p (0→1 along axis) = " +
        "1 - (TAPER_ANGLE/π) × p. With TAPER_ANGLE=0.60: tip scale ≈ 0.809, " +
        "so tip radius = 0.18 × 0.809 ≈ 0.146 m — classical column entasis.\n\n" +
        "Without the origin Empty, p=0 is the object centre, both ends taper " +
        "symmetrically — a bicone shape. The Empty shifts p=0 to the base.\n\n" +
        "Keep TAPER_ANGLE < π/2 (1.57 rad) to avoid cross-sections inverting " +
        "to negative scale. Above π/2 the tip collapses to a true point (spike).",
    },
    {
      title: "TWIST modifier — candy-cane 270° pitch",
      body:
        "Stack position: Taper[0], Twist[1].\n\n" +
        "mod_twist.deform_method='TWIST', axis='Z', angle=math.radians(270).\n" +
        "No mod.origin — twist around the object's own Z axis. Assigning an " +
        "origin to TWIST shifts the pivot off-centre, making the column walk " +
        "sideways rather than twist in place.\n\n" +
        "Because TWIST evaluates after TAPER, the narrower tip rotates by the " +
        "same 270° as the wider base but traces a shorter arc — the helix " +
        "appears to tighten toward the top, exactly like a hand-turned baluster.",
    },
    {
      title: "Procedural stripe material — no UV required",
      body:
        "TexCoord(Generated) → SeparateXYZ → Z\n" +
        "  → Math(MODULO, 6)   # 6 equal height bands\n" +
        "  → Math(FLOOR)       # integer 0–5 per band\n" +
        "  → Math(MODULO, 2)   # alternating 0/1\n" +
        "  → MixRGB(Fac)       # 0=red, 1=white\n" +
        "  → Principled BSDF Base Color\n\n" +
        "Generated Z runs 0 (base) to 1 (tip) in local bounding-box space. " +
        "It updates automatically as the modifier twists the mesh — the colour " +
        "bands rotate with the geometry without any UV baking. Increasing " +
        "MODULO divisor from 6 to 10 gives more, narrower stripes.",
    },
    {
      title: "Keyframe the twist for WebXR animation",
      body:
        "mod.keyframe_insert('angle', frame=1)  # at angle=0\n" +
        "mod.keyframe_insert('angle', frame=60) # at angle=2π\n\n" +
        "Data path in the Graph Editor: modifiers[\"Twist\"].angle\n\n" +
        "For GLB export with animation: use export_force_sampling=True. " +
        "Modifier property keyframes are not native glTF animation channels — " +
        "Blender must bake per-frame geometry snapshots. Without force sampling, " +
        "the GLB contains only the two keyframe poses and WebXR interpolates " +
        "between them as a morph (no twist visible).\n\n" +
        "To add procedural bounce: apply an F-Curve Noise modifier to the angle " +
        "channel. See the F-Curve Modifiers tutorial for the exact workflow.",
    },
    {
      title: "BEND mode — arch gateway variation",
      body:
        "Add a flat plane, subdivide 20× along its long axis (19 loop cuts).\n" +
        "Add Simple Deform → BEND, axis=X, angle=math.radians(180).\n" +
        "Result: a U-arch centred at the world origin.\n\n" +
        "To shift the arch pivot: create an Empty 1 m below the plane, assign " +
        "to mod_bend.origin. The curvature centre drops; the arch becomes a " +
        "tall semicircle rooted below the plank — a vaulted gateway.\n\n" +
        "Gothic pointed arch: reduce angle to 150°, increase origin depth. " +
        "Double vault: two BEND modifiers on X and Y axes respectively.\n\n" +
        "For arch array along a path see the Array + Curve Deform tutorial linked below.",
    },
  ],
  finalResult:
    "A low-poly octagonal column with TAPER + TWIST modifier stack producing " +
    "a candy-cane spiral pillar. Twist angle keyframed 0°→360° over 60 frames " +
    "for a WebXR portal-reveal animation. Exported as GLB with Draco 6 and WebP " +
    "textures. Procedural stripe material rotates automatically with the geometry.",
  variations: [
    "STRETCH for cartoon character resize: add Simple Deform (STRETCH, axis=Z, " +
    "angle=0.8) to a character mesh before the rig modifier — elongates the torso " +
    "while compressing XY. Use lock_x=True to compress only Y (front-to-back squeeze " +
    "for a flattened cartoon silhouette).",
    "Animated TAPER for a flag-tip reveal: place TAPER origin at the flagpole edge. " +
    "Keyframe mod.limits[1] from 0.0 to 1.0 over 40 frames — the taper region expands " +
    "outward from the pole, reading as the flag inflating in wind.",
  ],
  troubleshooting: [
    {
      symptom: "Column shears into overlapping geometry at the twist peak",
      cause:   "Too few ring divisions. Each ring shears > 60°, quads fold over.",
      fix:
        "Increase COLUMN_RINGS. Rule: rings ≥ twist_degrees / 30. For 270°, " +
        "minimum 9 rings; 24 is comfortable (≈ 11°/ring). In an existing blend, " +
        "add loop cuts in Edit Mode before the modifiers are applied.",
    },
    {
      symptom: "TAPER produces a bicone (both ends narrow) not a column taper",
      cause:   "mod.origin is None — taper is symmetric around the object centre.",
      fix:
        "Create an Empty at (0, 0, -COLUMN_HEIGHT/2) and assign to mod_taper.origin. " +
        "The base ring then receives scale = 1.0; only the tip narrows.",
    },
    {
      symptom: "Animated GLB shows no twist in the WebXR viewer",
      cause:
        "Modifier property keyframes exported without Force Sampling. Only the " +
        "two endpoint meshes exist in the GLB — WebXR morphs between them flatly.",
      fix:
        "Re-export with export_force_sampling=True. File size increases (one " +
        "mesh snapshot per frame), so shorten to 30 frames or raise Draco level " +
        "to 8 to offset the size increase.",
    },
  ],
};

export const entry = buildInstructable(
  {
    time:        "45 minutes",
    difficulty:  "intermediate",
    cost:        "free",
    supplies: {
      materials: [],
      tools: [
        "Blender 5.1 (blender.org/download)",
        "blueprint.py from this library entry",
      ],
    },
    steps:           base.steps ?? [],
    finalResult:     base.finalResult,
    variations:      base.variations,
    troubleshooting: base.troubleshooting,
  },
  base,
);
