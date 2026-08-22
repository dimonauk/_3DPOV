import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AddonPreferencesKeymapBody() {
  return (
    <>
      <p>
        Every Blender add-on eventually needs two things that{" "}
        <Link href="/tutorials/blender-tutorial-python-addon-custom-panel-property-group" className={lk}>
          scene custom properties and N-panel operators
        </Link>{" "}
        cannot provide: settings that survive blend-file changes, and keyboard
        shortcuts the user can rebind without touching your source code.{" "}
        <code>bpy.types.AddonPreferences</code> solves the first problem;{" "}
        <code>wm.keyconfigs.addon</code> solves the second. Together they are the
        contract between a Blender add-on and its user — one declaring what can
        be configured, the other declaring how it is invoked.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        AddonPreferences vs scene custom properties
      </h2>
      <p className="mt-2">
        Scene custom properties (set via <code>obj["key"] = value</code> or a{" "}
        <code>bpy.props.*</code> on a <code>PropertyGroup</code>) belong to the
        data-block they sit on. They travel with the <code>.blend</code> file —
        right for per-project settings like "which collection to export", wrong
        for per-user settings like "which compression level I prefer". Addon
        preferences live in the user config directory alongside themes and
        keymaps, and survive every blend reload and Blender restart. The
        distinction mirrors the{" "}
        <Link href="/tutorials/blender-tutorial-python-library-link-append-blend-files" className={lk}>
          library linking system
        </Link>
        : data that belongs to a project stays in the project file; data that
        belongs to the user stays in user config.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Subclassing AddonPreferences
      </h2>
      <p className="mt-2">
        The <code>bl_idname</code> must exactly match the Python module{" "}
        <code>__name__</code>. Blender looks up preferences by that string when
        you call{" "}
        <code>bpy.context.preferences.addons["module_name"].preferences</code>.
        All props are declared as class-level annotations — the same{" "}
        <code>bpy.props.*</code> you would use on a{" "}
        <code>PropertyGroup</code>, with the same <code>name</code>,{" "}
        <code>description</code>, <code>default</code>, and{" "}
        <code>subtype</code> arguments:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`class HOLOFLOW_Preferences(bpy.types.AddonPreferences):
    bl_idname = __name__   # must match the module name exactly

    export_root: bpy.props.StringProperty(
        name="Export Root",
        subtype='DIR_PATH',
        default="//holoflow_out",
    )
    draco_level: bpy.props.IntProperty(
        name="Draco Compression",
        min=0, max=10, default=6,
    )
    webp_textures: bpy.props.BoolProperty(
        name="WebP Textures", default=True,
    )

    def draw(self, context):
        layout = self.layout
        box = layout.box()
        box.label(text="Output", icon='EXPORT')
        col = box.column(align=True)
        col.prop(self, "export_root")
        col.prop(self, "draco_level", slider=True)
        col.prop(self, "webp_textures")`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Reading preferences at runtime
      </h2>
      <p className="mt-2">
        Any operator, panel, or draw function can read preferences without an
        import or a global — Blender's preferences system is a global registry:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`def get_prefs():
    return bpy.context.preferences.addons[__name__].preferences

class HOLOFLOW_OT_quick_webxr_export(bpy.types.Operator):
    def execute(self, context):
        prefs    = get_prefs()
        abs_root = bpy.path.abspath(prefs.export_root)
        bpy.ops.export_scene.gltf(
            filepath=os.path.join(abs_root, "scene.glb"),
            export_draco_mesh_compression_enable=prefs.draco_level > 0,
            export_draco_mesh_compression_level=prefs.draco_level,
            export_image_format='WEBP' if prefs.webp_textures else 'AUTO',
        )
        return {'FINISHED'}`}
      </pre>
      <p className="mt-2">
        The{" "}
        <Link href="/tutorials/blender-tutorial-python-batch-glb-exporter" className={lk}>
          batch GLB exporter
        </Link>{" "}
        and the{" "}
        <Link href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook" className={lk}>
          glTF extras hook
        </Link>{" "}
        both hardcode their export parameters — adding a{" "}
        <code>get_prefs()</code> call there removes the need to edit source
        between projects.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        KeyMap registration — the addon keyconfig
      </h2>
      <p className="mt-2">
        Blender maintains three keyconfig layers:{" "}
        <strong>default</strong> (factory, read-only),{" "}
        <strong>user</strong> (Edit &gt; Preferences &gt; Keymap overrides), and{" "}
        <strong>addon</strong> (what add-ons register). Registering to the addon
        layer means the factory map is never touched, the user can inspect or
        rebind the shortcut in the Keymap editor, and your{" "}
        <code>unregister()</code> can cleanly remove it:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`_keymap_items = []   # module-level list; survives function calls

def _register_keymap():
    wm = bpy.context.window_manager
    kc = wm.keyconfigs.addon   # ← addon layer, not default or user
    if not kc:
        return  # headless / background — no window manager

    km  = kc.keymaps.new(name='3D View', space_type='VIEW_3D')
    kmi = km.keymap_items.new(
        idname='holoflow.quick_webxr_export',
        type='E', value='PRESS',
        ctrl=True, shift=True,
    )
    kmi.active = True
    _keymap_items.append((km, kmi))

def _unregister_keymap():
    for km, kmi in _keymap_items:
        try:
            km.keymap_items.remove(kmi)
        except ReferenceError:
            pass
    _keymap_items.clear()

def register():
    bpy.utils.register_class(HOLOFLOW_Preferences)
    bpy.utils.register_class(HOLOFLOW_OT_quick_webxr_export)
    _register_keymap()   # ← after registering the operator

def unregister():
    _unregister_keymap() # ← BEFORE unregistering the operator
    bpy.utils.unregister_class(HOLOFLOW_OT_quick_webxr_export)
    bpy.utils.unregister_class(HOLOFLOW_Preferences)`}
      </pre>
      <p className="mt-2">
        The order matters: unregister the keymap items{" "}
        <em>before</em> unregistering the operator class they reference.
        Reversing this order leaves dangling pointers that Blender logs as
        warnings and can cause instability on add-on reload. The same
        principle applies to the{" "}
        <Link href="/tutorials/blender-tutorial-python-gizmo-group-custom-viewport-handle" className={lk}>
          GizmoGroup
        </Link>{" "}
        and{" "}
        <Link href="/tutorials/blender-tutorial-python-workspace-tool-custom-toolbar-facet-tag" className={lk}>
          WorkSpaceTool
        </Link>{" "}
        systems — always unregister dependents before their targets.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Pitfalls and failure modes
      </h2>
      <p className="mt-2">
        <strong>Wrong bl_idname.</strong> If <code>bl_idname</code> does not
        match the module <code>__name__</code>, Blender registers the class
        but{" "}
        <code>preferences.addons["wrong_name"].preferences</code> raises a{" "}
        <code>KeyError</code>. When running <code>blueprint.py</code> directly
        from the Text Editor (not as an installed add-on),{" "}
        <code>__name__</code> equals <code>"__main__"</code> — so{" "}
        <code>bl_idname = "__main__"</code> is correct for that context.
        Production add-ons installed via Preferences &gt; Add-ons get the real
        module name.
      </p>
      <p className="mt-2">
        <strong>Headless / background mode.</strong>{" "}
        <code>wm.keyconfigs.addon</code> is <code>None</code> when Blender runs
        with <code>--background</code>. Always guard with{" "}
        <code>if not kc: return</code> before calling{" "}
        <code>kc.keymaps.new()</code>.
      </p>
      <p className="mt-2">
        <strong>Storing items globally.</strong> The{" "}
        <code>_keymap_items</code> list must live at module scope, not inside{" "}
        <code>register()</code>. Python garbage-collects local lists; a locally
        scoped list would be empty by the time <code>unregister()</code> runs.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Export root as a DIR_PATH property
      </h2>
      <p className="mt-2">
        <code>subtype='DIR_PATH'</code> on a <code>StringProperty</code> adds a
        folder-picker button next to the field in the prefs UI and sets the
        widget to validate the string as a filesystem path. Blender{" "}
        <strong>does not</strong> resolve it automatically — call{" "}
        <code>bpy.path.abspath(prefs.export_root)</code> before passing the path
        to any <code>os.*</code> function or operator. The <code>//</code> prefix
        means "relative to the current .blend file", matching the same convention
        used by texture image paths and the holoflow exporter's output directory.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Applying to the Holoflow add-on
      </h2>
      <p className="mt-2">
        The <code>holoflow_webxr_exporter</code> add-on at{" "}
        <code>tools/blender-addon/</code> currently hardcodes Draco level 6 and
        WebP textures. Replacing those constants with{" "}
        <code>get_prefs().draco_level</code> and{" "}
        <code>get_prefs().webp_textures</code> lets Dimona change compression
        per-machine (high Draco on fast hardware, lower on older devices) without
        touching the add-on source — the preference persists across all projects
        on that machine.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-addon-preferences-keymap-hotkey-exporter",
  title:
    "Python bpy.types.AddonPreferences + KeyMap — Persistent Config Panel & Hotkey for the Holoflow Exporter",
  lead: "Store per-user export settings that survive .blend reloads, display them in Edit > Preferences, and register a Ctrl+Shift+E hotkey that respects those settings — all cleanly unregistered on add-on disable.",
  date: "2026-07-03",
  tags: ["blender", "python", "scripting", "addon", "keymap", "webxr"],
  body: <AddonPreferencesKeymapBody />,
  blendFile:
    "public/library/blends/scripting/python-addon-preferences-keymap-hotkey-exporter/blueprint.py",
  externalLinks: [
    {
      label: "Blender API — bpy.types.AddonPreferences",
      href: "https://docs.blender.org/api/current/bpy.types.AddonPreferences.html",
    },
    {
      label: "Blender API — bpy.types.KeyMap",
      href: "https://docs.blender.org/api/current/bpy.types.KeyMap.html",
    },
  ],
});
