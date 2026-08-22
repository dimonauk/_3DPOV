import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.data.lights.new(name, type)</code> creates a Light data-block
        without any operator or active-object requirement — it works headlessly in
        add-on batch code, background renders, and procedural scene generators. Four
        types are available: <code>&apos;AREA&apos;</code>,{" "}
        <code>&apos;POINT&apos;</code>, <code>&apos;SPOT&apos;</code>, and{" "}
        <code>&apos;SUN&apos;</code>. The <code>energy</code> property carries
        physically-based units that differ per type: AREA and POINT emit watts of
        total luminous power into the scene; SUN sets irradiance in W/m² at the
        surface it illuminates (so a SUN at 10 W/m² is the same brightness from any
        distance); SPOT emits watts but concentrates them inside the cone, so energy
        density depends on <code>spot_size</code>. Mixing types at equal energy
        values without accounting for these semantics is the most common lighting
        script bug. The three-point rig here uses AREA for key and fill because the
        physical size of the emitter determines shadow softness at no extra cost —
        a 1.2 × 0.6 m rectangle casts softer shadows than a 0.3 m square at the
        same wattage. The rim SPOT is kept narrow for a tight silhouette edge.
      </p>
      <p>
        AREA light shadow softness is derived from the emitter&apos;s physical
        dimensions — <code>light.size</code> for width and{" "}
        <code>light.size_y</code> for height (RECTANGLE and ELLIPSE shapes only).{" "}
        <code>light.shadow_soft_size</code> has no effect on AREA lights; it
        applies only to POINT and SPOT, where there is no physical geometry to
        derive a shadow cone from. Setting <code>shadow_soft_size</code> on an AREA
        light is silently ignored in Blender 5.1 — no error, no effect. AREA also
        exposes a <code>spread</code> property (in radians) that controls the angular
        half-cone of emission: <code>math.pi</code> (180°) emits into a full
        hemisphere; reducing it to 90° acts like a barn-door restricting the throw.
        The AREA <code>shape</code> attribute selects one of four emitter
        geometries: <code>&apos;SQUARE&apos;</code>,{" "}
        <code>&apos;RECTANGLE&apos;</code>, <code>&apos;DISK&apos;</code>, or{" "}
        <code>&apos;ELLIPSE&apos;</code>. The DISK and ELLIPSE shapes are especially
        useful for eye catchlights and large wrap-around fill panels. Parenting all
        three lights to a shared Empty pivot and setting{" "}
        <code>obj.matrix_parent_inverse = rig.matrix_world.inverted()</code>{" "}
        immediately after assignment lets the entire rig repoint with one transform,
        mirroring the animated rig approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable"
          className={lk}
        >
          FCurve keyframe tutorial
        </Link>
        .
      </p>
      <p>
        EEVEE Next Light Groups (available from Blender 4.2+) assign each light to a
        named pass that renders as a separate EXR layer. The compositor can then
        rebalance key-to-fill ratio, shift hue, or mask shadows without re-rendering
        — the same non-destructive flexibility the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight"
          className={lk}
        >
          Cycles Light Groups tutorial
        </Link>{" "}
        applies in path-traced workflows. Assign groups via{" "}
        <code>scene.view_layers[0].lightgroups.new(name=&apos;key&apos;)</code> then{" "}
        <code>obj.lightgroup = &apos;key&apos;</code>. The blueprint also exports a{" "}
        <code>light_rig.json</code> manifest with Three.js-remapped positions and
        half-angles so a WebXR runtime can reconstruct approximate lights using{" "}
        <code>THREE.RectAreaLight</code> and <code>THREE.SpotLight</code> — a
        lighter complement to the baked irradiance approach covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr"
          className={lk}
        >
          EEVEE light probe tutorial
        </Link>
        . Blender&apos;s +Y axis maps to Three.js&apos;s −Z (forward), so positions
        are remapped <code>(x, y, z) → (x, z, −y)</code> in the JSON exporter and{" "}
        <code>spot_size</code> (Blender full angle) is halved to match{" "}
        <code>SpotLight.angle</code> (Three.js half-angle).
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake",
  title:
    "Python bpy.types.Light — Scripted 3-Point Rig: Key Area / Fill Disk / Rim Spot, EEVEE Next Light Groups & light_rig.json for WebXR (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial" as const,
  excerpt:
    "bpy.data.lights.new(name, type) builds physically-based lights without operators. Covers energy unit semantics per type, AREA shape variants and shadow_soft_size vs physical size, spread for directional emission, SPOT full-angle vs Three.js half-angle, parenting with matrix_parent_inverse, EEVEE Next LightGroups for per-pass EXR output, and light_rig.json axis remapping for Three.js WebXR.",
  tags: [
    "blender",
    "python",
    "scripting",
    "lighting",
    "eevee",
    "eevee-next",
    "light-groups",
    "three-point",
    "webxr",
    "three-js",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-bpy-light-rig-3point-eevee-lightgroup-webxr-bake",
    time: "thirty minutes",
    difficulty: "intermediate" as const,
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy scripts in the Scripting workspace",
      "Understands bpy.data vs bpy.ops — direct data API preferred",
      "Familiar with EEVEE Next render settings",
    ],
    steps: [
      {
        title: "Create light data-blocks via bpy.data.lights.new()",
        body: "bpy.data.lights.new(name, type) returns a Light data-block directly — no context required:\n\n  key_ld = bpy.data.lights.new(name='Key_Area', type='AREA')\n  key_ld.energy = 800.0   # watts total into hemisphere\n  key_ld.color  = (1.00, 0.95, 0.85)\n\nFour types and their energy units:\n  'AREA'  — watts total emitted; 1 m² at 800 W is 8× brighter per pixel than 8 m² at 800 W\n  'POINT' — watts total (uniform sphere emission)\n  'SPOT'  — watts total (confined to cone; same wattage in narrower cone = brighter)\n  'SUN'   — W/m² irradiance at the surface; distance-independent\n\nWrap the data-block in an Object:\n  key_obj = bpy.data.objects.new('Key_Area', key_ld)\n  bpy.context.scene.collection.objects.link(key_obj)\n\nPosition by setting obj.location — then orient so -Z points at the subject:\n  direction       = (look_at - location).normalized()\n  rot_quat        = direction.to_track_quat('-Z', 'Y')\n  obj.rotation_euler = rot_quat.to_euler()",
      },
      {
        title: "Configure AREA shapes: RECTANGLE for key, DISK for fill",
        body: "AREA lights expose shape, size, and size_y:\n\n  key_ld.shape  = 'RECTANGLE'  # 'SQUARE', 'RECTANGLE', 'DISK', 'ELLIPSE'\n  key_ld.size   = 1.20   # width (m) — X dimension for RECTANGLE\n  key_ld.size_y = 0.60   # height (m) — only used by RECTANGLE and ELLIPSE\n  key_ld.spread = math.radians(160)  # angular half-cone; π = full hemisphere\n\nFor the fill disk:\n  fill_ld.shape = 'DISK'\n  fill_ld.size  = 0.90   # radius for DISK; SQUARE uses size as half-side\n  # size_y is ignored for DISK and SQUARE\n\nCRITICAL shadow rule:\n  AREA light shadow softness = physical emitter size (size, size_y)\n  light.shadow_soft_size has NO effect on AREA — silently ignored in 5.1\n  Only POINT and SPOT use shadow_soft_size:\n\n  rim_ld.shadow_soft_size = 0.06  # apparent source radius for penumbra",
      },
      {
        title: "Configure SPOT for rim — cone angle, penumbra, shadow",
        body: "SPOT-specific properties:\n\n  rim_ld.spot_size  = math.radians(28.0)  # FULL cone angle in radians\n  rim_ld.spot_blend = 0.12                # penumbra fraction: 0 = hard, 1 = Gaussian\n  rim_ld.shadow_soft_size = 0.06\n\nspot_size is the FULL angle (diameter), not the half-angle (radius). When\nexporting to Three.js, SpotLight.angle is the HALF-angle — divide by 2:\n\n  json_entry['angle_rad'] = rim_ld.spot_size * 0.5  # three.js half-angle\n  json_entry['penumbra']  = rim_ld.spot_blend\n\nspot_blend 0.12 gives a tight halo with a just-visible penumbra. At 0.0 the\ndisc edge is perfectly sharp — useful for theatrical gobo. At 0.5+ the falloff\nis soft enough to double as a large area-like fill.",
      },
      {
        title: "Parent lights to a shared Empty — the rig pivot pattern",
        body: "Create the parent Empty:\n  rig = bpy.data.objects.new('LightRig_3Point', None)\n  rig.empty_display_type = 'SPHERE'\n  rig.location = (0, 0, 0)\n  bpy.context.scene.collection.objects.link(rig)\n\nParent each light:\n  for lo in (key_obj, fill_obj, rim_obj):\n      lo.parent = rig\n      lo.matrix_parent_inverse = rig.matrix_world.inverted()\n\nmatrix_parent_inverse must be the INVERSE of the parent's world matrix at the\nmoment of parenting. Omitting this causes the child to jump to the parent's\norigin on the next depsgraph evaluation — the most common light-rig bug.\n\nWith the rig parented, animate the Empty to repoint the whole rig:\n  rig.rotation_euler = (0, 0, math.radians(45))\n  rig.keyframe_insert('rotation_euler', frame=1)\n\nThis mirrors the armature parent pattern from the VRM spine chain tutorial:\ncompose an authoring hierarchy from simple pivot objects.",
      },
      {
        title: "Assign EEVEE Next Light Groups for per-pass EXR output",
        body: "Light Groups partition render output into per-source EXR layers:\n\n  vl = bpy.context.scene.view_layers[0]\n  for name in ('key', 'fill', 'rim'):\n      if name not in {lg.name for lg in vl.lightgroups}:\n          vl.lightgroups.new(name=name)  # .new(), NOT .add()\n\n  key_obj.lightgroup  = 'key'\n  fill_obj.lightgroup = 'fill'\n  rim_obj.lightgroup  = 'rim'\n\n  vl.use_pass_diffuse_direct = True  # required for lightgroup EXR layers\n  vl.use_pass_glossy_direct  = True\n\nEnable EEVEE Next explicitly:\n  scene.render.engine = 'BLENDER_EEVEE_NEXT'  # not 'BLENDER_EEVEE' (legacy)\n  scene.eevee.use_shadows = True\n\nWith multilayer EXR output enabled, each EXR layer is labelled:\n  'RenderLayer.key.DiffDir'   — key light diffuse contribution\n  'RenderLayer.fill.DiffDir'  — fill diffuse\n  'RenderLayer.rim.DiffDir'   — rim diffuse\nThe compositor can then adjust each channel independently.",
      },
      {
        title: "Export light_rig.json for Three.js WebXR reconstruction",
        body: "Blender and Three.js use different coordinate conventions:\n  Blender: +Y forward, +Z up\n  Three.js: -Z forward, +Y up\n  Remap: (x, y, z) → (x, z, -y)\n\n  def bl_to_three(v):\n      return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]\n\nKey entries in the JSON:\n  # RectAreaLight for key and fill (Three.js equivalent of AREA)\n  {\n    'type': 'RectAreaLight',\n    'energy_watts': 800,\n    'width_m': 1.20,\n    'height_m': 0.60,\n    'position_threejs': bl_to_three(key_obj.location)\n  }\n  # SpotLight for rim\n  {\n    'type': 'SpotLight',\n    'angle_rad': rim_ld.spot_size * 0.5,  # half-angle for THREE\n    'penumbra': rim_ld.spot_blend,\n    'position_threejs': bl_to_three(rim_obj.location)\n  }\n\nThree.js THREE.RectAreaLightHelper can visualise the imported key/fill panels.\nFor energy calibration: Three.js intensity ≠ Blender watts. Treat the JSON\nwatts as relative values and calibrate visually in the Three.js scene.",
      },
    ],
    finalResult:
      "A three-light EEVEE Next scene — key AREA RECTANGLE, fill AREA DISK, rim SPOT — all parented to a shared Empty pivot and assigned to named LightGroups for per-pass EXR output. subject_sphere.glb (the lit placeholder) and light_rig.json (Three.js-ready manifest with axis-remapped positions and half-angles) are written alongside the .blend file.",
    variations: [
      "Character rig binding: set RIG_PIVOT to a character's chest location and KEY_DIST = SUBJECT_RADIUS * 4.0 to wrap the rig around a VRM character. Keyframe rig.location to follow the skeleton root using FCurve keyframe_insert per frame.",
      "Animated relight: keyframe KEY_ENERGY from 800 W at frame 1 to 200 W at frame 60 (sunset falloff) and FILL_COLOR to warmer values. LightGroup EXR layers let the compositor exaggerate or reduce the change non-destructively.",
      "Five-point variant: add a fourth AREA DISK kicker (opposite rim, same azimuth + 15°) and a fifth large AREA RECTANGLE underneath the subject for bounce fill. Both fit the same LightGroup pass pattern — add 'kicker' and 'bounce' to GROUPS.",
      "Product shot rig: set KEY_AZ_DEG = 20, KEY_EL_DEG = 20 (almost frontal), KEY_SIZE_X = 2.0 for a broad product-photography wrap. Add a thin RECTANGLE strip at 90° azimuth as a specular edge line. Export with subject replaced by the product GLB.",
    ],
    troubleshooting: [
      {
        symptom: "shadow_soft_size set on the key AREA light has no effect",
        cause:
          "AREA lights derive shadow penumbra from their physical emitter dimensions (size, size_y). shadow_soft_size only affects POINT and SPOT types. Setting it on an AREA light is silently ignored in Blender 5.1.",
        fix: "Increase key_ld.size or key_ld.size_y to widen the shadow penumbra on an AREA light. For SPOT and POINT, set light.shadow_soft_size instead.",
      },
      {
        symptom: "After parenting, lights jump to the rig Empty's origin",
        cause:
          "matrix_parent_inverse was not set (or was set to a stale matrix) after assigning obj.parent. This matrix compensates for the parent's current world transform so the child stays in its original position.",
        fix: "Immediately after lo.parent = rig, set lo.matrix_parent_inverse = rig.matrix_world.inverted(). Call bpy.context.view_layer.update() first if rig.matrix_world may be stale from a prior transform.",
      },
      {
        symptom: "vl.lightgroups.new(name='key') raises RuntimeError: already exists",
        cause:
          "A LightGroup named 'key' was added previously (e.g. from a prior script run without a scene reset). Duplicate names are rejected.",
        fix: "Guard with: if name not in {lg.name for lg in vl.lightgroups}: vl.lightgroups.new(name=name). The blueprint includes this check.",
      },
      {
        symptom: "EEVEE Light Groups pass options are greyed out",
        cause:
          "The render engine is set to 'BLENDER_EEVEE' (legacy) instead of 'BLENDER_EEVEE_NEXT'. Light Groups are only available in EEVEE Next.",
        fix: "Set scene.render.engine = 'BLENDER_EEVEE_NEXT' before assigning lightgroups. Also ensure vl.use_pass_diffuse_direct = True; without an active pass, LightGroup output has no channel to write to.",
      },
    ],
  },
  base,
);
