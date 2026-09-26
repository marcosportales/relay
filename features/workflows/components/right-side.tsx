"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { PlayIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { runWorkflowAction } from "@/features/workflows/lib/actions"
import type { helloWorldTask } from "@/trigger/example"

type RunHandle = Awaited<ReturnType<typeof runWorkflowAction>>

const ACTIVE_STATUSES = new Set([
  "WAITING_FOR_DEPLOY",
  "DELAYED",
  "QUEUED",
  "EXECUTING",
  "REATTEMPTING",
  "FROZEN",
])

export function RightSide() {
  const [isPending, startTransition] = useTransition()
  const [handle, setHandle] = useState<RunHandle | null>(null)

  const { run, error } = useRealtimeRun<typeof helloWorldTask>(handle?.id, {
    accessToken: handle?.publicAccessToken,
    enabled: !!handle,
    skipColumns: ["payload"],
    onComplete: (completedRun) => {
      if (completedRun.status === "COMPLETED") {
        toast.success(completedRun.output?.message ?? "Workflow finished")
      } else {
        toast.error(`Workflow ${completedRun.status.toLowerCase()}`)
      }
    },
  })

  const isRunActive =
    !!handle && !error && (!run || ACTIVE_STATUSES.has(run.status))
  const isBusy = isPending || isRunActive

  const onRun = () => {
    startTransition(async () => {
      try {
        setHandle(await runWorkflowAction())
      } catch (runError) {
        toast.error(
          runError instanceof Error ? runError.message : "Failed to run workflow"
        )
      }
    })
  }

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3">
      <Button onClick={onRun} disabled={isBusy}>
        {isBusy ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <PlayIcon data-icon="inline-start" />
        )}
        {isBusy ? "Running" : "Run"}
      </Button>
      {run && (
        <Badge
          variant={run.status === "COMPLETED" ? "secondary" : "outline"}
          aria-live="polite"
        >
          {run.status.toLowerCase().replaceAll("_", " ")}
        </Badge>
      )}
      {error && (
        <Badge variant="destructive" aria-live="polite">
          {error.message}
        </Badge>
      )}
    </div>
  )
}
