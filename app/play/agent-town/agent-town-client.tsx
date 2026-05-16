"use client";

/**
 * app/play/agent-town/agent-town-client.tsx — Interactive Canvas + chat island for Agent Town.
 *
 * # Purpose
 * Render the named cast on a top-down floor (Canvas 2D), drive a small
 * wander loop, surface a click-to-inspect side panel, and call the
 * agent.banter server action when the user asks the cast to react.
 * Ported from D:/The_Hangar/apps/agent-town/ — the source used Phaser;
 * Phaser is not a Holoflow dep, so the renderer is plain Canvas 2D here.
 *
 * # Why this shape
 * - Single client island. The cast roster, the wander state, and the
 *   draw loop all live here because they're tightly coupled and the
 *   whole thing is presentational. No zustand slice — the simulation
 *   has no listeners outside this island.
 * - Cast roster is derived from `lib/cast` so the floor renders only
 *   voices that have bibles (the source app had three extra shapes
 *   without bibles; they're dropped here).
 * - Banter goes through the server action passed in by the page.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  BanterContext,
  BanterResult,
  BanterTurn,
} from "lib/capabilities/agent/banter";
import { bibles, type CastMemberId } from "lib/cast";
import { createLogger } from "lib/log";

// ---------- tunables ----------

const TILE = 32;
const COLS = 24;
const ROWS = 16;
const W = TILE * COLS;
const H = TILE * ROWS;
const PAD = 4;
const FRAME_MS = 1000 / 24;

// ---------- types ----------

type Shape = "circle" | "diamond" | "star" | "cross" | "triangle" | "hex" | "square";
type Status = "idle" | "working" | "thinking" | "speaking";

type Room = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fill: string;
};

type Townie = {
  id: CastMemberId;
  name: string;
  role: string;
  colour: string;
  glow: string;
  shape: Shape;
  status: Status;
  task: string;
  mood: string;
  home: { x: number; y: number; w: number; h: number };
};

type Sim = {
  id: CastMemberId;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  wanderTimer: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

type LogLine = { ts: string; text: string };

const log = createLogger("client:play.agent-town");

// ---------- roster ----------

// Six rooms — left, middle, right; top, bottom. The room metadata is
// stable visual chrome and doesn't need to come from any bible.
const ROOMS: Room[] = [
  { x: 1, y: 1, w: 6, h: 5, label: "Aura's Void", fill: "rgba(0, 30, 50, 0.55)" },
  { x: 9, y: 1, w: 5, h: 4, label: "Penny Ops", fill: "rgba(40, 0, 20, 0.55)" },
  { x: 16, y: 1, w: 6, h: 5, label: "Marcel Architecture", fill: "rgba(20, 20, 20, 0.55)" },
  { x: 1, y: 8, w: 5, h: 6, label: "Academy Studio", fill: "rgba(10, 10, 35, 0.55)" },
  { x: 8, y: 8, w: 7, h: 6, label: "Common Room", fill: "rgba(12, 14, 10, 0.55)" },
  { x: 17, y: 8, w: 5, h: 6, label: "Tim's Darkroom", fill: "rgba(30, 18, 0, 0.55)" },
];

// Roster — only voices that exist in lib/cast get a shape on the floor.
// Colour + shape + room come from the source app's agents.ts; role and
// task lines are short editorial twins of the bibles.
const TOWNIES: Townie[] = [
  {
    id: "aura",
    name: "Aura",
    role: "Void Princess / hostess",
    colour: "#00f3ff",
    glow: "#00f3ff",
    shape: "hex",
    status: "idle",
    task: "watching the whole floor",
    mood: "still",
    home: { x: 1, y: 1, w: 6, h: 5 },
  },
  {
    id: "penny",
    name: "Penny",
    role: "advertising lead",
    colour: "#ff6eb4",
    glow: "#ff6eb4",
    shape: "diamond",
    status: "working",
    task: "mapping OCEAN profiles",
    mood: "sharp",
    home: { x: 9, y: 1, w: 5, h: 4 },
  },
  {
    id: "baby",
    name: "Baby",
    role: "the prefect",
    colour: "#ffd700",
    glow: "#ffd700",
    shape: "star",
    status: "working",
    task: "keeping the cohort in line",
    mood: "authoritative",
    home: { x: 9, y: 1, w: 5, h: 4 },
  },
  {
    id: "millie",
    name: "Millie",
    role: "social specialist",
    colour: "#87ceeb",
    glow: "#87ceeb",
    shape: "circle",
    status: "working",
    task: "listening to corridor talk",
    mood: "eager",
    home: { x: 8, y: 8, w: 7, h: 6 },
  },
  {
    id: "betsy",
    name: "Betsy",
    role: "parallel-exit specialist",
    colour: "#9b59b6",
    glow: "#b39ddb",
    shape: "triangle",
    status: "thinking",
    task: "finding the other door",
    mood: "dreamy",
    home: { x: 8, y: 8, w: 7, h: 6 },
  },
  {
    id: "trixie",
    name: "Trixie",
    role: "pipeline overseer",
    colour: "#98fb98",
    glow: "#00ff88",
    shape: "cross",
    status: "working",
    task: "keeping the flow honest",
    mood: "stubborn",
    home: { x: 8, y: 8, w: 7, h: 6 },
  },
  {
    id: "marcel",
    name: "Marcel",
    role: "swarm architect",
    colour: "#e8e8e8",
    glow: "#ffffff",
    shape: "hex",
    status: "working",
    task: "routing tasks across the cluster",
    mood: "precise",
    home: { x: 16, y: 1, w: 6, h: 5 },
  },
  {
    id: "tim",
    name: "Tim",
    role: "visual specialist",
    colour: "#ff8c42",
    glow: "#ff8c42",
    shape: "square",
    status: "working",
    task: "scoring outputs from the comfy pipelines",
    mood: "attentive",
    home: { x: 17, y: 8, w: 5, h: 6 },
  },
];

// Filter to bible-backed townies only. Any townie whose id isn't in
// the registry is silently dropped — the floor only renders voices the
// banter capability can actually speak as.
const ROSTER: Townie[] = TOWNIES.filter((t) => t.id in bibles);

// ---------- canvas helpers ----------

function timestamp(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function boundsForHome(home: Townie["home"]) {
  const minX = (home.x + 1) * TILE + PAD;
  const maxX = (home.x + home.w - 1) * TILE - PAD;
  const minY = (home.y + 1) * TILE + PAD;
  const maxY = (home.y + home.h - 1) * TILE - PAD;
  return {
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minY: Math.min(minY, maxY),
    maxY: Math.max(minY, maxY),
  };
}

function randomIn(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  colour: string,
  glow: string,
) {
  ctx.save();
  // halo
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // body
  ctx.fillStyle = colour;
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.4;

  switch (shape) {
    case "circle":
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "star": {
      const n = 5;
      const outer = 7;
      const inner = 3.2;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / n) * i - Math.PI / 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "triangle":
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 5);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "cross":
      ctx.fillRect(-2, -7, 4, 14);
      ctx.fillRect(-7, -2, 14, 4);
      break;
    case "hex": {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i - Math.PI / 2;
        const x = Math.cos(a) * 7;
        const y = Math.sin(a) * 7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "square":
    default:
      ctx.fillRect(-5, -6, 10, 12);
      ctx.strokeRect(-5, -6, 10, 12);
      break;
  }
  ctx.restore();
}

function drawFloor(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, W, H);
  // scanlines for the synthwave clinical look
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }
}

function drawRooms(ctx: CanvasRenderingContext2D) {
  ctx.font = "9px ui-monospace, Menlo, monospace";
  for (const room of ROOMS) {
    const rx = room.x * TILE;
    const ry = room.y * TILE;
    const rw = room.w * TILE;
    const rh = room.h * TILE;
    ctx.fillStyle = room.fill;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = "rgba(0, 243, 255, 0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
    ctx.fillStyle = "rgba(0, 243, 255, 0.35)";
    ctx.fillText(room.label, rx + 6, ry + 12);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(0, 243, 255, 0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += TILE) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
  }
  for (let y = 0; y <= H; y += TILE) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
  }
  ctx.stroke();
}

// ---------- main component ----------

type Props = {
  available: boolean;
  generate: (context: BanterContext) => Promise<BanterResult>;
};

export default function AgentTownClient({ available, generate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simsRef = useRef<Sim[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const selectedRef = useRef<CastMemberId | null>(null);

  const [selected, setSelected] = useState<CastMemberId | null>(null);
  const [logLines, setLogLines] = useState<LogLine[]>([
    { ts: timestamp(), text: "boot — agent town initialising." },
  ]);
  const [turns, setTurns] = useState<BanterTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rosterById = useMemo(() => {
    const map = new Map<CastMemberId, Townie>();
    for (const t of ROSTER) map.set(t.id, t);
    return map;
  }, []);

  const pushLog = useCallback((line: string) => {
    setLogLines((prev) => {
      const next = [{ ts: timestamp(), text: line }, ...prev];
      return next.slice(0, 80);
    });
  }, []);

  // ---- initial sim state ----
  useEffect(() => {
    if (simsRef.current.length > 0) return;
    simsRef.current = ROSTER.map((t) => {
      const b = boundsForHome(t.home);
      const x = randomIn(b.minX, b.maxX);
      const y = randomIn(b.minY, b.maxY);
      return {
        id: t.id,
        x,
        y,
        targetX: x,
        targetY: y,
        speed: 0.4 + Math.random() * 0.45,
        wanderTimer: 60 + Math.random() * 200,
        bounds: b,
      };
    });
    pushLog(`floor online — ${ROSTER.length} voices in residence.`);
    log.info("sim initialised", { count: ROSTER.length });
  }, [pushLog]);

  // ---- draw + tick loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = (now: number) => {
      if (now - lastTickRef.current >= FRAME_MS) {
        lastTickRef.current = now;
        // update
        for (const sim of simsRef.current) {
          const dx = sim.targetX - sim.x;
          const dy = sim.targetY - sim.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            sim.x += (dx / dist) * sim.speed * 1.6;
            sim.y += (dy / dist) * sim.speed * 1.6;
          }
          sim.wanderTimer -= 1;
          if (sim.wanderTimer <= 0) {
            sim.wanderTimer = 100 + Math.random() * 280;
            sim.targetX = randomIn(sim.bounds.minX, sim.bounds.maxX);
            sim.targetY = randomIn(sim.bounds.minY, sim.bounds.maxY);
          }
        }

        // draw
        drawFloor(ctx);
        drawRooms(ctx);
        drawGrid(ctx);

        for (const sim of simsRef.current) {
          const townie = rosterById.get(sim.id);
          if (!townie) continue;
          ctx.save();
          ctx.translate(sim.x, sim.y);
          drawShape(ctx, townie.shape, townie.colour, townie.glow);
          ctx.restore();

          // name label
          ctx.save();
          ctx.fillStyle = townie.colour;
          ctx.font = "8px ui-monospace, Menlo, monospace";
          ctx.textAlign = "center";
          ctx.fillText(townie.name, sim.x, sim.y - 13);
          ctx.restore();

          // selection ring
          if (selectedRef.current === sim.id) {
            ctx.save();
            ctx.strokeStyle = townie.glow;
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(sim.x, sim.y, 13, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [rosterById]);

  // ---- click to inspect ----
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // canvas is rendered with CSS scaling, so map pointer back to
      // its internal pixel space before hit-testing.
      const cx = ((e.clientX - rect.left) / rect.width) * W;
      const cy = ((e.clientY - rect.top) / rect.height) * H;
      let hitId: CastMemberId | null = null;
      let hitDist = 18; // ~ halo + body
      for (const sim of simsRef.current) {
        const d = Math.hypot(cx - sim.x, cy - sim.y);
        if (d < hitDist) {
          hitDist = d;
          hitId = sim.id;
        }
      }
      selectedRef.current = hitId;
      setSelected(hitId);
      if (hitId) {
        const townie = rosterById.get(hitId);
        if (townie) {
          pushLog(`-> ${townie.name}: "${townie.task}"`);
          log.info("agent selected", { id: hitId });
        }
      } else {
        pushLog("deselected. tap a shape to inspect.");
      }
    },
    [pushLog, rosterById],
  );

  // ---- banter the room ----
  const handleBanter = useCallback(async () => {
    if (thinking) return;
    setThinking(true);
    setError(null);
    const onMic: CastMemberId[] = selected
      ? // prioritise the selected agent + two near-by roommates
        Array.from(
          new Set<CastMemberId>([
            selected,
            ...ROSTER.filter(
              (t) =>
                t.id !== selected &&
                rosterById.get(selected)?.home.x === t.home.x &&
                rosterById.get(selected)?.home.y === t.home.y,
            )
              .slice(0, 2)
              .map((t) => t.id),
          ]),
        )
      : ROSTER.slice(0, 3).map((t) => t.id);

    const speakers = onMic.length >= 2 ? onMic : ROSTER.slice(0, 3).map((t) => t.id);

    const tasks = speakers
      .map((id) => {
        const t = rosterById.get(id);
        return t ? `${t.name} is ${t.task}` : null;
      })
      .filter((s): s is string => Boolean(s))
      .join("; ");

    const lastEvent = `On the floor right now: ${tasks}. The viewer is watching. React briefly, stay in voice.`;

    pushLog(`banter request — ${speakers.length} on-mic.`);
    log.info("banter request", { speakers, available });

    try {
      const result = await generate({
        activeSpeakers: speakers,
        telemetry: { chronoMode: "amber", phase: "hub", tickMs: 30_000 },
        lastEvent,
      });
      if (result.turns.length === 0) {
        if (!available) {
          setError("banter unavailable — GOOGLE_AI_API_KEY is not set.");
          pushLog("banter empty — google key absent.");
        } else {
          setError("banter returned no turns.");
          pushLog("banter empty.");
        }
        setTurns([]);
      } else {
        setTurns(result.turns);
        for (const turn of result.turns) {
          const speaker = rosterById.get(turn.speaker as CastMemberId);
          const name = speaker?.name ?? turn.speaker;
          pushLog(`${name} (${turn.emotion}): "${turn.text}"`);
        }
        log.info("banter ok", { count: result.turns.length });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "banter call failed";
      setError(message);
      pushLog(`banter error — ${message}`);
      log.error("banter call failed", { err: message });
    } finally {
      setThinking(false);
    }
  }, [available, generate, pushLog, rosterById, selected, thinking]);

  const selectedTownie = selected ? rosterById.get(selected) ?? null : null;

  return (
    <section className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1">
        <div className="overflow-hidden rounded-sm border border-warm-black-800 bg-[#0a0a0f]">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={handleCanvasClick}
            className="block h-auto w-full cursor-crosshair"
            aria-label="Agent town floor — click a shape to inspect"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-chrome-400">
          <button
            type="button"
            disabled={thinking}
            onClick={handleBanter}
            className="rounded-full border border-pink-200/40 bg-pink-200/10 px-5 py-2 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {thinking ? "thinking…" : "ask the room to banter →"}
          </button>
          {!available && (
            <span>google ai key absent — banter will return empty.</span>
          )}
          {error && <span className="text-pink-200">{error}</span>}
        </div>
      </div>

      <aside className="w-full max-w-sm shrink-0 lg:w-80">
        <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
          <div className="chrome-label mb-2 text-chrome-500">inspect</div>
          {selectedTownie ? (
            <div className="space-y-2 text-sm">
              <div
                className="font-mono text-base"
                style={{ color: selectedTownie.colour }}
              >
                {selectedTownie.name}
              </div>
              <div className="text-xs text-chrome-400">
                {selectedTownie.role}
              </div>
              <div className="text-xs text-chrome-300">
                <span className="text-chrome-500">task </span>
                {selectedTownie.task}
              </div>
              <div className="text-xs text-chrome-300">
                <span className="text-chrome-500">mood </span>
                {selectedTownie.mood}
              </div>
              <div className="text-xs text-chrome-300">
                <span className="text-chrome-500">status </span>
                {selectedTownie.status}
              </div>
            </div>
          ) : (
            <p className="text-xs text-chrome-500">
              click a shape on the floor to inspect.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
          <div className="chrome-label mb-2 text-chrome-500">
            latest banter
          </div>
          {turns.length === 0 ? (
            <p className="text-xs text-chrome-500">
              no banter yet. press the button below the floor.
            </p>
          ) : (
            <ol className="space-y-2 text-xs">
              {turns.map((turn, i) => {
                const speaker = rosterById.get(turn.speaker as CastMemberId);
                const colour = speaker?.colour ?? "#c8d8e8";
                return (
                  <li key={i} className="text-chrome-200">
                    <span
                      className="font-mono"
                      style={{ color: colour }}
                    >
                      {speaker?.name ?? turn.speaker}
                    </span>
                    <span className="text-chrome-500"> ({turn.emotion})</span>
                    <span>: {turn.text}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="mt-4 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-4">
          <div className="chrome-label mb-2 text-chrome-500">event log</div>
          <ol className="max-h-64 space-y-1 overflow-y-auto pr-1 text-[11px] text-chrome-400">
            {logLines.map((line, i) => (
              <li key={i}>
                <span className="text-chrome-600">[{line.ts}]</span>{" "}
                {line.text}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </section>
  );
}
