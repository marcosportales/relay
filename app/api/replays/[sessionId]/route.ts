import Browserbase from "@browserbasehq/sdk"
import { auth } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"

import { browserbase } from "@/lib/browserbase"

// Proxies a session's replay playlist, since retrieving it needs the secret API
// key. The playlist's segment lines are signed CDN URLs, so the player fetches
// those directly. Answers 202 (or Browserbase's own status) while the
// recording isn't ready; the client polls until it gets a 200.
export async function GET(
  _: Request,
  ctx: RouteContext<"/api/replays/[sessionId]">
) {
  const { orgId, has } = await auth()
  if (!orgId) return new Response("Unauthorized", { status: 401 })
  // Session replay is a pro feature.
  if (!has({ plan: "org:pro" }))
    return new Response("Pro plan required", { status: 403 })

  const { sessionId } = await ctx.params

  Sentry.getIsolationScope().setAttributes({
    "org.id": orgId,
    "browserbase.session_id": sessionId,
  })

  try {
    // The run task tags each session with its org. 404 rather than 403 so
    // another org can't probe which session ids exist.
    const session = await browserbase.sessions.retrieve(sessionId)
    if (session.userMetadata?.orgId !== orgId) {
      Sentry.logger.warn("Replay requested for another org's session")
      return new Response("Not found", { status: 404 })
    }

    // One playlist per tab; workflows drive a single page, so play the first.
    const { pages } = await browserbase.sessions.replays.retrieve(sessionId)
    const [page] = pages
    if (!page) return new Response("Replay not ready", { status: 202 })

    const playlist = await browserbase.sessions.replays.retrievePage(
      sessionId,
      page.pageId
    )
    return new Response(await playlist.text(), {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        // Segment URLs are signed and expire, so never serve a stale copy.
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    if (error instanceof Browserbase.APIError && error.status) {
      Sentry.logger.warn("Browserbase replay request failed", {
        "http.response.status_code": error.status,
        reason: error.message,
      })
      return new Response(error.message, { status: error.status })
    }
    throw error
  }
}
