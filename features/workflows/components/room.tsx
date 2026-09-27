"use client"

import * as Sentry from "@sentry/nextjs"

import { Spinner } from "@/components/ui/spinner"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense"

interface RoomProps {
  roomId: string
  children: React.ReactNode
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint="/api/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        try {
          const response = await fetch("/api/liveblocks/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds }),
          })

          if (!response.ok) {
            Sentry.logger.warn("Failed to resolve Liveblocks users", {
              "http.response.status_code": response.status,
            })
            return undefined
          }

          return await response.json()
        } catch (error) {
          Sentry.logger.warn("Failed to resolve Liveblocks users", {
            reason: error instanceof Error ? error.message : String(error),
          })
          return undefined
        }
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense
          fallback={
            <div className="flex min-h-svh items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
