import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ArmatureWeightPaintBody() {
  return (
    <>
      <p>
        The moment a mesh needs to move &mdash; a character walking, an arm
        reaching, a tail swinging &mdash; the geometry has to bend with the
        skeleton rather than tearing or passing through itself. That bending
        is controlled entirely by vertex weights: a number between 0 and 1
        stored on each vertex for each bone, saying how much that bone
        influences that point. Getting those numbers right is weight painting,
        and it is the craft that separates a rigged character that feels alive
        from one that collapses into a paper bag at the shoulder.
      </p>

      <p>
        For the studio&rsquo;s pipeline, weight painting has an additional
        hard constraint that most tutorials skip: glTF and WebXR runtimes cap
        bone influences at four per vertex. Blender&rsquo;s heat-diffusion
        auto-weight solver sometimes assigns five, six, or eight influences on
        dense joints. Exporting those without running{" "}
        <em>Weights &rsaquo; Limit Total (4)</em> causes the exporter to
        silently drop the excess influences, and the deformation changes
        between Blender and the browser in ways that are difficult to diagnose.
        The blueprint here runs the cap before export as a matter of course.
      </p>

      <p>
        The rigging tutorial is a natural companion to the{" "}
        <Link href="/tutorials/blender-addon-vrm-format" className={lk}>
          VRM format add-on
        </Link>{" "}
        tutorial &mdash; VRM uses the same bones with standard names, and the
        weight-painting problems at the shoulder, hip, and finger joints are
        identical whether you are exporting VRM or plain glTF. The{" "}
        <Link href="/tutorials/blender-addon-mixamo-rig" className={lk}>
          Mixamo Rig add-on
        </Link>{" "}
        tutorial shows how to skip manual weight painting entirely using
        automated bone mapping, which is a useful contrast to the manual
        approach here. The{" "}
        <Link href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds" className={lk}>
          Cohesive low-poly cell-shaded VRM worlds
        </Link>{" "}
        article puts both in the context of the studio&rsquo;s wider aesthetic.
      </p>

      <p>
        Once the skinned mesh is exported, the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender to site asset pipeline
        </Link>{" "}
        tutorial covers loading the GLB with its skeleton intact into a WebXR
        scene, connecting it to the studio&rsquo;s animation controller, and
        verifying the deformation in the browser. This tutorial ends at the
        point the GLB file is exported with a confirmed clean shoulder.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-armature-weight-paint",
  title: "Armature setup and weight painting in Blender 5.1",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "How to rig a low-poly character in Blender 5.1 for WebXR: create a VRM-compatible four-bone armature, parent with Automatic Weights, fix the shoulder with manual weight painting, cap bone influences at four per vertex for glTF compliance, and export as a GLB with skinning intact.",
  Body: ArmatureWeightPaintBody,
  related: [
    {
      href: "/tutorials/blender-addon-vrm-format",
      label: "Tutorial — VRM format add-on",
      note: "Round-trip a .vrm avatar; the weight-painting problems are identical.",
    },
    {
      href: "/tutorials/blender-addon-mixamo-rig",
      label: "Tutorial — Mixamo Rig add-on",
      note: "Automated alternative to manual weight painting; useful contrast.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Article — Cohesive low-poly cell-shaded VRM worlds",
      note: "The art direction the rigged characters serve in the studio's scenes.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "What to do with the skinned GLB once it's exported.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/animation/armatures/index.html",
      label: "Blender Manual — Armatures (CC0)",
      note: "Complete reference for armature objects, bone types, edit/pose mode, and the relationship between armature data and mesh objects. Author: The Blender Documentation Team.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/sculpt_paint/weight_paint/index.html",
      label: "Blender Manual — Weight Paint (CC0)",
      note: "Brush settings, weight transfer, Automatic Weights, Limit Total, Normalize All, and the full weight paint tool API. Author: The Blender Documentation Team.",
    },
    {
      href: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#skinned-mesh-attributes",
      label: "glTF 2.0 Spec — Skinned Mesh Attributes (Khronos, CC0)",
      note: "The normative definition of JOINTS_0 and WEIGHTS_0 vertex attributes, including the four-influence cap that drives the Limit Total requirement.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon — three to four hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Blender 5.1 installed.",
      "Comfortable with Object Mode, Edit Mode, and the 3D viewport navigation.",
      "Has built or imported at least one mesh. The blueprint builds the mesh from scratch via Python, so you don't need a pre-existing character.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The blueprint uses BLENDER_EEVEE_NEXT for the record.py render step.",
      },
    ],
    steps: [
      {
        title: "Understand vertex groups and bone influence",
        body: "Every bone in an armature corresponds to a vertex group on the skinned mesh. The vertex group's name must exactly match the bone's name. When the bone rotates, Blender multiplies each vertex position by the bone's transformation matrix, scaled by the vertex group weight for that vertex.\n\nA weight of 1.0 means the vertex follows the bone completely. A weight of 0.0 means the bone has no effect. Vertices at a joint typically have partial weights from two bones — say 0.7 for the upper arm and 0.3 for the chest — so the joint bends smoothly between the two rigid sections.\n\nThe glTF spec stores this data in two vertex attributes: JOINTS_0 (four bone indices) and WEIGHTS_0 (four influence values that sum to 1.0). This four-influence cap means Blender's vertex groups must be trimmed to at most four active bones per vertex before export. The blueprint runs Weights > Limit Total (4) and then Normalize All to enforce this.",
      },
      {
        title: "Create the armature with VRM-compatible bone names",
        body: "Add > Armature (or run the blueprint.py script which builds it via the bpy API). The armature in this tutorial has four bones: Hips, Spine, Chest, and UpperArm.R.\n\nThe names follow VRM 1.0's humanoid bone name spec. This matters because the VRM format add-on maps bones to the humanoid skeleton by name. If you name them Hips, Spine, Chest, UpperArm.R you can import the exported GLB directly into the VRM pipeline without renaming. The VRM spec's full bone list: hips, spine, chest, upperChest (optional), neck, head, leftEye, rightEye, jaw, then the four limbs — leftUpperArm / leftLowerArm / leftHand, and the right-side equivalents, then legs.\n\nIn Edit Mode (Tab with the armature selected) you can rename bones in the Bone Properties panel. Each bone has a Head and Tail point. The parent–child relationship is set by clicking 'Parent' in the Bone Properties and optionally enabling 'Connected' (tail of parent snaps to head of child) for a connected chain.",
      },
      {
        title: "Configure the armature: envelopes off, vertex groups on",
        body: "Select the mesh object. Open the Modifier Properties (wrench icon). Find the Armature modifier — Blender adds it automatically when you parent with Automatic Weights.\n\nSet 'Use Bone Envelopes' to OFF. Bone envelopes are a second influence system where each bone defines a capsule-shaped volume, and any vertex inside that volume is influenced by the bone based on distance. Envelopes conflict with vertex groups and produce unpredictable blending at joints — Blender ends up combining both systems. Always disable envelopes when using vertex groups.\n\nSet 'Use Vertex Groups' to ON (it is on by default after an Automatic Weights parent; this step confirms it).\n\nConsider enabling 'Preserve Volume' (listed as 'Dual Quat' in older Blender docs). This switches the blend mode from linear skin blending to dual-quaternion blending, which prevents the 'candy-wrapper' twist artifact you see when a forearm rotates more than 180° — the torso geometry around the shoulder twists in on itself with linear blending but stays clean with dual-quaternion.",
      },
      {
        title: "Parent with Automatic Weights",
        body: "Select the mesh, then Shift-click the armature, then Ctrl+P > With Automatic Weights.\n\nBlender runs a heat-diffusion solver across the mesh surface. It finds each bone, uses the bone as a heat source, and measures how easily heat propagates from that bone to each vertex — vertices separated from a bone by other geometry receive less heat, so get lower weights. The result is an initial weight map that usually works well for cylindrical limbs but poorly at overlapping geometry (shoulders, hips, fingers).\n\nIf you are running the blueprint.py script, the parent_set call does the same thing: bpy.ops.object.parent_set(type='ARMATURE_AUTO'). Note the context requirement: the armature must be the active object and the mesh must also be selected. The script handles this explicitly.",
      },
      {
        title: "Inspect and correct weights in Weight Paint mode",
        body: "Select the mesh object. Ctrl+Tab (or the mode dropdown) > Weight Paint. The mesh displays the auto-generated weights as a heat map: red (1.0), yellow/green (0.5), blue (0.0).\n\nIn the N panel (press N to open the side panel), under Item > Vertex Groups, the dropdown shows all vertex groups. Select 'UpperArm.R' to display that bone's influence map. You should see the arm stub red and the torso blue or very light. If the torso near the shoulder is yellow or orange, the auto-weights are bleeding into the torso — that bone will drag torso vertices when the arm moves.\n\nTo fix: in the Brush settings (left side panel or N > Tool), set Weight to 0.0 and Blend Mode to 'Subtract'. Paint over the orange-tinted torso vertices with a medium-radius brush. The colour shifts toward blue, reducing the arm bone's influence.\n\nThen select the 'Chest' vertex group and confirm those same vertices are well-weighted to the Chest — they should be red or orange. If you subtracted too aggressively and the chest weights dropped too, paint them back up with Weight = 0.8 and Blend Mode = 'Add'.",
      },
      {
        title: "Limit to four bone influences per vertex",
        body: "Switch back to Object Mode. With the mesh selected, go to: Object Data Properties (the green vertex/triangle icon) > Vertex Groups > Weights menu (the dropdown next to the + and - buttons) > Limit Total.\n\nSet Subset to 'All Groups' and Limit to 4. Click OK.\n\nThen run Weights > Normalize All. This re-scales all remaining weights so they sum to 1.0 per vertex (the limit operation may have dropped a weight that was contributing to the sum).\n\nWhy this matters: the glTF WEIGHTS_0 vertex attribute only has four slots. If a vertex has five bone influences in Blender, the exporter picks the four strongest and discards the fifth. The discarded influence's weight redistributes to nothing — it does not add to the remaining four. The deformation in the browser is therefore different from the Blender preview in a way that is invisible until you see the character move. Running Limit Total before export makes Blender and the browser agree.",
      },
      {
        title: "Test-pose and export",
        body: "Select the armature. Ctrl+Tab > Pose Mode. Select the UpperArm.R bone. Press R, Y, -90, Enter to rotate it 90° downward (the arm should raise in front of the character). Check the shoulder: does the torso stay clean? Do any unexpected vertices drag along?\n\nIf you see shoulder bleed-through, switch back to the mesh's Weight Paint mode and continue refining. Return to Pose Mode to test again. Undo the pose before exporting (Ctrl+Z in Pose Mode, or pose the bones back to 0°).\n\nTo export: select both the mesh and the armature (Shift+click), then File > Export > glTF 2.0. In the export panel: Format = GLB, Include > Skin = ticked, Animations = unticked (unless you have baked animation data), Normals = ticked, +Y Up = ticked, Apply Modifiers = ticked.\n\nVerify the GLB opens correctly in a browser viewer (gltf-viewer.donmccurdy.com). Drag the model to rotate. Verify the skeleton is included (most viewers show bone overlays if you look for a 'skeleton' toggle).",
      },
    ],
    finalResult:
      "A low-poly torso with a shoulder-arm rig, clean auto-weights corrected by manual painting, bone influences capped at four per vertex, and a GLB that opens in WebXR runtimes with the correct skinning data. The pattern scales to a full humanoid character — add bones for each limb segment and repeat the weight-paint cycle at each new joint.",
    variations: [
      "Add a second arm (UpperArm.L) and mirror the weights using Weights > Copy Vertex Group then renaming, or use Weights > Mirror to transfer the R-side weights to the L-side automatically.",
      "Add a LowerArm.R bone as a child of UpperArm.R and weight the wrist area. The elbow joint needs the same shoulder correction technique — blue the torso from the lower-arm group, ensure the upper-arm/lower-arm boundary is cleanly weighted.",
      "Replace the box mesh with a sculpted or imported character mesh. The same auto-weight + paint cycle applies regardless of mesh complexity; the only difference is the heat-diffusion pass takes longer on dense meshes.",
    ],
    troubleshooting: [
      {
        symptom: "Mesh does not deform when the bone is moved in Pose Mode",
        cause: "The Armature modifier is not on the mesh, or use_vertex_groups is off.",
        fix: "Check the mesh's Modifier Properties for an Armature modifier. If missing, add one manually and set the Object field to the armature object. Confirm Use Vertex Groups is ticked.",
      },
      {
        symptom: "Weight Paint mode shows all grey — no colours on the mesh",
        cause: "No vertex group is active in the Vertex Groups list.",
        fix: "Select a vertex group name in the N panel > Item > Vertex Groups dropdown. The heat map appears when a group is active.",
      },
      {
        symptom: "GLB deformation differs from Blender preview at the shoulder",
        cause: "One or more vertices had more than four bone influences and the exporter dropped the excess.",
        fix: "Run Weights > Limit Total (4) then Weights > Normalize All on the mesh in Object Mode, then re-export. Also verify with Mesh Analysis overlay (Overlays dropdown > Mesh Analysis > Weight) that no vertex shows a weight sum below 1.0.",
      },
      {
        symptom: "Candy-wrapper twist at the shoulder when the arm rotates past 90°",
        cause: "The Armature modifier is using linear blend skinning (the default).",
        fix: "In the Armature modifier, enable Preserve Volume (dual-quaternion blend mode). This prevents the cylindrical twist that linear skinning produces at joints that rotate more than 90°.",
      },
    ],
  },
  base,
);
