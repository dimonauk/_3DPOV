"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "lib/firebase/client";
import {
  type Reply,
  type Thread,
  type ThreadId,
  REPLY_BODY_MAX,
  THREAD_BODY_MAX,
  THREAD_TITLE_MAX,
} from "./types";

function normaliseTimestamp(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

function thread(d: DocumentData, id: ThreadId): Thread {
  return {
    id,
    title: typeof d.title === "string" ? d.title : "",
    body: typeof d.body === "string" ? d.body : "",
    authorUid: typeof d.authorUid === "string" ? d.authorUid : "",
    authorName: typeof d.authorName === "string" ? d.authorName : null,
    createdAt: normaliseTimestamp(d.createdAt),
  };
}

function reply(d: DocumentData, id: string, threadId: ThreadId): Reply {
  return {
    id,
    threadId,
    body: typeof d.body === "string" ? d.body : "",
    authorUid: typeof d.authorUid === "string" ? d.authorUid : "",
    authorName: typeof d.authorName === "string" ? d.authorName : null,
    createdAt: normaliseTimestamp(d.createdAt),
  };
}

export async function listRecentThreads(
  count = 30,
): Promise<Thread[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const q = query(
    collection(db, "threads"),
    orderBy("createdAt", "desc"),
    fbLimit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => thread(doc.data(), doc.id));
}

export async function getThreadById(
  id: ThreadId,
): Promise<Thread | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const ref = doc(db, "threads", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return thread(snap.data(), snap.id);
}

export async function listReplies(
  threadId: ThreadId,
): Promise<Reply[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const q = query(
    collection(db, "threads", threadId, "replies"),
    orderBy("createdAt", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => reply(d.data(), d.id, threadId));
}

function trimTo(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function displayNameFor(user: User): string | null {
  if (user.displayName && user.displayName.length > 0) {
    return user.displayName;
  }
  if (user.email) {
    const at = user.email.indexOf("@");
    return at > 0 ? user.email.slice(0, at) : user.email;
  }
  return null;
}

export async function createThread(
  input: { title: string; body: string },
  user: User,
): Promise<ThreadId> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Database not configured.");

  const title = trimTo(input.title, THREAD_TITLE_MAX);
  const body = trimTo(input.body, THREAD_BODY_MAX);
  if (!title || !body) {
    throw new Error("Threads need both a title and a body.");
  }

  const ref = await addDoc(collection(db, "threads"), {
    title,
    body,
    authorUid: user.uid,
    authorName: displayNameFor(user),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createReply(
  threadId: ThreadId,
  body: string,
  user: User,
): Promise<string> {
  const db = getFirebaseDb();
  if (!db) throw new Error("Database not configured.");

  const trimmed = trimTo(body, REPLY_BODY_MAX);
  if (!trimmed) throw new Error("Replies need a body.");

  const ref = await addDoc(
    collection(db, "threads", threadId, "replies"),
    {
      body: trimmed,
      authorUid: user.uid,
      authorName: displayNameFor(user),
      createdAt: serverTimestamp(),
    },
  );
  return ref.id;
}

export function formatRelative(ms: number): string {
  const delta = Date.now() - ms;
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  // Anything older than a month falls back to day + month, no year —
  // the site reads as an archive, not a timestamped feed.
  const date = new Date(ms);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
