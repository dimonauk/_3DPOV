import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function DriverShaderBody() {
  return (
    <>
      <p>
        A Blender driver is a formula that computes the value of one property
        from another. Wire a Custom Property on an Object to the Emission
        Strength socket of its material and you have a single slider that
        controls the entire visual state of the mesh — dormant dark, half-lit,
        full cyan glow. Change the slider, and every connected socket updates
        instantly without touching the node graph. This is the parametric
        authoring technique the studio uses for interactive set-dressing and
        WebXR object states.
      </p>

      <p>
        The driver system has two sharp edges that trip up most beginners. First:{" "}
        <code>tgt.id_type&nbsp;=&nbsp;&apos;OBJECT&apos;</code> must be set
        explicitly on the driver variable&rsquo;s target; omitting it silently
        resolves the custom property path against the wrong datablock (usually
        the Material) and the driver returns&nbsp;0 with no error. Second:
        assigning <code>obj[&quot;energy_level&quot;]&nbsp;=&nbsp;1.0</code>{" "}
        in a script does not immediately propagate through the driver graph.
        You must call{" "}
        <code>bpy.context.view_layer.update()</code> before reading the socket
        value or exporting — otherwise you export the stale default. For
        material-socket drivers it also matters that the expression references
        a <em>variable name</em>, not the property path directly:{" "}
        <code>drv.expression&nbsp;=&nbsp;&quot;energy&nbsp;*&nbsp;4.0&quot;</code>{" "}
        where <code>energy</code> is the variable name, not the path{" "}
        <code>[&quot;energy_level&quot;]</code>.
      </p>

      <p>
        The glTF export boundary is equally important. Custom property
        keyframes live on the Object&rsquo;s action and are not standard glTF
        animation channels; they do not transfer to a GLB automatically. For
        production WebXR you have three routes: (a)&nbsp;export a static
        snapshot of the material at the desired energy state; (b)&nbsp;enable
        the experimental{" "}
        <code>KHR_animation_pointer</code> extension in Blender&nbsp;5.x&rsquo;s
        glTF export panel, which can carry material parameter animations; or
        (c)&nbsp;convert the control to a shape key weight — the approach in
        the{" "}
        <Link href="/tutorials/blender-tutorial-shape-keys-morph-targets" className={lk}>
          shape keys &amp; morph targets tutorial
        </Link>{" "}
        — which exports as a standard glTF morph weight that Three.js handles
        natively. This tutorial focuses on (a), the static snapshot path, while
        explaining all three for completeness.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-animation-drivers-parametric-shader",
  title: "Animation Drivers — Custom Properties Controlling Shader Sockets (Blender 5.1)",
  date: "2026-05-22",
  kind: "tutorial",
  excerpt:
    "Wire a Custom Property on an Object to Emission Strength and Mix Shader Fac via SCRIPTED drivers. One slider drives the full visual state — from dormant crystal to full cyan glow — with expert coverage of id_type pitfalls, depsgraph update timing, and the three glTF export paths for WebXR.",
  Body: DriverShaderBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-eevee-toon-cel-shader",
      label: "EEVEE Next Toon / Cel-Shader Node Group",
      note: "The material node graph pattern that drivers control.",
    },
    {
      href: "/tutorials/blender-tutorial-shape-keys-morph-targets",
      label: "Shape Keys & Morph Targets for VRM",
      note: "glTF-safe alternative: morph weights export as standard channels.",
    },
    {
      href: "/tutorials/blender-tutorial-nla-action-clips-vrm",
      label: "NLA Action Clips for VRM",
      note: "Organise driver-animated keyframes into reusable NLA strips.",
    },
    {
      href: "/tutorials/blender-tutorial-texture-baking-normal-ao",
      label: "Texture Baking — Normal Map + AO",
      note: "Bake a peak-glow snapshot to a texture for PBR-compliant WebXR.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/animation/drivers/",
      label: "Blender Manual — Drivers",
      note: "CC-BY-SA 4.0. Blender Foundation contributors. Full driver type reference.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_animation_pointer",
      label: "KHR_animation_pointer — glTF Extension Spec",
      note: "Apache-2.0. Khronos Group. The extension that carries material parameter animations in GLB.",
    },
    {
      href: "https://threejs.org/docs/#api/en/animation/AnimationMixer",
      label: "Three.js AnimationMixer",
      note: "MIT. mrdoob and contributors. How the studio plays GLB animations in WebXR.",
    },
  ],
};

export const entry = buildInstructable(
  {
    steps: [
      {
        title: "Build the crystal shard mesh",
        body: "An icosphere at subdivisions=0 gives 20 equilateral triangular faces — a natural polyhedron for a crystal:\n\n  bm = bmesh.new()\n  bmesh.ops.create_icosphere(bm, subdivisions=0, radius=0.55)\n  bm.to_mesh(mesh)\n  bm.free()\n\n  for v in mesh.vertices:\n      v.co.z *= 2.2       # stretch tall into a shard silhouette\n  mesh.update()\n  for poly in mesh.polygons:\n      poly.use_smooth = False   # hard facets amplify the glow at edges\n\nFlat shading is deliberate: each facet reads a single normal direction, so the emission gradient appears as a step at every poly boundary — the same principle behind the cel-shader.",
      },
      {
        title: "Create the energy material (Principled + Emission Mix)",
        body: "The node graph: two BSDFs blended by a Mix Shader whose Fac will be driven.\n\n  n_mix  = nodes.new('ShaderNodeMixShader')\n  n_pbr  = nodes.new('ShaderNodeBsdfPrincipled')\n  n_emit = nodes.new('ShaderNodeEmission')\n\n  n_pbr.inputs['Base Color'].default_value  = (0.04, 0.06, 0.12, 1.0)  # dark midnight\n  n_pbr.inputs['Metallic'].default_value    = 0.6\n  n_emit.inputs['Color'].default_value      = (0.20, 0.95, 0.80, 1.0)  # bright cyan\n  n_emit.inputs['Strength'].default_value   = 0.0   # driver overrides this\n\n  links.new(n_pbr.outputs['BSDF'],      n_mix.inputs[1])  # Shader 1\n  links.new(n_emit.outputs['Emission'], n_mix.inputs[2])  # Shader 2\n\nWHY a standalone Emission node rather than Principled.Emission socket:\nThe standalone Emission node exposes inputs['Strength'] as a driveable socket with a clean data_path. Principled BSDF's internal Emission socket is accessible but its path is longer and version-dependent. Separate nodes also make the driver graph readable in the Shader Editor.",
      },
      {
        title: "Add the custom property with UI metadata",
        body: "  obj['energy_level'] = 0.0\n  ui = obj.id_properties_ui('energy_level')\n  ui.update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, default=0.0)\n\nid_properties_ui() returns an IDPropertyUIManager. .update() writes the slider bounds into the RNA layer so the Properties panel renders a draggable slider rather than a plain number field. Without .update(), the field exists but shows as an unformatted float — harder to demo in screen recording.",
      },
      {
        title: "Wire the Emission Strength driver",
        body: "  fc = n_emit.inputs['Strength'].driver_add('default_value')\n  drv = fc.driver\n  drv.type       = 'SCRIPTED'\n  drv.expression = 'energy * 4.0'\n\n  var = drv.variables.new()\n  var.name = 'energy'\n  var.type = 'SINGLE_PROP'\n\n  tgt = var.targets[0]\n  tgt.id_type   = 'OBJECT'              # MANDATORY — sets the ID class\n  tgt.id        = obj\n  tgt.data_path = '[\"energy_level\"]'   # custom property path syntax\n\nWHY SCRIPTED over AVERAGE:\nAVERAGE computes the mean of all variable values — correct for blending two sources, wrong for a formula. SCRIPTED evaluates the expression string; it is the only type that supports coefficient scaling ('energy * 4.0') or clamping ('max(0.0, energy)').\n\nWHY tgt.id_type = 'OBJECT' is non-optional:\nBlender infers the ID class from the driven socket's owner (a Material). Without overriding id_type, the target resolves obj['energy_level'] on the Material datablock — which does not have that property — and silently returns 0.",
      },
      {
        title: "Wire the Mix Shader Fac driver",
        body: "  fc2 = n_mix.inputs['Fac'].driver_add('default_value')\n  drv2 = fc2.driver\n  drv2.type       = 'SCRIPTED'\n  drv2.expression = 'energy'\n\n  var2 = drv2.variables.new()\n  var2.name = 'energy'\n  var2.type = 'SINGLE_PROP'\n  tgt2 = var2.targets[0]\n  tgt2.id_type   = 'OBJECT'\n  tgt2.id        = obj\n  tgt2.data_path = '[\"energy_level\"]'\n\nFac = 0 means 100% Principled BSDF (dormant). Fac = 1 means 100% Emission (full glow). The Emission Strength driver and the Fac driver are independent fcurves — both read the same custom property but can use different expressions, allowing non-linear energy-to-glow curves if desired.",
      },
      {
        title: "Animate energy_level and export",
        body: "Keyframe the custom property directly — the driver reads the animated value each frame:\n\n  for frame, value in [(1, 0.0), (30, 1.0), (60, 0.0)]:\n      obj['energy_level'] = value\n      obj.keyframe_insert(data_path='[\"energy_level\"]', frame=frame)\n\nBefore exporting a static GLB at peak glow:\n\n  bpy.context.scene.frame_set(30)   # peak frame\n  obj['energy_level'] = 1.0\n  bpy.context.view_layer.update()   # propagate driver → socket\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=False,\n      export_normals=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n  )\n\nFor animated GLB delivery: enable KHR_animation_pointer in the export panel (Blender 5.x) and keyframe the socket's default_value directly instead of routing through a driver. For WebXR interactivity, set mesh.material.emissiveIntensity from Three.js in response to user events.",
      },
    ],
    finalResult:
      "A crystal shard mesh with a live parametric shader: dragging the energy_level slider in the Properties panel (or scrubbing the timeline) transitions the object from dark metallic (Principled BSDF only) to full cyan glow (Emission dominant) in real time. The GLB captures the peak-glow static state. The .blend retains the full driver graph for authoring.",
    variations: [
      "Drive a second object from the same property: add a second crystal shard, create the same material, wire the same driver pointing to the first object's energy_level. Both crystals respond to one slider — useful for a linked constellation of energy sources.",
      "Non-linear glow curve: change the Emission Strength expression from 'energy * 4.0' to 'energy ** 2 * 4.0'. The shard stays dark until energy_level exceeds ~0.5, then surges rapidly. Exponential curves read as physically plausible energy accumulation.",
      "glTF-safe animated delivery: skip the driver entirely. Keyframe n_emit.inputs['Strength'].default_value directly at frames 1, 30, 60. Export with KHR_animation_pointer enabled. Three.js r163+ handles KHR_animation_pointer; use AnimationMixer.clipAction('Action').play().",
    ],
    troubleshooting: [
      {
        symptom: "Driver returns 0 at all times — mesh stays dark",
        cause: "tgt.id_type was not set, so the target resolves the path on the Material datablock rather than the Object. The Material has no ['energy_level'] property.",
        fix: "Add tgt.id_type = 'OBJECT' immediately before tgt.id = obj. Confirm by opening the Drivers Editor (switch editor type), selecting the affected F-curve, and checking that the variable target shows the Object name, not the Material name.",
      },
      {
        symptom: "Export GLB looks dormant (dark) even though energy_level is 1.0",
        cause: "The depsgraph has not been updated since the property was set. The exporter reads the stale socket default_value.",
        fix: "Call bpy.context.view_layer.update() immediately after setting obj['energy_level'] = 1.0 and before calling bpy.ops.export_scene.gltf. Also ensure bpy.context.scene.frame_set() is called to the desired frame first.",
      },
      {
        symptom: "TypeError: 'NoneType' has no attribute 'driver_add'",
        cause: "The node socket lookup failed — inputs['Strength'] returned None because the node type or socket name differs in the current Blender version.",
        fix: "Print node.inputs.keys() to see available socket names. In Blender 5.1 the Emission shader has inputs ['Color', 'Strength', 'Weight']. Use the index form inputs[1] for Strength if the string key is unreliable across locales.",
      },
      {
        symptom: "Custom property animation plays in Blender but GLB has no animation",
        cause: "Custom property keyframes are not standard glTF animation channels. They are not exported by default.",
        fix: "For production delivery, either: (a) export a static snapshot at the desired state; (b) enable KHR_animation_pointer in the Blender 5.x glTF export UI; or (c) convert the control to a shape key weight, which exports as a glTF morph target. See the shape keys tutorial for option (c).",
      },
    ],
  },
  base,
);
