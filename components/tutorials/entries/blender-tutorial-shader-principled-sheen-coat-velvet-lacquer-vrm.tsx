import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SheenCoatBody() {
  return (
    <>
      <p>
        Principled BSDF v2 ships two composite layers that most people ignore:
        <strong> Sheen</strong> (Charlier–Estevez retroreflective lobe for
        velvet / microfibre) and <strong>Coat</strong> (attenuated two-layer
        BSDF for lacquer / car paint). Both export to glTF 2.0 extensions
        supported by modern WebXR runtimes.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Sheen — retroreflective lobe</h2>
      <p>
        Standard GGX specular peaks <em>toward</em> the viewer. Velvet behaves
        oppositely — its fibres scatter light back toward the source at grazing
        angles, producing the bright-edge bloom you see on dark pile fabric.
        Blender implements this with the Charlier–Estevez model, which also
        drives Filament&apos;s and Unreal&apos;s cloth shading.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`Sheen Weight   [0–1]  overall mix into base response
Sheen Roughness[0–1]  0.0 = sharp velvet peak  |  1.0 = broad microfibre wash
Sheen Tint     [0–1]  0.0 = white edge highlight  |  1.0 = tinted by Base Color

glTF → KHR_materials_sheen
  sheenColorFactor     = lerp(white, BaseColor, Tint) × Weight
  sheenRoughnessFactor = Sheen Roughness
Three.js support from r153+.  Test in Khronos glTF Sample Viewer.`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">Coat — two-layer attenuated BSDF</h2>
      <p>
        The Coat lobe sits above the entire base BSDF and physically attenuates
        it via transmittance — light passes through the coat film twice (in and
        out), deepening and darkening the apparent base. This is why lacquered
        paint looks so rich. The <strong>Coat Normal</strong> socket is the most
        underused control: wire a separate baked normal here to keep the coat
        surface optically smooth while the base texture reads as embossed.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`Coat Weight    [0–1]  specular strength of coat film
Coat Roughness [0–1]  0.0 = mirror lacquer  |  1.0 = matte satin
Coat IOR       [≥1]   1.49 = acrylic lacquer  (in-Blender only; not exported)
Coat Normal    [vec3] separate normal for coat — baked Image Texture exports

glTF → KHR_materials_clearcoat
  clearcoatFactor          = Coat Weight
  clearcoatRoughnessFactor = Coat Roughness
  clearcoatNormalTexture   = baked tangent normal for Coat Normal`}</pre>
      <p className="mt-3">
        Bake the Coat Normal to a texture first — see{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          Texture Baking: Normal + AO
        </Link>
        . Procedural Bump nodes in the Coat Normal slot are not exported.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Material recipes</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`── Navy velvet jacket ──────────────────────────────────
Base Color      (0.038, 0.052, 0.175)
Roughness       0.74    Sheen Weight  0.93
Sheen Roughness 0.21    Sheen Tint    0.36
Coat Weight     0.0

── Patent leather belt ─────────────────────────────────
Base Color      (0.020, 0.016, 0.014)
Roughness       0.67    Sheen Weight  0.11
Sheen Roughness 0.80    Coat Weight   0.87
Coat Roughness  0.04    Coat IOR      1.49`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">VRM clothing export</h2>
      <p>
        VRM 1.0 MToon does not carry Sheen or Coat. For WebXR scenes (not VRM
        viewers) export with standard glTF: snake_case root name, Apply
        Transforms, Draco level 6, WebP textures, Y-up. Confirm both extensions
        appear in the Khronos Sample Viewer before integrating. See{" "}
        <Link href="/tutorials/blender-tutorial-shader-subsurface-scattering-stylised-skin" className={lk}>
          Stylised Skin SSS
        </Link>{" "}
        and{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-hair-bsdf-vrm" className={lk}>
          Principled Hair BSDF for VRM
        </Link>{" "}
        for the rest of the character material stack.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Sheen invisible in viewport</strong> — switch to Rendered
          shading (EEVEE Next). LookDev mode uses an approximate model that
          may drop the retroreflective lobe.
        </li>
        <li>
          <strong>Coat makes base look grey/washed</strong> — two-layer
          attenuation darkens light base colours. Increase base saturation or
          keep Coat Weight below 0.5 on near-white bases.
        </li>
        <li>
          <strong>KHR_materials_sheen absent in export</strong> — Sheen Weight
          must be set directly on the BSDF socket, not driven from an upstream
          Mix Shader node the exporter cannot trace.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Outside sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a href="https://docs.blender.org/manual/en/5.1/render/shader_nodes/shader/principled.html"
            target="_blank" rel="noreferrer" className={lk}>
            Principled BSDF — Blender Manual (CC BY, Blender Foundation)
          </a>
        </li>
        <li>
          <a href="https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_sheen/README.md"
            target="_blank" rel="noreferrer" className={lk}>
            KHR_materials_sheen spec (MIT — KhronosGroup/glTF)
          </a>{" "}· related:{" "}
          <a href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
            target="_blank" rel="noreferrer" className={lk}>
            glTF-Sample-Viewer (Apache-2.0)
          </a>
        </li>
        <li>
          <a href="https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_clearcoat/README.md"
            target="_blank" rel="noreferrer" className={lk}>
            KHR_materials_clearcoat spec (MIT — KhronosGroup/glTF)
          </a>
        </li>
      </ul>
      <p className="mt-4">
        Full socket-to-extension reference:{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr" className={lk}>
          Principled BSDF v2 full parameter map
        </Link>
        . Transparency handling:{" "}
        <Link href="/tutorials/blender-tutorial-shader-alpha-clip-blend-foliage-decal-webxr" className={lk}>
          Alpha Clip vs Alpha Blend for WebXR
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open blueprint.py in Blender's Text Editor and run it. It clears the scene, builds cloth_panel (velvet) and lacquer_band, applies both materials, and exports velvet_lacquer_clothing.glb. Confirm '[holoflow] GLB written' in the System Console.",
      },
      {
        title: "Observe Sheen on cloth_panel",
        body: "Select cloth_panel, switch to Rendered viewport shading (EEVEE Next). Orbit until the cloth faces away from the key light — the retroreflective edge bloom appears. Scrub Sheen Roughness: 0.21 = sharp velvet peak; 0.95 = broad microfibre wash.",
      },
      {
        title: "Observe Coat on lacquer_band",
        body: "Select lacquer_band, Rendered mode. Drag Coat Weight from 0.87 to 0. The near-mirror lacquer dissolves to matte leather — and notice how the base lightens as Coat decreases (two-layer attenuation reverses).",
      },
      {
        title: "Verify glTF extensions",
        body: "Open velvet_lacquer_clothing.glb in the Khronos glTF Sample Viewer. Expand the Material panel: KHR_materials_sheen and KHR_materials_clearcoat should both appear.",
      },
      {
        title: "Record viewport.mp4",
        body: "Save the .blend, run record.py. It keyframes Sheen Weight (0→1), Sheen Roughness (velvet→microfibre), and Coat Weight (0→0.87) across 90 frames at 24 fps and renders to public/library/videos/…/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Sheen not visible in LookDev/Material Preview",
        cause: "LookDev uses an approximate shading model that may not compute the Charlier–Estevez retroreflective lobe.",
        fix: "Switch to Rendered viewport shading with EEVEE Next.",
      },
      {
        symptom: "KHR_materials_sheen missing from exported GLB",
        cause: "The exporter reads the BSDF socket default_value directly; it cannot trace upstream driver nodes.",
        fix: "Set Sheen Weight directly on the Principled BSDF node, not via a Mix Shader or driver.",
      },
      {
        symptom: "Coat Normal has no effect in the viewer",
        cause: "Only baked Image Texture → Normal Map nodes are exported for clearcoatNormalTexture.",
        fix: "Bake the coat normal to an image texture and wire it through a Normal Map node into Coat Normal.",
      },
    ],
  },
  {
    slug: "blender-tutorial-shader-principled-sheen-coat-velvet-lacquer-vrm",
    title:
      "Shader — Principled BSDF v2: Sheen & Coat — Velvet Fabric and Clear-Coat Lacquer for VRM Clothing",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "Deep-dive into Principled BSDF v2 Sheen (Charlier–Estevez retroreflective lobe) and Coat (two-layer attenuated BSDF): build velvet fabric and patent leather that export KHR_materials_sheen and KHR_materials_clearcoat for WebXR.",
    tags: [
      "blender",
      "shading",
      "pbr",
      "principled-bsdf",
      "sheen",
      "coat",
      "clearcoat",
      "velvet",
      "fabric",
      "vrm",
      "webxr",
      "gltf",
      "khr-materials",
    ],
    Body: SheenCoatBody,
  },
);
