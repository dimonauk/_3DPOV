import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShapeKeysMorphTargetsBody() {
  return (
    <>
      <p>
        A shape key is a second snapshot of every vertex position on a mesh.
        The Basis key holds the rest pose; every other key stores where each
        vertex should sit when that expression is fully active. Blender computes
        the difference internally and writes it to the GLB as a morph target
        &mdash; a per-vertex delta array that the runtime lerps toward at
        whatever blend weight you supply, in real time, at GPU speed.
      </p>

      <p>
        For VRM avatars this matters enormously. VRM 1.0 defines a standardised
        expression schema &mdash; <em>happy</em>, <em>angry</em>,{" "}
        <em>blinkLeft</em>, <em>blinkRight</em>, phonemes <em>aa</em>,{" "}
        <em>ih</em>, <em>ou</em>, <em>ee</em>, <em>oh</em> &mdash; and maps each
        slot to one or more shape keys on the mesh. A face-tracking runtime can
        then drive all five phoneme morph targets simultaneously at fractional
        weights, blending lip shapes in real time, without touching the mesh
        geometry or rerunning any physics. The topology is static; only the
        delta weights change.
      </p>

      <p>
        This tutorial sits directly after the{" "}
        <Link href="/tutorials/blender-tutorial-armature-weight-paint" className={lk}>
          armature and weight-painting tutorial
        </Link>
        , which sets up the skeleton. Shape keys and armature deformations
        coexist cleanly in Blender and in glTF: the armature modifier moves the
        bones first (skinning pass), then the morph targets add the
        expression offsets on top. A blinking eye on a walking character uses
        both systems simultaneously.
      </p>

      <p>
        The{" "}
        <Link href="/tutorials/blender-addon-vrm-format" className={lk}>
          VRM format add-on tutorial
        </Link>{" "}
        covers what happens after export: assigning the shape keys in Blender to
        VRM 1.0 expression presets and packaging the avatar as a
        .vrm file. This tutorial ends at the GLB stage &mdash; the morph targets
        are correct in the file; the VRM tutorial takes them the rest of the way.
        For how the GLB lands in a WebXR scene, see the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender-to-site asset pipeline tutorial
        </Link>
        , which covers loading the GLB with its morph targets into the
        framework&rsquo;s animation controller.
      </p>

      <p>
        One architectural constraint shapes every decision here: morph targets
        are incompatible with Draco mesh compression in the glTF 2.0 spec.{" "}
        <code>KHR_draco_mesh_compression</code> and{" "}
        <code>KHR_mesh_morph_targets</code> cannot coexist in the same mesh
        primitive. Any face mesh with shape keys must travel uncompressed at the
        glTF level and rely on HTTP transport compression (gzip or brotli) for
        size reduction. The{" "}
        <Link href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised" className={lk}>
          UV unwrap tutorial
        </Link>{" "}
        shows how to keep texture atlases small, which partially compensates for
        the loss of geometry compression on morphable meshes.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shape-keys-morph-targets",
  title: "Shape keys and morph targets for VRM facial expressions in Blender 5.1",
  date: "2026-05-20",
  kind: "tutorial",
  excerpt:
    "How to create VRM-compatible shape keys in Blender 5.1: build a stylised face proxy, add Basis + five expression keys (blink, happy, angry, aa phoneme) via the bpy data API, and export as a GLB with embedded morph targets — with an explanation of why Draco compression must be disabled for morphable meshes.",
  Body: ShapeKeysMorphTargetsBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-armature-weight-paint",
      label: "Tutorial — Armature setup and weight painting",
      note: "Skeleton setup; shape keys and armature deformations stack in glTF.",
    },
    {
      href: "/tutorials/blender-addon-vrm-format",
      label: "Tutorial — VRM format add-on",
      note: "Maps shape keys to VRM 1.0 expression presets and packages the .vrm file.",
    },
    {
      href: "/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised",
      label: "Tutorial — UV unwrap for low-poly stylised meshes",
      note: "Keeping textures compact compensates for the loss of Draco on morph meshes.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Loading the morph-target GLB into the WebXR animation controller.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/animation/shape_keys/introduction.html",
      label: "Blender Manual — Shape Keys (CC BY)",
      note: "Complete reference: relative vs absolute shape keys, pinning, vertex key vs mesh key, and the driver system for procedural expression control. Author: The Blender Documentation Team.",
    },
    {
      href: "https://vrm.dev/en/univrm/expressions/vrm_expression/",
      label: "VRM 1.0 — Expression spec (MIT — UniVRM / VRM Consortium)",
      note: "The normative expression slot list, morphTargetBind vs materialColorBind, isBinary vs blend semantics, and the override flags that govern eye/mouth interactions. Author: Santarh and the VRM Consortium.",
    },
    {
      href: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#morph-targets",
      label: "glTF 2.0 Spec — Morph Targets §8.8 (Apache-2.0 / Khronos)",
      note: "The formal definition of morph target attributes (POSITION, NORMAL, TANGENT), the weight array, and the incompatibility with KHR_draco_mesh_compression. Author: The Khronos Group.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "two to three hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Blender 5.1 installed.",
      "Comfortable with Object Mode, Edit Mode, and 3D viewport navigation.",
      "Has run at least one of the earlier library blueprints (blueprint.py concepts apply here).",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Uses BLENDER_EEVEE_NEXT for the record.py render step.",
      },
    ],
    steps: [
      {
        title: "Understand the shape key data model",
        body: "A shape key is not a delta — it is a complete alternative vertex position array, the same length as the mesh's vertex count. Blender stores full coordinates per vertex per key. The delta you see as a morph target in glTF is computed by the exporter as (key_position − basis_position) at export time.\n\nThis has two consequences. First, key_block.data[i].co is an absolute world position, not an offset. When you write a shape key via the Python API, you set where that vertex physically sits in that expression, not how much it moves. The Basis positions are subtracted automatically at export.\n\nSecond, the topology is locked. Once the Basis exists, you cannot add or remove vertices or change face count — the position arrays for all keys are the same length, and every key must have exactly one entry per vertex. If you need to add geometry, you must delete all shape keys, modify the mesh, then rebuild them.\n\nBlender has two shape key modes: Relative (each key is relative to the Basis) and Absolute (keys are relative to the 'Eval Time' value on a timeline — used for corrective shapes and in-betweens). VRM and glTF use Relative mode exclusively. The blueprint uses obj.shape_key_add(from_mix=False), which always creates Relative keys starting from the Basis regardless of what the current slider mix is.",
      },
      {
        title: "Build the face proxy mesh",
        body: "Run blueprint.py (headless or via the Blender scripting workspace). The script creates a UV sphere with U=16 segments and V=10 rings, then scales it to approximate face proportions: narrower in X (0.75×), shallower in Y (0.55×), and slightly taller in Z (1.05×).\n\nThe UV sphere's pole-at-±Z topology maps face features to latitude rings. After the scale: the brow area sits at approximately z=0.5–0.8, the eye area at z=0.1–0.5, the cheek at z=−0.05–0.30, and the jaw at z=−0.75–−0.20. The face-front verts (pointing toward +Y) have y > 0.05 after the SY scale.\n\nFlat shading is applied via poly.use_smooth = False on every face — the studio's standard for faceted cel-shaded aesthetics. The per-face normal produces hard facet edges without needing any custom split normals for this simple proxy shape.\n\nThe cel-shade material uses the same Diffuse→ShaderToRGB→CONSTANT ramp→Emission chain as the hard-surface and gem tutorials. A CONSTANT (stepped) ramp with one edge at position 0.35 produces a two-tone face: dark-skin in shadow, light-skin in light. This is purely for the viewport demo; a production avatar would use a separate texture-based material.",
      },
      {
        title: "Add the Basis shape key",
        body: "obj.shape_key_add(name='Basis') — this must be called first. The Basis is the mesh's rest pose. Its data is never modified; any accidental edit to Basis.data[i].co will appear as a permanent offset in every expression, because all deltas are computed relative to it.\n\nIn the blueprint the Basis is added immediately after mesh creation, before any shape key script sets up the expression keys. The interpolation is set to KEY_LINEAR, which matches glTF's linear morph interpolation.\n\nIf you run blueprint.py on a mesh that already has shape keys, Blender will refuse to add a second Basis — it raises a RuntimeError. Either clear all shape keys first (mesh.shape_keys = None) or start from a fresh scene. The blueprint handles this by clearing and recreating the entire scene at the top of the script.",
      },
      {
        title: "Zone-select vertices by world position",
        body: "The blueprint's zone() helper selects vertex indices by world-space bounding box. This is the critical technique that makes the blueprint portable across Blender versions: rather than hard-coding index lists that break when the sphere seam vertex ordering changes between patches, zone() queries vertex positions that are topologically stable.\n\nUsage: zone(mesh.vertices, x=(-0.55, -0.10), y=(0.05, 9), z=(0.10, 0.55)) returns every vertex whose co.x is in [−0.55, −0.10], co.y ≥ 0.05, and co.z is in [0.10, 0.55]. Passing (None, None) for an axis means 'no constraint on that axis'.\n\nFor a 16-segment sphere scaled to the face proportions in this blueprint, the face front (y > 0.05) selects roughly the forward hemisphere. Combining that with Z ranges isolates: brows (z=0.50–0.80), upper eyelids (z=0.10–0.55 + lateral X), cheeks (z=−0.05–0.30 + front half), lips (z=−0.45–−0.15, |x| < 0.50), and jaw (z=−0.75–−0.20).\n\nAdjust the thresholds for a different sphere size or segment count — the key is that every vertex in a zone must be one that makes anatomical sense for the expression you are building.",
      },
      {
        title: "Create blink shape keys (Fcl_EYE_Close_L and _R)",
        body: "The blink is the simplest expression: upper eyelid vertices drop in −Z. The VRM spec treats the upper lid as the active part (real eyelids close top-down); the lower lid stays put.\n\nFor Fcl_EYE_Close_L: zone selects x ∈ [−0.55, −0.10] (left eye), y > 0.05 (front face), z ∈ [0.10, 0.55] (eye row). The add_key() helper creates a new key from_mix=False, then iterates over the zone indices and adds Vector(0, 0, −LID_CLOSE) to key_block.data[i].co.\n\nNote: key_block.data[i].co += delta. The += works because key_block.data[i].co starts as a copy of the Basis position, and we are adding our delta to that copy. You can also assign directly: key_block.data[i].co = basis_co + delta.\n\nFor Fcl_EYE_Close_R: mirror the X zone to x ∈ [0.10, 0.55]. The Z and Y constraints are identical.\n\nIn the glTF morph target, these will appear as POSITION deltas: most vertices at (0, 0, 0), the eyelid verts at (0, 0, −LID_CLOSE). WebXR runtimes (Three.js morphTargetInfluences, Babylon.js morphTargetManager) drive these weights in real time from face-tracking data.",
      },
      {
        title: "Create the happy and angry expression keys",
        body: "Happy requires three zones in one key: brow corners lift (+Z), cheeks puff toward the camera (+Y), and lip corners stretch outward (±X) and up (+Z).\n\nThe add_key() helper for the happy expression takes a dict of {vertex_index: Vector delta} entries. Zones are collected separately, then merged into a single offset dict. Where zones overlap (a vertex that is in both the cheek zone and the lip zone), the .get(i, Vector()) pattern accumulates both offsets, producing a vertex that both puffs and stretches — anatomically correct for a strong smile.\n\nFor the X-direction of lip corners: each vertex's x-sign (positive for right, negative for left) determines whether it stretches outward in +X or −X. x_sign = 1 if verts[i].co.x > 0 else −1.\n\nAngry uses the inner brow (|x| < 0.20, z=0.45–0.80) dropping in −Z, combined with lip mid-zone (|x| < 0.25) compressing slightly in +Z (the pout-compress gesture). The inner brow drop rather than the outer brow — that is what separates an angry expression from a worried one. Outer brow drop without inner change reads as confusion or sadness depending on the mouth position.",
      },
      {
        title: "Create the 'aa' phoneme key",
        body: "The 'aa' vowel opens the jaw. In Blender's face proxy, the jaw is the lower quarter of the sphere: z ∈ [−0.75, −0.20], front half (y > 0.05), lateral range |x| < 0.55 to exclude the back-of-head verts.\n\nThe jaw verts drop in −Z by MOUTH_OPEN_Z (0.11 units after face scale). The result: the lower face separates from the upper in the mesh, opening a visible gap around the lip line (z ≈ −0.20).\n\nFor a production avatar the lower face verts and the upper-lip edge are a dedicated lip mesh separate from the jaw mesh, so the gap closes cleanly. On this proxy sphere both areas share the same continuous mesh, producing a visible split — which is exactly what you want for the tutorial because it makes the morph target effect visually obvious.\n\nThe VRM phoneme system defines five mouth shapes: aa (wide open), ih (narrow horizontal), ou (rounded), ee (horizontal + teeth), oh (slightly open rounded). All five are independent shape keys that the runtime blends simultaneously to approximate any sound. The blueprint only implements aa, but the pattern — zone the mouth region, shift jaw down for open vowels, shape lip boundary for rounded vowels — extends to all five.",
      },
      {
        title: "Export GLB with morph targets — Draco must be disabled",
        body: "The bpy.ops.export_scene.gltf() call uses these critical flags:\n\n  export_morph=True — writes all shape keys as morph target primitives. Without this, the keys are ignored and the GLB contains only the Basis geometry.\n\n  export_morph_normal=True — includes per-vertex normal deltas in the morph target. Without normals, the lighting on the face does not change as it morphs — a smiling face has the same specular as a neutral one. For flat-shaded (non-smooth) meshes, normal deltas are less important because per-polygon normals don't interpolate, but for production avatars with smooth shading, normal deltas are essential.\n\n  export_apply=False — this is non-negotiable when shape keys are present. Blender cannot apply modifiers to a mesh with shape keys (doing so would require a different vertex count in the result, invalidating all the stored key data). The glTF exporter with export_apply=True will error out or silently drop the shape keys on a keyed mesh.\n\n  Draco completely omitted — KHR_draco_mesh_compression uses variable-length encoding that requires a fixed vertex layout at parse time, which is incompatible with the per-morph delta arrays of KHR_mesh_morph_targets. Any exporter that enables both will produce a non-conformant file. Compress at HTTP transport level instead.\n\nVerify the export in gltf-viewer.donmccurdy.com: drag the GLB in, find the Morph Targets panel in the right sidebar, and drag each slider. The deformations should match Blender's viewport exactly.",
      },
    ],
    finalResult:
      "A stylised VRM-compatible face mesh with six shape keys (Basis + five expressions) exported as a GLB with embedded morph targets. The shape keys are named to the Fcl_ VRM convention and map directly to the VRM 1.0 expression presets. The GLB loads correctly in Three.js, Babylon.js, and any glTF 2.0 runtime without Draco; morph target influences can be driven from face tracking, emotion classifiers, or keyframe animation.",
    variations: [
      "Add the remaining four VRM phonemes: Fcl_MTH_I (ih — lip corners pull apart horizontally), Fcl_MTH_U (ou — lips round and pucker), Fcl_MTH_E (ee — expose upper teeth, lip spread), Fcl_MTH_O (oh — slightly open rounded). The same zone + offset pattern applies; vary the MOUTH_WIDE_X sign and the Z magnitude to shape each vowel.",
      "Add corrective shape keys for the shoulder/jaw interaction: when the jaw opens fully, the neck skin should stretch. A corrective key named 'Fcl_MTH_A_Neck' targets neck verts and is driven by the Aa weight via a Blender Driver. The driver exports to a glTF animation that the VRM runtime can optionally play.",
      "Replace the proxy sphere with a sculpted or imported face mesh (e.g. from Mixamo or ReadyPlayerMe). Delete all shape keys, import the new mesh as the face_vrm object, then re-run the zone-based key setup. The zone thresholds will need adjustment for the new mesh's scale and proportions, but the API calls are identical.",
    ],
    troubleshooting: [
      {
        symptom: "Export throws 'Cannot apply modifier on mesh with shape keys'",
        cause: "export_apply=True is set in the gltf export call (or in the export dialog's 'Apply Modifiers' checkbox).",
        fix: "Set export_apply=False in bpy.ops.export_scene.gltf(), or uncheck 'Apply Modifiers' in the GUI export dialog. Shape key meshes must export with modifiers un-applied.",
      },
      {
        symptom: "Morph targets are absent from the GLB (slider has no effect in browser)",
        cause: "export_morph=False, or the object had no active shape keys at export time.",
        fix: "Confirm export_morph=True in the export call. In the GUI: Data Properties (green vertex icon) > Shape Keys > confirm the key list shows entries beyond Basis. Re-export.",
      },
      {
        symptom: "Happy expression deforms only half the intended verts — some cheek verts are missing",
        cause: "Zone bounding box is too tight; some cheek verts fall outside the threshold.",
        fix: "Temporarily enter Edit Mode, enable 'Affect Only Vertices' in the overlay, and select verts by the same position range to see which are included. Widen the zone() parameters slightly. A margin of ±0.05 units is usually enough.",
      },
      {
        symptom: "Blink closes both eyes simultaneously instead of independently",
        cause: "Both eye zones overlap at the nose bridge (x close to 0).",
        fix: "Tighten the x-range for each eye: use x=(−0.55, −0.15) for left and x=(0.15, 0.55) for right. The midline gap of 0.30 units (−0.15 to +0.15) should exclude nose-bridge verts from either zone.",
      },
      {
        symptom: "GLB file size is unexpectedly large compared to non-morph GLBs",
        cause: "Each morph target stores a full POSITION delta array of the same vertex count as the mesh. With N shape keys and V vertices, the file contains N × V × 12 bytes of morph data (3 floats per vertex).",
        fix: "Reduce vertex count on the face mesh (the proxy sphere uses U=16, V=10 — 162 verts, manageable). For production faces with 5 000+ verts and 20+ shape keys, use the Basis at full resolution but keep expression zones tight, and apply gzip/brotli at the HTTP layer.",
      },
    ],
  },
  base,
);
