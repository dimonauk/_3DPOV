import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ShaderSssStylisedSkinBody() {
  return (
    <>
      <p>
        Skin is not a surface — it is a stack of scattering layers.  Light
        hitting your cheek does not bounce off the outermost dead-cell layer
        and return to the camera.  Most of it punches through the epidermis,
        rattles around in the collagen-rich dermis, reddens as haemoglobin
        absorbs the blue and green wavelengths, and re-exits a few millimetres
        from where it entered.  That subsurface scatter is what makes a face
        look warm and alive rather than plaster-white.  It is the same physics
        that turns thin cartilage red when back-lit: the pinna of a human ear is
        1–3 mm thick, thin enough that photons cross it entirely and the exit
        glow carries the full haemoglobin signature.  Blender 5.1&apos;s Principled
        BSDF&nbsp;v2 models this with six Subsurface inputs, and the choice of
        method —&nbsp;<code>RANDOM_WALK_SKIN</code> vs&nbsp;<code>BURLEY</code>&nbsp;—
        determines whether those thin shells glow correctly or go grey.
      </p>

      <p>
        The <strong>Subsurface Radius</strong> vector is the single most
        misunderstood parameter in the cluster.  It is not a blur radius in
        texture space.  It is the mean free path in scene units for each
        wavelength channel — the average distance a photon of that colour
        travels before being scattered in a new direction.  Red has the
        longest path (haemoglobin absorbs at ~430&nbsp;nm and ~575&nbsp;nm,
        leaving 700&nbsp;nm red largely unattenuated); blue has the shortest.
        Blender&apos;s default{" "}
        <code>(1.0,&nbsp;0.2,&nbsp;0.1)</code> targets photorealistic Caucasian
        skin with a scene scale of 1&nbsp;unit&nbsp;=&nbsp;1&nbsp;metre.  For a
        stylised character head modelled at 0.21&nbsp;m diameter you set{" "}
        <code>Subsurface Scale = 0.06</code>, which compresses those paths by a
        factor of 17 — giving effective MFPs of 60&nbsp;mm, 12&nbsp;mm,
        6&nbsp;mm.  Anime skin then pushes the red channel higher than
        photorealistic (this blueprint uses{" "}
        <code>(1.0,&nbsp;0.42,&nbsp;0.25)</code>) to produce the characteristic
        warm-tinted glow on cheeks and nose tips without making the ears look
        raw.  Compare the Radius strategy here with the Sheen lobe used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-hair-bsdf-vrm"
          className={lk}
        >
          VRM hair BSDF tutorial
        </Link>
        , where the TT lobe handles forward scatter through the hair shaft and
        Sheen handles surface fuzz — both are about multi-layer light transport,
        just at fibre scale rather than tissue scale.
      </p>

      <p>
        <strong>RANDOM_WALK_SKIN</strong> is the correct method for character
        faces in Blender 5.1.  The older{" "}
        <code>BURLEY</code> method uses a closed-form diffusion profile that
        assumes the object is optically infinite from the sample point — it
        pre-integrates scatter over an infinite slab.  That assumption breaks
        whenever the object is thinner than the mean free path, which is
        exactly the case for ears (1–3&nbsp;mm) and nasal septum cartilage
        (2–3&nbsp;mm).  <code>RANDOM_WALK_SKIN</code> traces actual photon
        paths inside the mesh using a modified random walk that respects the
        mesh boundary: when the path hits the far surface, those photons exit
        and contribute to the transmitted-light colour.  The practical
        difference is stark — ears rendered with Burley look grey and opaque;
        the same scene with Random Walk Skin shows the warm red glow that
        portrait photographers recognise from rim-lit shots.  Note that this
        method only applies in Cycles; EEVEE Next 5.1 uses its own
        screen-space SSS approximation regardless of the method enum, though
        the visual result is close enough for viewport previews.  For a
        contrast with a physically modelled thin-shell scenario where
        transmission dominates over scatter, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          holographic gem shader
        </Link>
        , which uses the Transmission weight instead of Subsurface.
      </p>

      <p>
        This blueprint assigns <strong>three materials</strong> to three mesh
        objects: face skin (Subsurface Weight 0.55, Sheen 0.18 for the anime
        cheek bloom), ear skin (Weight 0.90, no Sheen — the glow dominates),
        and lips (Weight 0.75, slightly damp roughness at 0.30).  The Sheen
        lobe at 0.18 with Roughness 0.40 produces the soft velvet highlight on
        high cheekbones common in anime key-art.  It is the same micro-fibre
        lobe used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-woven-fabric"
          className={lk}
        >
          woven fabric shader
        </Link>
        {" "}— fabrics and skin both have oriented surface microstructure that
        produces a directional bloom perpendicular to the main specular lobe.
        Lighting is a standard three-point rig: warm key Area light
        (1200&nbsp;W at 0.35&nbsp;m diameter, wraps softly around the cheek);
        cool blue Point rim (600&nbsp;W behind-and-above, the SSS test light);
        neutral fill (300&nbsp;W).  If you need to bake the SSS result to an
        image texture for real-time WebXR rendering, follow the workflow in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking guide
        </Link>{" "}
        using <code>bpy.ops.object.bake(type=&apos;DIFFUSE&apos;, pass_filter=&apos;COLOR&apos;)</code>{" "}
        — this captures the SSS colour contribution into a flat texture that
        Three.js and Babylon.js can consume without a volumetric renderer.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-subsurface-scattering-stylised-skin",
  title: "Shader — Subsurface Scattering: Stylised Skin",
  date: "2026-06-10",
  kind: "tutorial",
  excerpt:
    "Principled BSDF v2 Subsurface cluster — Random Walk Skin for accurate ear translucency glow, multi-region SSS (face/ears/lips), and Sheen bloom for anime character skin. Cycles + EEVEE Next 5.1.",
  Body: ShaderSssStylisedSkinBody,
};

export const entry = buildInstructable(
  {
    time: "one session (2–3 hours)",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, no add-ons",
    supplies: {
      materials: [
        "Blender 5.1 (cycles renderer)",
        "blueprint.py from public/library/blends/shading/shader-subsurface-scattering-stylised-skin/",
      ],
      tools: [
        "Shader Editor",
        "Properties › Material › Principled BSDF",
        "Render Properties › Cycles › Sampling",
        "Spreadsheet Editor (for attribute inspection)",
      ],
    },
    steps: [
      {
        title: "Understand the Subsurface cluster",
        content: `Open Properties › Material, select the Principled BSDF node, expand the Subsurface section.
You will see six inputs: Weight, Radius (a colour/vector), Scale, IOR, Anisotropy, Method.

Subsurface Weight blends from pure diffuse (0) to full subsurface scatter (1).
For photorealistic skin use 0.3; for anime/stylised characters push to 0.5–0.7.

Subsurface Radius is NOT a blur amount — it is the mean free path per wavelength.
Red should be longest (haemoglobin transmits red), blue shortest.
Default (1.0, 0.2, 0.1) is calibrated for a 1-metre scale object.
Your head is ~0.2 m — set Subsurface Scale to 0.06 to compress the paths accordingly.`,
      },
      {
        title: "Choose RANDOM_WALK_SKIN as the method",
        content: `In the Method dropdown, select RANDOM_WALK_SKIN (not BURLEY, not RANDOM_WALK).

BURLEY uses a diffusion approximation that assumes the object is optically infinite from each
sample point. This works for thick geometry but fails on thin shells: ears and nasal cartilage
read as grey instead of the warm red glow you expect.

RANDOM_WALK_SKIN traces actual photon paths inside the mesh. When the path hits the far face,
the photon exits there, contributing its (haemoglobin-tinted) colour to the final pixel.
Thin geometry exits quickly → warm translucent glow. Thick geometry exits rarely → behaves
like diffuse, just as expected.

NOTE: In EEVEE Next 5.1, the method enum is accepted but the renderer uses its own screen-space
SSS regardless. For faithful ear glow, render final frames in Cycles.`,
      },
      {
        title: "Set Radius channels for stylised skin",
        content: `Click the colour swatch next to Subsurface Radius to expand the R/G/B sliders.

Photorealistic Caucasian skin (from measured data):
  R = 1.00, G = 0.20, B = 0.10  (at Scale = 1.0, i.e., 1m object)

Anime/stylised skin (this tutorial):
  R = 1.00, G = 0.42, B = 0.25  (warmer, more saturated glow)

The higher G and B values push the scattered light toward a less extreme red, giving a
healthier flush rather than the raw-meat look of an over-red photorealistic setup.
Set Subsurface Scale = 0.06 (head is 0.21 m diameter).

For the ear material, set R = 1.50, G = 0.55, B = 0.22 — the pinna is thinner so you
can afford a higher absolute radius before it looks unnatural.`,
      },
      {
        title: "Add Sheen for the anime cheek bloom",
        content: `The Sheen lobe in Principled BSDF v2 models micro-fibre surface structure.
For skin this represents the layer of fine vellus hair and dead keratinised cells that
produce a soft directional bloom on high cheekbones in anime key-art.

Set Sheen Weight = 0.18, Sheen Roughness = 0.40.
The Roughness value controls how broad the bloom is: 0.3 gives a tighter highlight
(polished finish), 0.5 gives a broader velvet spread (matte anime skin).

Leave Sheen Tint at its default — it inherits from the base colour, which is correct
for skin. Override only if the character has a non-neutral skin tone where the fuzz
colour should differ.

The ear material should have Sheen Weight = 0 — the translucency glow dominates and
Sheen on a thin shell reads as noise.`,
      },
      {
        title: "Run blueprint.py and verify with a rim-light render",
        content: `Open Blender 5.1 with a new file. Open the Text Editor, load blueprint.py,
click Run Script (or: blender --background --python blueprint.py).

The script builds:
  - Head (UV sphere, 32×24, radius 0.105 m, skin_face material)
  - Right/left ear (flattened icospheres, skin_ear material, SSS weight 0.90)
  - Lip ring (torus, skin_lips material, SSS weight 0.75)
  - Three-point lighting (key Area 1200W warm, rim Point 600W cool blue, fill 300W)
  - Portrait camera (85mm lens, 36mm sensor)

In the 3D viewport, press Numpad 0 (camera view), then Z → Rendered.
The rim light is positioned behind-and-above — look at the ear closest to it.
With RANDOM_WALK_SKIN and Cycles you should see a warm red-orange glow on the back
of the pinna. If it appears grey, confirm: (1) render engine is Cycles, not EEVEE,
(2) Method is RANDOM_WALK_SKIN, (3) Subsurface Scale is 0.06 not 1.0.`,
      },
      {
        title: "Export to GLB for WebXR preview",
        content: `The blueprint.py export_glb() function runs:
  bpy.ops.export_scene.gltf(
      filepath="//sss_skin.glb",
      export_format='GLB',
      export_apply=True,
      export_materials='EXPORT',
      export_draco_mesh_compression_enable=True,
      export_draco_mesh_compression_level=6,
  )

IMPORTANT: SSS does not export to GLB in any meaningful way. The glTF specification
has no SSS material extension as of glTF 2.0. The exporter converts Principled BSDF
to a KHR_materials_transmission + KHR_materials_volume approximation, which reads the
Transmission weight — NOT the Subsurface weight.

For real-time WebXR use, bake the SSS colour contribution to a diffuse texture first:
  1. UV-unwrap the head (see the UV Unwrap + Pack Islands tutorial)
  2. Add an Image Texture node to the material (unconnected — it becomes the bake target)
  3. bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'})
  4. Connect the baked image to Base Color, set Subsurface Weight = 0
  5. Export — the baked texture contains the SSS look in a standard albedo map.`,
      },
    ],
    finalResult:
      "A stylised character head with three-region SSS (face/ears/lips), showing warm ear translucency glow under a rim light in Cycles. The Blender file contains the full material setup. The GLB is suitable for WebXR preview after diffuse baking.",
    variations: [
      "Subsurface colour tinting: add a ShaderNodeRGBCurves before the Subsurface Radius input to push the scattered colour warmer (increase R curve) or cooler (increase B) without changing the raw Radius values. Useful when you want to distinguish ethnically diverse skin tones purely by altering the scatter colour rather than the base colour.",
      "Dual-surface SSS: build two shell meshes — an outer thin epidermis (Subsurface Weight 0.2, blue-biased Radius to model melanin absorption) and an inner dermis (Weight 0.8, haemoglobin-biased Radius). Join them in a single object, assign materials by face selection, and parent both to the rig. This two-layer approach matches the dermatological reality more closely than a single-material model and is visible in close-up portrait renders.",
      "NLA-driven SSS pulse: keyframe Subsurface Weight from 0.55 → 0.80 → 0.55 over 12 frames synced to a heartbeat sound strip in the NLA editor. The pulsing translucency effect reads as a living blush on the cheeks. Pair with a matching rim-light intensity keyframe for a biologically plausible flush animation.",
    ],
    troubleshooting: [
      {
        symptom: "Ears appear grey/opaque instead of showing red glow under rim light",
        cause:
          "Most likely cause: render engine is EEVEE, not Cycles. EEVEE Next 5.1 uses screen-space SSS regardless of the Method enum and cannot model thin-shell transmission accurately. Second cause: Subsurface Scale is still at the default 1.0, making the effective MFP 17× too large for a 0.2 m head — the scatter exits the wrong side of the head entirely.",
        fix: "Set Render Properties → Render Engine → Cycles. Confirm Subsurface Scale = 0.06. If already in Cycles, confirm Subsurface Method = RANDOM_WALK_SKIN (not BURLEY). With Burley the ear looks opaque at thin thicknesses; switching to Random Walk Skin should produce the glow immediately.",
      },
      {
        symptom: "Skin looks like raw meat — too deep red, unpleasant",
        cause:
          "Subsurface Radius red channel is too high relative to the green and blue channels, or Subsurface Weight is too high (approaching 1.0). A Weight of 1.0 on skin makes the entire surface act as a light-transmitting gel.",
        fix: "Lower Weight to 0.50–0.60. Reduce Radius R from 1.5+ down to 1.0. Ensure G and B are at least 0.30 and 0.20 respectively — an extreme red-only scatter profile exaggerates the haemoglobin colour beyond biological range. Cross-check by temporarily setting all three Radius channels equal: the result should look neutral-milky, confirming the geometry and Scale are correct before you re-introduce the colour bias.",
      },
      {
        symptom: "Sheen bloom is too strong — cheeks look frosted or dusty",
        cause:
          "Sheen Weight is too high (>0.30) and/or Sheen Roughness is too low (<0.30), concentrating the lobe into a visible specular highlight rather than a diffuse bloom.",
        fix: "Set Sheen Weight to 0.12–0.20 and Sheen Roughness to 0.38–0.50. Reduce Key Light energy or move it further from the cheek. The Sheen lobe is most visible when the light-normal angle is approximately 45°; moving the key to a steeper angle (more top-lit) reduces the Sheen contribution without changing the SSS.",
      },
    ],
  },
  base,
);

export { entry };
