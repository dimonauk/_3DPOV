"""
GN Viewer Node — Field Inspection & Real-Time Attribute Debugging (Blender 5.1)

TECHNIQUE: GeometryNodeViewer feeds any GN field mid-tree into the Spreadsheet
Editor and activates a per-domain colour overlay in the 3D Viewport. Connect it
off the main chain — NEVER wire it to Group Output — so it leaves the data path
entirely unaffected whilst giving you a live diagnostic readout on the exact
socket you care about.

WHY THIS MATTERS: GN trees grow opaque quickly. A mis-wired domain conversion
or a wrong Capture Attribute placement produces subtly wrong geometry that is
invisible until something downstream breaks. A Viewer probe on the suspect socket
pinpoints the bad value in the same viewport frame — zero baking, zero manual
print() calls, no broken Group Output wires.

DOMAIN CHOICES (node.domain enum):
  POINT    → per-vertex data (position, custom float, noise values)
  EDGE     → per-edge data (crease, angle, sharp flag)
  FACE     → per-face data (material index, smooth flag, normals)
  CORNER   → per-loop data (UV coords, split normals)
  CURVE    → per-spline data on curves (radius, tilt, cyclic)
  INSTANCE → per-instance transforms and custom data

COLOUR ENCODING IN VIEWPORT OVERLAY:
  Float   → luminance  (0 = black, 1 = white; negatives clamp to black)
  Vector  → XYZ → RGB  (world normals: mostly blue on horizontal faces)
  Bool    → 0/1 binary (false = black, true = white)
  Int     → normalised to data min–max in the Spreadsheet column

BLENDER 5.1 SPECIFICS:
  - 'AUTO' domain infers from the first connected field socket — reliable
    for simple cases, ambiguous when mixing domains in one tree.
  - Multiple Viewer nodes coexist; click one in the GN editor to activate.
    The active Viewer title bar highlights; its column appears in the
    Spreadsheet Editor under the active domain tab.
  - GeometryNodeInputNamedAttribute has no Geometry socket; it reads from
    the field-evaluation context established by the Viewer's Geometry input.

THREE PROBES BUILT HERE:
  Probe A — 'Viewer: Noise Scalar'     (POINT domain, before displacement)
  Probe B — 'Viewer: Face Normal'      (FACE domain, after displacement)
  Probe C — 'Viewer: Named Attr RT'    (POINT domain, round-trip readback)
  Probes A and C must be bit-for-bit identical. Any divergence reveals a
  domain mismatch or name typo in Store Named Attribute — a classic bug.
"""

import bpy, math

# ── constants ────────────────────────────────────────────────────────────────
OBJ_NAME    = "gn_debug_probe"
MESH_NAME   = "debug_grid_mesh"
MOD_NAME    = "GN_DebugViewer"
NG_NAME     = "GN_Viewer_Debug_Tree"

GRID_DIVS   = 14          # NxN quad faces — enough for smooth noise gradient
GRID_SIZE   = 3.0         # total span in metres
NOISE_SCALE = 2.2         # noise frequency; higher = tighter wrinkles
NOISE_AMP   = 0.38        # peak Z displacement in metres

# ── cleanup ──────────────────────────────────────────────────────────────────
def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in (bpy.data.meshes, bpy.data.node_groups,
                bpy.data.objects, bpy.data.materials):
        for item in list(col):
            col.remove(item)

# ── base mesh ────────────────────────────────────────────────────────────────
def make_grid():
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_DIVS,
        y_subdivisions=GRID_DIVS,
        size=GRID_SIZE,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = OBJ_NAME
    obj.data.name = MESH_NAME
    return obj

# ── GN debug tree ────────────────────────────────────────────────────────────
def build_debug_tree(obj):
    ng = bpy.data.node_groups.new(name=NG_NAME, type='GeometryNodeTree')
    ni = ng.interface
    ni.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ni.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    ns = ng.nodes
    lk = ng.links

    # I/O
    n_in  = ns.new("NodeGroupInput");  n_in.location  = (-1300, 0)
    n_out = ns.new("NodeGroupOutput"); n_out.location = (  900, 0)

    # ── position drives noise vector ─────────────────────────────────────────
    n_pos = ns.new("GeometryNodeInputPosition")
    n_pos.location = (-1000, 300)

    # ── noise texture (3D) ───────────────────────────────────────────────────
    n_noise = ns.new("ShaderNodeTexNoise")
    n_noise.location = (-700, 300)
    n_noise.noise_dimensions = '3D'
    n_noise.inputs["Scale"].default_value      = NOISE_SCALE
    n_noise.inputs["Detail"].default_value     = 6.0
    n_noise.inputs["Roughness"].default_value  = 0.55
    n_noise.inputs["Distortion"].default_value = 0.15
    # Fac output: smooth scalar 0–1 per vertex.
    # Color output: per-channel noise (use for vector probe inspection).

    # ── scale Fac → Z displacement ───────────────────────────────────────────
    n_scale = ns.new("ShaderNodeMath")
    n_scale.operation = 'MULTIPLY'
    n_scale.location  = (-400, 400)
    n_scale.inputs[1].default_value = NOISE_AMP

    n_comb = ns.new("ShaderNodeCombineXYZ")
    n_comb.location = (-200, 300)
    n_comb.inputs["X"].default_value = 0.0
    n_comb.inputs["Y"].default_value = 0.0
    # Z socket wired below from n_scale

    # ── set position (displacement) ──────────────────────────────────────────
    n_setp = ns.new("GeometryNodeSetPosition")
    n_setp.location = (0, 0)

    # ── store noise_height as named attribute (POINT domain) ─────────────────
    n_store = ns.new("GeometryNodeStoreNamedAttribute")
    n_store.location   = (250, 0)
    n_store.domain     = 'POINT'     # must match POINT — a frequent source of bugs
    n_store.data_type  = 'FLOAT'
    n_store.inputs["Name"].default_value = "noise_height"
    # The value stored is the pre-displacement Fac from n_noise.
    # Storing BEFORE displacement means the attribute reflects the
    # noise function value, not the final Z position after offsetting.

    # ── Probe A: noise Fac at POINT domain (BEFORE displacement) ─────────────
    n_va = ns.new("GeometryNodeViewer")
    n_va.location = (-700, -200)
    n_va.label    = "Viewer: Noise Scalar"
    n_va.domain   = 'POINT'
    # Click this node → viewport shows per-vertex grayscale.
    # Spreadsheet → Vertices tab → "Viewer" column gives exact floats.
    # Black = 0 (noise minimum), white = 1 (noise maximum).
    # Useful for confirming noise scale before wiring to displacement.

    # ── face normal (after displacement) ────────────────────────────────────
    n_norm = ns.new("GeometryNodeInputNormal")
    n_norm.location = (450, -300)

    # ── Probe B: face normal at FACE domain (AFTER displacement) ─────────────
    n_vb = ns.new("GeometryNodeViewer")
    n_vb.location = (650, -200)
    n_vb.label    = "Viewer: Face Normal"
    n_vb.domain   = 'FACE'
    # RGB encoding: X→R, Y→G, Z→B.
    # Horizontal faces = almost pure blue. Steep N/S slopes = green.
    # Steep E/W slopes = red. Absolute slopes show as saturated colour.
    # Spreadsheet → Faces tab → "Viewer" column.

    # ── named attribute readback ─────────────────────────────────────────────
    n_named = ns.new("GeometryNodeInputNamedAttribute")
    n_named.location  = (450, -500)
    n_named.data_type = 'FLOAT'
    n_named.inputs["Name"].default_value = "noise_height"
    # No Geometry socket — reads from field context of its consumer (n_vc).

    # ── Probe C: named attribute round-trip (POINT domain) ───────────────────
    n_vc = ns.new("GeometryNodeViewer")
    n_vc.location = (650, -450)
    n_vc.label    = "Viewer: Named Attr RT"
    n_vc.domain   = 'POINT'
    # Should be identical to Probe A.
    # If it shows zeros: attribute name typo or domain mismatch in n_store.
    # If it shows noise but differs from Probe A: Store domain ≠ Viewer domain.

    # ── wiring ───────────────────────────────────────────────────────────────
    lk.new(n_pos.outputs["Position"],      n_noise.inputs["Vector"])

    # displacement chain
    lk.new(n_noise.outputs["Fac"],         n_scale.inputs[0])
    lk.new(n_scale.outputs[0],            n_comb.inputs["Z"])
    lk.new(n_in.outputs["Geometry"],       n_setp.inputs["Geometry"])
    lk.new(n_comb.outputs["Vector"],       n_setp.inputs["Offset"])

    # store attribute
    lk.new(n_setp.outputs["Geometry"],     n_store.inputs["Geometry"])
    lk.new(n_noise.outputs["Fac"],         n_store.inputs["Value"])

    # Probe A: grid geometry (pre-displace) + noise Fac
    lk.new(n_in.outputs["Geometry"],       n_va.inputs["Geometry"])
    lk.new(n_noise.outputs["Fac"],         n_va.inputs["Value"])

    # Probe B: displaced + stored geometry + face normal
    lk.new(n_store.outputs["Geometry"],    n_vb.inputs["Geometry"])
    lk.new(n_norm.outputs["Normal"],       n_vb.inputs["Value"])

    # Probe C: stored geometry + named attribute readback
    lk.new(n_store.outputs["Geometry"],    n_vc.inputs["Geometry"])
    lk.new(n_named.outputs["Attribute"],   n_vc.inputs["Value"])

    # main output
    lk.new(n_store.outputs["Geometry"],    n_out.inputs["Geometry"])

    return ng

# ── material ─────────────────────────────────────────────────────────────────
def make_material():
    mat = bpy.data.materials.new("debug_grey")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.25, 0.25, 0.25, 1.0)
    bsdf.inputs["Roughness"].default_value  = 0.85
    # Neutral grey keeps the Viewer colour overlay readable — avoid
    # using bright or saturated base colours as they compete with the
    # per-vertex diagnostic readout.
    return mat

# ── scene ────────────────────────────────────────────────────────────────────
def setup_scene():
    bpy.ops.object.light_add(type='SUN', location=(3, -4, 6))
    sun = bpy.context.active_object
    sun.data.energy    = 3.5
    sun.rotation_euler = (math.radians(48), 0, math.radians(30))

    bpy.ops.object.camera_add(location=(0, -5.5, 4.0))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(52), 0, 0)
    bpy.context.scene.camera = cam

    bpy.context.scene.render.resolution_x = 1920
    bpy.context.scene.render.resolution_y = 1080
    bpy.context.scene.render.fps          = 24

# ── main ─────────────────────────────────────────────────────────────────────
def main():
    clean_scene()
    obj = make_grid()
    mat = make_material()
    obj.data.materials.append(mat)

    ng  = build_debug_tree(obj)
    mod = obj.modifiers.new(name=MOD_NAME, type='NODES')
    mod.node_group = ng

    setup_scene()

    bpy.ops.wm.save_as_mainfile(filepath="//gn_viewer_debug.blend")
    print("✓ Saved: gn_viewer_debug.blend")
    print()
    print("Viewer probes — click each in the GN node editor:")
    print("  Probe A 'Viewer: Noise Scalar'  → Vertices tab grayscale height map")
    print("  Probe B 'Viewer: Face Normal'   → Faces tab RGB slope map")
    print("  Probe C 'Viewer: Named Attr RT' → must be identical to Probe A")
    print()
    print("Spreadsheet Editor: filter 'Viewer' column to read exact values.")
    print("Viewport: ensure Solid shading + Overlays > Geometry Nodes is ticked.")

if __name__ == "__main__":
    main()
