"use client"

import { createContext, useContext, useMemo } from "react"
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks"

import type {
  RunStep,
  runWorkflowTask,
} from "@/features/workflows/tasks/run-workflow"

type RealtimeWorkflowRun = ReturnType<
  typeof useRealtimeRunsWithTag<typeof runWorkflowTask>
>["runs"][number]

// A realtime run plus its steps resolved from output or live metadata.
export type WorkflowRun = RealtimeWorkflowRun & {
  steps: RunStep[]
  isLive: boolean
  // Reached a final status. Trigger.dev's `isCompleted` leaves out cancelled
  // runs, so it can't be used on its own to tell whether a run is over.
  isFinished: boolean
  // Browserbase session to replay. Only read from the final output: the
  // recording isn't ready until the session closes, so a live or failed run
  // (no output) has none.
  sessionId: string | null
}

// A run's steps: the final output once it completes, otherwise the live
// metadata (a failed run throws and has no output, so metadata is all it has).
function getRunSteps(run: RealtimeWorkflowRun): RunStep[] {
  if (run.output?.steps) return run.output.steps
  const metadataSteps = run.metadata?.steps
  return Array.isArray(metadataSteps) ? (metadataSteps as RunStep[]) : []
}

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

  // Newest first.
  const workflowRuns = useMemo(
    () =>
      runs
        .map((run) => ({
          ...run,
          steps: getRunSteps(run),
          sessionId: run.output?.sessionId ?? null,
          isLive: run.status === "QUEUED" || run.status === "EXECUTING",
          isFinished: run.isCompleted || run.isCancelled,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [runs]
  )

  return (
    <WorkflowRunsContext.Provider value={workflowRuns}>
      {children}
    </WorkflowRunsContext.Provider>
  )
}

export function useWorkflowRuns() {
  const ctx = useContext(WorkflowRunsContext)
  if (!ctx)
    throw new Error("useWorkflowRuns must be used within WorkflowRunsProvider")
  return ctx
}

export function useLatestRunSteps() {
  const runs = useWorkflowRuns()
  const latest = runs[0]
  return { steps: latest?.steps ?? [], isLive: latest?.isLive ?? false }
}
