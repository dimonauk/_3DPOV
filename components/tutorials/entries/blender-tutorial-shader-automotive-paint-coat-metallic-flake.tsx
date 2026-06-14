import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AutomotivePaintBody() {
  return (
    <>
      <p>
        Automotive paint is not a single material — it is a stack of three distinct
        optical systems applied in sequence at the factory. The pigmented base coat
        absorbs and diffusely reflects light at high roughness. Suspended above it,
        embedded in a transparent binder resin, sit thousands of metallic or
        pearlescent flakes: each one a near-perfect tiny mirror, tilted at a slightly
        different angle to its neighbours. On top of everything sits a glass-like
        clear coat lacquer — smooth, colourless, and responsible for the wet-looking
        specular highlight that slides across the surface as the car moves relative to
        a light source.
      </p>

      <p className="mt-3">
        Blender 5.1&apos;s Principled BSDF v2 models all three layers within a
        single node. The explicit <strong>Coat Weight</strong>,{" "}
        <strong>Coat IOR</strong>, and <strong>Coat Roughness</strong> sockets
        replace the old technique of stacking two BSDFs through a Mix Shader — the
        v2 coat lobe is evaluated after the base + flake sub-surface interaction,
        which matches the physical light path exactly: photons enter through the coat,
        scatter at the base, and the coat adds its own Fresnel specular on the way out.
      </p>

      <p className="mt-3">
        The flake layer is synthesised entirely from a Noise Texture thresholded by a{" "}
        <em>CONSTANT</em> interpolation Color Ramp. Setting interpolation to CONSTANT
        produces a binary step: a given surface point is either 100 % metallic (a flake)
        or 0 % (base coat). A separate, offset Noise Texture feeds a Bump node wired to
        the Normal socket, tilting each flake&apos;s micro-normal independently. Orbiting
        the camera causes individual flakes to ignite and extinguish as their normals
        align with the half-vector between the camera and the light — the defining visual
        character of metallic car paint.
      </p>

      <p className="mt-3">
        For the complementary technique of procedural specular streaks on brushed metal
        panels, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-anisotropic-bsdf-brushed-metal"
          className={lk}
        >
          Anisotropic BSDF Brushed Metal tutorial
        </Link>
        . For layering procedural surface wear over a metallic base, see{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear"
          className={lk}
        >
          Procedural Worn Metal Edge Wear
        </Link>
        . EEVEE Next screen-space ray tracing — needed to resolve the coat highlight
        in real-time — is covered in{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy"
          className={lk}
        >
          EEVEE Next Screen-Space Ray Tracing
        </Link>
        . To bake the procedural metallic flake mask to a texture for WebXR export, see{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Texture Baking: Normal + AO
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-shader-automotive-paint-coat-metallic-flake",
  title:
    "Shader: Automotive Paint — Principled BSDF v2 Coat + Metallic Flake Three-Layer System (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Automotive paint is three optical layers: pigmented base coat, suspended metallic " +
    "flakes, and clear coat lacquer. Blender 5.1's Principled BSDF v2 models all three " +
    "with explicit Coat Weight / IOR / Roughness sockets. A CONSTANT Color Ramp on a " +
    "Noise Texture produces binary flake coverage; a second offset Noise via Bump tilts " +
    "each flake's micro-normal independently, creating view-dependent sparkle. Exports " +
    "to GLB via KHR_materials_clearcoat for Three.js / WebXR.",
  Body: AutomotivePaintBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/shading/shader-automotive-paint-coat-metallic-flake",
    time: "1.5–2.5 hours",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable connecting nodes in the Shader Editor",
      "Understands Principled BSDF Metallic, Roughness, and Base Color sockets",
      "Familiar with Noise Texture and Color Ramp nodes",
      "Has run at least one Cycles render — knows the Samples setting",
    ],
    steps: [
      {
        title: "Scene setup and panel mesh",
        body: `Run blueprint.py from the Scripting workspace to build everything
automatically, or follow these manual steps to understand the structure.

Manual setup:
  1. Delete the default cube (X → Delete).
  2. Add → Mesh → Grid (X=4, Y=4 segments).
  3. Scale in Edit Mode: S X 0.6 → S Y 0.3 → Tab out.
  4. Add Modifier → Solidify: thickness=0.01m, offset=1.0 (extrude toward +Z only).
  5. Add Modifier → Subdivision Surface: viewport=1, render=2, quality=3.

The grid + solidify approach is preferred over a Plane + manual extrude because
Solidify maintains clean loop topology at the panel edges — important for
coat highlights to wrap cleanly around the perimeter.`,
      },
      {
        title: "Flake coverage mask — Noise Texture + CONSTANT Color Ramp",
        body: `This step produces the binary metallic mask that decides which surface
points are flakes and which are base coat.

In the Shader Editor with the panel selected:

  1. Add a Principled BSDF if not already present.  Clear the default nodes.
  2. Add → Texture → Noise Texture (call it "Noise_Coverage").
     Set:  Scale=88, Detail=2, Roughness=0.5, Distortion=0.15
     Why Scale=88: automotive metallic flakes are roughly 50–100 µm wide.
     A 1 m panel maps to about 10,000–20,000 flakes across its width.
     Scale 88 produces visually plausible density at typical render resolutions.
  3. Add → Converter → Color Ramp.
     Set interpolation mode to CONSTANT (the dropdown, not Ease/Linear).
     — CONSTANT = hard step threshold.  Any value below position 1 is black;
       at or above it, white.  This is what makes discrete flakes.
     Move the white stop to position 0.72.  (Lower = more flakes; higher = fewer.)
  4. Link: Noise_Coverage.Fac → ColorRamp.Fac
  5. Link: ColorRamp.Color → Principled BSDF.Metallic

At this point set Principled BSDF Base Color to (0.62, 0.03, 0.02) and Metallic
to 0.0 as a default. The Color Ramp output OVERRIDES the socket's default value
wherever a link is connected — but the non-linked fallback does not matter.`,
      },
      {
        title: "Flake orientation — Bump node for micro-normal variation",
        body: `Each visible flake needs its surface normal tilted by a random amount.
Without this step every flake reflects light toward the SAME camera angle —
the surface looks like a shiny gradient rather than a sparkle field.

  1. Add → Texture → Noise Texture (call it "Noise_Orientation").
     Set the same Scale=88.  Then set W=0.27.
     Why offset W?: W is the 4th dimension of the procedural noise.  Using a
     different W than Noise_Coverage means the two noise fields are uncorrelated
     even though they share the same scale.  A flake visible in coverage noise
     will NOT necessarily have the maximum tilt in orientation noise — this
     prevents visible systematic artefacts at flake edges.
  2. Add → Vector → Bump.
     Set:  Strength=1.8, Distance=0.003 m
     — Strength=1.8: aggressive enough to produce clear sparkle without making
       the surface look physically impossible (macro normal deflected > 30°).
     — Distance=0.003 m: matches the physical thickness of a metallic paint
       flake in a 1 m panel context.
  3. Link: Noise_Orientation.Fac → Bump.Height
  4. Link: Bump.Normal → Principled BSDF.Normal`,
      },
      {
        title: "Roughness interpolation — base coat ↔ flake",
        body: `The base coat has roughness 0.48 (matte pigment); each flake has
roughness 0.07 (near-mirror).  The same binary mask drives the interpolation:

  1. Add → Converter → Mix (data type = Float).
     Set A (input 1) = 0.48    (base coat roughness)
     Set B (input 2) = 0.07    (flake roughness)
  2. Link: ColorRamp.Fac → Mix.Factor
     (not ColorRamp.Color — the .Fac output is a scalar 0–1, same as the step)
  3. Link: Mix.Result → Principled BSDF.Roughness

Why not just use the Metallic socket to drive roughness implicitly? Because
Blender's Principled BSDF computes roughness and metallic independently.
A metallic socket value of 1.0 does not automatically reduce roughness —
you must set the roughness you want explicitly. Wiring via the Mix node
gives precise control over each layer's micro-surface finish.`,
      },
      {
        title: "Clear coat layer — Principled BSDF v2 Coat sockets",
        body: `The clear coat is configured directly on the Principled BSDF node.
In Blender 5.1 these sockets are in the Coat section (scroll down in the node):

  Coat Weight    = 1.0    — fully opaque clear coat
  Coat IOR       = 1.50   — standard soda-lime glass / automotive lacquer
  Coat Roughness = 0.018  — very smooth; scratches bring this to 0.05–0.12
  Coat Tint      = white  — neutral (R=1, G=1, B=1); tinted lacquers go here

Why IOR 1.50?  Blender's coat uses a Fresnel response derived from IOR.
At IOR 1.50 the normal-incidence reflectance is 4 % — correct for most
automotive clear coats (polyurethane-acrylate or two-pack urethane resins
sit in the range 1.47–1.53).

Setting Coat Roughness to 0.018 makes the coat specular sharper than most
light sources are physically realistic to produce.  This is intentional:
car paint is optically very smooth — surface defects are measured in tens
of nanometres, not microns.  The slight apparent softness you see in renders
comes from the light source size, not the material roughness.

In Cycles with 256 samples the coat highlight resolves without noise.
In EEVEE Next, enable Render Properties → Ray Tracing to get the SSR
approximation of the coat highlight.`,
      },
      {
        title: "Lighting rig — key light geometry for coat + flake",
        body: `Two visual targets must be satisfied simultaneously in a single camera
position: the coat's large, soft, single specular lobe AND individual flake
micro-highlights scattered across the surface.

The key light governs both; it must be small enough to produce sharp flake
sparks but positioned so its coat highlight is clearly visible in the
same frame.

Configuration (from blueprint.py AREA light settings):
  Key:  AREA, energy=800 W, size=0.5 m
        location=(1.2, -1.8, 1.5), rotation=(55°, 0°, 30°)
        → grazes the panel at ~30° from the surface tangent
        → coat specular sits at upper-left of panel
        → flake sparks visible across the remaining dark area

  Fill: AREA, energy=100 W, size=2.0 m, opposite side
        → soft ambient wrap; keeps non-specular areas from going pure black

  Rim:  SPOT, energy=400 W, from above/behind
        → catches the coat gloss wrapping around the panel's top edge

Rule for coat+flake lighting: the angle between key and camera, measured
at the panel surface, should be 40°–70°.  Below 40° both highlights overlap
(indistinguishable); above 80° the coat highlight leaves the frame entirely.

Camera settings: 85 mm telephoto (data.lens=85), aimed at panel centre,
height 0.45 m.  Telephoto compresses depth and makes the coat highlight
appear geometrically larger relative to the flake field — easier to read.`,
      },
      {
        title: "Cycles render settings and bounce budget",
        body: `The coat–flake–coat light path requires multiple specular bounces:
  1. Light enters through coat (refraction)
  2. Reflects from a flake (specular bounce 1)
  3. Exits through coat again (refraction)
  4. Reaches the camera

Blender's Cycles default of 4 glossy bounces handles this, but cranking
glossy_bounces to 8 ensures indirect coat reflections of the flakes are
also captured (visible when another panel or light is visible in the coat).

Settings used in blueprint.py:
  Samples            = 256 (reduce to 64 for test renders)
  max_bounces        = 12
  diffuse_bounces    = 4
  glossy_bounces     = 8
  transmission_bounces = 12
  use_denoising      = True   (Intel OIDN; disable if reviewing micro-sparkle)

Denoising note: OIDN smooths fine detail.  If the flake sparkle looks blurry
at high camera distances, disable denoising and raise samples to 512 instead.
At close range (panel fills the frame) 256 samples + OIDN is sufficient.`,
      },
      {
        title: "GLB export — KHR_materials_clearcoat",
        body: `Blender's glTF exporter automatically writes the KHR_materials_clearcoat
extension when Coat Weight > 0 on a Principled BSDF.

The extension encodes:
  clearcoatFactor          → Coat Weight   (1.0)
  clearcoatRoughnessFactor → Coat Roughness (0.018)
  (IOR via KHR_materials_ior, also written automatically)

What does NOT export automatically:
  The metallic flake mask.  The Noise Texture is procedural — the GLB has no
  node graph, only the resulting surface response baked into flat values.
  The export sees Metallic=0 at non-flake pixels and Metallic=1 at flake pixels
  only if you first bake the shader to a MetallicRoughness image texture.

To export authentic per-pixel flake metallic for Three.js:
  1. Follow the Texture Baking Normal/AO tutorial to bake Metallic to a 2K texture.
  2. Assign the baked texture to the Metallic socket instead of the Noise chain.
  3. Re-export GLB — the exporter will embed the baked texture.

In Three.js, KHR_materials_clearcoat maps directly:
  material = new THREE.MeshPhysicalMaterial({
    clearcoat:          1.0,
    clearcoatRoughness: 0.018,
    metalness:          <baked metallic texture>,
    roughness:          <baked roughness texture>,
  });`,
      },
    ],
    troubleshooting: [
      {
        symptom:
          "All flakes look the same size and the surface resembles a regular grid.",
        cause:
          "Noise Texture Distortion is 0. Without distortion the noise pattern can alias at certain scale settings, producing near-regular artefacts.",
        fix:
          "Set Distortion to 0.10–0.20 on Noise_Coverage. Also ensure the mesh has enough UV variation — Noise Texture in 3D space mode avoids UV-based alignment entirely (default if no UV map is connected to the Texture coordinate).",
      },
      {
        symptom: "Flake sparkle does not shift as the camera orbits — looks static.",
        cause:
          "Bump node Strength is too low, or Noise_Orientation is connected to the same output as Noise_Coverage (i.e., the Fac is identical so the orientation equals the coverage mask).",
        fix:
          "Verify Noise_Orientation.W ≠ Noise_Coverage.W (should differ by at least 0.2). Raise Bump Strength to 1.5–2.5. Also confirm the Bump node's Normal output is wired to Principled BSDF Normal, not to the Coat Normal socket (coat normal is a separate input).",
      },
      {
        symptom: "Coat highlight looks identical to a standard Glossy BSDF — no difference from Blender 3.x.",
        cause:
          "Running Blender < 4.0 where Principled BSDF v2 Coat sockets do not exist. Or the node was created in 3.x and imported — the Coat sockets are absent on old node instances.",
        fix:
          "Delete the Principled BSDF node and add a fresh one. In Blender 5.1 the Coat section appears automatically. The v2 Principled BSDF node was introduced in Blender 4.0; old files upgraded by the compatibility converter may retain a v1 node lacking Coat Weight.",
      },
      {
        symptom: "Render is extremely noisy at flake edges — bright fireflies on the boundary ring of each flake.",
        cause:
          "Hard metallic transitions (0 → 1 over a sub-pixel area) in Cycles create variance spikes. The CONSTANT Color Ramp threshold falls exactly at a texel boundary, producing samples where the path weight is extremely high.",
        fix:
          "Raise Cycles Firefly Clamping: Render Properties → Light Paths → Clamp Direct = 10, Clamp Indirect = 5. Alternatively smooth the Color Ramp just slightly (position the white stop at 0.70 instead of 0.72, and add a very small 0.01-wide grey transition). This barely affects the look but eliminates the bright single-pixel spikes.",
      },
      {
        symptom:
          "GLB imports into Three.js but shows no clearcoat reflection — material looks matte.",
        cause:
          "Three.js version < r136 does not support KHR_materials_clearcoat. Or the GLBViewer (e.g. gltf.report) being used does not implement the extension.",
        fix:
          "Verify in gltf.report that the material JSON contains extensionsUsed: [\"KHR_materials_clearcoat\"]. If present but Three.js ignores it, upgrade to Three.js r136+ where KHR_materials_clearcoat is part of the GLTFLoader's default extension set. Also confirm MeshPhysicalMaterial is used rather than MeshStandardMaterial — clearcoat is only on Physical.",
      },
      {
        symptom: "EEVEE viewport shows no flake sparkle — flat metallic look only.",
        cause:
          "EEVEE Next requires Screen-Space Ray Tracing (Render Properties → Ray Tracing) for sub-pixel specular variation. Without SSR the anisotropic/specular micro-detail is averaged away.",
        fix:
          "Enable Render Properties → Ray Tracing. Set Ray Tracing → Glossy Rays to 2 (default is 1 — doubles glossy ray count). Also switch viewport shading to Rendered (not Material Preview) — Material Preview uses a fixed HDRI that may not produce directional glancing angles needed to see sparkle.",
      },
    ],
  },
  base
);
