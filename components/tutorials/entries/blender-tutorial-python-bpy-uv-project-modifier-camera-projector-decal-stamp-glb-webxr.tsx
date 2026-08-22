import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s <code>UVProjectModifier</code> stamps UV coordinates onto
        a mesh by projecting each vertex through one or more camera or light
        frustums. It never touches pixel data — it writes{" "}
        <code>(u,&nbsp;v)</code> pairs into a named UV layer. A UV Map node in
        the material then reads that layer to drive a texture, giving you a
        badge, faction insignia, or sensor label on any surface without a
        single minute spent in the UV Editor.
      </p>

      <h2>What UVProject actually does (and does not do)</h2>
      <p>
        Common misconception: the modifier &quot;applies a texture&quot; or
        &quot;bakes a decal&quot;. It does neither. It computes, for every mesh
        vertex, where that vertex would land on the projector&apos;s image plane
        and writes those normalised image coordinates as UV data. The material
        is responsible for sampling those coordinates. This separation means you
        can re-use the same modifier with any image by simply swapping the
        texture in the material without touching the modifier at all.
      </p>
      <p>
        In Blender 4.0 the <code>use_image_override</code> and{" "}
        <code>image</code> properties that existed in 3.x were removed — the
        modifier is now a pure UV-coordinate generator. Any image is assigned
        via the node tree only.
      </p>

      <h2>UV layer ownership</h2>
      <p>
        The modifier property <code>uv_layer</code> names the UV layer it
        writes into. If that layer does not exist when the modifier evaluates,
        Blender creates it. Two UV layers can coexist: a hand-unwrapped layer
        for lightmap baking and a <code>projected</code> layer for the decal.
        The material uses separate UV Map nodes, each pinned to its own layer
        name, so both channels drive different textures simultaneously.
      </p>
      <pre>{`mod.uv_layer = "projected"   # writes here
# In the node tree:
uv_n.uv_map = "projected"   # UV Map node reads the same name`}</pre>
      <p>
        This naming contract is the only coupling between the modifier and the
        material. Rename the layer in one place and the other breaks silently —
        always rename both together.
      </p>

      <h2>Projector types: Orthographic vs Perspective</h2>
      <p>
        The projector object can be any Camera or Lamp. When it is a Camera:
      </p>
      <ul>
        <li>
          <strong>Orthographic</strong> — parallel rays; every part of the badge
          receives the same scale regardless of distance from the lens centre.
          Use for flat logos, faction marks, serial numbers — anything where
          uniform scale matters more than perspective realism.
        </li>
        <li>
          <strong>Perspective</strong> — converging rays; the projection
          compresses towards the horizon. Use for theatrical shadows, graffiti
          &quot;painted onto a wall as seen from a specific viewpoint&quot;, or
          any effect that should look like it was projected by a real-world
          lamp with a gobo.
        </li>
      </ul>
      <p>
        The blueprint uses Orthographic because the shield prop has a fixed
        camera angle in the WebXR scene and the badge must read cleanly at
        all render scales.
      </p>

      <h2>Aspect ratio and scale: the two independent controls</h2>
      <p>
        Two pairs of parameters control the decal footprint and shape, and
        they multiply together:
      </p>
      <ul>
        <li>
          <code>ortho_scale</code> on the camera data sets the physical frustum
          width in metres. This is the outer container.
        </li>
        <li>
          <code>mod.scale_x / mod.scale_y</code> set the fraction of that
          frustum the image fills. <code>scale_x = 0.65</code> means the image
          fills 65&nbsp;% of the frustum width.
        </li>
      </ul>
      <p>
        Effective decal width = <code>ortho_scale × scale_x</code>. In the
        blueprint: <code>1.8 × 0.65 = 1.17 m</code> — slightly larger than the
        shield&apos;s inner face radius so the badge bleeds past the boss ring
        before being clipped by the shield geometry.
      </p>
      <p>
        <code>aspect_x / aspect_y</code> are separate from scale. They correct
        for non-square images: a 512 × 256 image needs{" "}
        <code>aspect_x = 2.0, aspect_y = 1.0</code> or the horizontal and
        vertical scales will be identical while the image itself is twice as
        wide — producing a squashed result. Always match aspect to the image
        pixel ratio. Square images need <code>1.0 / 1.0</code>.
      </p>

      <h2>Multiple projectors: wrap-around logos on cylinders</h2>
      <p>
        Set <code>projector_count = N</code> (up to 10) and assign an object
        to each <code>projectors[i].object</code>. The blending rule: the
        projector whose direction is most aligned with the surface normal at a
        given vertex contributes more UV weight. On a cylinder with two
        projectors facing front and back, the front hemisphere receives clean
        front-projector UV and the back hemisphere receives clean
        back-projector UV, with a smooth transition at the 90° edges.
      </p>
      <pre>{`mod.projector_count = 2
mod.projectors[0].object = cam_front
mod.projectors[1].object = cam_back`}</pre>
      <p>
        This is the correct way to stamp a continuous logo around a cylindrical
        prop without a hard UV seam — where a hand-unwrap would need a seam
        aligned with an intentionally hidden edge.
      </p>

      <h2>The apply-before-export rule</h2>
      <p>
        The glTF 2.0 spec stores UV as a static float array per mesh —{" "}
        <code>TEXCOORD_0</code>, <code>TEXCOORD_1</code>, and so on. Blender&apos;s
        own exporter evaluates the depsgraph, so the projected UV does flow
        through correctly. However, many downstream consumers — Unity glTF
        importers, three.js loaders, Khronos Viewer — read from the mesh
        data directly and will not re-evaluate the modifier stack at load time.
      </p>
      <p>
        Safe pattern: duplicate the object, apply the modifier on the duplicate,
        export only the duplicate, then delete it. The original retains the live
        modifier for further iteration.
      </p>
      <pre>{`bpy.ops.object.duplicate(linked=False)
export_obj = bpy.context.active_object

with bpy.context.temp_override(
    object=export_obj, active_object=export_obj
):
    bpy.ops.object.modifier_apply(modifier="UVProject")

bpy.ops.export_scene.gltf(
    filepath=...,
    export_texcoords=True,   # mandatory — writes UV arrays to the GLB
    ...
)`}</pre>
      <p>
        <code>export_texcoords=True</code> is mandatory. Omitting it or setting
        it to <code>False</code> strips all UV data from the export — the GLB
        arrives with no texture coordinates regardless of what the modifier
        wrote.
      </p>

      <h2>Drawing the decal image in Python</h2>
      <p>
        The blueprint draws a diamond clan insignia directly in Python using{" "}
        <code>Image.pixels.foreach_set()</code> — no external PNG required.
        The pixel buffer is a flat RGBA list, row-major, bottom-to-top (OpenGL
        convention). The diamond mask uses the L1 norm:
      </p>
      <pre>{`# |nx| + |ny| < threshold defines a rotated square (diamond)
diamond = abs(nx) + abs(ny)   # nx, ny normalised -1..1
inside  = diamond < 0.62`}</pre>
      <p>
        After filling the list, <code>img.pack()</code> embeds the pixel data
        in the .blend file so it survives a save-reopen without an external
        path. The glTF exporter then packs it into the GLB as a WebP texture
        via <code>export_image_format=&apos;WEBP&apos;</code>.
      </p>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr"
            className={lk}
          >
            ShrinkwrapModifier — PROJECT mode surface conform
          </Link>{" "}
          — a complementary approach: instead of projecting UV coordinates,
          Shrinkwrap offsets geometry to follow a surface. Stack UVProject
          (stamp the decal UV) then Shrinkwrap (conform a decal plane mesh to
          the underlying surface) for a fully 3D embossed badge.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
            className={lk}
          >
            BooleanModifier + WeldModifier — compound-body prop construction
          </Link>{" "}
          — the hard-surface prop pipeline that produces props ready for UV
          projection; Boolean cuts the silhouette, UVProject stamps markings.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
            className={lk}
          >
            BevelModifier — edge-weight chamfer & hard-surface panel
          </Link>{" "}
          — run BevelModifier before UVProject in the stack; chamfered edges
          reflect the projection differently from flat faces, which gives
          the badge a physically correct edge falloff in lighting.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr"
            className={lk}
          >
            bpy.types.MeshUVLoop — UV layer authoring & multi-object atlas
          </Link>{" "}
          — understand how UV layers are structured in the Blender data model
          before mixing hand-unwrapped and projected layers on the same mesh.
        </li>
        <li>
          <Link href="/docs/INSTALL-SCAN-BLENDER" className={lk}>
            Holoflow WebXR Exporter — install & scan docs
          </Link>{" "}
          — the studio add-on that wraps the GLB pipeline used in{" "}
          <code>blueprint.py</code>; its <code>holoflow:facet</code> per-object
          flag and the Draco level-6 setting are both respected in this
          tutorial&apos;s export call.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender 5.1 Manual — UV Project Modifier</strong> (CC-BY-SA
          4.0, Blender Foundation){" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/uv/uv_project.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.UVProjectModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.UVProjectModifier API
          </a>
          . Related:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>
          ,{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          <strong>glTF 2.0 Specification — Texture Coordinates</strong>{" "}
          (CC-BY 4.0, The Khronos Group){" "}
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#reference-mesh-primitive"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            registry.khronos.org/glTF
          </a>
          . The spec defines{" "}
          <code>TEXCOORD_0</code> / <code>TEXCOORD_1</code> as the canonical
          UV accessor names that all compliant loaders must read — the direct
          reason that <code>export_texcoords=True</code> is non-optional.
          Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/KhronosGroup/glTF
          </a>
          ,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-uv-project-modifier-camera-projector-decal-stamp-glb-webxr",
  title:
    "Python bpy.types.UVProjectModifier — Orthographic Camera Decal Stamp, Aspect-Ratio Correction & Static UV Bake for WebXR (Blender 5.1)",
  description:
    "Project a Python-drawn clan insignia onto a faceted shield via an orthographic camera frustum — no manual UV unwrapping — then apply the modifier to freeze static UV data before Draco-compressed GLB export.",
  date: "2026-07-18",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "modifier",
    "uv-project",
    "uv-mapping",
    "decal",
    "camera",
    "hard-surface",
    "webxr",
    "glb",
    "glTF",
  ],
  libraryPath:
    "blends/scripting/python-bpy-uv-project-modifier-camera-projector-decal-stamp-glb-webxr",
  Body,
  keyInsights: [
    "UVProjectModifier writes UV coordinates only — it never samples or modifies pixel data; images are assigned via the material node tree",
    "uv_layer names the target UV layer; the UV Map node in the material must use the identical string or the decal renders on a default layer silently",
    "aspect_x / aspect_y correct for non-square images — a 512×256 image needs aspect_x=2; mismatching squashes the decal horizontally",
    "Effective decal footprint = ortho_scale × scale_x; these two parameters are independent and multiply",
    "Multiple projectors blend by surface-normal facing angle, enabling seamless logo wrap on cylinders without a UV seam",
    "use_image_override and image were removed in Blender 4.0 — image assignment via the modifier no longer exists in 5.1",
    "Apply the modifier on an export duplicate before GLB export; export_texcoords=True is mandatory or UV arrays are stripped from the file",
  ],
});
