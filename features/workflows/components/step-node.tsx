import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"

import {
  nodeRegistry,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import { Spinner } from "@/components/ui/spinner"
import { useLatestRunSteps } from "@/features/workflows/components/workflow-runs-provider"
import { cn } from "@/lib/utils"

function StepNodeComponent({ id, data, selected }: NodeProps<StepNodeType>) {
  const { type, kind, title, values } = data
  const { steps, isLive } = useLatestRunSteps()
  const status = steps.find((step) => step.id === id)?.status
  // A step left "running" by a run that has since ended shouldn't keep spinning.
  const isRunning = status === "running" && isLive
  const isFailed = status === "failed"
  const def = nodeRegistry[type]
  const Icon = def.icon
  const fields = def.fields.filter((field) => values[field.key])

  // A trigger starts the flow and takes no input, so it has no target handle.
  const hasTarget = kind !== "trigger"

  return (
    <div
      className={cn(
        "max-w-80 min-w-50 rounded-(--radius) border-2 border-border bg-card text-card-foreground",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        isRunning && "border-blue-500",
        isFailed && "border-destructive"
      )}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ transform: "translate(-100%, -50%)" }}
          className="h-3.5! w-1.5! min-w-0! rounded-l-xs! rounded-r-none! border-0! bg-border!"
        />
      )}

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            def.accent
          )}
        >
          {isRunning ? <Spinner /> : <Icon className="size-4" />}
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>

      {fields.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t-2 border-border px-3 py-2.5">
          {fields.map((field) => (
            <div
              key={field.key}
              className="flex min-w-0 items-center justify-between gap-3"
            >
              <span className="shrink-0 text-xs text-muted-foreground">
                {field.label}
              </span>
              <span className="truncate text-xs font-medium">
                {values[field.key]}
              </span>
            </div>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ transform: "translate(100%, -50%)" }}
        className="h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! bg-border!"
      />
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
