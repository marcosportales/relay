"use client"

import prettyMs from "pretty-ms"

import { cn } from "@/lib/utils"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import {
  useWorkflowRuns,
  type WorkflowRun,
} from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// A step is identified by its run too: the same node appears in every run.
export type StepSelection = { runId: string; stepId: string }

interface StepRowProps {
  step: RunStep
  isLive: boolean
  selected: boolean
  onClick: () => void
}

// One step of a run: its node icon, title and how long it took.
function StepRow({ step, isLive, selected, onClick }: StepRowProps) {
  // A step left "running" by a run that has since ended shouldn't keep spinning.
  const isRunning = step.status === "running" && isLive
  const isFailed = step.status === "failed"
  const neverRan = step.status === "pending"

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      // Hover stays lighter than the selected fill, so a click on the hovered
      // row still visibly changes it.
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
        selected && "bg-accent text-accent-foreground hover:bg-accent",
        isFailed && "text-destructive hover:text-destructive",
        neverRan && "opacity-50"
      )}
    >
      <NodeIcon
        type={step.type}
        running={isRunning}
        className={cn(isFailed && "bg-destructive text-white")}
      />
      <span className="min-w-0 flex-1 truncate font-medium">{step.title}</span>
      {step.durationMs !== undefined && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {prettyMs(step.durationMs)}
        </span>
      )}
    </button>
  )
}

interface RunItemProps {
  run: WorkflowRun
  selection: StepSelection | null
  onSelect: (selection: StepSelection) => void
}

// A run's header followed by its steps.
function RunItem({ run, selection, onSelect }: RunItemProps) {
  return (
    <li className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 px-2 py-1 text-xs">
        <span className="shrink-0 font-semibold">
          {run.createdAt.toLocaleString()}
        </span>
        <span className="min-w-0 truncate font-mono text-muted-foreground">
          {run.id}
        </span>
        <span
          className={cn(
            "ml-auto shrink-0 text-muted-foreground lowercase",
            run.isFailed && "text-destructive"
          )}
        >
          {run.status}
        </span>
      </div>
      {run.steps.map((step) => (
        <StepRow
          key={step.id}
          step={step}
          isLive={run.isLive}
          selected={selection?.runId === run.id && selection.stepId === step.id}
          onClick={() => onSelect({ runId: run.id, stepId: step.id })}
        />
      ))}
    </li>
  )
}

interface LogsPanelProps {
  selection: StepSelection | null
  onSelect: (selection: StepSelection) => void
}

// Every run of the workflow, newest first, each followed by its steps.
export function LogsPanel({ selection, onSelect }: LogsPanelProps) {
  const runs = useWorkflowRuns()

  if (runs.length === 0) {
    return <p className="p-3 text-sm text-muted-foreground">No runs yet</p>
  }

  return (
    <ul className="flex flex-col gap-3 p-2">
      {runs.map((run) => (
        <RunItem
          key={run.id}
          run={run}
          selection={selection}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
