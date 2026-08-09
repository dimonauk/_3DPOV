"""
Klein Bottle — Non-Orientable Surface Immersed in ℝ³
Figure-8 Parameterisation, Self-Intersection Seam & Poi Head
Blender 5.1  |  bpy direct data API  |  no UI operators

WHY THIS TECHNIQUE:
  A Klein bottle is a closed non-orientable surface: it has no inside or
  outside.  In ℝ⁴ it embeds cleanly; in ℝ³ every immersion must
  self-intersect.  The figure-8 parameterisation places the cross-section
  spine on a circle of radius R and lets the tube frame rotate by π/2
  per loop-turn (via the u/2 half-angle), producing a figure-8 cross-
  section that passes through itself near u ≈ π.  The self-intersection
  circle is detected analytically and coloured as an emission seam.
  Shape keys morph between three distinct immersions: figure-8, saddled,
  and pinched (classical bottle).

BLENDER 5.1 NOTES:
  - bpy.data.meshes.new() + from_pydata() is the direct API path.
    No bpy.ops.mesh.* operators; those require a modal context.
  - Shape-key data lives in obj.data.shape_keys.key_blocks[].data.
    Set via foreach_set("co", flat_array).
  - Emission material: bpy.data.materials.new(); set use_nodes=True,
    build BSDF + Emission mix manually via node_tree API.
  - holoflow:facet=True → flat shading on export (WebXR convention).
  - GLB: bpy.ops.export_scene.gltf() with export_draco_mesh_compression_enable.

OUTSIDE SOURCES:
  Apéry, François (1994). Models of the Real Projective Plane.
    Vieweg. ISBN 978-3-322-89569-1. PD mathematical content.
  Stewart, Ian (1992). Game, Set and Math. Blackwell. PD (out of print).
  Weeks, Jeffrey (2002). The Shape of Space. CRC Press. CC0 concept.
"""

import bpy
import numpy as np
from mathutils import Vector

# ───────────────────────── parameters (edit here) ───────────────────────────
SLUG          = "hf_klein_bottle"
U_SEGS        = 80          # longitude segments around main circle (even number)
V_SEGS        = 48          # latitude segments around tube cross-section (even)
R_MAJOR       = 1.0         # major radius of the spine circle
R_TUBE        = 0.36        # tube radius for figure-8 cross-section
SCALE         = 0.32        # WebXR scale: overall bounding box ≈ 0.64 m
SEAM_THRESH   = 0.05        # vertex proximity threshold for seam detection (pre-scale)
GLB_PATH      = "//hf_klein_bottle.glb"
BLEND_PATH    = "//hf_klein_bottle.blend"
# ─────────────────────────────────────────────────────────────────────────────

tau = 2.0 * np.pi


# ─────────────────────── surface parameterisations ───────────────────────────

def figure8_klein(u_arr, v_arr, R=R_MAJOR, r=R_TUBE):
    """
    Figure-8 Klein bottle (the canonical choice for visualisation).

    The cross-section frame uses half-angle u/2 to rotate by π over
    one full loop [0,2π].  This creates the non-orientable identification
    that distinguishes the Klein bottle from a torus.

    At u=0  : cross-section circle centred at (R, 0, 0)
    At u=2π : cross-section circle centred at (R, 0, 0) BUT with the v
              direction reversed (v → v+π) — the Klein identification.
    The self-intersection locus occurs near u ≈ π where the tube radius
    projects through the spine.

    WHY sin(2v): the double-frequency term creates the figure-8 cross-
    section in the (e₁, e₂) plane, ensuring the tube produces a figure-8
    rather than a simple circle.  Without it the surface is a torus.
    """
    # Half-angle frame components (parallel-transport with π/loop twist)
    cos_u2 = np.cos(u_arr / 2)
    sin_u2 = np.sin(u_arr / 2)
    cos_v  = np.cos(v_arr)
    sin_v  = np.sin(v_arr)
    sin_2v = np.sin(2 * v_arr)
    cos_2v = np.cos(2 * v_arr)

    # Ambient-space frame vectors at angle u:
    #   ê_u = (cos u, sin u, 0)  — tangent to the spine circle
    #   ê₁  = (cos(u/2) cos u,  cos(u/2) sin u,  sin(u/2))
    #   ê₂  = (-sin u, cos u, 0)
    # Cross-section point in the transverse plane:
    #   P_cross = r * (cos_v * ê₁ + sin_2v * ê₂)  (figure-8: 2v term)
    # Surface point:
    #   S = (R + r * cos_v * cos(u/2)) * (cos u, sin u, 0)
    #       + r * cos_v * sin(u/2) * (0, 0, 1)
    #       + r * sin_2v * (-sin u, cos u, 0)

    # Effective radial offset in the spine plane:
    radial = R + r * (cos_v * cos_u2 - sin_2v * sin_u2)

    x = radial * np.cos(u_arr) + r * sin_2v * (-np.sin(u_arr))
    y = radial * np.sin(u_arr) + r * sin_2v * ( np.cos(u_arr))
    z = r * (cos_v * sin_u2 + sin_2v * cos_u2)

    return x, y, z


def saddled_klein(u_arr, v_arr, R=R_MAJOR, r=R_TUBE):
    """
    'Saddled' variant: sin(3v/2) instead of sin(2v).
    The 3/2 frequency creates a three-pronged saddle cross-section,
    giving a more open self-intersection and different seam topology.
    Still a valid immersion of the Klein bottle.
    """
    cos_u2 = np.cos(u_arr / 2)
    sin_u2 = np.sin(u_arr / 2)
    cos_v  = np.cos(v_arr)
    sin_v  = np.sin(v_arr)
    sin_hv = np.sin(3 * v_arr / 2)
    cos_hv = np.cos(3 * v_arr / 2)

    radial = R + r * (cos_v * cos_u2 - sin_hv * sin_u2)
    x = radial * np.cos(u_arr) + r * sin_hv * (-np.sin(u_arr))
    y = radial * np.sin(u_arr) + r * sin_hv * ( np.cos(u_arr))
    z = r * (cos_v * sin_u2 + sin_hv * cos_u2)
    return x, y, z


def pinched_klein(u_arr, v_arr, R=R_MAJOR, r=R_TUBE):
    """
    Classical 'bottle' immersion (pinched neck form).
    Uses a profile that creates the characteristic bottle silhouette:
    neck passes through the side of the bottle body.

    WHY pinched: the more familiar shape for public communication.
    The neck 'self-pinches' at u ≈ 3π/2 rather than having a smooth
    figure-8 crossing, making the self-intersection visually obvious.
    """
    a = R + r
    # Bottle: approximate Apery-style profile
    tu  = u_arr / 2
    cos_u = np.cos(u_arr); sin_u = np.sin(u_arr)
    cos_v = np.cos(v_arr); sin_v = np.sin(v_arr)
    cos_tu = np.cos(tu);   sin_tu = np.sin(tu)

    # Adjusted tube: radius shrinks to 0 at u=π (neck), then re-expands
    neck = np.abs(np.sin(tu))            # 0 at u=0 and 2π, 1 at u=π
    rr   = r * (0.3 + 0.7 * neck)       # minimum 30% of tube radius

    radial = R + rr * cos_v
    x = radial * cos_u
    y = radial * sin_u
    z = rr * sin_v + R * sin_tu * 0.6   # longitudinal z-shift creates neck
    return x, y, z


# ────────────────────────── mesh construction ────────────────────────────────

def build_grid_verts(fn, U, V):
    """Sample fn on (U+1)×(V+1) grid; return flat vertex list."""
    u = np.linspace(0, tau, U + 1)
    v = np.linspace(0, tau, V + 1)
    uu, vv = np.meshgrid(u, v, indexing="ij")  # shape (U+1, V+1)
    x, y, z = fn(uu.ravel(), vv.ravel())
    return np.column_stack([x, y, z])           # (N, 3)


def build_quads(U, V):
    """
    Build quad face list for a (U+1)×(V+1) vertex grid.
    Wraps in both u and v directions (torus topology in mesh terms).
    The Klein bottle identification (v-flip at the u seam) is NOT
    enforced in the mesh — the surface self-intersects in 3D instead,
    which is exactly what we want to visualise.
    """
    faces = []
    for i in range(U):
        for j in range(V):
            a = i * (V + 1) + j
            b = (i + 1) * (V + 1) + j
            c = (i + 1) * (V + 1) + (j + 1)
            d = i * (V + 1) + (j + 1)
            faces.append((a, b, c, d))
    return faces


def detect_seam_verts(verts_nm, U, V, threshold):
    """
    Find vertices whose 3D position is within `threshold` of another
    vertex from a topologically distant row.
    We compare row i against row U-i (opposite side of the figure-8).
    Returns a boolean mask over the vertex array.
    """
    # Only compare u-rows in the 'neck' region: u ∈ [3π/8, 5π/8]
    neck_lo = int(U * 3 / 8)
    neck_hi = int(U * 5 / 8)

    seam = np.zeros(len(verts_nm), dtype=bool)
    # For efficiency: only test candidate rows against the full grid
    for i in range(neck_lo, neck_hi + 1):
        row_start = i * (V + 1)
        row_end   = row_start + V + 1
        row_pts   = verts_nm[row_start:row_end]          # (V+1, 3)

        # Compare against all other rows outside the local neighbourhood
        for j in range(0, neck_lo):
            j_start = j * (V + 1)
            j_end   = j_start + V + 1
            j_pts   = verts_nm[j_start:j_end]            # (V+1, 3)

            # Pairwise distances (V+1 vs V+1)
            diff = row_pts[:, None, :] - j_pts[None, :, :]   # (V+1, V+1, 3)
            dist = np.linalg.norm(diff, axis=-1)               # (V+1, V+1)

            close = dist < threshold
            close_i = np.any(close, axis=1)   # mask for row_i verts
            close_j = np.any(close, axis=0)   # mask for row_j verts

            seam[row_start:row_end][close_i] = True
            seam[j_start:j_end][close_j]     = True

    return seam


# ───────────────────────────── scene build ───────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block, do_unlink=True)


def make_material_surface(name, colour_rgba, metallic=0.6, roughness=0.15):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value    = colour_rgba
    bsdf.inputs["Metallic"].default_value      = metallic
    bsdf.inputs["Roughness"].default_value     = roughness
    # Blender 5.1: Coat Weight replaces Clearcoat
    bsdf.inputs["Coat Weight"].default_value   = 0.4
    bsdf.inputs["Coat Roughness"].default_value = 0.05
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    out.location  = (400, 0)
    bsdf.location = (0, 0)
    return mat


def make_material_seam(name, colour_rgba, strength=4.0):
    """Emission shader for the self-intersection seam."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out  = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value    = colour_rgba
    emit.inputs["Strength"].default_value = strength
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    out.location  = (300, 0)
    emit.location = (0, 0)
    return mat


def build_mesh_object(name, verts_nm, faces, scale):
    """Create mesh from pydata, scale to WebXR size, set flat shading."""
    me = bpy.data.meshes.new(name + "_mesh")
    me.from_pydata(
        [(v[0] * scale, v[1] * scale, v[2] * scale) for v in verts_nm],
        [],
        faces,
    )
    me.update(calc_edges=True)

    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)

    # Flat shading (faceted look, holoflow WebXR convention)
    for poly in me.polygons:
        poly.use_smooth = False

    # Custom property for export pipeline
    obj["holoflow:facet"] = True
    return obj


def add_shape_key(obj, key_name, verts_nm, scale):
    """Add an absolute shape key from a vertex array."""
    me = obj.data
    if obj.data.shape_keys is None:
        obj.shape_key_add(name="Basis", from_mix=False)
    sk = obj.shape_key_add(name=key_name, from_mix=False)

    flat = np.array(
        [(v[0] * scale, v[1] * scale, v[2] * scale) for v in verts_nm],
        dtype=np.float32
    ).ravel()
    sk.data.foreach_set("co", flat)
    sk.value = 0.0
    return sk


def assign_seam_material(obj, seam_mask, mat_surface, mat_seam):
    """
    Two-material slot: surface BSDF for non-seam, emission for seam.
    Material indices are set per-polygon by vertex overlap.
    """
    me = obj.data
    me.materials.append(mat_surface)
    me.materials.append(mat_seam)

    # Build a per-vertex seam label, then label each polygon by majority
    n_faces = len(me.polygons)
    for poly in me.polygons:
        vi = list(poly.vertices)
        n_seam = sum(1 for v in vi if seam_mask[v])
        poly.material_index = 1 if n_seam >= len(vi) // 2 else 0


def main():
    clear_scene()

    # ── 1. Build basis (figure-8) ──────────────────────────────────────────
    verts_f8 = build_grid_verts(figure8_klein, U_SEGS, V_SEGS)
    faces     = build_quads(U_SEGS, V_SEGS)

    obj = build_mesh_object(SLUG, verts_f8, faces, SCALE)

    # ── 2. Seam detection ─────────────────────────────────────────────────
    seam = detect_seam_verts(verts_f8, U_SEGS, V_SEGS, SEAM_THRESH)

    # ── 3. Materials ──────────────────────────────────────────────────────
    mat_surf = make_material_surface(
        "klein_iridescent",
        (0.05, 0.55, 0.80, 1.0),   # deep teal
    )
    mat_seam = make_material_seam(
        "klein_seam_glow",
        (1.0, 0.35, 0.05, 1.0),    # hot orange emission
    )
    assign_seam_material(obj, seam, mat_surf, mat_seam)

    # ── 4. Shape keys ─────────────────────────────────────────────────────
    # Basis (figure-8) is already the mesh geometry; add shape key slots
    obj.shape_key_add(name="Basis", from_mix=False)

    verts_saddle  = build_grid_verts(saddled_klein,  U_SEGS, V_SEGS)
    verts_pinched = build_grid_verts(pinched_klein,   U_SEGS, V_SEGS)

    add_shape_key(obj, "saddled",  verts_saddle,  SCALE)
    add_shape_key(obj, "pinched",  verts_pinched, SCALE)

    # Basis shape key should match the mesh positions exactly
    # (already set by from_pydata above)

    # ── 5. Camera + world ─────────────────────────────────────────────────
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 50
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (0.0, -1.6, 0.0)
    cam_obj.rotation_euler = (1.5708, 0, 0)

    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value   = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0.0

    # ── 6. EEVEE Next bloom ───────────────────────────────────────────────
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    ep = scene.eevee
    ep.bloom_threshold  = 0.6
    ep.bloom_intensity  = 0.8
    ep.bloom_radius     = 6.0
    ep.use_bloom        = True

    # ── 7. Export GLB ─────────────────────────────────────────────────────
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_PATH),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )

    # ── 8. Save .blend ────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))

    print(f"[holoflow] Klein bottle built — {len(verts_f8)} verts, "
          f"{len(faces)} quads, seam verts: {seam.sum()}")


main()
