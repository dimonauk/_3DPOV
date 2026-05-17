# Open-source chat library survey (2026-05-17)

Survey for the Aura agent stack at `components/aura/aura-launcher.tsx`
(926 lines, hand-rolled chat UI + tool-call rendering). Existing stack:
Next.js 15.6, React 19, AI SDK v6, Firestore persistence, Whisper +
Kokoro voice workers, @pixiv/three-vrm avatar, three-tier LLM router
(Gemini agent / WebGPU local Llama / Gemini fallback).

## Known gaps (Aura)

1. Vector memory backend (decision: Firestore)
2. Streaming tool-call UI rendering (hand-rolled today)
3. Multi-character / multi-agent banter coordination (`agent.banter`)
4. Per-conversation branching / regenerate / edit-and-resend
5. Attachments (image upload → multimodal prompt)
6. Background research agents (fires search/scrape/synthesize)
7. Better persona handling (traits + memories + dynamic context)

## Top picks — ranked by fit

### 1. assistant-ui (`@assistant-ui/react`) — top pick for chat UI

- **Repo**: github.com/assistant-ui/assistant-ui — MIT, ~10k stars
- **What it gives**: Headless Radix-style primitives (`Thread`,
  `Message`, `Composer`, `ActionBar`, `BranchPicker`). First-class AI
  SDK adapter. Capability-based features (provide `setMessages` →
  branching; provide `onEdit` → editing). `CompositeAttachmentAdapter`
  for image upload. Streaming + auto-scroll + retries + markdown + code
  highlight + voice dictation already built-in.
- **What it would replace**: The render loop inside `aura-launcher.tsx`
  (message list, streaming chunks, tool-call display). VRM / voice /
  persona logic stays — assistant-ui is headless, so the VRM canvas
  slots beside the `Thread` and the Kokoro/Whisper hooks remain. Use
  `ExternalStoreRuntime` to bridge the existing AI SDK calls without
  rewriting `/api/aura/agent`.
- **Effort**: Medium (migration of the launcher's render loop)
- **Closes**: Gaps 2, 4, 5; partial on 7

### 2. Vercel AI Elements — cheaper alternative, additive

- **Repo**: github.com/vercel/ai-elements — Apache-2.0
- **Install**: `npx ai-elements@latest` (copy-into-repo, shadcn-style)
- **What it gives**: 20+ components — `Message`, `Conversation`,
  `PromptInput`, `Reasoning`, `Tool`, `Artifact`, `Sandbox`. You own
  the source; designed against `useChat` from AI SDK v6.
- **What it would replace**: Drop just the `Tool`, `Reasoning`, and
  `Artifact` components into the existing launcher.
- **Effort**: Small (additive — install the components you need)
- **Closes**: Gaps 2, 5 (no branching primitive — weaker than
  assistant-ui on gap 4)
- **Pick this** if you don't want a full launcher migration

### 3. Mastra — when the agent count grows

- **Repo**: github.com/mastra-ai/mastra — Elastic License 2.0
- **What it gives**: TypeScript-native agent framework. Agents +
  workflows + tools + memory + RAG. Multi-agent handoff is first-class
  (the natural fit for `agent.banter`). Working memory + semantic
  memory baked in.
- **Firestore adapter**: `@askelephant/mastra-firestore` (third-party
  npm) implements thread/message persistence on Firestore. Verify
  maintenance before depending on it.
- **What it would replace**: The hand-rolled tool-router in
  `/api/aura/agent` and the `lib/cast/` persona system become Mastra
  `Agent` definitions. `dialogue-ollama.ts` becomes a Mastra model
  provider.
- **Effort**: Large (it owns the agent layer)
- **Closes**: Gaps 1, 3, 6, 7. Pairs with assistant-ui via official
  integration.

### 4. CopilotKit + AG-UI protocol

- **Repo**: github.com/CopilotKit/CopilotKit — MIT
- **What it gives**: Shared-state pattern between agents and UI
  components via `useAgent` / `useFrontendTool`. AG-UI protocol for
  streaming chat + frontend tool calls + human-in-the-loop. Strong fit
  for "Aura reads the page and modifies UI" patterns (cards CRUD via
  tools).
- **Effort**: Medium
- **Closes**: Gaps 2, 3 (multi-agent via LangGraph integration), 6
  (HITL)

### 5. Firebase Vector Search Extension — direct fit for gap 1

- **Extension**: `googlecloud/firestore-vector-search`
- **What it gives**: Auto-embedding on Firestore document write via
  Genkit + Gemini/Vertex embeddings. Callable function for query with
  prefilter. Max 2048 dims. No infra to run.
- **Effort**: Small (extension install + one query function)
- **Closes**: Gap 1 — the Firestore-native answer. Pair with Mastra
  later, or wire directly into a new `agent.memory.vector` capability.
- **Cost lever**: cheaper than Vertex AI Vector Search at small scale;
  migrate later if memory grows past ~100k vectors.

## Explicitly NOT recommended

- **Vercel Chat SDK** (`chat-sdk.dev` / `vercel/chatbot`) — hard-wired
  to Drizzle + PostgreSQL + Auth.js 5 + fixed artifact data model.
  You'd fork and rip out the DB layer — not worth it when Firestore
  already works. Read the source for inspiration on artifact UI; don't
  adopt the template.
- **LibreChat** — MongoDB + Meilisearch + RAG-API microservice.
  Full platform; wrong shape (it *is* the app, not a library); zero
  VRM / voice / WebGPU hooks. Would replace the site, not extend it.
- **HuggingFace chat-ui** — SvelteKit + MongoDB. Wrong framework.
- **continue.dev** — IDE assistant (VS Code / JetBrains / Neovim).
  No reusable web UI surface.

## Suggested adoption path

1. **Now**: Install Firebase Vector Search Extension → close gap 1
   cleanly. Wire into a new `lib/capabilities/agent/memory.vector.ts`.
2. **Next sprint**: Add AI Elements `Tool`, `Reasoning`, `Artifact`
   components into the existing launcher → close gap 2 cheaply, defer
   the assistant-ui migration decision.
3. **When agent count > 2**: Adopt Mastra for the agent layer (gaps 3,
   6, 7). At that point migrate the launcher to assistant-ui to get
   branching, edit, attachments (gaps 4, 5) in one move. Mastra +
   assistant-ui pairing is in Mastra's official docs.

## Sources

- assistant-ui docs — assistant-ui.com/docs
- assistant-ui branching — assistant-ui.com/docs/guides/Branching
- assistant-ui external store — assistant-ui.com/docs/runtimes/custom/external-store
- Vercel AI Elements — github.com/vercel/ai-elements
- AI Elements overview — ai-sdk.dev/elements/overview
- Mastra — github.com/mastra-ai/mastra
- Mastra multi-agent — mastra.ai/guides/concepts/multi-agent-systems
- `@askelephant/mastra-firestore` — npmjs.com/package/@askelephant/mastra-firestore
- CopilotKit — github.com/CopilotKit/CopilotKit
- Firebase Vector Search Extension — extensions.dev/extensions/googlecloud/firestore-vector-search
- Firestore vector search — firebase.google.com/docs/firestore/vector-search
