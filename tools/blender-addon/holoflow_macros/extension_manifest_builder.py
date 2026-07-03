"""
extension_manifest_builder.py — Holoflow Macro
Generate a starter blender_manifest.toml for any Python add-on.
Blender 5.1 | CC0 | Holoflow Studio

Run in the Blender Text Editor (Alt+P) or from the command line:
  blender --background --python extension_manifest_builder.py -- \
      --id my_ext_id --name "My Extension" --version "1.0.0"

Outputs blender_manifest.toml in the current working directory.
"""

import bpy
import os
import sys

# ── Defaults (edit or override via sys.argv) ──────────────────────────────────
EXT_ID      = "holoflow_webxr_exporter"
EXT_VERSION = "1.2.0"
EXT_NAME    = "Holoflow WebXR Game Framework Exporter"
EXT_TAGLINE = "One-click GLB export with Draco, WebP, +Y-up for WebXR scenes"
MAINTAINER  = "Holoflow Studio <hello@holoflow.co.uk>"
WEBSITE     = "https://holoflow.co.uk"
LICENSE     = "SPDX:Apache-2.0"
BLENDER_MIN = "4.2.0"
TAGS        = ["Import-Export", "Pipeline", "Mesh"]

# ── Parse optional CLI overrides ─────────────────────────────────────────────
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
for i, arg in enumerate(argv):
    if arg == "--id"      and i + 1 < len(argv): EXT_ID      = argv[i + 1]
    if arg == "--name"    and i + 1 < len(argv): EXT_NAME    = argv[i + 1]
    if arg == "--version" and i + 1 < len(argv): EXT_VERSION = argv[i + 1]

# ── Generate manifest ─────────────────────────────────────────────────────────
MANIFEST = f"""\
schema_version = "1.0.0"

id          = "{EXT_ID}"
version     = "{EXT_VERSION}"
name        = "{EXT_NAME}"
tagline     = "{EXT_TAGLINE}"
maintainer  = "{MAINTAINER}"
type        = "add-on"

blender_version_min = "{BLENDER_MIN}"

website  = "{WEBSITE}"
license  = ["{LICENSE}"]
tags     = {TAGS!r}

[permissions]
# Uncomment the permissions your extension actually uses.
# files     = "Read/write user-specified export paths"
# network   = "Fetch remote asset manifests"
# clipboard = "Copy export path to clipboard"

# [wheels]
# Vendor pip wheels here if you need third-party Python packages.
# "wheels/Pillow-10.4.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl"
"""

output_path = os.path.join(os.getcwd(), "blender_manifest.toml")
with open(output_path, "w", encoding="utf-8") as fh:
    fh.write(MANIFEST)

print(f"[extension_manifest_builder] Wrote: {output_path}")
print(f"  id:      {EXT_ID}")
print(f"  version: {EXT_VERSION}")
print(f"  name:    {EXT_NAME}")
print()
print("Next steps:")
print("  blender --command extension validate ./your_ext_folder/")
print("  blender --command extension build   --source-dir ./your_ext_folder/ --output-dir ./dist/")
