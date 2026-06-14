"""
holoflow_macros/cycles_denoise_setup.py
Holoflow Studio | CC0

Reusable helper: configure a Cycles scene for OIDN compositor denoising.

USAGE:
    from holoflow_macros.cycles_denoise_setup import configure_oidn_denoise
    configure_oidn_denoise(bpy.context.scene, samples=32, prefilter="ACCURATE")
"""

import bpy


def configure_oidn_denoise(
    scene: "bpy.types.Scene",
    samples: int = 32,
    prefilter: str = "ACCURATE",
    use_hdr: bool = True,
    view_layer_name: str = "ViewLayer",
) -> "bpy.types.Node":
    """
    Enable Normal + Albedo passes on the view layer, build the three-node
    compositor chain (RenderLayers → Denoise → Composite), and return the
    Denoise node so the caller can further configure it.

    prefilter: 'NONE' | 'FAST' | 'ACCURATE'
      NONE     — passes straight through; only valid at ≥ 256 spp.
      FAST     — single-pass prefilter; adequate at 64–256 spp.
      ACCURATE — iterative prefilter; ~30% extra time; best at ≤ 64 spp.
    use_hdr:
      True  — preserve HDR range (always use for metallic/glass scenes).
      False — clamp to [0,1] pre-denoise (rare, LDR pipeline only).
    """
    if scene.render.engine != "CYCLES":
        raise ValueError(
            f"configure_oidn_denoise: engine must be CYCLES, got {scene.render.engine!r}"
        )

    # ── Render settings ──────────────────────────────────────────────────────
    scene.cycles.samples          = samples
    scene.cycles.use_denoising   = False  # disable render-time denoiser; use compositor

    # ── View layer passes ─────────────────────────────────────────────────────
    vl = scene.view_layers.get(view_layer_name)
    if vl is None:
        raise KeyError(f"View layer {view_layer_name!r} not found.")
    vl.use_pass_normal        = True   # world-space normals → OIDN geometry guide
    vl.use_pass_diffuse_color = True   # flat material colour → OIDN albedo guide
    vl.use_pass_combined      = True

    # ── Compositor ────────────────────────────────────────────────────────────
    scene.use_nodes = True
    ct = scene.node_tree

    # Remove any existing Denoise node to avoid duplicates
    for n in list(ct.nodes):
        if n.bl_idname == "CompositorNodeDenoise":
            ct.nodes.remove(n)

    rl = next(
        (n for n in ct.nodes if n.bl_idname == "CompositorNodeRLayers"), None
    )
    if rl is None:
        rl = ct.nodes.new("CompositorNodeRLayers")
        rl.location = (-500, 0)

    comp = next(
        (n for n in ct.nodes if n.bl_idname == "CompositorNodeComposite"), None
    )
    if comp is None:
        comp = ct.nodes.new("CompositorNodeComposite")
        comp.location = (300, 0)

    denoise = ct.nodes.new("CompositorNodeDenoise")
    denoise.location  = (-100, 0)
    denoise.prefilter = prefilter
    denoise.use_hdr   = use_hdr

    # Disconnect any existing link from RenderLayers → Composite
    for link in list(ct.links):
        if link.to_node == comp:
            ct.links.remove(link)

    ct.links.new(rl.outputs["Image"],   denoise.inputs["Image"])
    ct.links.new(rl.outputs["Normal"],  denoise.inputs["Normal"])
    ct.links.new(rl.outputs["DiffCol"], denoise.inputs["Albedo"])
    ct.links.new(denoise.outputs["Image"], comp.inputs["Image"])

    print(
        f"[holoflow] OIDN denoise configured — "
        f"{samples} spp | prefilter={prefilter} | hdr={use_hdr}"
    )
    return denoise
