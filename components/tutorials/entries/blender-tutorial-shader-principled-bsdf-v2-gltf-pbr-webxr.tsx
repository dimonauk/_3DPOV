import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PrincipledBsdfV2GltfBody() {
  return (
    <>
      <p>
        Blender 4.0 redesigned the Principled BSDF into version 2: the old
        Clearcoat weight became a dedicated <strong>Coat</strong> layer,
        "Sheen" became a weighted layer with its own tint, Emission gained a
        separate Strength socket, and "Specular" was renamed{" "}
        <strong>Specular IOR Level</strong> to clarify it controls Fresnel
        intensity rather than a flat multiplier. In Blender 5.x the node API
        stabilised. Understanding exactly <em>which</em> sockets export to
        glTF 2.0 extensions — and which are silently dropped — is the
        difference between a WebXR prop that looks correct in the browser
        and one that arrives flat.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Export map</h2>
      <p>
        The Blender glTF I/O add-on (Apache-2.0, Khronos Group) writes
        <code className="mx-1 px-1 bg-zinc-800 rounded">KHR_materials_*</code>
        extensions automatically when the corresponding BSDF socket is
        non-zero. This is the full map for Blender 5.1:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre mt-3">{`BSDF socket              → glTF property
─────────────────────────────────────────────────────────────────────
Base Color               → pbrMetallicRoughness.baseColorFactor
Metallic                 → pbrMetallicRoughness.metallicFactor
Roughness                → pbrMetallicRoughness.roughnessFactor
IOR                      → KHR_materials_ior.ior
Alpha                    → material.alphaMode (OPAQUE/BLEND/MASK)
Specular IOR Level       → KHR_materials_specular.specularFactor
Coat Weight              → KHR_materials_clearcoat.clearcoatFactor
Coat Roughness           → KHR_materials_clearcoat.clearcoatRoughnessFactor
Sheen Weight + Tint      → KHR_materials_sheen.sheenColorFactor
Emission Color+Strength  → emissiveFactor + KHR_materials_emissive_strength
Transmission Weight      → KHR_materials_transmission.transmissionFactor
Subsurface Weight        → NOT EXPORTED — bake to Base Color texture
Anisotropic              → KHR_materials_anisotropy (Blender 5.x)`}</pre>

      <p className="mt-4">
        The key omission is <strong>Subsurface Scattering</strong>: no
        equivalent KHR extension exists. If your prop relies on SSS for
        skin or wax appearance, render a diffuse bake with SSS active and use
        that texture as the Base Color input instead — the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          Texture Baking: Normal + AO
        </Link>{" "}
        tutorial covers this pipeline.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Specular IOR Level vs the old Specular</h2>
      <p>
        PBSDF v1 had a flat "Specular" value that directly scaled highlight
        brightness. v2 replaces it with <strong>Specular IOR Level</strong>,
        which modulates how strongly the IOR value affects off-angle
        reflections. At 0.5 you get standard white reflections; at 0.0 you
        get a cel-shade trick — dark edges — that works even on metallic
        materials. This maps to{" "}
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_specular.specularFactor</code>{" "}
        in the exported GLB, though the mapping is approximate: the
        extension models a dielectric specular independently of IOR,
        while Blender's socket is a combined IOR-modulation term.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">The Coat layer rename</h2>
      <p>
        "Clearcoat" in glTF 2.0 (
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_clearcoat</code>
        ) kept its original name from the PBR specification. Blender renamed
        the UI socket to "Coat" in PBSDF v2 to distinguish it more clearly
        from the base Metallic layer. The exporter maps Coat → clearcoat
        seamlessly; the terminology mismatch is cosmetic only. See how this
        layer looks in isolation in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-automotive-paint-coat-metallic-flake" className={lk}>
          Automotive Paint Coat + Metallic Flake
        </Link>{" "}
        tutorial, which drives Coat Weight from a flake mask texture.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Setting up the material via bpy</h2>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`import bpy

mat = bpy.data.materials.new("hs_pbr_v2_mat")
mat.use_nodes = True
mat.node_tree.nodes.clear()

out  = mat.node_tree.nodes.new("ShaderNodeOutputMaterial")
pb   = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
out.location = (400, 0)

# Base layer
pb.inputs["Base Color"].default_value        = (0.10, 0.14, 0.28, 1.0)
pb.inputs["Metallic"].default_value          = 0.82
pb.inputs["Roughness"].default_value         = 0.26
pb.inputs["IOR"].default_value               = 1.45    # → KHR_materials_ior
pb.inputs["Alpha"].default_value             = 1.0

# Specular (Fresnel) — not a flat multiplier
pb.inputs["Specular IOR Level"].default_value = 0.5    # → KHR_materials_specular

# Coat (was Clearcoat) → KHR_materials_clearcoat
pb.inputs["Coat Weight"].default_value       = 0.65
pb.inputs["Coat Roughness"].default_value    = 0.10

# Sheen → KHR_materials_sheen
pb.inputs["Sheen Weight"].default_value      = 0.18
pb.inputs["Sheen Tint"].default_value        = (0.55, 0.35, 0.92, 1.0)

# Emission → emissiveFactor + KHR_materials_emissive_strength
pb.inputs["Emission Color"].default_value    = (0.25, 0.55, 1.0, 1.0)
pb.inputs["Emission Strength"].default_value = 0.35

mat.node_tree.links.new(pb.outputs["BSDF"], out.inputs["Surface"])`}</pre>

      <h2 className="text-xl font-semibold mt-8 mb-3">Verifying KHR extensions in the GLB</h2>
      <p>
        After running <code className="px-1 bg-zinc-800 rounded">blueprint.py</code>, open the{" "}
        <code className="px-1 bg-zinc-800 rounded">.glb</code> in the{" "}
        <a href="https://github.com/KhronosGroup/glTF-Sample-Viewer" className={lk}
           target="_blank" rel="noopener noreferrer">
          Khronos glTF Sample Viewer
        </a>{" "}
        (MIT) or rename to <code className="px-1 bg-zinc-800 rounded">.gltf</code> (use gltf-pipeline to unpack)
        and search for{" "}
        <code className="px-1 bg-zinc-800 rounded">extensionsUsed</code> — you should see{" "}
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_clearcoat</code>,{" "}
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_sheen</code>,{" "}
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_ior</code>,{" "}
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_emissive_strength</code>, and{" "}
        <code className="px-1 bg-zinc-800 rounded">KHR_materials_specular</code> in that list.
        If any are missing, the corresponding BSDF socket was still at zero when the script ran.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Studio cross-references</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
            EEVEE Toon Cel Shader
          </Link>{" "}
          — the counterpoint workflow: cel-shade ignores most PBR parameters and uses
          Shader to RGB + colour ramp instead.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
            Texture Baking: Normal + AO
          </Link>{" "}
          — bake SSS and other non-exported properties down to texture before GLB export.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-automotive-paint-coat-metallic-flake" className={lk}>
            Automotive Paint: Coat + Metallic Flake
          </Link>{" "}
          — deep dive on the Coat layer with a flake mask texture driving Coat Weight.
        </li>
        <li>
          <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
            Blender to Site Asset Pipeline
          </Link>{" "}
          — full end-to-end GLB → Three.js → WebXR delivery for Holoflow props.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Outside sources</h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          Khronos Group —{" "}
          <a href="https://github.com/KhronosGroup/glTF-Blender-IO"
             className={lk} target="_blank" rel="noopener noreferrer">
            glTF-Blender-IO add-on (Apache-2.0)
          </a>{" "}
          · the exporter that converts PBSDF sockets to KHR extensions ·
          sibling repos:{" "}
          <a href="https://github.com/KhronosGroup/glTF"
             className={lk} target="_blank" rel="noopener noreferrer">
            glTF spec
          </a>{" "}
          &{" "}
          <a href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
             className={lk} target="_blank" rel="noopener noreferrer">
            glTF Sample Viewer
          </a>
        </li>
        <li>
          Khronos Group —{" "}
          <a href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
             className={lk} target="_blank" rel="noopener noreferrer">
            glTF 2.0 specification — Material section (Apache-2.0)
          </a>{" "}
          · defines pbrMetallicRoughness + all KHR_materials_* extension contracts
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/shading/shader-principled-bsdf-v2-gltf-pbr-webxr/",
    time: "one focused session (≈ 35 minutes)",
    difficulty: "intermediate",
    cost: "free — all tools are part of Blender",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Familiar with Blender's Shader Editor and node wiring",
      "Know how to run a Python script in the Scripting workspace",
      "Basic understanding of PBR material concepts (metallic, roughness)",
    ],
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1. Switch to the Scripting workspace. Paste the contents of blueprint.py into a new Text Editor buffer and press Alt+P. The shard mesh is created, the PBSDF v2 material is applied with all sockets set explicitly, and hs_control_shard.glb is written next to the .blend file.",
      },
      {
        title: "Walk the socket map in the Shader Editor",
        body: "Select the shard. Switch to the Shader Editor workspace. Click the Principled BSDF node. Read each socket group from top to bottom: Base → Specular → Coat → Sheen → Emission → Transmission. Compare each label with the export map in the README — cross each off in your head as you confirm it has a glTF destination.",
      },
      {
        title: "Verify KHR extensions in the GLB",
        body: "Use gltf-pipeline (npm: @gltf-transform/cli) to unpack the GLB: `npx gltf-transform optimize hs_control_shard.glb out.gltf`. Open out.gltf in a text editor and search for extensionsUsed. Confirm KHR_materials_clearcoat, KHR_materials_sheen, KHR_materials_ior, KHR_materials_emissive_strength, and KHR_materials_specular are all listed.",
      },
      {
        title: "Understand the Subsurface gap",
        body: "In the Shader Editor, increase Subsurface Weight to 0.4 and watch the render change. Export the GLB again. Open the JSON and search for 'subsurface' — you will find nothing. The extension does not exist. This confirms that any SSS appearance must be baked to a Base Color texture before export if it matters for WebXR delivery.",
      },
      {
        title: "Run record.py for the viewport animation",
        body: "Open record.py in a second Text Editor tab. Press Alt+P. The script adds keyframes to the material's node tree — Roughness sweeps 0.05→0.95 in frames 0→30, Metallic 0→1 in frames 30→60, Coat Weight 0→1→0.65 in frames 60→90, Sheen pulses across the full run. An OpenGL render writes viewport.mp4 to the library videos folder.",
      },
    ],
    troubleshooting: [
      {
        symptom: "KHR_materials_clearcoat missing from extensionsUsed",
        cause: "Coat Weight socket was left at 0.0 (the default) when the GLB was exported.",
        fix: "Confirm blueprint.py set pb.inputs['Coat Weight'].default_value = 0.65 before calling export_glb(). A zero weight tells the exporter the extension is not needed and it omits the block entirely.",
      },
      {
        symptom: "AttributeError: 'ShaderNodeBsdfPrincipled' has no input 'Coat Weight'",
        cause: "Running on Blender 3.x, which uses 'Clearcoat' instead of 'Coat Weight'.",
        fix: "Update to Blender 4.0 or later. PBSDF v2 shipped in 4.0; the socket was renamed as part of that release.",
      },
      {
        symptom: "Emission too bright in the GLB viewer",
        cause: "KHR_materials_emissive_strength multiplies the emissiveFactor, so high Emission Strength values produce HDR brightness that tone-maps differently in WebXR renderers.",
        fix: "Lower Emission Strength to ≤ 1.0 for SDR-safe delivery. If HDR glow is wanted, confirm the WebXR renderer uses KHR_materials_emissive_strength and supports HDR output.",
      },
      {
        symptom: "Sheen colour appears neutral grey in the GLB viewer, not lilac",
        cause: "The viewer does not implement KHR_materials_sheen, or renders only sheenColorFactor without the tint component.",
        fix: "Test in the Khronos glTF Sample Viewer, which implements all KHR_materials_* extensions. Basic three.js scenes before r153 do not support KHR_materials_sheen.",
      },
    ],
  },
  {
    slug: "blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr",
    title:
      "Shader — Principled BSDF v2: Full Parameter Map to glTF 2.0 PBR for WebXR",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "Every Principled BSDF v2 socket mapped to its glTF 2.0 KHR_materials_* extension — know exactly which parameters survive the GLB export before building your WebXR prop's material.",
    tags: [
      "blender",
      "shading",
      "pbr",
      "gltf",
      "webxr",
      "principled-bsdf",
      "glb",
      "khr-materials",
    ],
    Body: PrincipledBsdfV2GltfBody,
  },
);
