"""
Blueprint: Python Custom ShaderNode + NodeSocket
 — Holoflow Export Diagnostics Node for the Shader Editor
==========================================================
Blender 5.1 | CC0

Custom node types (bpy.types.ShaderNode subclasses) appear in the Shader
Editor's Add menu alongside built-in nodes and can interrogate scene data,
draw custom UI inside the node body, and expose typed sockets.  This is
fundamentally different from creating a node GROUP (ShaderNodeCustomGroup),
which merely wraps an existing tree: a bare ShaderNode subclass owns its
socket list, draw_buttons(), and logic entirely.

This blueprint registers an "HF Export Diagnostics" node that checks three
constraints the Holoflow WebXR pipeline enforces — WebP textures, valid UV
maps, and Principled BSDF usage — and exposes the results as Boolean output
sockets.  Drop the node into any material's tree for inline feedback; batch
scripts can also query the socket values to gate export automatically.

Key design choices
------------------
ShaderNode subclass, not ShaderNodeCustomGroup.
    CustomGroup wraps a group-tree; inputs/outputs mirror the group interface.
    A bare ShaderNode subclass gives independent control over socket list,
    draw_buttons(), and update() logic with zero group overhead.

draw_color() on a custom NodeSocket subclass.
    Socket pin colour is set via draw_color() — green when the check passes,
    red when it fails.  This gives status-at-a-glance in the node graph
    without reading any label text.

draw_buttons() for inline diagnostics.
    Called every time the node redraws.  We run the three checks, cache
    results on the node as BoolProperty, then display icon rows directly
    inside the node body using layout.label(icon=...).

update() for reactive behaviour.
    Blender calls update() whenever node connections change.  We push cached
    check results to output sockets here so downstream scripts can query
    node.outputs["WebP Ready"].default_value programmatically.

poll() restricts to ShaderNodeTree.
    Without poll the node would appear in the Compositor and GN editors.
    Restricting to 'ShaderNodeTree' limits it to the Shader Editor only.

nodeitems_utils.NodeCategory.
    Since Blender 2.7x, custom Add-menu categories are registered via
    nodeitems_utils.  In 4.x/5.1 this module still ships with Blender; the
    NodeCategory + NodeItem API is unchanged.

Outside sources
---------------
Blender Python API docs — bpy.types.Node, bpy.types.NodeSocket, nodeitems_utils
    CC-BY-SA-4.0 | https://docs.blender.org/api/current/bpy.types.Node.html
    Org: blender/blender, blender/blender-developer-docs

njanakiev/blender-scripting — MIT
    https://github.com/njanakiev/blender-scripting
    Sibling: njanakiev/scikit-spatial, njanakiev/python-snippets
"""

# ─── PARAMETERS ─────────────────────────────────────────────────────────────────
NODE_CATEGORY   = "Holoflow"
NODE_LABEL      = "HF Export Diagnostics"
NODE_IDNAME     = "ShaderNodeHFExportDiagnostics"
WEBP_FORMAT_ID  = "WEBP"          # bpy.types.Image.file_format value for WebP
BSDF_TYPE_ID    = "BSDF_PRINCIPLED"

import bpy
from bpy.props import BoolProperty

# ─── Custom socket: Boolean with status colour ───────────────────────────────────
class HFSocketBoolStatus(bpy.types.NodeSocket):
    """Boolean socket whose pin changes colour to reflect pass/fail state."""
    bl_idname = "HFSocketBoolStatus"
    bl_label  = "Bool Status"

    default_value: BoolProperty(default=False)  # type: ignore

    def draw(self, context, layout, node, text):
        if self.is_output or self.is_linked:
            layout.label(text=text)
        else:
            layout.prop(self, "default_value", text=text)

    def draw_color(self, context, node):
        # Green = pass, red = fail — the pin itself is the status indicator.
        # Alpha 1.0 so the colour reads even at default viewport brightness.
        return (0.0, 0.78, 0.22, 1.0) if self.default_value else (0.80, 0.12, 0.12, 1.0)


# ─── Custom node ─────────────────────────────────────────────────────────────────
class ShaderNodeHFExportDiagnostics(bpy.types.ShaderNode):
    """Inline Holoflow export-readiness check: WebP textures, UV map, Principled BSDF.

    Reads the material that owns this node tree — no inputs required.
    Output sockets expose results as Booleans for downstream scripts.
    """
    bl_idname = NODE_IDNAME
    bl_label  = NODE_LABEL
    bl_icon   = "EXPORT"
    bl_width_default = 200

    # Cached results stored as node properties (survive file save/load)
    webp_ok : BoolProperty(default=False, name="WebP Textures")   # type: ignore
    uv_ok   : BoolProperty(default=False, name="UV Map Present")  # type: ignore
    bsdf_ok : BoolProperty(default=False, name="Principled BSDF") # type: ignore

    @classmethod
    def poll(cls, ntree):
        # Restrict to Shader Editor only; GN / Compositor have their own add menus
        return ntree.bl_idname == "ShaderNodeTree"

    def init(self, context):
        """Called once when the node is dragged into a tree."""
        self.outputs.new("HFSocketBoolStatus", "WebP Ready")
        self.outputs.new("HFSocketBoolStatus", "UV Valid")
        self.outputs.new("HFSocketBoolStatus", "BSDF OK")
        self._run_checks()
        self._push_to_sockets()

    def update(self):
        """Called when any connection in the tree changes."""
        self._run_checks()
        self._push_to_sockets()

    def draw_buttons(self, context, layout):
        self._run_checks()
        self._push_to_sockets()

        col = layout.column(align=True)
        _status_row(col, "WebP textures", self.webp_ok)
        _status_row(col, "UV map linked", self.uv_ok)
        _status_row(col, "Principled BSDF", self.bsdf_ok)

        mat = self.id_data
        if mat:
            col.separator(factor=0.5)
            col.label(text=mat.name, icon="MATERIAL")

    # ── internals ───────────────────────────────────────────────────────────────
    def _run_checks(self):
        mat = self.id_data  # bpy.types.Material that owns this NodeTree
        if mat is None:
            return
        self.webp_ok = _check_webp(mat)
        self.uv_ok   = _check_uv(mat)
        self.bsdf_ok = _check_bsdf(mat)

    def _push_to_sockets(self):
        # Output socket default_value readable by Python scripts without wiring
        if len(self.outputs) < 3:
            return
        self.outputs["WebP Ready"].default_value = self.webp_ok
        self.outputs["UV Valid"].default_value   = self.uv_ok
        self.outputs["BSDF OK"].default_value    = self.bsdf_ok


def _status_row(layout, label: str, ok: bool):
    row = layout.row(align=True)
    row.label(text=label, icon="CHECKMARK" if ok else "CANCEL")


# ─── Diagnostic logic ────────────────────────────────────────────────────────────
def _check_webp(mat: bpy.types.Material) -> bool:
    """All Image Texture nodes in this material must reference WebP images."""
    if not mat.use_nodes:
        return False
    tex_nodes = [n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE"]
    if not tex_nodes:
        return False  # no textures at all is not WebP-ready
    return all(
        n.image is not None and n.image.file_format == WEBP_FORMAT_ID
        for n in tex_nodes
    )


def _check_uv(mat: bpy.types.Material) -> bool:
    """Return True when UV Map nodes are present AND linked, or absent (implicit UV)."""
    if not mat.use_nodes:
        return False
    uv_nodes = [n for n in mat.node_tree.nodes if n.type == "UVMAP"]
    # No explicit UV Map node → texture nodes use the first UV channel implicitly; OK.
    if not uv_nodes:
        return True
    # At least one explicit UV Map node must be linked downstream
    return any(n.outputs[0].is_linked for n in uv_nodes)


def _check_bsdf(mat: bpy.types.Material) -> bool:
    """At least one Principled BSDF must be linked to the Material Output."""
    if not mat.use_nodes:
        return False
    return any(
        n.type == BSDF_TYPE_ID and n.outputs[0].is_linked
        for n in mat.node_tree.nodes
    )


# ─── Add-menu category ───────────────────────────────────────────────────────────
from nodeitems_utils import NodeCategory, NodeItem  # type: ignore


class HoloflowShaderNodeCategory(NodeCategory):
    @classmethod
    def poll(cls, context):
        return context.space_data.tree_type == "ShaderNodeTree"


_NODE_CATEGORIES = [
    HoloflowShaderNodeCategory(
        "HOLOFLOW_SHADER_NODES",
        NODE_CATEGORY,
        items=[NodeItem(NODE_IDNAME)],
    ),
]

# ─── Registration ────────────────────────────────────────────────────────────────
_CLASSES = [HFSocketBoolStatus, ShaderNodeHFExportDiagnostics]


def register():
    for cls in _CLASSES:
        bpy.utils.register_class(cls)
    from nodeitems_utils import register_node_categories
    register_node_categories("HOLOFLOW_SHADER_NODES", _NODE_CATEGORIES)


def unregister():
    from nodeitems_utils import unregister_node_categories
    unregister_node_categories("HOLOFLOW_SHADER_NODES")
    for cls in reversed(_CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
    print(f"[HF] '{NODE_LABEL}' node registered — Add › {NODE_CATEGORY} › {NODE_LABEL}")
