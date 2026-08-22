"""
blueprint.py — EEVEE Next Render Configuration via Python (Blender 5.1)
=======================================================================
Technique synopsis
------------------
bpy.types.SceneEEVEE is the datablock at scene.eevee that controls every
render-quality knob for the EEVEE Next engine.  In Blender 5.x the legacy
BLENDER_EEVEE engine identifier was removed; all EEVEE work must use
BLENDER_EEVEE_NEXT.  Setting the wrong identifier raises ValueError with no
further context, which is the most common "my scene looks wrong" root cause.

This blueprint assembles a save/load preset pattern:

  make_preset(**overrides)        → dict of all EEVEE quality settings
  apply_eevee_preset(scene, dict) → writes each key onto scene.eevee
  save_preset_json(dict, path)    → serialises to JSON for CI/batch use
  load_preset_json(path)          → restores from JSON

Then it builds a six-sphere calibration grid that exercises every subsystem:
  - Two chrome spheres (metallic = 1.0, roughness 0.05 / 0.40) → SSR + shadows
  - One matte metallic sphere (roughness 0.85)                   → probe fallback
  - Two dielectric spheres (roughness 0.05 / 0.40)               → GTAO + SSR
  - One chalk sphere (roughness 0.90)                            → GTAO only

Why a preset dict instead of direct assignment?
  Batch GLB bake pipelines run across many .blend files; JSON export allows
  a CI job to verify that every file's eevee settings match the studio spec
  before kicking off F12 renders.  The preset dict is also self-documenting —
  it travels with the asset as a sidecar file.
"""

import bpy
import json
import math
import pathlib

# ─────────────────────────────────────────────────────────────────────────────
# PARAMETERS — studio defaults for WebXR preview quality
# ─────────────────────────────────────────────────────────────────────────────
PRESET_NAME         = "holoflow_webxr_preview_v1"
TAA_RENDER_SAMPLES  = 64     # 64 converges EEVEE Next TAA well for WebXR stills
TAA_VIEWPORT_SMPLS  = 8      # interactive viewport; 8 is the EEVEE Next default

# SSR (Screen-Space Reflections)
SSR_ENABLED         = True
SSR_MAX_ROUGHNESS   = 0.50   # above this → fallback to cubemap probe
SSR_QUALITY         = 0.40   # ray-step count factor; 0.4 = studio default
SSR_THICKNESS       = 0.12   # hit-slab depth (m); too thin → dark halo artefact
SSR_BORDER_FADE     = 0.10   # normalised edge band; 0.0 = hard pop at boundary
SSR_FIREFLY_FAC     = 8.0    # clamp extreme bright samples in SSR accumulation
SSR_REFRACTION      = True   # required for Transmission > 0 in Principled BSDF

# GTAO (Ground Truth Ambient Occlusion)
AO_ENABLED          = True
AO_DISTANCE         = 0.50   # sphere-of-influence radius (metres)
AO_FACTOR           = 0.75   # output multiplier (< 1.0 = subtle)
AO_QUALITY          = 0.75   # sample density factor; 1.0 = 16 samples

# Shadows
SHADOWS_ENABLED     = True

# Hardware RT — NVIDIA RTX / AMD RDNA3 / Apple Silicon Metal RT required
# When False: EEVEE Next falls back to screen-space SSR + GTAO
USE_RAYTRACING      = False
RT_METHOD           = "SCREEN"  # "SCREEN" | "HARDWARE"


# ─────────────────────────────────────────────────────────────────────────────
# PRESET FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────
def make_preset(**overrides) -> dict:
    """Return a preset dict with studio defaults, optionally overridden."""
    defaults = {
        "name":                 PRESET_NAME,
        "taa_render_samples":   TAA_RENDER_SAMPLES,
        "taa_viewport_samples": TAA_VIEWPORT_SMPLS,
        "shadows_enabled":      SHADOWS_ENABLED,
        "ssr_enabled":          SSR_ENABLED,
        "ssr_max_roughness":    SSR_MAX_ROUGHNESS,
        "ssr_quality":          SSR_QUALITY,
        "ssr_thickness":        SSR_THICKNESS,
        "ssr_border_fade":      SSR_BORDER_FADE,
        "ssr_firefly_fac":      SSR_FIREFLY_FAC,
        "ssr_refraction":       SSR_REFRACTION,
        "ao_enabled":           AO_ENABLED,
        "ao_distance":          AO_DISTANCE,
        "ao_factor":            AO_FACTOR,
        "ao_quality":           AO_QUALITY,
        "use_raytracing":       USE_RAYTRACING,
        "ray_tracing_method":   RT_METHOD,
        "use_motion_blur":      False,
    }
    defaults.update(overrides)
    return defaults


def apply_eevee_preset(scene, preset: dict) -> None:
    """Write every key from preset onto scene.eevee and scene.render."""
    # BLENDER_EEVEE (legacy) was removed in 5.x — ValueError if used
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    e = scene.eevee

    # TAA: primary AA method in EEVEE Next
    e.taa_render_samples = preset["taa_render_samples"]
    e.taa_samples        = preset["taa_viewport_samples"]  # interactive viewport

    # Shadows — EEVEE Next uses a virtual shadow map atlas
    e.use_shadows = preset["shadows_enabled"]

    # Screen-Space Reflections
    e.use_ssr            = preset["ssr_enabled"]
    e.ssr_max_roughness  = preset["ssr_max_roughness"]
    e.ssr_quality        = preset["ssr_quality"]
    e.ssr_thickness      = preset["ssr_thickness"]
    e.ssr_border_fade    = preset["ssr_border_fade"]
    e.ssr_firefly_fac    = preset["ssr_firefly_fac"]
    e.use_ssr_refraction = preset["ssr_refraction"]

    # GTAO — Ground Truth Ambient Occlusion
    e.use_gtao      = preset["ao_enabled"]
    e.gtao_distance = preset["ao_distance"]
    if hasattr(e, "gtao_factor"):   # property confirmed in 4.2+
        e.gtao_factor = preset["ao_factor"]
    if hasattr(e, "gtao_quality"):  # property confirmed in 4.2+
        e.gtao_quality = preset["ao_quality"]

    # Hardware RT — only available on capable GPUs; guard with hasattr
    if hasattr(e, "use_raytracing") and preset["use_raytracing"]:
        e.use_raytracing     = True
        e.ray_tracing_method = preset["ray_tracing_method"]
    elif hasattr(e, "use_raytracing"):
        e.use_raytracing = False

    # Disable motion blur for still bakes (compositor VecBlur is preferred)
    e.use_motion_blur = preset["use_motion_blur"]


def save_preset_json(preset: dict, filepath: str) -> None:
    p = pathlib.Path(bpy.path.abspath(filepath))
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(preset, indent=2))
    print(f"[EEVEE preset] saved → {p}")


def load_preset_json(filepath: str) -> dict:
    p = pathlib.Path(bpy.path.abspath(filepath))
    return json.loads(p.read_text())


# ─────────────────────────────────────────────────────────────────────────────
# SCENE SETUP — six-sphere calibration grid
# ─────────────────────────────────────────────────────────────────────────────
scene = bpy.context.scene

# Remove stale objects from previous runs
for obj in list(scene.objects):
    if obj.name.startswith("EEVEECalib"):
        bpy.data.objects.remove(obj, do_unlink=True)

# Reflective floor — exercises SSR and shadows together
bpy.ops.mesh.primitive_plane_add(size=14.0, location=(1.0, 0, -1.05))
floor = bpy.context.active_object
floor.name = "EEVEECalibFloor"
floor_mat = bpy.data.materials.new("EEVEECalibFloor_Mat")
floor_mat.use_nodes = True
fb = floor_mat.node_tree.nodes["Principled BSDF"]
fb.inputs["Base Color"].default_value = (0.06, 0.06, 0.08, 1.0)
fb.inputs["Metallic"].default_value   = 1.0
fb.inputs["Roughness"].default_value  = 0.02  # near mirror: SSR clearly visible
floor.data.materials.append(floor_mat)
floor["holoflow:facet"] = False

# Six spheres: metallic gradient left, dielectric gradient right
SPHERE_CFG = [
    ("EEVEECalib_ChromeMirror",  (-5.0, 0, 0), (0.80, 0.65, 0.35, 1.0), 1.0, 0.05),
    ("EEVEECalib_BrushedSteel",  (-3.0, 0, 0), (0.72, 0.72, 0.72, 1.0), 1.0, 0.40),
    ("EEVEECalib_CastIron",      (-1.0, 0, 0), (0.50, 0.50, 0.55, 1.0), 1.0, 0.85),
    ("EEVEECalib_GlossRed",      ( 1.0, 0, 0), (0.75, 0.10, 0.10, 1.0), 0.0, 0.05),
    ("EEVEECalib_SatinBlue",     ( 3.0, 0, 0), (0.10, 0.40, 0.80, 1.0), 0.0, 0.40),
    ("EEVEECalib_Chalk",         ( 5.0, 0, 0), (0.88, 0.84, 0.78, 1.0), 0.0, 0.90),
]
for name, loc, col, met, rgh in SPHERE_CFG:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.85, location=loc, segments=48, ring_count=24)
    sph = bpy.context.active_object
    sph.name = name
    mat = bpy.data.materials.new(name + "_Mat")
    mat.use_nodes = True
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = col
    b.inputs["Metallic"].default_value   = met
    b.inputs["Roughness"].default_value  = rgh
    sph.data.materials.append(mat)
    sph["holoflow:facet"] = False

# Sun lamp — solar disc size gives realistic soft shadow penumbra
sun_d = bpy.data.lights.new("EEVEECalibSun", "SUN")
sun_d.energy     = 6.0
sun_d.angle      = math.radians(0.53)  # real solar angular diameter
sun_d.use_shadow = True
sun_o = bpy.data.objects.new("EEVEECalibSun", sun_d)
scene.collection.objects.link(sun_o)
sun_o.rotation_euler = (math.radians(58), 0, math.radians(-35))

# Camera: low angle to show floor reflections
cam_d = bpy.data.cameras.new("EEVEECalibCam")
cam_d.lens = 50.0
cam_o = bpy.data.objects.new("EEVEECalibCam", cam_d)
scene.collection.objects.link(cam_o)
cam_o.location       = (0.0, -11.0, 2.5)
cam_o.rotation_euler = (math.radians(80), 0, 0)
scene.camera = cam_o

# ─────────────────────────────────────────────────────────────────────────────
# APPLY + SAVE
# ─────────────────────────────────────────────────────────────────────────────
preset = make_preset()
apply_eevee_preset(scene, preset)
save_preset_json(preset, "//eevee_preset_holoflow_webxr_preview.json")

print("EEVEE Next preset applied.")
print("Press Z → Rendered to see all six spheres with SSR floor reflections + GTAO.")
print("Preset JSON saved as eevee_preset_holoflow_webxr_preview.json beside the .blend.")
