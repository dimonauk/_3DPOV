/**
 * lib/capabilities/agent/memory-vector.server.ts — Server impl of
 * agent.memory-vector.
 *
 * Embedding via Gemini text-embedding-004 (768 dims). Storage in
 * Firestore at `users/{uid}/memory/{auto}`. Recall via
 * `collection.findNearest({ vectorField, queryVector, distanceMeasure:
 * 'COSINE', limit })` — native Firestore vector search; no extension
 * required, but a vector index on the `embedding` field must exist
 * (see the setup gcloud command in memory-vector.ts).
 */

import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";

import { getFirebaseAdminDb } from "lib/firebase/admin";

import {
  DEFAULT_EMBED_MODEL,
  DEFAULT_RECALL_K,
  type MemoryTurn,
  type MemoryVectorError,
  type RecallVectorInput,
  type RecallVectorResult,
  type RememberVectorInput,
  type RememberVectorResult,
} from "./memory-vector";

let _genai: GoogleGenAI | null = null;

function getGenai(): GoogleGenAI | null {
  if (_genai) return _genai;
  const key =
    process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  _genai = new GoogleGenAI({ apiKey: key });
  return _genai;
}

async function embed(text: string): Promise<number[]> {
  const genai = getGenai();
  if (!genai) {
    const detail: MemoryVectorError = {
      code: "embedding-failed",
      message:
        "agent.memory-vector: GOOGLE_AI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) missing — cannot embed",
    };
    throw Object.assign(new Error(detail.message), detail);
  }
  try {
    const response = await genai.models.embedContent({
      model: DEFAULT_EMBED_MODEL,
      contents: text,
    });
    const values = response.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error("empty embedding vector returned");
    }
    return values;
  } catch (err) {
    const detail: MemoryVectorError = {
      code: "embedding-failed",
      message: `agent.memory-vector: embedding call failed — ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }
}

function requireDb() {
  const db = getFirebaseAdminDb();
  if (!db) {
    const detail: MemoryVectorError = {
      code: "admin-not-configured",
      message:
        "agent.memory-vector: Firebase Admin not configured. Set FIREBASE_ADMIN_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.",
    };
    throw Object.assign(new Error(detail.message), detail);
  }
  return db;
}

export async function rememberVectorServer(
  input: RememberVectorInput,
): Promise<RememberVectorResult> {
  const db = requireDb();
  const embedding = await embed(input.turn.text);

  try {
    const ref = await db
      .collection("users")
      .doc(input.uid)
      .collection("memory")
      .add({
        ...input.turn,
        embedding: FieldValue.vector(embedding),
      });
    return { id: ref.id };
  } catch (err) {
    const detail: MemoryVectorError = {
      code: "firestore-write-failed",
      message: `agent.memory-vector: write failed — ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }
}

export async function recallVectorServer(
  input: RecallVectorInput,
): Promise<RecallVectorResult> {
  const db = requireDb();
  const k = input.k ?? DEFAULT_RECALL_K;
  const filter = input.speakerFilter ?? "all";

  const queryEmbedding = await embed(input.query);
  // findNearest pulls a few extra rows so the speaker-side filter
  // doesn't starve the result set when the top matches are all on one
  // side. 3x is a small constant — the index walk dominates cost.
  const fetchLimit = filter === "all" ? k : k * 3;

  try {
    const coll = db
      .collection("users")
      .doc(input.uid)
      .collection("memory");
    const vectorQuery = coll.findNearest({
      vectorField: "embedding",
      queryVector: FieldValue.vector(queryEmbedding),
      distanceMeasure: "COSINE",
      limit: fetchLimit,
    });
    const snap = await vectorQuery.get();

    const all: MemoryTurn[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        speaker: data["speaker"] as MemoryTurn["speaker"],
        text: data["text"] as string,
        at: data["at"] as string,
      };
    });

    const filtered =
      filter === "all"
        ? all
        : all.filter((t) =>
            filter === "user" ? t.speaker === "user" : t.speaker !== "user",
          );

    return {
      turns: filtered.slice(0, k),
      provider: "firestore-vector",
    };
  } catch (err) {
    // Firestore raises FAILED_PRECONDITION when the vector index is
    // missing. Surface a more actionable error so the operator knows
    // they need to run the index-create gcloud command.
    const message = err instanceof Error ? err.message : String(err);
    const isIndexMissing =
      message.includes("FAILED_PRECONDITION") ||
      message.toLowerCase().includes("index");
    const detail: MemoryVectorError = {
      code: isIndexMissing ? "vector-index-missing" : "firestore-query-failed",
      message: isIndexMissing
        ? "agent.memory-vector: Firestore vector index missing. Create with: gcloud firestore indexes composite create --collection-group=memory --query-scope=COLLECTION --field-config=vector-config='{\"dimension\":\"768\",\"flat\":\"{}\"}',field-path=embedding"
        : `agent.memory-vector: query failed — ${message}`,
    };
    throw Object.assign(new Error(detail.message), detail);
  }
}
