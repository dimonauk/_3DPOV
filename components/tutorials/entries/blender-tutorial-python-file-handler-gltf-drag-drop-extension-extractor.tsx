import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every <code>.glb</code> file is a JSON document wrapped in a binary
        envelope. The glTF spec reserves an <code>extras</code> dict on every
        node and mesh for arbitrary producer metadata. Holoflow&apos;s{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          WebXR export pipeline
        </Link>{" "}
        writes <code>holoflow:facet</code>, <code>holoflow:tag</code>, and{" "}
        <code>holoflow:lod</code> into those extras. The problem: Blender&apos;s
        built-in glTF importer silently discards all extras. This tutorial fixes
        that with <code>bpy.types.FileHandler</code>, a Blender 5.x API that
        intercepts OS drag-drop events before the standard importer runs.
      </p>

      <h2>FileHandler vs a plain Operator</h2>
      <p>
        Prior to Blender 4.1, handling drag-drop required a menu-triggered
        operator and <code>wm.call_fileselect</code> — the user always had to
        open File &gt; Import manually. <code>bpy.types.FileHandler</code> is
        the modern pattern: the framework calls your operator&apos;s{" "}
        <code>execute()</code> directly when a matching file extension is
        dropped onto a registered area, injecting <code>filepath</code>{" "}
        automatically. Paired with an ordinary{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group"
          className={lk}
        >
          Operator + Panel
        </Link>
        , it gives you a complete drag-drop import workflow.
      </p>

      <h2>Minimum FileHandler class</h2>
      <pre>{`class HF_FH_import_studio_glb(bpy.types.FileHandler):
    bl_idname          = "HF_FH_import_studio_glb"
    bl_label           = "Holoflow GLB Extension Extractor"
    bl_import_operator = "hf.import_studio_glb"   # operator bl_idname
    bl_file_extensions = ".glb;.gltf"             # semicolon-separated

    @classmethod
    def poll_drop(cls, context):
        return (context.area is not None
                and context.area.type == "VIEW_3D")`}</pre>
      <p>
        <code>poll_drop</code> must be scoped to a sensible area type.
        Returning <code>True</code> unconditionally activates the handler in
        the Timeline, Shader Editor, and Preferences — any drag past those
        windows imports the file.
      </p>

      <h2>Parsing the GLB binary JSON chunk</h2>
      <p>
        A <code>.glb</code> v2 file: 12-byte header (<code>magic</code>,{" "}
        <code>version=2</code>, <code>length</code>), then chunks. Chunk 0 is
        always the JSON payload (type <code>0x4E4F534A</code>). Read it with{" "}
        <code>struct</code> (stdlib, safe in Blender&apos;s interpreter) before
        calling the importer — extras are in hand before any scene objects
        exist:
      </p>
      <pre>{`import struct, json

GLB_MAGIC  = 0x46546C67   # 'glTF' little-endian
JSON_CHUNK = 0x4E4F534A   # 'JSON' little-endian

def read_glb_json(filepath):
    with open(filepath, "rb") as fh:
        magic, version, _ = struct.unpack_from("<III", fh.read(12), 0)
    if magic != GLB_MAGIC or version != 2:
        return json.loads(open(filepath).read())  # .gltf text fallback
    with open(filepath, "rb") as fh:
        fh.seek(12)
        chunk_len, chunk_type = struct.unpack("<II", fh.read(8))
        raw = fh.read(chunk_len)
    return json.loads(raw.decode("utf-8").rstrip())`}</pre>

      <h2>Extracting and injecting extras</h2>
      <p>
        Walk the parsed dict over <code>&quot;nodes&quot;</code> and{" "}
        <code>&quot;meshes&quot;</code> arrays, collecting each{" "}
        <code>extras</code> dict keyed by name. After the glTF import, match
        names against <code>context.selected_objects</code>:
      </p>
      <pre>{`for obj in context.selected_objects:
    candidates = [obj.name, obj.data.name if obj.data else ""]
    for candidate in candidates:
        if candidate in extras_map:
            for raw_key, value in extras_map[candidate].items():
                prop_key = "hf:" + raw_key.lstrip("holoflow:")
                if isinstance(value, (str, int, float, bool)):
                    obj[prop_key] = value
            break`}</pre>
      <p>
        Prefix keys with <code>hf:</code> — shorter than the raw{" "}
        <code>holoflow:facet</code> key and visually groups all studio-origin
        properties in the N-panel Custom Properties section.
      </p>

      <h2>Operator: single-file and multi-file drops</h2>
      <pre>{`class HF_OT_import_studio_glb(bpy.types.Operator):
    bl_idname  = "hf.import_studio_glb"
    bl_label   = "Import Studio GLB"
    bl_options = {"REGISTER", "UNDO"}

    filepath:    bpy.props.StringProperty(subtype="FILE_PATH")
    directory:   bpy.props.StringProperty(subtype="DIR_PATH")
    files:       bpy.props.CollectionProperty(
                     type=bpy.types.OperatorFileListElement)
    filter_glob: bpy.props.StringProperty(
                     default="*.glb;*.gltf", options={"HIDDEN"})

    def execute(self, context):
        paths = ([self.directory + f.name for f in self.files
                  if f.name.endswith((".glb", ".gltf"))]
                 if self.files and self.directory else [self.filepath])
        for path in paths:
            extras_map = collect_extras(read_glb_json(path))
            bpy.ops.object.select_all(action="DESELECT")
            bpy.ops.import_scene.gltf(filepath=path)
            apply_extras(extras_map, context.selected_objects)
        return {"FINISHED"}

    def invoke(self, context, event):
        # FileHandler drag-drop bypasses invoke; menu use hits this branch.
        if not self.filepath and not self.files:
            context.window_manager.fileselect_add(self)
            return {"RUNNING_MODAL"}
        return self.execute(context)`}</pre>

      <h2>Round-trip with the Batch GLB Exporter</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Batch GLB Exporter
        </Link>{" "}
        tutorial writes one <code>.glb</code> per selected object, embedding
        extras via the exporter&apos;s <code>export_extras=True</code> flag.
        This FileHandler is the reciprocal read path — whatever the batch
        exporter writes survives as <code>hf:</code> custom properties after
        re-import. Use it for asset QA to confirm the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          PBR material extras
        </Link>{" "}
        round-trip cleanly alongside geometry metadata.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No properties after drop.</strong> The source .glb may have
          been exported without <code>export_extras=True</code>. Inspect the
          JSON chunk in{" "}
          <a
            href="https://gltf.report/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            gltf.report
          </a>{" "}
          — look for <code>&quot;extras&quot;</code> on node/mesh entries.
        </li>
        <li>
          <strong>Handler not triggered.</strong> Confirm registration:{" "}
          <code>bpy.context.window_manager.filehandlers</code> must list{" "}
          <code>HF_FH_import_studio_glb</code>. Drop zone must be the 3D
          Viewport.
        </li>
        <li>
          <strong>import_scene.gltf not found.</strong> The glTF 2.0 add-on
          ships as a Blender Extension in 5.x — confirm it is enabled in
          Preferences &gt; Add-ons. See{" "}
          <Link
            href="/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export"
            className={lk}
          >
            Depsgraph GLB Export
          </Link>{" "}
          for operator availability checks.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.FileHandler.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender 5.1 API — bpy.types.FileHandler
          </a>{" "}
          (Blender Documentation Team · CC-BY-SA-4.0). Canonical reference for{" "}
          <code>poll_drop</code>, <code>bl_import_operator</code>, and{" "}
          <code>bl_file_extensions</code> semantics. Related:{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.Operator.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bpy.types.Operator
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Tutorials/blob/main/gltfTutorial/gltfTutorial_002_BasicGltfStructure.md"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            KhronosGroup/glTF-Tutorials — Basic glTF Structure
          </a>{" "}
          (Khronos Group · CC-BY-4.0). Authoritative byte-level GLB container
          layout including JSON chunk alignment padding. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Sample-Assets
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (Nicolas Janakiev · MIT). Reference collection of bpy scripts covering
          operator property declaration patterns used throughout this tutorial.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-file-handler-gltf-drag-drop-extension-extractor",
  title:
    "Python bpy.types.FileHandler — GLB Drag-Drop Extension Extractor (Blender 5.1)",
  lead: "Register a Blender 5.x FileHandler so dragging a .glb onto the 3D Viewport auto-imports it and parses holoflow: extras from the binary JSON chunk — no third-party libraries, no menu required.",
  publishedAt: "2026-07-02",
  tags: ["blender", "python", "scripting", "gltf", "webxr", "pipeline"],
  body: Body,
});
