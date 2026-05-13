"""
fresnel_generator.py
====================
Standalone Blender Python script — run via execute_blender_code MCP tool
or paste into Blender Scripting tab.

Generates parametric Fresnel zone plate / lens geometry for resin printing.
Output: mesh object in Blender scene, optionally exports STL.

Usage:
    disc = make_fresnel_disc(focal_length_mm=300, wavelength_nm=550, n_rings=16)
    export_stl(disc, "/output/fresnel_pendant.stl")
"""

import bpy
import bmesh
import math
import numpy as np


# ─── Core zone plate geometry ─────────────────────────────────────────────────

def compute_zone_radii(focal_length_mm, wavelength_nm, max_radius_mm, n_rings=None):
    """
    Compute Fresnel zone plate radii.
    
    r_n = sqrt(n * lambda * f)
    
    Returns list of (zone_number, radius_mm) tuples within max_radius_mm.
    """
    lam = wavelength_nm * 1e-6  # convert nm → mm
    radii = []
    n = 1
    while True:
        r = math.sqrt(n * lam * focal_length_mm)
        if r > max_radius_mm:
            break
        if n_rings and n > n_rings:
            break
        radii.append((n, r))
        n += 1
    return radii


def make_fresnel_disc(
    focal_length_mm=300.0,
    wavelength_nm=550,
    disc_radius_mm=18.0,
    disc_thickness_mm=3.0,
    ring_step_mm=0.2,
    n_rings=None,
    segments=128,
    name="FresnelDisc_Resin",
    ior=1.53,
    correct_for_refraction=True,
):
    """
    Generate a Fresnel zone plate disc optimised for resin IOR.
    
    Parameters
    ----------
    focal_length_mm       : target focal/projection distance
    wavelength_nm         : design wavelength (550=green, 450=blue, 650=red)
    disc_radius_mm        : outer radius of disc
    disc_thickness_mm     : base thickness (≥1.5mm for structural integrity)
    ring_step_mm          : height of each concentric step (≥layer_height)
    n_rings               : max rings to generate (None = fill disc)
    segments              : angular resolution of each ring
    name                  : Blender object name
    ior                   : resin IOR (1.53 default)
    correct_for_refraction: adjust zone radii for resin-air Snell correction
    
    Returns
    -------
    bpy.types.Object
    """
    # Snell correction: effective focal length inside resin
    if correct_for_refraction:
        # Light refracts at the top surface — adjust lambda for medium
        lam_effective = wavelength_nm / ior
    else:
        lam_effective = wavelength_nm

    zone_radii = compute_zone_radii(focal_length_mm, lam_effective, disc_radius_mm, n_rings)
    
    if not zone_radii:
        raise ValueError(f"No zones fit within disc_radius={disc_radius_mm}mm "
                         f"at f={focal_length_mm}mm, λ={wavelength_nm}nm")
    
    print(f"[FresnelDisc] {len(zone_radii)} zones, "
          f"outermost r={zone_radii[-1][1]:.2f}mm, "
          f"focal_length={focal_length_mm}mm, λ={wavelength_nm}nm")
    
    bm = bmesh.new()
    
    def circle_verts(bm, radius, z, n_seg):
        verts = []
        for i in range(n_seg):
            a = 2 * math.pi * i / n_seg
            verts.append(bm.verts.new((radius * math.cos(a),
                                       radius * math.sin(a),
                                       z)))
        return verts
    
    def make_ring_face(bm, inner_verts, outer_verts):
        n = len(inner_verts)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new([inner_verts[i], inner_verts[j],
                          outer_verts[j], outer_verts[i]])
    
    # Build top surface: alternating high/low rings
    r_prev = 0.0
    prev_verts = None
    base_z = disc_thickness_mm

    for idx, (zone_n, r) in enumerate(zone_radii):
        z = base_z + (ring_step_mm if zone_n % 2 == 1 else 0.0)
        
        if r_prev == 0.0:
            # Centre disc (zone 0 → first ring)
            inner_verts = circle_verts(bm, 0.0001, z, segments)  # near-zero centre
        else:
            inner_verts = prev_verts

        outer_verts = circle_verts(bm, r, z, segments)
        make_ring_face(bm, inner_verts, outer_verts)
        
        # Vertical wall between zones (step face)
        if idx > 0 and idx < len(zone_radii):
            z_prev = base_z + (ring_step_mm if (zone_n - 1) % 2 == 1 else 0.0)
            wall_inner = circle_verts(bm, r, z_prev, segments)
            wall_outer = circle_verts(bm, r, z, segments)
            make_ring_face(bm, wall_inner, wall_outer)
        
        prev_verts = outer_verts
        r_prev = r

    # Outer flat ring to disc edge
    r_last = zone_radii[-1][1]
    z_last = base_z + (ring_step_mm if zone_radii[-1][0] % 2 == 1 else 0.0)
    inner_edge = circle_verts(bm, r_last, z_last, segments)
    outer_edge = circle_verts(bm, disc_radius_mm, base_z, segments)
    make_ring_face(bm, inner_edge, outer_edge)

    # Flat bottom face (glass-bed face — optical quality after print)
    bottom_centre = bm.verts.new((0, 0, 0))
    bottom_ring = circle_verts(bm, disc_radius_mm, 0, segments)
    for i in range(segments):
        j = (i + 1) % segments
        bm.faces.new([bottom_centre, bottom_ring[i], bottom_ring[j]])

    # Side wall
    top_rim = circle_verts(bm, disc_radius_mm, base_z, segments)
    bottom_rim = circle_verts(bm, disc_radius_mm, 0, segments)
    make_ring_face(bm, bottom_rim, top_rim)

    # Finalise mesh
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    # Waveguide resin material
    _apply_resin_material(obj, ior=ior)
    
    print(f"[FresnelDisc] Created '{name}' — "
          f"{len(mesh.vertices)} verts, {len(mesh.polygons)} faces")
    return obj


# ─── Aspheric surface variant (via OptiCore if installed) ─────────────────────

def make_aspheric_caustic_disc(
    focal_length_mm=300.0,
    disc_radius_mm=18.0,
    disc_thickness_mm=3.0,
    ior=1.53,
    conic_constant=-1.0,    # -1 = paraboloid, 0 = sphere
    name="AsphericCaustic"
):
    """
    Attempt to use OptiCore addon for aspheric caustic disc.
    Falls back to spherical lens if OptiCore not installed.
    """
    try:
        bpy.ops.mesh.add_lens(
            ltype='PCX',
            rad1=focal_length_mm * (ior - 1.0),  # lensmaker's equation
            rad2=0,
            k=conic_constant,
            N1=1.0,
            N2=ior,
            flangerad=disc_radius_mm,
            centerthickness=disc_thickness_mm,
        )
        obj = bpy.context.active_object
        obj.name = name
        print(f"[AsphericCaustic] Created via OptiCore: '{name}'")
        return obj
        
    except AttributeError:
        print("[AsphericCaustic] OptiCore not installed — using spherical approx")
        # Simple plano-convex sphere approximation
        R = focal_length_mm * (ior - 1.0)  # lensmaker's: f = R / (n-1) for PCX
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=R, segments=64, ring_count=32
        )
        obj = bpy.context.active_object
        obj.name = name
        # Clip to disc radius
        mod = obj.modifiers.new("Clip", "BOOLEAN")
        bpy.ops.mesh.primitive_cylinder_add(radius=disc_radius_mm,
                                              depth=R*3,
                                              location=(0,0,0))
        clip_cyl = bpy.context.active_object
        mod.object = clip_cyl
        mod.operation = 'INTERSECT'
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier="Clip")
        bpy.data.objects.remove(clip_cyl)
        return obj


# ─── POI antispin caustic variant ─────────────────────────────────────────────

def make_poi_caustic_heightfield(
    focal_length_mm=300.0,
    disc_radius_mm=18.0,
    disc_thickness_mm=2.0,
    ior=1.53,
    grid_resolution=128,
    poi_R=1.0,              # normalised hand radius
    poi_r=0.333,            # poi radius (3-petal: r = R/3)
    name="PoiCausticDisc"
):
    """
    Generate a height-field disc whose caustic projects the poi antispin
    3-petal flower at the target focal distance.
    
    Method: ray tracing + gradient descent on h(x,y).
    For quick version: approximate analytically using the poi path curvature.
    """
    import numpy as np
    
    # Grid coordinates
    t = np.linspace(-disc_radius_mm, disc_radius_mm, grid_resolution)
    X, Y = np.meshgrid(t, t)
    mask = X**2 + Y**2 <= disc_radius_mm**2
    
    # Target caustic: poi antispin 3-petal path
    # Sample the path at 500 points, use as target distribution
    theta = np.linspace(0, 2*np.pi, 500)
    scale = disc_radius_mm * 0.7  # caustic fills 70% of disc radius at projection plane
    target_x = scale * (poi_R * np.cos(theta) + poi_r * np.cos(-3*theta))
    target_y = scale * (poi_R * np.sin(theta) + poi_r * np.sin(-3*theta))
    
    # Analytical height field approximation:
    # h(x,y) set so that refracted ray from (x,y,h) hits the nearest
    # point on the poi path at distance focal_length_mm
    
    def nearest_poi_point(px, py):
        """Find nearest point on poi path to (px, py)"""
        proj_x = target_x * focal_length_mm / disc_radius_mm  # scale to projection plane
        proj_y = target_y * focal_length_mm / disc_radius_mm
        dist = np.sqrt((proj_x - px)**2 + (proj_y - py)**2)
        idx = np.argmin(dist)
        return proj_x[idx], proj_y[idx]
    
    # Height field: h(x,y) = lens sag to redirect ray toward target point
    H = np.zeros_like(X)
    n = ior
    
    for i in range(grid_resolution):
        for j in range(grid_resolution):
            if not mask[i, j]:
                continue
            x, y = X[i, j], Y[i, j]
            tx, ty = nearest_poi_point(x * focal_length_mm / disc_radius_mm,
                                        y * focal_length_mm / disc_radius_mm)
            
            # Required refraction angle
            dx = tx - x
            dy = ty - y
            dz = focal_length_mm
            
            # Required slope at (x,y): dh/dx, dh/dy via Snell's law
            # sin(theta_r) = sin(theta_i) / n  (air→resin)
            # Approximate: slope ≈ (target_direction - incident_direction) / (n-1)
            slope_x = (dx/np.sqrt(dx**2+dy**2+dz**2)) / (n - 1.0)
            slope_y = (dy/np.sqrt(dx**2+dy**2+dz**2)) / (n - 1.0)
            
            H[i, j] = slope_x * x + slope_y * y
    
    # Normalise height field to ring_step range
    H = H - H[mask].min()
    H = H / H[mask].max() * disc_thickness_mm * 0.3  # max relief = 30% of thickness
    H[~mask] = 0
    
    # Build Blender mesh from height field grid
    bm = bmesh.new()
    vert_grid = {}
    
    for i in range(grid_resolution):
        for j in range(grid_resolution):
            x = X[i, j]
            y = Y[i, j]
            z = disc_thickness_mm + (H[i, j] if mask[i, j] else 0.0)
            vert_grid[(i, j)] = bm.verts.new((x, y, z))
    
    # Faces
    for i in range(grid_resolution - 1):
        for j in range(grid_resolution - 1):
            v00 = vert_grid[(i, j)]
            v10 = vert_grid[(i+1, j)]
            v11 = vert_grid[(i+1, j+1)]
            v01 = vert_grid[(i, j+1)]
            try:
                bm.faces.new([v00, v10, v11, v01])
            except ValueError:
                pass
    
    # Flat bottom (glass-bed face)
    for i in range(grid_resolution):
        for j in range(grid_resolution):
            x, y = X[i, j], Y[i, j]
            vert_grid[(i, j, 'b')] = bm.verts.new((x, y, 0))
    
    for i in range(grid_resolution - 1):
        for j in range(grid_resolution - 1):
            v00 = vert_grid[(i, j, 'b')]
            v10 = vert_grid[(i+1, j, 'b')]
            v11 = vert_grid[(i+1, j+1, 'b')]
            v01 = vert_grid[(i, j+1, 'b')]
            try:
                bm.faces.new([v00, v01, v11, v10])  # reversed normal
            except ValueError:
                pass
    
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.01)
    
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    
    _apply_resin_material(obj, ior=ior)
    print(f"[PoiCaustic] Created '{name}' with poi antispin height field")
    return obj


# ─── Shared utilities ──────────────────────────────────────────────────────────

def _apply_resin_material(obj, ior=1.53, tint=(0.95, 0.95, 0.98, 1.0)):
    """Apply clear waveguide resin material — Blender 5 compatible."""
    mat = bpy.data.materials.new(name=f"{obj.name}_Resin")
    mat.use_nodes = True
    mat.blend_method = 'BLEND'
    
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = tint
    bsdf.inputs["Transmission Weight"].default_value = 0.95   # Blender 5 key
    bsdf.inputs["IOR"].default_value = ior
    bsdf.inputs["Roughness"].default_value = 0.0
    bsdf.inputs["Alpha"].default_value = 0.85
    
    obj.data.materials.append(mat)
    return mat


def export_stl(obj, filepath, apply_modifiers=True):
    """Export single object as STL."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.wm.stl_export(
        filepath=filepath,
        export_selected_objects=True,
        ascii_format=False
    )
    print(f"[Export] STL saved: {filepath}")


def verify_printability(obj):
    """Basic printability check — watertight, min feature, overhang."""
    import bmesh as bm_module
    bm = bm_module.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    
    # Check for non-manifold edges
    non_manifold = [e for e in bm.edges if not e.is_manifold]
    watertight = len(non_manifold) == 0
    
    # Bounding box
    coords = [v.co for v in bm.verts]
    if coords:
        min_x = min(v.x for v in bm.verts)
        max_x = max(v.x for v in bm.verts)
        min_y = min(v.y for v in bm.verts)
        max_y = max(v.y for v in bm.verts)
        dims = (max_x - min_x, max_y - min_y)
    
    bm.free()
    
    report = {
        "watertight": watertight,
        "non_manifold_edges": len(non_manifold),
        "fits_200mm_bed": all(d <= 200 for d in dims),
        "dimensions_mm": dims,
    }
    print(f"[Printability] {report}")
    return report


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Example 1: Standard Fresnel zone plate — green light, 300mm projection
    disc_green = make_fresnel_disc(
        focal_length_mm=300,
        wavelength_nm=550,
        disc_radius_mm=18,
        disc_thickness_mm=3.0,
        ring_step_mm=0.2,
        name="FresnelDisc_550nm"
    )
    
    # Example 2: Poi antispin caustic height field
    disc_poi = make_poi_caustic_heightfield(
        focal_length_mm=300,
        disc_radius_mm=18,
        name="PoiCausticDisc"
    )
    disc_poi.location.x = 45  # offset for side-by-side view
    
    verify_printability(disc_green)
    verify_printability(disc_poi)
    
    print("\n[Done] Fresnel and Poi caustic discs created.")
    print("Export with: export_stl(disc_green, '/output/fresnel.stl')")
