import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnFilletCurveNeonSignBody() {
  return (
    <>
      <p>
        <strong>Fillet Curve</strong> inserts a circular arc at every corner of
        a spline — turning sharp kinks into smooth rounded bends. BEZIER mode
        generates proper bezier handles at each arc; POLY mode subdivides around
        the corner with straight segments. The difference shows dramatically
        when you sweep a tube profile along the curve: BEZIER produces a
        silky continuous silhouette, POLY produces a faceted ring of flat
        panels. This tutorial builds a hexagonal star sign — 12 corners,
        alternating spikes and valleys — then rounds every kink with Fillet
        Curve, resamples the result to uniform points, and sweeps a small circle
        profile through it to produce a closed neon-tube loop ready for WebXR.
      </p>

      <h2>BEZIER mode needs a downstream Resample</h2>
      <p>
        This is the subtlety that trips people up. BEZIER mode works on{" "}
        <em>evaluated curve segments</em>, not on the discrete control points
        you see in the editor. The smooth arc exists in the{" "}
        <code>EVALUATED</code> data that Blender computes internally. If you
        wire Fillet Curve directly into Curve to Mesh without resampling, the
        tube follows the original polyline handle-to-handle — the arc does not
        appear in the mesh. Inserting{" "}
        <strong>Resample Curve (COUNT mode, 160 points)</strong> after Fillet
        collapses the evaluated arc into explicit polyline vertices that Curve
        to Mesh can sweep. POLY mode does not have this requirement because it
        writes its subdivisions as actual control points.
      </p>

      <h2>Fillet radius vs star geometry</h2>
      <p>
        The star here has 6 outer points (Outer Radius = 1.0) and 6 inner
        valleys (Inner Radius = 0.42). The shortest edge on the star is the
        inner valley side — approximately 0.44 world units. Fillet Curve&apos;s{" "}
        <code>Clamped</code> input (set to True) prevents the arc from
        exceeding half the edge length on either side, so the rounding stays
        physically plausible. At Fillet_Radius = 0.22 the inner valleys become
        soft U-shapes rather than V-kinks; the outer spikes stay sharp because
        their adjacent edges are long enough that 0.22 is a small fraction. At
        0.44 (the clamped maximum) all 12 corners are fully rounded. Drag the
        modifier panel slider to see the transition live in the 3D viewport.
      </p>

      <h2>Tube cross-section: octagonal for WebXR</h2>
      <p>
        The profile circle uses <code>Resolution = 8</code> (octagonal). A true
        circle (32+ segments) produces no visible improvement at the scale of a
        0.028-unit tube radius in a WebXR scene, but triples the triangle count.
        Eight sides is the studio&apos;s default for thin tube geometry — it
        looks circular from any distance beyond 0.5 m and exports as a
        lightweight Draco-compressed GLB. Compare with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh"
          className={lk}
        >
          the Curve to Mesh tutorial
        </Link>{" "}
        which covers profile resolution choices in detail.
      </p>

      <h2>Emissive material + EEVEE Bloom</h2>
      <p>
        The neon material mixes a Principled BSDF (Base Color = hot pink,
        Roughness = 0.35) with a flat Emission node at Strength = 8.0 through a
        Mix Shader (Fac = 0.6). In EEVEE Next with Bloom enabled, the high
        emission value bleeds a halo onto the dark background — exactly the neon
        sign look. Bloom Intensity = 0.15 and Radius = 6.0 keep it soft rather
        than blown-out. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel shader
        </Link>{" "}
        for the same emission strategy applied to a full toon pipeline.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-fillet-curve-neon-sign",
  title: "GN Fillet Curve — Procedural Rounded-Corner Neon Star Sign",
  date: "2026-06-03",
  kind: "tutorial",
  excerpt:
    "Use the Fillet Curve node (BEZIER mode) to round the 12 corners of a hexagonal star, resample the evaluated arc, and sweep a tube profile through it for a neon-sign loop — plus the critical detail about why Resample Curve is non-optional after BEZIER mode.",
  Body: GnFilletCurveNeonSignBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    goal: "A neon star sign mesh with smooth rounded corners, emissive material, and EEVEE Bloom, exported as a Draco GLB.",
    supplies: {
      materials: [
        { name: "Blender 5.1" },
        { name: "neon_sign.blend (generated by blueprint.py)" },
      ],
      tools: [
        { name: "Geometry Nodes editor" },
        { name: "Shader editor" },
        { name: "EEVEE Next renderer" },
        { name: "bpy (for blueprint.py)" },
      ],
    },
    steps: [
      {
        title: "Create the hexagonal star primitive",
        body: "Add a Geometry Nodes modifier to a Plane. Inside the GN tree, add GeometryNodeCurvePrimitiveStar: Points=6, Outer Radius=1.0, Inner Radius=0.42, Twist=0.0. This gives a closed polyline with 12 corners — 6 outer spikes (obtuse) and 6 inner valleys (acute). The inner valley corners are the dramatic ones that Fillet will round.",
      },
      {
        title: "Add Fillet Curve in BEZIER mode",
        body: "Add GeometryNodeFilletCurve. Set mode='BEZIER', Count=4, Clamped=True. Wire Star.Curve → Fillet.Curve. Add a group input socket 'Fillet_Radius' (float, 0.001–1.0, default 0.22) and wire it to Fillet.Radius. In BEZIER mode, Count controls how many bezier segments make up each corner arc — 4 is smooth enough for a tube at this scale.",
      },
      {
        title: "Resample after Fillet (non-optional in BEZIER mode)",
        body: "Add GeometryNodeResampleCurve, mode='COUNT'. Wire Fillet.Curve → Resample.Curve. Add group socket 'Resample_Count' (int, 32–512, default 160) and wire to Resample.Count. Without this node, Curve to Mesh ignores the BEZIER arcs — you get the original polyline. Set 160 for smooth silhouette; drop to 32 to see the faceting that reveals why resampling matters.",
      },
      {
        title: "Sweep the tube profile",
        body: "Add GeometryNodeCurvePrimitiveCircle (Resolution=8, Radius=Tube_Radius). Add group socket 'Tube_Radius' (float, 0.005–0.15, default 0.028). Add GeometryNodeCurveToMesh, Fill Caps=True. Wire Resample.Curve → CurveToMesh.Curve and Circle.Curve → CurveToMesh.Profile Curve. Add GeometryNodeSetShadeSmooth (domain=FACE, Shade Smooth=True). The resulting tube has no seam and minimal triangle count.",
      },
      {
        title: "Build the emissive neon material",
        body: "Create a material 'neon_emissive_mat'. Add Principled BSDF (Base Color=#ff0880, Roughness=0.35) and Emission (Color=#ff0880, Strength=8.0). Mix via Mix Shader (Fac=0.6). Wire Mix → Output Material. Back in GN, add GeometryNodeSetMaterial and assign this material. In EEVEE Next scene settings, enable Bloom (Intensity=0.15, Radius=6.0).",
      },
      {
        title: "Export to GLB",
        body: "Apply the modifier (Object → Apply → Visual Geometry to Mesh) or use export_apply=True in the gltf exporter. File → Export → glTF 2.0: format=GLB, Apply Modifiers=on, Draco compression level 6, Image Format=WebP. The closed neon loop is a single mesh with ~2 600 triangles — well within WebXR budget. The root object name uses snake_case per studio convention.",
      },
    ],
    finalResult:
      "A .blend with a live GN modifier: drag Fillet_Radius to watch 12 kinks round into smooth arcs in real time. A EEVEE scene with Bloom rendering the hot-pink tube as a genuine neon glow. A Draco-compressed GLB under 80 KB, ready for Three.js or WebXR delivery.",
    variations: [
      "Double-ring sign: duplicate the neon_sign_star object, scale to 0.7×, and use the same material. In the GN tree, add a second Star node (Points=6, smaller) and merge the two Curve to Mesh outputs with Join Geometry before SetMaterial. Two concentric star loops with independent Fillet_Radius sliders.",
      "Animated radius: keyframe Fillet_Radius from 0.0 → 0.42 → 0.0 over 60 frames. The star morphs from angular to soft and back. Export as animated GLB — the morph works cleanly because Resample_Count is fixed so the vertex count never changes between frames.",
      "Letter neon: replace the Star node with a custom curve drawn in the viewport (Bézier Curve object, converted to polyline via Object → Convert → Mesh, then back to Curve). Wire the custom curve object into the GN tree via Object Info → Geometry. Fillet rounds every drawn corner into a smooth arc. The result is a custom-letter neon sign with live corner-rounding control.",
    ],
    troubleshooting: [
      {
        symptom: "Tube follows the original star polyline — no rounding visible",
        cause:
          "Missing Resample Curve after Fillet Curve in BEZIER mode. BEZIER arcs exist only in evaluated data; without resampling, Curve to Mesh sweeps the original control-point polyline.",
        fix: "Add GeometryNodeResampleCurve (mode='COUNT') between FilletCurve.outputs['Curve'] and CurveToMesh.inputs['Curve']. Set Count ≥ 64. The rounding immediately appears in the mesh.",
      },
      {
        symptom: "Arcs overlap at inner valley corners when Fillet_Radius is high",
        cause:
          "Clamped is False, so the arc radius exceeds half the adjacent edge length and the two arcs on either side of the valley collide.",
        fix: "Set FilletCurve.inputs['Clamped'].default_value = True. Clamped mode automatically reduces the arc radius to fit without overlap — you get the maximum possible rounding rather than geometry corruption.",
      },
      {
        symptom: "No bloom glow in the viewport render",
        cause:
          "EEVEE Bloom is disabled. In Blender 5.1 EEVEE Next, Bloom is off by default and must be enabled per-scene.",
        fix: "Properties → Render → Bloom → enable. Set Intensity = 0.15, Radius = 6.0. In the Shader editor, confirm Emission Strength ≥ 4.0 — EEVEE Next requires a strength above ~2.0 for Bloom to trigger visibly on small geometry.",
      },
    ],
  },
  base,
);
