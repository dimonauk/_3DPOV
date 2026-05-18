# `dialogue-ollama.ts` — purpose twin (capability `agent.dialogue-ollama`)

## Role

One LLM turn per call, running on the Hangar's local Ollama
instance. The third dialogue provider, alongside `agent.dialogue`
(Gemini, cloud) and `agent.dialogue-webgpu` (visitor's browser,
MLC). Costs zero per call after the model is warm; bigger models
than a browser can host; visitor data never leaves the tailnet.

Same shape as the Gemini provider: takes user text + character
bible + history, returns `text + intent + mode`. Surface code
calls it identically — the choice of provider is a runtime config
decision, not a code structure decision.

## Public surface

- `dialogueOllama(input)` — one async turn (stub in `.ts`; real
  impl in `.server.ts` as `dialogueOllamaServer`).
- `probeOllamaAvailable(serviceUrl, timeoutMs?)` — predicate
  hitting `/api/tags`. Caller checks this before routing a turn
  to Ollama to fail gracefully when the bench is offline.
- `DEFAULT_OLLAMA_MODEL` — `qwen2.5:7b`.
- Types: `OllamaModelId`, `OllamaDialogueInput`,
  `OllamaDialogueResult`, `OllamaDialogueError`.

## Internal

- `dialogueOllamaServer(input)` (in `.server.ts`) — assembles
  the same character-bible system prompt the Gemini provider
  builds, appends an envelope instruction asking the model to
  reply with `{text, intent, mode}` JSON, POSTs to
  `${OLLAMA_SERVICE_URL}/api/chat` with `stream: true`, decodes
  the NDJSON token-by-token via `Response.body.getReader()` +
  `TextDecoder`, fires `onStream` per chunk, parses the final
  envelope, and returns the assembled `OllamaDialogueResult`.
- The envelope parser is lenient — smaller local models honour
  the JSON contract less reliably than Gemini, so a plain-text
  reply (no envelope) is accepted with `intent: null` /
  `mode: null` rather than rejected.
- `ttftMs` is captured at first-token-received, `totalMs` at
  `done: true`, `tokens` from Ollama's reported `eval_count`.

## Depends on

- `OLLAMA_SERVICE_URL` env var — tailnet hostname (e.g.
  `https://ollama.tail99b2a4.ts.net`) when called from Vercel.
  Defaults to `http://localhost:11434` when unset and we're
  running on the bench itself.
- `OLLAMA_AUTH_TOKEN` env var — shared bearer for the Tailscale
  Funnel sidecar (per [[holoflow-bench-bridge]]). Empty token =
  no auth, only safe for bench-local dev with Funnel off.
- `lib/cast/aura` — `CharacterBible` type, passed in by caller.
- Native `fetch` + `ReadableStream` — no SDK. Ollama's HTTP API
  is stable.

## Does not

- **Does not own TTS or visemes.** Same posture as the Gemini
  provider: callers chain `dialogueOllama()` with
  `audio.tts.speak(result.text)` and `audio.visemes.start()`.
- **Does not own memory.** Reads `cast.history` from the caller.
  When `agent.memory` lands, callers will layer retrieval above
  this capability rather than threading it through here.
- **Does not retry on transient failures.** A failed POST is
  caught, logged, surfaced as `OllamaDialogueError` with code
  `service-unavailable` / `model-not-loaded` /
  `generation-failed`. Caller decides whether to fall back to a
  different provider or surface the error.
- **Does not auto-load models.** If a requested model isn't
  resident in Ollama's working set, the call returns
  `model-not-loaded` rather than triggering a multi-GB pull. The
  bench operator is responsible for `ollama pull <model>` once.
- **Does not pick the model.** Caller supplies `input.model` (or
  the capability uses `DEFAULT_OLLAMA_MODEL`). Route handlers
  decide based on the surface — code routes get
  `qwen2.5-coder:14b`, chat routes get `qwen2.5:7b`.
- **Does not stream over the network to the client.** Streaming
  is bench → server-route boundary only. If a route handler wants
  to stream to the client, it wraps this capability's `onStream`
  hook and emits its own SSE / chunked-transfer response.

## Plug surface

- **State plugs (write):** none directly — same posture as
  `agent.dialogue`. State writes happen at the caller (the route
  handler decides whether to persist the turn).
- **State plugs (read):** none directly — `bible` + `history` are
  passed in by the caller.
- **Type plugs:** `OllamaDialogueInput` in, `OllamaDialogueResult`
  out, `OllamaDialogueError` thrown.
- **Dependency plugs:** `OLLAMA_SERVICE_URL`, `OLLAMA_AUTH_TOKEN`
  env vars (the bench-bridge plug).

## Why three providers

The three dialogue providers (`agent.dialogue` / `dialogue-webgpu`
/ `dialogue-ollama`) cover three orthogonal cost / latency /
privacy trade-offs:

| Provider | Where | Cost per call | First-call latency | Strength |
|---|---|---|---|---|
| `agent.dialogue` (Gemini) | Google's GPU | $$ | instant | smartest model; cloud-locked |
| `agent.dialogue-webgpu` (MLC) | visitor's GPU | $0 | 1.5-2 GB download | privacy-best; works offline |
| `agent.dialogue-ollama` (this) | Hangar bench | $0 (electricity) | seconds (warm load) | local control; bigger models than browser; visitor data stays on tailnet |

Route handlers pick per surface. Long visitor sessions favour
WebGPU so each visitor pays their own GPU cycles. Studio-internal
flows favour Ollama because the bench has unmetered compute and
data sovereignty. Premium / commerce / first-impression flows
favour Gemini because the model is smartest and TTFT is lowest.

## Default model selection

Per the `ollama-local` Hangar skill, the bench is bound by 12 GB
VRAM on Sovereign-PC's RTX 3080 Ti. Staying under ≤8B-parameter
quantised models keeps the LLM resident without evicting other
loaded models (TTS, embedding). Recommended:

- **`qwen2.5-coder:14b`** — code-touching flows (atelier chambers
  that surface JSON / SVG / shader output). 14B Q4 just fits.
- **`qwen2.5:7b`** — chat / dialogue (Aura responses, Penny
  interjections, banter). `DEFAULT_OLLAMA_MODEL`.
- **`llama3.1:8b`** — alternative chat model when qwen feels too
  terse. Slightly slower TTFT.

## Posture

Foundation phase: type surface + stub router in `.ts`, working
server implementation in `.server.ts`. The capability is wired
into `lib/capabilities/_base.ts` and ready to route a turn — what
remains is the route-handler-level decision of *when* to pick
Ollama over Gemini per surface. That choice lives in route code,
not here.

## Bordering files

- `lib/capabilities/agent/dialogue.ts` — the Gemini provider;
  same `text + intent + mode` envelope.
- `lib/capabilities/agent/dialogue-webgpu.ts` — the MLC
  provider; same shape, browser-side.
- `lib/cast/aura.ts` — the canonical Aura bible passed into the
  prompt assembly.
- `lib/capabilities/audio/tts.ts` — chained downstream to speak
  the returned `text`.
- `lib/env.ts` — typed env access for `OLLAMA_SERVICE_URL` /
  `OLLAMA_AUTH_TOKEN`.

## How Aura's character lands here

Same as the Gemini provider: the character lives entirely in the
bible (`lib/cast/aura.ts`). This capability is the *transport*.
The system prompt assembled in `.server.ts` reproduces the
bible's voice + posture + draws + refusals + catchphrases +
forbidden into the LLM context every turn.

What differs from Gemini is response-shape *robustness*: the
local models honour the JSON envelope contract less reliably, so
the parser tolerates a plain-text reply with no envelope and
returns `intent: null` / `mode: null` rather than discarding the
turn. The user-visible text always survives — Aura still speaks,
even when the small model can't decide its own ChronoMode.
