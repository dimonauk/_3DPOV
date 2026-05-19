"""
Faceted Gem — Blender 5.1 blueprint
=====================================
Builds a 25-face octagonal brilliant-cut gem using the bpy data API.

Why the data API over bpy.ops?  Operators are context-dependent — they
silently do nothing if the wrong mode or object is active. Building the
mesh directly through bpy.data and bmesh runs identically headless, in a
background thread, or inside any Blender context.

Why flat shading? A face's interpolated normal determines where specular
highlights appear. Smooth shading blends normals across edges, smearing
the highlight across adjacent facets. Flat shading (use_smooth = False)
locks each face to its geometric normal, so every facet catches light
independently — that's the "faceted" look, not a coincidence.

Why IOR 1.77? That is the published refractive index of corundum
(sapphire / ruby). Diamond is 2.42; glass is 1.52. Sapphire sits in the
sweet spot: enough bending to look prismatic without the extreme caustics
that make diamond difficult to shade in real time.

EEVEE Next note: `blend_method` and `shadow_method` are EEVEE Legacy
properties removed in Blender 4.2. Use `surface_render_method = 'FORWARD'`
for correct alpha + refraction in EEVEE Next (Blender 4.2 / 5.x).
"""

import bpy
import bmesh
import math

# ── geometry constants ────────────────────────────────────────────────────────
N            = 8       # radial facet count; 8 gives "octagonal brilliant" look
TABLE_R      = 0.38    # table radius (fraction of girdle) — 30-40 % is gem-industry standard
TABLE_Z      = 0.55
GIRDLE_R     = 1.00
GIRDLE_Z     = 0.00
PAVILION_R   = 0.72    # converging inward creates the "V" of the pavilion
PAVILION_Z   = -0.48
CULET_Z      = -0.90   # bottom point; set = PAVILION_Z for a flat culet

# ── material constants ────────────────────────────────────────────────────────
GEM_COLOUR   = (0.12, 0.50, 1.00, 1.0)   # studio cobalt
IOR          = 1.77                        # corundum / sapphire
ROUGHNESS    = 0.00                        # mirror-smooth facets
TRANSMISSION = 1.00                        # fully transmissive (glass)
# Cel rim: 3-stop CONSTANT ramp snaps Fresnel to hard bands
CEL_STOPS    = [
    (0.00, (0.04, 0.18, 0.55, 1.0)),   # dark — interior shadow
    (0.55, (0.20, 0.52, 1.00, 1.0)),   # mid — ambient cobalt
    (0.82, (0.75, 0.90, 1.00, 1.0)),   # rim — highlight band
]
EMIT_COLOUR  = (0.80, 0.95, 1.00, 1.0)
EMIT_STRENGTH = 0.35

# ── export ────────────────────────────────────────────────────────────────────
EXPORT_PATH  = "//gem_cobalt.glb"         # relative to the saved .blend


# ── geometry ──────────────────────────────────────────────────────────────────

def _ring(radius, z, count, phase=0.0):
    """Return list of (x, y, z) for one radial ring."""
    return [
        (radius * math.cos(2 * math.pi * i / count + phase),
         radius * math.sin(2 * math.pi * i / count + phase),
         z)
        for i in range(count)
    ]


def gem_vertices():
    """Four rings + culet: table · girdle · pavilion · culet."""
    verts = []
    verts += _ring(TABLE_R,    TABLE_Z,    N)   # indices 0 … N-1
    verts += _ring(GIRDLE_R,   GIRDLE_Z,   N)   # indices N … 2N-1
    verts += _ring(PAVILION_R, PAVILION_Z, N)   # indices 2N … 3N-1
    verts.append((0.0, 0.0, CULET_Z))           # index 3N  (culet)
    return verts


def gem_faces():
    """Build all face index lists for the gem topology."""
    T = list(range(N))                  # table ring
    G = list(range(N,   2 * N))         # girdle ring
    P = list(range(2*N, 3 * N))         # pavilion ring
    C = 3 * N                           # culet index

    faces = []

    # Table — single N-gon; reversed so the outward normal faces up
    faces.append(list(reversed(T)))

    # Crown quads: table edge → girdle edge per facet
    for i in range(N):
        faces.append([T[i], G[i], G[(i+1) % N], T[(i+1) % N]])

    # Upper pavilion quads: girdle edge → pavilion ring
    for i in range(N):
        faces.append([G[i], P[i], P[(i+1) % N], G[(i+1) % N]])

    # Lower pavilion triangles: pavilion ring → culet
    for i in range(N):
        faces.append([P[i], C, P[(i+1) % N]])

    return faces


def build_gem_mesh():
    """Create the gem object using pure bmesh; no bpy.ops geometry calls."""
    mesh = bpy.data.meshes.new("gem_cobalt")
    obj  = bpy.data.objects.new("gem_cobalt", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in gem_vertices()]
    for indices in gem_faces():
        try:
            bm.faces.new([bm_verts[i] for i in indices])
        except ValueError:
            pass  # guard against degenerate duplicates during iteration

    # Outward normals — needed because face winding can flip on the culet triangles
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    # Flat shade every polygon — the entire point of the faceted aesthetic
    for poly in mesh.polygons:
        poly.use_smooth = False
    mesh.update()
    return obj


# ── material ──────────────────────────────────────────────────────────────────

def _node(nt, kind, loc):
    """Convenience wrapper: new node at a given canvas position."""
    n = nt.nodes.new(kind)
    n.location = loc
    return n


def build_cel_refraction_material(obj):
    """
    Principled BSDF (full transmission) + Layer-Weight Fresnel fed through
    a CONSTANT ColorRamp → hard cel bands.  The ramp output drives a
    MixShader between the glass BSDF and an emission node so rim edges
    flash bright rather than darken.
    """
    mat = bpy.data.materials.new("gem_cel_refraction")
    mat.use_nodes          = True
    # EEVEE Next (4.2+): surface_render_method replaces blend_method
    mat.surface_render_method = 'FORWARD'
    mat.use_backface_culling   = False   # gems must render back faces

    nt = mat.node_tree
    nt.nodes.clear()

    out     = _node(nt, 'ShaderNodeOutputMaterial', (700, 0))
    mix     = _node(nt, 'ShaderNodeMixShader',      (480, 0))
    bsdf    = _node(nt, 'ShaderNodeBsdfPrincipled', (220, 100))
    emit    = _node(nt, 'ShaderNodeEmission',        (220, -160))
    lw      = _node(nt, 'ShaderNodeLayerWeight',    (-200, -80))
    ramp    = _node(nt, 'ShaderNodeValToRGB',         (40, -80))

    # Principled BSDF — glass gem
    bsdf.inputs['Base Color'].default_value       = GEM_COLOUR
    bsdf.inputs['Roughness'].default_value        = ROUGHNESS
    bsdf.inputs['IOR'].default_value              = IOR
    # 'Transmission Weight' is the 4.0+ rename; was 'Transmission' in 3.x
    bsdf.inputs['Transmission Weight'].default_value = TRANSMISSION

    # Emission — the rim highlight colour
    emit.inputs['Color'].default_value   = EMIT_COLOUR
    emit.inputs['Strength'].default_value = EMIT_STRENGTH

    # Layer Weight — Fresnel output: 0 facing camera, 1 at grazing edge
    lw.inputs['Blend'].default_value = 0.45

    # ColorRamp — CONSTANT interpolation = hard cel step, not gradient
    cr = ramp.color_ramp
    cr.interpolation = 'CONSTANT'
    cr.elements[0].position = CEL_STOPS[0][0]
    cr.elements[0].color    = CEL_STOPS[0][1]
    cr.elements[1].position = CEL_STOPS[1][0]
    cr.elements[1].color    = CEL_STOPS[1][1]
    cr.elements.new(CEL_STOPS[2][0]).color = CEL_STOPS[2][1]

    # Wire: Fresnel → ramp → mix factor; BSDF on slot 1, Emit on slot 2
    L = nt.links.new
    L(lw.outputs['Fresnel'],   ramp.inputs['Fac'])
    L(ramp.outputs['Color'],   mix.inputs['Fac'])
    L(bsdf.outputs['BSDF'],    mix.inputs[1])
    L(emit.outputs['Emission'], mix.inputs[2])
    L(mix.outputs['Shader'],   out.inputs['Surface'])

    obj.data.materials.append(mat)
    return mat


# ── scene ─────────────────────────────────────────────────────────────────────

def setup_scene():
    """Camera, world gradient, single area light."""
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'   # 4.2+ engine name

    # World — subtle blue-grey gradient suits the cobalt gem
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value    = (0.04, 0.04, 0.08, 1.0)
    bg.inputs["Strength"].default_value = 0.6

    # Camera
    bpy.ops.object.camera_add(location=(0.0, -3.5, 1.2))
    cam = bpy.context.active_object
    cam.rotation_euler = (1.15, 0.0, 0.0)   # ~66° tilt looking down at gem
    scene.camera = cam

    # Area light — wide overhead to catch crown facets
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 3.5))
    light = bpy.context.active_object
    light.data.energy = 200
    light.data.size   = 2.5


# ── export ────────────────────────────────────────────────────────────────────

def export_glb(filepath=EXPORT_PATH):
    """
    Studio GLB export convention:
      +Y up, apply transforms, Draco level 6, WebP images.
    Draco level 6 is the studio default: roughly 10-15 : 1 compression
    without visible mesh artefacts on clean faceted geometry.
    """
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_apply=True,   # bake object transforms into geometry
        export_yup=True,     # three.js / WebXR convention is +Y up
    )


# ── entry point ───────────────────────────────────────────────────────────────

def main():
    # Clear default scene (cube, light, camera)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    gem  = build_gem_mesh()
    build_cel_refraction_material(gem)
    setup_scene()

    # Deselect all, select gem, set active — required for single-object export
    bpy.ops.object.select_all(action='DESELECT')
    gem.select_set(True)
    bpy.context.view_layer.objects.active = gem

    export_glb()
    print(f"[blueprint] exported → {EXPORT_PATH}")


if __name__ == "__main__":
    main()
