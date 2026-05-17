"use client";

/**
 * Thin parser for AI SDK v6's UI message stream protocol — the format
 * `result.toUIMessageStreamResponse()` emits on the wire.
 *
 * The stream is Server-Sent Events: each event is `data: {json}\n\n`,
 * with one terminal `data: [DONE]\n\n`. JSON payloads have a `type`
 * field; we branch on it.
 *
 * We surface a SIMPLIFIED event vocabulary upstream — just enough to
 * drive the launcher UI:
 *
 *   { type: "text-delta", text: string }     — append to current msg
 *   { type: "tool-call",  toolName, args }   — model invoking a tool
 *   { type: "tool-result", toolName, result, action? }
 *                                            — tool finished
 *   { type: "finish" }                       — stream complete
 *   { type: "error", message }               — terminal error
 *
 * Tool calls in v6 arrive as a sequence of chunks:
 *   - `tool-input-start`           { toolName, toolCallId, inputSchema }
 *   - `tool-input-delta`           { toolCallId, inputTextDelta }   (×N)
 *   - `tool-input-available`       { toolCallId, toolName, input }  (final args)
 *   - `tool-output-available`      { toolCallId, output }           (result)
 *
 * We only emit a single `tool-call` event once `tool-input-available`
 * fires (when args are complete), and a `tool-result` event when
 * `tool-output-available` fires. Streaming-args UI (typing parameters
 * live) is deferred — too noisy for the maître d' UX.
 */

export type AuraStreamEvent =
  | { type: "text-delta"; text: string }
  | {
      type: "tool-call";
      toolName: string;
      toolCallId: string;
      args: Record<string, unknown>;
    }
  | {
      type: "tool-result";
      toolName: string;
      toolCallId: string;
      result: unknown;
      action?: AuraClientAction;
    }
  | { type: "finish" }
  | { type: "error"; message: string };

/**
 * Client-side action emitted by tool results. Mirrors the shape from
 * lib/aura/agent-tools.ts execute() returns.
 */
export type AuraClientAction =
  | { kind: "navigate"; path: string; reason?: string }
  | { kind: "showCards"; cards: AuraCardSummary[] }
  | { kind: "showCard"; card: AuraCardSummary }
  | { kind: "openBooking"; purpose?: string; url?: string }
  | { kind: "leadCaptured"; id: string; email: string }
  | { kind: "scannerOpen" }
  | { kind: "showVcard"; slug: string; url: string; name: string }
  | { kind: "saveToWallet"; slug: string; platforms: Array<"apple" | "google"> }
  | { kind: "playAnimation"; name: string };

export type AuraCardSummary = {
  slug: string;
  name: string;
  role?: string;
  studio?: string;
  tagline?: string;
  primary: string;
  qrPath: string;
  url: string;
};

/**
 * Parse a Response body (SSE stream) and yield simplified events. Caller
 * iterates with `for await`. Handles SSE framing, partial chunks, and
 * `[DONE]` terminator. Never throws on a malformed line — emits an
 * `error` event and continues.
 */
export async function* parseAuraStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AuraStreamEvent, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Track in-flight tool call inputs by call id so we can pair the
  // input-available + output-available events.
  const toolNames = new Map<string, string>();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split on SSE event boundaries (`\n\n`)
      while (true) {
        const idx = buffer.indexOf("\n\n");
        if (idx === -1) break;
        const event = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        // Each event is one-or-more `data: ...` lines.
        const lines = event.split(/\r?\n/);
        const payloads: string[] = [];
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            payloads.push(line.slice(6));
          } else if (line.startsWith("data:")) {
            payloads.push(line.slice(5));
          }
        }
        if (payloads.length === 0) continue;

        const payload = payloads.join("\n");
        if (payload === "[DONE]") {
          yield { type: "finish" };
          continue;
        }

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(payload);
        } catch {
          // Malformed line — skip silently. Could be a non-JSON SSE
          // comment or an interrupted chunk.
          continue;
        }

        const t = parsed["type"];
        switch (t) {
          case "text-delta": {
            const delta = String(parsed["delta"] ?? "");
            if (delta) yield { type: "text-delta", text: delta };
            break;
          }
          case "tool-input-start": {
            const id = String(parsed["toolCallId"] ?? "");
            const name = String(parsed["toolName"] ?? "");
            if (id && name) toolNames.set(id, name);
            break;
          }
          case "tool-input-available": {
            const id = String(parsed["toolCallId"] ?? "");
            const name = String(
              parsed["toolName"] ?? toolNames.get(id) ?? "",
            );
            const args = (parsed["input"] as Record<string, unknown>) ?? {};
            if (name) {
              toolNames.set(id, name);
              yield { type: "tool-call", toolCallId: id, toolName: name, args };
            }
            break;
          }
          case "tool-output-available": {
            const id = String(parsed["toolCallId"] ?? "");
            const name = toolNames.get(id) ?? "";
            const output = parsed["output"];
            let action: AuraClientAction | undefined;
            if (
              output &&
              typeof output === "object" &&
              "action" in output &&
              output["action"] &&
              typeof output["action"] === "object"
            ) {
              const a = output["action"] as Record<string, unknown>;
              if (typeof a["kind"] === "string") {
                action = a as unknown as AuraClientAction;
              }
            }
            yield {
              type: "tool-result",
              toolCallId: id,
              toolName: name,
              result: output,
              ...(action ? { action } : {}),
            };
            break;
          }
          case "error": {
            const msg =
              typeof parsed["errorText"] === "string"
                ? (parsed["errorText"] as string)
                : typeof parsed["message"] === "string"
                  ? (parsed["message"] as string)
                  : "Stream error";
            yield { type: "error", message: msg };
            break;
          }
          case "finish":
          case "finish-step":
            // Step finish events are noisy — only the terminal [DONE]
            // gets translated to the upstream `finish`.
            break;
          default:
            // Ignore start, start-step, text-start, text-end,
            // tool-input-delta, and any other framing types.
            break;
        }
      }
    }
    yield { type: "finish" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}
