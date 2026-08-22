import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ModifierDataTransferSmoothNormalsBody() {
  return (
    <>
      <p>
        Every low-polygon mesh in a WebXR scene faces the same trade-off: keep
        the polygon count low enough for real-time rendering, yet avoid the
        flat-shaded faceting that makes objects look like origami. The standard
        answer is a normal map — bake the smooth high-poly normals into a
        texture, sample it at render time. That works, but it carries a cost:
        you need a UV unwrap, a texture atlas, a sampler per fragment, and a
        separate file sitting in the asset bundle. For instanced geometry — the
        same gem GLB used fifty times in a scene — every instance pays the same
        texture cost even though their normals are identical.
      </p>

      <p>
        The Data Transfer modifier solves this differently. It copies the
        evaluated normals from any source object directly into the{" "}
        <em>custom split normal</em> attribute of the destination mesh: a
        per-face-corner <code>float3</code> stored in the mesh itself, not a
        texture. The GLB exporter writes these as explicit vertex normals, which
        a WebXR renderer reads from the vertex buffer at zero per-fragment cost.
        For a sixteen-face gem referencing a thirty-two-segment sphere, the
        normals add roughly 192 bytes to the vertex buffer — smaller than a
        single 16×16 normal-map mip.
      </p>

      <p>
        The scene is an eight-sided bicone diamond (sixteen triangles, two
        apex vertices). A smooth UV sphere at the same origin acts as the normal
        source. After transfer the gem&rsquo;s interior shades as if carved from
        a perfect sphere — continuous, radial, no banding — while its polygon
        silhouette edges stay crisp because the{" "}
        <em>geometry</em> is still flat. Compare the manual workflow in the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-custom-split-normals"
          className={lk}
        >
          Faceted Custom Split Normals tutorial
        </Link>
        , which sets per-loop normals by hand, and the texture-based pipeline
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          Normal + AO Baking tutorial
        </Link>
        .
      </p>

      <p>
        The <code>loop_mapping = 'POLYINTERP_LNORPROJ'</code> setting is the
        quality key. It projects each destination face-corner normal (the flat
        gem&rsquo;s outward-pointing triangle normal) as a ray toward the sphere
        surface, finds the hit polygon, then interpolates that polygon&rsquo;s
        four loop normals using barycentric weights. The alternative,{" "}
        <code>NEAREST_POLYNOR</code>, snaps to the nearest source polygon without
        interpolation — fast, but visibly faceted because an entire band of gem
        corners maps to one sphere face. Use{" "}
        <code>POLYINTERP_LNORPROJ</code> whenever the source has sharp geometry
        that you do <em>not</em> want reflected in the destination normals.
      </p>

      <p>
        One precondition catches people out: the destination&rsquo;s faces must
        be set to <strong>Smooth</strong> shading. When a face is flat-shaded,
        Blender discards custom split normals at draw time and recomputes from
        the face geometry. The gem&rsquo;s physical edges remain hard — the
        polygons are genuinely flat — but the shading flag must be smooth so the
        transferred normals reach the renderer. See the retopology workflow in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-retopology-polybuild-shrinkwrap"
          className={lk}
        >
          Poly Build + Shrinkwrap tutorial
        </Link>{" "}
        for the full pipeline that produces the kind of low-poly mesh this
        modifier then refines.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-data-transfer-smooth-normals",
  title:
    "Modifier — Data Transfer: Custom Split Normals, High-Poly → Low-Poly for WebXR (Blender 5.1)",
  date: "2026-06-20",
  kind: "tutorial",
  excerpt:
    "Transfer smooth normals from a UV sphere directly into the custom split normal attribute of a 16-face gem — no UV unwrap, no texture. The geometry stays flat (crisp silhouette edges) while the interior shades as if carved from a sphere. loop_mapping POLYINTERP_LNORPROJ projects each gem face-corner normal as a ray, finds the source hit polygon, and interpolates its loop normals with barycentric weights. GLB export with export_apply=True bakes the normals into per-corner vertex data. CC0 blueprint.py + record.py.",
  Body: ModifierDataTransferSmoothNormalsBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "intermediate",
    libraryPath:
      "blends/modifiers/modifier-data-transfer-smooth-normals",
    prerequisites: [
      "Comfortable with the Modifier Properties panel — adding, ordering, toggling modifiers.",
      "Understanding of face normals and smooth vs flat shading (right-click → Shade Smooth / Shade Flat).",
      "Blender 5.1 installed. Custom split normals and the Data Transfer modifier are available from Blender 2.74; the POLYINTERP_LNORPROJ loop mapping mode requires Blender 2.76+.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "In Blender 4.1 the use_auto_smooth property was removed. Custom split normals are now stored as a per-corner attribute and are always respected when face.use_smooth is True. The DataTransferModifier.data_types_loops API is unchanged since 2.80.",
      },
    ],
    steps: [
      {
        title: "Build the low-poly gem with bmesh",
        body:
          "The gem is a bicone: N equatorial vertices, one crown apex, one culet apex.\n\n  import bmesh, math\n  N = 8\n  R = 0.22\n  bm = bmesh.new()\n  offset = math.pi / N   # rotate so a flat face points toward -Y\n  eq = [\n      bm.verts.new((\n          R * math.cos(2*math.pi*i/N + offset),\n          R * math.sin(2*math.pi*i/N + offset),\n          0.0,\n      ))\n      for i in range(N)\n  ]\n  crown = bm.verts.new((0.0, 0.0,  0.10))\n  culet = bm.verts.new((0.0, 0.0, -0.18))\n\n  for i in range(N):\n      bm.faces.new([eq[i], eq[(i+1)%N], crown])         # crown faces\n  for i in range(N):\n      bm.faces.new([eq[(i+1)%N], eq[i], culet])         # pavilion faces\n\n  bm.normal_update()\n  bm.to_mesh(mesh)\n  bm.free()\n\nLeave use_smooth = False on all faces — the gem starts flat-shaded. This is the visual baseline: every triangle shows its raw face normal.",
      },
      {
        title: "Build the smooth UV sphere reference",
        body:
          "Build the sphere with bmesh to avoid UI context dependency:\n\n  # top pole + rings + bottom pole\n  verts = [bm.verts.new((0, 0, R))]\n  for r in range(1, RG):\n      phi = math.pi * r / RG\n      rz, rr = R*math.cos(phi), R*math.sin(phi)\n      for s in range(S):\n          theta = 2*math.pi*s/S\n          verts.append(bm.verts.new((\n              rr*math.cos(theta), rr*math.sin(theta), rz)))\n  verts.append(bm.verts.new((0, 0, -R)))\n\nSmooth-shade the sphere BEFORE linking to the scene:\n\n  for face in sphere_mesh.polygons:\n      face.use_smooth = True\n  sphere_mesh.update()\n\nWhy smooth shading on the source matters: Data Transfer reads the EVALUATED normal of each source face corner. A flat-shaded source evaluates to face normals, producing a faceted transfer. A smooth source evaluates to the vertex-weighted normals, which for a sphere point radially outward at every corner — exactly what we want.",
      },
      {
        title: "Add the Data Transfer modifier",
        body:
          "Add the modifier to the gem (destination), not the sphere:\n\n  mod = gem_obj.modifiers.new('DataTransfer', 'DATA_TRANSFER')\n  mod.object           = sphere_obj\n  mod.use_loop_data    = True\n  mod.data_types_loops = {'CUSTOM_NORMAL'}\n  mod.loop_mapping     = 'POLYINTERP_LNORPROJ'\n  mod.mix_mode         = 'REPLACE'\n  mod.mix_factor       = 1.0\n  mod.use_max_distance = False\n\ndata_types_loops is a set — you can add 'VCOL', 'UV', 'SEAM' in the same modifier. Restrict to {'CUSTOM_NORMAL'} here to avoid copying UVs from the sphere (which has a standard spherical projection) onto the gem.\n\nuse_max_distance = False: the sphere sits at the same origin as the gem, so the closest-point search always succeeds. If the source were a separate asset placed elsewhere in the scene, set max_distance to a sensible metre value — otherwise rays from the destination that miss the source domain produce undefined (zero) normals.",
      },
      {
        title: "Enable smooth shading on the destination",
        body:
          "Custom split normals are ignored on flat-shaded faces. Set smooth on all gem polygons:\n\n  for face in gem_obj.data.polygons:\n      face.use_smooth = True\n  gem_obj.data.update()\n\nThis does NOT change the geometry — the triangles remain exactly flat. It changes only the shading evaluation path: Blender reads face.use_smooth at render/viewport-draw time to decide whether to use per-corner custom normals or the face geometric normal.\n\nIn the viewport you should immediately see the gem shading change from faceted to smooth. Toggle the modifier eye icon on/off to compare: with modifier OFF the gem is still smooth-shaded but using interpolated vertex normals (which produces minor banding on a bicone); with modifier ON the normals follow the sphere exactly.",
      },
      {
        title: "Verify the transfer in Material Preview",
        body:
          "Press Z → Material Preview (or the sphere icon in the top-right of the 3D Viewport). The gem material uses Principled BSDF with Transmission 0.95 and Roughness 0.04, so reflections make normal quality obvious.\n\nLook for:\n  - Crown faces: smooth radial highlight transitioning from face to face — no stepping\n  - Pavilion faces: continuous specular reflection across the culet\n  - Silhouette: the 8-sided polygon outline is crisp and unchanged\n\nIf you see flat facets despite the modifier being active:\n  1. Confirm face.use_smooth is True on the gem (Mesh → Normals → Enable Custom Split Normals may need toggling)\n  2. Check that mod.object is the sphere object (not None)\n  3. Ensure the sphere is not hidden from the depsgraph (hide_viewport does not affect evaluated mesh; hide_render does)\n\nSee also the custom split normals theory in the\nblender-tutorial-faceted-custom-split-normals entry for the manual attribution equivalent.",
      },
      {
        title: "Export GLB with export_apply=True",
        body:
          "Keep the modifier stack intact in the .blend for future editing. The GLB exporter applies modifiers at export time:\n\n  bpy.ops.export_scene.gltf(\n      filepath='//data_transfer_gem.glb',\n      export_format='GLB',\n      export_apply=True,          # applies Data Transfer at export\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_yup=True,\n      use_selection=False,\n      export_cameras=False,\n      export_lights=False,\n  )\n\nexport_apply=True runs the full modifier evaluation on a temporary copy of the mesh, then serialises the result. The exported GLB has the 16 gem triangles with per-corner normals from the sphere baked in — the modifier no longer exists in the GLB, only its effect.\n\nDraco level 6 compresses the position and normal buffers. On a 16-face mesh this produces a very small file (< 2 KB body), but the pattern scales to higher-poly transfer targets (retopologised characters, terrain patches).\n\nFor the Holoflow Cycles lightmap pipeline, compare with the UV2 bake approach in the cycles-lightmap-bake-webxr-uv2 tutorial — normal transfer and lightmap baking solve different problems and can be used together on the same GLB asset.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Gem still looks flat-shaded after the modifier is added",
        cause:
          "gem.data.polygons[i].use_smooth is False — flat-shaded faces override custom split normals with the face geometric normal.",
        fix:
          "Select the gem in Object Mode, right-click → Shade Smooth. In Python: for face in obj.data.polygons: face.use_smooth = True; obj.data.update().",
      },
      {
        symptom: "Normals look banded or faceted even with modifier on",
        cause:
          "mod.loop_mapping is set to 'NEAREST_POLYNOR' — snaps to the closest source polygon rather than interpolating across it.",
        fix:
          "Change to mod.loop_mapping = 'POLYINTERP_LNORPROJ'. Recheck in viewport by toggling the modifier. If the source (sphere) is also flat-shaded, enable smooth shading on it first.",
      },
      {
        symptom: "Modifier produces no visible effect — normals unchanged",
        cause:
          "mod.object is None, or the sphere is excluded from the view layer (not the same as hidden from viewport).",
        fix:
          "Confirm mod.object == sphere_obj in the modifier panel. Check Outliner → View Layer — the sphere must not have the V-icon (view layer exclusion) activated.",
      },
      {
        symptom: "GLB in WebXR viewer shows faceted normals despite smooth .blend",
        cause:
          "export_apply=False was used, or the modifier was disabled (show_render=False) before export.",
        fix:
          "Pass export_apply=True. Ensure mod.show_render = True (the camera icon in the modifier header). Re-export.",
      },
      {
        symptom: "Script error: 'Context is incorrect' on bpy.ops.export_scene.gltf",
        cause:
          "Running from a headless --background session without a window manager may miss the required context.",
        fix:
          "Wrap with: with bpy.context.temp_override(area=bpy.context.screen.areas[0]): bpy.ops.export_scene.gltf(...). Or call from inside Blender's Script Editor where context is always present.",
      },
    ],
  },
  base,
);
