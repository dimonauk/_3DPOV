import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function DynamicPaintCanvasBrushBody() {
  return (
    <>
      <p>
        Dynamic Paint answers one of the trickier questions in real-time
        graphics: how does a moving object leave a <em>persistent</em> mark on
        a surface? Particle systems dissolve when the emitter leaves; shader
        tricks need bespoke UV logic; collision geometry is per-frame ephemeral.
        Dynamic Paint sidesteps all of that by treating paint accumulation as a
        two-map state that advances like a simplified PDE: a{" "}
        <em>colour map</em> stores the RGBA of deposited paint and an auxiliary{" "}
        <em>wet map</em> stores remaining moisture. On each frame the solver (a)
        stamps the current brush footprint into the colour map, (b) spreads
        adjacent wet pixels laterally by <code>spread_speed</code> world units,
        and (c) decays the wet map toward zero at <code>dry_speed</code> frames
        per half-life. Once a pixel dries its colour is locked; spreading stops
        and the mark is permanent for the rest of the bake. The output is an
        ordinary vertex colour attribute (or an image sequence in UV space) that
        any Principled BSDF can read — the runtime cost at render time is zero.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Canvas vs Brush roles</h3>
      <p>
        The single Dynamic Paint modifier carries two modes, selected by{" "}
        <code>ui_type</code>: <code>&lsquo;CANVAS&rsquo;</code> on the surface that receives
        paint and <code>&lsquo;BRUSH&rsquo;</code> on every object that deposits it. A scene
        can have many Brush objects and many Canvas objects; the solver evaluates
        every Brush-against-every-Canvas pair. Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-flag-banner"
          className={lk}
        >
          cloth modifier
        </Link>
        , which uses a Bullet impulse solver with a fully implicit time-
        integrator, Dynamic Paint uses an explicit forward-Euler step on the wet
        map — cheap enough to run interactively during the bake, but it means
        very high <code>spread_speed</code> values can overshoot and create
        checkerboard artefacts. Keep it below 3.0 for vertex-format canvases.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Vertex format vs Image format
      </h3>
      <p>
        <strong>VERTEX</strong> writes a colour attribute directly onto the mesh
        topology — instant feedback, no UV unwrap required, limited by vertex
        count. At 60 subdivisions the grid in this tutorial has 3&thinsp;721 vertices
        which gives a "resolution" of roughly 60 × 60 for a 2.4 m plane —
        adequate for a broad brush trail. <strong>IMAGE</strong> writes a
        per-frame PNG sequence into a directory, rendered in UV space at a
        chosen pixel resolution (512 or 1024 is typical). IMAGE format requires a
        UV unwrap and is the right choice when the final asset will have a baked
        normal or AO map alongside it — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-texture-baking-normal-ao"
          className={lk}
        >
          texture baking tutorial
        </Link>{" "}
        for the unwrap-then-bake workflow.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        paint_source options
      </h3>
      <p>
        The Brush modifier&apos;s <code>paint_source</code> property determines
        what the brush footprint looks like:
      </p>
      <ul className="list-disc ml-6 space-y-1 mt-2">
        <li>
          <code>VOLUME</code> — full coverage wherever the canvas vertex sits
          inside the brush mesh. Hard edge, no falloff. Used here.
        </li>
        <li>
          <code>DISTANCE</code> — soft falloff proportional to the distance from
          the brush mesh surface, out to <code>brush_radius</code> world units.
          Good for proximity wetness effects and stylised bleed.
        </li>
        <li>
          <code>POINT</code> — treats the object origin as a point source. Useful
          for particle brushes where each particle is the brush&apos;s footprint — see
          the{" "}
          <Link
            href="/tutorials/blender-tutorial-particle-emitter-force-field-glb-snapshot"
            className={lk}
          >
            particle emitter tutorial
          </Link>{" "}
          for how to set up a particle system that you then hook to Dynamic Paint.
        </li>
      </ul>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Material wiring
      </h3>
      <p>
        The Vertex Colour node reads the <code>dp_paint</code> attribute by
        name. Its <strong>Alpha</strong> output (paint coverage 0–1) drives the
        Fac input of a Mix RGB node that blends between the ivory canvas base
        colour and the paint colour. Unpainted vertices report alpha = 0 and
        display the base; fully-painted vertices report 1 and display the paint
        colour. The shader needs no awareness of the simulation; it just reads
        the attribute like any other colour layer. This composability is why
        Dynamic Paint integrates so naturally into the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-procedural-worn-metal-edge-wear"
          className={lk}
        >
          worn-metal edge-wear
        </Link>{" "}
        pattern — you can feed the wetness attribute into the roughness socket to
        make painted areas look wet (lower roughness = more specular).
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Baking the simulation
      </h3>
      <p>
        <code>bpy.ops.dpaint.bake()</code> requires the canvas object to be the
        active selection and is context-sensitive — it may fail in a fully
        headless Blender session without a window. The blueprint catches the
        <code>RuntimeError</code> and prints an instruction to use the UI Bake
        button under Physics Properties → Dynamic Paint → Cache. The result is
        the same either way: vertex colour attribute data embedded in the mesh,
        ready to play back by scrubbing the timeline.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Outside references
      </h3>
      <p>
        Dynamic Paint was developed by Miika Hämäläinen and merged into Blender
        2.61 in 2011. His original integration writeup at{" "}
        <a
          href="https://code.blender.org/2011/06/dynamic-paint/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          code.blender.org
        </a>{" "}
        explains the design decisions behind the two-map approach. The current
        authoritative reference is the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/physics/dynamic_paint/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Dynamic Paint
        </a>{" "}
        (CC-BY-SA 4.0, The Blender Foundation &amp; Contributors). Related
        upstream project: the full Blender source at{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org
        </a>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-physics-dynamic-paint-canvas-brush-wetness-trail",
  title:
    "Dynamic Paint: Canvas + Brush for Wetness Trail & Proximity Reveal (Blender 5.1)",
  date: "2026-06-27",
  kind: "tutorial",
  excerpt:
    "Set up a Dynamic Paint Canvas on a dense grid plane, add a sphere Brush that leaves a persistent cobalt-blue wet trail as it sweeps across, wire the dp_paint vertex colour attribute into a Principled BSDF, and bake the two-map (colour + wet) simulation — covering VOLUME vs DISTANCE paint_source, drying/spreading parameters, and the Vertex vs Image format trade-off.",
  Body: DynamicPaintCanvasBrushBody,
};

export const entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from public/library/blends/physics/physics-dynamic-paint-canvas-brush-wetness-trail/",
      ],
      tools: ["Blender 5.1", "terminal (for headless bake)"],
    },
    steps: [
      {
        title: "Scene reset + canvas plane",
        body: "import bpy, math\n\nbpy.ops.object.select_all(action='SELECT')\nbpy.ops.object.delete()\nscene = bpy.context.scene\nscene.frame_start = 1\nscene.frame_end   = 90\n\n# Dense grid: 60 cuts → 3721 vertices for smooth vertex-colour resolution\nbpy.ops.mesh.primitive_grid_add(\n    x_subdivisions=60, y_subdivisions=60,\n    size=2.4, location=(0,0,0))\ncanvas = bpy.context.active_object\ncanvas.name = 'canvas_plane'\n\n# Pre-initialise the attribute so frame-1 reads ivory, not black\nattr = canvas.data.color_attributes.new(\n    name='dp_paint', type='BYTE_COLOR', domain='POINT')\nfor sample in attr.data:\n    sample.color = (0.93, 0.91, 0.86, 1.0)",
      },
      {
        title: "Canvas material: vertex colour → shader",
        body: "mat = bpy.data.materials.new('mat_canvas')\nmat.use_nodes = True\nnt = mat.node_tree\nnt.nodes.clear()\n\nout  = nt.nodes.new('ShaderNodeOutputMaterial')\nbsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')\nvcol = nt.nodes.new('ShaderNodeVertexColor')\nmix  = nt.nodes.new('ShaderNodeMixRGB')\n\nvcol.layer_name          = 'dp_paint'\nmix.blend_type           = 'MIX'\nmix.inputs[1].default_value = (0.93, 0.91, 0.86, 1.0)  # ivory base\nmix.inputs[2].default_value = (0.06, 0.44, 0.82, 1.0)  # cobalt blue\n\n# Alpha output = paint coverage; drives Mix Fac\nnt.links.new(vcol.outputs['Alpha'],  mix.inputs['Fac'])\nnt.links.new(mix.outputs['Color'],   bsdf.inputs['Base Color'])\nbsdf.inputs['Roughness'].default_value = 0.78\nnt.links.new(bsdf.outputs['BSDF'],   out.inputs['Surface'])\ncanvas.data.materials.append(mat)",
      },
      {
        title: "Canvas Dynamic Paint modifier",
        body: "dp_mod = canvas.modifiers.new('DynamicPaint', 'DYNAMIC_PAINT')\ndp_mod.ui_type = 'CANVAS'\n\nsurf = dp_mod.canvas_settings.canvas_surfaces[0]\nsurf.surface_type   = 'PAINT'      # accumulate colour + wet map\nsurf.surface_format = 'VERTEX'     # write to vertex colour attribute\nsurf.output_name_a  = 'dp_paint'\nsurf.output_name_b  = 'dp_paint_wet'\nsurf.frame_start    = 1\nsurf.frame_end      = 90\n\n# Drying: paint transitions wet → dry over 40 frames\nsurf.use_drying  = True\nsurf.dry_speed   = 40\n\n# Spreading: wet paint bleeds outward at 1.5 world-units/s\nsurf.use_spread   = True\nsurf.spread_speed = 1.5",
      },
      {
        title: "Brush sphere + animation",
        body: "bpy.ops.mesh.primitive_uv_sphere_add(\n    radius=0.18, segments=12, ring_count=8,\n    location=(-0.9, 0.6, 0.185))\nbrush_obj = bpy.context.active_object\nbrush_obj.name = 'brush_sphere'\n\n# Diagonal sweep: start → mid → end over 90 frames\nfor frame, loc in [\n    (1,  (-0.9,  0.6, 0.185)),\n    (45, ( 0.0, -0.1, 0.185)),\n    (90, ( 0.9, -0.5, 0.185)),\n]:\n    bpy.context.scene.frame_set(frame)\n    brush_obj.location = loc\n    brush_obj.keyframe_insert('location')\n\n# Constant velocity → linear interpolation\nfor fc in brush_obj.animation_data.action.fcurves:\n    for kp in fc.keyframe_points:\n        kp.interpolation = 'LINEAR'",
      },
      {
        title: "Brush Dynamic Paint modifier",
        body: "dp_brush = brush_obj.modifiers.new('DynamicPaint', 'DYNAMIC_PAINT')\ndp_brush.ui_type = 'BRUSH'\n\nbr = dp_brush.brush_settings\nbr.paint_color   = (0.06, 0.44, 0.82)  # cobalt blue\nbr.paint_alpha   = 1.0\nbr.paint_wetness = 1.0\nbr.smooth_radius = 1.2   # 20 % soft edge beyond the sphere surface\n\n# VOLUME: full coverage inside the mesh; hard stamp\nbr.paint_source = 'VOLUME'",
      },
      {
        title: "Bake the simulation",
        body: "bpy.ops.object.select_all(action='DESELECT')\ncanvas.select_set(True)\nbpy.context.view_layer.objects.active = canvas\n\ntry:\n    bpy.ops.dpaint.bake()\n    print('Bake complete — scrub the timeline to see the trail.')\nexcept RuntimeError as exc:\n    print(f'Context error: {exc}')\n    print('Open the file in Blender and click Bake under Physics → Dynamic Paint.')\n\nbpy.context.scene.frame_set(45)  # jump to mid-trail",
      },
    ],
  },
  base,
);
