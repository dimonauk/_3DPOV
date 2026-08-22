import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SculptLayerBrushStencilBody() {
  return (
    <>
      <p>
        The Draw brush accumulates: stroke over the same patch twice and the
        clay piles higher. That is fine for organic volumes, but ruinous for a
        repeating weave pattern where every thread must sit at the same depth
        across the whole garment. The{" "}
        <strong>Layer brush</strong> solves this with a single property,{" "}
        <code>brush.height</code> — a hard floor. The first pass raises the
        surface to that ceiling; every subsequent pass finds the floor already
        met and contributes nothing more. Combined with a{" "}
        <strong>Stencil texture</strong> that projects a 2-D weave mask onto the
        surface, you get a technically consistent fabric impression at exact depth
        in a single painting session.
      </p>
      <p className="mt-3">
        This pipeline feeds directly into the{" "}
        <Link href="/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb" className={lk}>
          Multires normal bake tutorial
        </Link>{" "}
        (the bake path and <code>multires_reshape</code> operator used here), the{" "}
        <Link href="/tutorials/blender-tutorial-sculpt-face-sets-zone-masking-vrm-retopo" className={lk}>
          Face Sets zone masking tutorial
        </Link>{" "}
        (auto-masking that confines the weave pass to clothing regions without
        a selection), and the{" "}
        <Link href="/tutorials/blender-tutorial-shader-principled-sheen-coat-velvet-lacquer-vrm" className={lk}>
          Principled BSDF Sheen + Coat tutorial
        </Link>{" "}
        (the velvet and fabric shader that pairs with this surface normal).
        For the destructive alternative when clean quad topology is not
        required, see the{" "}
        <Link href="/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh" className={lk}>
          Dyntopo + Voxel Remesh tutorial
        </Link>
        ; for the full normal-bake automation script, see{" "}
        <Link href="/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr" className={lk}>
          Cycles batch bake pipeline
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Layer brush mechanics: three properties that matter
      </h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong><code>brush.height</code></strong> — the floor clamp. Displacement
          stops the moment the surface reaches this distance above the undisplaced
          base. Set it to 0.006 m for a woven textile; 0.002 m for fine
          embossing; 0.015 m for heavy canvas.
        </li>
        <li>
          <strong><code>brush.use_persistent</code></strong> — when{" "}
          <code>False</code>, lifting and replacing the stylus resets the floor
          reference to the current sculpted surface (the base at the moment of
          stroke start). Set to <code>True</code> for a permanent floor that
          accumulates across separate sessions — useful for multi-pass fabric
          work but risky if you accidentally over-sculpt an area.
        </li>
        <li>
          <strong><code>texture_slot.map_mode = &apos;STENCIL&apos;</code></strong> —
          the stencil is a 2-D image (or procedural texture) fixed in viewport
          space. The mesh moves through the stencil during orbiting; the stencil
          does not rotate with the mesh. This is the correct mode for a repeating
          weave — the pattern tiles across the garment surface independently of
          viewing angle.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Stencil controls in the viewport
      </h2>
      <p>
        With a texture assigned and <code>map_mode = &apos;STENCIL&apos;</code>,
        the stencil overlay appears as a semi-transparent image on the viewport.
        Three gestures control it:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`RMB drag           — translate stencil in screen space
Shift + RMB drag   — scale stencil uniformly
Ctrl + RMB drag    — rotate stencil

# To start over: Header > Brush > Texture > Reset Transform`}</pre>
      <p className="mt-2 text-sm">
        Scale the stencil until one &ldquo;weave repeat&rdquo; covers the brush footprint
        at a plausible textile resolution — roughly 2–4 repeats visible within
        the brush circle. Tighter scaling means denser threads; looser means
        a chunky knit.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Blueprint simulation: Displace + multires_reshape
      </h2>
      <p>
        The blueprint cannot call brush operators headlessly. It uses this
        equivalent pipeline to produce the same displaced geometry:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# WHY duplicate + apply Multires on the copy, not the original:
# multires_reshape requires a SOURCE mesh whose vertex count matches the
# ORIGINAL at sculpt_levels.  Applying Multires on the duplicate materialises
# the level-3 geometry as a plain mesh — same topology, same vertex count.
# A Displace modifier then moves those vertices without changing the count.

# Displace strength = LAYER_HEIGHT (6 mm) — the same value as brush.height
disp.strength       = LAYER_HEIGHT
disp.texture_coords = 'GLOBAL'    # fixed-in-world: mirrors stencil fixed-in-viewport
disp.direction      = 'NORMAL'    # along face normals, same as sculpt brush

# multires_reshape copies dup vertex positions into torso Multires at level 3
bpy.ops.object.multires_reshape(modifier="Multires")`}</pre>
      <p className="mt-2 text-sm">
        The <code>mid_level = 0.5</code> setting on the Displace modifier
        centres the Clouds texture range so that below-average noise values push
        inward (valleys) and above-average push outward (ridges). This produces
        an interleaved weave look rather than a pure-bump displacement.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Auto-masking with Face Sets
      </h2>
      <p>
        The most practical reason to combine Layer brush with Face Sets: you
        can restrict the weave pass to the jacket body without touching collar,
        cuffs, or accessories. Assign Face Sets by zone first (
        <code>Ctrl+W</code> in Sculpt Mode for paint-assign, or
        per-face in Edit Mode), then enable{" "}
        <strong>Sculpt &rsaquo; Options &rsaquo; Auto-Mask &rsaquo; Face Sets</strong>.
        The Layer brush will refuse to cross Face Set boundaries regardless of
        how large the brush radius is.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# The Face Set ID lives in the '.sculpt_face_set' INT attribute (FACE domain).
# You can assign it from Python for programmatic zone setup:
fs_attr = mesh.attributes['.sculpt_face_set']
for i, poly in enumerate(mesh.polygons):
    z = poly.center.z
    fs_attr.data[i].value = 1 if z > 0.10 else (2 if z > -0.05 else 3)
# Zone 1 = upper jacket, Zone 2 = mid body, Zone 3 = hem band`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>Stencil texture appears uniformly dark / no effect.</strong>{" "}
          Confirm the Clouds texture <code>cloud_type = &apos;GRAYSCALE&apos;</code>.
          Colour-mode Clouds outputs an RGB triplet; the brush interprets only
          the luminance channel, which from an un-tuned RGB Clouds may be
          near-zero everywhere.
        </li>
        <li>
          <strong>multires_reshape fails: vertex count mismatch.</strong>{" "}
          The high-poly duplicate has had its topology changed after Multires
          apply. Only use Displace — never Remesh, Decimate, or Dyntopo — on
          the duplicate.
        </li>
        <li>
          <strong>Normal bake is solid blue — no weave visible.</strong>{" "}
          Confirm <code>mr.sculpt_levels = 3</code> (source) and{" "}
          <code>mr.levels = 0</code> (destination) before calling{" "}
          <code>bpy.ops.object.bake()</code>. If both are the same level the
          delta is zero.
        </li>
        <li>
          <strong>GLB shows flat cloth in browser.</strong> Re-export with{" "}
          <code>export_tangents=True</code>. Confirm the Normal Map node uses
          <code>space = &apos;TANGENT&apos;</code> and is wired to the BSDF Normal input.
        </li>
        <li>
          <strong>Stencil resets position on context switch.</strong> Stencil
          transform is per-session in the viewport — it does not save into the
          .blend. Record the stencil scale value before switching between
          Object and Sculpt Mode. A workaround: use an IMAGE texture stencil
          (not procedural Clouds) — image textures survive context switches
          because the UV transform is stored per-slot.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tools/layer.html"
            className={lk} target="_blank" rel="noopener noreferrer"
          >
            Blender Manual &mdash; Layer Brush
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Documentation Team. Height
          parameter, persistent mode, accumulation behaviour, stencil
          interaction. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tools/index.html"
            className={lk} target="_blank" rel="noopener noreferrer"
          >
            full sculpt brush index
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tool_settings/texture.html"
            className={lk} target="_blank" rel="noopener noreferrer"
          >
            Blender Manual &mdash; Sculpt Mode Textures
          </a>{" "}
          &mdash; CC-BY-SA&nbsp;4.0, Blender Documentation Team. Stencil map
          mode, RMB/Shift+RMB/Ctrl+RMB viewport controls, texture slot
          properties. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/sculpt_paint/sculpting/tool_settings/index.html"
            className={lk} target="_blank" rel="noopener noreferrer"
          >
            sculpt tool settings index
          </a>
          .
        </li>
        <li>
          <a
            href="https://polyhaven.com/textures?c=Fabric"
            className={lk} target="_blank" rel="noopener noreferrer"
          >
            Poly Haven &mdash; Fabric Textures
          </a>{" "}
          &mdash; CC0&nbsp;1.0 Universal, Rob Tuytel et al. Free PBR fabric
          texture maps (diffuse + normal + roughness) that can be loaded as
          image stencil inputs in place of the procedural Clouds texture. Using
          a real fabric photograph as the stencil produces a far more convincing
          weave than procedural noise alone. Related: all Poly Haven texture
          categories at{" "}
          <a
            href="https://polyhaven.com/textures"
            className={lk} target="_blank" rel="noopener noreferrer"
          >
            polyhaven.com/textures
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/sculpting/sculpt-layer-brush-stencil-fabric-detail-vrm",
    time: "thirty to fifty minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1", "blueprint.py (provided)"],
      tools: [
        "Sculpt Mode — Layer brush, Texture > Stencil panel",
        "Properties ▸ Modifier — Multiresolution panel",
        "Properties ▸ Render ▸ Bake — Bake From Multires toggle",
        "Shader Editor — Image Texture node (bake target) + Normal Map node",
        "Scripting workspace — Text Editor",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. The Cycles bake runs at 16 samples (20–60 s on CPU) — watch the Info bar header for the progress percentage. When complete, VRM_Jacket appears with Multires level 1 active in the viewport.",
      },
      {
        title: "Inspect the FabricWeave stencil texture",
        body: "Properties > Texture (brush icon) — confirm FabricWeave is a Clouds texture with Noise Scale 0.07 and Noise Depth 6. Scrub Noise Scale from 0.07 to 0.15 and observe the texture preview; lower scale = tighter weave. Reset to 0.07 before painting.",
      },
      {
        title: "Enter Sculpt Mode and check the Layer brush",
        body: "Select VRM_Jacket → switch to Sculpt Mode. In the N-panel > Tool > Brush Settings, confirm Brush Type = Layer, Height = 0.006 m. Hover over 'Height' to see the tooltip: 'Maximum height of a layer brush stroke'. This is the floor clamp value.",
      },
      {
        title: "Verify Stencil mapping",
        body: "N-panel > Tool > Texture > Texture Mapping should read 'Stencil'. The FabricWeave stencil overlay appears on the viewport mesh. If it does not: click the texture slot thumbnail and set Map Mode to Stencil manually.",
      },
      {
        title: "Position and scale the stencil",
        body: "With the mouse in the viewport: RMB drag to reposition the stencil · Shift+RMB drag to scale · Ctrl+RMB drag to rotate. Scale until 3–4 weave repeats are visible within the brush circle at your intended brush radius. A tighter stencil scale gives denser threads.",
      },
      {
        title: "First stroke — demonstrate the floor clamp",
        body: "Drag the Layer brush across the jacket surface in one slow stroke. Then drag a SECOND stroke over the exact same path. The second stroke should produce zero additional displacement — the floor is already reached. Compare by switching briefly to Draw brush, stroking the same path, then undoing (Ctrl+Z) — the Draw stroke will visibly exceed the Layer stroke depth.",
      },
      {
        title: "Enable Face Set auto-masking (optional)",
        body: "Sculpt menu > Auto-Masking > Face Sets. Assign a Face Set to the upper jacket band via Ctrl+W (paint-assign). Layer brush strokes will now stay confined to that zone, ignoring the collar and hem regardless of brush radius.",
      },
      {
        title: "Full jacket pass",
        body: "Paint the Layer brush across the full jacket surface in overlapping horizontal strokes. Because the floor clamp is active, overlapping coverage produces no depth artefacts — the weave depth is uniform across the entire garment. Vary the stencil scale between strokes for a more natural textile variation.",
      },
      {
        title: "Re-bake after sculpting",
        body: "Object Mode → Properties > Render > Bake. Confirm 'Bake From Multires' is ticked, Viewport = 0, Sculpt = 3. Click Bake > Normals. The jacket_normal image updates to include your interactive strokes on top of the blueprint-generated base.",
      },
      {
        title: "Run record.py",
        body: "Scripting workspace → open record.py → Run Script. Renders 120 frames to public/library/videos/sculpting/sculpt-layer-brush-stencil-fabric-detail-vrm/viewport.mp4: frames 1–40 zoom in, 40–80 orbit 360°, 80–120 ramp Multires level 1→3.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Second stroke adds depth — floor clamp not working",
        cause: "brush.use_persistent is True, treating previous strokes as the new base.",
        fix: "Tool panel > Brush Settings > uncheck Persistent. With Persistent off, the floor reference resets to the undisplaced surface at each new stroke start.",
      },
      {
        symptom: "Stencil appears solid dark, no weave pattern visible",
        cause: "Clouds texture cloud_type is set to Colour not Grayscale.",
        fix: "Properties > Texture (brush slot) > set Cloud Type to Greyscale. Colour mode outputs an RGB triple; the brush reads luminance only, which may be near-zero from an untuned colour Clouds.",
      },
      {
        symptom: "Bake result is solid blue",
        cause: "mr.sculpt_levels and mr.levels are both at the same value; the delta between source and destination is zero.",
        fix: "Modifier panel: set Viewport to 0, Sculpt to 3. Then Render > Bake > Normals. The bake reads the difference between those two levels.",
      },
    ],
    finalResult:
      "A VRM clothing torso (24×8 cylinder, 192 quad faces at level 0) with a Multiresolution modifier holding fabric-weave displaced geometry at level 3, a 1024×1024 baked tangent-space normal map embedded in the .blend, and a GLB export of the level-1 mesh + normal map at approximately 80 KB (Draco 6 + WebP). The Layer brush is pre-configured with the FabricWeave Clouds stencil ready for the interactive detailing session.",
  },
  {
    slug: "blender-tutorial-sculpt-layer-brush-stencil-fabric-detail-vrm",
    title:
      "Sculpt Layer Brush + Stencil Mask — Repeating Fabric Weave on VRM Clothing (Blender 5.1)",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "The Layer brush's height floor-clamp property gives every sculpt stroke a consistent maximum depth — unlike Draw which piles indefinitely. Combined with a Stencil texture (Clouds or a CC0 fabric photograph from Poly Haven) and Face Set auto-masking, this produces a geometrically uniform fabric-weave pattern across VRM clothing at exactly 6 mm depth, baked to a 1K tangent-space normal map for WebXR GLB export.",
    Body: SculptLayerBrushStencilBody,
  },
);
