"""
Modifier Displace — Voronoi Texture-Driven Organic Surface (Blender 5.1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Technique: non-destructive modifier stack → SubDiv → Displace → GLB export.
The Displace modifier displaces each vertex by:
  delta = Strength × (texture_value − mid_level)
Voronoi CELL_NOISE: cell centres ≈ 0.0 (pulled IN), ridges ≈ 1.0 (pushed OUT).
Result: coral ridge-and-valley surface at ~8 000 verts, WebXR-ready.

Run via Blender Scripting workspace, or: blender --background --python blueprint.py
"""

import bpy
import os

# ── Constants (tune before running) ───────────────────────────────────────────
SUBDIV_LEVELS   = 3      # pre-Displace Catmull-Clark levels (3 = ~8k verts)
SUBDIV_RENDER   = 4      # render levels (heavier; only used in F12)
VORONOI_SCALE   = 0.40   # cell size in world units — lower = finer bumps
DISPLACE_STR    = 0.28   # displacement height in world units
DISPLACE_MID    = 0.50   # neutral point: 0.5 = white pushes OUT / black IN
CORAL_COLOUR    = (0.72, 0.35, 0.18, 1.0)  # warm terracotta base colour
OUTPUT_GLB      = "output/organic_coral_prop.glb"

# ── Scene helpers ──────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.textures,
                bpy.data.materials, bpy.data.images):
        for item in list(blk):
            blk.remove(item)


# ── Material ───────────────────────────────────────────────────────────────────

def make_coral_material():
    mat = bpy.data.materials.new("coral_mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = CORAL_COLOUR
        bsdf.inputs["Roughness"].default_value  = 0.92
        bsdf.inputs["Metallic"].default_value   = 0.0
        # Specular = 0 keeps the cel-shade flatness consistent under EEVEE
        bsdf.inputs["Specular IOR Level"].default_value = 0.0
    return mat


# ── Voronoi texture ────────────────────────────────────────────────────────────

def make_voronoi_texture():
    # WHY bpy.data.textures not shader Voronoi: Displace and other deform
    # modifiers read the legacy bpy.data.textures stack, not the material
    # shader node tree.  Both systems are present in Blender 5.1; they are
    # independent evaluation paths.
    tex = bpy.data.textures.new("voronoi_coral", type='VORONOI')
    tex.color_type      = 'CELL_NOISE'   # uniform fill per cell (hard ridges)
    tex.distance_metric = 'DISTANCE'     # Euclidean F1 — standard Voronoi
    tex.noise_scale     = VORONOI_SCALE
    tex.noise_intensity = 1.0
    return tex


# ── Main build ─────────────────────────────────────────────────────────────────

def build_coral():
    clear_scene()

    # 1. Base mesh — UV sphere slightly flattened for a lump silhouette
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32, ring_count=16, radius=1.0, location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = "coral_prop"
    obj.scale = (1.0, 1.0, 0.55)
    # WHY apply scale before Displace: the modifier displaces along vertex
    # normals in *local* space.  An un-applied non-uniform scale distorts local
    # normals, making NORMAL-mode displacement anisotropic (taller at poles).
    bpy.ops.object.transform_apply(scale=True)

    # 2. Material
    mat = make_coral_material()
    obj.data.materials.append(mat)

    # 3. Subdivision Surface — must be BELOW Displace in the stack (added first)
    # WHY SubDiv first: more vertices before Displace → smoother bumps at the
    # same Strength.  On a bare 512-vert sphere, Strength=0.28 looks spiky;
    # on a 3×-subdivided ~8k-vert sphere it reads as smooth organic ridges.
    # CATMULL_CLARK smooths the sphere silhouette; SIMPLE would add vertices
    # without rounding — use SIMPLE for height-map terrain where you want to
    # preserve sharp ridges exactly.
    subdiv = obj.modifiers.new("Subdiv", 'SUBSURF')
    subdiv.levels        = SUBDIV_LEVELS
    subdiv.render_levels = SUBDIV_RENDER
    subdiv.subdivision_type = 'CATMULL_CLARK'

    # 4. Voronoi texture
    tex = make_voronoi_texture()

    # 5. Displace modifier — appears ABOVE SubDiv in the stack (added second)
    # Stack execution is bottom-to-top in the UI, so SubDiv runs first. ✓
    disp = obj.modifiers.new("Displace", 'DISPLACE')
    disp.texture        = tex
    # texture_coords mode options and when to use each:
    #   NORMAL  — vertex normal direction; no UV required; best for closed orbs
    #   UV      — texture coordinates from UV map; best for flat terrain planes
    #   OBJECT  — project from a controller empty; allows animated position
    #   GLOBAL  — world-space projection; does not follow object transforms
    disp.texture_coords = 'NORMAL'
    disp.direction      = 'NORMAL'    # displace along vertex normal
    disp.strength       = DISPLACE_STR
    disp.mid_level      = DISPLACE_MID
    # mid_level mathematics:
    #   delta = Strength × (value − mid_level)
    #   value=1.0, mid=0.5 → delta = +0.5×Strength (ridge pushed OUT)
    #   value=0.0, mid=0.5 → delta = −0.5×Strength (hole pulled IN)
    #   value=0.5, mid=0.5 → delta = 0 (neutral — no movement)

    return obj, disp


# ── Flat shading ───────────────────────────────────────────────────────────────

def set_flat_shading(obj):
    # Flat shading on the displaced high-poly reads as cel/faceted style;
    # the Voronoi ridges become visible polygon facets — intentional aesthetic.
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_flat()


# ── GLB export ─────────────────────────────────────────────────────────────────

def export_glb(obj, filepath=OUTPUT_GLB):
    # WHY export_apply=True: without it the exporter strips the live modifier
    # and exports the base 512-vert sphere.  export_apply bakes the full stack
    # (SubDiv + Displace) into real mesh geometry before serialising the GLB.
    os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_yup=True,
        export_selected=True,
    )
    print(f"  GLB → {filepath}")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    obj, disp = build_coral()
    set_flat_shading(obj)
    export_glb(obj)
    print("✓ Displace modifier coral prop built.")
    print(f"  Stack: [Displace strength={disp.strength}] above [Subdiv levels={SUBDIV_LEVELS}]")
    print("  Scrub Properties → Modifier → Displace → Strength to see live deformation.")
    print("  Scrub Properties → Texture → voronoi_coral → noise_scale for cell size.")
