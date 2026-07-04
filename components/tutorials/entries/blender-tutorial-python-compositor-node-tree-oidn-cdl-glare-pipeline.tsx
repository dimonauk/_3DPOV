import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender maintains three independent node trees: a{" "}
        <code>ShaderNodeTree</code> on each material, a{" "}
        <code>GeometryNodeTree</code> on each Geometry Nodes modifier, and a{" "}
        <code>CompositorNodeTree</code> on each scene.  The first two get Python
        tutorials in this library — this one closes the set by building the
        compositor tree entirely from a script.  The result is a four-stage
        production pipeline: OIDN guided denoising, ASC-CDL colour correction,
        streak glare for emission highlights, and float-32 EXR output to disk.
      </p>
      <p>
        The pipeline bakes into the <code>.blend</code> file and re-evaluates on
        every render.  You run the script once; every subsequent F12 pass runs
        through the full post-process chain without touching the editor at all.
      </p>

      <h2>Enabling the compositor and the blank-slate pattern</h2>
      <p>
        Setting <code>scene.use_nodes = True</code> enables the compositor AND
        seeds the tree with a default pair — one <code>CompositorNodeRLayers</code>{" "}
        and one <code>CompositorNodeComposite</code>, already linked.  Building on
        top of those defaults is fragile: socket names collide, positions overlap,
        and the existing link silently prevents yours from taking effect.  Always
        clear first:
      </p>
      <pre>{`scene.use_nodes = True
nt    = scene.node_tree   # CompositorNodeTree
nodes = nt.nodes
links = nt.links
nodes.clear()             # also clears all links automatically`}</pre>
      <p>
        Compare this with{" "}
        <Link
          href="/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig"
          className={lk}
        >
          the World Node Tree tutorial
        </Link>
        , which uses the same blank-slate approach on a{" "}
        <code>ShaderNodeTree</code>, and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-geometry-nodetree-build-scatter-modifier-api"
          className={lk}
        >
          the Geometry Node Tree tutorial
        </Link>{" "}
        for a <code>GeometryNodeTree</code>.  The <code>nodes.new()</code> /{" "}
        <code>links.new()</code> API is identical across all three tree types;
        only the <code>bl_idname</code> prefix changes.
      </p>

      <h2>Denoising passes — three settings that must align</h2>
      <p>
        The <code>CompositorNodeDenoise</code> node uses Normal and Albedo
        buffers to constrain its filter.  Without them it operates un-guided:
        colour bleeds across depth discontinuities and fine detail in specular
        surfaces smears.  Getting guided denoising working requires three
        settings on the ViewLayer, all set before rendering:
      </p>
      <pre>{`vl = scene.view_layers["ViewLayer"]
vl.cycles.denoising_store_passes = True   # write Normal + Albedo passes
vl.cycles.use_denoising          = False  # disable auto denoiser in Cycles
# (Cycles' built-in denoiser AND compositor Denoise node applied together
#  double-denoise and destroy micro-detail — disable one or the other)`}</pre>
      <p>
        Once <code>denoising_store_passes</code> is <code>True</code>, the
        <code>CompositorNodeRLayers</code> node exposes{" "}
        <code>Denoising Normal</code> and <code>Denoising Albedo</code> output
        sockets.  They do <em>not</em> appear until that flag is set — not even
        as greyedout sockets.  If you build the compositor tree before setting
        the flag, the socket names will be absent and the links will fail
        silently.
      </p>
      <pre>{`rl = nodes.new("CompositorNodeRLayers")
rl.layer = "ViewLayer"   # case-sensitive; must match actual layer name

dn = nodes.new("CompositorNodeDenoise")
dn.use_hdr   = True         # keeps HDR emission values above 1.0 intact
dn.prefilter = "ACCURATE"   # denoises auxiliaries before using them as guides

links.new(rl.outputs["Image"],            dn.inputs["Image"])
links.new(rl.outputs["Denoising Normal"], dn.inputs["Normal"])
links.new(rl.outputs["Denoising Albedo"], dn.inputs["Albedo"])`}</pre>

      <h2>ASC-CDL — the industry colour exchange format</h2>
      <p>
        <code>CompositorNodeColorBalance</code> offers two correction models.
        <code>LIFT_GAMMA_GAIN</code> is the legacy DaVinci-style model.{" "}
        <code>ASC_CDL</code> is the Academy Colour Decision List — the format
        used in DCP mastering and on-set look management, where a DoP hands a
        colourist a set of numbers that reproduce a specific grade on any
        compliant system.  The formula is:
      </p>
      <pre>{`out = clamp(in × Slope + Offset) ^ (1 / Power)`}</pre>
      <p>
        Slope scales the signal (think gain per channel).  Offset lifts or
        lowers the blacks (exposure bias).  Power applies a gamma curve
        (Power&nbsp;=&nbsp;0.94 ≈ Gamma&nbsp;=&nbsp;1.06, slightly brighter
        mids).  In Python, each is a 3-float RGB tuple:
      </p>
      <pre>{`cb = nodes.new("CompositorNodeColorBalance")
cb.correction_method = "ASC_CDL"
cb.slope  = (1.04, 1.00, 0.96)   # warm reds, cool blues
cb.offset = (0.02, 0.01, 0.00)   # shadow warmth
cb.power  = (0.94, 0.96, 1.02)   # cool gamma in G/B

links.new(dn.outputs["Image"], cb.inputs["Image"])`}</pre>
      <p>
        Do not confuse <code>slope</code> with <code>gain</code>: the{" "}
        <code>LIFT_GAMMA_GAIN</code> model's <code>gain</code> is not
        mathematically equivalent to CDL <code>slope</code> because of where
        each applies relative to the black offset.
      </p>

      <h2>Streak glare — threshold in scene-linear space</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          glare compositor tutorial
        </Link>{" "}
        covers the UI workflow; here the same node is wired from Python.  The
        critical detail is that <code>threshold</code> operates in{" "}
        <em>scene-linear HDR values</em>, not display-referred values.  A gem
        with <code>Emission Strength&nbsp;=&nbsp;2.8</code> fires streaks at a
        threshold of <code>0.85</code>; a normally lit diffuse surface at
        ~0.3–0.6 does not.  Glare must precede tone-mapping — placing it after
        a Tone Map node means it reads values already clamped to [0,&nbsp;1]
        and fires on everything.
      </p>
      <pre>{`gl = nodes.new("CompositorNodeGlare")
gl.glare_type  = "STREAKS"
gl.quality     = "MEDIUM"
gl.threshold   = 0.85       # scene-linear, not display
gl.streaks     = 4
gl.iterations  = 4          # longer streaks with more diffusion
gl.mix         = 0.0        # -1=off, 0=50/50, +1=pure glare

links.new(cb.outputs["Image"], gl.inputs["Image"])`}</pre>

      <h2>FileOutput — float EXR for downstream grading</h2>
      <p>
        Writing the final composite to a float-32 EXR preserves the full HDR
        range for round-trip work in DaVinci Resolve or Nuke.  The default
        slot name <code>"Image"</code> maps to the node's single input socket.
        For multilayer EXR (multiple layers in one file), set{" "}
        <code>file_format&nbsp;=&nbsp;"OPEN_EXR_MULTILAYER"</code> and call{" "}
        <code>file_slots.new(name)</code> for each additional channel — the
        socket names on the node match the slot names exactly.
      </p>
      <pre>{`fo = nodes.new("CompositorNodeOutputFile")
fo.base_path                = "//render_output"
fo.format.file_format       = "OPEN_EXR"
fo.format.color_depth       = "32"
fo.format.exr_codec         = "ZIP"

links.new(gl.outputs["Image"], fo.inputs["Image"])`}</pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          AOV custom render passes tutorial
        </Link>{" "}
        shows how to wire additional render passes — glow mask, rim, flat
        normal — through a FileOutput into a multilayer EXR, extending this
        pattern to per-channel compositing in DaVinci.
      </p>

      <h2>Troubleshooting — five silent failures</h2>
      <p>
        <strong>Denoising Normal / Denoising Albedo sockets absent.</strong>{" "}
        <code>vl.cycles.denoising_store_passes</code> must be <code>True</code>{" "}
        before building the tree.  The sockets do not exist until the flag is
        set.
      </p>
      <p>
        <strong>Wrong <code>correction_method</code>.</strong> Setting{" "}
        <code>cb.slope</code> on a node still in{" "}
        <code>LIFT_GAMMA_GAIN</code> mode writes to a hidden attribute — the
        visible <code>gain</code> stays at its default and the CDL values are
        silently ignored.  Always set <code>correction_method</code> first.
      </p>
      <p>
        <strong>Glare fires on every surface.</strong> The threshold is
        scene-linear.  If you place glare after a tone map node, all values are
        [0,&nbsp;1] and the threshold of 0.85 fires on most lit surfaces.
        Move glare before any tone-mapping node.
      </p>
      <p>
        <strong>FileOutput writes nothing.</strong>{" "}
        <code>CompositorNodeOutputFile</code> writes only when the compositor
        evaluates at render time.  It does not write on viewport updates or F11
        preview.  Trigger with <code>bpy.ops.render.render(write_still=True)</code>.
      </p>
      <p>
        <strong>OIDN denoiser and compositor Denoise node both active.</strong>{" "}
        If <code>vl.cycles.use_denoising&nbsp;=&nbsp;True</code> AND a Denoise
        node is in the tree, the output is denoised twice.  The result loses
        micro-detail across the whole image.  Disable one or the other.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender Manual: Compositing</strong>{" "}
          (CC-BY-SA 4.0 · Blender Foundation):{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/compositing/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org/manual/en/5.1/compositing
          </a>
          .  Complete node reference for all compositor types.  Sibling project:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/blender/blender
          </a>
          .
        </li>
        <li>
          <strong>ASC-CDL Specification</strong>{" "}
          (Apache-2.0 · Academy Software Foundation / ACES Central):{" "}
          <a
            href="https://docs.acescentral.com/specifications/acescc-technical-reference/"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.acescentral.com/specifications/acescc-technical-reference
          </a>
          .  Canonical Slope/Offset/Power definition and the clamping semantics
          used by <code>CompositorNodeColorBalance</code> in ASC_CDL mode.
          Sibling project:{" "}
          <a
            href="https://github.com/AcademySoftwareFoundation/aces-dev"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/AcademySoftwareFoundation/aces-dev
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-compositor-node-tree-oidn-cdl-glare-pipeline",
  title:
    "Python CompositorNodeTree — OIDN Denoise + ASC-CDL Grade + Streak Glare Pipeline (Blender 5.1)",
  libraryPath:
    "blends/scripting/python-compositor-node-tree-oidn-cdl-glare-pipeline",
  blenderVersion: "5.1",
  date: "2026-07-04",
  tags: [
    "blender",
    "python",
    "compositor",
    "scripting",
    "denoising",
    "colour-grade",
    "glare",
    "post-production",
  ],
  Body,
});
