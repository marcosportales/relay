"use client"

import { MonitorPlayIcon } from "lucide-react"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import { SessionReplay } from "@/features/workflows/components/session-replay"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// What the inspector shows: a step's result, or a whole run's recording.
export type InspectorTarget =
  | { kind: "step"; step: RunStep }
  | { kind: "replay"; sessionId: string }

// What to say when a step has no output or error to show.
function emptyNote(step: RunStep) {
  if (step.status === "pending") return "This step didn't run"
  if (step.status === "running") return "This step is still running"
  return "This step produced no output"
}

interface StepResultProps {
  step: RunStep
}

// The step's error if it failed, otherwise its output as formatted JSON, or a
// short note when there's neither.
function StepResult({ step }: StepResultProps) {
  const hasOutput = step.output !== undefined && step.output !== null

  if (step.error)
    return (
      <pre className="font-mono text-xs whitespace-pre-wrap text-destructive">
        {step.error}
      </pre>
    )
  if (hasOutput)
    return (
      <pre className="font-mono text-xs">
        {JSON.stringify(step.output, null, 2)}
      </pre>
    )
  return <p className="text-sm text-muted-foreground">{emptyNote(step)}</p>
}

interface InspectorPanelProps {
  target: InspectorTarget
}

// The selected item in the console: a step's result, or the run's replay.
export function InspectorPanel({ target }: InspectorPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {target.kind === "step" ? (
          <>
            <NodeIcon
              type={target.step.type}
              className="size-5 rounded-sm [&_svg]:size-3"
            />
            <span className="truncate">{target.step.title}</span>
          </>
        ) : (
          <>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-muted">
              <MonitorPlayIcon className="size-3" />
            </span>
            <span className="truncate">Replay</span>
          </>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {target.kind === "step" ? (
          <StepResult step={target.step} />
        ) : (
          <SessionReplay sessionId={target.sessionId} />
        )}
      </div>
    </div>
  )
}
