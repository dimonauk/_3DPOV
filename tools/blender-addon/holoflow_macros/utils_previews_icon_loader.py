"""
holoflow_macros/utils_previews_icon_loader.py
==============================================
Reusable PreviewCollection manager for Holoflow Studio add-on modules.
Import and call setup_previews() from your register(); call teardown_previews()
from unregister().  Each add-on module maintains its own collection to avoid
cross-module icon_id conflicts.

Usage:
    from holoflow_macros.utils_previews_icon_loader import PreviewsLoader

    _loader = PreviewsLoader()

    def register():
        _loader.setup(pathlib.Path(__file__).parent / "icons",
                      ["GLB", "GLTF_SEPARATE", "render_thumb"])

    def unregister():
        _loader.teardown()

    # In draw():
    icon_val = _loader.icon_id("GLB")   # returns 0 if not loaded
"""

import bpy
import pathlib


class PreviewsLoader:
    """Stateful PreviewCollection wrapper with idempotent setup/teardown."""

    def __init__(self) -> None:
        self._pcoll = None

    def setup(self, icons_dir: pathlib.Path, keys: list[str]) -> None:
        """Load PNGs from icons_dir matching keys into the collection.

        Safe to call multiple times — removes the previous collection first
        to prevent GPU handle leaks on add-on reload (Alt+P).
        """
        if self._pcoll is not None:
            bpy.utils.previews.remove(self._pcoll)
        self._pcoll = bpy.utils.previews.new()
        for key in keys:
            p = icons_dir / f"{key}.png"
            if p.exists():
                self._pcoll.load(key, str(p), "IMAGE")

    def teardown(self) -> None:
        """Release GPU atlas entries.  Must be called from unregister()."""
        if self._pcoll is not None:
            bpy.utils.previews.remove(self._pcoll)
            self._pcoll = None

    def icon_id(self, key: str) -> int:
        """Return integer icon handle or 0 (NONE) if absent or not loaded."""
        if self._pcoll is None:
            return 0
        entry = self._pcoll.get(key)
        return entry.icon_id if entry else 0

    def reload(self, key: str) -> None:
        """Flush GPU cache for a slot after updating the PNG on disk."""
        if self._pcoll and key in self._pcoll:
            self._pcoll[key].reload()
