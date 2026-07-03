import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GltfUserExtensionBody() {
  return (
    <>
      <p>
        Blender's built-in glTF 2.0 exporter exposes a hook system: subclass{" "}
        <code>bpy.types.glTF2ExportUserExtension</code> and the exporter
        discovers it automatically via <code>__subclasses__()</code> when{" "}
        <em>File {">"} Export {">"} glTF 2.0</em> runs. No monkey-patching;
        no post-process script. This tutorial wires <code>gather_node_hook</code>{" "}
        to inject <code>{"holoflow:facet"}</code> into the <code>extras</code>{" "}
        dict of every tagged mesh node so the property travels inside the{" "}
        <code>.glb</code> to Three.js as{" "}
        <code>{'mesh.userData["holoflow:facet"]'}</code>. It is the export leg
        of the pipeline that the{" "}
        <Link href="/tutorials/blender-tutorial-python-gizmo-group-custom-viewport-handle" className={lk}>
          GizmoGroup overlay
        </Link>{" "}
        and{" "}
        <Link href="/tutorials/blender-tutorial-python-workspace-tool-custom-toolbar-facet-tag" className={lk}>
          Facet Tag toolbar tool
        </Link>{" "}
        prepare in the viewport.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Extension discovery</h2>
      <p className="mt-2">
        When the glTF exporter (<code>io_scene_gltf2</code>) runs it calls{" "}
        <code>bpy.types.glTF2ExportUserExtension.__subclasses__()</code> to
        collect every registered hook, then instantiates each one for the
        duration of the export pass. Registering your subclass with{" "}
        <code>bpy.utils.register_class()</code> in your add-on's{" "}
        <code>register()</code> is all that is needed — the exporter holds no
        explicit reference to your class. Unregistering removes it from the
        list before the next export.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        <code>{`class HOLOFLOW_FacetExtrasExportHook(bpy.types.glTF2ExportUserExtension):
    ...

def register():
    if not hasattr(bpy.types, "glTF2ExportUserExtension"):
        raise RuntimeError("Enable io_scene_gltf2 first.")
    bpy.utils.register_class(HOLOFLOW_FacetExtrasExportHook)`}</code>
      </pre>

      <h2 className="mt-6 text-lg font-semibold">gather_node_hook</h2>
      <p className="mt-2">
        Called once per exported node in depth-first scene-graph order.{" "}
        <code>gltf2_node</code> is a live <code>gltf2_io.Node</code> object;
        mutate its <code>.extras</code> dict before the method returns and the
        change appears in the binary output. Read the Blender-side object via{" "}
        <code>blender_object</code> — it is <code>None</code> for auto-generated
        nodes (camera targets, joint helpers) so guard before access.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        <code>{`def gather_node_hook(self, gltf2_node, blender_object, export_settings):
    if blender_object is None:
        return
    tag = blender_object.get("holoflow:facet")
    if not tag:
        return
    if gltf2_node.extras is None:
        gltf2_node.extras = {}
    gltf2_node.extras["holoflow:facet"] = int(tag)`}</code>
      </pre>

      <h2 className="mt-6 text-lg font-semibold">All available hook methods</h2>
      <p className="mt-2">
        Beyond <code>gather_node_hook</code>, the exporter fires:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <code>gather_mesh_hook(gltf2_mesh, blender_mesh, blender_object, …)</code>{" "}
          — mesh data-block; fires once per mesh even when multiple objects share
          it (instancing); right for vertex-count metadata.
        </li>
        <li>
          <code>gather_gltf_extensions_hook(gltf2_plan, export_settings)</code>{" "}
          — fires once after all nodes; write a studio manifest to{" "}
          <code>gltf2_plan.asset.extras</code>.
        </li>
        <li>
          <code>gather_joint_hook(gltf2_node, blender_bone, blender_object, …)</code>{" "}
          — armature joints; useful for VRM constraint metadata.
        </li>
        <li>
          <code>gather_animation_hook(gltf2_animation, blender_action, …)</code>{" "}
          — animation clips; embed NLA strip names or beat markers.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">
        gather_gltf_extensions_hook — asset manifest
      </h2>
      <p className="mt-2">
        The top-level hook writes to <code>gltf2_plan.asset.extras</code>,
        which appears in the JSON as <code>asset.extras</code> — the standard
        place for per-file metadata. Use namespace-prefixed keys (
        <code>holoflow:</code>) to avoid collision with other extensions or the
        Three.js loader's own reserved fields.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        <code>{`def gather_gltf_extensions_hook(self, gltf2_plan, export_settings):
    tagged = [o.name for o in bpy.context.scene.objects
              if o.type == 'MESH' and o.get("holoflow:facet")]
    if not tagged:
        return
    if gltf2_plan.asset.extras is None:
        gltf2_plan.asset.extras = {}
    gltf2_plan.asset.extras["holoflow:studio"]        = "Holoflow Studio"
    gltf2_plan.asset.extras["holoflow:facet_objects"] = tagged`}</code>
      </pre>

      <h2 className="mt-6 text-lg font-semibold">Three.js side — reading userData</h2>
      <p className="mt-2">
        The Three.js <code>GLTFLoader</code> maps every node's{" "}
        <code>extras</code> dict directly onto <code>Object3D.userData</code>{" "}
        with no additional parsing. After load, the property is readable at{" "}
        <code>{'mesh.userData["holoflow:facet"]'}</code>. Compare with the{" "}
        <Link href="/tutorials/blender-tutorial-python-file-handler-gltf-drag-drop-extension-extractor" className={lk}>
          drag-drop extension extractor
        </Link>
        , which reads the same extras back into Blender on import, and the{" "}
        <Link href="/tutorials/blender-tutorial-python-batch-glb-exporter" className={lk}>
          batch GLB exporter
        </Link>
        , which iterates scenes and fires the exporter operator for each.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        <code>{`loader.load("scene.glb", (gltf) => {
  gltf.scene.traverse((obj) => {
    if (obj.userData["holoflow:facet"]) {
      enableFacetShader(obj);
    }
  });
});`}</code>
      </pre>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>AttributeError: glTF2ExportUserExtension</strong> — the
          built-in <em>Import-Export: glTF 2.0 format</em> add-on is disabled.
          Enable it in <em>Edit {">"} Preferences {">"} Add-ons</em>; it ships
          with Blender 5.1 and is on by default.
        </li>
        <li>
          <strong>Hook fires but extras absent in output:</strong> check that
          you assigned a new <code>dict</code> to <code>gltf2_node.extras</code>{" "}
          rather than calling <code>.update()</code> on a <code>None</code>{" "}
          attribute — that silently no-ops.
        </li>
        <li>
          <strong>Custom Properties checkbox needed?</strong> No — extras
          injected via the hook are independent of the exporter's{" "}
          <em>Include {">"} Custom Properties</em> checkbox; that checkbox
          controls automatic export of ALL custom properties, which you may
          want to leave off to avoid exporting internal bookkeeping keys.
        </li>
        <li>
          <strong>Multiple add-ons overwriting each other:</strong> each
          registered subclass runs in its own instance; they cannot overwrite
          each other's extras keys as long as key names are unique. Namespace
          all keys (<code>holoflow:</code>, <code>myapp:</code>) to stay safe.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Blender Foundation —{" "}
          <em>Import-Export: glTF 2.0 format — Extensions</em> — CC-BY
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org
          </a>
        </li>
        <li>
          Three.js — <em>GLTFLoader / userData mapping</em> — MIT —{" "}
          <a
            href="https://threejs.org/docs/#examples/en/loaders/GLTFLoader"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            threejs.org/docs
          </a>
        </li>
      </ul>
    </>
  );
}

const { entry, Instructable } = buildInstructable({
  slug: "blender-tutorial-python-gltf-user-extension-export-extras-hook",
  title: "Python glTF2ExportUserExtension — Extras Hook",
  date: "2026-07-03",
  kind: "tutorial",
  difficulty: "intermediate",
  excerpt:
    "Subclass bpy.types.glTF2ExportUserExtension to inject holoflow:facet " +
    "into glTF node.extras at export time. The exporter discovers the hook " +
    "via __subclasses__(); no monkey-patching required. Property travels " +
    "inside the .glb and maps to Three.js mesh.userData automatically.",
  body: <GltfUserExtensionBody />,
  steps: [
    {
      title: "Verify io_scene_gltf2 is enabled",
      body:
        "Edit > Preferences > Add-ons, search 'glTF 2.0'. The add-on ships " +
        "built-in and is enabled by default in Blender 5.1. Confirm " +
        "bpy.types.glTF2ExportUserExtension exists in the Python console.",
    },
    {
      title: "Subclass bpy.types.glTF2ExportUserExtension",
      body:
        "Create a class that inherits from bpy.types.glTF2ExportUserExtension. " +
        "The class name is free; the base class is what matters for discovery. " +
        "Register it with bpy.utils.register_class() in your add-on's register().",
    },
    {
      title: "Implement gather_node_hook",
      body:
        "Accept (self, gltf2_node, blender_object, export_settings). Guard " +
        "blender_object for None (auto-generated nodes pass None). Assign a " +
        "new dict to gltf2_node.extras before writing keys; never update() a None attribute.",
    },
    {
      title: "Implement gather_gltf_extensions_hook",
      body:
        "Accept (self, gltf2_plan, export_settings). Write studio metadata to " +
        "gltf2_plan.asset.extras. This fires once per export after all nodes " +
        "are processed — safe to collect the full tagged-object list here.",
    },
    {
      title: "Add N-panel toggle for rapid tagging",
      body:
        "A HOLOFLOW_PT_facet_tag_sidebar panel in bl_category = 'Holoflow' " +
        "shows per-object tag status and a one-click toggle operator. " +
        "Mirrors the approach in the N-panel sidebar tutorial.",
    },
    {
      title: "Export and inspect the GLB",
      body:
        "File > Export > glTF 2.0, format Binary (.glb). Open the output " +
        "in a glTF validator or convert to JSON with glTF-Transform. " +
        "Check nodes[i].extras for holoflow:facet and asset.extras for " +
        "the studio manifest.",
    },
    {
      title: "Read extras in Three.js",
      body:
        "GLTFLoader maps every node's extras dict directly onto " +
        "Object3D.userData. Traverse the loaded scene and branch on " +
        'obj.userData["holoflow:facet"] to enable the facet shader or ' +
        "geometry path at runtime.",
    },
    {
      title: "Scaffold the reusable macro",
      body:
        "Copy HOLOFLOW_FacetExtrasExportHook into " +
        "tools/blender-addon/holoflow_macros/gltf_extras_hook.py and " +
        "expose register_gltf_extras_hook() / unregister_gltf_extras_hook(). " +
        "Call them from the main add-on register() / unregister().",
    },
  ],
});

export { entry, Instructable };
