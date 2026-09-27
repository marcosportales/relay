"use client"

import { MonitorPlayIcon } from "lucide-react"
import prettyMs from "pretty-ms"

import { cn } from "@/lib/utils"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import {
  useWorkflowRuns,
  type WorkflowRun,
} from "@/features/workflows/components/workflow-runs-provider"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// What the console has selected: one step of a run, or a whole run's replay.
// A step is identified by its run too: the same node appears in every run.
export type ConsoleSelection =
  | { kind: "step"; runId: string; stepId: string }
  | { kind: "replay"; runId: string }

export function isSameSelection(a: ConsoleSelection, b: ConsoleSelection) {
  if (a.kind === "step" && b.kind === "step")
    return a.runId === b.runId && a.stepId === b.stepId
  return a.kind === b.kind && a.runId === b.runId
}

// Hover stays lighter than the selected fill, so a click on the hovered row
// still visibly changes it.
const rowClassName = (selected: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
    selected && "bg-accent text-accent-foreground hover:bg-accent"
  )

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
      className={cn(
        rowClassName(selected),
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

interface ReplayRowProps {
  selected: boolean
  onClick: () => void
}

// The run's browser recording, listed after its steps but standing for the
// whole run.
function ReplayRow({ selected, onClick }: ReplayRowProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={rowClassName(selected)}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
        <MonitorPlayIcon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">Replay</span>
    </button>
  )
}

interface RunItemProps {
  run: WorkflowRun
  selection: ConsoleSelection | null
  onSelect: (selection: ConsoleSelection) => void
}

// A run's header followed by its steps, and its replay once it has one.
function RunItem({ run, selection, onSelect }: RunItemProps) {
  const hasReplay = run.sessionId !== null && !run.isLive

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
          selected={
            selection?.kind === "step" &&
            selection.runId === run.id &&
            selection.stepId === step.id
          }
          onClick={() =>
            onSelect({ kind: "step", runId: run.id, stepId: step.id })
          }
        />
      ))}
      {hasReplay && (
        <ReplayRow
          selected={selection?.kind === "replay" && selection.runId === run.id}
          onClick={() => onSelect({ kind: "replay", runId: run.id })}
        />
      )}
    </li>
  )
}

interface LogsPanelProps {
  selection: ConsoleSelection | null
  onSelect: (selection: ConsoleSelection) => void
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
