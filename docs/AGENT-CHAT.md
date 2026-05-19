# Per-person agent chat — running the skeleton

The studio's `/agents/[slug]` pages talk to a **local Ollama**. No
hosted inference, no API keys, nothing leaves the machine the chat is
running on. This doc is the setup, the env vars, and the privacy
posture.

If you're a visitor poking at the public site, you just need Ollama
running on your own laptop. If you're the studio, you also have the
option of pointing the site at the bench's Ollama over Tailscale
(notes below).

## What the skeleton does

For each person with a public profile in `data/people.json`, the page
at `/agents/<slug>` mounts a small chat box. The chat box posts to
`/api/agents/<slug>/chat`, which:

1. Looks up the public profile.
2. Builds a system prompt from PUBLIC FIELDS ONLY — scenes, role,
   location, the short bio, the site URL, any social handles.
3. Streams a reply from the local Ollama runtime.

The agent has a hard boundary clause baked into the system prompt —
"you are not the real person, don't invent biographical detail, decline
opinions the practitioner hasn't publicly stated". That clause is in
`lib/agents/system-prompt.ts`. It is load-bearing. Don't move it.

## Running Ollama locally

One-time:

1. Install Ollama from <https://ollama.com>.
2. Pull the default model:

   ```bash
   ollama pull qwen3:8b
   ```

3. Start the runtime (it lives on `localhost:11434` by default):

   ```bash
   ollama serve
   ```

That's it. Reload `/agents/<any-slug>` and the connection indicator at
the top of the chat box flips to **ready**.

If Ollama isn't running, the route returns a 503 with a friendly
message and the UI says "ollama offline". This is the test of "we
shipped a skeleton, not a broken page" — the rest of the page still
works, the chat just sits there politely waiting for a runtime.

## Models the studio uses

| Model | Why | Pull |
| --- | --- | --- |
| `qwen3:8b` | Default. Fast on a 12 GB GPU, plays well with the public-bio prompt size, British-tolerant. | `ollama pull qwen3:8b` |
| `llama3.2:3b` | Lighter fallback when the laptop's GPU is busy with Aura. | `ollama pull llama3.2:3b` |
| `gemma3:4b` | Decent third option, slightly punchier on short replies. | `ollama pull gemma3:4b` |

Pick whichever you have pulled — the env var below switches it.

## Env vars

Two knobs. Both optional.

| Var | Default | What it does |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Where to find the Ollama HTTP API. Point at a remote box (Tailscale, LAN) to use the studio's bench instead of your own laptop. |
| `OLLAMA_MODEL` | `qwen3:8b` | Which pulled model to run the chat through. Must be a model name Ollama can resolve — i.e. one you've `ollama pull`-ed. |

For local dev, drop them in `.env.local`:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
```

For the studio's bench-over-Tailscale setup, point at the tailnet
hostname:

```bash
OLLAMA_BASE_URL=http://chonky.tail99b2a4.ts.net:11434
OLLAMA_MODEL=qwen3:8b
```

(The bench needs `OLLAMA_HOST=0.0.0.0:11434` so it listens on the
tailnet interface, not just loopback.)

## Privacy posture

The defining property of this surface: **the bytes never leave the
visitor's machine**. The Next.js route function is a thin bounce — it
reads the public profile from a JSON file shipped with the build, it
builds the system prompt server-side, and it streams the model's reply
back through itself, but the model itself runs on the runtime at
`OLLAMA_BASE_URL`. By default that's the visitor's own laptop.

Concretely, this means:

- No third-party inference provider sees the conversation.
- No request logging captures the conversation content. The route
  emits no `console.log` of message bodies (only counts + errors).
- No conversation is persisted server-side. The client keeps the last
  40 turns in `localStorage` keyed by slug; clearing browser storage
  wipes it.
- The profile material in the system prompt is, by construction, the
  same material the public site already publishes. No private rolodex
  fields, no emails, no editorial notes.

If the studio later flips on a hosted-Ollama mode for visitors who
don't want to install anything locally, that posture changes and the
UI footer needs updating accordingly. For now, the skeleton is
local-runtime only.

## Files

- `lib/agents/system-prompt.ts` — the prompt builder. Pure function.
- `app/api/agents/[slug]/chat/route.ts` — the streaming endpoint.
- `components/agents/AgentChat.tsx` — the client chat surface.
- `app/agents/[slug]/page.tsx` — the page it mounts in.

## What's not in the skeleton

- No retrieval over the practitioner's own website. The agent only
  knows what the profile carries plus general knowledge from the
  underlying model. Adding site-scrape RAG is the obvious next step.
- No multi-turn memory beyond the live conversation. Each fresh
  page-load starts from the system prompt + local-storage history.
- No auth gate. The whole surface is public. Subscriber-tier
  depth-of-context lands later (see `docs/ROADMAP.md`).
- No tool use. The Aura agent at `/api/aura/agent` has tool use; this
  one is text-only on purpose — the per-person agent shouldn't be
  navigating, capturing leads, or taking actions on the practitioner's
  behalf.
