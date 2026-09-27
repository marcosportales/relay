"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import * as Sentry from "@sentry/nextjs"

import { cn } from "@/lib/utils"

const POLL_INTERVAL_MS = 3000
// A recording that isn't ready after this long most likely never will be
// (recording disabled, or past retention), so stop polling.
const POLL_TIMEOUT_MS = 2 * 60 * 1000

type ReplayStatus = "pending" | "ready" | "error"

interface SessionReplayProps {
  sessionId: string
  className?: string
}

// Plays a Browserbase session's recording. The recording lags the session
// close, so polls the replay route until the playlist is ready.
export function SessionReplay({ sessionId, className }: SessionReplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<ReplayStatus>("pending")
  const [error, setError] = useState<string | null>(null)
  const src = `/api/replays/${encodeURIComponent(sessionId)}`

  useEffect(() => {
    const controller = new AbortController()
    const deadline = Date.now() + POLL_TIMEOUT_MS
    let timeout: ReturnType<typeof setTimeout> | undefined

    setStatus("pending")
    setError(null)

    const fail = (message: string) => {
      Sentry.logger.warn("Session replay unavailable", {
        "browserbase.session_id": sessionId,
        reason: message,
      })
      setError(message)
      setStatus("error")
    }

    const poll = async () => {
      try {
        const res = await fetch(src, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (res.ok && res.status !== 202) return setStatus("ready")
        // Auth failures won't fix themselves; anything else may be the
        // recording still processing.
        if (res.status === 401 || res.status === 403)
          return fail("You don't have access to this replay.")
        if (Date.now() >= deadline)
          return fail("The recording for this session isn't available.")
        timeout = setTimeout(poll, POLL_INTERVAL_MS)
      } catch (err) {
        if (controller.signal.aborted) return
        fail(err instanceof Error ? err.message : "Couldn't load the replay.")
      }
    }
    poll()

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [src, sessionId])

  useEffect(() => {
    const video = videoRef.current
    if (status !== "ready" || !video) return

    // Safari plays HLS natively; everywhere else goes through hls.js.
    if (!Hls.isSupported()) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src
      } else {
        Sentry.logger.warn("Browser can't play HLS replay", {
          "browserbase.session_id": sessionId,
        })
        setError("This browser can't play the replay.")
        setStatus("error")
      }
      return
    }

    const hls = new Hls()
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) return
      Sentry.logger.error("Session replay playback failed", {
        "browserbase.session_id": sessionId,
        "hls.error_type": data.type,
        "hls.error_details": data.details,
      })
      setError("Playback failed.")
      setStatus("error")
    })
    hls.loadSource(src)
    hls.attachMedia(video)
    return () => hls.destroy()
  }, [status, src, sessionId])

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-md bg-muted",
        className
      )}
    >
      <video
        ref={videoRef}
        controls
        playsInline
        className={cn("size-full", status !== "ready" && "invisible")}
      />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
          {status === "pending" ? "Preparing recording…" : error}
        </div>
      )}
    </div>
  )
}
