/**
 * app/agents/crew/page.tsx — Crew runner operator surface.
 *
 * One-line role: the page where an operator (the studio's solo
 * operator, or a future collaborator with the same allow-list claim)
 * sends a task to the cast and watches the trail come back.
 *
 * # Auth posture
 *
 * Server-component gate. Reads the `__session` Firebase ID-token
 * cookie — the same convention `<PatreonGate>` uses — verifies it
 * server-side, and only renders the form when the caller is on the
 * operator allow-list (or carries `role: "operator"`). Anyone else
 * sees a polite "operator console" notice.
 *
 * Belt-and-braces: even if a public visitor somehow lands here, the
 * `/api/agents/crew` POST is itself operator-gated. The page gate
 * exists so we don't render the form to people who can't use it.
 *
 * # Voice
 *
 * Princess Mary-Poppins-with-teeth on the hero. NOT GLaDOS. The crew
 * IS the studio's cast; we describe them as a council, not a tool.
 *
 * # Style
 *
 *   - warm-black-950 background
 *   - chrome-200 mono body text
 *   - pink-200 accents
 *   - matches /admin/drops/new for layout chrome
 */

import { cookies } from "next/headers";
import Link from "next/link";

import { isAdminEmail } from "lib/auth/admin-emails";
import { verifyIdToken } from "lib/firebase/admin";

import { CrewRunnerClient } from "./crew-runner-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Send the cast a task — crew runner",
  description:
    "Operator console for handing work to the studio's cast — Aura, Marcel, Coco, the Scribe, Penny.",
  robots: { index: false, follow: false },
};

// ---------------------------------------------------------------------
// Auth check — `__session` cookie → verifyIdToken → allow-list
// ---------------------------------------------------------------------

type OperatorCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "no-cookie" | "invalid-token" | "not-on-list" };

async function checkOperator(): Promise<OperatorCheck> {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;
  if (!session) return { ok: false, reason: "no-cookie" };

  let email: string | null = null;
  let role: string | null = null;
  try {
    const decoded = await verifyIdToken(session);
    email = decoded.email?.toLowerCase() ?? null;
    // verifyIdToken's return type only surfaces uid + email, but the
    // underlying admin SDK decode carries the full claim bag. Best-
    // effort role read; if the shape changes we just fall through to
    // the email check.
    const raw = decoded as unknown as Record<string, unknown>;
    role = typeof raw.role === "string" ? raw.role : null;
  } catch {
    return { ok: false, reason: "invalid-token" };
  }

  const isOperator = role === "operator" || isAdminEmail(email);
  if (!isOperator) return { ok: false, reason: "not-on-list" };
  return { ok: true, email: email ?? "(no email)" };
}

// ---------------------------------------------------------------------
// Gate UI (rendered when the visitor isn't an operator)
// ---------------------------------------------------------------------

function GateFrame({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-16 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <span className="chrome-label text-chrome-400">Operator console</span>
        <h1 className="text-lg uppercase tracking-[0.18em] text-chrome-100">
          {title}
        </h1>
        <div className="text-xs leading-relaxed text-chrome-300">{body}</div>
        <Link
          href="/"
          className="chrome-label text-chrome-500 hover:text-pink-200"
        >
          ← Back to the studio
        </Link>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export default async function CrewRunnerPage() {
  const check = await checkOperator();

  if (!check.ok) {
    if (check.reason === "no-cookie" || check.reason === "invalid-token") {
      return (
        <GateFrame
          title="Operator only — sign in to continue"
          body={
            <p>
              This is the back-of-house surface where the cast takes its
              orders. Sign in through the{" "}
              <Link
                href="/admin"
                className="text-pink-200 hover:text-pink-100"
              >
                operator console
              </Link>{" "}
              first, then come back.
            </p>
          }
        />
      );
    }
    return (
      <GateFrame
        title="Not authorised"
        body={
          <p>
            This account isn&rsquo;t on the operator allow-list. The
            cast doesn&rsquo;t take tasks from passing visitors —{" "}
            it&rsquo;s how we keep the kitchen calm.
          </p>
        }
      />
    );
  }

  return (
    <main className="min-h-screen bg-warm-black-950 px-6 py-12 font-mono text-chrome-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex items-start justify-between gap-6 border-b border-warm-black-700 pb-8">
          <div className="flex flex-col gap-3">
            <span className="chrome-label text-chrome-400">
              Operator &middot; agents &middot; crew
            </span>
            <h1 className="text-2xl uppercase tracking-[0.18em] text-chrome-100">
              Send the cast a task
            </h1>
            <p className="max-w-xl text-xs leading-relaxed text-chrome-300">
              The crew is the studio&rsquo;s council of specialists. Aura
              plans &mdash; she has the longest memory and the firmest
              hand. Marcel architects: he draws the load paths, sets the
              tolerances, decides what the thing is actually <em>made</em>{" "}
              of. Coco vibe-checks; if a piece feels off she will say so
              and she is almost always right. The Scribe catalogues, so
              nothing slips through the floorboards. Penny does the
              pixels, neat and patient and good at her job.
            </p>
            <p className="max-w-xl text-xs leading-relaxed text-chrome-300">
              Hand them a task &mdash; an article, a brief, a research
              run, a tone-pass on a piece of copy &mdash; and they will
              pass it between each other and return you a synthesised
              answer. You get the full trail back: who spoke, who they
              delegated to, what tools they reached for, what they
              finally agreed on. Don&rsquo;t be surprised when they
              argue. That is the point.
            </p>
          </div>
          <Link
            href="/admin"
            className="chrome-label shrink-0 text-chrome-500 hover:text-pink-200"
          >
            &larr; Console
          </Link>
        </header>

        <CrewRunnerClient operatorEmail={check.email} />
      </div>
    </main>
  );
}
