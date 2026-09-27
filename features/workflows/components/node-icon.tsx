import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import {
  nodeRegistry,
  type NodeType,
} from "@/features/workflows/nodes/node-registry"

interface NodeIconProps {
  type: NodeType
  running?: boolean // show a spinner in the chip in place of the icon
  className?: string
}

// The accent-colored icon chip, mirroring the node on the canvas.
export function NodeIcon({ type, running, className }: NodeIconProps) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      {running ? (
        <Spinner className="size-3.5" />
      ) : (
        <Icon className="size-3.5" />
      )}
    </span>
  )
}
