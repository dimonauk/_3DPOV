import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ExtensionsPlatformBody() {
  return (
    <>
      <p>
        Blender 4.2 retired the <code>bl_info = &#123;&#125;</code> dictionary that
        every add-on author memorised over a decade. In its place sits{" "}
        <code>blender_manifest.toml</code> — a typed, validator-enforced file at
        the extension root that the{" "}
        <a
          href="https://extensions.blender.org"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Extensions Platform
        </a>{" "}
        uses for version negotiation, SPDX licence enforcement, pip-wheel
        dependency bundling, and OS-capability permission declarations. In
        Blender 5.1 the platform is the canonical distribution channel: the CLI
        command <code>blender --command extension build</code> packages a folder
        into a distributable <code>.zip</code> without opening the UI, and{" "}
        <code>validate</code> catches schema errors in CI before anyone installs
        anything. This tutorial converts the studio's own{" "}
        <code>holoflow_webxr_exporter</code> from a legacy zip-install add-on
        into a proper extension, and explains every manifest field along the way.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        What changed — and why it matters
      </h2>
      <p className="mt-2">
        The old system required Blender to parse a Python <code>dict</code> at
        import time to discover metadata. That was fragile: the dict could be
        conditional, dynamically computed, or missing entirely, and the importer
        had no schema to validate against. The manifest is a static file read
        before Python is invoked, which lets Blender (and the Extensions Platform
        server) perform version compatibility checks and licence verification
        without executing untrusted code. It also enables the{" "}
        <code>blender --command extension validate</code> CLI path that CI
        pipelines need.
      </p>
      <p className="mt-2">
        The second big change is the <strong>namespace</strong>. Legacy add-ons
        lived in the flat global namespace — <code>import my_addon</code> just
        worked. Extensions load under{" "}
        <code>bl_ext.&lt;repo_id&gt;.&lt;ext_id&gt;</code>, so the Holoflow
        exporter installed from the default user repository becomes{" "}
        <code>bl_ext.user_default.holoflow_webxr_exporter</code>. That string
        is what you pass to{" "}
        <code>bpy.context.preferences.addons[...].preferences</code> and what
        you use in cross-extension imports. It eliminates naming collisions that
        plagued large add-on collections — no more silent overwrites when two
        add-ons happened to pick the same module name.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The manifest — field by field
      </h2>
      <p className="mt-2">
        Create <code>blender_manifest.toml</code> alongside{" "}
        <code>__init__.py</code> in the extension folder. Every field below is
        required unless marked optional:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`schema_version = "1.0.0"      # always exactly this string in 5.1

id          = "holoflow_webxr_exporter"   # snake_case; unique on the platform
version     = "1.2.0"                     # semantic versioning — enforced
name        = "Holoflow WebXR Game Framework Exporter"
tagline     = "One-click GLB export with Draco, WebP, +Y-up for WebXR scenes"
maintainer  = "Holoflow Studio <hello@holoflow.co.uk>"
type        = "add-on"                    # or "theme"

blender_version_min = "4.2.0"            # oldest Blender that can install this
# blender_version_max = "5.99.0"         # optional upper bound

website   = "https://holoflow.co.uk"     # optional; shown in Get Extensions UI
copyright = ["2025 Holoflow Studio"]     # optional; array of strings
license   = ["SPDX:Apache-2.0"]          # MUST use an SPDX identifier
tags      = ["Import-Export", "Pipeline", "Mesh"]

[permissions]
# Declare every OS-level capability.  Omit sections you don't use.
# files     = "Write GLB files to user-specified output directory"
# network   = "Fetch remote asset manifests from holoflow.co.uk"
# clipboard = "Copy export path to clipboard on success"`}
      </pre>
      <p className="mt-2">
        The <code>license</code> field requires an{" "}
        <a
          href="https://spdx.org/licenses/"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          SPDX identifier
        </a>{" "}
        (e.g. <code>SPDX:Apache-2.0</code>, <code>SPDX:MIT</code>,{" "}
        <code>SPDX:GPL-2.0-or-later</code>). The Extensions Platform rejects
        submissions without a recognised SPDX tag. For the studio's exporter,{" "}
        <code>Apache-2.0</code> is the right choice: permissive, patent-grant
        included, compatible with everything downstream.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Bundling pip wheels
      </h2>
      <p className="mt-2">
        If your extension depends on a third-party PyPI package, vendor the
        wheel file inside the extension folder and declare it in the manifest. Do
        not import the package at module load time — import inside a function
        that's only called after Blender has unpacked the wheel:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# 1. Download the wheel (run this on your dev machine, not inside Blender)
pip download \\
    --python-version 311 \\
    --platform manylinux_2_17_x86_64 \\
    --only-binary=:all: \\
    --dest ./holoflow_exporter_ext/wheels/ \\
    Pillow==10.4.0

# 2. Declare it in blender_manifest.toml
[wheels]
"wheels/Pillow-10.4.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl"`}
      </pre>
      <p className="mt-2">
        Blender unpacks the wheel into the extension's isolated Python path
        before calling <code>register()</code>. You can then{" "}
        <code>import PIL</code> freely inside operator <code>execute()</code>{" "}
        methods. The Holoflow exporter doesn't currently need any PyPI packages —
        the wheel section remains commented out — but the pattern is essential to
        know when adding image-processing or HTTP features later.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Extension directory structure
      </h2>
      <p className="mt-2">
        The folder you pass to <code>--source-dir</code> must contain exactly{" "}
        these files at its root:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`holoflow_exporter_ext/
├── blender_manifest.toml   ← identity, licence, permissions, wheel list
├── __init__.py             ← register() / unregister() entry point
├── operators.py            ← HOLOFLOW_OT_export_webxr
├── panels.py               ← HOLOFLOW_PT_export_panel (N-panel)
├── preferences.py          ← HOLOFLOW_Preferences
└── wheels/                 ← optional; only if you vendor pip packages
    └── somelib-1.0-py3-none-any.whl`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Rewriting __init__.py for the bl_ext namespace
      </h2>
      <p className="mt-2">
        Two changes are mandatory. First, replace any flat module imports with
        relative imports — this is the single most common migration failure.
        Second, set <code>bl_idname = __package__</code> on{" "}
        <code>AddonPreferences</code> instead of a hardcoded string. In extension
        mode <code>__package__</code> resolves to the full namespace path, which
        is what Blender looks up when reading preferences:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# LEGACY (breaks in extension mode)
import holoflow_webxr_exporter.operators   # flat namespace — not found

# CORRECT (relative import — always works within the same package)
from . import operators, panels, preferences

# In preferences.py:
class HOLOFLOW_Preferences(bpy.types.AddonPreferences):
    bl_idname = __package__   # resolves to "bl_ext.user_default.holoflow_webxr_exporter"
    # NOT: bl_idname = "holoflow_webxr_exporter"  ← legacy; wrong in 5.1 extension mode`}
      </pre>
      <p className="mt-2">
        The full <code>__init__.py</code> keeps the same{" "}
        <code>register()</code> / <code>unregister()</code> pattern as the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-addon-preferences-keymap-hotkey-exporter"
          className={lk}
        >
          AddonPreferences tutorial
        </Link>{" "}
        — extension mode doesn't change the registration API, only the namespace
        resolution.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        CLI workflow: validate → build → install
      </h2>
      <p className="mt-2">
        The three-step CLI workflow replaces the manual zip-and-install cycle.
        Run it from a terminal in your project root:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# Step 1 — Validate (fast; no UI; safe to run in CI)
blender --command extension validate ./holoflow_exporter_ext/
# Prints "ok" or lists schema errors.  Fix errors before building.

# Step 2 — Build distributable zip
blender --command extension build \\
    --source-dir ./holoflow_exporter_ext/ \\
    --output-dir ./dist/
# Produces: ./dist/holoflow_webxr_exporter-1.2.0.zip

# Step 3 — Install to local user repository for testing
blender --command extension install-file \\
    --repo user_default \\
    ./dist/holoflow_webxr_exporter-1.2.0.zip

# Step 4 — Verify at runtime (run from Blender's Python console)
import bpy
info = bpy.utils.extension_info("user_default", "holoflow_webxr_exporter")
print(info)  # {'id': 'holoflow_webxr_exporter', 'version': '1.2.0', ...}`}
      </pre>
      <p className="mt-2">
        The <code>validate</code> subcommand is the key CI primitive. It runs
        headlessly — no display needed — and exits with code 0 on success or 1
        on errors. Add it as a pre-commit hook or GitHub Actions step to catch
        manifest schema errors before they reach the distribution server.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Accessing preferences from another extension or script
      </h2>
      <p className="mt-2">
        The addon key used to look up preferences is the full namespace path, not
        the bare <code>id</code>. This is the most common runtime confusion:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# From any script or another extension installed in the same Blender:
prefs = bpy.context.preferences.addons[
    "bl_ext.user_default.holoflow_webxr_exporter"
].preferences
print(f"Draco level: {prefs.draco_level}")

# Cross-extension import (for advanced inter-extension APIs):
# Only import INSIDE a function — never at module level (circular imports)
def get_exporter():
    from bl_ext.user_default import holoflow_webxr_exporter
    return holoflow_webxr_exporter`}
      </pre>
      <p className="mt-2">
        The namespace lookup string follows the pattern{" "}
        <code>bl_ext.&lt;repo_module&gt;.&lt;ext_id&gt;</code>. The{" "}
        <code>repo_module</code> for the default user-installed repository is{" "}
        <code>user_default</code>; custom remote repositories use the module name
        declared when the repository was added in Preferences.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Setting up a local team repository
      </h2>
      <p className="mt-2">
        For studio-internal distribution (not published on extensions.blender.org),
        set up a local server that serves a <code>index.json</code> manifest
        listing available extensions. Point team members' Blender installs at it
        via Preferences → Get Extensions → Repositories → ＋ → add URL. Each
        extension in the index is a <code>.zip</code> produced by{" "}
        <code>blender --command extension build</code> and hosted on any HTTP
        server — a GitHub Release page, a self-hosted nginx, or a Vercel static
        deploy all work equally well.
      </p>
      <p className="mt-2">
        The index format is a JSON file at the repository root — the Blender
        extension server spec documents the exact schema. For the studio, a
        single-extension repository hosting the Holoflow exporter would let
        Dimona's machines pull updates automatically instead of manually
        reinstalling zips. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook"
          className={lk}
        >
          GLTF User Extension hook tutorial
        </Link>{" "}
        already covers the hook point inside the exporter; this tutorial handles
        the outer packaging that makes the exporter installable by the team.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Applying to the holoflow_webxr_exporter
      </h2>
      <p className="mt-2">
        The exporter at <code>tools/blender-addon/holoflow_webxr_exporter/</code>{" "}
        currently installs via the legacy zip path described in{" "}
        <code>tools/blender-addon/README.md</code>. The migration checklist:
      </p>
      <ol className="mt-2 list-decimal pl-6 space-y-1 text-sm">
        <li>
          Add <code>blender_manifest.toml</code> at the package root with the
          fields above.
        </li>
        <li>
          Remove <code>bl_info = &#123;&#125;</code> from <code>__init__.py</code>.
        </li>
        <li>
          Change <code>bl_idname = "holoflow_webxr_exporter"</code> in{" "}
          <code>HOLOFLOW_Preferences</code> to <code>bl_idname = __package__</code>.
        </li>
        <li>
          Replace any <code>import holoflow_webxr_exporter.*</code> with{" "}
          <code>from . import *</code>.
        </li>
        <li>
          Run <code>blender --command extension validate</code>. Fix any errors.
        </li>
        <li>
          Run <code>blender --command extension build --source-dir .</code> and
          test the resulting zip on a clean Blender installation.
        </li>
      </ol>
      <p className="mt-2">
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-property-uilist-export-queue"
          className={lk}
        >
          UIList Export Queue tutorial
        </Link>{" "}
        shows the PropertyGroup pattern that belongs in{" "}
        <code>preferences.py</code> once the manifest is in place. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-custom-panel-operator-n-panel-sidebar"
          className={lk}
        >
          N-Panel Sidebar tutorial
        </Link>{" "}
        covers the panel registration that should migrate to{" "}
        <code>panels.py</code>. Together these three tutorials form the complete
        extension architecture for any production Blender tool.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-blender-extensions-platform-manifest-build-package",
  title:
    "Python — Blender 5.1 Extensions Platform: blender_manifest.toml, bl_ext Namespace & CLI Build",
  lead: "Replace bl_info with a typed TOML manifest, rewrite relative imports for the bl_ext namespace, bundle pip wheels, and ship a distributable .zip via blender --command extension build — converting the Holoflow exporter from a legacy add-on into a proper Blender 5.1 extension.",
  date: "2026-07-03",
  tags: ["blender", "python", "scripting", "addon", "extensions", "pipeline", "webxr"],
  body: <ExtensionsPlatformBody />,
  blendFile:
    "public/library/blends/scripting/python-blender-extensions-platform-manifest-build-package/blueprint.py",
  externalLinks: [
    {
      label: "Blender 5.1 Extensions Manual",
      href: "https://docs.blender.org/manual/en/5.1/extensions/index.html",
    },
    {
      label: "SPDX Licence List — canonical identifiers for the license field",
      href: "https://spdx.org/licenses/",
    },
  ],
});
