"""
blueprint.py
bpy.types.WaveModifier — Sinusoidal Ripple Displacement,
Falloff Vertex Group & Peak-Frame GLB for WebXR
Blender 5.1 | Holoflow Studio | CC0

WHY THIS TECHNIQUE
------------------
The Wave modifier applies a travelling sinusoidal displacement to mesh
vertices over time. Unlike the Ocean modifier (complex Beaufort FFT
spectrum), Wave is a single continuous sine with explicit phase controls —
ideal for periodic, predictable effects: pond ripples, speaker-cone
vibration, flag-hem flutter, cape-edge oscillation.

Key insight: `narrowness` controls HOW PEAKED the crest is (higher =
knife-edge ridge, lower = broad rolling swell), while `width` controls
WAVELENGTH (distance crest-to-crest). These two are independent. Most
guides conflate them — do not.

Vertex group INVERSION: assigning a vertex group to `vertex_group` makes
weight 1.0 = ZERO amplitude (full suppression) and weight 0.0 = FULL
amplitude. This is the opposite of every other modifier that reads a VG.
Use it to pin an edge still while the rest of the mesh ripples.

bpy surface: bpy.types.WaveModifier (modifier type 'WAVE')
Docs: https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/wave.html
"""

import bpy
import bmesh
from mathutils import Vector
import math

# ── PARAMETERS ────────────────────────────────────────────────────────────────
MESH_NAME        = "hf_ripple_plane"
VG_ANCHOR        = "anchor"            # suppressed-edge vertex group
GLB_PATH         = "//hf_wave_ripple.glb"
GLB_EXPORT_NAME  = "ripple_plane"      # snake_case root name for glTF node

GRID_X           = 64                  # vertex columns
GRID_Y           = 64                  # vertex rows
GRID_SIZE        = 2.0                 # metres total width / depth

# Wave modifier knobs
WAVE_HEIGHT      = 0.12    # peak amplitude (metres)
WAVE_WIDTH       = 0.30    # wavelength: crest-to-crest distance (metres)
WAVE_NARROWNESS  = 1.8     # crest sharpness: 1.0 = smooth sine, 4+ = knife ridge
WAVE_SPEED       = 0.55    # travel speed (metres/second)
WAVE_TIME_OFFSET = -0.4    # negative = wave already mid-travel at frame 0

PEAK_FRAME       = 20      # frame at which to snapshot the GLB
# ─────────────────────────────────────────────────────────────────────────────


def purge_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


# ── 1. Grid mesh ──────────────────────────────────────────────────────────────
def build_grid() -> bpy.types.Object:
    """
    Grid with enough vertex density to resolve the wave.
    Rule of thumb: ≥8 vertices per wavelength for a smooth sine.
    At GRID_SIZE=2 m and WAVE_WIDTH=0.30 m: ~6.7 wavelengths across →
    GRID_X=64 gives ~9.5 vertices/wavelength — just enough headroom.
    """
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_X,
        y_subdivisions=GRID_Y,
        size=GRID_SIZE,
    )
    ob = bpy.context.object
    ob.name = MESH_NAME
    return ob


# ── 2. Anchor vertex group ─────────────────────────────────────────────────
def add_anchor_group(ob: bpy.types.Object) -> bpy.types.VertexGroup:
    """
    Border strip at ±Y edges with weight 1.0 (fully suppressed) fading to
    0.0 at 15 % of grid depth inward. This "pins" the hem of a flag or the
    shoreline of a pond while the interior ripples freely.

    IMPORTANT: Wave modifier VG convention is INVERTED relative to
    every other modifier:
      weight 1.0  → amplitude × 0  (no displacement)
      weight 0.0  → amplitude × 1  (full displacement)
    Assign the anchor strip weight=1.0 and interior weight=0.0 or absent.
    """
    vg = ob.vertex_groups.new(name=VG_ANCHOR)
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()

    half_size    = GRID_SIZE / 2.0
    border_depth = GRID_SIZE * 0.15   # 15 % strip

    pairs: list[tuple[int, float]] = []
    for v in bm.verts:
        dist_to_edge = half_size - abs(v.co.y)  # 0 at edge, >0 inward
        if dist_to_edge <= 0.0:
            pairs.append((v.index, 1.0))          # fully anchored
        elif dist_to_edge < border_depth:
            fade = 1.0 - (dist_to_edge / border_depth)
            pairs.append((v.index, fade))          # transition ramp

    bm.free()

    for idx, wt in pairs:
        vg.add([idx], wt, 'REPLACE')

    return vg


# ── 3. Wave modifier ──────────────────────────────────────────────────────────
def add_wave_modifier(ob: bpy.types.Object) -> bpy.types.WaveModifier:
    mod: bpy.types.WaveModifier = ob.modifiers.new(
        name="Wave", type="WAVE"
    )

    # Direction: use_x=True → wave TRAVELS along +X.
    # Both True → diagonal; both False → stationary pulsing column at origin.
    mod.use_x = True
    mod.use_y = False

    # use_normal=False → displace globally along Z.
    # use_normal=True → each vertex shifts along its face normal.
    # False is correct for a horizontal ripple surface.
    mod.use_normal = False

    # use_cyclic=True → phase wraps at mesh boundary with no discontinuity.
    # Essential for tiling panels; leave False for bounded props.
    mod.use_cyclic = False

    mod.height      = WAVE_HEIGHT
    mod.width       = WAVE_WIDTH
    mod.narrowness  = WAVE_NARROWNESS
    mod.speed       = WAVE_SPEED
    mod.time_offset = WAVE_TIME_OFFSET

    # falloff_radius=0.0 disables the built-in radial amplitude decay
    # (independent of the VG falloff). We control falloff via the VG instead
    # for spatial precision.
    mod.falloff_radius = 0.0

    # Wave origin: place at −X edge so the wave enters from the left side.
    mod.start_position_x = -GRID_SIZE / 2.0
    mod.start_position_y = 0.0

    # Inverted VG: weight 1.0 at anchored edges suppresses the wave there.
    mod.vertex_group = VG_ANCHOR

    return mod


# ── 4. Snapshot at peak frame ─────────────────────────────────────────────────
def snapshot_at_frame(ob: bpy.types.Object, frame: int) -> bpy.types.Mesh:
    """
    Capture the evaluated mesh (modifier stack resolved) at PEAK_FRAME.

    bpy.data.meshes.new_from_object() is headless-safe: it samples the
    dependency graph directly without requiring a 3D Viewport context.
    bpy.ops.object.modifier_apply() would require INVOKE_DEFAULT context
    and fails in background / Script Editor execution.
    """
    bpy.context.scene.frame_set(frame)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    snap = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
    snap.name = MESH_NAME + "_snap"
    return snap


# ── 5. GLB export ─────────────────────────────────────────────────────────────
def export_glb(live_ob: bpy.types.Object, snap_mesh: bpy.types.Mesh) -> None:
    """
    Bind the baked snapshot to a temporary export object so the live
    animated object remains untouched in the .blend file.
    Export with Draco compression level 6 and +Y-up (glTF convention).
    """
    export_ob = bpy.data.objects.new(GLB_EXPORT_NAME, snap_mesh)
    bpy.context.collection.objects.link(export_ob)
    export_ob.matrix_world = live_ob.matrix_world.copy()

    bpy.ops.object.select_all(action='DESELECT')
    export_ob.select_set(True)
    bpy.context.view_layer.objects.active = export_ob

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_normals=True,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )

    bpy.data.objects.remove(export_ob)
    bpy.data.meshes.remove(snap_mesh)


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main() -> None:
    purge_scene()
    ob      = build_grid()
    add_anchor_group(ob)
    add_wave_modifier(ob)
    snap    = snapshot_at_frame(ob, PEAK_FRAME)
    export_glb(ob, snap)
    print(f"[holoflow] WaveModifier tutorial complete → {GLB_PATH}")


if __name__ == "__main__":
    main()
