/**
 * The Rookery — the studio's social spine.
 *
 * Threads live at /threads/{threadId}. Replies live as a subcollection
 * at /threads/{threadId}/replies/{replyId}. Everything is publicly
 * readable; only signed-in users can write. No editing or deletion in
 * v0 — what you put in the air, you put in the air.
 */

export type ThreadId = string;
export type ReplyId = string;

export type Thread = {
  id: ThreadId;
  title: string;
  body: string;
  authorUid: string;
  authorName: string | null;
  /** Unix milliseconds since epoch, normalised from Firestore Timestamp. */
  createdAt: number;
};

export type Reply = {
  id: ReplyId;
  threadId: ThreadId;
  body: string;
  authorUid: string;
  authorName: string | null;
  /** Unix milliseconds since epoch, normalised from Firestore Timestamp. */
  createdAt: number;
};

export type ThreadWithReplies = Thread & { replies: Reply[] };

export const THREAD_TITLE_MAX = 200;
export const THREAD_BODY_MAX = 5000;
export const REPLY_BODY_MAX = 5000;
