/**
 * lib/agents/crew/helpers.ts — Pure helpers for the crew runner.
 *
 * Stateless, no LLM calls, no server-only dependencies. Extracted from
 * `crew.ts` to keep the orchestrator under the 300-line cap.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Try to pull a JSON object out of free-form LLM text. Handles:
 *  - Raw JSON
 *  - JSON inside a ```json … ``` fence
 *  - JSON inside an unlabelled ``` fence
 *  - First balanced `{ … }` substring as a last resort
 *
 * Returns `null` if nothing parses.
 */
export function extractJsonObject(raw: string): Record<string, unknown> | null {
  const text = raw.trim();
  if (!text) return null;

  // 1. Direct parse.
  const direct = tryParseRecord(text);
  if (direct) return direct;

  // 2. Fenced block.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    const fenced = tryParseRecord(fenceMatch[1].trim());
    if (fenced) return fenced;
  }

  // 3. First balanced { … } substring.
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        const parsed = tryParseRecord(slice);
        if (parsed) return parsed;
        break;
      }
    }
  }
  return null;
}

function tryParseRecord(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
