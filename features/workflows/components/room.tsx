"use client"

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
    <LiveblocksProvider throttle={16} authEndpoint="/api/liveblocks/auth">
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
