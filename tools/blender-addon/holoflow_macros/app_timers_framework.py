"""
holoflow_macros/app_timers_framework.py
Reusable bpy.app.timers helpers for Holoflow Studio add-on development.
Blender 5.1 | CC0 1.0

Usage:
    from holoflow_macros.app_timers_framework import (
        defer, LiveReloader, FrameStepper
    )
"""

from __future__ import annotations
import bpy
import os
import json
from typing import Callable


# ── Deferred execution ──────────────────────────────────────────────────────────
def defer(fn: Callable, delay: float = 0.0) -> None:
    """Schedule fn to run once on the next idle tick (or after delay seconds)."""
    if bpy.app.timers.is_registered(fn):
        return
    bpy.app.timers.register(fn, first_interval=delay)


# ── Throttled live-reload ───────────────────────────────────────────────────────
class LiveReloader:
    """
    Poll a JSON file for changes and call on_change(data: dict) when mtime differs.
    Survives file loads when persistent=True.
    """

    def __init__(
        self,
        path: str,
        on_change: Callable[[dict], None],
        interval: float = 0.5,
        persistent: bool = True,
    ) -> None:
        self.path       = path
        self.on_change  = on_change
        self.interval   = interval
        self.persistent = persistent
        self._mtime: float = 0.0

    def start(self) -> None:
        if bpy.app.timers.is_registered(self._tick):
            return
        bpy.app.timers.register(
            self._tick,
            first_interval=self.interval,
            persistent=self.persistent,
        )

    def stop(self) -> None:
        if bpy.app.timers.is_registered(self._tick):
            bpy.app.timers.unregister(self._tick)

    def _tick(self) -> float | None:
        try:
            mtime = os.path.getmtime(self.path)
        except OSError:
            return self.interval
        if mtime != self._mtime:
            self._mtime = mtime
            try:
                with open(self.path) as f:
                    data = json.load(f)
                self.on_change(data)
            except (json.JSONDecodeError, OSError):
                pass
        return self.interval


# ── Headless frame stepper ──────────────────────────────────────────────────────
class FrameStepper:
    """
    Advance the timeline frame-by-frame, calling on_frame(frame_number) at each step.
    Call on_done() when frame_end is reached.
    """

    def __init__(
        self,
        frame_start: int,
        frame_end: int,
        on_frame: Callable[[int], None],
        on_done: Callable[[], None] | None = None,
        step_delay: float = 1 / 30,
    ) -> None:
        self.frame_start = frame_start
        self.frame_end   = frame_end
        self.on_frame    = on_frame
        self.on_done     = on_done
        self.step_delay  = step_delay
        self._current    = frame_start

    def start(self) -> None:
        self._current = self.frame_start
        bpy.context.scene.frame_set(self._current)
        if not bpy.app.timers.is_registered(self._step):
            bpy.app.timers.register(self._step, first_interval=0.0)

    def stop(self) -> None:
        if bpy.app.timers.is_registered(self._step):
            bpy.app.timers.unregister(self._step)

    def _step(self) -> float | None:
        if self._current > self.frame_end:
            if self.on_done:
                self.on_done()
            return None
        bpy.context.scene.frame_set(self._current)
        self.on_frame(self._current)
        self._current += 1
        return self.step_delay
