"""splat360.jobs.store — SQLite-backed job state.

Single-file SQLite, no migrations framework. Three tables:

  jobs       — top-level job (one per submission)
  variants   — one row per variant attempted within a job
  events     — append-only progress log
"""

from __future__ import annotations

import json
import sqlite3
import time
import uuid
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Literal


JobPhase = Literal[
    "queued", "ingesting", "frames", "metadata", "sfm", "train", "post", "done", "failed",
]


@dataclass(frozen=True)
class JobRow:
    id: str
    submitted_at: float
    phase: JobPhase
    progress: float
    payload_json: str
    result_json: str | None
    error: str | None


_SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id              TEXT PRIMARY KEY,
    submitted_at    REAL NOT NULL,
    phase           TEXT NOT NULL,
    progress        REAL NOT NULL,
    payload_json    TEXT NOT NULL,
    result_json     TEXT,
    error           TEXT
);
CREATE TABLE IF NOT EXISTS variants (
    job_id          TEXT NOT NULL,
    variant_id      TEXT NOT NULL,
    sfm             TEXT NOT NULL,
    trainer         TEXT NOT NULL,
    strategy        TEXT NOT NULL,
    phase           TEXT NOT NULL,
    result_json     TEXT,
    error           TEXT,
    PRIMARY KEY (job_id, variant_id)
);
CREATE TABLE IF NOT EXISTS events (
    job_id          TEXT NOT NULL,
    at              REAL NOT NULL,
    variant_id      TEXT,
    phase           TEXT,
    message         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_job ON events(job_id, at);
"""


class JobStore:
    def __init__(self, db_path: Path) -> None:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._db_path = db_path
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        with self._conn:
            self._conn.executescript(_SCHEMA)

    # ---- jobs --------------------------------------------------------------

    def create_job(self, payload: dict[str, Any]) -> str:
        job_id = uuid.uuid4().hex[:12]
        with self._conn:
            self._conn.execute(
                "INSERT INTO jobs (id, submitted_at, phase, progress, payload_json) "
                "VALUES (?, ?, ?, ?, ?)",
                (job_id, time.time(), "queued", 0.0, json.dumps(payload)),
            )
        self.log(job_id, None, "queued", "job created")
        return job_id

    def set_phase(
        self,
        job_id: str,
        phase: JobPhase,
        progress: float = 0.0,
        error: str | None = None,
    ) -> None:
        with self._conn:
            self._conn.execute(
                "UPDATE jobs SET phase=?, progress=?, error=? WHERE id=?",
                (phase, progress, error, job_id),
            )

    def set_result(self, job_id: str, result: dict[str, Any]) -> None:
        with self._conn:
            self._conn.execute(
                "UPDATE jobs SET result_json=? WHERE id=?",
                (json.dumps(result), job_id),
            )

    def get_job(self, job_id: str) -> JobRow | None:
        row = self._conn.execute(
            "SELECT * FROM jobs WHERE id=?", (job_id,),
        ).fetchone()
        if row is None:
            return None
        return JobRow(**dict(row))

    def list_recent(self, limit: int = 50) -> list[JobRow]:
        rows = self._conn.execute(
            "SELECT * FROM jobs ORDER BY submitted_at DESC LIMIT ?", (limit,),
        ).fetchall()
        return [JobRow(**dict(r)) for r in rows]

    # ---- variants ----------------------------------------------------------

    def upsert_variant(
        self,
        job_id: str,
        variant_id: str,
        sfm: str,
        trainer: str,
        strategy: str,
        phase: JobPhase = "queued",
    ) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT INTO variants (job_id, variant_id, sfm, trainer, strategy, phase) "
                "VALUES (?, ?, ?, ?, ?, ?) "
                "ON CONFLICT (job_id, variant_id) DO UPDATE SET phase=excluded.phase",
                (job_id, variant_id, sfm, trainer, strategy, phase),
            )

    def set_variant_result(
        self,
        job_id: str,
        variant_id: str,
        result: dict[str, Any] | None,
        error: str | None,
    ) -> None:
        with self._conn:
            self._conn.execute(
                "UPDATE variants SET phase=?, result_json=?, error=? "
                "WHERE job_id=? AND variant_id=?",
                (
                    "failed" if error else "done",
                    json.dumps(result) if result else None,
                    error,
                    job_id, variant_id,
                ),
            )

    # ---- events ------------------------------------------------------------

    def log(self, job_id: str, variant_id: str | None, phase: JobPhase | None, message: str) -> None:
        with self._conn:
            self._conn.execute(
                "INSERT INTO events (job_id, at, variant_id, phase, message) VALUES (?, ?, ?, ?, ?)",
                (job_id, time.time(), variant_id, phase, message),
            )

    def events(self, job_id: str, limit: int = 500) -> list[dict[str, Any]]:
        rows = self._conn.execute(
            "SELECT at, variant_id, phase, message FROM events WHERE job_id=? "
            "ORDER BY at ASC LIMIT ?",
            (job_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]
