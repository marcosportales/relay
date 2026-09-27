"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  InspectorPanel,
  type InspectorTarget,
} from "@/features/workflows/components/inspector-panel"
import {
  isSameSelection,
  LogsPanel,
  type ConsoleSelection,
} from "@/features/workflows/components/logs-panel"
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"

// The console under the canvas. Owns what's selected (a run step or a run's
// replay, one at a time), and shows it beside the logs.
export function ConsolePanel() {
  const [selection, setSelection] = useState<ConsoleSelection | null>(null)
  const runs = useWorkflowRuns()

  // Resolved from the live runs, so the inspector updates as the step does.
  const selectedRun = selection
    ? runs.find((run) => run.id === selection.runId)
    : undefined
  let target: InspectorTarget | undefined
  if (selection?.kind === "step") {
    const step = selectedRun?.steps.find((s) => s.id === selection.stepId)
    if (step) target = { kind: "step", step }
  } else if (selection?.kind === "replay" && selectedRun?.sessionId) {
    target = { kind: "replay", sessionId: selectedRun.sessionId }
  }

  // Clicking the selected row again clears the selection.
  const toggle = (next: ConsoleSelection) =>
    setSelection((current) =>
      current && isSameSelection(current, next) ? null : next
    )

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel
        id="console-logs"
        minSize="12rem"
        className="flex flex-col"
      >
        <div className="border-b border-border bg-card px-3 py-1.5 text-sm font-semibold">
          Logs
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LogsPanel selection={selection} onSelect={toggle} />
        </div>
      </ResizablePanel>
      {/* Mounted only while something is selected; stable ids let the group
          re-layout as the inspector comes and goes. */}
      {target && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="console-inspector"
            defaultSize="50%"
            minSize="12rem"
            className="flex"
          >
            <InspectorPanel target={target} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
