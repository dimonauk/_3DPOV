/**
 * /users/[handle]/inbox — Receives Activities from other servers.
 *
 * For this skeleton we only acknowledge Follow and Undo Follow. Real
 * conformance would:
 *  - verify the HTTP signature against the sending actor's publicKey
 *  - persist the follower (inbox URL, actor id) so publish.ts can
 *    fan out Create activities to them
 *  - send an Accept activity back to the sending actor's inbox
 *
 * None of that lands here. We accept the request, log the shape, and
 * return 202 so a curious instance admin pinging the inbox doesn't
 * see an error. The TODOs below mark every gap.
 */
import { isKnownHandle } from "lib/federation/actor";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ handle: string }> };

type Activity = {
  type?: string;
  actor?: string;
  object?: unknown;
  id?: string;
};

export async function POST(req: Request, { params }: Params): Promise<Response> {
  const { handle } = await params;
  if (!isKnownHandle(handle)) {
    return new Response("unknown account", { status: 404 });
  }

  let activity: Activity;
  try {
    activity = (await req.json()) as Activity;
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }

  // TODO(federation/http-signature): verify Signature header against
  // activity.actor's publicKey. Reject unsigned / invalid signatures.

  const type = typeof activity.type === "string" ? activity.type : "";
  switch (type) {
    case "Follow": {
      // TODO(federation/followers): persist
      //   { actor: activity.actor, inbox: <fetch actor doc to learn it> }
      // then POST an Accept back to the actor's inbox.
      logInbound("Follow", handle, activity);
      return accepted();
    }
    case "Undo": {
      // Undo wraps Follow / Like / etc. We only care about Undo→Follow.
      // TODO(federation/followers): remove the follower record.
      logInbound("Undo", handle, activity);
      return accepted();
    }
    case "Delete":
    case "Update":
    case "Create":
    case "Announce":
    case "Like": {
      // Silently accept. Skeleton doesn't store or surface these yet.
      logInbound(type, handle, activity);
      return accepted();
    }
    default: {
      logInbound(type || "<unknown>", handle, activity);
      return accepted();
    }
  }
}

function accepted(): Response {
  return new Response(null, { status: 202 });
}

function logInbound(type: string, handle: string, activity: Activity): void {
  // Lightweight; production would route to whatever logging the rest
  // of the site uses. Kept as a console line so Vercel runtime logs
  // pick it up without adding a transport.
  console.log(
    `[federation/inbox] handle=${handle} type=${type} actor=${activity.actor ?? "?"} id=${activity.id ?? "?"}`,
  );
}
