import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In Blender 4.x, procedurally growing a ribbon prop along its length
        meant a Simulation Zone: bake one frame at a time, wait for the cache,
        scrub carefully. The Simulation Zone is the right tool for physics — it
        is the wrong tool for a simple parametric reveal that the artist wants
        to scrub freely.
      </p>
      <p>
        <code>TrimCurve</code> is the right tool. It accepts a normalised
        [0,&thinsp;1] Start and End, slices the spline at those arc-length
        fractions, and outputs a curve with all per-point attributes
        (radius, tilt, named attributes) preserved on the remaining portion.
        Animating <em>Trim End</em> from 0 to 1 grows the ribbon from base to
        tip in a single depsgraph evaluation per frame — no bake, no cache
        invalidation, free to scrub.
      </p>
      <p>
        This blueprint chains <code>TrimCurve</code> with three companion
        operations on a Bezier S-curve: a radius ramp (base 6 cm → tip 1.6 cm)
        set <em>before</em> trimming so the taper profile survives any clip
        window; a spiral tilt twist applied the same way; and an arc-length
        resample applied <em>after</em> trimming so vertices are evenly spaced
        on the visible portion. <code>CurveToMesh</code> extrudes an octagonal
        profile — scaled per-point by the baked radius attribute — and a{" "}
        <code>ribbon_t</code> named attribute drives an indigo→amber emission
        colour ramp, producing a single-object WebXR prop.
      </p>

      <h2>Why ordering matters: before-trim versus after-trim operations</h2>
      <p>
        Every curve node in the GN stack reads or writes per-point attribute
        data. <code>TrimCurve</code> interpolates that data at the cut points
        and discards everything outside the window — so the order in which you
        apply operations relative to <code>TrimCurve</code> changes what
        survives.
      </p>
      <p>
        <strong>Before trim</strong>:{" "}
        <code>SetCurveRadius</code> and <code>SetCurveTilt</code>. Both bake
        a value per control point. After trim, the sliced portion retains the
        interpolated radius and tilt values at its new endpoints — the taper
        and twist look correct wherever the window sits. If you moved these
        after trim, <code>SplineParameter.Factor</code> would restart 0..1 on
        the trimmed domain and the taper would always run base→tip regardless
        of where the window started.
      </p>
      <p>
        <strong>After trim</strong>: <code>ResampleCurve</code> and the second{" "}
        <code>SplineParameter</code> that stores <code>ribbon_t</code>. A Bezier
        segment&apos;s control-point spacing is uneven — denser near the
        inflection of the S-curve. Resampling after trim redistributes vertices
        by equal arc-length on exactly the visible portion. The subsequent{" "}
        <code>SplineParameter.Factor</code> is then visually even along the
        tube, so the colour gradient does not bunch at the inflection point.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves Poi Trail tutorial
        </Link>{" "}
        used <code>SplineParameter</code> to colour particle streaks. The
        principle is identical here — the difference is that the attribute is
        stored on a continuously resampled curve rather than on accumulated
        particle points.
      </p>

      <h2>SetCurveTilt and CurveToMesh: how the spiral emerges</h2>
      <p>
        <code>SetCurveTilt</code> writes a rotation angle in radians to each
        spline control point. <code>CurveToMesh</code> reads that tilt at each
        sample and rotates the profile cross-section accordingly before
        positioning it on the spine. The profile itself does not deform — only
        its orientation around the tangent axis changes. On a circle profile
        this is invisible; on the octagonal profile used here, each flat face
        visibly rotates to the next position every one-eighth turn, producing
        the spiral pattern.
      </p>
      <p>
        The tilt angle is computed as{" "}
        <code>Factor × Tilt_Turns × 2π</code> via two chained Math nodes
        (MULTIPLY × 2π, then × Tilt_Turns). This means every control point
        has a unique tilt proportional to its arc-length position. The twist
        is therefore spatially uniform — not keyframe-based.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-matrix-nodes-fk-chain-articulated-poi-staff"
          className={lk}
        >
          FK Chain Poi Staff tutorial
        </Link>{" "}
        showed how <code>Multiply Matrices</code> inside a Repeat Zone
        accumulates joint orientations. <code>SetCurveTilt</code> is a
        lighter tool for the same visual goal when you want a continuous spiral
        rather than discrete articulated joints.
      </p>

      <h2>The Bezier S-curve as a light-painting template</h2>
      <p>
        The blueprint defines the S-curve via four world-space positions:
        Start (0,0,0), Start Handle (+X inflection), End Handle (−X mirror),
        End (0,0,2.8). The handles create a single S-bend — the curve crosses
        from the +X side to the −X side at mid-height. This shape approximates
        the path of a poi or ribbon staff during a contact-roll move.
      </p>
      <p>
        For light-painting photography, the Bezier control points translate
        directly to camera path decisions: each handle position becomes an
        inflection in the long-exposure trace. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum Poi tutorial
        </Link>{" "}
        generated similar paths from physics simulation. This blueprint
        generates them analytically — edit the four Bezier positions and the
        shape updates immediately.
      </p>
      <p>
        For a ribbon light sculpture, vary the handle magnitudes. Short handles
        (≈ 0.4 m) produce a gentle S-curve that reads as a flowing ribbon.
        Long handles (≈ 2.0 m) produce a sharp Z-bend that reads as a twisted
        rod. Both are valid; the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf Fibration Light Sculpture tutorial
        </Link>{" "}
        demonstrates how multiple such curves, arranged in a linked pattern,
        can form a cohesive WebXR installation.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "GN Curve to Mesh — Trim, Tilt & Radius Ramp: Light Ribbon Prop for WebXR (Blender 5.1)",
  lede: "Blender 5.1's Curve node family — BezierSegment, SetCurveRadius, SetCurveTilt, TrimCurve (FACTOR mode), ResampleCurve, CurvePrimitiveCircle, CurveToMesh — chains into a single-pass ribbon pipeline: a radius MapRange (6 cm→1.6 cm) and a tilt ramp (1.5 spiral turns) are baked before trimming so per-point data survives any clip window; ResampleCurve after trim gives arc-length-uniform spacing; a ribbon_t named attribute drives an indigo→amber emission ramp; animating Trim End 0→1 grows the ribbon without a Simulation Zone.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-curve-to-mesh-ribbon-trim-tilt-webxr/",
  steps: [
    {
      title: "Run blueprint.py — build the GN tree",
      body: "Open Blender 5.1 → **Scripting** workspace. Load `blueprint.py` and press **Run Script** (`Alt+P`).\n\n`purge()` clears orphan data. `make_material()` creates `hf_ribbon_emission`: a `ShaderNodeAttribute` reads `ribbon_t` (a FLOAT named attribute stored per vertex by the GN tree), feeds a `ColorRamp` (indigo `(0.09,0,0.55)` → amber `(1.0,0.58,0)`) into a `ShaderNodeEmission` at strength 4.5, connected to `ShaderNodeOutputMaterial`.\n\n`build_gn_tree()` then assembles nine node stages:\n\n1. **BezierSegment** (POSITION mode, Resolution 8): the S-curve spine.\n2. **SplineParameter → MapRange → SetCurveRadius**: taper 0.060 m base to 0.016 m tip.\n3. **SplineParameter → Math×2π → Math×Tilt_Turns → SetCurveTilt**: spiral twist.\n4. **TrimCurve** (FACTOR mode): Start and End wired to group inputs.\n5. **ResampleCurve** (COUNT mode): 80 uniformly-spaced points on the trimmed portion.\n6. **SplineParameter → StoreNamedAttribute(ribbon_t, FLOAT, POINT)**: colour coord.\n7. **CurvePrimitiveCircle** (POINTS mode, 8 verts, radius 1.0): profile curve.\n8. **CurveToMesh** (Fill Caps = True): extrudes the profile along the spine.\n9. **SetMaterial**: applies `hf_ribbon_emission`.\n\nSix modifier inputs are exposed: Trim Start, Trim End, Tilt Turns, Profile Verts, Resample Count.\n\nConsole should print: `[gn-curve-to-mesh-ribbon] Built — hf_light_ribbon with HF_LightRibbon.`",
    },
    {
      title: "Inspect TrimCurve and drag Trim End in the modifier",
      body: "Select `hf_light_ribbon`. In **Modifier Properties** (`🔧`) → expand **HF_LightRibbon**. You will see **Trim End = 1.0** (fully visible).\n\nDrag **Trim End** to 0.0: the ribbon vanishes entirely (the curve is trimmed to zero length, CurveToMesh produces no geometry). Drag back to 0.5: the bottom half of the S-curve is visible, the top half not. Drag to 1.0: the full ribbon.\n\nDrag **Trim Start** to 0.3 (keep End at 1.0): the base 30% disappears. The visible ribbon is the middle-to-top portion, but notice — the radius and tilt on the remaining portion match what they would be at those arc-length positions on the full ribbon, not at the base. That is the effect of applying `SetCurveRadius` and `SetCurveTilt` before the trim.\n\nOpen the **Geometry Nodes** editor. Locate **TrimCurve** (orange-bordered node, FACTOR mode label visible in the header). Hover over its **Start** input socket: the tooltip reads `Float` — this is a normalised arc-length fraction, not a world-space distance. Hover the **Curve** output: the tooltip reads `Curve`. The node does not convert the curve to mesh — it returns a curve that subsequent nodes continue to manipulate.",
    },
    {
      title: "Vary Tilt Turns and Profile Verts",
      body: "In the modifier panel, set **Tilt Turns** to 0.0: the cross-section faces are all axis-aligned — the octagonal tube shows uniform flat bands along its length. Raise to 1.0: one full rotation — the visible face at the base is the same face that appears at the tip after one full twist. At 1.5 (the default): 540° total twist — a half-turn left over — the top face is offset 45° from the bottom face.\n\nAt **Tilt Turns = 4.0** the ribbon spirals tightly; the S-curve geometry is still identical but the face pattern rotates very rapidly along the spine.\n\nNow change **Profile Verts** to 3 (triangular cross-section): a three-blade ribbon, visually distinct. Profile Verts = 6: hexagonal — the studio's preferred low-poly default. Profile Verts = 16: nearly circular, smooth — useful for a more realistic tube.\n\nIn the GN editor, trace the profile path: **CurvePrimitiveCircle** (top of node stack, mode = POINTS) → its **Curve** output wired to **CurveToMesh**'s **Profile Curve** input. The `Profile Verts` group input is wired to the circle's `Vertices` socket — changing the modifier input directly changes the vertex count on the profile without rebuilding the node tree.",
    },
    {
      title: "Keyframe Trim End for grow-on animation",
      body: "In the **Timeline** footer (or press `Ctrl+Space` to enlarge), ensure you are at frame 1.\n\nIn the modifier panel, right-click **Trim End** → **Insert Keyframe** (or hover the value and press `I`). Set frame to 1, Trim End to 0.0 → keyframe. Move to frame 120, set Trim End to 1.0 → keyframe.\n\nPress `Space` to play. The ribbon grows from base to tip over 4 seconds at 30 fps.\n\nAlternatively: **run `record.py`** (with the .blend saved in the same directory as the library folder). `record.py` finds the modifier, calls `keyframe_insert` via the socket identifier, sets up an EEVEE render at 1920×1080, and outputs `viewport.mp4` to `public/library/videos/geometry-nodes/gn-curve-to-mesh-ribbon-trim-tilt-webxr/viewport.mp4`.\n\nThe socket-identifier approach in `record.py` (`mod[item.identifier] = value`) is more robust than using the socket index directly. The identifier is a stable string (e.g. `Input_0`) assigned when the socket is created; index order can change if sockets are reordered in the interface.",
    },
    {
      title: "Export as GLB for WebXR",
      body: "File → **Export → glTF 2.0 (.glb/.gltf)**.\n\n- Format: **GLB** (binary, single file).\n- Apply Modifiers: **ON** — evaluates the GN tree and bakes real mesh geometry.\n- Geometry → Draco Compression: **Level 6** (Holoflow convention; ~4× size reduction on the tube mesh).\n- Images: **WebP**.\n- Transform → +Y Up: **ON** (Blender uses Z-up; the exporter rotates to glTF/Three.js Y-up convention).\n\nFilename: `hf_light_ribbon.glb`. Root node name in the GLB will be `hf_light_ribbon` (the object name).\n\nIn Three.js (the studio's WebXR renderer), load with `GLTFLoader` and position in the XR scene. The `ribbon_t` attribute is NOT exported by default (custom vertex attributes require the KHR_mesh_quantization extension or manual buffering); the colour is baked into vertex colours if you add a **VertexColorNode** in the material before export. For this tutorial the emission material is sufficient for a standalone prop.",
    },
  ],
  finalResult:
    "A tapered, twisted, indigo→amber emission ribbon tube: a Bezier S-curve (0,0,0)→(0,0,2.8m) with 1.5 spiral turns, 8-sided octagonal cross-section, radius tapering from 60 mm at the base to 16 mm at the tip, trimmed via a [0,1] modifier-input pair for keyframeable grow-on reveal, arc-length resampled to 80 uniformly-spaced points on the visible portion. One GN modifier, one mesh object, one material, one GLB (hf_light_ribbon.glb) for WebXR. Modifier inputs: Trim Start, Trim End, Tilt Turns (1.5), Profile Verts (8), Resample Count (80).",
  variations: [
    "Replace the single BezierSegment with a GN `Curve Line` connected to a `SplineParameter`-driven `SetPosition` that reads a pre-built custom float attribute. This lets you deform any existing curve (imported from SVG via `File → Import → SVG`) through the same Trim+Tilt+Radius pipeline without changing the node tree — useful for converting 2D logo paths into lit ribbon props.",
    "Add a second `TrimCurve` AFTER `ResampleCurve` with `Start = (Frame / 120)` and `End = Start + 0.15`. This creates a short visible window that sweeps along the ribbon over time — a 'tracer dot' or 'snake head' effect. Combine with the base grow-on keyframe on the outer TrimCurve for a ribbon that grows on AND has a moving highlight segment.",
    "Wire `CurvePrimitiveCircle.Radius` to a `SceneTime.Frame`-driven sinusoid via Math nodes: `sin(Frame × 0.2) × 0.03 + 0.06`. The profile circle pulses in radius over time, breathing without any mesh animation — a pure GN parametric effect. Useful for a 'living ribbon' light sculpture in a WebXR environment that idles when not interacted with.",
    "Add a `Noise Texture` node (4D, W = SplineParameter.Factor) before `SetCurveTilt` and mix its output with the linear tilt ramp. This gives the spiral a randomised wobble without any simulation. The 4D noise evaluated at the per-point Factor position is stable across frames — no animation jitter — but varies spatially along the ribbon.",
  ],
  troubleshooting: [
    {
      symptom: "Trim End is at 1.0 but no geometry appears in the viewport",
      cause:
        "CurvePrimitiveCircle in POINTS mode outputs nothing if Vertices < 3. If the Profile Verts group input is wired but the default value is not set, it may evaluate to 0.",
      fix: "In Modifier Properties, check Profile Verts — set it to 8 if empty or 0. In the GN editor, confirm the CurvePrimitiveCircle's Vertices input socket is connected to the group input (blue wire), not receiving a default of 0.",
    },
    {
      symptom: "The ribbon has uniform radius with no taper — taper is ignored",
      cause:
        "SetCurveRadius is placed AFTER TrimCurve in the node chain. SplineParameter.Factor restarts 0..1 on the trimmed domain, but if you also moved it downstream of ResampleCurve the factor is correct but the effect is overriding MapRange output with a different default.",
      fix: "In the GN editor, trace the node order. SetCurveRadius must be connected between BezierSegment output and TrimCurve input. Verify that SplineParameter is feeding into MapRange (not directly into SetCurveRadius.Radius with the wrong range).",
    },
    {
      symptom: "ribbon_t colour ramp is bunched at one end of the ribbon",
      cause:
        "StoreNamedAttribute(ribbon_t) is wired to a SplineParameter placed BEFORE ResampleCurve. Bezier control-point spacing is non-uniform — the S-curve's inflection point concentrates points — so Factor values bunch there.",
      fix: "Move the SplineParameter node that feeds ribbon_t to AFTER ResampleCurve in the chain. Resample redistributes points by arc-length, so the subsequent Factor values are evenly spread along the visible portion.",
    },
    {
      symptom: "Export GLB has visible seam / crease at one of the trim endpoints",
      cause:
        "Fill Caps is False on CurveToMesh, leaving the tube ends open. In WebXR with back-face culling enabled, the open tube interior is visible when the viewer looks along the ribbon's axis.",
      fix: "In the GN editor, select CurveToMesh and set Fill Caps to True (tick the socket's checkbox or wire a True boolean). Re-export the GLB.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Foundation — GN Curve Nodes manual: Trim Curve, Curve to Mesh, Set Curve Radius, Set Curve Tilt (CC-BY-SA 4.0)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/",
    },
    {
      label:
        "Khronos Group — glTF 2.0 Specification: KHR_mesh_quantization & vertex attribute conventions (Apache-2.0)",
      href: "https://github.com/KhronosGroup/glTF",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Points to Curves — Poi Trail & Particle Streak Ribbons (curve generation from point data)",
      href: "/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr",
    },
    {
      label:
        "GN Matrix Nodes — FK Chain Articulated Poi Staff (CurveToMesh for segmented tube prop)",
      href: "/tutorials/blender-tutorial-gn-matrix-nodes-fk-chain-articulated-poi-staff",
    },
    {
      label:
        "GN Simulation Zone — Spring-Pendulum Poi: Lissajous Light-Painting (physics-generated curve paths)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting",
    },
    {
      label:
        "Python mathutils — Hopf Fibration: Linked-Torus Light Sculpture for WebXR (multi-curve spatial arrangement)",
      href: "/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "curve-to-mesh",
      "trim-curve",
      "set-curve-tilt",
      "set-curve-radius",
      "resample-curve",
      "bezier-segment",
      "webxr",
      "glb",
      "light-painting",
      "blender-5x",
    ],
  },
  data.body,
  {
    libraryPath: data.libraryPath,
    steps: data.steps,
    finalResult: data.finalResult,
    variations: data.variations,
    troubleshooting: data.troubleshooting,
    externalLinks: data.externalLinks,
    relatedTutorials: data.relatedTutorials,
  }
);
