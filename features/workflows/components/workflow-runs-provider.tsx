"use client"

import { createContext, useContext, useMemo } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type {
  RunStep,
  runWorkflowTask,
} from "@/features/workflows/tasks/run-workflow"

type WorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

const WorkflowRunsContext = createContext<WorkflowRun[] | null>(null)

interface WorkflowRunsProviderProps {
  workflowId: string
  accessToken: string
  children: React.ReactNode
}

export function WorkflowRunsProvider({
  workflowId,
  accessToken,
  children,
}: WorkflowRunsProviderProps) {
  const { runs } = useRealtimeRunsWithTag<typeof runWorkflowTask>(
    `workflow:${workflowId}`,
    { accessToken, skipColumns: ["payload"] }
  )

  return (
    <WorkflowRunsContext.Provider value={runs}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

export function useLatestRunSteps() {
  const ctx = useContext(WorkflowRunsContext)
  if (!ctx)
    throw new Error("useLatestRunSteps must be used within WorkflowRunsProvider")

  return useMemo(() => {
    const latest = ctx.reduce<WorkflowRun | undefined>(
      (newest, run) =>
        !newest || run.createdAt > newest.createdAt ? run : newest,
      undefined
    )
    if (!latest) return { steps: [] as RunStep[], isLive: false }

    const metadataSteps = latest.metadata?.steps
    const steps =
      latest.output?.steps ??
      (Array.isArray(metadataSteps) ? (metadataSteps as RunStep[]) : [])
    const isLive = latest.status === "QUEUED" || latest.status === "EXECUTING"

    return { steps, isLive }
  }, [ctx])
}
