/**
 * lib/agents/loop/react-loop/parser.ts
 *
 * Tolerant parsers for the ReAct text format:
 *   - `parseTurn` → ParsedTurn (action / answer / malformed)
 *   - `parseArgs` → typed args object from a single-line JSON
 *
 * Tolerant of: leading/trailing whitespace, surrounding ``` fences,
 * trailing prose after a balanced JSON object, missing Args, models
 * that skip `Thought:` on their final turn.
 */

export type ParsedTurn =
  | { kind: "action"; thought: string; tool: string; argsRaw: string }
  | { kind: "answer"; thought: string; answer: string }
  | { kind: "malformed"; raw: string };

export function parseTurn(rawIn: string): ParsedTurn {
  // Strip a single surrounding ``` fence if present.
  let raw = rawIn.trim();
  const fenceMatch = raw.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  if (fenceMatch && fenceMatch[1] !== undefined) raw = fenceMatch[1].trim();

  // Pull Thought (optional — some models skip it on the final turn).
  const thoughtMatch = raw.match(
    /Thought:\s*([\s\S]*?)(?=\n(?:Action:|Final Answer:)|$)/,
  );
  const thought = thoughtMatch?.[1] ? thoughtMatch[1].trim() : "";

  // Final Answer takes precedence — if both are present (which is
  // against the rules), we treat it as the answer and ignore the action.
  const finalMatch = raw.match(/Final Answer:\s*([\s\S]*)$/);
  if (finalMatch) {
    return { kind: "answer", thought, answer: (finalMatch[1] ?? "").trim() };
  }

  const actionMatch = raw.match(
    /Action:\s*([^\n]+)\s*\n\s*Args:\s*([\s\S]*)$/,
  );
  if (actionMatch) {
    return {
      kind: "action",
      thought,
      tool: (actionMatch[1] ?? "").trim(),
      argsRaw: (actionMatch[2] ?? "").trim(),
    };
  }

  // Some models give just a paragraph of prose on the last turn.
  // Treat that as an implicit Final Answer rather than malformed —
  // it's almost always what the model meant.
  if (!thought && raw.length > 0 && !/Action:/i.test(raw)) {
    return { kind: "answer", thought: "", answer: raw };
  }

  return { kind: "malformed", raw };
}

/**
 * Args are emitted as a single JSON line. Tolerant of:
 *   - trailing prose ("…} and that should do it") — slice at the
 *     first balanced top-level `}`
 *   - the model wrapping JSON in a fenced block
 *   - the model omitting Args entirely (treated as empty object)
 */
export function parseArgs(
  argsRaw: string,
): { ok: true; args: unknown } | { ok: false; error: string } {
  let s = argsRaw.trim();
  if (s === "") return { ok: true, args: {} };

  // Strip a surrounding ``` fence.
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence && fence[1] !== undefined) s = fence[1].trim();

  // If the model added trailing prose after the JSON, find the first
  // balanced top-level object and parse just that.
  if (s.startsWith("{")) {
    let depth = 0;
    let end = -1;
    let inStr = false;
    let escape = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        continue;
      }
      if (inStr) continue;
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end > 0) s = s.slice(0, end + 1);
  }

  try {
    return { ok: true, args: JSON.parse(s) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `args not valid JSON: ${msg}` };
  }
}
