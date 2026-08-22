import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender's <code>DisplaceModifier</code> reads a Texture data block at
        each vertex and moves that vertex by{" "}
        <code>(texture_value - mid_level) × strength</code> along a chosen
        direction. The Texture data block — <code>bpy.data.textures.new()</code>{" "}
        — is the legacy procedural system predating shader nodes; it still
        runs in Blender 5.1 and is the only thing <code>DisplaceModifier</code>{" "}
        accepts. This is entirely separate from material node trees.
      </p>
      <p>
        The practical payoff: a 4 × 4 m terrain tile baked to 1089 vertices of
        smooth height-field geometry, ready for Draco-compressed GLB export and
        Three.js / WebXR. The modifier evaluates at depsgraph time, so the
        blueprint never writes a temporary baked image — it is all in-memory
        geometry.
      </p>

      <h2>The one law you cannot break</h2>
      <p>
        <strong>SubSurf must precede Displace in the stack.</strong>{" "}
        <code>DisplaceModifier</code> reads the vertex list it receives at
        modifier-entry time. A 2 × 2 plane with no subdivision has only 9
        vertices; the Clouds noise at scale 0.8 cannot resolve into meaningful
        terrain on 9 sample points. You get a tent, not a landscape. Subdivision
        Surface at level 5 gives 1089 vertices on the same 4 × 4 m footprint —
        enough spatial frequency to capture all the noise octaves.
      </p>
      <pre>{`# Modifier stack — order is non-negotiable
ss   = obj.modifiers.new("SubSurf",          'SUBSURF')
sba  = obj.modifiers.new("Smooth by Angle",  'SMOOTH_BY_ANGLE')
disp = obj.modifiers.new("Displace",         'DISPLACE')

# Blender evaluates modifiers top-to-bottom in the stack.
# SubSurf subdivides → SBA smooths the cage → Displace deforms per-vertex.
# Swapping SubSurf and Displace produces 9 jagged pillars.`}</pre>

      <h2>Creating a Texture data block</h2>
      <p>
        <code>bpy.data.textures.new(name, type)</code> returns a{" "}
        <code>bpy.types.Texture</code> subtype. The type string selects the
        procedural mode: <code>'CLOUDS'</code> is fractal Brownian motion,{" "}
        <code>'MARBLE'</code> is stripe-based, <code>'MUSGRAVE'</code> is
        multi-fractal. For height fields, Clouds is the right choice: it
        produces values in [0, 1] with smooth gradients and no directional bias.
      </p>
      <pre>{`tex = bpy.data.textures.new("HF_Noise", 'CLOUDS')

tex.noise_scale  = 0.8     # lower = larger features across the tile
tex.noise_depth  = 6       # octave count — more depth = finer detail
tex.noise_basis  = 'BLENDER_ORIGINAL'   # Perlin-type, continuous
tex.noise_type   = 'SOFT_NOISE'         # HARD_NOISE gives sharper ridges

# Wire it to the modifier
disp.texture = tex`}</pre>

      <h2>texture_coords — world-space vs object-space</h2>
      <p>
        This property controls which coordinate space the texture samples in.
        The choice has a direct effect on how the terrain tiles:
      </p>
      <ul>
        <li>
          <code>'GLOBAL'</code> — evaluates in world-space. Terrain tiles
          seamlessly regardless of how the object is positioned or scaled.
          Correct for terrain that must tile across a larger scene.
        </li>
        <li>
          <code>'LOCAL'</code> — evaluates in local object space. If the object
          is scaled non-uniformly, the noise stretches with it.
        </li>
        <li>
          <code>'OBJECT'</code> — uses a separate control object's transform to
          orient the texture. Useful for oriented decals or directed displacement.
        </li>
        <li>
          <code>'UV'</code> — samples from the mesh's active UV layer. Requires
          UVs, but gives full artistic control over feature placement.
        </li>
      </ul>
      <pre>{`# Global is correct for tileable terrain
disp.texture_coords = 'GLOBAL'
disp.direction      = 'Z'      # move vertices along world +Z
disp.strength       = 0.6      # metres of peak excursion from mid_level
disp.mid_level      = 0.0      # zero-crossing: 0.0 = all positive (no pits)`}</pre>

      <h2>mid_level — controlling the zero-crossing</h2>
      <p>
        At <code>mid_level=0.5</code> (the default), a texture value of 0.5
        produces zero displacement; values above push outward, below pull
        inward. For terrain on a flat plane you usually want{" "}
        <code>mid_level=0.0</code>: every point lifts by{" "}
        <code>value × strength</code>, so the base stays flat and all features
        are hills.
      </p>
      <pre>{`# Default (mid_level=0.5): terrain has equal hills and valleys
disp.mid_level = 0.5   # Clouds range [0,1] → displacement [-0.3, +0.3] m

# Terrain-mode (mid_level=0.0): all features are positive
disp.mid_level = 0.0   # Clouds range [0,1] → displacement [0, +0.6] m
#  → base plane is the absolute floor; no pits below it`}</pre>

      <h2>Baking via depsgraph (headless-safe)</h2>
      <p>
        <code>bpy.ops.object.modifier_apply()</code> requires a VIEW_3D context
        in many Blender builds and is fragile in headless scripts. The safe
        pattern is to evaluate the depsgraph and create a new mesh from the
        evaluated object. The result is a static mesh with the modifier stack
        already collapsed — no operators required.
      </p>
      <pre>{`scene     = bpy.context.scene
depsgraph = bpy.context.evaluated_depsgraph_get()
obj_eval  = obj.evaluated_get(depsgraph)

# new_from_object() bakes the full evaluated state (modifiers + shapekeys)
# into a new Mesh data block.  The original object and modifiers are untouched.
baked_mesh = bpy.data.meshes.new_from_object(obj_eval, depsgraph=depsgraph)

# Swap the data block on the object and clear the modifier list
old_mesh      = obj.data
obj.data      = baked_mesh
obj.modifiers.clear()
bpy.data.meshes.remove(old_mesh)

# Normalise Z so the lowest vertex sits at Z=0 (clean WebXR floor)
zmin = min(v.co.z for v in baked_mesh.vertices)
for v in baked_mesh.vertices:
    v.co.z -= zmin
baked_mesh.update()`}</pre>

      <h2>GLB export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath      = bpy.path.abspath("//hf_displace_terrain.glb"),
    use_selection = True,
    export_format = 'GLB',
    export_apply  = True,
    export_normals = True,
    export_yup    = True,                              # +Y up for Three.js
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
)`}</pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Flat mesh after running script</strong> — SubSurf level
          might be 0, or the Displace strength is 0. Check{" "}
          <code>ss.levels</code> and <code>disp.strength</code>.
        </li>
        <li>
          <strong>Noise repeats visibly at tile edge</strong> — increase{" "}
          <code>tex.noise_scale</code> or switch{" "}
          <code>disp.texture_coords</code> to <code>'GLOBAL'</code>.
        </li>
        <li>
          <strong>9 sharp spikes instead of terrain</strong> — SubSurf is
          below Displace in the modifier stack. Stack order matters; SubSurf
          must be first.
        </li>
        <li>
          <strong>bpy.data.textures raises AttributeError</strong> — this
          can happen if the file was created in Blender 4.0 Cycles-only mode.
          Textures are still present in 5.1; check the Blender build isn't a
          stripped experimental build.
        </li>
        <li>
          <strong>GLB has no geometry</strong> —{" "}
          <code>use_selection=True</code> with nothing selected. Call{" "}
          <code>obj.select_set(True)</code> and set{" "}
          <code>bpy.context.view_layer.objects.active = obj</code> before
          export.
        </li>
      </ul>

      <h3>Studio cross-references</h3>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
          >
            SubsurfModifier — crease-controlled SubD for WebXR
          </Link>{" "}
          — the SubD tutorial for the modifier that must precede Displace.
          Covers <code>crease_edge</code> and viewport/render level split.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
          >
            SMOOTH_BY_ANGLE — auto-smooth migration & normal stacking
          </Link>{" "}
          — the SBA modifier that sits between SubSurf and Displace in the
          correct stack; explains the keep_sharp_edges interaction.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
          >
            Edge sharp / crease / seam — Mesh Attribute API
          </Link>{" "}
          — setting <code>sharp_edge</code> and <code>crease_edge</code>{" "}
          attributes that feed into both SBA and SubSurf sitting above Displace.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-mathutils-noise-terrain-heightfield-webxr"
          >
            mathutils.noise — raw vertex displacement terrain
          </Link>{" "}
          — the alternative approach: writing vertex Z positions directly from
          Python noise. Compare modifier-driven vs. Python-driven techniques.
        </li>
      </ul>

      <h3>External sources</h3>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.DisplaceModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.DisplaceModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — typed property reference for{" "}
          <code>texture</code>, <code>texture_coords</code>,{" "}
          <code>direction</code>, <code>strength</code>, and{" "}
          <code>mid_level</code>. Related projects: Blender Python API Working
          Group (developer.blender.org), bf-extensions repository on
          projects.blender.org.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/displace.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Displace Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — user-facing reference
          including texture coordinate diagrams and per-property explanations.
          Related sibling pages: Warp Modifier, Cast Modifier, Wave Modifier —
          all deform-type modifiers in the same Blender manual section.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0) — the bundled Blender exporter; handles{" "}
          <code>export_apply</code> evaluated-mesh baking and Draco compression.
          Related: KhronosGroup/glTF specification, KhronosGroup/glTF-Sample-Assets.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr",
  title:
    "Python DisplaceModifier + bpy.data.textures — Procedural Height-Field Terrain & GLB Export (Blender 5.1)",
  summary:
    "Blender's DisplaceModifier reads a legacy Texture data block (bpy.data.textures, not shader nodes) and deforms each vertex by (value - mid_level) × strength. This tutorial covers creating a Clouds texture, setting the correct SubSurf → SBA → Displace stack order, texture_coords modes (GLOBAL vs LOCAL vs UV), mid_level zero-crossing control, and headless baking via evaluated_get() + new_from_object() for a clean GLB export.",
  tags: [
    "blender",
    "python",
    "scripting",
    "displace-modifier",
    "texture",
    "terrain",
    "height-field",
    "modifier",
    "subsurf",
    "procedural",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-displace-modifier-texture-height-terrain-glb-webxr",
});
