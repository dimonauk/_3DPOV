"""
grin_generator.py
=================
Gradient Index (GRIN) waveguide geometry for resin 3D printing.

Generates resin sculptures with spatially varying optical structure
that approximates a GRIN profile through:
  1. Concentric shell geometry (discrete IOR steps)
  2. Internal void gradient (density varies radially → effective IOR gradient)
  3. TPMS infill gradient (cell size varies radially)

The GRIN effect causes light rays to curve back toward the centre axis
rather than reflecting off walls — enabling self-imaging, helical ray
paths, and concentrically structured exit patterns.

Self-imaging period:
    P = 2π / sqrt(2 * n0 * alpha²)
    where alpha = gradient parameter, n0 = core IOR
"""

import bpy
import bmesh
import math
import numpy as np


# ─── GRIN shell generator ─────────────────────────────────────────────────────

def make_grin_shell_column(
    outer_radius_mm=10.0,
    height_mm=80.0,
    n_shells=5,
    ior_core=1.53,
    ior_cladding=1.48,
    shell_thickness_mm=None,
    segments=64,
    name="GRIN_Column"
):
    """
    Concentric cylinder shells approximating a parabolic GRIN profile.
    
    In practice: print outermost shell in one resin IOR, fill centre
    with slightly different IOR resin and allow diffusion.
    
    For Blender: generates the geometry for visualisation and for
    planning the multi-resin print sequence.
    
    IOR profile (parabolic):
        n(r) = n_core * sqrt(1 - (alpha * r)²)
        
    Approximated by discrete shells:
        shell_k IOR = lerp(ior_core, ior_cladding, (k/n_shells)²)
    """
    if shell_thickness_mm is None:
        shell_thickness_mm = outer_radius_mm / n_shells
    
    objects = []
    
    for k in range(n_shells):
        r_outer = outer_radius_mm - k * shell_thickness_mm
        r_inner = r_outer - shell_thickness_mm
        if r_inner < 0:
            r_inner = 0
        
        # Parabolic IOR interpolation
        t = (k / n_shells) ** 2  # 0 at surface, ~1 at core
        ior_k = ior_cladding + t * (ior_core - ior_cladding)
        
        # Shell colour for visualisation (blue=low IOR, red=high IOR)
        hue_t = t
        colour = (hue_t, 0.3, 1.0 - hue_t, 0.7)
        
        bm = bmesh.new()
        
        def cyl_ring(bm, r, z, n_seg):
            return [bm.verts.new((r * math.cos(2*math.pi*i/n_seg),
                                  r * math.sin(2*math.pi*i/n_seg), z))
                    for i in range(n_seg)]
        
        # Top and bottom rings, inner and outer
        bt_out = cyl_ring(bm, r_outer, 0, segments)
        tp_out = cyl_ring(bm, r_outer, height_mm, segments)
        
        if r_inner > 0.01:
            bt_in  = cyl_ring(bm, r_inner, 0, segments)
            tp_in  = cyl_ring(bm, r_inner, height_mm, segments)
            
            for i in range(segments):
                j = (i+1) % segments
                # Outer wall
                bm.faces.new([bt_out[i], bt_out[j], tp_out[j], tp_out[i]])
                # Inner wall
                bm.faces.new([bt_in[j], bt_in[i], tp_in[i], tp_in[j]])
                # Top annulus
                bm.faces.new([tp_out[i], tp_out[j], tp_in[j], tp_in[i]])
                # Bottom annulus
                bm.faces.new([bt_out[j], bt_out[i], bt_in[i], bt_in[j]])
        else:
            # Innermost solid core
            centre_top = bm.verts.new((0, 0, height_mm))
            centre_bot = bm.verts.new((0, 0, 0))
            for i in range(segments):
                j = (i+1) % segments
                bm.faces.new([bt_out[i], bt_out[j], tp_out[j], tp_out[i]])
                bm.faces.new([centre_top, tp_out[j], tp_out[i]])
                bm.faces.new([centre_bot, bt_out[i], bt_out[j]])
        
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        
        shell_name = f"{name}_Shell{k}_IOR{ior_k:.3f}"
        mesh = bpy.data.meshes.new(shell_name)
        bm.to_mesh(mesh)
        bm.free()
        
        obj = bpy.data.objects.new(shell_name, mesh)
        bpy.context.collection.objects.link(obj)
        
        # Material with IOR
        mat = bpy.data.materials.new(shell_name + "_Mat")
        mat.use_nodes = True
        mat.blend_method = 'BLEND'
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = colour
        bsdf.inputs["Transmission Weight"].default_value = 0.92
        bsdf.inputs["IOR"].default_value = ior_k
        bsdf.inputs["Roughness"].default_value = 0.0
        bsdf.inputs["Alpha"].default_value = 0.6
        obj.data.materials.append(mat)
        
        objects.append(obj)
        print(f"[GRIN] Shell {k}: r={r_outer:.1f}→{r_inner:.1f}mm, IOR={ior_k:.4f}")
    
    return objects


# ─── GRIN void-density gradient ───────────────────────────────────────────────

def make_grin_void_gradient(
    column_radius_mm=8.0,
    height_mm=60.0,
    n_voids=800,
    void_radius_core_mm=0.05,   # tiny voids at centre (low scatter)
    void_radius_edge_mm=0.25,   # larger voids at edge (high scatter → low effective IOR)
    segments=64,
    name="GRIN_VoidGradient"
):
    """
    Gradient effective IOR via void density variation.
    
    Edge has larger/more voids → more air inclusion → lower effective IOR.
    Centre has fewer/smaller voids → higher effective IOR.
    This approximates a parabolic GRIN profile in a single-resin print.
    
    Effective IOR at radius r:
        n_eff(r) ≈ n_resin * (1 - fill_fraction(r))
              + n_air * fill_fraction(r)
        
    Parabolic fill fraction:
        fill_fraction(r) = fill_max * (r / R)²
    """
    # Create outer column
    bpy.ops.mesh.primitive_cylinder_add(
        radius=column_radius_mm,
        depth=height_mm,
        location=(0, 0, height_mm/2),
        vertices=segments
    )
    column = bpy.context.active_object
    column.name = name
    
    # Generate void positions with radially varying density
    bm_voids = bmesh.new()
    placed = 0
    attempts = 0
    void_positions = []
    void_radii_list = []
    
    while placed < n_voids and attempts < n_voids * 20:
        # Sample in cylinder
        r_sample = column_radius_mm * math.sqrt(np.random.uniform(0, 1))
        theta = np.random.uniform(0, 2 * math.pi)
        z = np.random.uniform(1.0, height_mm - 1.0)
        
        x = r_sample * math.cos(theta)
        y = r_sample * math.sin(theta)
        
        # Void radius scales with radial position (parabolic)
        t = (r_sample / column_radius_mm) ** 2
        r_void = void_radius_core_mm + t * (void_radius_edge_mm - void_radius_core_mm)
        
        # Rejection probability: denser at edges (more voids per unit area)
        accept_prob = 0.1 + 0.9 * t  # always accept some at core, always at edge
        if np.random.uniform(0, 1) > accept_prob:
            attempts += 1
            continue
        
        # Check minimum spacing
        too_close = False
        for (px, py, pz), pr in zip(void_positions, void_radii_list):
            dist = math.sqrt((x-px)**2 + (y-py)**2 + (z-pz)**2)
            if dist < r_void + pr + 0.1:  # 0.1mm wall
                too_close = True
                break
        
        if not too_close:
            void_positions.append((x, y, z))
            void_radii_list.append(r_void)
            placed += 1
        
        attempts += 1
    
    print(f"[GRIN Voids] {placed} voids placed ({attempts} attempts)")
    
    # Build void mesh
    for pos, r in zip(void_positions, void_radii_list):
        # Simple icosphere approximation via UV sphere low-poly
        for ring in range(1, 4):
            phi = math.pi * ring / 4
            rr = r * math.sin(phi)
            z_offset = r * math.cos(phi)
            for seg in range(6):
                theta = 2 * math.pi * seg / 6
                bm_voids.verts.new((
                    pos[0] + rr * math.cos(theta),
                    pos[1] + rr * math.sin(theta),
                    pos[2] + z_offset
                ))
    
    # Build faces (simplified — use convex hull per void)
    # For production use, better to create individual spheres and Boolean
    
    void_mesh = bpy.data.meshes.new(f"{name}_VoidMesh")
    bm_voids.to_mesh(void_mesh)
    bm_voids.free()
    
    void_obj = bpy.data.objects.new(f"{name}_Voids", void_mesh)
    bpy.context.collection.objects.link(void_obj)
    
    # Boolean subtract
    mod = column.modifiers.new("GRINVoids", "BOOLEAN")
    mod.operation = 'DIFFERENCE'
    mod.object = void_obj
    mod.solver = 'FAST'
    bpy.context.view_layer.objects.active = column
    bpy.ops.object.modifier_apply(modifier="GRINVoids")
    
    void_obj.hide_render = True
    void_obj.hide_viewport = True
    
    return column


# ─── Self-imaging period calculator ───────────────────────────────────────────

def grin_self_imaging_period(n0, alpha, wavelength_nm=550):
    """
    Calculate the self-imaging period of a parabolic GRIN waveguide.
    
    P = 2π / sqrt(2 * n0 * alpha²)
    
    At multiples of P, the input beam pattern exactly reproduces.
    At P/2, beam is inverted. At P/4, beam is narrowest (focus).
    
    Parameters
    ----------
    n0          : core IOR (1.53 for clear resin)
    alpha       : gradient parameter (1/mm)
    wavelength_nm: design wavelength
    
    Returns
    -------
    dict with period, focus_depth, half_period
    """
    period_mm = 2 * math.pi / math.sqrt(2 * n0 * alpha**2)
    
    return {
        "self_imaging_period_mm": period_mm,
        "focus_depth_mm": period_mm / 4,       # narrowest beam
        "half_period_mm": period_mm / 2,       # inverted pattern
        "n0": n0,
        "alpha": alpha,
        "wavelength_nm": wavelength_nm,
        "ring_spacing_visible_mm": period_mm / 4,  # ring separation in column
    }


def design_grin_for_sculpture_height(height_mm, n_focus_points=3, n0=1.53):
    """
    Compute alpha so that the beam focuses n_focus_points times
    over the sculpture height.
    
    P = height / n_focus_points
    alpha = 2π / (P * sqrt(2 * n0))
    """
    period = height_mm / n_focus_points
    alpha = 2 * math.pi / (period * math.sqrt(2 * n0))
    
    result = grin_self_imaging_period(n0, alpha)
    result["designed_for_height_mm"] = height_mm
    result["n_focus_rings"] = n_focus_points
    
    print(f"[GRIN Design]")
    print(f"  Column height: {height_mm}mm")
    print(f"  Focus rings visible: {n_focus_points}")
    print(f"  Self-imaging period: {result['self_imaging_period_mm']:.1f}mm")
    print(f"  Alpha: {alpha:.4f} /mm")
    print(f"  IOR at edge for parabolic profile: {n0 * math.sqrt(1 - (alpha * height_mm/4)**2):.4f}")
    
    return result, alpha


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Design GRIN column for 80mm sculpture with 3 visible focus rings
    params, alpha = design_grin_for_sculpture_height(80.0, n_focus_points=3)
    print(f"\nGRIN parameters: alpha={alpha:.4f}, period={params['self_imaging_period_mm']:.1f}mm")
    
    # Build concentric shell visualisation
    shells = make_grin_shell_column(
        outer_radius_mm=8.0,
        height_mm=80.0,
        n_shells=6,
        ior_core=1.53,
        ior_cladding=1.48,
        name="GRIN_Shells"
    )
    
    print(f"\n[Done] GRIN column with {len(shells)} shells.")
    print("Inner shells: high IOR (red). Outer shells: low IOR (blue).")
    print("Light curves toward centre — self-imaging produces focus rings.")
    print(f"Rings visible every {params['ring_spacing_visible_mm']:.0f}mm along height.")
