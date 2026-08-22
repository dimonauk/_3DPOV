"""
Holoflow Studio — Blender 5.1 Blueprint
Python bpy.types.Object.light_linking — Cycles Light Linking
Receiver & Blocker Collections, Per-Object Light Masking & Selective Lightmap Bake for WebXR

Cycles Light Linking (stable in Blender 5.1, introduced 4.0) provides per-light
control over which objects receive illumination and which cast shadows for that
specific source.  Two Collection references hang off each light's `light_linking`
slot: `receiver_collection` — the inclusive set of objects lit by this source —
and `blocker_collection` — the inclusive set of objects that cast shadows for it.
An unset collection restores Blender's default all-objects behaviour.

WHY this matters for WebXR: real-time WebXR engines (Three.js, Babylon.js, A-Frame)
have no Cycles renderer.  The only way to carry selective lighting cues — fill
light warming only the hero prop, rim light bypassing the floor — into a deployed
experience is to bake the arrangement into a UV lightmap during authoring.  Cycles
Light Linking bakes correctly: `bpy.ops.object.bake(type='DIFFUSE')` evaluates
the full dependency graph including receiver/blocker collections.

Blueprint scene: floor plane + faceted icosphere hero + small accent orb.
Three lights: key (all objects), fill (hero only), rim (hero + accent receive;
hero only casts rim shadows).  Hero lightmap baked at 512 px, exported as GLB.

Outputs:
    hero_prop_lightmap.webp    — 512×512 UV baked diffuse lightmap
    light_linking_export.glb   — Draco 6, hero with embedded lightmap
    ll_meta.json               — per-light receiver/blocker manifest
"""

import bpy
import json
import math

# ─── Parameters ──────────────────────────────────────────────────────────────
HERO_NAME     = "hero_faceted_gem"
ACCENT_NAME   = "accent_orb"
FLOOR_NAME    = "floor_plane"
KEY_NAME      = "light_key"
FILL_NAME     = "light_fill"
RIM_NAME      = "light_rim"
BAKE_RES      = 512
BAKE_SAMPLES  = 64
OUT_WEBP      = "//hero_prop_lightmap.webp"
OUT_GLB       = "//light_linking_export.glb"
OUT_META      = "//ll_meta.json"
DRACO_LEVEL   = 6
WEBP_QUALITY  = 88


# ─── 1. Scene reset ───────────────────────────────────────────────────────────
def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for blk in (bpy.data.meshes, bpy.data.materials,
                bpy.data.images, bpy.data.collections):
        for item in list(blk):
            blk.remove(item)


# ─── 2. Geometry helpers ──────────────────────────────────────────────────────
def make_faceted_gem(name: str, location: tuple) -> bpy.types.Object:
    """
    Icosphere → Subdivide → Decimate to taste.  Flat shading per face gives the
    studio's faceted crystal look.  Two UV islands keep the lightmap well-packed.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.6, location=location)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name

    # Decimate: ratio 0.5 keeps enough facets for a readable silhouette.
    dec = ob.modifiers.new("Decimate", 'DECIMATE')
    dec.ratio = 0.5
    bpy.ops.object.modifier_apply(modifier="Decimate")

    # Flat shading: each face reads as a distinct colour plane under lighting.
    bpy.ops.object.shade_flat()

    # Smart UV project — angle_limit 45° gives balanced islands for baking.
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(45), island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


def make_accent_orb(name: str, location: tuple) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
                                          radius=0.25, location=location)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name
    bpy.ops.object.shade_smooth()
    return ob


def make_floor(name: str) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=4.0, location=(0, 0, -0.6))
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


# ─── 3. Materials ─────────────────────────────────────────────────────────────
def make_material(name: str, base_colour: tuple, roughness: float = 0.9
                  ) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*base_colour, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def add_bake_image_node(mat: bpy.types.Material,
                        img: bpy.types.Image) -> bpy.types.Node:
    """
    CRITICAL: the active Image Texture node in the active material is the bake
    target.  We do NOT wire it into the shader graph — the bake operator writes
    pixels directly.  Leaving it unconnected (but selected) is the correct pattern.
    """
    nt = mat.node_tree
    node = nt.nodes.new('ShaderNodeTexImage')
    node.image = img
    node.location = (-400, -300)
    # Make it the active node so bpy.ops.object.bake knows where to write.
    nt.nodes.active = node
    return node


# ─── 4. Lights ────────────────────────────────────────────────────────────────
def make_light(name: str, kind: str, energy: float,
               location: tuple, rotation_deg: tuple) -> bpy.types.Object:
    bpy.ops.object.light_add(type=kind, location=location)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name
    ob.data.energy = energy
    ob.rotation_euler = [math.radians(d) for d in rotation_deg]
    if kind == 'AREA':
        ob.data.size = 1.0
    elif kind == 'SPOT':
        ob.data.spot_size = math.radians(45)
        ob.data.spot_blend = 0.15
    return ob


# ─── 5. Light Linking — the core technique ───────────────────────────────────
def setup_light_linking(hero: bpy.types.Object,
                        accent: bpy.types.Object,
                        floor: bpy.types.Object) -> dict:
    """
    Light Linking API lives on bpy.types.ObjectLightLinking, accessed via
    light_obj.light_linking.  Two slots:

        receiver_collection — Collection of objects illuminated by this light.
            Empty/None → all scene objects (default Blender behaviour).
            Set → ONLY objects in this collection receive this light.

        blocker_collection  — Collection of objects that cast shadows for this
            light.  Empty/None → all objects cast shadows.  Set → ONLY listed
            objects cast shadows from this light source.

    IMPORTANT: these collections are plain bpy.data.collections data-blocks.
    They must NOT be linked into the scene collection hierarchy (that would
    expose them as viewport collections and add spurious outliner noise).  The
    light_linking slot creates an implicit dependency — Cycles evaluates the
    reference even without a scene link.
    """
    key  = bpy.data.objects[KEY_NAME]
    fill = bpy.data.objects[FILL_NAME]
    rim  = bpy.data.objects[RIM_NAME]

    # Key light: no linking → illuminates all.  No-op by design.

    # Fill light: warms ONLY the hero prop.
    recv_fill = bpy.data.collections.new("ll_recv_fill")
    recv_fill.objects.link(hero)
    fill.light_linking.receiver_collection = recv_fill

    # Rim light: hero + accent receive it; floor stays unlit by rim.
    recv_rim = bpy.data.collections.new("ll_recv_rim")
    recv_rim.objects.link(hero)
    recv_rim.objects.link(accent)
    rim.light_linking.receiver_collection = recv_rim

    # Blocker: only hero casts rim shadows — accent orb passes the rim light,
    # keeping the WebXR silhouette clean rather than adding a distracting halo.
    block_rim = bpy.data.collections.new("ll_block_rim")
    block_rim.objects.link(hero)
    rim.light_linking.blocker_collection = block_rim

    return {
        KEY_NAME:  {"receiver": None,    "blocker": None},
        FILL_NAME: {"receiver": "ll_recv_fill", "blocker": None},
        RIM_NAME:  {"receiver": "ll_recv_rim",  "blocker": "ll_block_rim"},
    }


# ─── 6. Cycles bake ───────────────────────────────────────────────────────────
def configure_cycles() -> None:
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    # GPU preferred; falls back to CPU when no GPU is available.
    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs:
        cycles_pref = prefs.preferences
        if hasattr(cycles_pref, 'compute_device_type'):
            try:
                cycles_pref.compute_device_type = 'CUDA'
            except TypeError:
                pass  # CPU-only build — silent fallback
    scene.cycles.samples = BAKE_SAMPLES
    scene.cycles.use_denoising = False  # denoising artefacts in lightmaps


def bake_hero_lightmap(hero: bpy.types.Object,
                       img: bpy.types.Image) -> None:
    """
    bake type='DIFFUSE' captures direct + indirect colour without specular,
    which maps cleanly onto the WebXR PBR lightmap slot.  'COMBINED' includes
    specular spikes that look wrong on low-poly geometry in real-time renderers.
    pass_filter={'COLOR', 'DIRECT', 'INDIRECT'} — excluding 'AO' keeps the
    bake purely light-linked; AO is a separate ambient pass.
    """
    bpy.ops.object.select_all(action='DESELECT')
    hero.select_set(True)
    bpy.context.view_layer.objects.active = hero

    bpy.ops.object.bake(
        type='DIFFUSE',
        pass_filter={'COLOR', 'DIRECT', 'INDIRECT'},
        use_selected_to_active=False,
        margin=4,
        margin_type='ADJACENT_FACES',
    )

    # Save as WebP for minimal GLB payload.
    img.filepath_raw = OUT_WEBP
    img.file_format  = 'WEBP'
    img.save_render(OUT_WEBP, scene=bpy.context.scene)


# ─── 7. Export ────────────────────────────────────────────────────────────────
def export_glb(hero: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action='DESELECT')
    hero.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        use_selection=True,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=DRACO_LEVEL,
        export_image_format='WEBP',
        export_webp_fallback=False,
        export_apply=True,
        export_yup=True,
    )


# ─── 8. Metadata ─────────────────────────────────────────────────────────────
def write_meta(ll_map: dict) -> None:
    meta = {
        "blender_version": "5.1",
        "technique": "light_linking",
        "lights": ll_map,
        "bake": {
            "type": "DIFFUSE",
            "resolution": BAKE_RES,
            "samples": BAKE_SAMPLES,
            "output": OUT_WEBP,
        },
        "export": {"format": "GLB", "draco": DRACO_LEVEL, "output": OUT_GLB},
    }
    with bpy.data.texts.new("ll_meta") if False else open(
            bpy.path.abspath(OUT_META), "w") as fh:
        json.dump(meta, fh, indent=2)


# ─── Main ────────────────────────────────────────────────────────────────────
def main() -> None:
    reset_scene()

    hero   = make_faceted_gem(HERO_NAME,   (0.0,  0.0, 0.0))
    accent = make_accent_orb(ACCENT_NAME,  (1.2,  0.4, 0.0))
    floor  = make_floor(FLOOR_NAME)

    hero.data.materials.append(make_material("mat_hero",   (0.18, 0.52, 0.85), 0.7))
    accent.data.materials.append(make_material("mat_accent", (0.88, 0.65, 0.20), 0.5))
    floor.data.materials.append(make_material("mat_floor",  (0.14, 0.14, 0.14), 1.0))

    # Key (all objects), fill (hero only), rim (hero + accent receive, hero blocks).
    make_light(KEY_NAME,  'AREA',  400.0, ( 2.5,  2.5, 3.0), (-45,  0, 45))
    make_light(FILL_NAME, 'AREA',  200.0, (-3.0,  1.0, 2.0), (-30,  0,-30))
    make_light(RIM_NAME,  'SPOT',  300.0, ( 0.0, -3.0, 2.5), ( 60,  0,  0))

    ll_map = setup_light_linking(hero, accent, floor)

    # Bake image — created before configure_cycles so the node exists at bake time.
    img = bpy.data.images.new("hero_lightmap", width=BAKE_RES, height=BAKE_RES,
                               float_buffer=False)
    img.colorspace_settings.name = 'sRGB'
    add_bake_image_node(hero.data.materials[0], img)

    configure_cycles()
    bake_hero_lightmap(hero, img)
    export_glb(hero)
    write_meta(ll_map)

    print("[holoflow] Light Linking blueprint complete.")


main()
