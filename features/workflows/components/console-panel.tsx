"use client"

import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { InspectorPanel } from "@/features/workflows/components/inspector-panel"
import {
  LogsPanel,
  type StepSelection,
} from "@/features/workflows/components/logs-panel"
import { useWorkflowRuns } from "@/features/workflows/components/workflow-runs-provider"

// The console under the canvas. Owns which run step is selected, and shows that
// step's result beside the logs.
export function ConsolePanel() {
  const [selection, setSelection] = useState<StepSelection | null>(null)
  const runs = useWorkflowRuns()

  // Resolved from the live runs, so the inspector updates as the step does.
  const selectedStep = selection
    ? runs
        .find((run) => run.id === selection.runId)
        ?.steps.find((step) => step.id === selection.stepId)
    : undefined

  // Clicking the selected step again clears the selection.
  const toggle = (next: StepSelection) =>
    setSelection((current) =>
      current?.runId === next.runId && current.stepId === next.stepId
        ? null
        : next
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
      {/* Mounted only while a step is selected; stable ids let the group
          re-layout as the inspector comes and goes. */}
      {selectedStep && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="console-inspector"
            defaultSize="50%"
            minSize="12rem"
            className="flex"
          >
            <InspectorPanel step={selectedStep} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
