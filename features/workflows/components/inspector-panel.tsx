"use client"

import { NodeIcon } from "@/features/workflows/components/node-icon"
import type { RunStep } from "@/features/workflows/tasks/run-workflow"

// What to say when a step has no output or error to show.
function emptyNote(step: RunStep) {
  if (step.status === "pending") return "This step didn't run"
  if (step.status === "running") return "This step is still running"
  return "This step produced no output"
}

interface InspectorPanelProps {
  step: RunStep
}

// The selected step's result: its error if it failed, otherwise its output as
// formatted JSON, or a short note when there's neither.
export function InspectorPanel({ step }: InspectorPanelProps) {
  const hasOutput = step.output !== undefined && step.output !== null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-1.5 text-sm font-semibold">
        <NodeIcon
          type={step.type}
          className="size-5 rounded-sm [&_svg]:size-3"
        />
        <span className="truncate">{step.title}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {step.error ? (
          <pre className="font-mono text-xs whitespace-pre-wrap text-destructive">
            {step.error}
          </pre>
        ) : hasOutput ? (
          <pre className="font-mono text-xs">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyNote(step)}</p>
        )}
      </div>
    </div>
  )
}
