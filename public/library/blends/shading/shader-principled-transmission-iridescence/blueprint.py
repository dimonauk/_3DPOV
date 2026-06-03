"""
Holographic Gem — Principled BSDF v2 Transmission + Iridescence
================================================================
Blender 5.1  ·  Category: shading

Principled BSDF v2 (Blender 4.0+) introduced three capabilities that,
combined, produce a holographic gem with no external add-ons:

  1. Transmission Weight  — routes light through the surface via the full
     Fresnel dielectric model.  Unlike Alpha (which discards the fragment),
     Transmission preserves the surface, refracts refraction rays, and
     obeys IOR at both entry and exit.  At Roughness < 0.08 the specular
     lobe is tight enough to read as a polished gem facet.

  2. Iridescence Thickness (nm)  — thin-film interference where the
     wavelength that constructively interferes changes with film thickness.
     Varying thickness across the surface with a Wave texture maps each
     band position to a different spectral peak → rainbow soap-bubble effect.
     Iridescence Weight stays constant; it is Thickness that sweeps colour.

  3. Coat Weight + Coat Roughness  — models the polish layer of a cut gem.
     Adds a second specular lobe above the Transmission path without
     affecting the refraction integral.  Analogous to a lacquer overcoat.

Socket-name changes from Blender 3.x → 4.0 (still valid in 5.1):
  'Transmission'        → 'Transmission Weight'
  'Clearcoat'          → 'Coat Weight'
  'Clearcoat Roughness'→ 'Coat Roughness'
  'Emission'           → 'Emission Color'
  New in 4.0: 'Iridescence Weight', 'Iridescence IOR', 'Iridescence Thickness'

glTF export: Blender's built-in glTF-IO writes KHR_materials_transmission
when Transmission Weight > 0 and KHR_materials_iridescence when Iridescence
Weight > 0 — both automatically, no extension flag required.
Three.js support: r150+ for transmission, r152+ for iridescence.

Sources
  Blender Manual — Principled BSDF  (CC-BY-SA 4.0, Blender Foundation)
  KhronosGroup/glTF — KHR_materials_iridescence spec (Apache-2.0)
"""

import bpy
from pathlib import Path

# ── OUTPUT PATHS ──────────────────────────────────────────────────────────────
_HERE     = Path(__file__).parent
BLEND_OUT = _HERE / "holographic_gem.blend"
GLB_OUT   = (
    _HERE.parents[2]
    / "glbs" / "shading" / "shader-principled-transmission-iridescence"
    / "holographic_gem.glb"
)

# ── PARAMETERS — edit these to retarget ──────────────────────────────────────
# Principled BSDF v2 (4.0+ socket names)
BASE_COLOUR         = (0.04, 0.18, 0.38, 1.0)  # sapphire deep blue
IOR                 = 1.77   # sapphire (Al₂O₃ mineral; diamond = 2.42)
ROUGHNESS           = 0.04   # tight specular → polished-gem clarity
METALLIC            = 0.0    # dielectric, not metallic
TRANSMISSION        = 0.92   # 'Transmission Weight' — most light refracts
IRIDESCENCE_WT      = 0.78   # 'Iridescence Weight' — constant driver
IRIDESCENCE_IOR     = 1.40   # thin-film RI (oil film ≈ 1.4)
IRIDESCENCE_THK_MIN = 270.0  # nm — constructive for violet/blue
IRIDESCENCE_THK_MAX = 680.0  # nm — constructive for red/amber
COAT_WT             = 0.35   # 'Coat Weight' — polish overcoat
COAT_ROUGHNESS      = 0.02

# Texture scales (object-space: 1 Blender unit = 1 m post-apply-scale)
VORONOI_SCALE       = 13.0   # internal crystal-lattice grain density
VORONOI_RANDOMNESS  = 0.80   # cell irregularity (0 = hexagonal, 1 = random)
WAVE_SCALE          = 7.0    # rainbow-band spatial frequency
WAVE_DISTORTION     = 1.4    # breaks band parallelism for organic look
NOISE_SCALE         = 48.0   # micro-surface imperfection frequency
BUMP_STRENGTH       = 0.22   # low — strong bump destroys gem clarity
BUMP_DISTANCE       = 0.002  # 2 mm physical displacement

# Voronoi-to-base-colour blend
VORONOI_MIX_FAC     = 0.24   # fraction of bright cell-edge colour in base

# Mesh
GEM_RADIUS          = 0.70
SUBDIV_LEVELS       = 3      # ico-sphere: 20 → 1280 triangles after 3 levels

# Render
RENDER_ENGINE       = 'CYCLES'
CYCLES_SAMPLES      = 96

# ── SCENE SETUP ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.render.engine = RENDER_ENGINE
if RENDER_ENGINE == 'CYCLES':
    scene.cycles.samples       = CYCLES_SAMPLES
    scene.cycles.use_denoising = True
else:
    # EEVEE Next requires SSR to show refraction behind transparent surfaces.
    # Without it, transmission renders as a flat alpha hole.
    scene.eevee.use_ssr           = True
    scene.eevee.use_ssr_refraction = True

# ── GEM MESH ──────────────────────────────────────────────────────────────────
# Icosphere triangles give natural facets that the Principled BSDF reads
# better than quads for Iridescence colour interpolation across sharp edges.
bpy.ops.mesh.primitive_ico_sphere_add(
    subdivisions=SUBDIV_LEVELS,
    radius=GEM_RADIUS,
    location=(0.0, 0.0, 0.0),
)
gem = bpy.context.active_object
gem.name = "holographic_gem"

# Apply scale so Texture Coordinate Object space is 1 m == 1 Blender unit.
# Without this, the Voronoi/Wave object coords scale with any mesh-level scale
# override rather than the VORONOI_SCALE / WAVE_SCALE constants above.
bpy.ops.object.transform_apply(scale=True, location=False, rotation=False)

# ── MATERIAL ──────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new(name="HolographicGem")
mat.use_nodes          = True
mat.use_backface_culling = False  # allow back-face transmission rays (Cycles)

tree  = mat.node_tree
nodes = tree.nodes
links = tree.links
nodes.clear()

def mk(ntype, x=0, y=0):
    nd = nodes.new(ntype)
    nd.location = (x, y)
    return nd

# ── NODE GRAPH ────────────────────────────────────────────────────────────────

# 1 — Texture Coordinate + Mapping (object space)
# Object-space coordinates stay locked to the mesh regardless of the camera
# or world transforms — correct for a gem that can rotate freely in a scene.
n_coord = mk('ShaderNodeTexCoord', x=-940, y=   0)
n_map   = mk('ShaderNodeMapping',  x=-760, y=   0)
links.new(n_coord.outputs['Object'], n_map.inputs['Vector'])

# 2 — Voronoi Texture (F2 mode → crystal cell-edge pattern)
# F2 returns the distance to the *second* nearest Voronoi point, which
# creates bright edges between cells and a darker interior — analogous to
# the crystal planes inside a cut gem that scatter light along cleavage faces.
# F1 would give just blobs; DISTANCE_TO_EDGE is sharper but noisier at seams.
n_vor = mk('ShaderNodeTexVoronoi', x=-550, y= 200)
n_vor.voronoi_dimensions               = '3D'
n_vor.feature                          = 'F2'
n_vor.distance                         = 'EUCLIDEAN'
n_vor.inputs['Scale'].default_value       = VORONOI_SCALE
n_vor.inputs['Randomness'].default_value  = VORONOI_RANDOMNESS
links.new(n_map.outputs['Vector'], n_vor.inputs['Vector'])

# 3 — Wave Texture → drives Iridescence Thickness (nm)
# BANDS + DIAGONAL direction breaks left–right symmetry so the iridescence
# reads as natural diffraction, not a screen-space artefact.
# The Fac output (greyscale 0–1) is mapped to the nm range below.
n_wave = mk('ShaderNodeTexWave', x=-550, y= -80)
n_wave.wave_type       = 'BANDS'
n_wave.bands_direction = 'DIAGONAL'
n_wave.wave_profile    = 'SIN'
n_wave.inputs['Scale'].default_value       = WAVE_SCALE
n_wave.inputs['Distortion'].default_value  = WAVE_DISTORTION
links.new(n_map.outputs['Vector'], n_wave.inputs['Vector'])

# 4 — Noise Texture → micro-bump height field
n_noise = mk('ShaderNodeTexNoise', x=-550, y=-320)
n_noise.noise_dimensions               = '3D'
n_noise.inputs['Scale'].default_value     = NOISE_SCALE
n_noise.inputs['Detail'].default_value    = 8.0
n_noise.inputs['Roughness'].default_value = 0.55
links.new(n_map.outputs['Vector'], n_noise.inputs['Vector'])

# 5 — Map Range: Wave.Fac (0–1) → Iridescence Thickness (nm)
# Physically: film thickness 270 nm → constructive for violet; 680 nm → red.
# The Map Range converts the abstract 0–1 greyscale to a physical quantity
# the Principled BSDF can evaluate against the wavelength integral.
n_mr = mk('ShaderNodeMapRange', x=-290, y= -80)
n_mr.inputs['From Min'].default_value = 0.0
n_mr.inputs['From Max'].default_value = 1.0
n_mr.inputs['To Min'].default_value   = IRIDESCENCE_THK_MIN
n_mr.inputs['To Max'].default_value   = IRIDESCENCE_THK_MAX
links.new(n_wave.outputs['Fac'], n_mr.inputs['Value'])

# 6 — Bump Node (height → normal perturbation)
# Displacement would raise actual geometry, breaking the icosphere silhouette.
# Bump perturbs normals only — preserves the gem outline while adding
# micro-surface scattering that softens the specular highlight at grazing angles.
n_bump = mk('ShaderNodeBump', x=-290, y=-320)
n_bump.inputs['Strength'].default_value = BUMP_STRENGTH
n_bump.inputs['Distance'].default_value = BUMP_DISTANCE
links.new(n_noise.outputs['Fac'], n_bump.inputs['Height'])

# 7 — Mix Color: blend Voronoi edges into base colour
# Voronoi.Distance outputs 0 (cell interior) → 1 (cell boundary).
# Factor is wired directly from Distance so cells with F2 > 0 shift toward
# the bright icy-blue B input, adding visible internal planes through
# the transmission window at low mix-factor (0.24).
n_mix = mk('ShaderNodeMix', x=-290, y= 200)
n_mix.data_type  = 'RGBA'
n_mix.blend_type = 'MIX'
n_mix.inputs['A'].default_value = BASE_COLOUR
n_mix.inputs['B'].default_value = (0.86, 0.93, 1.0, 1.0)  # bright ice-blue
links.new(n_vor.outputs['Distance'], n_mix.inputs['Factor'])

# 8 — Principled BSDF v2
# Wiring Iridescence Thickness from Map Range — not Iridescence Weight —
# is the key departure from naive setups. Most tutorials drive Weight from
# a texture, which just dims/brightens the effect. Driving Thickness is
# physically correct: it shifts WHICH wavelength appears, sweeping spectrum.
n_pbsdf = mk('ShaderNodeBsdfPrincipled', x=80, y=0)
n_pbsdf.inputs['Roughness'].default_value           = ROUGHNESS
n_pbsdf.inputs['IOR'].default_value                 = IOR
n_pbsdf.inputs['Metallic'].default_value            = METALLIC
n_pbsdf.inputs['Transmission Weight'].default_value = TRANSMISSION
n_pbsdf.inputs['Iridescence Weight'].default_value  = IRIDESCENCE_WT
n_pbsdf.inputs['Iridescence IOR'].default_value     = IRIDESCENCE_IOR
n_pbsdf.inputs['Coat Weight'].default_value         = COAT_WT
n_pbsdf.inputs['Coat Roughness'].default_value      = COAT_ROUGHNESS

links.new(n_mix.outputs['Result'],   n_pbsdf.inputs['Base Color'])
links.new(n_mr.outputs['Result'],    n_pbsdf.inputs['Iridescence Thickness'])
links.new(n_bump.outputs['Normal'],  n_pbsdf.inputs['Normal'])

# 9 — Material Output
n_out = mk('ShaderNodeOutputMaterial', x=380, y=0)
links.new(n_pbsdf.outputs['BSDF'], n_out.inputs['Surface'])

gem.data.materials.append(mat)

# ── LIGHT + CAMERA ────────────────────────────────────────────────────────────
# A single Area light above-left reveals the Coat specular separately from the
# Transmission refraction — two readable visual layers in one render.
bpy.ops.object.light_add(type='AREA', location=(2.5, -1.5, 3.0))
light = bpy.context.active_object
light.data.energy = 450
light.data.size   = 1.2

bpy.ops.object.camera_add(location=(0, -2.8, 0.6))
cam = bpy.context.active_object
cam.rotation_euler = (1.48, 0.0, 0.0)
scene.camera = cam

# ── GLB EXPORT ────────────────────────────────────────────────────────────────
GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
gem.select_set(True)
bpy.context.view_layer.objects.active = gem

bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
    export_image_format='WEBP',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

# ── SAVE BLEND ────────────────────────────────────────────────────────────────
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
print(f"[blueprint] blend → {BLEND_OUT}")
print(f"[blueprint] glb   → {GLB_OUT}")
