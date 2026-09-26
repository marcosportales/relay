import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Canvas } from "@/features/workflows/components/canvas"
import { RightSide } from "@/features/workflows/components/right-side"

interface WorkflowShellProps {
  workflowId: string
}

export function WorkflowShell({ workflowId }: WorkflowShellProps) {
  return (
    <ResizablePanelGroup
      id={`workflow-shell-${workflowId}`}
      orientation="horizontal"
      className="size-full"
    >
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="18rem">
            <Canvas />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="8rem" minSize="6rem">
            <div className="flex size-full items-center justify-center">
              <span className="text-sm text-muted-foreground">Logs</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="16rem" minSize="14rem" maxSize="36rem">
        <RightSide />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
