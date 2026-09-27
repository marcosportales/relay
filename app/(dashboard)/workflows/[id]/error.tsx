"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-svh">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-xl">
            <TriangleAlertIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle className="text-base">Something went wrong</EmptyTitle>
          <EmptyDescription>
            We couldn&apos;t load this workflow. Please try again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => retry()}>
            <RotateCwIcon />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
