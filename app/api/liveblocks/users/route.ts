import { auth, clerkClient } from "@clerk/nextjs/server"
import * as Sentry from "@sentry/nextjs"

const MAX_USER_IDS = 100

type UserInfo = Liveblocks["UserMeta"]["info"]

function parseUserIds(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null) return null

  const { userIds } = body as { userIds?: unknown }

  if (
    !Array.isArray(userIds) ||
    userIds.length > MAX_USER_IDS ||
    userIds.some((id) => typeof id !== "string")
  ) {
    return null
  }

  return userIds
}

export async function POST(request: Request) {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const userIds = parseUserIds(await request.json().catch(() => null))

  if (!userIds) {
    Sentry.logger.warn("Invalid Liveblocks resolve-users request", {
      "org.id": orgId,
    })
    return new Response("Bad Request", { status: 400 })
  }

  const uniqueIds = [...new Set(userIds)]

  if (uniqueIds.length === 0) {
    return Response.json([])
  }

  const client = await clerkClient()

  // Scoped to the caller's org so only fellow members can be resolved.
  const { data: users } = await client.users.getUserList({
    userId: uniqueIds,
    organizationId: [orgId],
    limit: uniqueIds.length,
  })

  const usersById = new Map<string, UserInfo>(
    users.map((user) => [
      user.id,
      {
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          "Anonymous",
        avatar: user.imageUrl,
      },
    ])
  )

  return Response.json(userIds.map((id) => usersById.get(id) ?? null))
}
