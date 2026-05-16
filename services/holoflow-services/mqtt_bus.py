"""
mqtt_bus.py
===========
Thin paho-mqtt V2 wrapper for publishing HoloFlow pipeline events
across the Neo London cluster.

Topics published:
    holoflow/sprite/created              {name, path, size_bytes, source}
    holoflow/pixelorama/launched        {pid, file}
    holoflow/pixelorama/exported        {input, output, format, scale}
    holoflow/mesh/voxelized             {input, shape, occupied}
    holoflow/mesh/simplified            {input, target_faces, output}
    holoflow/mesh/repaired              {input, is_watertight, output}
    holoflow/mesh/inspected             {path, vertices, faces, is_watertight}
    holoflow/pipeline/stage/{stage}     {stage, status, detail}
    holoflow/lithophane/generated       {input, output, max_depth_mm}
    holoflow/audio/beats                {bpm, beat_count, source}

Subscribe with any MQTT client:
    mosquitto_sub -h 127.0.0.1 -t 'holoflow/#' -v

Usage from code:
    from mqtt_bus import bus
    bus.publish('holoflow/sprite/created', {'name': 'trail_001', ...})
"""

from __future__ import annotations

import json
import os
import threading
import time
from typing import Any, Callable, Optional

try:
    import paho.mqtt.client as mqtt
    from paho.mqtt.enums import CallbackAPIVersion
    PAHO_AVAILABLE = True
except ImportError:
    PAHO_AVAILABLE = False


# Configuration — override via env vars
MQTT_HOST     = os.environ.get("HOLOFLOW_MQTT_HOST", "127.0.0.1")
MQTT_PORT     = int(os.environ.get("HOLOFLOW_MQTT_PORT", "1883"))
MQTT_USERNAME = os.environ.get("HOLOFLOW_MQTT_USER", "")
MQTT_PASSWORD = os.environ.get("HOLOFLOW_MQTT_PASS", "")
MQTT_PREFIX   = os.environ.get("HOLOFLOW_MQTT_PREFIX", "holoflow")
MQTT_CLIENT_ID = os.environ.get("HOLOFLOW_MQTT_CLIENT_ID", f"holoflow-sidecar-{os.getpid()}")


class _NullBus:
    """Stand-in when paho isn't installed or broker is offline.
    Logs would-be publishes to stdout instead of breaking the sidecar."""

    def __init__(self, reason: str):
        self.reason = reason
        self.connected = False
        print(f"[mqtt_bus] DISABLED: {reason}")

    def publish(self, topic: str, payload: Any, qos: int = 0, retain: bool = False) -> None:
        # Silent — would print but spam at scale. Uncomment for debugging:
        # print(f"[mqtt_bus null] {topic}: {payload}")
        pass

    def subscribe(self, topic: str, handler: Callable) -> None:
        pass

    def shutdown(self) -> None:
        pass


class MqttBus:
    """V2-callback paho-mqtt client with retain-friendly publish helpers."""

    def __init__(
        self,
        host: str = MQTT_HOST,
        port: int = MQTT_PORT,
        username: str = MQTT_USERNAME,
        password: str = MQTT_PASSWORD,
        client_id: str = MQTT_CLIENT_ID,
        prefix: str = MQTT_PREFIX,
    ):
        self.host = host
        self.port = port
        self.prefix = prefix.rstrip("/")
        self.connected = False
        self._connect_lock = threading.Lock()
        self._handlers: dict[str, Callable] = {}

        # V2 callback API — modern, no deprecation warnings.
        self.client = mqtt.Client(
            callback_api_version=CallbackAPIVersion.VERSION2,
            client_id=client_id,
            protocol=mqtt.MQTTv5,
        )
        if username:
            self.client.username_pw_set(username, password)

        # V2 signatures — note the extra `properties` arg
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message

        self._connect()

    # ------------------------------------------------------------------ V2 callbacks

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        # V2: reason_code is a ReasonCode object, not an int
        rc = reason_code.value if hasattr(reason_code, "value") else reason_code
        if rc == 0:
            self.connected = True
            print(f"[mqtt_bus] connected to {self.host}:{self.port} as {client._client_id.decode()}")
            # Re-subscribe to any topics that were registered before connect completed
            for topic in self._handlers:
                client.subscribe(topic)
        else:
            self.connected = False
            print(f"[mqtt_bus] connect failed: reason_code={rc}")

    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        self.connected = False
        rc2 = reason_code.value if hasattr(reason_code, "value") else reason_code; print(f"[mqtt_bus] disconnected (rc={rc2})")

    def _on_message(self, client, userdata, message):
        for topic, handler in self._handlers.items():
            if mqtt.topic_matches_sub(topic, message.topic):
                try:
                    payload = json.loads(message.payload.decode("utf-8", errors="replace"))
                except Exception:
                    payload = message.payload
                try:
                    handler(message.topic, payload)
                except Exception as e:
                    print(f"[mqtt_bus] handler error for {message.topic}: {e}")

    # ------------------------------------------------------------------ public API

    def _connect(self):
        with self._connect_lock:
            try:
                self.client.connect_async(self.host, self.port, keepalive=60)
                self.client.loop_start()
            except Exception as e:
                print(f"[mqtt_bus] could not start loop: {e}")
                self.connected = False

    def _topic(self, suffix: str) -> str:
        suffix = suffix.lstrip("/")
        if suffix.startswith(self.prefix + "/") or suffix == self.prefix:
            return suffix
        return f"{self.prefix}/{suffix}"

    def publish(self, topic: str, payload: Any, qos: int = 0, retain: bool = False) -> None:
        """Publish a payload to topic (prefix is auto-applied if missing).
        Payloads are JSON-encoded; pass dicts, lists, primitives."""
        full_topic = self._topic(topic)
        if isinstance(payload, (dict, list, tuple)):
            body = json.dumps(payload, default=str)
        elif isinstance(payload, (str, bytes)):
            body = payload
        else:
            body = json.dumps(payload, default=str)
        try:
            self.client.publish(full_topic, body, qos=qos, retain=retain)
        except Exception as e:
            print(f"[mqtt_bus] publish error on {full_topic}: {e}")

    def subscribe(self, topic: str, handler: Callable[[str, Any], None]) -> None:
        """Subscribe with a callback. Handler receives (topic, payload_dict_or_bytes)."""
        full_topic = self._topic(topic)
        self._handlers[full_topic] = handler
        if self.connected:
            self.client.subscribe(full_topic)

    def shutdown(self) -> None:
        try:
            self.client.loop_stop()
            self.client.disconnect()
        except Exception:
            pass


# ----------------------------------------------------------------------------
# Module-level singleton
# ----------------------------------------------------------------------------

def _make_bus():
    if not PAHO_AVAILABLE:
        return _NullBus("paho-mqtt not installed (pip install paho-mqtt)")
    try:
        return MqttBus()
    except Exception as e:
        return _NullBus(f"could not create MQTT client: {e}")


bus = _make_bus()


# ----------------------------------------------------------------------------
# Convenience helpers — typed event publishers used by the sidecar
# ----------------------------------------------------------------------------

def emit_sprite_created(name: str, path: str, size_bytes: int, source: str = "lightforge") -> None:
    bus.publish("sprite/created", {
        "name": name, "path": path, "size_bytes": size_bytes,
        "source": source, "ts": time.time(),
    })


def emit_pixelorama_launched(pid: int, file: Optional[str] = None) -> None:
    bus.publish("pixelorama/launched", {"pid": pid, "file": file, "ts": time.time()})


def emit_pixelorama_exported(input_file: str, output_file: str, fmt: str, scale: int = 1) -> None:
    bus.publish("pixelorama/exported", {
        "input": input_file, "output": output_file,
        "format": fmt, "scale": scale, "ts": time.time(),
    })


def emit_mesh_voxelized(input_file: str, shape: list, occupied: int) -> None:
    bus.publish("mesh/voxelized", {
        "input": input_file, "shape": shape, "occupied": occupied, "ts": time.time(),
    })


def emit_mesh_simplified(input_file: str, target_faces: int, output_file: str) -> None:
    bus.publish("mesh/simplified", {
        "input": input_file, "target_faces": target_faces,
        "output": output_file, "ts": time.time(),
    })


def emit_mesh_repaired(input_file: str, is_watertight: bool, output_file: str) -> None:
    bus.publish("mesh/repaired", {
        "input": input_file, "is_watertight": is_watertight,
        "output": output_file, "ts": time.time(),
    })


def emit_pipeline_stage(stage: str, status: str, detail: str = "") -> None:
    bus.publish(f"pipeline/stage/{stage}", {
        "stage": stage, "status": status, "detail": detail, "ts": time.time(),
    })


def emit_lithophane_generated(input_file: str, output_file: str, max_depth_mm: float) -> None:
    bus.publish("lithophane/generated", {
        "input": input_file, "output": output_file,
        "max_depth_mm": max_depth_mm, "ts": time.time(),
    })


def emit_audio_beats(bpm: float, beat_count: int, source: str) -> None:
    bus.publish("audio/beats", {
        "bpm": bpm, "beat_count": beat_count, "source": source, "ts": time.time(),
    })
