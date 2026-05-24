/**
 * lib/agents/llm-client/providers/ollama-ping.ts
 *
 * Reachability probe for the local Ollama daemon. Used by the
 * fallback layer to decide whether falling back to Ollama is worth
 * trying — a long network timeout when Ollama isn't even running
 * would be a worse outcome than just surfacing the primary error.
 *
 * 1.5-second budget. Returns boolean; no error surface.
 */

import "server-only";

export async function pingOllama(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}
